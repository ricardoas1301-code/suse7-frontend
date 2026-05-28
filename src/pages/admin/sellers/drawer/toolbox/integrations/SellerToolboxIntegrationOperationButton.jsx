import { memo, useCallback, useMemo } from "react";
import { useDevCenterOperationalConfirmOpcional } from "../../../../../../components/devCenter/operational";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import {
  buildDoubleConfirmDevCenterAction,
  exigeConfirmacaoDuplaIntegracao,
} from "../integrations/sellerToolboxIntegrationConfirmModel";
import { SELLER_TOOLBOX_INTEGRATION_OPERATION_ACTION_IDS } from "../integrations/sellerToolboxIntegrationOperationModel";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 *   doubleConfirmTitle?: string;
 *   doubleConfirmDescription?: string;
 *   riskLevel?: import("../sellerToolboxConfirmActionModel").SellerToolboxConfirmRiskLevel;
 *   accountId: string;
 *   accountLabel: string;
 *   marketplace?: string;
 *   className?: string;
 * }} props
 */
function SellerToolboxIntegrationOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
  doubleConfirmTitle,
  doubleConfirmDescription,
  riskLevel = "medium",
  accountId,
  accountLabel,
  marketplace = "",
  className = "seller-toolbox-integrations-operations__btn",
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const confirmOperacional = useDevCenterOperationalConfirmOpcional();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || !accountId;

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

  const isAnotherFlowActive = useMemo(() => {
    if (!isConfirmOpen && !isReasonOpen && executingActionId == null) return false;
    const activeId = pendingAction?.id ?? reasonState?.actionId ?? executingActionId;
    if (!activeId || activeId === actionId) return false;
    return SELLER_TOOLBOX_INTEGRATION_OPERATION_ACTION_IDS.includes(String(activeId));
  }, [
    actionId,
    isConfirmOpen,
    pendingAction?.id,
    isReasonOpen,
    reasonState?.actionId,
    executingActionId,
  ]);

  const isExecuting = operationState === "executing";

  const toolboxPendingConfirm = useMemo(
    () => ({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: exigeConfirmacaoDuplaIntegracao(actionId) ? "high" : riskLevel,
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        accountId,
        accountLabel,
        marketplace,
      },
    }),
    [
      actionId,
      confirmTitle,
      confirmDescription,
      riskLevel,
      sellerId,
      accountId,
      accountLabel,
      marketplace,
    ],
  );

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive) return;

    if (exigeConfirmacaoDuplaIntegracao(actionId) && confirmOperacional?.abrirConfirmacao) {
      confirmOperacional.abrirConfirmacao(
        buildDoubleConfirmDevCenterAction(toolboxPendingConfirm, {
          titulo: doubleConfirmTitle ?? confirmTitle,
          descricao:
            doubleConfirmDescription ??
            "Operação crítica de integração. Confirme apenas se tiver certeza do impacto operacional.",
        }),
      );
      return;
    }

    openConfirm(toolboxPendingConfirm);
  }, [
    actionId,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    confirmOperacional,
    toolboxPendingConfirm,
    doubleConfirmTitle,
    doubleConfirmDescription,
    confirmTitle,
    openConfirm,
  ]);

  return (
    <button
      type="button"
      className={className}
      data-operation-state={operationState}
      data-action-id={actionId}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="seller-toolbox-integrations-operations__label">
        {isExecuting ? loadingLabel : label}
      </span>
    </button>
  );
}

export default memo(SellerToolboxIntegrationOperationButton);
