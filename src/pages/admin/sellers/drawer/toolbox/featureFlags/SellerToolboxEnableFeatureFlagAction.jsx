import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import { SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID } from "./sellerToolboxEnableFeatureFlagOperation";
import {
  isAnotherFeatureFlagFlowActive,
  isAnyFeatureFlagOperationExecuting,
  resolveFeatureFlagOperationState,
} from "./sellerToolboxFeatureFlagActionUtils";
import { SELLER_TOOLBOX_FEATURE_FLAG_OPERATION_ACTION_IDS } from "./sellerToolboxFeatureFlagOperationModel";
import { useSellerFeatureFlagsView } from "./useSellerFeatureFlagsView";

/**
 * @param {{ flag: import("./sellerToolboxFeatureFlagsModel").SellerFeatureFlag }} props
 */
function SellerToolboxEnableFeatureFlagAction({ flag }) {
  const { toolboxState } = useSellerToolbox();
  const { viewState } = useSellerFeatureFlagsView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const {
    isReasonOpen,
    reasonState,
    executingActionId,
    executingMetadata,
    completedAction,
  } = useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID;
  const isBlocked = toolboxState !== "loaded" || viewState !== "loaded" || flag.enabled;
  const isFeatureFlagOperationExecuting = isAnyFeatureFlagOperationExecuting(
    executingActionId,
    SELLER_TOOLBOX_FEATURE_FLAG_OPERATION_ACTION_IDS,
  );

  const operationState = useMemo(
    () =>
      resolveFeatureFlagOperationState({
        actionId,
        flagKey: flag.key,
        isConfirmOpen,
        pendingActionId: pendingAction?.id,
        pendingMetadata: pendingAction?.metadata,
        isReasonOpen,
        reasonActionId: reasonState?.actionId,
        reasonMetadata: reasonState?.metadata,
        executingActionId,
        executingMetadata,
        completedAction,
      }),
    [
      actionId,
      flag.key,
      isConfirmOpen,
      pendingAction?.id,
      pendingAction?.metadata,
      isReasonOpen,
      reasonState?.actionId,
      reasonState?.metadata,
      executingActionId,
      executingMetadata,
      completedAction,
    ],
  );

  const isThisFlowActive =
    operationState !== "idle" &&
    operationState !== "success" &&
    operationState !== "error_fake";

  const isAnotherFlowActive = isAnotherFeatureFlagFlowActive({
    flagKey: flag.key,
    isConfirmOpen,
    pendingAction,
    isReasonOpen,
    reasonState,
    executingActionId,
    executingMetadata,
    featureFlagActionIds: SELLER_TOOLBOX_FEATURE_FLAG_OPERATION_ACTION_IDS,
  });

  const isActivating = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || isFeatureFlagOperationExecuting) {
      return;
    }

    openConfirm({
      id: actionId,
      title: "Ativar feature flag?",
      description: `Esta ação vai simular a liberação desta funcionalidade para o seller no ambiente DEV. Flag: ${flag.label}`,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        flagKey: flag.key,
        flagLabel: flag.label,
        previousEnabled: flag.enabled,
      },
    });
  }, [
    actionId,
    flag.key,
    flag.label,
    flag.enabled,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    isFeatureFlagOperationExecuting,
    openConfirm,
  ]);

  if (!import.meta.env.DEV || flag.enabled) return null;

  return (
    <button
      type="button"
      className="seller-feature-flags-panel__action-btn"
      data-dev-only
      data-operation-state={operationState}
      data-flag-key={flag.key}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive || isFeatureFlagOperationExecuting}
      onClick={handleStart}
    >
      <span className="seller-feature-flags-panel__action-label">
        {isActivating ? "Ativando..." : "Ativar DEV"}
      </span>
      <span className="seller-feature-flags-panel__action-badge">DEV</span>
    </button>
  );
}

export default memo(SellerToolboxEnableFeatureFlagAction);
