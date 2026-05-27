/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   cacheRefreshActionIds: readonly string[];
 * }} input
 */
export function isAnotherCacheRefreshFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  cacheRefreshActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    cacheRefreshActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    cacheRefreshActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    cacheRefreshActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
