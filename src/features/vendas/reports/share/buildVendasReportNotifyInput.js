// ======================================================================
// Helpers de template/chave para envio manual do Relatório de Vendas.
// ======================================================================

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 */
export function buildVendasReportTemplatePayload(payload) {
  if (!payload) {
    return {
      periodo: "—",
      conta: "—",
      vendas: "—",
      faturamento: "—",
      lucro: "—",
      margem: "—",
    };
  }

  const r = payload.resumoExecutivo;
  return {
    periodo: payload.periodo.label,
    conta: payload.contas.label,
    vendas: payload.quantidadeVendas.label,
    faturamento: r.faturamento.display,
    lucro: r.lucroLiquido.display,
    margem: r.margem.display,
  };
}

/**
 * Chave estável para idempotência/correlação no motor central.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 */
export function buildVendasReportKey(payload) {
  if (!payload) return "vendas-report";
  const ini = payload.periodo.dataInicial ?? "na";
  const fim = payload.periodo.dataFinal ?? "na";
  const escopo = payload.escopo ?? "filters";
  const contas = payload.contas.lista.map((c) => c.id ?? c.label).join("|") || "all";
  return `${ini}_${fim}_${escopo}_${contas}`.slice(0, 180);
}
