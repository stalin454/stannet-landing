export const radioSchedule = [
  { time: "08:00", type: "CYBER", title: "Cybersecurity Daily", description: "Boletín de seguridad, vulnerabilidades y contexto defensivo." },
  { time: "10:00", type: "AI", title: "AI Update", description: "Novedades relevantes de inteligencia artificial y herramientas." },
  { time: "13:00", type: "DEV", title: "Programming Sessions", description: "Conceptos breves de programación, Linux y desarrollo web." },
  { time: "18:00", type: "MUSIC", title: "StanNet Electronic", description: "Música propia, sesiones y catálogo autorizado." }
];

export function radioStatus(env = {}) {
  const streamUrl = typeof env.RADIO_STREAM_URL === "string" ? env.RADIO_STREAM_URL.trim() : "";
  const safeStream = /^https:\/\//i.test(streamUrl) ? streamUrl : "";
  return {
    station: "StanNet Radio",
    tagline: "Music · Tech · Cyber · AI",
    stage: 1,
    live: Boolean(safeStream),
    streamUrl: safeStream,
    now: {
      title: safeStream ? "StanNet Radio Live" : "StanNet Radio",
      meta: safeStream ? "Live stream" : "Stage 1 · Cloudflare-ready"
    },
    schedule: radioSchedule
  };
}
