/** Rótulos amigáveis para `missing_fields` (GET /api/ml/listings). */
const MISSING_PRODUCT_FIELD_LABELS = /** @type {const} */ ({
  name: "Nome do produto",
  sku: "SKU",
  cost_price: "Custo do produto",
});

/**
 * @param {unknown} fields
 */
export function formatMissingProductFieldsTooltip(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return "";
  const lines = fields.map((f) => {
    const k = String(f);
    return `- ${MISSING_PRODUCT_FIELD_LABELS[k] ?? k}`;
  });
  return `Faltando:\n${lines.join("\n")}`;
}
