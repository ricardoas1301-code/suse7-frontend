import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import { buildSellerDrawerHeaderModel } from "../../sellerDrawerHeaderModel";
import { isAnotherCacheRefreshFlowActive } from "./sellerToolboxCacheRefreshActionUtils";
import { SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS } from "./sellerToolboxCacheRefreshOperationModel";
import { SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID } from "./sellerToolboxReloadPanelDataOperation";
import { useSellerCacheRefreshView } from "./useSellerCacheRefreshView";

function SellerToolboxReloadPanelDataAction() {
  const { sellerId, listPreview, detail, toolboxState } = useSellerToolbox();
  const { viewState, lastReloadedAt } = useSellerCacheRefreshView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const actionId = SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID;
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

  const isReloading = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive) return;

    openConfirm({
      id: actionId,
      title: "Recarregar dados do painel?",
      description:
        "Esta ação vai simular o recarregamento dos dados exibidos no Drawer e na Toolbox. Nenhum dado real será alterado.",
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        sellerName,
        previousReloadedAt: lastReloadedAt,
      },
    });
  }, [
    actionId,
    sellerId,
    sellerName,
    lastReloadedAt,
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
        {isReloading ? "Recarregando..." : "Recarregar painel DEV"}
      </span>
      <span className="seller-cache-refresh-panel__action-badge">DEV</span>
    </button>
  );
}

export default memo(SellerToolboxReloadPanelDataAction);
