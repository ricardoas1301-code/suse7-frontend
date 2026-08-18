import { getVendasTableFinancialHealthToneClass } from "../../../utils/saleHealthUi.js";
import {
  catalogVendasFinValueClass,
  formatCatalogPctVendasStyle,
} from "../../../components/catalog/CatalogFinancialMetricUi.jsx";
import { DASH, formatBrlFromApiString } from "./catalogFormatters.js";
import {
  formatarPercentualVendasComposicaoFromRaw,
  montarRotuloSecundarioPercentualSobreVenda,
  parseVendasFinancialDecimal,
} from "../../vendas/utils/vendasTableSaleSharePercentDisplay.js";

const HOMOLOG_PRECIFICACOES_LISTING_IDS = new Set([
  "MLB6415546858",
  "MLB6086602390",
  "MLB6087428866",
]);

/** @param {unknown} raw */
function isContractFieldEmpty(raw) {
  return raw == null || String(raw).trim() === "";
}

/** @param {unknown} display */
function isDashDisplay(display) {
  return display === DASH;
}

/**
 * @param {unknown} raw
 * @param {string} reason
 */
function dashReason(raw, reason) {
  return isContractFieldEmpty(raw) ? reason : null;
}

/**
 * Log DEV — diagnóstico de campos financeiros vazios na lista Precificações.
 * @param {Record<string, unknown>} row
 * @param {ReturnType<typeof resolvePrecificacoesListCurrentState>} state
 */
function logPrecificacoesRowMissingFinancialData(row, state) {
  if (!import.meta.env.DEV) return;

  const externalId =
    row.listingNumber != null && row.listingNumber !== DASH
      ? String(row.listingNumber).trim()
      : row.externalId != null
        ? String(row.externalId).trim()
        : row.id != null
          ? String(row.id).trim()
          : "";

  const pcs = readPricingCurrentState(row);
  const allFinancialDash =
    isDashDisplay(state.lucroBrlText) &&
    state.lucroPercentDisplay == null &&
    isDashDisplay(state.price.currentPriceBrl) &&
    isDashDisplay(state.commissionBrlText) &&
    isDashDisplay(state.shippingBrlText) &&
    isDashDisplay(state.payoutBrlText) &&
    isDashDisplay(state.costBrlText) &&
    isDashDisplay(state.taxBrlText);

  const isHomolog = HOMOLOG_PRECIFICACOES_LISTING_IDS.has(externalId);
  if (!isHomolog && !allFinancialDash) return;

  const salePriceRaw =
    pcs?.current_effective_price_brl ?? pcs?.current_price_brl ?? pcs?.current_price ?? null;
  const profitRaw = pickContractMoneyField(pcs, "row_projected_profit_brl", "projected_profit_brl");
  const marginRaw = pickContractMoneyField(pcs, "row_projected_profit_percent", "projected_profit_percent");

  console.info("[S7_PRECIFICACOES_ROW_MISSING_FINANCIAL_DATA]", {
    listing_id: externalId || null,
    marketplace_account_id: row.marketplaceAccountId ?? pcs?.account_id ?? null,
    seller_id: row.sellerId ?? row.seller_id ?? null,
    product_id: row.productId ?? pcs?.product_id ?? null,
    product_variant_id: row.productVariantId ?? row.product_variant_id ?? null,
    sku: row.sku ?? pcs?.sku ?? null,
    raw_current_price: salePriceRaw,
    raw_cost:
      pickContractMoneyField(pcs, "row_projected_product_cost_brl", "current_product_cost") ??
      pcs?.product_cost_brl ??
      null,
    raw_commission: pickContractMoneyField(pcs, "row_projected_commission_brl", "projected_commission"),
    raw_freight: pickContractMoneyField(pcs, "row_projected_freight_brl", "projected_freight"),
    raw_tax: pickContractMoneyField(pcs, "row_projected_tax_brl", "projected_tax"),
    raw_payout: pickContractMoneyField(pcs, "row_projected_payout_brl", "projected_payout"),
    raw_profit: profitRaw,
    raw_margin: marginRaw,
    promotion_count: state.promotionsCount,
    competitor_count: state.competitorsCount,
    missing_data_flags: state.missingDataFlags,
    pricing_source: state.pricingSource,
    grid_promotion_active: row.promotionActive ?? null,
    grid_effective_sale_price_brl: row.effectiveSalePriceBrl ?? null,
    grid_commission_amount_brl: row.commissionAmountBrl ?? null,
    has_pricing_context: row.pricingContext != null,
    dash_reasons: {
      lucro_brl: isDashDisplay(state.lucroBrlText) ? dashReason(profitRaw, "profit_raw_empty") : null,
      lucro_percent: state.lucroPercentDisplay == null ? dashReason(marginRaw, "margin_raw_empty") : null,
      preco_atual: isDashDisplay(state.price.currentPriceBrl) ? dashReason(salePriceRaw, "current_price_empty") : null,
      comissao: isDashDisplay(state.commissionBrlText)
        ? dashReason(
            pickContractMoneyField(pcs, "row_projected_commission_brl", "projected_commission"),
            "commission_empty",
          )
        : null,
      frete: isDashDisplay(state.shippingBrlText)
        ? dashReason(
            pickContractMoneyField(pcs, "row_projected_freight_brl", "projected_freight"),
            "freight_empty",
          )
        : null,
      repasse: isDashDisplay(state.payoutBrlText)
        ? dashReason(
            pickContractMoneyField(pcs, "row_projected_payout_brl", "projected_payout"),
            "payout_empty",
          )
        : null,
      custo: isDashDisplay(state.costBrlText)
        ? dashReason(
            pickContractMoneyField(pcs, "row_projected_product_cost_brl", "current_product_cost") ??
              pcs?.product_cost_brl,
            "cost_empty",
          )
        : null,
      imposto: isDashDisplay(state.taxBrlText)
        ? dashReason(pickContractMoneyField(pcs, "row_projected_tax_brl", "projected_tax"), "tax_empty")
        : null,
    },
    compare_note: isHomolog
      ? "Homolog listing — compare with MLB6086602390 when hit uses persisted read-model"
      : null,
  });
}

/** @param {unknown} value */
function pickNonNegativeInt(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return Math.max(0, Math.trunc(Number(value)));
}

/** @param {Record<string, unknown> | null | undefined} row */
function readPricingCurrentState(row) {
  const pcs = row?.pricingCurrentState ?? row?.pricing_current_state;
  return pcs != null && typeof pcs === "object" ? /** @type {Record<string, unknown>} */ (pcs) : null;
}

/** @param {Record<string, unknown> | null | undefined} row */
function readPricingContext(row) {
  const pc = row?.pricingContext;
  return pc != null && typeof pc === "object" ? /** @type {Record<string, unknown>} */ (pc) : null;
}

/**
 * BRL decimal do contrato S7 (ex.: "78.60", "80,00") — só formatação visual.
 * Não reinterpreta ponto decimal como separador de milhar.
 * @param {unknown} raw
 */
function displayBrlFromApiContract(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  return formatBrlFromApiString(String(raw).trim().replace(",", "."));
}

/** @param {unknown} raw @returns {number | null} */
function parseApiPercentForDisplay(raw) {
  const dec = parseVendasFinancialDecimal(raw);
  return dec != null ? dec.toNumber() : null;
}

/** @param {Record<string, unknown> | null | undefined} pcs @param {string} rowKey @param {string} legacyKey */
function pickContractMoneyField(pcs, rowKey, legacyKey) {
  if (pcs == null) return null;
  const rowVal = pcs[rowKey];
  if (rowVal != null && String(rowVal).trim() !== "") return rowVal;
  const legacyVal = pcs[legacyKey];
  return legacyVal != null && String(legacyVal).trim() !== "" ? legacyVal : null;
}

/**
 * Preço atual — fonte exclusiva pricing_current_state (backend).
 * @param {Record<string, unknown>} row
 */
export function resolvePrecificacoesCurrentPrice(row) {
  const pcs = readPricingCurrentState(row);
  const effectiveRaw =
    pcs?.current_effective_price_brl ??
    pcs?.current_price_brl ??
    pcs?.current_price ??
    null;
  const regularRaw =
    pcs?.original_price_brl ??
    pcs?.regular_price_brl ??
    pcs?.current_regular_price ??
    null;
  const currentDec = parseVendasFinancialDecimal(effectiveRaw);
  const regularDec = parseVendasFinancialDecimal(regularRaw);
  const showRegular =
    regularRaw != null &&
    String(regularRaw).trim() !== "" &&
    effectiveRaw != null &&
    String(regularRaw).trim() !== String(effectiveRaw).trim() &&
    regularDec != null &&
    currentDec != null &&
    regularDec.gt(currentDec);

  return {
    currentPriceBrl: displayBrlFromApiContract(effectiveRaw),
    regularPriceBrl: showRegular ? displayBrlFromApiContract(regularRaw) : null,
    currentPriceDec: currentDec,
    isPromotionActive: pcs?.promotion_active === true,
  };
}

/**
 * Estado financeiro da lista Precificações — SOMENTE pricing_current_state.
 * Sem fallback histórico (contribution_profit, net_received, sales_order_items, etc.).
 * @param {Record<string, unknown>} row
 */
export function resolvePrecificacoesListCurrentState(row) {
  const pcs = readPricingCurrentState(row);
  const trace =
    pcs?.pricing_source_trace != null && typeof pcs.pricing_source_trace === "object"
      ? /** @type {Record<string, unknown>} */ (pcs.pricing_source_trace)
      : {};

  const price = resolvePrecificacoesCurrentPrice(row);
  const salePriceRaw =
    pcs?.current_effective_price_brl ?? pcs?.current_price_brl ?? pcs?.current_price ?? null;

  const profitRaw = pickContractMoneyField(pcs, "row_projected_profit_brl", "projected_profit_brl");
  const marginRaw = pickContractMoneyField(pcs, "row_projected_profit_percent", "projected_profit_percent");
  const profitDec = parseVendasFinancialDecimal(profitRaw);
  const marginPctNum = parseApiPercentForDisplay(marginRaw);

  const listingTypeLabel =
    pcs?.current_listing_type != null && String(pcs.current_listing_type).trim() !== ""
      ? String(pcs.current_listing_type).trim()
      : row.listingTypeLabel != null
        ? String(row.listingTypeLabel).trim()
        : null;

  const commissionPctRaw = pcs?.projected_commission_percent ?? null;
  const commissionPctLabel = formatarPercentualVendasComposicaoFromRaw(commissionPctRaw);
  const commissionSecondary =
    listingTypeLabel && commissionPctLabel
      ? `${listingTypeLabel} ${commissionPctLabel}`
      : commissionPctLabel ?? listingTypeLabel;

  const shippingSecondary = montarRotuloSecundarioPercentualSobreVenda({
    prefix: "Frete",
    amountRaw: pcs?.projected_freight ?? null,
    salePriceRaw,
  });

  const taxPctRaw = pcs?.projected_tax_percent ?? null;
  const taxSecondary = taxPctRaw
    ? `Imposto ${formatarPercentualVendasComposicaoFromRaw(taxPctRaw) ?? ""}`.trim()
    : montarRotuloSecundarioPercentualSobreVenda({
        prefix: "Imposto",
        amountRaw: pcs?.projected_tax ?? null,
        salePriceRaw,
      });

  const costSecondary = montarRotuloSecundarioPercentualSobreVenda({
    prefix: "Custo",
    amountRaw: pcs?.current_product_cost ?? null,
    salePriceRaw,
  });

  const lucroBrlText = displayBrlFromApiContract(profitRaw);
  const lucroPercentDisplay = formatCatalogPctVendasStyle(marginPctNum);
  const hasProjectedFinancials = profitDec != null || marginPctNum != null;
  const toneClass = hasProjectedFinancials
    ? getVendasTableFinancialHealthToneClass(marginPctNum ?? profitRaw)
    : "vendas-page__fin--empty";
  const valueClass = catalogVendasFinValueClass(toneClass);

  const promotions = resolveListingPromotionsCountWithSource(row);
  const competitors = resolveListingCompetitorsSnapshotWithSource(row);

  const state = {
    price,
    lucroBrlText,
    lucroPercentDisplay,
    marginPctNum,
    hasProjectedFinancials,
    toneClass,
    valueClass,
    payoutBrlText: displayBrlFromApiContract(pickContractMoneyField(pcs, "row_projected_payout_brl", "projected_payout")),
    commissionBrlText: displayBrlFromApiContract(
      pickContractMoneyField(pcs, "row_projected_commission_brl", "projected_commission"),
    ),
    commissionSecondary,
    shippingBrlText: displayBrlFromApiContract(
      pickContractMoneyField(pcs, "row_projected_freight_brl", "projected_freight"),
    ),
    shippingSecondary,
    taxBrlText: displayBrlFromApiContract(pickContractMoneyField(pcs, "row_projected_tax_brl", "projected_tax")),
    taxSecondary,
    costBrlText: displayBrlFromApiContract(
      pickContractMoneyField(pcs, "row_projected_product_cost_brl", "current_product_cost") ??
        pcs?.product_cost_brl ??
        null,
    ),
    costSecondary,
    promotionsCount: promotions.count,
    promotionsTooltip: resolveListingPromotionsTooltip(row, promotions.count),
    promotionsSource: promotions.source,
    competitorsCount: competitors.count,
    competitorsAbove: competitors.above,
    competitorsBelow: competitors.below,
    competitorsTooltip: competitors.tooltip,
    competitorsSource: competitors.source,
    pricingSource:
      trace.engine_source != null
        ? String(trace.engine_source)
        : trace.profit_source != null
          ? String(trace.profit_source)
          : "pricing_current_state.unavailable",
    selectedScenario:
      pcs?.row_selected_scenario != null
        ? String(pcs.row_selected_scenario)
        : pcs?.selected_listing_type != null
          ? String(pcs.selected_listing_type)
          : null,
    missingDataFlags: Array.isArray(pcs?.missing_data_flags) ? pcs.missing_data_flags : [],
  };

  logPrecificacoesRowMissingFinancialData(row, state);
  return state;
}

/** Compat — delega ao estado atual. */
export function resolvePrecificacoesProjectedFinancials(row) {
  const state = resolvePrecificacoesListCurrentState(row);
  return {
    lucroBrlText: state.lucroBrlText,
    lucroPercentDisplay: state.lucroPercentDisplay,
    marginPctNum: state.marginPctNum,
    hasProjectedFinancials: state.hasProjectedFinancials,
    toneClass: state.toneClass,
    valueClass: state.valueClass,
  };
}

/** @param {Record<string, unknown>} row */
function readProductCardMetrics(row) {
  const pcm = row.product_card_metrics;
  return pcm != null && typeof pcm === "object" ? /** @type {Record<string, unknown>} */ (pcm) : null;
}

/** @param {Record<string, unknown>} row @returns {{ count: number; source: string }} */
function resolveListingPromotionsCountWithSource(row) {
  const direct = pickNonNegativeInt(
    row.promotionsCount ?? row.activePromotionsCount ?? row.promotions_count,
  );
  if (direct != null) return { count: direct, source: "grid.active_promotions_count" };

  const pcm = readProductCardMetrics(row);
  const fromCard = pickNonNegativeInt(
    pcm?.active_promotions_count ?? pcm?.promotions_count ?? pcm?.promotionsCount,
  );
  if (fromCard != null) return { count: fromCard, source: "product_card_metrics" };

  const pc = readPricingContext(row);
  if (pc) {
    const fromCtx = pickNonNegativeInt(pc.promotions_count ?? pc.active_promotions_count);
    if (fromCtx != null) return { count: fromCtx, source: "pricing_context.promotions_count" };
  }

  const pcs = readPricingCurrentState(row);
  if (pcs?.promotion_active === true) return { count: 1, source: "pricing_current_state.promotion_active" };

  return { count: 0, source: "fallback_zero" };
}

/** @param {Record<string, unknown>} row */
export function resolveListingPromotionsCount(row) {
  return resolveListingPromotionsCountWithSource(row).count;
}

/** @param {Record<string, unknown>} row @param {number} [countOverride] */
export function resolveListingPromotionsTooltip(row, countOverride) {
  const count = countOverride ?? resolveListingPromotionsCount(row);
  if (count <= 0) return "Nenhuma promoção ativa neste anúncio.";
  return count === 1 ? "1 promoção ativa do anúncio." : `${count} promoções ativas do anúncio.`;
}

/** @param {Record<string, unknown>} row */
function resolveListingCompetitorsSnapshotWithSource(row) {
  const directCount = pickNonNegativeInt(
    row.competitorsCount ?? row.monitoredCompetitorsCount ?? row.competitors_count,
  );
  const above = pickNonNegativeInt(row.competitorsAboveCount ?? row.competitors_above_count) ?? 0;
  const below = pickNonNegativeInt(row.competitorsBelowCount ?? row.competitors_below_count) ?? 0;
  const source =
    row.competitionListSource != null
      ? String(row.competitionListSource)
      : row.competition_list_source != null
        ? String(row.competition_list_source)
        : directCount != null
          ? "grid.competitors_count"
          : "fallback_zero";

  const count = directCount ?? 0;
  let tooltip = "Concorrentes monitorados para este anúncio.";
  if (count > 0) {
    const parts = [`${count} concorrente${count === 1 ? "" : "s"} monitorado${count === 1 ? "" : "s"}.`];
    if (above > 0) parts.push(`Seu anúncio está acima de ${above}.`);
    if (below > 0) parts.push(`Seu anúncio está abaixo de ${below}.`);
    tooltip = parts.join(" ");
  }

  return { count, above, below, tooltip, source };
}

/** @param {Record<string, unknown>} row */
export function resolveListingCompetitorsCount(row) {
  return resolveListingCompetitorsSnapshotWithSource(row).count;
}

/** @param {Record<string, unknown>} row */
export function buildPrecificacoesListModalParityAuditPayload(row) {
  const state = resolvePrecificacoesListCurrentState(row);
  const pcs = readPricingCurrentState(row);
  const sourceContract =
    pcs?.contract_kind != null && String(pcs.contract_kind).trim() !== ""
      ? String(pcs.contract_kind).trim()
      : "pricing_current_state_projected_unit";

  return {
    listing_id: row.listingNumber ?? row.externalId ?? row.id ?? pcs?.external_listing_id ?? null,
    rendered_current_price: state.price.currentPriceBrl !== DASH ? state.price.currentPriceBrl : null,
    rendered_profit_brl: state.lucroBrlText !== DASH ? state.lucroBrlText : null,
    rendered_profit_percent: state.lucroPercentDisplay,
    rendered_payout: state.payoutBrlText !== DASH ? state.payoutBrlText : null,
    rendered_commission: state.commissionBrlText !== DASH ? state.commissionBrlText : null,
    rendered_freight: state.shippingBrlText !== DASH ? state.shippingBrlText : null,
    rendered_tax: state.taxBrlText !== DASH ? state.taxBrlText : null,
    rendered_cost: state.costBrlText !== DASH ? state.costBrlText : null,
    selected_scenario: state.selectedScenario,
    source_contract: sourceContract,
    from_pricing_current_state_projected_unit: sourceContract === "pricing_current_state_projected_unit",
    selected_promotion_strategy: pcs?.selected_promotion_strategy ?? null,
    selected_promotion_price_brl: pcs?.selected_promotion_price_brl ?? null,
    current_effective_price_brl: pcs?.current_effective_price_brl ?? pcs?.current_price_brl ?? null,
  };
}

export function buildPrecificacoesListAuditPayload(row) {
  const state = resolvePrecificacoesListCurrentState(row);
  const pcs = readPricingCurrentState(row);
  const trace = pcs?.pricing_source_trace ?? {};
  const sourceContract =
    pcs?.contract_kind != null && String(pcs.contract_kind).trim() !== ""
      ? String(pcs.contract_kind).trim()
      : "pricing_current_state_projected_unit";
  const fromProjectedUnit = sourceContract === "pricing_current_state_projected_unit";

  return {
    listing_id: row.listingNumber ?? row.externalId ?? row.id ?? pcs?.external_listing_id ?? null,
    sku: row.sku ?? pcs?.sku ?? null,
    account_id: row.marketplaceAccountId ?? pcs?.account_id ?? null,
    current_price_rendered: state.price.currentPriceBrl !== DASH ? state.price.currentPriceBrl : null,
    product_cost_rendered: state.costBrlText !== DASH ? state.costBrlText : null,
    profit_brl_rendered: state.lucroBrlText !== DASH ? state.lucroBrlText : null,
    profit_percent_rendered: state.lucroPercentDisplay,
    source_contract: sourceContract,
    from_pricing_current_state_projected_unit: fromProjectedUnit,
    money_scale: pcs?.money_scale ?? "BRL_DECIMAL",
    current_price_brl: state.price.currentPriceBrl !== DASH ? state.price.currentPriceBrl : null,
    regular_price_brl: state.price.regularPriceBrl,
    is_promotion_active: state.price.isPromotionActive,
    projected_profit_brl: state.lucroBrlText !== DASH ? state.lucroBrlText : null,
    projected_margin_pct: state.lucroPercentDisplay,
    payout_brl: state.payoutBrlText !== DASH ? state.payoutBrlText : null,
    commission_brl: state.commissionBrlText !== DASH ? state.commissionBrlText : null,
    commission_pct: state.commissionSecondary,
    shipping_brl: state.shippingBrlText !== DASH ? state.shippingBrlText : null,
    shipping_pct: state.shippingSecondary,
    tax_brl: state.taxBrlText !== DASH ? state.taxBrlText : null,
    tax_pct: state.taxSecondary,
    cost_brl: state.costBrlText !== DASH ? state.costBrlText : null,
    cost_pct: state.costSecondary,
    promotions_count: state.promotionsCount,
    competitors_count: state.competitorsCount,
    competitors_above_count: state.competitorsAbove,
    competitors_below_count: state.competitorsBelow,
    current_price_source: trace.current_price_source ?? null,
    fee_source: trace.fee_source ?? null,
    cost_source: trace.cost_source ?? null,
    tax_source: trace.tax_source ?? null,
    pricing_source: state.pricingSource,
    competitors_source: state.competitorsSource,
    promotions_source: state.promotionsSource,
    missing_data_flags: state.missingDataFlags,
  };
}
