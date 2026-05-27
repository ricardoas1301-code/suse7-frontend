import { memo, useCallback, useMemo } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { resolveSubscriptionOperationState } from "../../subscription/sellerToolboxSubscriptionActionUtils";
import { useSellerToolboxActionReason } from "../../useSellerToolboxActionReason";
import { useSellerToolboxConfirmAction } from "../../useSellerToolboxConfirmAction";
import { isAnotherListingsSyncFlowActive } from "./listingsSyncActionUtils";
import { LISTINGS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS } from "./listingsSyncOperationModel";
import { SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID } from "./sellerToolboxReimportListingOperation";
import { SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID } from "./sellerToolboxRecalculateListingHealthOperation";
import { useListingsSyncView } from "./useListingsSyncView";
import "./ListingsSyncOperations.css";

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
function ListingsSyncOperationButton({
  actionId,
  label,
  loadingLabel,
  confirmTitle,
  confirmDescription,
  variant = "default",
}) {
  const { sellerId, toolboxState } = useSellerToolbox();
  const { panelState, listing } = useListingsSyncView();
  const { openConfirm, isConfirmOpen, pendingAction } = useSellerToolboxConfirmAction();
  const { isReasonOpen, reasonState, executingActionId, completedAction } =
    useSellerToolboxActionReason();

  const isBlocked = toolboxState !== "loaded" || panelState !== "loaded" || !listing;

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

  const isAnotherFlowActive = isAnotherListingsSyncFlowActive({
    actionId,
    isConfirmOpen,
    pendingActionId: pendingAction?.id,
    isReasonOpen,
    reasonActionId: reasonState?.actionId,
    executingActionId,
    listingsSyncActionIds: LISTINGS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS,
  });

  const isExecuting = operationState === "executing";

  const handleStart = useCallback(() => {
    if (isBlocked || isThisFlowActive || isAnotherFlowActive || !listing) return;

    openConfirm({
      id: actionId,
      title: confirmTitle,
      description: confirmDescription,
      riskLevel: "medium",
      confirmLabel: "Continuar",
      cancelLabel: "Cancelar",
      metadata: {
        sellerId,
        listingId: listing.listingId,
        sku: listing.sku,
        marketplace: listing.marketplace,
        previousHealthScore: listing.healthScore,
      },
    });
  }, [
    actionId,
    confirmTitle,
    confirmDescription,
    sellerId,
    listing,
    isBlocked,
    isThisFlowActive,
    isAnotherFlowActive,
    openConfirm,
  ]);

  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className={`listings-sync-operations__btn${
        variant === "muted" ? " listings-sync-operations__btn--muted" : ""
      }`}
      data-dev-only
      data-operation-state={operationState}
      disabled={isBlocked || isThisFlowActive || isAnotherFlowActive}
      onClick={handleStart}
    >
      <span className="listings-sync-operations__label">{isExecuting ? loadingLabel : label}</span>
      <span className="listings-sync-operations__badge">DEV</span>
    </button>
  );
}

function ListingsSyncOperations() {
  const { listing } = useListingsSyncView();
  if (!listing) return null;

  return (
    <section className="listings-sync-operations" aria-label="Ações operacionais do anúncio">
      <header className="listings-sync-operations__head">
        <h5 className="listings-sync-operations__title">Ações operacionais</h5>
        <p className="listings-sync-operations__desc">
          Operações contextuais simuladas para o anúncio selecionado.
        </p>
      </header>

      <div className="listings-sync-operations__buttons">
        <ListingsSyncOperationButton
          actionId={SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID}
          label="Reimportar anúncio DEV"
          loadingLabel="Reimportando..."
          confirmTitle="Reimportar anúncio?"
          confirmDescription="Esta ação vai simular a reimportação deste anúncio. Nenhum dado real será alterado."
        />
        <ListingsSyncOperationButton
          actionId={SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID}
          label="Recalcular saúde DEV"
          loadingLabel="Recalculando..."
          confirmTitle="Recalcular saúde do anúncio?"
          confirmDescription="Esta ação vai simular o reprocessamento da saúde deste anúncio."
          variant="muted"
        />
      </div>
    </section>
  );
}

export default memo(ListingsSyncOperations);
