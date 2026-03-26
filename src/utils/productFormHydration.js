// ======================================================================
// Hidratação ProductForm ← linha products (Supabase / API)
// Manter alinhado com o state inicial em ProductForm.jsx (campos do produto).
// ======================================================================

/**
 * Remove relacionamentos aninhados e chaves null/undefined para o merge
 * em `setProduct` não apagar defaults com null nem poluir com joins.
 *
 * @param {Record<string, unknown>|null|undefined} row
 * @returns {Record<string, unknown>}
 */
export function pickProductFieldsForForm(row) {
  if (!row || typeof row !== "object") return {};
  const { product_variants, ...rest } = row;
  void product_variants;
  const out = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v === null || v === undefined) continue;
    if (k === "format") {
      const f = String(v).trim().toLowerCase();
      out[k] = f === "variants" ? "variants" : "simple";
      continue;
    }
    out[k] = v;
  }
  return out;
}
