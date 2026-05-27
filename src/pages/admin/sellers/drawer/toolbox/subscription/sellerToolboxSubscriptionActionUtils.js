/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   completedAction: { actionId: string; status: string } | null;
 * }} input
 */
export function resolveSubscriptionOperationState({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  completedAction,
}) {
  if (executingActionId === actionId) return "executing";
  if (completedAction?.actionId === actionId && completedAction.status === "success") return "success";
  if (completedAction?.actionId === actionId && completedAction.status === "error_fake") {
    return "error_fake";
  }
  if (isReasonOpen && reasonActionId === actionId) return "reason";
  if (isConfirmOpen && pendingActionId === actionId) return "confirm";
  return "idle";
}

/**
 * @param {string | null | undefined} executingActionId
 * @param {readonly string[]} actionIds
 */
export function isAnySubscriptionOperationExecuting(executingActionId, actionIds) {
  if (!executingActionId) return false;
  return actionIds.includes(executingActionId);
}
