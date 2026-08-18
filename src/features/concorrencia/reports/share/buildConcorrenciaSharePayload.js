// ======================================================================
// Contrato ÚNICO de compartilhamento do Relatório de Concorrência.
// Deriva exclusivamente do contrato agregado — sem recálculo nem backend.
// ======================================================================

import { buildDistribuicaoPorContaFromDetalhes } from "./concorrenciaShareReportLayout.js";

/**
 * @param {import("./buildConcorrenciaAggregatedReport.js").ReturnType<typeof import("./buildConcorrenciaAggregatedReport.js").buildConcorrenciaAggregatedReport> | null | undefined} aggregated
 * @param {import("./buildConcorrenciaReportContext.js").ConcorrenciaReportContext | null | undefined} context
 */
export function buildConcorrenciaSharePayload(aggregated, context) {
  if (!aggregated || !context) return null;

  const detalhesProdutos = aggregated.detalhesProdutos ?? [];
  const distribuicaoPorConta = buildDistribuicaoPorContaFromDetalhes(detalhesProdutos);

  return {
    titulo: aggregated.titulo,
    subtitulo: aggregated.subtitulo,
    escopo: aggregated.escopo ?? context.reportScope ?? "filters",
    conta: {
      label: context.account.label,
      id: context.account.marketplaceAccountId,
    },
    filtroOperacional: {
      id: context.operationalFilter.id,
      label: context.operationalFilter.label,
    },
    busca: {
      query: context.search.query,
      hasQuery: context.search.hasQuery,
      label: context.search.hasQuery ? `Busca: "${context.search.query}"` : null,
    },
    quantidadeProdutos: {
      valor: aggregated.quantidadeProdutos,
      label: aggregated.quantidadeProdutosLabel,
    },
    distribuicaoPorConta,
    mostrarDistribuicao: distribuicaoPorConta.length > 1,
    resumoExecutivo: aggregated.resumoExecutivo,
    detalhesProdutos,
    _meta: {
      versao: aggregated.version ?? 1,
      geradoEm: aggregated.geradoEm ?? new Date().toISOString(),
    },
  };
}

/**
 * @param {ReturnType<typeof buildConcorrenciaSharePayload>} payload
 */
export function buildConcorrenciaReportTemplatePayload(payload) {
  if (!payload) {
    return {
      conta: "—",
      filtro: "—",
      produtos: "—",
      comConcorrentes: "—",
      totalConcorrentes: "—",
    };
  }

  const r = payload.resumoExecutivo;
  return {
    conta: payload.conta.label,
    filtro: payload.filtroOperacional.label,
    produtos: payload.quantidadeProdutos.label,
    comConcorrentes: r.comConcorrentes.label,
    totalConcorrentes: r.totalConcorrentesMonitorados.label,
  };
}

/**
 * @param {ReturnType<typeof buildConcorrenciaSharePayload>} payload
 */
export function buildConcorrenciaReportKey(payload) {
  if (!payload) return "concorrencia-report";
  const escopo = payload.escopo ?? "filters";
  const conta = payload.conta.id ?? payload.conta.label ?? "all";
  const filtro = payload.filtroOperacional.id ?? "all";
  const qtd = String(payload.quantidadeProdutos.valor ?? 0);
  return `conc_${escopo}_${conta}_${filtro}_${qtd}`.slice(0, 180);
}
