// =====================================================================
// TROQUE AQUI: cole o link de convite do seu grupo/comunidade do WhatsApp.
// Todos os botões da página (hero, teaser, final e o flutuante) usam
// automaticamente este mesmo link.
// =====================================================================
const WHATSAPP_LINK = "https://chat.whatsapp.com/SEU_LINK_AQUI";

document.querySelectorAll(".whatsapp-link").forEach((el) => {
  el.setAttribute("href", WHATSAPP_LINK);
});
