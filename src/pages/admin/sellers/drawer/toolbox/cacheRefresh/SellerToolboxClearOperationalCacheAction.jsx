import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import { buildSellerDrawerHeaderModel } from "../../sellerDrawerHeaderModel";
import { isAnotherCacheRefreshFlowActive } from "./sellerToolboxCacheRefreshActionUtils";
import { SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS } from "./sellerToolboxCacheRefreshOperationModel";
import { SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID } from "./sellerToolboxClearOperationalCacheOperation";
import { useSellerCacheRefreshView } from "./useSellerCacheRefreshView";

function SellerToolboxClearOperationalCacheAction() {
  const { sellerId, listPreview, detail, toolboxState } = useSellerToolbox();
  const { viewState, lastClearedAt } = useSellerCacheRefreshView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID;
  const isBlocked = toolboxState !== "loaded" || viewState !== "loaded";

  const sellerName = useMemo(() => {
    if (!sellerId) return "Seller";
    return buildSellerDrawerHeaderModel({ sellerId, listPreview, detail }).nome;
  }, [sellerId, listPreview, detail]);

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

  const isThisFlowActive =
    operationState !== "idle" &&
    operationState !== "success" &&
    operationState !== "error_fake";

  const isAnotherFlowActive = isAnotherCacheRefreshFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    cacheRefreshActionIds: SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS,
  });

  const isClearing = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive) return;

    openConfirm({
      id: actionId,
      title: "Limpar cache operacional?",
      description:
        "Esta ação vai simular a limpeza dos dados temporários operacionais exibidos na Toolbox. Nenhum cache real será alterado.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        sellerName,
        previousClearedAt: lastClearedAt,
      },
    });
  }, [
    actionId,
    sellerId,
    sellerName,
    lastClearedAt,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="seller-cache-refresh-panel__action-btn seller-cache-refresh-panel__action-btn--muted"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="seller-cache-refresh-panel__action-label">
        {isClearing ? "Limpando..." : "Limpar cache DEV"}
      </span>
      <span className="seller-cache-refresh-panel__action-badge">DEV</span>
    </button>
  );
}

export default memo(SellerToolboxClearOperationalCacheAction);
