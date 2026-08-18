// ======================================================================
// Normaliza linha da grid Anúncios → snapshot SSOT (paridade adapter ML).
// ======================================================================

import { ATTENTION_REASON_SKU_PENDING_ML } from "../../../../constants/listingAttention.js";
import { toScorePercentCanonico } from "./resolveCanonicalListingRegistrationScore.js";
import { resolveCanonicalListingQualityScore } from "./resolveCanonicalListingQualityScore.js";

/**
 * @param {unknown} rawStatus
 * @returns {"active" | "paused" | "inactive" | "unknown"}
 */
export function normalizarStatusMercadoLivre(rawStatus) {
  const s = String(rawStatus ?? "")
    .trim()
    .toLowerCase();
  if (s === "active") return "active";
  if (s === "paused") return "paused";
  if (s === "closed" || s === "inactive" || s === "not_yet_active" || s === "deleted") return "inactive";
  if (
    s === "under_review" ||
    s === "pending" ||
    s === "waiting_for_patch" ||
    s === "payment_required"
  ) {
    return "paused";
  }
  if (!s) return "unknown";
  return "unknown";
}

/** @param {unknown} value */
function toIntOrNull(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizarSnapshotSaudeAnuncioDaLinha(row) {
  const rawStatus = row.listingStatusRaw ?? row.status ?? row.statusKey ?? null;
  const statusNormalized = normalizarStatusMercadoLivre(rawStatus);

  const healthScore =
    resolveCanonicalListingQualityScore(row) ??
    toScorePercentCanonico(row.listingQualityScorePercent) ??
    toScorePercentCanonico(row.listingQualityScore);

  const missingFields = Array.isArray(row.missingProductFields)
    ? row.missingProductFields.map((x) => String(x))
    : [];

  const pendingGoalsCount =
    missingFields.length > 0
      ? missingFields.length
      : healthScore != null && healthScore < 100
        ? 1
        : 0;

  const salesCount = toIntOrNull(row.salesCount) ?? 0;

  return {
    listing_id: row.id != null ? String(row.id) : "",
    status: rawStatus != null ? String(rawStatus) : null,
    status_normalized: statusNormalized,
    health_score: healthScore,
    listing_quality_score: healthScore,
    pending_goals_count: pendingGoalsCount,
    missing_fields: missingFields,
    is_product_ready: row.isProductReady === true,
    needs_attention_flag: Boolean(row.needsAttention ?? row.uiFlags?.needs_attention),
    sku_pending:
      row.skuPending === true || String(row.attentionReason ?? "") === ATTENTION_REASON_SKU_PENDING_ML,
    available_quantity: toIntOrNull(row.availableQuantity),
    sales_count: salesCount,
    gross_revenue_brl:
      row.grossSalesBrl != null
        ? String(row.grossSalesBrl)
        : row.grossRevenueBrl != null
          ? String(row.grossRevenueBrl)
          : null,
    profit_brl:
      row.contributionProfitBrl != null
        ? String(row.contributionProfitBrl)
        : row.netProfitBrl != null
          ? String(row.netProfitBrl)
          : null,
    profit_margin_percent:
      row.contributionMarginPercent != null ? String(row.contributionMarginPercent) : null,
  };
}
