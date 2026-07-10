// ======================================================================
// Painel executivo de vendas — somente renderização (7 cards).
// ======================================================================

import SalesTopRankingCard from "./SalesTopRankingCard";
import VendasExecutiveKpiCard from "./VendasExecutiveKpiCard";
import { Coins, Percent, ShoppingCart, Wallet } from "lucide-react";

/**
 * @param {{
 *   topListingsByQuantity: Record<string, unknown>[];
 *   topListingsByGrossRevenue: Record<string, unknown>[];
 *   topListingsByNetProfit: Record<string, unknown>[];
 *   topProductsCount: number;
 *   executiveLoading: boolean;
 *   executivePanelError: string | null;
 *   executivePanelEmpty: boolean;
 *   executivePeriodLabel: string;
 *   quantityKpi: { value: string; subtitle: string | null };
 *   revenueKpi: { value: string; subtitle: string | null };
 *   netProfitKpi: { value: string; subtitle: string | null; valueNegative?: boolean };
 *   profitPercentKpi: {
 *     value: string;
 *     subtitle: string | null;
 *     unavailable?: boolean;
 *     valueNegative?: boolean;
 *   };
 *   className?: string;
 *   tituloExternoTop10?: boolean;
 * }} props
 */
export default function VendasExecutivePanel({
  topListingsByQuantity,
  topListingsByGrossRevenue,
  topListingsByNetProfit,
  topProductsCount,
  executiveLoading,
  executivePanelError,
  executivePanelEmpty,
  executivePeriodLabel,
  quantityKpi,
  revenueKpi,
  netProfitKpi,
  profitPercentKpi,
  className = "",
  tituloExternoTop10 = false,
}) {
  const sectionClass = [
    "s7-core-kpis",
    "anuncios-catalog__kpis",
    "vendas-page__kpis--executive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cardPeriodLabel = tituloExternoTop10 ? null : executivePeriodLabel;
  const dashboardTop10KpiIcons = tituloExternoTop10
    ? {
        sales: (
          <ShoppingCart className="vendas-executive-kpi__value-icon-svg vendas-executive-kpi__value-icon-svg--sales" />
        ),
        revenue: (
          <Wallet className="vendas-executive-kpi__value-icon-svg vendas-executive-kpi__value-icon-svg--revenue" />
        ),
        profit: (
          <Coins className="vendas-executive-kpi__value-icon-svg vendas-executive-kpi__value-icon-svg--profit" />
        ),
        margin: (
          <Percent className="vendas-executive-kpi__value-icon-svg vendas-executive-kpi__value-icon-svg--margin" />
        ),
      }
    : null;

  return (
    <section
      className={sectionClass}
      aria-label="Painel executivo de vendas"
      data-rankings-products-count={topProductsCount}
    >
      <article className="vendas-page__executive-rank-slot">
        <SalesTopRankingCard
          title="Top 10 mais vendidos"
          metric="quantity"
          listings={topListingsByQuantity}
          loading={executiveLoading}
          error={executivePanelError}
          periodLabel={cardPeriodLabel}
          tituloExterno={tituloExternoTop10}
        />
      </article>

      <article className="vendas-page__executive-rank-slot">
        <SalesTopRankingCard
          title="Top 10 maior faturamento"
          metric="gross_revenue"
          listings={topListingsByGrossRevenue}
          loading={executiveLoading}
          error={executivePanelError}
          periodLabel={cardPeriodLabel}
          tituloExterno={tituloExternoTop10}
        />
      </article>

      <article className="vendas-page__executive-rank-slot">
        <SalesTopRankingCard
          title="Top 10 com mais lucro"
          metric="net_profit"
          listings={topListingsByNetProfit}
          loading={executiveLoading}
          error={executivePanelError}
          periodLabel={cardPeriodLabel}
          tituloExterno={tituloExternoTop10}
        />
      </article>

      <div
        className="vendas-page__executive-kpi-row s7-dashboard-executive-kpi-row"
        aria-label="Indicadores executivos do período"
      >
        <VendasExecutiveKpiCard
          title="Vendas"
          tone="quantity"
          value={String(quantityKpi.value).replace(/\s+vendas$/i, "")}
          subtitle={quantityKpi.subtitle}
          valueIcon={dashboardTop10KpiIcons?.sales ?? null}
          valueClassName={tituloExternoTop10 ? "vendas-executive-kpi__value--dashbird-sales" : ""}
          cardClassName={tituloExternoTop10 ? "s7-kpi-chrome--top10-sales" : ""}
          loading={executiveLoading}
          error={executivePanelError}
          empty={executivePanelEmpty}
          periodLabel={cardPeriodLabel}
          tituloExterno={false}
        />
        <VendasExecutiveKpiCard
          title="Faturamento"
          tone="revenue"
          value={revenueKpi.value}
          subtitle={revenueKpi.subtitle}
          valueIcon={dashboardTop10KpiIcons?.revenue ?? null}
          cardClassName={tituloExternoTop10 ? "s7-kpi-chrome--top10-revenue" : ""}
          loading={executiveLoading}
          error={executivePanelError}
          empty={executivePanelEmpty}
          periodLabel={cardPeriodLabel}
          tituloExterno={false}
        />
        <VendasExecutiveKpiCard
          title="Lucro (R$)"
          tone="profit"
          value={netProfitKpi.value}
          subtitle={netProfitKpi.subtitle}
          valueIcon={dashboardTop10KpiIcons?.profit ?? null}
          valueClassName={
            [
              netProfitKpi.valueNegative ? "vendas-executive-kpi__value--negative" : "",
              tituloExternoTop10 ? "vendas-executive-kpi__value--dashbird-profit" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          cardClassName={tituloExternoTop10 ? "s7-kpi-chrome--top10-profit" : ""}
          loading={executiveLoading}
          error={executivePanelError}
          empty={executivePanelEmpty}
          periodLabel={cardPeriodLabel}
          tituloExterno={false}
        />
        <VendasExecutiveKpiCard
          title="Lucro (%)"
          tone="conversion"
          value={profitPercentKpi.value}
          subtitle={profitPercentKpi.subtitle}
          valueIcon={dashboardTop10KpiIcons?.margin ?? null}
          valueClassName={
            [
              profitPercentKpi.valueNegative ? "vendas-executive-kpi__value--negative-warn" : "",
              tituloExternoTop10 ? "vendas-executive-kpi__value--dashbird-margin" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          cardClassName={tituloExternoTop10 ? "s7-kpi-chrome--top10-margin" : ""}
          unavailable={profitPercentKpi.unavailable}
          loading={executiveLoading}
          error={executivePanelError}
          empty={executivePanelEmpty}
          periodLabel={cardPeriodLabel}
          tituloExterno={false}
        />
      </div>
    </section>
  );
}
