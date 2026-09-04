#!/usr/bin/env node
// =====================================================================
// Envia uma lista de telefones (CSV) como eventos offline pro Meta Pixel
// via API de Conversões — o mesmo destino do upload de "Conjunto de
// Eventos Offline" no Gerenciador de Eventos, só que sem passar pela
// telinha "Conectar dados" (que em contas novas só libera "App"/"Web").
//
// Cada telefone vira um evento (padrão: CompleteRegistration) associado
// à data em que a pessoa entrou no grupo, pra Meta tentar casar com quem
// viu/clicou o anúncio antes disso e atribuir a conversão retroativamente.
//
// NADA sai da sua máquina além da chamada HTTPS pra api.facebook.com —
// não existe passo aqui que manda o CSV ou o token pra qualquer outro
// lugar.
//
// -----------------------------------------------------------------
// COMO USAR
// -----------------------------------------------------------------
// 1) Gere um token de acesso da API de Conversões:
//    Gerenciador de Eventos → clique no dataset "pokemon" → Configurações
//    → seção "API de Conversões" → "Gerar token de acesso". Copie o token
//    (começa com uma string longa tipo "EAAxxxxx...").
//
//    NÃO cole esse token no chat — é uma credencial (diferente do ID do
//    pixel). Trate como senha.
//
// 2) Prepare o CSV (salve em tools/membros.csv, por exemplo — esse nome
//    já está no .gitignore, não vai pro git). Formato esperado, com
//    cabeçalho na primeira linha:
//
//      phone,date
//      11999999999,2026-08-15
//      21988887777,2026-08-20
//
//    A coluna "date" é opcional (mas recomendada — sem ela, todo mundo
//    vira evento de "agora", perdendo a atribuição precisa pro clique
//    de quando a pessoa realmente entrou). Se só tiver telefone, deixe
//    uma coluna só, sem cabeçalho "date".
//
// 3) Rode (Windows PowerShell):
//      $env:META_ACCESS_TOKEN = "seu-token-aqui"
//      node tools/meta-offline-events.js tools/membros.csv
//
//    Ou Git Bash:
//      META_ACCESS_TOKEN="seu-token-aqui" node tools/meta-offline-events.js tools/membros.csv
//
// 4) Pra TESTAR antes de mandar de verdade (recomendado): pegue o
//    "Código de teste de evento" em Gerenciador de Eventos → dataset →
//    aba "Eventos de teste", e rode com META_TEST_EVENT_CODE=TESTxxxxx.
//    Os eventos aparecem ali na hora, sem contar como evento real, pra
//    você conferir antes de rodar sem o código de teste.
// =====================================================================

const fs = require("fs");
const crypto = require("crypto");

const PIXEL_ID = process.env.META_PIXEL_ID || "2276185082785454";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
const EVENT_NAME = process.env.META_EVENT_NAME || "CompleteRegistration";
const DEFAULT_COUNTRY_CODE = "55"; // Brasil
const BATCH_SIZE = 500;
const GRAPH_VERSION = "v21.0";

const csvPath = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error(
    "Faltou o token. Defina META_ACCESS_TOKEN antes de rodar (veja o comentário no topo deste arquivo)."
  );
  process.exit(1);
}

if (!csvPath) {
  console.error("Uso: node tools/meta-offline-events.js caminho/para/membros.csv");
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

function normalizePhone(raw) {
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  // Remove zero(s) à esquerda (alguns exports vêm com tronco "0" antes do DDD).
  digits = digits.replace(/^0+/, "");

  // Já tem código do país (55 + DDD de 2 dígitos + 8 ou 9 dígitos = 12 ou 13).
  const looksInternational =
    digits.startsWith(DEFAULT_COUNTRY_CODE) && (digits.length === 12 || digits.length === 13);

  if (!looksInternational && (digits.length === 10 || digits.length === 11)) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  if (digits.length < 12 || digits.length > 13) {
    return { invalid: true, digits };
  }

  return { e164: "+" + digits, digits };
}

function toUnixSeconds(dateStr) {
  if (!dateStr) return null;
  const t = Date.parse(dateStr.trim());
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 1000);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstCols = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const hasHeader = firstCols.some((c) => c === "phone" || c === "telefone" || c === "date" || c === "data");

  let phoneIdx = 0;
  let dateIdx = -1;
  let dataLines = lines;

  if (hasHeader) {
    phoneIdx = firstCols.findIndex((c) => c === "phone" || c === "telefone");
    if (phoneIdx === -1) phoneIdx = 0;
    dateIdx = firstCols.findIndex((c) => c === "date" || c === "data" || c === "event_time");
    dataLines = lines.slice(1);
  }

  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      phoneRaw: cols[phoneIdx] || "",
      dateRaw: dateIdx >= 0 ? cols[dateIdx] || "" : "",
    };
  });
}

async function sendBatch(events) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`;
  const body = {
    data: events,
    access_token: ACCESS_TOKEN,
  };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);

  console.log(`Lidas ${rows.length} linhas de ${csvPath}.`);
  if (TEST_EVENT_CODE) {
    console.log(`Modo TESTE ativado (test_event_code=${TEST_EVENT_CODE}) — nada conta como evento real ainda.`);
  }

  const events = [];
  let invalidCount = 0;
  let noDateCount = 0;
  const fallbackNow = Math.floor(Date.now() / 1000);

  for (const row of rows) {
    const phone = normalizePhone(row.phoneRaw);
    if (!phone || phone.invalid) {
      invalidCount++;
      continue;
    }

    let eventTime = toUnixSeconds(row.dateRaw);
    if (!eventTime) {
      noDateCount++;
      eventTime = fallbackNow;
    }

    events.push({
      event_name: EVENT_NAME,
      event_time: eventTime,
      action_source: "other",
      user_data: {
        ph: [sha256(phone.digits)],
      },
    });
  }

  if (invalidCount > 0) {
    console.warn(`Aviso: ${invalidCount} linha(s) com telefone que não bateu no formato esperado — puladas.`);
  }
  if (noDateCount > 0) {
    console.warn(
      `Aviso: ${noDateCount} linha(s) sem data válida — mandadas com event_time = agora (atribuição mais fraca).`
    );
  }

  if (events.length === 0) {
    console.error("Nenhum evento válido pra enviar. Confira o CSV.");
    process.exit(1);
  }

  console.log(`Enviando ${events.length} evento(s) do tipo "${EVENT_NAME}" em lotes de ${BATCH_SIZE}...`);

  let totalReceived = 0;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    try {
      const result = await sendBatch(batch);
      const received = result.events_received || 0;
      totalReceived += received;
      console.log(
        `Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${received}/${batch.length} recebidos pela Meta. fbtrace_id=${result.fbtrace_id || "-"}`
      );
    } catch (err) {
      console.error(`Lote ${Math.floor(i / BATCH_SIZE) + 1} falhou:`, err.message);
    }
  }

  console.log(`\nConcluído: ${totalReceived}/${events.length} eventos recebidos pela Meta.`);
  if (!TEST_EVENT_CODE) {
    console.log(
      "Confira em Gerenciador de Eventos → dataset pokemon → Conjuntos de dados / Visão geral (pode levar alguns minutos a horas pra aparecer)."
    );
  } else {
    console.log("Confira na aba \"Eventos de teste\" do Gerenciador de Eventos — deve aparecer na hora.");
  }
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
