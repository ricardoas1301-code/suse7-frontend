import { normalizeSellerToolboxReasonText, SELLER_TOOLBOX_REASON_MAX_LENGTH } from "../sellerToolboxActionReasonModel";
import { applySubscriptionManagementOperationResult } from "./subscriptionManagementModel";
import { SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS } from "./subscriptionManagementOperationModel";

export const ADMINISTRATIVE_REASON_MIN_LENGTH = 12;

export const SUBSCRIPTION_MANAGEMENT_MOCK_ADMIN_NAME = "Rico";

/** @typedef {import("./subscriptionManagementModel").SubscriptionManagementStateViewModel} SubscriptionManagementStateViewModel */

/**
 * @typedef {{
 *   auditId: string;
 *   operationType: string;
 *   sellerId: string;
 *   adminName: string;
 *   createdAt: string;
 *   reason: string;
 *   beforeSnapshot: Record<string, unknown>;
 *   afterSnapshot: Record<string, unknown>;
 *   immutable: true;
 * }} SubscriptionManagementAuditLogEntry
 */

/** @type {readonly string[]} */
export const SUBSCRIPTION_MANAGEMENT_AUDITABLE_OPERATION_ACTION_IDS =
  SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS;

/**
 * @param {string | null | undefined} actionId
 */
export function isSubscriptionManagementAuditableOperation(actionId) {
  return SUBSCRIPTION_MANAGEMENT_AUDITABLE_OPERATION_ACTION_IDS.includes(String(actionId ?? ""));
}

/**
 * @param {string | null | undefined} reason
 */
export function validateAdministrativeReason(reason) {
  const normalized = normalizeSellerToolboxReasonText(reason);

  if (!normalized) {
    return {
      valid: false,
      code: "empty",
      message: "Informe uma justificativa administrativa.",
    };
  }

  if (normalized.length < ADMINISTRATIVE_REASON_MIN_LENGTH) {
    return {
      valid: false,
      code: "too_short",
      message: `Informe ao menos ${ADMINISTRATIVE_REASON_MIN_LENGTH} caracteres.`,
    };
  }

  if (normalized.length > SELLER_TOOLBOX_REASON_MAX_LENGTH) {
    return {
      valid: false,
      code: "too_long",
      message: `Use no máximo ${SELLER_TOOLBOX_REASON_MAX_LENGTH} caracteres.`,
    };
  }

  return {
    valid: true,
    code: "ok",
    message: "",
  };
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 */
export function buildSubscriptionManagementAuditSnapshot(state) {
  return {
    currentPlan: state.currentPlan,
    subscriptionPrice: state.subscriptionPrice,
    salesLimit: state.salesLimit,
    currentConsumption: state.currentConsumption,
    remainingSales: state.remainingSales,
    billingCycle: state.billingCycle,
    subscriptionStatus: state.subscriptionStatus,
    benefits: [...(state.benefits ?? [])],
  };
}

/**
 * @param {Record<string, unknown>} beforeSnapshot
 * @param {Record<string, unknown>} afterSnapshot
 */
export function buildSubscriptionManagementAuditDiff(beforeSnapshot, afterSnapshot) {
  /** @type {Record<string, { before: unknown; after: unknown }>} */
  const diff = {};

  const keys = new Set([...Object.keys(beforeSnapshot), ...Object.keys(afterSnapshot)]);

  keys.forEach((key) => {
    const beforeValue = beforeSnapshot[key];
    const afterValue = afterSnapshot[key];
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      diff[key] = { before: beforeValue, after: afterValue };
    }
  });

  return diff;
}

/**
 * @param {{
 *   operationType: string;
 *   sellerId: string;
 *   adminName?: string;
 *   reason: string;
 *   beforeState: SubscriptionManagementStateViewModel;
 *   operationResult: Record<string, unknown>;
 * }} input
 * @returns {SubscriptionManagementAuditLogEntry}
 */
export function createSubscriptionManagementAuditEntry({
  operationType,
  sellerId,
  adminName = SUBSCRIPTION_MANAGEMENT_MOCK_ADMIN_NAME,
  reason,
  beforeState,
  operationResult,
}) {
  const afterState = applySubscriptionManagementOperationResult(operationResult, beforeState);
  const beforeSnapshot = buildSubscriptionManagementAuditSnapshot(beforeState);
  const afterSnapshot = buildSubscriptionManagementAuditSnapshot(afterState);
  const changedFields = Object.keys(buildSubscriptionManagementAuditDiff(beforeSnapshot, afterSnapshot));

  const partialBefore = /** @type {Record<string, unknown>} */ ({});
  const partialAfter = /** @type {Record<string, unknown>} */ ({});

  changedFields.forEach((field) => {
    partialBefore[field] = beforeSnapshot[field];
    partialAfter[field] = afterSnapshot[field];
  });

  return {
    auditId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    operationType,
    sellerId,
    adminName,
    createdAt: new Date().toISOString(),
    reason: normalizeSellerToolboxReasonText(reason),
    beforeSnapshot: changedFields.length ? partialBefore : beforeSnapshot,
    afterSnapshot: changedFields.length ? partialAfter : afterSnapshot,
    immutable: true,
  };
}

/**
 * @param {SubscriptionManagementAuditLogEntry[]} logs
 */
export function buildSubscriptionManagementAuditSummary(logs) {
  const lastLog = logs[0] ?? null;

  return {
    totalLogs: logs.length,
    lastLog,
    lastAdmin: lastLog?.adminName ?? null,
    lastOperationType: lastLog?.operationType ?? null,
    lastCreatedAt: lastLog?.createdAt ?? null,
  };
}
