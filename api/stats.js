// Serverless Function (Vercel) — lê todos os eventos salvos no Blob Store
// (events/*.json, gravados por api/track.js) e devolve um resumo agregado
// em JSON. Consumida pela página stats.html.
//
// Protegida por uma chave simples via query string (?key=...), comparada
// com a variável de ambiente STATS_KEY (defina em Vercel → Settings →
// Environment Variables). Sem essa variável configurada, o endpoint fica
// bloqueado por padrão — de propósito, pra não expor os dados à toa.

const { list } = require("@vercel/blob");

// Trava de segurança: acima disso só processa os eventos mais recentes,
// pra função não ficar lenta/demorada com o tempo. Se o site crescer muito,
// dá pra evoluir isso depois (ex: agregação incremental).
const MAX_EVENTS = 5000;

function median(nums) {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function summarize(events) {
  const sessions = new Set();
  const pageviews = [];
  const clicksByLocation = {};
  const scrollByMilestone = { 25: 0, 50: 0, 75: 0, 100: 0 };
  const seenScrollPerSession = new Set();
  const timePerSession = new Map();
  const byDay = {};
  const byUtmSource = {};

  for (const ev of events) {
    if (!ev || !ev.sessionId) continue;
    sessions.add(ev.sessionId);

    if (ev.type === "pageview") {
      pageviews.push(ev);
      const day = new Date(ev.ts).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      const source = ev.utmSource || "direto";
      byUtmSource[source] = (byUtmSource[source] || 0) + 1;
    }

    if (ev.type === "click") {
      const loc = String(ev.value || "desconhecido");
      clicksByLocation[loc] = (clicksByLocation[loc] || 0) + 1;
    }

    if (ev.type === "scroll") {
      const milestone = Number(ev.value);
      const key = `${ev.sessionId}:${milestone}`;
      if (
        [25, 50, 75, 100].includes(milestone) &&
        !seenScrollPerSession.has(key)
      ) {
        seenScrollPerSession.add(key);
        scrollByMilestone[milestone] += 1;
      }
    }

    if (ev.type === "time") {
      const seconds = Number(ev.value) || 0;
      const current = timePerSession.get(ev.sessionId) || 0;
      if (seconds > current) timePerSession.set(ev.sessionId, seconds);
    }
  }

  const timeValues = [...timePerSession.values()];
  const totalClicks = Object.values(clicksByLocation).reduce(
    (a, b) => a + b,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    totalEventsProcessed: events.length,
    uniqueSessions: sessions.size,
    totalPageviews: pageviews.length,
    totalClicks,
    clickThroughRate: sessions.size
      ? Number(((totalClicks / sessions.size) * 100).toFixed(1))
      : 0,
    clicksByLocation,
    scrollByMilestone,
    avgTimeOnPageSeconds: timeValues.length
      ? Math.round(timeValues.reduce((a, b) => a + b, 0) / timeValues.length)
      : 0,
    medianTimeOnPageSeconds: Math.round(median(timeValues)),
    sessionsWithTimeData: timeValues.length,
    byDay,
    byUtmSource,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const key = req.query.key;
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    let cursor;
    const blobs = [];
    do {
      const page = await list({ prefix: "events/", cursor, limit: 1000 });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    // pathname é "events/<timestamp>-<uuid>.json" — ordenar por pathname
    // desc equivale a ordenar por mais recente primeiro.
    blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const latest = blobs.slice(0, MAX_EVENTS);

    const events = await Promise.all(
      latest.map(async (b) => {
        try {
          const r = await fetch(b.url);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );

    res.status(200).json(summarize(events.filter(Boolean)));
  } catch (err) {
    console.error("stats failed", err);
    res.status(500).json({ error: "failed" });
  }
};
