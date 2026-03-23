/**
 * SKU por variação: obrigatório + único entre não vazios (trim).
 * Usado no ProductForm (UX) e no cálculo de progresso.
 * @param {Array<{ id: string, sku?: string }>} variantRows
 * @returns {Record<string, string>}
 */
export function computeVariantSkuErrors(variantRows) {
  const out = {};
  if (!Array.isArray(variantRows) || variantRows.length === 0) return out;

  const countBySku = new Map();
  for (const r of variantRows) {
    const t = String(r?.sku ?? "").trim();
    if (t) countBySku.set(t, (countBySku.get(t) || 0) + 1);
  }

  for (const r of variantRows) {
    if (!r?.id) continue;
    const t = String(r?.sku ?? "").trim();
    if (!t) out[r.id] = "SKU é obrigatório.";
    else if (countBySku.get(t) > 1) out[r.id] = "SKU duplicado.";
  }
  return out;
}
