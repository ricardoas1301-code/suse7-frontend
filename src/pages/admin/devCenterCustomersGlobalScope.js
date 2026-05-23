// =============================================================================
// Clientes Globais 360 S7 — contrato oficial admin (S_4.6.1)
//
// CONTRATO OFICIAL (Dev Center admin global):
//   GET /api/dev-center/customers-global
//     → { customers[], summary } — summary.scope = "admin_global"
//   GET /api/dev-center/customers-global/:id
//     → { customer } — detalhe mascarado (LGPD)
//
// FORA DO ESCOPO desta tela (domínio seller — Clientes360.jsx):
//   GET /api/customers
//   GET /api/customers/:id
//
// summary.admin_global:
//   total_customers, listed_customers, incomplete_contact,
//   ingestion_health, data_quality_overview
//
// GAP documentado (fases futuras):
//   - stale seller não calculado no agregado global
//   - qualidade global sem dimensão endereço (s7_global_customers)
//   - drawer sem saúde/confiança por cliente (sem dado confiável por linha)
// =============================================================================

export const DEV_CENTER_CUSTOMERS_GLOBAL_SCOPE = {
  officialApis: {
    list: "/api/dev-center/customers-global",
    detail: "/api/dev-center/customers-global/:id",
  },
  outOfScopeApis: ["/api/customers", "/api/customers/:id"],
  summaryScope: "admin_global",
  scopeNote:
    "Contrato admin global (summary.scope = admin_global). Agregado cross-seller; LGPD preservada. Sem dependência do contrato seller.",
};
