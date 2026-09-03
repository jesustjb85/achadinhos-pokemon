// =====================================================================
// TROQUE AQUI: cole o link de convite do seu grupo/comunidade do WhatsApp.
// Todos os botões da página (hero, teaser, final e o flutuante) usam
// automaticamente este mesmo link.
// =====================================================================
const WHATSAPP_LINK = "https://chat.whatsapp.com/FS9hD7e0HgJIDMZh2pSjgH";

// Prova social opcional: preencha com o número real de membros do grupo
// (ex: "12.500") para exibir o selo "X membros" ao lado do CTA.
// Deixe em branco ("") para manter o selo oculto — nunca invente um número.
const MEMBER_COUNT = "";

document.querySelectorAll(".whatsapp-link").forEach((el) => {
  el.setAttribute("href", WHATSAPP_LINK);
});

if (MEMBER_COUNT) {
  const pill = document.getElementById("member-pill");
  const count = document.getElementById("member-count");
  if (pill && count) {
    count.textContent = MEMBER_COUNT;
    pill.hidden = false;
  }
}

// =====================================================================
// Contador da próxima leva de cupons: mostra o tempo real até o horário
// abaixo (hoje, ou amanhã se esse horário já passou). Ajuste para o
// horário VERDADEIRO em que vocês soltam cupons novos no grupo — um
// contador que não bate com a realidade queima a credibilidade da página.
// =====================================================================
const NEXT_DROP_HOUR = 20; // 20 = 20h (8 da noite), formato 24h
const NEXT_DROP_MINUTE = 0;

function getNextDropDate() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(NEXT_DROP_HOUR, NEXT_DROP_MINUTE, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function updateCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;
  const diff = getNextDropDate() - new Date();
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  el.textContent = `${h}:${m}:${s}`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// =====================================================================
// Promoção "grupo VIP liberado grátis": SEM janela fixa de calendário.
// A contagem começa do zero pra cada pessoa que abre a página (reseta a
// cada visita) e dura PROMO_DURATION_MINUTES — quem controla o tempo real
// que a promoção fica no ar é você, pelas contas de anúncio (pausando o
// tráfego quando quiser) e/ou pelo PROMO_ACTIVE abaixo.
//
// PROMO_ACTIVE = interruptor manual. Mude pra false e suba (git push) pra
// desligar o aviso na hora pra todo mundo, mesmo quem já estava com o
// timer rodando — use isso se decidir tirar do ar antes das 5h, mesmo que
// seja com só 1h.
//
// PROMO_DURATION_MINUTES = duração do timer que cada visitante vê a partir
// do momento que entra no site. Use um número quebrado (não redondo) pra
// parecer mais real — ex: 67 em vez de 60, 83 em vez de 90.
// =====================================================================
const PROMO_ACTIVE = true;
const PROMO_ORIGINAL_PRICE = "R$ 299,90";
const PROMO_DURATION_MINUTES = 67;

const promoDeadline = new Date(Date.now() + PROMO_DURATION_MINUTES * 60000);
let promoInterval;

function updatePromoBanner() {
  const banner = document.getElementById("promo-banner");
  const timer = document.getElementById("promo-countdown");
  const priceEl = document.getElementById("promo-price");
  if (!banner || !timer) return;
  if (priceEl) priceEl.textContent = PROMO_ORIGINAL_PRICE;

  const diff = promoDeadline - new Date();
  if (!PROMO_ACTIVE || diff <= 0) {
    banner.hidden = true;
    clearInterval(promoInterval);
    return;
  }
  banner.hidden = false;

  const totalSeconds = Math.floor(diff / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  timer.textContent = `${h}:${m}:${s}`;
}

updatePromoBanner();
promoInterval = setInterval(updatePromoBanner, 1000);
