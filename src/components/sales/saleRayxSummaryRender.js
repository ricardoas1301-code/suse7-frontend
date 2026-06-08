// ======================================================
// Modelo de render do resumo S7 — alinhamento e cores (Raio-x).
// ======================================================

import { pickSaleNumberCopyText } from "./saleRayxGeneralDisplay";
import { getSaleRayxMarginSemantic } from "./saleRayxMarginSemantic";
import { collectSaleRayxContingencyMargin } from "./saleRayxPricingVariables";
import {
  pickSaleRayxInternalTaxPercentDetail,
  pickSaleRayxMarketplaceFeePercent,
} from "./saleRayxMarketplaceFeeDetail";
import { DASH, formatBrlApi, formatDatePt } from "./saleRayxFormat";
const SALE_RAYX_SUMMARY_NOT_AVAILABLE = "Não disponível";

/** Cores alinhadas ao card financeiro do Raio-x. */
export const SALE_RAYX_SUMMARY_COLORS = {
  text: "#111827",
  negative: "#dc2626",
  positive: "#16a34a",
  key: "#ff8533",
  detail: "#6b7280",
};

/** Referência legada da área entre rótulo e valor (reduzida em 66% no layout novo). */
const LEGACY_MONEY_LABEL_SPAN_PX = 600;

const FONT_SUMMARY_REGULAR = "13px Arial, Helvetica, sans-serif";
const FONT_SUMMARY_BOLD = "bold 13px Arial, Helvetica, sans-serif";

/**
 * @typedef {{
 *   maxLabelWidth: number;
 *   maxValueWidth: number;
 *   labelValueGap: number;
 *   valueRightX: number;
 *   contentWidth: number;
 * }} SaleRayxSummaryMoneyLayout
 */

/** @typedef {'neutral' | 'key' | 'negative' | 'positive' | 'margin'} SummaryMoneyTone */

/**
 * @typedef {{
 *   kind: "blank";
 * } | {
 *   kind: "text";
 *   text: string;
 * } | {
 *   kind: "field";
 *   label: string;
 *   value: string;
 *   colonSpaces?: number;
 * } | {
 *   kind: "money";
 *   label: string;
 *   value: string;
 *   tone: SummaryMoneyTone;
 *   detail?: string | null;
 * } | {
 *   kind: "health";
 *   value: string;
 * }} SummaryRenderLine
 */

/**
 * @typedef {{
 *   marginPercentRaw: unknown;
 *   lines: SummaryRenderLine[];
 * }} SaleRayxSummaryRenderModel
 */

/** @param {unknown} v */
function safeStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** @param {string | null | undefined} formatted */
function orNotAvailable(formatted) {
  if (formatted == null || formatted === DASH || String(formatted).trim() === "") {
    return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  }
  return formatted;
}

/** @param {unknown} raw */
function fmtBrl(raw) {
  return orNotAvailable(formatBrlApi(raw != null ? String(raw) : null));
}

/** @param {unknown} raw */
function fmtBrlNegative(raw) {
  if (raw == null || String(raw).trim() === "") return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  return `-${formatBrlApi(String(Math.abs(n)))}`;
}

/** @param {unknown} raw */
function parsePositiveMoney(raw) {
  if (raw == null || String(raw).trim() === "") return 0;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @param {unknown} raw */
function shouldShowShippingLine(raw) {
  return parsePositiveMoney(raw) > 0;
}

/** @param {unknown} raw */
function shouldShowShippingBonusLine(raw) {
  return parsePositiveMoney(raw) > 0;
}

/** @param {unknown} raw @param {boolean} rebateIsExplicit */
function fmtBrlPositiveDiscounts(raw, rebateIsExplicit) {
  if (!rebateIsExplicit) return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  if (raw == null || String(raw).trim() === "") return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  return `+${formatBrlApi(String(Math.abs(n)))}`;
}

/**
 * Igual ao card do Raio-x: só exibe descontos/bônus com rebate explícito e valor &gt; 0.
 * @param {{ rebateIsExplicit: boolean; positiveAdjustments: unknown }} snap
 */
function shouldShowDiscountsLine(snap) {
  if (!snap.rebateIsExplicit) return false;
  if (snap.positiveAdjustments == null || String(snap.positiveAdjustments).trim() === "") return false;
  const n = Number(String(snap.positiveAdjustments).replace(",", "."));
  return Number.isFinite(n) && n > 0;
}

/**
 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx
 * @param {SaleRayxSummaryRenderModel} model
 * @returns {SaleRayxSummaryMoneyLayout}
 */
export function computeMoneyColumnLayout(ctx, model) {
  ctx.font = FONT_SUMMARY_REGULAR;
  let maxLabelWidth = 0;
  let maxValueWidth = 0;

  for (const row of model.lines) {
    if (row.kind !== "money") continue;
    maxLabelWidth = Math.max(maxLabelWidth, ctx.measureText(row.label).width);
    ctx.font = FONT_SUMMARY_BOLD;
    maxValueWidth = Math.max(maxValueWidth, ctx.measureText(row.value).width);
    ctx.font = FONT_SUMMARY_REGULAR;
  }

  const legacyGap = Math.max(0, LEGACY_MONEY_LABEL_SPAN_PX - maxLabelWidth);
  const labelValueGap = Math.max(8, Math.round(legacyGap * 0.34));
  const contentWidth = maxLabelWidth + labelValueGap + maxValueWidth;

  return {
    maxLabelWidth,
    maxValueWidth,
    labelValueGap,
    valueRightX: contentWidth,
    contentWidth,
  };
}

/** @param {unknown} raw */
function fmtPercent2(raw) {
  if (raw == null || String(raw).trim() === "") return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** @param {unknown} raw */
function fmtQty(raw) {
  if (raw == null || String(raw).trim() === "") return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  return Math.trunc(n).toLocaleString("pt-BR");
}

/** @param {unknown} raw */
function fmtDate(raw) {
  return orNotAvailable(formatDatePt(raw != null ? String(raw) : null));
}

/** @param {unknown} raw */
function fmtText(raw) {
  return safeStr(raw) ?? SALE_RAYX_SUMMARY_NOT_AVAILABLE;
}

/**
 * Margem do resultado: &lt;0 vermelho, 0–5% laranja, &gt;5% verde (mesmo Raio-x).
 * @param {unknown} marginPercentRaw
 */
export function getMarginResultColor(marginPercentRaw) {
  if (marginPercentRaw == null || String(marginPercentRaw).trim() === "") {
    return SALE_RAYX_SUMMARY_COLORS.text;
  }
  const n = Number(String(marginPercentRaw).replace(",", "."));
  if (!Number.isFinite(n)) return SALE_RAYX_SUMMARY_COLORS.text;
  if (n < 0) return SALE_RAYX_SUMMARY_COLORS.negative;
  if (n < 5) return SALE_RAYX_SUMMARY_COLORS.key;
  return SALE_RAYX_SUMMARY_COLORS.positive;
}

/**
 * @param {SummaryMoneyTone} tone
 * @param {unknown} marginPercentRaw
 */
export function summaryToneToColor(tone, marginPercentRaw) {
  if (tone === "negative") return SALE_RAYX_SUMMARY_COLORS.negative;
  if (tone === "positive") return SALE_RAYX_SUMMARY_COLORS.positive;
  if (tone === "key") return SALE_RAYX_SUMMARY_COLORS.key;
  if (tone === "margin") return getMarginResultColor(marginPercentRaw);
  return SALE_RAYX_SUMMARY_COLORS.text;
}

/**
 * @param {Record<string, unknown>} fin
 */
function pickFinancialSnapshot(fin) {
  const mr =
    fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : {};

  const marketplaceFee =
    (mr.marketplace_fee && typeof mr.marketplace_fee === "object"
      ? mr.marketplace_fee
      : fin.marketplace_fee && typeof fin.marketplace_fee === "object"
        ? fin.marketplace_fee
        : null) ?? null;

  const commissionRaw =
    (marketplaceFee?.amount_brl != null ? String(marketplaceFee.amount_brl) : null) ??
    mr.marketplace_fee_amount_brl ??
    fin.commission ??
    fin.marketplace_fee_amount;

  const shippingRaw = mr.shipping_amount_brl ?? fin.shipping_cost ?? fin.shipping_cost_amount;
  const shippingBonusRaw = mr.shipping_bonus_brl ?? fin.shipping_bonus_brl;

  const rebateObj =
    mr.marketplace_rebate && typeof mr.marketplace_rebate === "object"
      ? /** @type {Record<string, unknown>} */ (mr.marketplace_rebate)
      : fin.marketplace_rebate && typeof fin.marketplace_rebate === "object"
        ? /** @type {Record<string, unknown>} */ (fin.marketplace_rebate)
        : null;

  const rebateIsExplicit = rebateObj?.confidence === "explicit";
  const positiveAdjustments =
    rebateIsExplicit && rebateObj?.amount_brl != null ? String(rebateObj.amount_brl) : null;

  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;

  const commissionDetail = pickSaleRayxMarketplaceFeePercent(fin, mr);
  const internalTaxPercentDetail = pickSaleRayxInternalTaxPercentDetail(fin);

  return {
    salePrice: mr.gross_sale_amount_brl ?? fin.sale_price ?? fin.gross_amount,
    commissionRaw,
    commissionDetail,
    shippingRaw,
    shippingBonusRaw,
    positiveAdjustments,
    rebateIsExplicit,
    netReceived: mr.net_received_amount_brl ?? fin.net_received ?? fin.net_received_amount,
    productCost: internalCosts?.product_cost_brl ?? fin.product_cost_only_brl ?? fin.product_cost_amount,
    internalTaxes: internalCosts?.internal_tax_brl ?? fin.internal_taxes ?? fin.internal_tax_amount,
    internalTaxPercentDetail,
    operationPackaging:
      internalCosts?.operation_packaging_cost_brl ?? fin.operation_packaging_cost,
  };
}

/**
 * @param {{ value: string; percentDetail: string | null }} row
 */
function shouldShowRayxReceiptMoneyLine(row) {
  const hasValue = row.value != null && row.value !== DASH && row.value !== SALE_RAYX_SUMMARY_NOT_AVAILABLE;
  const hasDetail = row.percentDetail != null && String(row.percentDetail).trim() !== "";
  return hasValue || hasDetail;
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 * }} ctx
 * @returns {SaleRayxSummaryRenderModel}
 */
export function buildSaleRayxSummaryRenderModel(ctx) {
  const g = ctx.general && typeof ctx.general === "object" ? ctx.general : {};
  const p = ctx.product && typeof ctx.product === "object" ? ctx.product : {};
  const fin = ctx.financial && typeof ctx.financial === "object" ? ctx.financial : {};
  const pm = ctx.profitMargin && typeof ctx.profitMargin === "object" ? ctx.profitMargin : {};

  const productTitle =
    ctx.listingTitle != null && String(ctx.listingTitle).trim() !== ""
      ? String(ctx.listingTitle).trim()
      : p.title != null
        ? String(p.title).trim()
        : SALE_RAYX_SUMMARY_NOT_AVAILABLE;

  const listingId = safeStr(p.listing_id_display ?? g.listing_id_display);
  const sku = safeStr(p.sku_display ?? g.sku_display);
  const listingSkuLine = `${listingId ?? SALE_RAYX_SUMMARY_NOT_AVAILABLE} | SKU ${sku ?? SALE_RAYX_SUMMARY_NOT_AVAILABLE}`;

  const orderRaw = pickSaleNumberCopyText(g) ?? safeStr(g.external_order_id);
  const orderValue = orderRaw ? `#${orderRaw.replace(/^#/, "")}` : SALE_RAYX_SUMMARY_NOT_AVAILABLE;

  const snap = pickFinancialSnapshot(fin);
  const profitValue = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;
  const marginValue = pm.margin_percent ?? fin.margin_percent;
  const finResult = fin.result && typeof fin.result === "object" ? /** @type {Record<string, unknown>} */ (fin.result) : null;
  const healthLabelFromApi =
    pm.health_label ?? fin.health_label ?? finResult?.health_label ?? null;

  const { healthLabel: healthLabelFallback } = getSaleRayxMarginSemantic(marginValue);
  const healthDisplay =
    healthLabelFromApi != null && String(healthLabelFromApi).trim() !== ""
      ? String(healthLabelFromApi).trim()
      : healthLabelFallback != null && String(healthLabelFallback).trim() !== ""
        ? String(healthLabelFallback).trim()
        : SALE_RAYX_SUMMARY_NOT_AVAILABLE;

  const contingencyLines = collectSaleRayxContingencyMargin(fin).filter(shouldShowRayxReceiptMoneyLine);

  /** @type {SummaryRenderLine[]} */
  const lines = [
    { kind: "field", label: "Conta marketplace", value: fmtText(g.account_alias) },
    { kind: "field", label: "Anúncio", value: listingSkuLine },
    { kind: "field", label: "Produto", value: productTitle },
    { kind: "blank" },
    { kind: "field", label: "Pedido", value: orderValue, colonSpaces: 2 },
    { kind: "field", label: "Data da venda", value: fmtDate(g.sale_date) },
    { kind: "field", label: "Quantidade", value: fmtQty(g.quantity) },
    { kind: "field", label: "Cliente", value: fmtText(g.buyer_display_name) },
    { kind: "blank" },
    { kind: "text", text: "💰 RECEITA DO MARKETPLACE" },
    { kind: "money", label: "Valor da venda", value: fmtBrl(snap.salePrice), tone: "key" },
    {
      kind: "money",
      label: "Tarifa / comissão",
      value: fmtBrlNegative(snap.commissionRaw),
      tone: "negative",
      detail: snap.commissionDetail,
    },
  ];

  if (shouldShowShippingLine(snap.shippingRaw)) {
    lines.push({
      kind: "money",
      label: "Envios",
      value: fmtBrlNegative(snap.shippingRaw),
      tone: "negative",
    });
  }

  if (shouldShowShippingBonusLine(snap.shippingBonusRaw)) {
    lines.push({
      kind: "money",
      label: "Bônus por envio",
      value: fmtBrl(snap.shippingBonusRaw),
      tone: "positive",
    });
  }

  if (shouldShowDiscountsLine(snap)) {
    lines.push({
      kind: "money",
      label: "Descontos e bônus",
      value: fmtBrlPositiveDiscounts(snap.positiveAdjustments, snap.rebateIsExplicit),
      tone: "positive",
    });
  }

  lines.push({ kind: "money", label: "Valor recebido", value: fmtBrl(snap.netReceived), tone: "key" });

  if (contingencyLines.length > 0) {
    lines.push({ kind: "blank" }, { kind: "text", text: "Custos operacionais" });
    for (const row of contingencyLines) {
      lines.push({
        kind: "money",
        label: row.label,
        value:
          row.value != null && row.value !== DASH
            ? row.value
            : SALE_RAYX_SUMMARY_NOT_AVAILABLE,
        tone: "negative",
        detail: row.percentDetail,
      });
    }
  }

  const productCostValue = fmtBrlNegative(snap.productCost);
  const internalTaxesValue = fmtBrlNegative(snap.internalTaxes);
  const operationPackagingValue = fmtBrlNegative(snap.operationPackaging);

  lines.push({ kind: "blank" }, { kind: "text", text: "🏭 CUSTOS INTERNOS" });

  if (productCostValue !== SALE_RAYX_SUMMARY_NOT_AVAILABLE) {
    lines.push({ kind: "money", label: "Custo do produto", value: productCostValue, tone: "negative" });
  }
  if (internalTaxesValue !== SALE_RAYX_SUMMARY_NOT_AVAILABLE) {
    lines.push({
      kind: "money",
      label: "Impostos internos",
      value: internalTaxesValue,
      tone: "negative",
      detail: snap.internalTaxPercentDetail,
    });
  }
  if (operationPackagingValue !== SALE_RAYX_SUMMARY_NOT_AVAILABLE) {
    lines.push({
      kind: "money",
      label: "Operação + embalagem",
      value: operationPackagingValue,
      tone: "negative",
    });
  }

  lines.push(
    { kind: "blank" },
    { kind: "text", text: "📈 RESULTADO" },
    { kind: "money", label: "Lucro", value: fmtBrl(profitValue), tone: "margin" },
    { kind: "money", label: "Margem", value: fmtPercent2(marginValue), tone: "margin" },
    { kind: "blank" },
    { kind: "health", value: healthDisplay },
    { kind: "blank" },
    { kind: "text", text: "Gerado por Suse7 Precifica" },
    // Rodapé oficial Suse7 (P_2.8.12F): tagline curta padronizada.
    { kind: "text", text: "Inteligência em Vendas" },
  );

  return { marginPercentRaw: marginValue, lines };
}

/**
 * @param {SaleRayxSummaryRenderModel} model
 * @returns {string[]}
 */
export function renderModelToBodyLines(model) {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const ctx = canvas?.getContext("2d");
  const layout =
    ctx != null
      ? computeMoneyColumnLayout(ctx, model)
      : {
          maxLabelWidth: 200,
          maxValueWidth: 96,
          labelValueGap: 12,
          valueRightX: 308,
          contentWidth: 308,
        };

  /** @type {string[]} */
  const out = [];

  for (const row of model.lines) {
    if (row.kind === "blank") {
      out.push("");
      continue;
    }
    if (row.kind === "text") {
      out.push(row.text);
      continue;
    }
    if (row.kind === "field") {
      const spaces = row.colonSpaces ?? 1;
      const gap = spaces > 1 ? " ".repeat(spaces) : " ";
      out.push(`${row.label}:${gap}${row.value}`);
      continue;
    }
    if (row.kind === "money" && ctx != null) {
      ctx.font = FONT_SUMMARY_REGULAR;
      const labelW = ctx.measureText(row.label).width;
      const dots = Math.max(2, Math.round((layout.labelValueGap + (layout.maxLabelWidth - labelW)) / 3));
      out.push(`${row.label}${".".repeat(dots)} ${row.value}`);
      if (row.detail != null && String(row.detail).trim() !== "") {
        out.push(`  ${String(row.detail).trim()}`);
      }
      continue;
    }
    if (row.kind === "money") {
      out.push(`${row.label}  ${row.value}`);
      if (row.detail != null && String(row.detail).trim() !== "") {
        out.push(`  ${String(row.detail).trim()}`);
      }
      continue;
    }
    if (row.kind === "health") {
      out.push(`Saúde da venda: ${row.value}`);
    }
  }

  return out;
}
