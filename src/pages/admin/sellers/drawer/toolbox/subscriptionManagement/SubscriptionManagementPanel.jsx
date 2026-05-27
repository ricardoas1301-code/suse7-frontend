import { memo, useMemo } from "react";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { isSubscriptionManagementOperationActionId } from "./subscriptionManagementOperationModel";
import SubscriptionManagementCurrentState from "./SubscriptionManagementCurrentState";
import SubscriptionManagementPreview from "./SubscriptionManagementPreview";
import SubscriptionManagementActions from "./SubscriptionManagementActions";
import { useSubscriptionManagementView } from "./useSubscriptionManagementView";
import "./SubscriptionManagementPanel.css";

function SubscriptionManagementPanelSkeleton() {
  return (
    <div className="subscription-management-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="subscription-management-panel__skeleton-block" />
      ))}
    </div>
  );
}

function SubscriptionManagementPanel() {
  const { panelState, currentState, loading, error } = useSubscriptionManagementView();
  const { isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId } = useSellerToolboxActionReason();

  const activePreview = useMemo(() => {
    const actionId =
      executingActionId ??
      (isReasonOpen ? reasonState?.actionId : null) ??
      (isConfirmOpen ? pendingAction?.id : null);

    if (!isSubscriptionManagementOperationActionId(actionId)) return null;

    const metadata =
      (isReasonOpen && reasonState?.actionId === actionId
        ? reasonState.metadata
        : isConfirmOpen && pendingAction?.id === actionId
          ? pendingAction.metadata
          : null) ?? null;

    const rows = metadata?.previewRows;
    return Array.isArray(rows) ? rows : null;
  }, [
    executingActionId,
    isReasonOpen,
    reasonState,
    isConfirmOpen,
    pendingAction,
  ]);

  const showPreview = Boolean(activePreview?.length);

  if (panelState === "initial" || loading) {
    return <SubscriptionManagementPanelSkeleton />;
  }

  if (panelState === "error") {
    return (
      <p className="subscription-management-panel__message subscription-management-panel__message--error" role="alert">
        {error || "Não foi possível carregar a gestão operacional de assinatura."}
      </p>
    );
  }

  return (
    <div className="subscription-management-panel" data-panel-state={panelState}>
      <SubscriptionManagementCurrentState state={currentState} />
      <SubscriptionManagementPreview rows={activePreview} visible={showPreview} />
      <SubscriptionManagementActions />
    </div>
  );
}

export default memo(SubscriptionManagementPanel);
