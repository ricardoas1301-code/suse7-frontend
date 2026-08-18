// ======================================================================
// ID estável da linha de produto na lista de Concorrência.
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} product
 * @returns {string | null}
 */
export function pickConcorrenciaProductRowId(product) {
  const row = product && typeof product === "object" ? product : {};
  const monitored = row.monitored_listing_id ?? row.product?.monitored_listing_id;
  if (monitored != null) {
    const s = String(monitored).trim();
    if (s) return s;
  }
  const id = row.id ?? row.product?.id;
  if (id == null) return null;
  const s = String(id).trim();
  return s || null;
}
