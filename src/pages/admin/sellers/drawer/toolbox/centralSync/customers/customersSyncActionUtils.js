/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   customersSyncActionIds: readonly string[];
 * }} input
 */
export function isAnotherCustomersSyncFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  customersSyncActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    customersSyncActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    customersSyncActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    customersSyncActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
