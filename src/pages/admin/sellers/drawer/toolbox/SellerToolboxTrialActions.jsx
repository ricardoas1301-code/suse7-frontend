import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  isAnySubscriptionOperationExecuting,
  resolveSubscriptionOperationState,
} from "./subscription/sellerToolboxSubscriptionActionUtils";
import { SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID } from "./subscription/sellerToolboxEnableTrialOperation";
import { SELLER_TOOLBOX_END_TRIAL_ACTION_ID } from "./subscription/sellerToolboxEndTrialOperation";
import { useSellerToolboxActionReason } from "./useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";
import { useSellerToolboxTrialStatus } from "./useSellerToolboxTrialStatus";
import "./SellerToolboxTrialActions.css";

const TRIAL_ACTION_IDS = [
  SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID,
  SELLER_TOOLBOX_END_TRIAL_ACTION_ID,
];

function SellerToolboxTrialActions() {
  const { toolboxState } = useSellerToolbox();
  const { trialStatus } = useSellerToolboxTrialStatus();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded";
  const isTrialExecuting = isAnySubscriptionOperationExecuting(executingActionId, TRIAL_ACTION_IDS);

  const enableOperationState = useMemo(
    () =>
      resolveSubscriptionOperationState({
        actionId: SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID,
        isConfirmOpen,
        pendingActionId: pendingAction?.id,
        isReasonOpen,
        reasonActionId: reasonState?.actionId,
        executingActionId,
        completedAction,
      }),
    [
      isConfirmOpen,
      pendingAction?.id,
      isReasonOpen,
      reasonState?.actionId,
      executingActionId,
      completedAction,
    ],
  );

  const endOperationState = useMemo(
    () =>
      resolveSubscriptionOperationState({
        actionId: SELLER_TOOLBOX_END_TRIAL_ACTION_ID,
        isConfirmOpen,
        pendingActionId: pendingAction?.id,
        isReasonOpen,
        reasonActionId: reasonState?.actionId,
        executingActionId,
        completedAction,
      }),
    [
      isConfirmOpen,
      pendingAction?.id,
      isReasonOpen,
      reasonState?.actionId,
      executingActionId,
      completedAction,
    ],
  );

  const isEnableFlowActive =
    enableOperationState !== "idle" &&
    enableOperationState !== "success" &&
    enableOperationState !== "error_fake";

  const isEndFlowActive =
    endOperationState !== "idle" &&
    endOperationState !== "success" &&
    endOperationState !== "error_fake";

  const canEnableTrial = trialStatus === "ended";
  const canEndTrial = trialStatus === "active";

  const handleEnableTrial = useCallback(() => {
    if (isBlocked || !canEnableTrial || isEnableFlowActive || isEndFlowActive || isTrialExecuting) {
      return;
    }

    openConfirm({
      id: SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID,
      title: "Liberar trial",
      description: "Simular liberação de trial para este seller.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
    });
  }, [isBlocked, canEnableTrial, isEnableFlowActive, isEndFlowActive, isTrialExecuting, openConfirm]);

  const handleEndTrial = useCallback(() => {
    if (isBlocked || !canEndTrial || isEnableFlowActive || isEndFlowActive || isTrialExecuting) {
      return;
    }

    openConfirm({
      id: SELLER_TOOLBOX_END_TRIAL_ACTION_ID,
      title: "Encerrar trial",
      description: "Simular encerramento administrativo do trial.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
    });
  }, [isBlocked, canEndTrial, isEnableFlowActive, isEndFlowActive, isTrialExecuting, openConfirm]);

  if (!import.meta.env.DEV) return null;

  const trialBadgeLabel = trialStatus === "active" ? "TRIAL ATIVO" : "TRIAL ENCERRADO";

  return (
    <div className="seller-toolbox-trial-actions" data-dev-only data-trial-status={trialStatus}>
      <div className="seller-toolbox-trial-actions__head">
        <span
          className={`seller-toolbox-trial-actions__status ${
            trialStatus === "active"
              ? "seller-toolbox-trial-actions__status--active"
              : "seller-toolbox-trial-actions__status--ended"
          }`.trim()}
        >
          {trialBadgeLabel}
        </span>
      </div>

      <div className="seller-toolbox-trial-actions__buttons">
        <button
          type="button"
          className="seller-toolbox-trial-actions__btn"
          data-operation-state={enableOperationState}
          disabled={
            isBlocked ||
            !canEnableTrial ||
            isEnableFlowActive ||
            isEndFlowActive ||
            isTrialExecuting
          }
          onClick={handleEnableTrial}
        >
          <span className="seller-toolbox-trial-actions__label">Liberar trial</span>
          <span className="seller-toolbox-trial-actions__badge">DEV</span>
        </button>

        <button
          type="button"
          className="seller-toolbox-trial-actions__btn"
          data-operation-state={endOperationState}
          disabled={
            isBlocked ||
            !canEndTrial ||
            isEnableFlowActive ||
            isEndFlowActive ||
            isTrialExecuting
          }
          onClick={handleEndTrial}
        >
          <span className="seller-toolbox-trial-actions__label">Encerrar trial</span>
          <span className="seller-toolbox-trial-actions__badge">DEV</span>
        </button>
      </div>
    </div>
  );
}

export default memo(SellerToolboxTrialActions);
