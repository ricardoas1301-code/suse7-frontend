import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../../useSellerToolboxConfirmAction";
import { isAnotherProductsSyncFlowActive } from "./productsSyncActionUtils";
import { PRODUCTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS } from "./productsSyncOperationModel";
import { SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID } from "./sellerToolboxReprocessProductListingLinkOperation";
import { useProductsSyncView } from "./useProductsSyncView";
import "./ProductsSyncOperations.css";

/**
 * @param {{
 *   actionId: string;
 *   label: string;
 *   loadingLabel: string;
 *   confirmTitle: string;
 *   confirmDescription: string;
 * }} props
 */
function ProductsSyncOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, product } = useProductsSyncView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded" || !product;

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

  const isAnotherFlowActive = isAnotherProductsSyncFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    productsSyncActionIds: PRODUCTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
  });

  const isExecuting = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || !product) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        productId: product.productId,
        sku: product.sku,
        linkedListingsCount: product.linkedListingsCount,
        previousLinkStatus: product.listingLinkStatus,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    product,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="products-sync-operations__btn"
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="products-sync-operations__label">{isExecuting ? loadingLabel : label}</span>
      <span className="products-sync-operations__badge">DEV</span>
    </button>
  );
}

function ProductsSyncOperations() {
  const { product } = useProductsSyncView();
  if (!product) return null;

  return (
    <section className="products-sync-operations" aria-label="Ações operacionais do produto">
      <header className="products-sync-operations__head">
        <h5 className="products-sync-operations__title">Ações operacionais</h5>
        <p className="products-sync-operations__desc">
          Reprocessamento simulado dos vínculos SKU ↔ anúncio.
        </p>
      </header>

      <div className="products-sync-operations__buttons">
        <ProductsSyncOperationButton
          actionId={SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID}
          label="Reprocessar vínculos DEV"
          loadingLabel="Reprocessando..."
          confirmTitle="Reprocessar vínculos produto-anúncio?"
          confirmDescription="Esta ação vai simular o rebuild dos vínculos deste SKU. Nenhum dado real será alterado."
        />
      </div>
    </section>
  );
}

export default memo(ProductsSyncOperations);
