import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../../useSellerToolboxConfirmAction";
import { isAnotherCustomersSyncFlowActive } from "./customersSyncActionUtils";
import { CUSTOMERS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS } from "./customersSyncOperationModel";
import { SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID } from "./sellerToolboxReprocessCustomer360Operation";
import { useCustomersSyncView } from "./useCustomersSyncView";
import "./CustomersSyncOperations.css";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 * }} props
 */
function CustomersSyncOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, customer } = useCustomersSyncView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded" || !customer;

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

  const isAnotherFlowActive = isAnotherCustomersSyncFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    customersSyncActionIds: CUSTOMERS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
  });

  const isExecuting = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || !customer) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        customerId: customer.customerId,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        totalOrders: customer.totalOrders,
        previousCustomer360Status: customer.customer360Status,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    customer,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="customers-sync-operations__btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="customers-sync-operations__label">{isExecuting ? loadingLabel : label}</span>
      <span className="customers-sync-operations__badge">DEV</span>
    </button>
  );
}

function CustomersSyncOperations() {
  const { customer } = useCustomersSyncView();
  if (!customer) return null;

  return (
    <section className="customers-sync-operations" aria-label="Ações operacionais do cliente">
      <header className="customers-sync-operations__head">
        <h5 className="customers-sync-operations__title">Ações operacionais</h5>
        <p className="customers-sync-operations__desc">
          Reprocessamento simulado do Cliente360 e rebuild operacional.
        </p>
      </header>

      <div className="customers-sync-operations__buttons">
        <CustomersSyncOperationButton
          actionId={SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID}
          label="Reprocessar Cliente360 DEV"
          loadingLabel="Reprocessando..."
          confirmTitle="Reprocessar Cliente360?"
          confirmDescription="Esta ação vai simular o rebuild do Cliente360 deste cliente. Nenhum dado real será alterado."
        />
      </div>
    </section>
  );
}

export default memo(CustomersSyncOperations);
