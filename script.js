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
