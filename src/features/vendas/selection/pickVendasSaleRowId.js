// ======================================================================
// Identificador estável da linha de venda (seleção / relatório).
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
export function pickVendasSaleRowId(row) {
  if (!row || typeof row !== "object") return null;
  const id = row.item_id ?? row.sale_item_id ?? null;
  const s = id != null ? String(id).trim() : "";
  return s || null;
}
