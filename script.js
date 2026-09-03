// =====================================================================
// TROQUE AQUI: cole o link de convite do seu grupo/comunidade do WhatsApp.
// Todos os botões da página (hero, teaser, final e o flutuante) usam
// automaticamente este mesmo link.
// =====================================================================
const WHATSAPP_LINK = "https://chat.whatsapp.com/Ig0cFWFOVo21d1OwZ0HrGI?s=cl&p=i&mlu=4&ilr=4";

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
