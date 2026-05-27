import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import { buildSellerDrawerHeaderModel } from "../../sellerDrawerHeaderModel";
import { isAnotherCacheRefreshFlowActive } from "./sellerToolboxCacheRefreshActionUtils";
import { SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS } from "./sellerToolboxCacheRefreshOperationModel";
import { SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID } from "./sellerToolboxRefreshSellerOperation";
import { useSellerCacheRefreshView } from "./useSellerCacheRefreshView";

function SellerToolboxRefreshSellerAction() {
  const { sellerId, listPreview, detail, toolboxState } = useSellerToolbox();
  const { viewState, lastRefreshedAt } = useSellerCacheRefreshView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID;
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

  const isRefreshing = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive) return;

    openConfirm({
      id: actionId,
      title: "Forçar refresh do seller?",
      description:
        "Esta ação vai simular a atualização dos dados operacionais exibidos no drawer. Nenhum cache real será alterado.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        sellerName,
        previousRefreshedAt: lastRefreshedAt,
      },
    });
  }, [
    actionId,
    sellerId,
    sellerName,
    lastRefreshedAt,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="seller-cache-refresh-panel__action-btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="seller-cache-refresh-panel__action-label">
        {isRefreshing ? "Atualizando..." : "Forçar refresh DEV"}
      </span>
      <span className="seller-cache-refresh-panel__action-badge">DEV</span>
    </button>
  );
}

export default memo(SellerToolboxRefreshSellerAction);
