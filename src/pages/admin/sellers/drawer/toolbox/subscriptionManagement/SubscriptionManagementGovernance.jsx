import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../useSellerToolboxConfirmAction";
import {
  buildChangeBillingCyclePreviewRows,
  buildManageBenefitsPreviewRows,
  buildManageSubscriptionStatusPreviewRows,
  resolveBillingCycleLabel,
  resolveSubscriptionLifecycleStatusLabel,
  subscriptionManagementLifecycleStatusClassName,
} from "./subscriptionManagementModel";
import { isSubscriptionManagementOperationActionId } from "./subscriptionManagementOperationModel";
import { SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID } from "./sellerToolboxChangeBillingCycleOperation";
import { SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID } from "./sellerToolboxManageSubscriptionStatusOperation";
import { SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID } from "./sellerToolboxManageSubscriptionBenefitsOperation";
import { useSubscriptionManagementView } from "./useSubscriptionManagementView";
import SubscriptionBenefitsList from "./SubscriptionBenefitsList";
import "./SubscriptionManagementGovernance.css";

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
function GovernanceActionButton({
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
        billingCycle: currentState.billingCycle,
        subscriptionStatus: currentState.subscriptionStatus,
        benefits: currentState.benefits,
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
      className="subscription-management-governance__btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="subscription-management-governance__btn-label">
        {isExecuting ? loadingLabel : label}
      </span>
      <span className="subscription-management-governance__btn-badge">DEV</span>
    </button>
  );
}

/**
 * @param {{ state: import("./subscriptionManagementModel").SubscriptionManagementStateViewModel }} props
 */
function SubscriptionManagementGovernance({ state }) {
  const benefits = state.benefits ?? [];

  return (
    <section className="subscription-management-governance" aria-label="Governança da assinatura">
      <header className="subscription-management-governance__head">
        <div className="subscription-management-governance__head-copy">
          <h5 className="subscription-management-governance__title">Governança da assinatura</h5>
          <p className="subscription-management-governance__desc">
            Ciclo, lifecycle e benefícios — controle operacional simulado.
          </p>
        </div>
        <span className={subscriptionManagementLifecycleStatusClassName(state.subscriptionStatus)}>
          {resolveSubscriptionLifecycleStatusLabel(state.subscriptionStatus)}
        </span>
      </header>

      <dl className="subscription-management-governance__summary">
        <div className="subscription-management-governance__summary-item">
          <dt>Ciclo atual</dt>
          <dd>{resolveBillingCycleLabel(state.billingCycle)}</dd>
        </div>
        <div className="subscription-management-governance__summary-item">
          <dt>Status atual</dt>
          <dd>{resolveSubscriptionLifecycleStatusLabel(state.subscriptionStatus)}</dd>
        </div>
        <div className="subscription-management-governance__summary-item">
          <dt>Benefícios ativos</dt>
          <dd>{benefits.length}</dd>
        </div>
      </dl>

      <div className="subscription-management-governance__benefits">
        <h6 className="subscription-management-governance__benefits-title">Benefícios liberados</h6>
        <SubscriptionBenefitsList benefits={benefits} />
      </div>

      <div className="subscription-management-governance__actions">
        <GovernanceActionButton
          actionId={SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID}
          label="Alterar ciclo DEV"
          loadingLabel="Alterando..."
          confirmTitle="Alterar ciclo de cobrança?"
          confirmDescription="Simula migração de ciclo mensal/anual. Nenhum billing real será alterado."
          buildPreviewRows={buildChangeBillingCyclePreviewRows}
        />
        <GovernanceActionButton
          actionId={SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID}
          label="Alterar status DEV"
          loadingLabel="Alterando..."
          confirmTitle="Alterar status da assinatura?"
          confirmDescription="Simula suspensão ou reativação administrativa. Nenhuma assinatura real será alterada."
          buildPreviewRows={buildManageSubscriptionStatusPreviewRows}
        />
        <GovernanceActionButton
          actionId={SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID}
          label="Gerenciar benefícios DEV"
          loadingLabel="Gerenciando..."
          confirmTitle="Gerenciar benefícios liberados?"
          confirmDescription="Simula liberação ou remoção de benefícios. Nenhum entitlement real será alterado."
          buildPreviewRows={buildManageBenefitsPreviewRows}
        />
      </div>
    </section>
  );
}

export default memo(SubscriptionManagementGovernance);
