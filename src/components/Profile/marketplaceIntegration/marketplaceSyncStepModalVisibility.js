import { resolveSyncStepStatusBucket } from "./marketplaceSyncExecutionSummary.js";

/** Etapa de conexão — exibida como linha/badge, não como card. */
export const MARKETPLACE_SYNC_CONNECT_STEP_KEY = "ml_connect";

/**
 * Etapas ocultas na UI do modal (v3) — mantidas no checklist/canonical.
 * @type {ReadonlySet<string>}
 */
export const MARKETPLACE_SYNC_HIDDEN_STEP_KEYS = new Set(["customers"]);

/**
 * @param {unknown} status
 * @returns {"ok" | "warn" | "error" | "processing" | "muted" | "unknown"}
 */
export function resolveConnectStepBadgeTone(status) {
  const bucket = resolveSyncStepStatusBucket(status);
  if (bucket === "completed") return "ok";
  if (bucket === "error") return "error";
  if (bucket === "running") return "processing";
  if (bucket === "pending") return "warn";
  return "unknown";
}

/**
 * @param {Array<{ key?: string }>} steps
 * @returns {Array<Record<string, unknown>>}
 */
export function filterMarketplaceSyncStepsForSellerSummary(steps) {
  if (!Array.isArray(steps)) return [];
  return steps.filter((step) => !MARKETPLACE_SYNC_HIDDEN_STEP_KEYS.has(String(step?.key || "")));
}

/**
 * @param {Array<Record<string, unknown>>} steps
 * @returns {{
 *   connectStep: Record<string, unknown> | null;
 *   gridSteps: Array<Record<string, unknown>>;
 * }}
 */
export function partitionMarketplaceSyncStepsForModal(steps) {
  if (!Array.isArray(steps)) {
    return { connectStep: null, gridSteps: [] };
  }

  let connectStep = null;
  /** @type {Array<Record<string, unknown>>} */
  const gridSteps = [];

  for (const step of steps) {
    const key = String(step?.key || "");
    if (key === MARKETPLACE_SYNC_CONNECT_STEP_KEY) {
      connectStep = step;
      continue;
    }
    if (MARKETPLACE_SYNC_HIDDEN_STEP_KEYS.has(key)) continue;
    gridSteps.push(step);
  }

  return { connectStep, gridSteps };
}

/**
 * @param {Record<string, unknown>} connectStep
 * @returns {string}
 */
export function resolveConnectStepDisplayLabel(connectStep) {
  const bucket = resolveSyncStepStatusBucket(connectStep?.status);
  if (bucket === "completed") {
    return "Conta conectada ao Mercado Livre";
  }
  if (bucket === "error") {
    const fallback = String(connectStep?.label || "Conectando conta Mercado Livre").trim();
    return fallback || "Conectando conta Mercado Livre";
  }
  return "Conectando conta Mercado Livre";
}

/**
 * @param {Record<string, unknown> | null} connectStep
 * @returns {null | {
 *   label: string;
 *   progressHint: string;
 *   statusLabel: string;
 *   badgeTone: ReturnType<typeof resolveConnectStepBadgeTone>;
 * }}
 */
export function buildMarketplaceSyncConnectStepLine(connectStep) {
  if (!connectStep) return null;
  const bucket = resolveSyncStepStatusBucket(connectStep.status);
  const label = resolveConnectStepDisplayLabel(connectStep);
  const progressHint = bucket === "completed" ? "" : String(connectStep.progressHint || "");
  const statusLabel =
    bucket === "completed" ? "" : String(connectStep.statusLabel || "").trim();
  return {
    label,
    progressHint,
    statusLabel,
    badgeTone: resolveConnectStepBadgeTone(connectStep.status),
  };
}
