// ======================================================================
// Formatação e blocos visuais do executive-summary (fonte única Suse7).
// Compartilhado: Resumo Diário, Raio-X produto, relatórios.
// Somente apresentação — sem recálculo financeiro.
// ======================================================================

import {
  formatBrlFromApiString,
  formatNegativeBrlFromApiString,
  formatPercentFromApiString,
} from "../listings/utils/catalogFormatters";
import { isExecutiveApiDecimalNegative } from "../../components/sales/vendasExecutivePanelUx.js";
import Decimal from "decimal.js";

/** Placeholder reservado para KPI futuro (DASH.6A). */
export const EXECUTIVE_SUMMARY_METRIC_TBD = {
  id: "tbd",
  label: "A definir",
  value: "—",
  tone: "default",
};

/** Texto informativo — KPI ML Ads (Resumo Diário). */
export const ML_ADS_COST_LABEL_TIP =
  "Valor reservado para usar em Mercado Livre Ads. Esse valor representa a reserva configurada no Suse7 e não necessariamente o valor efetivamente consumido pelo Mercado Livre Ads.";

/**
 * @param {unknown} raw
 */
export function formatExecutiveCountOrDash(raw) {
  if (raw == null) return "—";
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR");
}

/**
 * @param {unknown} raw
 */
export function formatExecutiveMoneyOrDash(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  return formatBrlFromApiString(String(raw));
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function resolveHighestOrderGrossBrl(summary) {
  if (!summary) return null;

  for (const key of ["highest_order_gross_brl", "highest_sale_gross_brl", "max_order_gross_brl"]) {
    const raw = summary[key];
    if (raw != null && String(raw).trim() !== "") return raw;
  }

  const ordersCount = Number.parseInt(String(summary.orders_count ?? "0"), 10);
  if (Number.isFinite(ordersCount) && ordersCount === 1) {
    const gross = summary.gross_sales_brl;
    if (gross != null && String(gross).trim() !== "") return gross;
  }

  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function buildHighestSaleMetric(summary) {
  const ordersCount = Number.parseInt(String(summary?.orders_count ?? "0"), 10);
  const hasOrders = Number.isFinite(ordersCount) && ordersCount > 0;
  const highestRaw = resolveHighestOrderGrossBrl(summary);

  return {
    id: "highest_sale",
    label: "Maior Venda",
    value: hasOrders && highestRaw != null ? formatExecutiveMoneyOrDash(highestRaw) : "—",
    tone: "money",
  };
}

/**
 * @param {unknown} raw
 */
export function formatExecutiveCostMoneyOrDash(raw) {
  const negative = formatNegativeBrlFromApiString(raw);
  return negative ?? "—";
}

/**
 * @param {unknown} raw
 */
export function formatExecutiveResultMoneyDisplay(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  if (isExecutiveApiDecimalNegative(raw)) {
    return formatNegativeBrlFromApiString(raw) ?? "—";
  }
  return formatBrlFromApiString(String(raw));
}

/**
 * @param {unknown} raw
 */
export function formatExecutiveResultPercentDisplay(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  const s = String(raw).trim();
  if (isExecutiveApiDecimalNegative(s)) {
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n)) return "—";
    return `-${Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  }
  return formatPercentFromApiString(s);
}

/**
 * @param {unknown} raw
 */
export function resolveExecutiveResultMetricTone(raw) {
  if (raw == null || String(raw).trim() === "") return "default";
  if (isExecutiveApiDecimalNegative(raw)) return "danger";
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return "default";
  return "positive";
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseExecutiveApiDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseExecutiveDecimalOrNull(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    return new Decimal(String(raw).replace(",", "."));
  } catch {
    return null;
  }
}

/**
 * @param {Decimal | null} raw
 * @returns {string | null}
 */
function decimalToApiStringOrNull(raw) {
  if (!raw) return null;
  return raw.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Recalcula o bloco Resultado pela mesma base exibida em Custos.
 * Regra:
 * lucro = faturamento - custos
 * lucro% = lucro / faturamento
 * repasse = faturamento - comissão - frete
 *
 * @param {Record<string, unknown> | null | undefined} summary
 */
function buildDailySummaryDerivedResult(summary) {
  const faturamento = parseExecutiveDecimalOrNull(summary?.gross_sales_brl);
  const custoProduto = parseExecutiveDecimalOrNull(summary?.product_cost_only_brl);
  const comissaoMarketplace = parseExecutiveDecimalOrNull(summary?.marketplace_fee_brl);
  const frete = parseExecutiveDecimalOrNull(summary?.shipping_cost_brl);
  const impostos = parseExecutiveDecimalOrNull(summary?.tax_cost_brl);
  const operacaoEmbalagem = parseExecutiveDecimalOrNull(summary?.operation_packaging_cost_brl);
  const mlAds = parseExecutiveDecimalOrNull(summary?.ads_cost_brl) ?? new Decimal(0);
  const custosOperacionais =
    parseExecutiveDecimalOrNull(summary?.operational_costs_brl) ?? new Decimal(0);

  const hasCostBase =
    faturamento &&
    custoProduto &&
    comissaoMarketplace &&
    frete &&
    impostos &&
    operacaoEmbalagem;

  if (!hasCostBase) {
    return {
      netProfitRaw: summary?.net_profit_brl ?? summary?.contribution_profit_brl ?? null,
      marginRaw: summary?.contribution_margin_percent ?? null,
      payoutRaw: summary?.you_receive_brl ?? summary?.net_received_brl ?? null,
    };
  }

  const lucro = faturamento
    .minus(custoProduto)
    .minus(comissaoMarketplace)
    .minus(frete)
    .minus(impostos)
    .minus(operacaoEmbalagem)
    .minus(mlAds)
    .minus(custosOperacionais);

  const lucroPercentual =
    faturamento.isZero()
      ? new Decimal(0)
      : lucro.div(faturamento).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const repasseMarketplace = faturamento.minus(comissaoMarketplace).minus(frete);

  return {
    netProfitRaw: decimalToApiStringOrNull(lucro),
    marginRaw: decimalToApiStringOrNull(lucroPercentual),
    payoutRaw: decimalToApiStringOrNull(repasseMarketplace),
  };
}

/**
 * @param {unknown} costRaw
 * @param {unknown} grossRaw
 */
export function formatExecutiveCostSharePercent(costRaw, grossRaw) {
  const gross = parseExecutiveApiDecimal(grossRaw);
  const cost = parseExecutiveApiDecimal(costRaw);
  if (gross == null || cost == null || gross === 0) return null;
  const pct = (Math.abs(cost) / Math.abs(gross)) * 100;
  return `${pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {string} id
 * @param {string} label
 * @param {unknown} costRaw
 */
export function buildExecutiveCostMetric(summary, id, label, costRaw, extra = {}) {
  return {
    id,
    label,
    value: formatExecutiveCostMoneyOrDash(costRaw),
    sharePercent: formatExecutiveCostSharePercent(costRaw, summary?.gross_sales_brl) ?? "—",
    tone: "danger",
    ...extra,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function buildExecutiveCostsBlockMetrics(summary) {
  const mlAdsRaw = summary?.ads_cost_brl;
  const operationalCostsRaw = summary?.operational_costs_brl;
  const mlAdsResolved =
    mlAdsRaw == null || String(mlAdsRaw).trim() === "" ? "0.00" : summary?.ads_cost_brl;
  const operationalCostsResolved =
    operationalCostsRaw == null || String(operationalCostsRaw).trim() === ""
      ? "0.00"
      : summary?.operational_costs_brl;

  return [
    buildExecutiveCostMetric(summary, "product_cost", "Custo Produto", summary?.product_cost_only_brl),
    buildExecutiveCostMetric(summary, "marketplace_fee", "Comissão Marketplace", summary?.marketplace_fee_brl),
    buildExecutiveCostMetric(summary, "shipping", "Frete", summary?.shipping_cost_brl),
    buildExecutiveCostMetric(summary, "taxes", "Impostos", summary?.tax_cost_brl),
    buildExecutiveCostMetric(
      summary,
      "operation_packaging",
      "Operação + Embalagem",
      summary?.operation_packaging_cost_brl,
    ),
    buildExecutiveCostMetric(summary, "ml_ads", "ML Ads", mlAdsResolved, {
      labelTip: ML_ADS_COST_LABEL_TIP,
    }),
    buildExecutiveCostMetric(summary, "operational_costs", "Custos Operacionais", operationalCostsResolved),
  ];
}

/**
 * Bloco Resultado — Raio-X produto (Receita, Você recebe, Lucro, Margem).
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function buildProductResultadoBlockMetrics(summary) {
  const netProfitRaw = summary?.net_profit_brl ?? summary?.contribution_profit_brl;
  const marginRaw = summary?.contribution_margin_percent;
  const receiveRaw = summary?.you_receive_brl ?? summary?.net_received_brl;

  return [
    {
      id: "receita",
      label: "Receita",
      value: formatExecutiveMoneyOrDash(summary?.gross_sales_brl),
      tone: "positive",
    },
    {
      id: "you_receive",
      label: "Você recebe",
      value: formatExecutiveMoneyOrDash(receiveRaw),
      tone: "positive",
    },
    {
      id: "lucro",
      label: "Lucro",
      value: formatExecutiveResultMoneyDisplay(netProfitRaw),
      tone: resolveExecutiveResultMetricTone(netProfitRaw),
    },
    {
      id: "margem",
      label: "Margem",
      value: formatExecutiveResultPercentDisplay(marginRaw),
      tone: resolveExecutiveResultMetricTone(marginRaw),
    },
  ];
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function buildDailySummaryBlocks(summary) {
  if (!summary) {
    return buildDailySummaryPlaceholderBlocks();
  }

  const {
    netProfitRaw,
    marginRaw,
    payoutRaw,
  } = buildDailySummaryDerivedResult(summary);

  return [
    {
      id: "sales",
      title: "Vendas",
      columns: 2,
      metrics: [
        {
          id: "orders",
          label: "Pedidos",
          value: formatExecutiveCountOrDash(summary.orders_count),
          tone: "warning",
        },
        {
          id: "revenue",
          label: "Faturamento",
          value: formatExecutiveMoneyOrDash(summary.gross_sales_brl),
          tone: "positive",
        },
        {
          id: "avg_ticket",
          label: "Ticket Médio",
          value: formatExecutiveMoneyOrDash(summary.average_ticket_brl),
          tone: "money",
        },
        buildHighestSaleMetric(summary),
      ],
    },
    {
      id: "resultado",
      title: "Resultado",
      columns: 2,
      metrics: [
        {
          id: "net_profit",
          label: "Lucro (R$)",
          value: formatExecutiveResultMoneyDisplay(netProfitRaw),
          tone: resolveExecutiveResultMetricTone(netProfitRaw),
        },
        {
          id: "avg_margin",
          label: "Lucro (%)",
          value: formatExecutiveResultPercentDisplay(marginRaw),
          tone: resolveExecutiveResultMetricTone(marginRaw),
        },
        {
          id: "marketplace_payout",
          label: "Repasse Marketplace",
          value: formatExecutiveMoneyOrDash(payoutRaw),
          tone: "positive",
        },
      ],
    },
    {
      id: "costs",
      title: "Custos",
      columns: 2,
      metrics: buildExecutiveCostsBlockMetrics(summary),
    },
  ];
}

export function buildDailySummaryPlaceholderBlocks() {
  return [
    {
      id: "sales",
      title: "Vendas",
      columns: 2,
      metrics: [
        { id: "orders", label: "Pedidos", value: "—", tone: "warning" },
        { id: "revenue", label: "Faturamento", value: "—", tone: "positive" },
        { id: "avg_ticket", label: "Ticket Médio", value: "—", tone: "money" },
        { id: "highest_sale", label: "Maior Venda", value: "—", tone: "money" },
      ],
    },
    {
      id: "resultado",
      title: "Resultado",
      columns: 2,
      metrics: [
        { id: "net_profit", label: "Lucro (R$)", value: "—", tone: "positive" },
        { id: "avg_margin", label: "Lucro (%)", value: "—", tone: "positive" },
        { id: "marketplace_payout", label: "Repasse Marketplace", value: "—", tone: "positive" },
      ],
    },
    {
      id: "costs",
      title: "Custos",
      columns: 2,
      metrics: buildExecutiveCostsBlockMetrics(null),
    },
  ];
}
