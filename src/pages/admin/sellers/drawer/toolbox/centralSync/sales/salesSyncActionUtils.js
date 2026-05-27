/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   salesSyncActionIds: readonly string[];
 * }} input
 */
export function isAnotherSalesSyncFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  salesSyncActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    salesSyncActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    salesSyncActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    salesSyncActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
