// =============================================================================
// Dev Center S_4.8.4 — inputs frontend (espelha backend, sem alterar contrato)
// =============================================================================

export const DEV_CENTER_GLOBAL_SEARCH_MAX_LEN = 120;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {unknown} raw */
export function normalizeDevCenterGlobalSearchQuery(raw) {
  if (raw == null) return "";
  let s = String(raw).trim().toLowerCase();
  if (!s) return "";
  if (s.length > DEV_CENTER_GLOBAL_SEARCH_MAX_LEN) {
    s = s.slice(0, DEV_CENTER_GLOBAL_SEARCH_MAX_LEN);
  }
  return s.split(/\s+/).filter(Boolean).join(" ");
}

/** @param {unknown} id */
export function isValidDevCenterGlobalCustomerId(id) {
  const s = String(id ?? "").trim();
  if (!s || s.length > 36) return false;
  return UUID_RE.test(s);
}
