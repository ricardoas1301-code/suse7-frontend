/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   accountsSyncActionIds: readonly string[];
 * }} input
 */
export function isAnotherAccountsSyncFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  accountsSyncActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    accountsSyncActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    accountsSyncActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    accountsSyncActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
