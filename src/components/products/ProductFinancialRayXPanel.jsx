// ======================================================================
// Raio-X financeiro consolidado — aba Vendas & desempenho do produto.
// Fonte única: executive-summary (mesmo motor Resumo Diário / Vendas / Raio-X).
// ======================================================================

import { useMemo } from "react";
import Decimal from "decimal.js";
import { CircleDollarSign, Coins, DollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import S7DailySummaryCard from "../dashboard/S7DailySummaryCard.jsx";
import "../dashboard/S7DailySummaryCard.css";
import VendasExecutiveKpiCard from "../sales/VendasExecutiveKpiCard.jsx";
import { formatExecutiveCountOrDash } from "../../features/sales/executiveSummaryDisplay.js";
import { formatBrlFromApiString } from "../../features/listings/utils/catalogFormatters";
import {
  buildExecutiveSummaryRayXCostsMetrics,
  buildListingRayXCostsMetrics,
  formatPercentDisplay,
} from "../../features/listings/rayx/listingFinancialTruthEngine.js";
import { buildLucroPercentualRayxTooltip } from "../../features/sales/executiveSummaryDisplay.js";
import { useOptionalProductEditFinancial } from "./ProductEditFinancialContext.jsx";
import ProductSalesHistorySection from "./ProductSalesHistorySection.jsx";
import "./ProductFinancialRayXPanel.css";

/**
 * Escala fonte de valores monetários para caber em uma linha no modal.
 * @param {string} value
 */
/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
function parseExecutiveSalesQty(summary) {
  if (!summary) return null;
  const raw = summary.items_quantity_sold ?? summary.orders_count;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {string | number | null | undefined} raw
 */
function parseExecutiveApiDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const dec = new Decimal(String(raw).trim().replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

function resolveProductRayxKpiCellClass(...parts) {
  return ["pf-product-rayx__kpi-cell", ...parts].filter(Boolean).join(" ");
}

function resolveProductRayxMoneyCellClass(valueSizeClass) {
  return resolveProductRayxKpiCellClass("pf-product-rayx__kpi", "pf-product-rayx__kpi--money", valueSizeClass);
}

function resolveProductRayxMoneyValueSizeClass(value) {
  const text = value != null ? String(value).trim() : "";
  if (!text || text === "—") return "pf-product-rayx__kpi-value--size-0";
  const len = text.length;
  if (len <= 7) return "pf-product-rayx__kpi-value--size-0";
  if (len <= 10) return "pf-product-rayx__kpi-value--size-1";
  if (len <= 13) return "pf-product-rayx__kpi-value--size-2";
  if (len <= 16) return "pf-product-rayx__kpi-value--size-3";
  return "pf-product-rayx__kpi-value--size-4";
}

/**
 * @param {{
 *   productId?: string | null;
 *   tabTitle?: string;
 *   showSalesHistory?: boolean;
 *   financialData?: ReturnType<typeof useOptionalProductEditFinancial> | null;
 *   sideIllustrationSrc?: string;
 *   sideIllustrationAlt?: string;
 *   salesCardSideMetrics?: { visitsValue?: string; conversionValue?: string } | null;
 *   compact360?: boolean;
 * }} props
 */
export default function ProductFinancialRayXPanel({
  productId = null,
  tabTitle = "Vendas",
  showSalesHistory = false,
  financialData = null,
  sideIllustrationSrc = "/product-rayx/ticket-medio-side-illustration.png",
  sideIllustrationAlt = "",
  salesCardSideMetrics = null,
  compact360 = false,
}) {
  const ctxFromProduct = useOptionalProductEditFinancial();
  const ctx = financialData ?? ctxFromProduct;

  const summary = ctx?.summary ?? null;
  const financialTruthContract = ctx?.financialTruthContract ?? null;
  const isListingScope = financialTruthContract?.scope === "listing";
  const executiveLoading = ctx?.executiveLoading ?? false;
  const executiveError = ctx?.executiveError ?? null;
  const empty = ctx?.empty ?? true;

  const quantitySold = useMemo(() => {
    if (empty || !summary) return "—";
    const qty = isListingScope
      ? summary.units_sold_display ?? summary.items_quantity_sold
      : summary.items_quantity_sold != null
        ? summary.items_quantity_sold
        : summary.orders_count;
    return formatExecutiveCountOrDash(qty);
  }, [empty, isListingScope, summary]);

  const revenueValue = useMemo(() => {
    if (empty || !summary) return "—";
    const raw = summary.gross_sales_brl != null ? String(summary.gross_sales_brl) : "0.00";
    return formatBrlFromApiString(raw);
  }, [empty, summary]);

  const revenueValueSizeClass = useMemo(
    () => resolveProductRayxMoneyValueSizeClass(revenueValue),
    [revenueValue],
  );

  const netProfitRaw = useMemo(() => {
    if (empty || !summary) return null;
    return summary.contribution_profit_brl ?? summary.net_profit_brl ?? "0.00";
  }, [empty, summary]);

  const netProfitKpi = useMemo(() => {
    if (empty) return { value: "—", valueNegative: false };
    const dec = parseExecutiveApiDecimal(netProfitRaw);
    if (dec == null) return { value: "—", valueNegative: false };
    return {
      value: formatBrlFromApiString(dec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)),
      valueNegative: dec.isNegative(),
    };
  }, [empty, netProfitRaw]);

  const profitPercentKpi = useMemo(() => {
    if (empty || !summary) {
      return { value: "—", subtitle: null, valueDica: null, unavailable: true, valueNegative: false };
    }
    const grossDec = parseExecutiveApiDecimal(summary.gross_sales_brl);
    const netDec = parseExecutiveApiDecimal(netProfitRaw);
    if (grossDec == null || netDec == null) {
      return {
        value: "—",
        subtitle: "Percentual indisponível",
        valueDica: null,
        unavailable: true,
        valueNegative: false,
      };
    }
    const marginDec = grossDec.isZero()
      ? new Decimal(0)
      : netDec.div(grossDec).times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    return {
      value: formatPercentDisplay(marginDec.toFixed(4), 2),
      valueDica: buildLucroPercentualRayxTooltip(marginDec),
      subtitle: null,
      unavailable: false,
      valueNegative: marginDec.isNegative(),
    };
  }, [empty, netProfitRaw, summary]);

  const ticketMedioValue = useMemo(() => {
    if (empty || !summary) return "—";
    const qty = parseExecutiveSalesQty(summary);
    const gross = parseExecutiveApiDecimal(summary.gross_sales_brl);
    if (!qty || gross == null) return "—";
    return formatBrlFromApiString(gross.div(qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2));
  }, [empty, summary]);

  const lucroUnidadeBrlValue = useMemo(() => {
    if (empty || !summary) return "—";
    const qty = parseExecutiveSalesQty(summary);
    const profit =
      parseExecutiveApiDecimal(summary.contribution_profit_brl) ??
      parseExecutiveApiDecimal(summary.net_profit_brl);
    if (!qty || profit == null) return "—";
    return formatBrlFromApiString(profit.div(qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2));
  }, [empty, summary]);

  const repasseMarketplaceValue = useMemo(() => {
    if (empty || !summary) return "—";
    const payout =
      parseExecutiveApiDecimal(summary.you_receive_brl) ??
      parseExecutiveApiDecimal(summary.net_received_brl);
    if (payout == null) return "—";
    return formatBrlFromApiString(payout.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2));
  }, [empty, summary]);

  const ticketMedioValueSizeClass = useMemo(
    () => resolveProductRayxMoneyValueSizeClass(ticketMedioValue),
    [ticketMedioValue],
  );

  const lucroUnidadeBrlValueSizeClass = useMemo(
    () => resolveProductRayxMoneyValueSizeClass(lucroUnidadeBrlValue),
    [lucroUnidadeBrlValue],
  );

  const repasseMarketplaceValueSizeClass = useMemo(
    () => resolveProductRayxMoneyValueSizeClass(repasseMarketplaceValue),
    [repasseMarketplaceValue],
  );

  const profitValueSizeClass = useMemo(
    () => resolveProductRayxMoneyValueSizeClass(netProfitKpi.value),
    [netProfitKpi.value],
  );

  const lucroUnidadeBrlNegative = useMemo(() => {
    if (empty || !summary) return false;
    const qty = parseExecutiveSalesQty(summary);
    const profit =
      parseExecutiveApiDecimal(summary.contribution_profit_brl) ??
      parseExecutiveApiDecimal(summary.net_profit_brl);
    return qty != null && profit != null && profit.isNegative();
  }, [empty, summary]);

  const repasseMarketplaceNegative = useMemo(() => {
    if (empty || !summary) return false;
    const payout =
      parseExecutiveApiDecimal(summary.you_receive_brl) ??
      parseExecutiveApiDecimal(summary.net_received_brl);
    return payout != null && payout.isNegative();
  }, [empty, summary]);

  const custosBlock = useMemo(
    () => ({
      id: "costs",
      title: "Custos",
      columns: 4,
      metrics: isListingScope
        ? buildListingRayXCostsMetrics(financialTruthContract)
        : buildExecutiveSummaryRayXCostsMetrics(summary),
    }),
    [financialTruthContract, isListingScope, summary],
  );

  const hasProduct = ctx != null || (productId != null && String(productId).trim() !== "");

  return (
    <div
      className={["pf-product-rayx", compact360 ? "s7-rayx-sales-compact" : ""].filter(Boolean).join(" ")}
    >
      <div className="pf-product-rayx__intro">
        <h2 className="pf-tab-title">{tabTitle}</h2>
      </div>

      {!hasProduct ? (
        <p className="hint">Salve o produto para visualizar o desempenho consolidado.</p>
      ) : executiveLoading ? (
        <p className="hint">Carregando desempenho…</p>
      ) : executiveError ? (
        <p className="hint pf-performance-error" role="alert">
          {executiveError}
        </p>
      ) : (
        <>
          <section className="pf-product-rayx__executive" aria-label="Resumo executivo">
            <div className="pf-product-rayx__kpi-grid pf-product-rayx__kpi-grid--primary">
              <div className={resolveProductRayxKpiCellClass()}>
                <VendasExecutiveKpiCard
                  title="Vendas"
                  valueIcon={<ShoppingCart className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--sales" />}
                  tone="quantity"
                  value={quantitySold}
                  valueAside={
                    salesCardSideMetrics ? (
                      <>
                        <span className="vendas-executive-kpi__aside-item">
                          <span className="vendas-executive-kpi__aside-label">Visitas</span>
                          <span className="vendas-executive-kpi__aside-value">{salesCardSideMetrics.visitsValue ?? "—"}</span>
                        </span>
                        <span className="vendas-executive-kpi__aside-item">
                          <span className="vendas-executive-kpi__aside-label">Conversão</span>
                          <span className="vendas-executive-kpi__aside-value">{salesCardSideMetrics.conversionValue ?? "—"}</span>
                        </span>
                      </>
                    ) : null
                  }
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  tituloExterno
                />
              </div>
              <div className={resolveProductRayxMoneyCellClass(revenueValueSizeClass)}>
                <VendasExecutiveKpiCard
                  title="Faturamento"
                  valueIcon={<Wallet className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--revenue" />}
                  tone="revenue"
                  value={revenueValue}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  tituloExterno
                />
              </div>
              <div className={resolveProductRayxMoneyCellClass(profitValueSizeClass)}>
                <VendasExecutiveKpiCard
                  title="Lucro (R$)"
                  valueIcon={<Coins className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--profit" />}
                  tone="profit"
                  value={netProfitKpi.value}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  valueClassName={
                    netProfitKpi.valueNegative ? "vendas-executive-kpi__value--negative" : ""
                  }
                  tituloExterno
                />
              </div>
              <div className={resolveProductRayxKpiCellClass()}>
                <VendasExecutiveKpiCard
                  title="Lucro (%)"
                  valueIcon={
                    <TrendingUp
                      className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--margin"
                      aria-hidden
                    />
                  }
                  tone="conversion"
                  value={profitPercentKpi.value}
                  valueDica={profitPercentKpi.valueDica}
                  subtitle={profitPercentKpi.unavailable ? profitPercentKpi.subtitle : null}
                  unavailable={profitPercentKpi.unavailable}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  valueClassName={
                    profitPercentKpi.valueNegative ? "vendas-executive-kpi__value--negative" : ""
                  }
                  tituloExterno
                />
              </div>
            </div>

            <div
              className="pf-product-rayx__kpi-grid pf-product-rayx__kpi-grid--unit"
              aria-label="Indicadores por unidade vendida"
            >
              <div className="pf-product-rayx__kpi-spacer" aria-hidden="true">
                <img
                  className="pf-product-rayx__ticket-side-image"
                  src={sideIllustrationSrc}
                  alt={sideIllustrationAlt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className={resolveProductRayxMoneyCellClass(ticketMedioValueSizeClass)}>
                <VendasExecutiveKpiCard
                  title="Ticket médio (R$)"
                  valueIcon={<DollarSign className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--ticket" />}
                  tone="revenue"
                  value={ticketMedioValue}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  tituloExterno
                />
              </div>
              <div
                className={resolveProductRayxKpiCellClass(
                  "pf-product-rayx__kpi",
                  "pf-product-rayx__kpi--money",
                  "pf-product-rayx__kpi-cell--title-compact",
                  lucroUnidadeBrlValueSizeClass,
                )}
              >
                <VendasExecutiveKpiCard
                  title="Lucro por unidade vendida (R$)"
                  valueIcon={<Coins className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--unit-profit" />}
                  titleClassName="vendas-executive-kpi__title--compact"
                  tone="profit"
                  value={lucroUnidadeBrlValue}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  valueClassName={
                    lucroUnidadeBrlNegative ? "vendas-executive-kpi__value--negative" : ""
                  }
                  tituloExterno
                />
              </div>
              <div
                className={resolveProductRayxKpiCellClass(
                  "pf-product-rayx__kpi",
                  "pf-product-rayx__kpi--money",
                  "pf-product-rayx__kpi-cell--title-compact",
                  repasseMarketplaceValueSizeClass,
                )}
              >
                <VendasExecutiveKpiCard
                  title="Repasse do Marketplace (R$)"
                  valueIcon={
                    <CircleDollarSign
                      className="pf-product-rayx__kpi-value-icon pf-product-rayx__kpi-value-icon--repasse"
                      aria-hidden
                    />
                  }
                  titleClassName="vendas-executive-kpi__title--compact"
                  tone="revenue"
                  value={repasseMarketplaceValue}
                  loading={executiveLoading}
                  error={executiveError}
                  empty={empty}
                  valueClassName={
                    repasseMarketplaceNegative ? "vendas-executive-kpi__value--negative" : ""
                  }
                  tituloExterno
                />
              </div>
            </div>
          </section>

          <div className="pf-product-rayx__blocks">
            <S7DailySummaryCard
              title="Custos"
              periodLabel=""
              periodChipLabel={null}
              blocks={[custosBlock]}
              className="pf-product-rayx__daily-card pf-product-rayx__daily-card--custos s7-product-rayx-cost-card"
            />
          </div>

          {showSalesHistory && ctx ? (
            <ProductSalesHistorySection
              rows={ctx.salesHistoryRows}
              total={ctx.salesHistoryTotal}
              salesCount={ctx.salesCountCanonical}
              page={ctx.salesHistoryPage}
              totalPages={ctx.salesHistoryTotalPages}
              loading={ctx.salesHistoryLoading}
              error={ctx.salesHistoryError}
              onPageChange={ctx.goSalesHistoryPage}
            />
          ) : null}
        </>
      )}

      {/* FASE FUTURA — Saúde do Produto (Excelente / Boa / Atenção / Crítica) — não implementar agora */}
    </div>
  );
}
