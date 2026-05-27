/**
 * @param {{
 *   actionId: string;
 *   flagKey: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   pendingMetadata: Record<string, unknown> | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   reasonMetadata: Record<string, unknown> | null | undefined;
 *   executingActionId: string | null;
 *   executingMetadata: Record<string, unknown> | null | undefined;
 *   completedAction: { actionId: string; status: string; metadata?: Record<string, unknown> | null } | null;
 * }} input
 */
export function resolveFeatureFlagOperationState({
  actionId,
  flagKey,
  isConfirmOpen,
  pendingActionId,
  pendingMetadata,
  isReasonOpen,
  reasonActionId,
  reasonMetadata,
  executingActionId,
  executingMetadata,
  completedAction,
}) {
  const matchesFlag = (metadata) => String(metadata?.flagKey ?? "") === flagKey;

  if (executingActionId === actionId && matchesFlag(executingMetadata)) return "executing";
  if (
    completedAction?.actionId === actionId &&
    matchesFlag(completedAction.metadata) &&
    completedAction.status === "success"
  ) {
    return "success";
  }
  if (
    completedAction?.actionId === actionId &&
    matchesFlag(completedAction.metadata) &&
    completedAction.status === "error_fake"
  ) {
    return "error_fake";
  }
  if (isReasonOpen && reasonActionId === actionId && matchesFlag(reasonMetadata)) return "reason";
  if (isConfirmOpen && pendingActionId === actionId && matchesFlag(pendingMetadata)) return "confirm";
  return "idle";
}

/** @deprecated Use resolveFeatureFlagOperationState */
export const resolveFeatureFlagEnableOperationState = resolveFeatureFlagOperationState;

/**
 * @param {{
 *   flagKey: string;
 *   isConfirmOpen: boolean;
 *   pendingAction: { id?: string; metadata?: Record<string, unknown> } | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonState: { actionId?: string; metadata?: Record<string, unknown> } | null | undefined;
 *   executingActionId: string | null;
 *   executingMetadata: Record<string, unknown> | null | undefined;
 *   featureFlagActionIds: readonly string[];
 * }} input
 */
export function isAnotherFeatureFlagFlowActive({
  flagKey,
  isConfirmOpen,
  pendingAction,
  isReasonOpen,
  reasonState,
  executingActionId,
  executingMetadata,
  featureFlagActionIds,
}) {
  if (
    executingActionId &&
    featureFlagActionIds.includes(executingActionId) &&
    String(executingMetadata?.flagKey ?? "") !== flagKey
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingAction?.id &&
    featureFlagActionIds.includes(pendingAction.id) &&
    String(pendingAction.metadata?.flagKey ?? "") !== flagKey
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonState?.actionId &&
    featureFlagActionIds.includes(reasonState.actionId) &&
    String(reasonState.metadata?.flagKey ?? "") !== flagKey
  ) {
    return true;
  }

  return false;
}

/**
 * @param {string | null | undefined} executingActionId
 * @param {readonly string[]} actionIds
 */
export function isAnyFeatureFlagOperationExecuting(executingActionId, actionIds) {
  if (!executingActionId) return false;
  return actionIds.includes(executingActionId);
}
