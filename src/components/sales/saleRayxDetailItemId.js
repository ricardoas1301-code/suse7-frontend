/** UUID de sales_order_items — obrigatório para GET /api/sales/detail */
const SALE_ITEM_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {unknown} id */
export function isSaleRayxDetailItemId(id) {
  if (id == null) return false;
  const s = String(id).trim();
  return s !== "" && SALE_ITEM_UUID_RE.test(s);
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
export function pickSaleRayxDetailItemId(row) {
  const id = String(row?.item_id ?? row?.sale_item_id ?? "").trim();
  return isSaleRayxDetailItemId(id) ? id : null;
}
