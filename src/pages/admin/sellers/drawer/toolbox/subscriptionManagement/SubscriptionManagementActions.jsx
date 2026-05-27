import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import {
  buildAdjustLimitPreviewRows,
  buildChangePlanPreviewRows,
  buildCorrectConsumptionPreviewRows,
  buildEditPricePreviewRows,
} from "./subscriptionManagementModel";
import {
  isSubscriptionManagementOperationActionId,
  SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS,
} from "./subscriptionManagementOperationModel";
import { SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID } from "./sellerToolboxChangePlanOperation";
import { SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID } from "./sellerToolboxEditSubscriptionPriceOperation";
import { SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID } from "./sellerToolboxAdjustSalesLimitOperation";
import { SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID } from "./sellerToolboxCorrectCycleConsumptionOperation";
import { useSubscriptionManagementView } from "./useSubscriptionManagementView";
import "./SubscriptionManagementActions.css";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 *   buildPreviewRows: (state: import("./subscriptionManagementModel").SubscriptionManagementStateViewModel) => import("./subscriptionManagementModel").SubscriptionManagementPreviewRow[];
 * }} props
 */
function SubscriptionManagementActionButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
  buildPreviewRows,
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, currentState } = useSubscriptionManagementView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded";

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
    if (!isConfirmOpen && !isReasonOpen && !executingActionId) return false;

    const activeId =
      executingActionId ??
      (isReasonOpen ? reasonState?.actionId : null) ??
      (isConfirmOpen ? pendingAction?.id : null);

    if (!activeId || activeId === actionId) return false;
    return isSubscriptionManagementOperationActionId(activeId);
  }, [
    actionId,
    isConfirmOpen,
    isReasonOpen,
    pendingAction?.id,
    reasonState?.actionId,
    executingActionId,
  ]);

  const isExecuting = operationState === "executing";
  const previewRows = useMemo(() => buildPreviewRows(currentState), [buildPreviewRows, currentState]);

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        currentPlan: currentState.currentPlan,
        subscriptionPrice: currentState.subscriptionPrice,
        salesLimit: currentState.salesLimit,
        currentConsumption: currentState.currentConsumption,
        previewRows,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    currentState,
    previewRows,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="subscription-management-actions__btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="subscription-management-actions__label">{isExecuting ? loadingLabel : label}</span>
      <span className="subscription-management-actions__badge">DEV</span>
    </button>
  );
}

function SubscriptionManagementActions() {
  return (
    <section className="subscription-management-actions" aria-label="Ações de gestão de assinatura">
      <header className="subscription-management-actions__head">
        <h5 className="subscription-management-actions__title">Gestão operacional</h5>
        <p className="subscription-management-actions__desc">
          Ajustes administrativos simulados — plano, valor, limite e consumo do ciclo.
        </p>
      </header>

      <div className="subscription-management-actions__buttons">
        <SubscriptionManagementActionButton
          actionId={SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID}
          label="Alterar plano DEV"
          loadingLabel="Alterando..."
          confirmTitle="Alterar plano do seller?"
          confirmDescription="Simula upgrade de plano. Nenhuma assinatura real será alterada."
          buildPreviewRows={buildChangePlanPreviewRows}
        />
        <SubscriptionManagementActionButton
          actionId={SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID}
          label="Editar valor DEV"
          loadingLabel="Editando..."
          confirmTitle="Editar valor da assinatura?"
          confirmDescription="Simula ajuste de preço. Nenhuma cobrança real será alterada."
          buildPreviewRows={buildEditPricePreviewRows}
        />
        <SubscriptionManagementActionButton
          actionId={SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID}
          label="Ajustar limite DEV"
          loadingLabel="Ajustando..."
          confirmTitle="Ajustar limite mensal de vendas?"
          confirmDescription="Simula expansão do limite mensal. Nenhum limite real será alterado."
          buildPreviewRows={buildAdjustLimitPreviewRows}
        />
        <SubscriptionManagementActionButton
          actionId={SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID}
          label="Corrigir consumo DEV"
          loadingLabel="Corrigindo..."
          confirmTitle="Corrigir consumo do ciclo atual?"
          confirmDescription="Simula correção de consumo operacional. Nenhum dado real será alterado."
          buildPreviewRows={buildCorrectConsumptionPreviewRows}
        />
      </div>

      <p className="subscription-management-actions__note" data-dev-only>
        Operações registradas: {SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS.join(", ")}
      </p>
    </section>
  );
}

export default memo(SubscriptionManagementActions);
