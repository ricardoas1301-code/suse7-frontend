// ======================================================================
// Contrato ÚNICO de compartilhamento do Relatório de Vendas (P_2.8.12F.A).
//
// Fonte de verdade única consumida por TODOS os canais (Copiar, WhatsApp,
// E-mail, PDF, Excel). Cada canal apenas renderiza este payload no formato
// que precisa — nenhum canal monta o próprio conteúdo a partir do zero.
//
// PRINCÍPIOS
// - Deriva EXCLUSIVAMENTE do contrato agregado já existente
//   (buildVendasAggregatedReport). Não recalcula nada, não chama backend.
// - Mantém os valores crus (strings decimais) e adiciona apenas a versão
//   de exibição (pt-BR) usando os formatadores oficiais do Raio-X.
// - Preparado para múltiplas contas/CNPJs (campos em lista).
// ======================================================================

import {
  formatBrlApi,
  formatPercentDetailLabel,
  DASH,
} from "../../../../components/sales/saleRayxFormat.js";
import Decimal from "decimal.js";
import { buildVendasExecutiveSummarySchema } from "./executiveSummarySchema.js";

/**
 * @param {number | string | null | undefined} value
 * @returns {number}
 */
function toCount(value) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {number} count
 * @returns {string} ex.: "163 vendas" · "1 venda"
 */
function vendasCountLabel(count) {
  const n = toCount(count);
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "venda" : "vendas"}`;
}

function parseDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    return new Decimal(String(raw).replace(",", "."));
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} costRaw
 * @param {string | null | undefined} grossRaw
 */
function formatCostSharePercent(costRaw, grossRaw) {
  const gross = parseDecimal(grossRaw);
  const cost = parseDecimal(costRaw);
  if (gross == null || cost == null || gross.eq(0)) return "0,00%";
  const pct = cost.abs().div(gross.abs()).mul(100);
  return `${pct.toNumber().toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {string | null | undefined} raw
 */
function formatMoneyOrZero(raw) {
  if (raw == null || String(raw).trim() === "") return "R$ 0,00";
  return formatBrlApi(raw);
}

/**
 * @param {string} id
 * @param {string} label
 * @param {string | null | undefined} raw
 * @param {string | null | undefined} grossRaw
 */
function buildCostEntry(id, label, raw, grossRaw) {
  return {
    id,
    label,
    raw: raw ?? null,
    display: formatMoneyOrZero(raw),
    sharePercent: formatCostSharePercent(raw, grossRaw),
  };
}

/**
 * @typedef {{
 *   titulo: string;
 *   escopo: "filters" | "selected";
 *   periodo: { label: string; dataInicial: string | null; dataFinal: string | null };
 *   contas: { lista: { id: string | null; label: string }[]; label: string };
 *   quantidadeVendas: { valor: number; label: string };
 *   filtrosAtivos: string[];
 *   cabecalhoExecutivo: {
 *     periodo: string;
 *     contas: string;
 *     vendas: string;
 *     filtros: string;
 *   };
 *   distribuicaoPorConta: {
 *     contaId: string | null;
 *     conta: string;
 *     quantidadeVendas: number;
 *     quantidadeLabel: string;
 *   }[];
 *   mostrarDistribuicao: boolean;
 *   resumoExecutivo: {
 *     faturamento: { raw: string | null; display: string };
 *     lucroLiquido: { raw: string | null; display: string };
 *     margem: { raw: string | null; display: string };
 *     pedidos: { valor: number; label: string };
 *     ticketMedio: { raw: string | null; display: string };
 *     repasseMarketplace: { raw: string | null; display: string };
 *     margemCritica: { valor: number; label: string };
 *     prejuizo: { valor: number; label: string };
 *     saudaveis: { valor: number; label: string } | null;
 *     custos: {
 *       id: string;
 *       label: string;
 *       raw: string | null;
 *       display: string;
 *       sharePercent: string;
 *     }[];
 *   };
 *   resumoExecutivoSchema: Record<string, unknown> | null;
 *   vendasDetalhe: readonly Record<string, unknown>[];
 *   listagemTotal: number;
 *   vendasListaQuery: {
 *     periodPreset: string;
 *     startDate: string;
 *     endDate: string;
 *     marketplace: string;
 *     marketplaceAccountId: string;
 *     listFilterId: string;
 *     searchQuery: string;
 *   } | null;
 *   _meta: {
 *     versao: number | null;
 *     fonteResumo: string | null;
 *     analiseLimitada: boolean;
 *     geradoEm: string | null;
 *   };
 * }} VendasSharePayload
 */

/**
 * Gera o payload único de compartilhamento a partir do contrato agregado.
 *
 * @param {import("../buildVendasAggregatedReport.js").VendasAggregatedReport | null | undefined} report
 * @param {import("../buildVendasReportContext.js").VendasReportContext | null | undefined} [reportContext]
 * @returns {VendasSharePayload | null}
 */
export function buildVendasSharePayload(report, reportContext = null) {
  if (!report || typeof report !== "object") return null;

  const resumo = report.resumoExecutivo ?? {};
  const periodo = report.periodo ?? {};
  const filtros = report.filtros ?? {};
  const contasRaw = Array.isArray(filtros.contas) ? filtros.contas : [];
  const distRaw = Array.isArray(report.distribuicaoPorConta) ? report.distribuicaoPorConta : [];

  const quantidadeVendas = toCount(resumo.quantidadeVendas);

  const distribuicaoPorConta = distRaw.map((c) => {
    const qtd = toCount(c?.quantidadeVendas);
    return {
      contaId: c?.contaId ?? null,
      conta: String(c?.conta ?? "Conta não definida"),
      quantidadeVendas: qtd,
      quantidadeLabel: vendasCountLabel(qtd),
    };
  });

  const contas = contasRaw.map((c) => ({
    id: c?.id ?? null,
    label: String(c?.label ?? "—"),
  }));

  const escopo = report.escopo === "selected" ? "selected" : "filters";
  const vendasDetalhe = Array.isArray(report.vendas) ? report.vendas : [];
  const margemDisplay = formatPercentDetailLabel(resumo.margemPercentual);
  const faturamentoRaw = resumo.faturamentoBruto ?? null;
  const custosResumo =
    resumo?.custos && typeof resumo.custos === "object"
      ? /** @type {Record<string, string | null | undefined>} */ (resumo.custos)
      : {};
  const contaId = contas.length === 1 && contas[0]?.id ? String(contas[0].id) : "";
  const filtrosAtivos = [
    escopo === "selected" ? `${quantidadeVendas.toLocaleString("pt-BR")} vendas selecionadas` : null,
    escopo !== "selected" && reportContext?.operationalFilter?.id !== "all"
      ? String(reportContext.operationalFilter.label ?? "")
      : null,
    escopo !== "selected" && reportContext?.search?.hasQuery
      ? `Busca: "${String(reportContext.search.query ?? "")}"`
      : null,
    reportContext?.sales?.truncatedScan ? "Análise limitada por volume" : null,
  ].filter(Boolean);

  /** @type {VendasSharePayload} */
  const basePayload = {
    titulo: "Relatório de Vendas",
    escopo,
    periodo: {
      label: String(periodo.label ?? "Período"),
      dataInicial: periodo.dataInicial ?? null,
      dataFinal: periodo.dataFinal ?? null,
    },
    contas: {
      lista: contas,
      label: contas.length ? contas.map((c) => c.label).join(", ") : "Todas as contas",
    },
    quantidadeVendas: {
      valor: quantidadeVendas,
      label: quantidadeVendas.toLocaleString("pt-BR"),
    },
    filtrosAtivos,
    cabecalhoExecutivo: {
      periodo: String(periodo.label ?? "Período"),
      contas: contas.length ? contas.map((c) => c.label).join(", ") : "Todas as contas",
      vendas: vendasCountLabel(quantidadeVendas),
      filtros:
        filtrosAtivos.length > 0
          ? filtrosAtivos.join(" · ")
          : "Nenhum filtro operacional ou busca adicional",
    },
    distribuicaoPorConta,
    // Mesma regra de exibição do modal (P_2.8.12E): só faz sentido com 2+ contas.
    mostrarDistribuicao: distribuicaoPorConta.length > 1,
    resumoExecutivo: {
      faturamento: {
        raw: faturamentoRaw,
        display: formatBrlApi(faturamentoRaw),
      },
      lucroLiquido: {
        raw: resumo.lucroLiquido ?? null,
        display: formatBrlApi(resumo.lucroLiquido),
      },
      margem: {
        raw: resumo.margemPercentual ?? null,
        display: margemDisplay ?? DASH,
      },
      pedidos: {
        valor: toCount(resumo.pedidos ?? quantidadeVendas),
        label: toCount(resumo.pedidos ?? quantidadeVendas).toLocaleString("pt-BR"),
      },
      ticketMedio: {
        raw: resumo.ticketMedio ?? null,
        display: formatMoneyOrZero(resumo.ticketMedio ?? null),
      },
      repasseMarketplace: {
        raw: resumo.repasseMarketplace ?? null,
        display: formatMoneyOrZero(resumo.repasseMarketplace ?? null),
      },
      margemCritica: {
        valor: toCount(resumo.vendasMargemCritica),
        label: vendasCountLabel(resumo.vendasMargemCritica),
      },
      prejuizo: {
        valor: toCount(resumo.vendasPrejuizo),
        label: vendasCountLabel(resumo.vendasPrejuizo),
      },
      saudaveis:
        resumo.vendasSaudaveis == null
          ? null
          : {
              valor: toCount(resumo.vendasSaudaveis),
              label: vendasCountLabel(resumo.vendasSaudaveis),
            },
      custos: [
        buildCostEntry(
          "custo_produto",
          "Custo Produto",
          custosResumo.custoProduto ?? null,
          faturamentoRaw,
        ),
        buildCostEntry(
          "comissao_marketplace",
          "Comissão Marketplace",
          custosResumo.comissaoMarketplace ?? null,
          faturamentoRaw,
        ),
        buildCostEntry("frete", "Frete", custosResumo.frete ?? null, faturamentoRaw),
        buildCostEntry(
          "impostos",
          "Impostos",
          custosResumo.impostos ?? null,
          faturamentoRaw,
        ),
        buildCostEntry(
          "operacao_embalagem",
          "Operação + Embalagem",
          custosResumo.operacaoEmbalagem ?? null,
          faturamentoRaw,
        ),
        buildCostEntry("ml_ads", "ML Ads", custosResumo.mlAds ?? null, faturamentoRaw),
        buildCostEntry(
          "custos_operacionais",
          "Custos Operacionais",
          custosResumo.custosOperacionais ?? null,
          faturamentoRaw,
        ),
      ],
    },
    resumoExecutivoSchema: null,
    vendasDetalhe,
    listagemTotal: Math.max(0, Number(report?._meta?.listRowsTotal) || 0),
    vendasListaQuery:
      escopo === "filters"
        ? {
            periodPreset: String(periodo.preset ?? "custom"),
            startDate: String(periodo.dataInicial ?? ""),
            endDate: String(periodo.dataFinal ?? ""),
            marketplace: String(filtros.marketplace ?? ""),
            marketplaceAccountId: contaId,
            listFilterId: String(filtros.filtroOperacionalId ?? "all"),
            searchQuery: String(filtros.busca ?? ""),
            expectedCount: quantidadeVendas,
          }
        : null,
    _meta: {
      versao: report.versao ?? null,
      fonteResumo: report?._meta?.fonteResumo ?? null,
      analiseLimitada: Boolean(report?._meta?.analiseLimitada),
      geradoEm: report.geradoEm ?? null,
    },
  };
  const enrichedPayload = enrichVendasSharePayloadFromContext(basePayload, reportContext);
  if (import.meta.env.DEV) {
    const firstRow =
      Array.isArray(enrichedPayload.vendasDetalhe) && enrichedPayload.vendasDetalhe.length > 0
        ? enrichedPayload.vendasDetalhe[0]
        : null;
    console.info("[S7][VendasSharePayload][debug]", {
      escopo: enrichedPayload.escopo,
      vendas_count: enrichedPayload.quantidadeVendas?.valor ?? 0,
      detail_rows_count: Array.isArray(enrichedPayload.vendasDetalhe)
        ? enrichedPayload.vendasDetalhe.length
        : 0,
      fonte_resumo: report?._meta?.fonteResumo ?? null,
      rows_aggregation_applied: false,
      first_row_keys: firstRow ? Object.keys(firstRow).slice(0, 30) : [],
      aggregated_costs_from_rows: null,
      final_costs: enrichedPayload?.resumoExecutivo?.custos ?? null,
    });
  }
  return {
    ...enrichedPayload,
    resumoExecutivoSchema: buildVendasExecutiveSummarySchema(enrichedPayload),
  };
}

/**
 * Garante que o escopo "filters" usa as linhas já carregadas na listagem
 * (mesma fonte da tela) — evita re-fetch lento ou inconsistente no WhatsApp/Excel.
 *
 * @param {VendasSharePayload} payload
 * @param {import("../buildVendasReportContext.js").VendasReportContext | null | undefined} reportContext
 * @returns {VendasSharePayload}
 */
export function enrichVendasSharePayloadFromContext(payload, reportContext) {
  if (!payload || !reportContext || reportContext.reportScope !== "filters") {
    return payload;
  }

  const rows = Array.isArray(reportContext.listSalesRows) ? reportContext.listSalesRows : [];
  const listTotal = Math.max(0, Number(reportContext.sales?.listRowsTotal) || 0);
  const startDate = String(reportContext.period?.startDate ?? "").trim();
  const endDate = String(reportContext.period?.endDate ?? "").trim();
  const periodPreset = String(reportContext.period?.preset ?? "custom").trim() || "custom";

  const productScope =
    reportContext.productScope != null && typeof reportContext.productScope === "object"
      ? reportContext.productScope
      : null;
  const productId =
    productScope?.productId != null ? String(productScope.productId).trim() : "";

  return {
    ...payload,
    escopo: "filters",
    vendasDetalhe: rows.length > 0 ? rows : payload.vendasDetalhe,
    listagemTotal: listTotal > 0 ? listTotal : payload.listagemTotal,
    vendasListaQuery: payload.vendasListaQuery
      ? {
          ...payload.vendasListaQuery,
          periodPreset,
          startDate: startDate || String(payload.vendasListaQuery.startDate ?? ""),
          endDate: endDate || String(payload.vendasListaQuery.endDate ?? ""),
          listFilterId: String(reportContext.operationalFilter?.id ?? payload.vendasListaQuery.listFilterId ?? "all"),
          searchQuery: reportContext.search?.hasQuery
            ? String(reportContext.search.query ?? "")
            : String(payload.vendasListaQuery.searchQuery ?? ""),
          ...(productId ? { productId } : {}),
        }
      : null,
  };
}
