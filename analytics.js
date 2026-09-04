// =====================================================================
// Analytics próprio (sem serviço de terceiro): manda eventos de pageview,
// scroll, clique nos botões do WhatsApp e tempo de página pra
// /api/track, que salva no Vercel Blob. Veja os números agregados em
// stats.html (precisa da chave configurada em STATS_KEY na Vercel).
//
// Não guarda nome, telefone, IP nem nada que identifique a pessoa — só
// um sessionId aleatório (novo a cada aba/visita) pra conseguir agrupar
// os eventos de uma mesma visita.
// =====================================================================

(function () {
  function getSessionId() {
    try {
      let id = sessionStorage.getItem("ap_session_id");
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem("ap_session_id", id);
      }
      return id;
    } catch {
      // sessionStorage bloqueado (modo privado restrito, etc.) — usa um id
      // só pra essa carga de página.
      return crypto.randomUUID();
    }
  }

  const sessionId = getSessionId();
  const params = new URLSearchParams(location.search);
  const utm = {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
  };

  function send(type, value) {
    const payload = JSON.stringify({
      type,
      sessionId,
      path: location.pathname,
      value,
      ...utm,
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
        return;
      }
    } catch {
      // segue pro fallback abaixo
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }

  // Meta Pixel: dispara junto com o analytics próprio, sem duplicar a
  // lógica de "quando" disparar. O PageView do pixel já sai sozinho no
  // <head> (index.html) — aqui só os eventos de scroll e clique.
  function fbTrack(...args) {
    if (typeof window.fbq === "function") window.fbq(...args);
  }

  // ---- Pageview ----
  send("pageview");

  // ---- Scroll: dispara uma vez por marco (25/50/75/100%) por visita ----
  const milestones = [25, 50, 75, 100];
  const reached = new Set();

  function checkScroll() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct =
      scrollable > 0
        ? Math.min(100, Math.round((window.scrollY / scrollable) * 100))
        : 100;

    for (const m of milestones) {
      if (pct >= m && !reached.has(m)) {
        reached.add(m);
        send("scroll", m);
        fbTrack("trackCustom", "ScrollDepth", { percent: m });
      }
    }

    if (reached.size === milestones.length) {
      window.removeEventListener("scroll", onScroll);
    }
  }

  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      checkScroll();
      scrollTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  checkScroll(); // cobre o caso de a página já abrir "rolada" (raro, mas custa nada)

  // ---- Cliques nos botões do WhatsApp ----
  // Cada botão tem um data-loc no HTML (hero, teaser, final, floating)
  // pra saber qual deles converte mais.
  document.querySelectorAll(".whatsapp-link").forEach((el) => {
    el.addEventListener("click", () => {
      const loc = el.dataset.loc || "desconhecido";
      send("click", loc);
      // "Contact" é o evento padrão da Meta pra início de contato via
      // WhatsApp/telefone/chat — usável pra otimização de entrega e
      // público semelhante (quem clica) dentro do Gerenciador de Anúncios.
      fbTrack("track", "Contact", { content_name: loc });
    });
  });

  // ---- Tempo de página visível ----
  // Só conta o tempo em que a aba está de fato em foco/visível (não conta
  // tempo com a aba em segundo plano). Manda o total acumulado sempre que
  // a aba fica oculta ou a página é fechada, usando sendBeacon pra garantir
  // a entrega mesmo no fechamento.
  let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
  let accumulatedMs = 0;

  function flushTime() {
    if (visibleSince) {
      accumulatedMs += Date.now() - visibleSince;
      visibleSince = null;
    }
    if (accumulatedMs > 0) {
      send("time", Math.round(accumulatedMs / 1000));
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushTime();
    } else {
      visibleSince = Date.now();
    }
  });

  window.addEventListener("pagehide", flushTime);
})();
