// =============================================================================
// Dev Center S_4.8.4 — Governança hardening (documentação viva)
// =============================================================================

/** @type {readonly { event: string; http: string; ux: string; fallback: string }[]} */
export const DEV_CENTER_GLOBAL_OPERATION_MATRIX = Object.freeze([
  { event: "401 sem JWT", http: "401 UNAUTHORIZED", ux: "Gate / redirect", fallback: "Sem dados admin" },
  { event: "403 seller", http: "403 FORBIDDEN", ux: "Redirect /", fallback: "Cache limpo" },
  { event: "404 detail", http: "404 NOT_FOUND", ux: "Empty state drawer", fallback: "Mensagem neutra" },
  { event: "500 listagem", http: "500 DB_ERROR", ux: "Erro módulo + retry implícito (busca)", fallback: "Tabela vazia" },
  { event: "Summary falha", http: "200 + summary fallback", ux: "Stats degradados", fallback: "listed_customers only" },
  { event: "Cache hit + rede fail", http: "—", ux: "Última versão + aviso stale", fallback: "Contrato cache" },
  { event: "Drawer swap rápido", http: "1 req/id", ux: "cancelled flag", fallback: "Sem setState pós-unmount" },
  { event: "q inválida/gigante", http: "200 (q normalizada)", ux: "Busca truncada", fallback: "Lista filtrada" },
]);

export const DEV_CENTER_GLOBAL_INPUT_LIMITS = Object.freeze({
  searchMaxLen: 120,
  customerIdMaxLen: 36,
  customerIdPattern: "UUID v4",
  listDbLimit: 500,
  listResponseCap: 200,
  cacheTtlMs: 90_000,
  cacheMaxEntries: 8,
});
