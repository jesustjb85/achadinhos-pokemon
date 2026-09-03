// Serverless Function (Vercel) — recebe 1 evento de analytics do site e salva
// como um arquivinho JSON no Vercel Blob (não é banco de dados, é só
// armazenamento de arquivo: 1 evento = 1 arquivo em events/...).
//
// Precisa de um Blob Store criado no projeto da Vercel (aba Storage) —
// sem isso, a Vercel não injeta o token e esta função sempre falha.
// Veja o passo a passo no README ("Rastreamento (analytics)").

const { put } = require("@vercel/blob");
const { randomUUID } = require("node:crypto");

// Tipos de evento aceitos — qualquer outro valor é rejeitado, pra não vazar
// lixo/spam pro Blob Store.
const ALLOWED_TYPES = new Set(["pageview", "scroll", "click", "time"]);

function clip(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const body = req.body || {};
  const type = clip(body.type, 20);
  const sessionId = clip(body.sessionId, 80);

  if (!ALLOWED_TYPES.has(type) || !sessionId) {
    res.status(400).json({ error: "invalid event" });
    return;
  }

  const event = {
    type,
    sessionId,
    path: clip(body.path, 200),
    // "value" carrega o dado específico do evento:
    // scroll -> milestone (25/50/75/100), click -> local do botão,
    // time -> segundos acumulados de página visível.
    value:
      typeof body.value === "number" || typeof body.value === "string"
        ? body.value
        : null,
    utmSource: clip(body.utmSource, 60),
    utmMedium: clip(body.utmMedium, 60),
    utmCampaign: clip(body.utmCampaign, 60),
    ts: Date.now(),
  };

  try {
    const pathname = `events/${event.ts}-${randomUUID()}.json`;
    await put(pathname, JSON.stringify(event), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    res.status(204).end();
  } catch (err) {
    console.error("track failed", err);
    res.status(500).json({ error: "failed" });
  }
};
