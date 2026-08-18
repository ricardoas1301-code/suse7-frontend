// ======================================================================
// Percentual sobre valor da venda — somente exibição na lista /vendas.
// Cálculo com Decimal; não altera SSOT, APIs ou persistência.
// ======================================================================

import Decimal from "decimal.js";
import { pickSaleListingTypeLabel } from "../../../components/sales/saleRayxFinancialPickers.js";

const ROUND = Decimal.ROUND_HALF_UP;
const COMPOSITION_PERCENT_DECIMALS = 2;

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
export function parseVendasFinancialDecimal(raw) {
  if (raw == null) return null;
  const text = String(raw).trim().replace("%", "");
  if (!text) return null;
  try {
    const dec = new Decimal(text.replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/**
 * Percentual do valor sobre o preço da venda da linha — exibição apenas.
 * @param {unknown} amountRaw
 * @param {unknown} salePriceRaw
 * @returns {Decimal | null}
 */
export function calcularPercentualSobreVendaExibicao(amountRaw, salePriceRaw) {
  const amount = parseVendasFinancialDecimal(amountRaw);
  const salePrice = parseVendasFinancialDecimal(salePriceRaw);
  if (amount == null || salePrice == null || salePrice.lte(0)) return null;
  return amount.div(salePrice).times(100);
}

/** @param {string} intStr */
function formatarInteiroPtBr(intStr) {
  const neg = intStr.startsWith("-");
  const digits = neg ? intStr.slice(1) : intStr;
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return neg ? `-${formatted}` : formatted;
}

/**
 * Subtítulos de composição (Comissão, Frete, Imposto, Custo) — 2 casas decimais.
 * @param {Decimal | null | undefined} pctDec
 * @returns {string | null} ex.: "16,50%"
 */
export function formatarPercentualVendasComposicaoDetalhe(pctDec) {
  if (pctDec == null || !pctDec.isFinite()) return null;
  const rounded = pctDec.toDecimalPlaces(COMPOSITION_PERCENT_DECIMALS, ROUND);
  const fixed = rounded.toFixed(COMPOSITION_PERCENT_DECIMALS);
  const [intPart, decPartRaw] = fixed.split(".");
  const decPart = decPartRaw.replace(/0+$/, "");
  if (!decPart) return `${formatarInteiroPtBr(intPart)}%`;
  return `${formatarInteiroPtBr(intPart)},${decPart}%`;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function formatarPercentualVendasComposicaoFromRaw(raw) {
  return formatarPercentualVendasComposicaoDetalhe(parseVendasFinancialDecimal(raw));
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {Record<string, unknown> | null}
 */
function pickMarketplaceRevenue(fin) {
  if (!fin || typeof fin !== "object") return null;
  return fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
    ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
    : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {Record<string, unknown> | null}
 */
function pickMarketplaceFeeObject(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin);
  if (mr?.marketplace_fee && typeof mr.marketplace_fee === "object") {
    return /** @type {Record<string, unknown>} */ (mr.marketplace_fee);
  }
  if (fin.marketplace_fee && typeof fin.marketplace_fee === "object") {
    return /** @type {Record<string, unknown>} */ (fin.marketplace_fee);
  }
  return null;
}

/**
 * Linha 2 da coluna Comissão — tipo + percentual (ex.: "Premium 16,5%").
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickVendasCommissionSecondaryLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin) ?? {};
  const marketplaceFee = pickMarketplaceFeeObject(fin);
  const feePercentRaw =
    (marketplaceFee?.percentage != null ? String(marketplaceFee.percentage) : null) ??
    (mr.marketplace_fee_percent != null ? String(mr.marketplace_fee_percent) : null) ??
    (fin.marketplace_fee_percent != null ? String(fin.marketplace_fee_percent) : null);

  const listingTypeLabel = pickSaleListingTypeLabel(fin);
  const pctLabel = formatarPercentualVendasComposicaoFromRaw(feePercentRaw);

  if (listingTypeLabel && pctLabel) return `${listingTypeLabel} ${pctLabel}`;
  if (listingTypeLabel) return listingTypeLabel;
  if (pctLabel) return pctLabel;
  return null;
}

/**
 * Linha 2 da coluna Imposto — ex.: "Imposto 18%".
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickVendasImpostoSecondaryLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;
  const pctLabel = formatarPercentualVendasComposicaoFromRaw(
    internalCosts?.tax_percent_applied ?? fin.tax_percent_applied,
  );
  if (!pctLabel) return null;
  return `Imposto ${pctLabel}`;
}

/**
 * @param {{
 *   prefix: string;
 *   amountRaw: unknown;
 *   salePriceRaw: unknown;
 *   backendPercentRaw?: unknown;
 * }} opts
 * @returns {string | null}
 */
export function montarRotuloSecundarioPercentualSobreVenda({
  prefix,
  amountRaw,
  salePriceRaw,
  backendPercentRaw,
}) {
  if (parseVendasFinancialDecimal(amountRaw) == null) return null;

  const backendPct = parseVendasFinancialDecimal(backendPercentRaw);
  const pctDec =
    backendPct != null ? backendPct : calcularPercentualSobreVendaExibicao(amountRaw, salePriceRaw);
  const pctLabel = formatarPercentualVendasComposicaoDetalhe(pctDec);
  if (!pctLabel) return null;
  return `${prefix} ${pctLabel}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickVendasFreteSecondaryLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  return montarRotuloSecundarioPercentualSobreVenda({
    prefix: "Frete",
    amountRaw: fin.shipping_cost,
    salePriceRaw: fin.sale_price,
    backendPercentRaw: fin.shipping_percent_of_sale ?? fin.shipping_cost_percent_of_sale,
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
export function pickVendasCustoSecondaryLabel(fin, row) {
  const amountRaw =
    row?.product_cost_only_brl ??
    (fin && typeof fin === "object" ? fin.product_cost_only_brl : null);
  const salePriceRaw = fin && typeof fin === "object" ? fin.sale_price : null;
  const backendPercentRaw =
    (fin && typeof fin === "object"
      ? fin.product_cost_percent_of_sale ?? fin.product_cost_only_percent_of_sale
      : null) ?? row?.product_cost_percent_of_sale;

  return montarRotuloSecundarioPercentualSobreVenda({
    prefix: "Custo",
    amountRaw,
    salePriceRaw,
    backendPercentRaw,
  });
}
