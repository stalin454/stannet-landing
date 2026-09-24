// Cloudflare-side contract for Vocal Studio Phase 2.
// A real stem-separation model cannot run inside a standard Worker CPU budget.
// This endpoint intentionally stays disabled until an external GPU inference service is configured.
export async function onRequestPost(){return Response.json({ok:false,code:"SEPARATION_ENGINE_NOT_CONFIGURED",message:"Motor de separación aún no configurado."},{status:503});}