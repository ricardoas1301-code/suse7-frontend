// ======================================================================
// Cache de linha do catálogo — navegação para Precificação Inteligente (S1.8)
// Só persiste linhas com accumulated_performance.listing atômico + conta resolvida.
// ======================================================================

/**
 * @param {unknown} scope
 */
function isAtomicCompleteScope(scope) {
  if (scope == null || typeof scope !== "object") return false;
  const s = /** @type {Record<string, unknown>} */ (scope);
  return (
    s.sales_quantity != null &&
    String(s.sales_quantity).trim() !== "" &&
    s.sales_amount_brl != null &&
    String(s.sales_amount_brl).trim() !== "" &&
    s.sales_profit_brl != null &&
    String(s.sales_profit_brl).trim() !== "" &&
    s.sales_profit_percent != null &&
    String(s.sales_profit_percent).trim() !== ""
  );
}

const CACHE_PREFIX = "s7:pricing-intelligence-row:v6:";
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * @param {unknown} row
 */
function rowHasAccountLabel(row) {
  if (row == null || typeof row !== "object") return false;
  const r = /** @type {Record<string, unknown>} */ (row);
  const pcm =
    r.product_card_metrics != null && typeof r.product_card_metrics === "object"
      ? /** @type {Record<string, unknown>} */ (r.product_card_metrics)
      : null;
  const fromMetrics =
    pcm?.accountDisplayName != null && String(pcm.accountDisplayName).trim() !== ""
      ? String(pcm.accountDisplayName).trim()
      : null;
  if (fromMetrics) return true;
  const alias =
    r.accountAlias ??
    r.account_alias ??
    r.mlAccountAlias ??
    r.ml_account_alias ??
    null;
  return alias != null && String(alias).trim() !== "";
}

/**
 * @param {unknown} row
 */
function cacheRowIsComplete(row) {
  const pcm =
    row != null && typeof row === "object" && row.product_card_metrics != null
      ? row.product_card_metrics
      : null;
  const ap =
    row != null && typeof row === "object" && row.accumulated_performance != null
      ? row.accumulated_performance
      : null;
  const listingAp =
    ap != null && typeof ap === "object" && ap.listing != null && typeof ap.listing === "object"
      ? /** @type {Record<string, unknown>} */ (ap.listing)
      : null;
  const hasListingAccumulated = isAtomicCompleteScope(listingAp);
  return pcm != null && typeof pcm === "object" && rowHasAccountLabel(row) && hasListingAccumulated;
}

/**
 * @param {string} listingId
 * @param {Record<string, unknown>} row
 */
export function salvarLinhaPrecificacaoInteligenteCache(listingId, row) {
  if (typeof window === "undefined") return;
  const id = String(listingId ?? "").trim();
  if (id === "" || !cacheRowIsComplete(row)) return;
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + id,
      JSON.stringify({ savedAt: Date.now(), row }),
    );
  } catch {
    /* quota / modo privado */
  }
}

/**
 * @param {string} listingId
 * @returns {Record<string, unknown> | null}
 */
export function lerLinhaPrecificacaoInteligenteCache(listingId) {
  if (typeof window === "undefined") return null;
  const id = String(listingId ?? "").trim();
  if (id === "") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(CACHE_PREFIX + id);
      return null;
    }
    const row = parsed?.row;
    if (!cacheRowIsComplete(row)) {
      sessionStorage.removeItem(CACHE_PREFIX + id);
      return null;
    }
    return /** @type {Record<string, unknown>} */ (row);
  } catch {
    return null;
  }
}
