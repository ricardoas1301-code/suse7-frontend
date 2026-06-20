// ======================================================================
// Resumo Diário — seção do Dashboard com escopo automático (hoje vs filtro).
// DASH.4: dados reais via /api/sales/executive-summary (fonte única Suse7).
// ======================================================================

import { useMemo } from "react";
import S7DailySummaryCard from "./S7DailySummaryCard.jsx";
import { useDashboardScope } from "./useDashboardScope.js";
import { useSalesExecutiveSummary } from "../../hooks/useSalesExecutiveSummary.js";
import { formatBrlFromApiString, formatPercentFromApiString } from "../../features/listings/utils/catalogFormatters";
import { isExecutiveSummaryEmptyForFilters } from "../sales/vendasExecutivePanelUx.js";

/**
 * @param {unknown} raw
 */
function formatCountOrDash(raw) {
  if (raw == null) return "—";
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR");
}

/**
 * @param {unknown} raw
 */
function formatMoneyOrDash(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  return formatBrlFromApiString(String(raw));
}

/**
 * @param {unknown} raw
 */
function formatPercentOrDash(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  return formatPercentFromApiString(String(raw));
}

/**
 * @param {{ className?: string }} props
 */
export default function S7DailySummarySection({ className = "" }) {
  const scope = useDashboardScope();
  const { summary, dataQuality, loading, error } = useSalesExecutiveSummary(scope.resumoParams, {
    enabled: true,
  });

  const empty = useMemo(
    () => !loading && !error && isExecutiveSummaryEmptyForFilters(summary),
    [loading, error, summary],
  );

  const blocks = useMemo(() => {
    if (loading || error || !summary || empty) {
      return [
        {
          id: "sales",
          title: "Vendas",
          columns: 2,
          metrics: [
            { id: "orders", label: "Pedidos", value: "—", tone: "default" },
            { id: "revenue", label: "Faturamento", value: "—", tone: "money" },
            { id: "avg_ticket", label: "Ticket Médio", value: "—", tone: "money" },
            { id: "in_progress", label: "Em andamento", value: "—", tone: "warning" },
          ],
        },
        {
          id: "profitability",
          title: "Lucratividade",
          columns: 2,
          metrics: [
            { id: "gross_profit", label: "Lucro Bruto", value: "—", tone: "money" },
            { id: "net_profit", label: "Lucro Líquido", value: "—", tone: "positive" },
            { id: "avg_margin", label: "Margem Média", value: "—", tone: "positive" },
            { id: "you_receive", label: "Você Recebe", value: "—", tone: "money" },
          ],
        },
        {
          id: "costs",
          title: "Custos",
          columns: 2,
          metrics: [
            { id: "marketplace_fee", label: "Comissão Marketplace", value: "—", tone: "default" },
            { id: "shipping", label: "Frete", value: "—", tone: "default" },
            { id: "taxes", label: "Impostos", value: "—", tone: "default" },
            { id: "ads", label: "Ads", value: "—", tone: "default" },
          ],
        },
      ];
    }

    return [
      {
        id: "sales",
        title: "Vendas",
        columns: 2,
        metrics: [
          {
            id: "orders",
            label: "Pedidos",
            value: formatCountOrDash(summary.orders_count),
            tone: "default",
          },
          {
            id: "revenue",
            label: "Faturamento",
            value: formatMoneyOrDash(summary.gross_sales_brl),
            tone: "money",
          },
          {
            id: "avg_ticket",
            label: "Ticket Médio",
            value: formatMoneyOrDash(summary.average_ticket_brl),
            tone: "money",
          },
          {
            id: "in_progress",
            label: "Em andamento",
            value: formatCountOrDash(summary.orders_in_progress_count),
            tone: "warning",
          },
        ],
      },
      {
        id: "profitability",
        title: "Lucratividade",
        columns: 2,
        metrics: [
          {
            id: "gross_profit",
            label: "Lucro Bruto",
            value: formatMoneyOrDash(summary.gross_profit_brl),
            tone: "money",
          },
          {
            id: "net_profit",
            label: "Lucro Líquido",
            value: formatMoneyOrDash(summary.net_profit_brl ?? summary.contribution_profit_brl),
            tone: "positive",
          },
          {
            id: "avg_margin",
            label: "Margem Média",
            value: formatPercentOrDash(summary.contribution_margin_percent),
            tone: "positive",
          },
          {
            id: "you_receive",
            label: "Você Recebe",
            value: formatMoneyOrDash(summary.you_receive_brl ?? summary.net_received_brl),
            tone: "money",
          },
        ],
      },
      {
        id: "costs",
        title: "Custos",
        columns: 2,
        metrics: [
          {
            id: "marketplace_fee",
            label: "Comissão Marketplace",
            value: formatMoneyOrDash(summary.marketplace_fee_brl),
            tone: "default",
          },
          {
            id: "shipping",
            label: "Frete",
            value: formatMoneyOrDash(summary.shipping_cost_brl),
            tone: "default",
          },
          {
            id: "taxes",
            label: "Impostos",
            value: formatMoneyOrDash(summary.tax_cost_brl),
            tone: "default",
          },
          {
            id: "ads",
            label: "Ads",
            value: formatMoneyOrDash(summary.ads_cost_brl),
            tone: "default",
          },
        ],
      },
    ];
  }, [loading, error, summary, empty]);

  const lastUpdatedAt = useMemo(() => {
    if (loading) return "Atualizando...";
    if (error) return "Falha ao atualizar";
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, [loading, error]);

  const statusSuffix = useMemo(() => {
    if (error) return " (erro)";
    if (dataQuality?.status === "partial") return " (parcial)";
    if (empty) return " (sem vendas)";
    return "";
  }, [error, dataQuality, empty]);

  return (
    <S7DailySummaryCard
      title="Resumo Diário"
      lastUpdatedLabel={`Última atualização${statusSuffix}`}
      lastUpdatedAt={lastUpdatedAt}
      blocks={blocks}
      periodLabel={
        scope.filterActive
          ? scope.resumoPeriodLabel
          : scope.resumoBadgeLabel
            ? `${scope.resumoPeriodLabel} · ${scope.resumoBadgeLabel}`
            : scope.resumoPeriodLabel
      }
      periodDateLabel={scope.resumoDateLabel}
      className={className}
    />
  );
}
