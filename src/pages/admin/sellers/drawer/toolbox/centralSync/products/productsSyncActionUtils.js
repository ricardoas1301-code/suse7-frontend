/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   productsSyncActionIds: readonly string[];
 * }} input
 */
export function isAnotherProductsSyncFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  productsSyncActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    productsSyncActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    productsSyncActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    productsSyncActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
