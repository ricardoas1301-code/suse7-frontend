/**
 * @param {{
 *   actionId: string;
 *   isConfirmOpen: boolean;
 *   pendingActionId: string | null | undefined;
 *   isReasonOpen: boolean;
 *   reasonActionId: string | null | undefined;
 *   executingActionId: string | null;
 *   listingsSyncActionIds: readonly string[];
 * }} input
 */
export function isAnotherListingsSyncFlowActive({
  actionId,
  isConfirmOpen,
  pendingActionId,
  isReasonOpen,
  reasonActionId,
  executingActionId,
  listingsSyncActionIds,
}) {
  if (
    executingActionId &&
    executingActionId !== actionId &&
    listingsSyncActionIds.includes(executingActionId)
  ) {
    return true;
  }

  if (
    isConfirmOpen &&
    pendingActionId &&
    pendingActionId !== actionId &&
    listingsSyncActionIds.includes(pendingActionId)
  ) {
    return true;
  }

  if (
    isReasonOpen &&
    reasonActionId &&
    reasonActionId !== actionId &&
    listingsSyncActionIds.includes(reasonActionId)
  ) {
    return true;
  }

  return false;
}
