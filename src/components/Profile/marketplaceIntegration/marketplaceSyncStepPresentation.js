import { resolveSyncStepStatusLabel } from "./marketplaceSyncExecutionSummary.js";
import { resolveMarketplaceSyncStepVisualIdentity } from "./marketplaceSyncStepVisualIdentity.js";

/**
 * Monta view-model de etapa de sincronização a partir do checklist canônico.
 * @param {Record<string, unknown>} item
 * @returns {{
 *   key: string;
 *   label: string;
 *   progressHint: string;
 *   progressCurrent: number | null;
 *   progressTotal: number | null;
 *   progressPercent: number | null;
 *   showProgressBar: boolean;
 *   visualIdentity: string;
 *   status: string;
 *   statusLabel: string;
 *   technicalDetail: string | null;
 *   detailLines: string[];
 *   divergenceNotice: string | null;
 * }}
 */
export function buildMarketplaceSyncStepPresentation(item) {
  const key = String(item?.key || "");
  const status = String(item?.status || "pending").toLowerCase();
  const ux = key === "historical_sales" ? item?.historical_ux : null;
  const metadata =
    item?.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
      ? /** @type {Record<string, unknown>} */ (item.metadata)
      : {};

  let progressTotal =
    item?.progress_total != null && Number(item.progress_total) > 0 ? Number(item.progress_total) : null;
  let progressCurrentRaw = typeof item?.progress_current === "number" ? item.progress_current : null;

  // S1.03 — card Produtos: universo de produtos (não anúncios / não “s/ vínculo”).
  if (key === "products") {
    const productsUniverse =
      metadata.products_universe_total != null && Number(metadata.products_universe_total) > 0
        ? Number(metadata.products_universe_total)
        : null;
    if (status === "done" && productsUniverse != null) {
      progressTotal = productsUniverse;
      progressCurrentRaw = productsUniverse;
    } else if (productsUniverse != null) {
      progressTotal = productsUniverse;
      if (progressCurrentRaw == null || progressCurrentRaw > productsUniverse) {
        progressCurrentRaw = productsUniverse;
      }
    }
  }

  const progressCurrent =
    progressTotal != null && progressCurrentRaw != null
      ? Math.min(progressCurrentRaw, progressTotal)
      : progressCurrentRaw;

  const showRawFraction = ux?.hide_raw_progress_fraction ? false : true;
  const progressHint =
    status === "running"
      ? ""
      : showRawFraction && progressTotal != null && progressCurrent != null
        ? ` (${progressCurrent}/${progressTotal})`
        : "";

  const progressPercent =
    progressTotal != null && progressCurrent != null
      ? Math.min(100, Math.round((progressCurrent / progressTotal) * 100))
      : null;

  const showProgressBar = status === "running";

  const primaryLabel =
    key === "historical_sales"
      ? status === "done" || status === "running" || status === "pending" || status === "error"
        ? "Histórico de vendas"
        : String(item?.label || key || "Etapa")
      : key === "products"
        ? "Produtos"
        : String(item?.label || key || "Etapa");

  /** @type {string[]} */
  const detailLines = [];
  if (key === "historical_sales" && Array.isArray(ux?.checklist_detail_lines)) {
    for (const line of ux.checklist_detail_lines) {
      if (line != null && String(line).trim() !== "") detailLines.push(String(line).trim());
    }
  }

  const technicalDetail =
    status === "error" && item?.error_message != null && String(item.error_message).trim() !== ""
      ? String(item.error_message).trim()
      : null;

  return {
    key,
    label: primaryLabel,
    progressHint,
    progressCurrent,
    progressTotal,
    progressPercent,
    showProgressBar,
    visualIdentity: resolveMarketplaceSyncStepVisualIdentity(key),
    status,
    statusLabel: resolveSyncStepStatusLabel(status),
    technicalDetail,
    detailLines,
    divergenceNotice:
      key === "historical_sales" && ux?.divergence_notice != null && String(ux.divergence_notice).trim() !== ""
        ? String(ux.divergence_notice).trim()
        : null,
  };
}

/**
 * @param {Array<Record<string, unknown>>} checklist
 * @returns {ReturnType<typeof buildMarketplaceSyncStepPresentation>[]}
 */
export function buildMarketplaceSyncStepsPresentation(checklist) {
  if (!Array.isArray(checklist)) return [];
  return checklist.map((item) => buildMarketplaceSyncStepPresentation(item));
}
