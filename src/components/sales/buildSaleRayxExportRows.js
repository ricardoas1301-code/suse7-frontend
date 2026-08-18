// ======================================================
// Dados compartilhados — export Excel do Raio-x.
// ======================================================

import { formatBrlApi, formatDatePt, DASH } from "./saleRayxFormat";
import {
  pickSaleNumberCopyText,
  pickSaleStatusLabel,
  pickSaleOriginLabel,
  pickFulfillmentDisplay,
} from "./saleRayxGeneralDisplay";
import { getSaleRayxMarginSemantic } from "./saleRayxMarginSemantic";
import {
  pickSaleMarketplaceFeeBrl,
  pickSaleInternalTaxBrl,
} from "./saleRayxFinancialPickers";

/** @param {string | null | undefined} raw */
function fmtPctApi(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** @param {unknown} raw */
function fmtText(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  return String(raw).trim();
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 */
function pickFinancialFields(fin) {
  if (!fin || typeof fin !== "object") {
    return {
      salePrice: null,
      shipping: null,
      netReceived: null,
      productCost: null,
      operationPackaging: null,
    };
  }
  const mr =
    fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : null;
  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;

  return {
    salePrice: mr?.gross_sale_amount_brl ?? fin.sale_price ?? fin.gross_amount,
    shipping: mr?.shipping_amount_brl ?? fin.shipping_cost ?? fin.shipping_cost_amount,
    netReceived: mr?.net_received_amount_brl ?? fin.net_received ?? fin.net_received_amount,
    productCost: internalCosts?.product_cost_brl ?? fin.product_cost_only_brl ?? fin.product_cost_amount,
    operationPackaging:
      internalCosts?.operation_packaging_cost_brl ?? fin.operation_packaging_cost,
  };
}

/**
 * @param {string | null | undefined} saleNumber
 */
export function buildSaleRayxExportBasename(saleNumber) {
  const raw = saleNumber != null ? String(saleNumber).trim().replace(/^#/, "") : "venda";
  const safe = raw.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "venda";
  return safe;
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 * }} ctx
 */
export function buildSaleRayxExportRows(ctx) {
  const g = ctx.general && typeof ctx.general === "object" ? ctx.general : {};
  const p = ctx.product && typeof ctx.product === "object" ? ctx.product : {};
  const fin = ctx.financial && typeof ctx.financial === "object" ? ctx.financial : {};
  const pm = ctx.profitMargin && typeof ctx.profitMargin === "object" ? ctx.profitMargin : {};

  const saleNumber = pickSaleNumberCopyText(g);
  const productTitle =
    ctx.listingTitle != null && String(ctx.listingTitle).trim() !== ""
      ? String(ctx.listingTitle).trim()
      : p.title != null
        ? String(p.title).trim()
        : DASH;

  const marginRaw = pm.margin_percent ?? fin.margin_percent;
  const profitRaw = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;
  const finResult = fin.result && typeof fin.result === "object" ? /** @type {Record<string, unknown>} */ (fin.result) : null;
  const healthFromApi = pm.health_label ?? fin.health_label ?? finResult?.health_label ?? null;
  const { healthLabel: healthFallback } = getSaleRayxMarginSemantic(marginRaw);
  const healthLabel =
    healthFromApi != null && String(healthFromApi).trim() !== ""
      ? String(healthFromApi).trim()
      : healthFallback ?? DASH;

  const snap = pickFinancialFields(fin);
  const commissionRaw = pickSaleMarketplaceFeeBrl(fin);
  const taxRaw = pickSaleInternalTaxBrl(fin);

  const marketplaceLabel =
    g.marketplace_label != null && String(g.marketplace_label).trim() !== ""
      ? String(g.marketplace_label).trim()
      : g.marketplace != null
        ? String(g.marketplace).trim()
        : DASH;

  const headers = [
    "Venda nº",
    "Data da venda",
    "Cliente",
    "Conta marketplace",
    "Marketplace",
    "SKU",
    "Produto",
    "Status da venda",
    "Origem da venda",
    "Entrega",
    "Valor da venda",
    "Tarifa / comissão",
    "Envios",
    "Valor recebido",
    "Custo do produto",
    "Impostos internos",
    "Operação + embalagem",
    "Lucro",
    "Margem",
    "Saúde da venda",
  ];

  const row = [
    saleNumber ? `#${String(saleNumber).replace(/^#/, "")}` : DASH,
    formatDatePt(g.sale_date != null ? String(g.sale_date) : null),
    fmtText(g.buyer_display_name),
    fmtText(g.account_alias),
    marketplaceLabel,
    fmtText(p.sku_display ?? g.sku_display),
    productTitle,
    pickSaleStatusLabel(g) ?? DASH,
    pickSaleOriginLabel(g) ?? DASH,
    pickFulfillmentDisplay(g).label,
    formatBrlApi(snap.salePrice != null ? String(snap.salePrice) : null),
    formatBrlApi(commissionRaw),
    formatBrlApi(snap.shipping != null ? String(snap.shipping) : null),
    formatBrlApi(snap.netReceived != null ? String(snap.netReceived) : null),
    formatBrlApi(snap.productCost != null ? String(snap.productCost) : null),
    formatBrlApi(taxRaw),
    formatBrlApi(snap.operationPackaging != null ? String(snap.operationPackaging) : null),
    formatBrlApi(profitRaw != null ? String(profitRaw) : null),
    fmtPctApi(marginRaw),
    healthLabel,
  ];

  return {
    headers,
    row,
    saleNumber,
    xlsxFilename: `Suse7 - Raio-X da Venda ${String(saleNumber ?? "")
      .replace(/^#/, "")
      .trim() || "venda"}.xlsx`,
  };
}
