// ======================================================
// Compartilhar / imprimir — Raio-x da venda.
// ======================================================

import { DASH, formatBrlApi, formatDatePt, formatPercentApi } from "./saleRayxFormat";

const PRINT_ROOT_CLASS = "vendas-sale-rayx--printing";

/**
 * @param {{
 *   listingTitle?: string | null;
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   itemId?: string | null;
 * }} ctx
 */
export function buildSaleRayxShareText(ctx) {
  const g = ctx.general && typeof ctx.general === "object" ? ctx.general : {};
  const p = ctx.product && typeof ctx.product === "object" ? ctx.product : {};
  const fin = ctx.financial && typeof ctx.financial === "object" ? ctx.financial : {};
  const pm = ctx.profitMargin && typeof ctx.profitMargin === "object" ? ctx.profitMargin : {};

  const title =
    ctx.listingTitle != null && String(ctx.listingTitle).trim() !== ""
      ? String(ctx.listingTitle).trim()
      : p.title != null
        ? String(p.title).trim()
        : "Venda";

  const order =
    g.external_order_id != null && String(g.external_order_id).trim() !== ""
      ? String(g.external_order_id).trim()
      : DASH;

  const profit = formatBrlApi(String(pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount ?? ""));
  const margin = formatPercentApi(String(pm.margin_percent ?? fin.margin_percent ?? ""));
  const salePrice = formatBrlApi(String(fin.sale_price ?? fin.gross_amount ?? ""));

  const lines = [
    "Raio-x da venda — Suse7",
    "",
    title,
    `Pedido: ${order}`,
    `Data: ${formatDatePt(g.sale_date != null ? String(g.sale_date) : null)}`,
    "",
    `Valor da venda: ${salePrice}`,
    `Lucro: ${profit}`,
    `Margem: ${margin}`,
  ];

  if (ctx.itemId) {
    lines.push("", `Referência interna: ${ctx.itemId}`);
  }

  return lines.join("\n");
}

export function printSaleRayx() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.add(PRINT_ROOT_CLASS);
  const cleanup = () => root.classList.remove(PRINT_ROOT_CLASS);
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}

/**
 * @param {string} text
 */
export function openWhatsAppShare(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * @param {string} subject
 * @param {string} body
 */
export function openEmailShare(subject, body) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

/**
 * @param {{ title: string; text: string }} payload
 * @returns {Promise<boolean>}
 */
export async function tryNativeShare(payload) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && err.name === "AbortError") return true;
    return false;
  }
}
