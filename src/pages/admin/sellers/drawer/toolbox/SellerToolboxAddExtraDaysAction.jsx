import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "./SellerToolboxContext";
import { resolveSubscriptionOperationState } from "./subscription/sellerToolboxSubscriptionActionUtils";
import { SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID } from "./subscription/sellerToolboxAddExtraDaysOperation";
import { useSellerToolboxActionReason } from "./useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";
import "./SellerToolboxAddExtraDaysAction.css";

function SellerToolboxAddExtraDaysAction() {
  const { toolboxState } = useSellerToolbox();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID;
  const isBlocked = toolboxState !== "loaded";

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
    if (isBlocked || isFlowActive) return;

    openConfirm({
      id: actionId,
      title: "Adicionar dias extras",
      description: "Simular extensão do período da assinatura.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
    });
  }, [actionId, isBlocked, isFlowActive, openConfirm]);

  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="seller-toolbox-add-days-action"
      data-dev-only
      data-operation-state={operationState}
    >
      <button
        type="button"
        className="seller-toolbox-add-days-action__btn"
        disabled={isBlocked || isFlowActive}
        onClick={handleStart}
      >
        <span className="seller-toolbox-add-days-action__label">Adicionar dias</span>
        <span className="seller-toolbox-add-days-action__badge">DEV</span>
      </button>
      {isBlocked ? (
        <p className="seller-toolbox-add-days-action__hint" role="status">
          Disponível quando a toolbox estiver carregada.
        </p>
      ) : null}
    </div>
  );
}

export default memo(SellerToolboxAddExtraDaysAction);
