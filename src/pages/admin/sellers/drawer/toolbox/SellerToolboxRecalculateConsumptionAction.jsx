import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  isAnySubscriptionOperationExecuting,
  resolveSubscriptionOperationState,
} from "./subscription/sellerToolboxSubscriptionActionUtils";
import { SELLER_TOOLBOX_CONSUMPTION_OPERATION_ACTION_IDS } from "./subscription/sellerToolboxConsumptionOperationModel";
import { SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID } from "./subscription/sellerToolboxRecalculateConsumptionOperation";
import { useSellerConsumptionView } from "./subscription/useSellerConsumptionView";
import { useSellerToolboxActionReason } from "./useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";

function SellerToolboxRecalculateConsumptionAction() {
  const { toolboxState } = useSellerToolbox();
  const { viewState } = useSellerConsumptionView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID;
  const isBlocked = toolboxState !== "loaded" || viewState !== "loaded";
  const isRecalculating = executingActionId === actionId;
  const isConsumptionOperationExecuting = isAnySubscriptionOperationExecuting(
    executingActionId,
    SELLER_TOOLBOX_CONSUMPTION_OPERATION_ACTION_IDS,
  );

  const operationState = useMemo(
    () =>
      resolveSubscriptionOperationState({
        actionId,
        isConfirmOpen,
        pendingActionId: pendingAction?.id,
        isReasonOpen,
        reasonActionId: reasonState?.actionId,
        executingActionId,
        completedAction,
      }),
    [
      actionId,
      isConfirmOpen,
      pendingAction?.id,
      isReasonOpen,
      reasonState?.actionId,
      executingActionId,
      completedAction,
    ],
  );

  const isFlowActive =
    operationState !== "idle" && operationState !== "success" && operationState !== "error_fake";

  const handleStart = useCallback(() => {
    if (isBlocked || isFlowActive || isConsumptionOperationExecuting) return;

    openConfirm({
      id: actionId,
      title: "Recalcular consumo",
      description: "Simular agregação de vendas do ciclo atual por contas e marketplaces.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
    });
  }, [actionId, isBlocked, isFlowActive, isConsumptionOperationExecuting, openConfirm]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="seller-consumption-panel__action-btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isFlowActive || isConsumptionOperationExecuting}
      onClick={handleStart}
    >
      <span className="seller-consumption-panel__action-label">
        {isRecalculating ? "Recalculando..." : "Recalcular consumo"}
      </span>
      <span className="seller-consumption-panel__action-badge">DEV</span>
    </button>
  );
}

export default memo(SellerToolboxRecalculateConsumptionAction);
