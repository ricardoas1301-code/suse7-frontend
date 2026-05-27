import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../../useSellerToolboxConfirmAction";
import { isAnotherSalesSyncFlowActive } from "./salesSyncActionUtils";
import {
  SALES_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
} from "./salesSyncOperationModel";
import { SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID } from "./sellerToolboxReimportSaleOperation";
import { SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID } from "./sellerToolboxRecalculateSaleFinancialOperation";
import { SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID } from "./sellerToolboxReprocessSaleCustomerOperation";
import { useSalesSyncView } from "./useSalesSyncView";
import "./SalesSyncOperations.css";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 *   variant?: "default" | "muted";
 * }} props
 */
function SalesSyncOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
  variant = "default",
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, sale } = useSalesSyncView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded" || !sale;

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

  const isAnotherFlowActive = isAnotherSalesSyncFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    salesSyncActionIds: SALES_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
  });

  const isExecuting = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || !sale) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        saleId: sale.saleId,
        marketplace: sale.marketplace,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    sale,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className={`sales-sync-operations__btn${
        variant === "muted" ? " sales-sync-operations__btn--muted" : ""
      }`}
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="sales-sync-operations__label">{isExecuting ? loadingLabel : label}</span>
      <span className="sales-sync-operations__badge">DEV</span>
    </button>
  );
}

function SalesSyncOperations() {
  const { sale } = useSalesSyncView();
  if (!sale) return null;

  return (
    <section className="sales-sync-operations" aria-label="Ações operacionais da venda">
      <header className="sales-sync-operations__head">
        <h5 className="sales-sync-operations__title">Ações operacionais</h5>
        <p className="sales-sync-operations__desc">
          Operações contextuais simuladas para a venda selecionada.
        </p>
      </header>

      <div className="sales-sync-operations__buttons">
        <SalesSyncOperationButton
          actionId={SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID}
          label="Reimportar venda DEV"
          loadingLabel="Reimportando..."
          confirmTitle="Reimportar venda?"
          confirmDescription="Esta ação vai simular a reimportação desta venda. Nenhum dado real será alterado."
        />
        <SalesSyncOperationButton
          actionId={SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID}
          label="Recalcular financeiro DEV"
          loadingLabel="Recalculando..."
          confirmTitle="Recalcular financeiro da venda?"
          confirmDescription="Esta ação vai simular o reprocessamento financeiro desta venda."
          variant="muted"
        />
        <SalesSyncOperationButton
          actionId={SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID}
          label="Reprocessar cliente DEV"
          loadingLabel="Reprocessando..."
          confirmTitle="Reprocessar cliente da venda?"
          confirmDescription="Esta ação vai simular o rebuild do Cliente360 vinculado a esta venda."
        />
      </div>
    </section>
  );
}

export default memo(SalesSyncOperations);
