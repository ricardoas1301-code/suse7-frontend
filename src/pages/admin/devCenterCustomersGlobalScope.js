// =============================================================================
// Clientes Globais 360 S7 — escopo de API (Dev Center 4A.4 + 4A.5)
//
// DEFINITIVO (admin):
//   GET /api/dev-center/customers-global
//     → customers[] + summary (scope: admin_global)
//   GET /api/dev-center/customers-global/:id
//
// summary.admin_global (4A.5):
//   total_customers, incomplete_contact, ingestion_health, data_quality_overview
//   Métricas cross-seller via service role — sem JWT seller.
//
// GAP documentado (próxima fase):
//   - stale de clientes seller não calculado no agregado global
//   - qualidade global usa campos normalizados de s7_global_customers (sem endereço)
//   - drawer NÃO expõe saúde/confiança por cliente (sem dado confiável por linha)
// =============================================================================

export const DEV_CENTER_CUSTOMERS_GLOBAL_SCOPE = {
  listApi: "/api/dev-center/customers-global",
  detailApi: "/api/dev-center/customers-global/:id",
  summaryScope: "admin_global",
  opsMetricsTemporary: false,
  opsMetricsNote:
    "Indicadores operacionais via contrato admin global (summary.scope = admin_global). Agregado cross-seller; LGPD preservada.",
};
