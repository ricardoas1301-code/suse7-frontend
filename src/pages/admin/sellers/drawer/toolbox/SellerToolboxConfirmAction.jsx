import { memo, useCallback, useEffect, useRef } from "react";
import { S7Button } from "../../../../../components/ui";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  isSellerToolboxConfirmHighRisk,
  sellerToolboxConfirmRiskBadgeClassName,
  sellerToolboxConfirmRiskLabel,
} from "./sellerToolboxConfirmActionModel";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";
import { useSellerToolboxActionReason } from "./useSellerToolboxActionReason";
import "./SellerToolboxConfirmAction.css";

function SellerToolboxConfirmActionOverlay() {
  const { sellerId } = useSellerToolbox();
  const { pendingAction, isConfirmOpen, closeConfirm } = useSellerToolboxConfirmAction();
  const { openReason } = useSellerToolboxActionReason();
  const cancelRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const loggedOpenRef = useRef(false);

  useEffect(() => {
    if (!isConfirmOpen) {
      loggedOpenRef.current = false;
      return;
    }

    if (!loggedOpenRef.current && pendingAction) {
      loggedOpenRef.current = true;
      logSellerToolbox("confirm_open", {
        sellerId,
        actionId: pendingAction.id,
        riskLevel: pendingAction.riskLevel,
      });
    }

    cancelRef.current?.focus();
  }, [isConfirmOpen, pendingAction, sellerId]);

  useEffect(() => {
    if (!isConfirmOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        logSellerToolbox("confirm_cancel", {
          sellerId,
          actionId: pendingAction?.id,
          riskLevel: pendingAction?.riskLevel,
          reason: "escape",
        });
        closeConfirm();
        return;
      }

      if (event.key !== "Enter" || !pendingAction) return;
      if (!isSellerToolboxConfirmHighRisk(pendingAction.riskLevel)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isConfirmOpen, pendingAction, sellerId, closeConfirm]);

  const handleCancel = useCallback(() => {
    logSellerToolbox("confirm_cancel", {
      sellerId,
      actionId: pendingAction?.id,
      riskLevel: pendingAction?.riskLevel,
      reason: "cancel_button",
    });
    closeConfirm();
  }, [sellerId, pendingAction, closeConfirm]);

  const handleConfirmProceed = useCallback(() => {
    if (!pendingAction) return;
    openReason({
      actionId: pendingAction.id,
      title: pendingAction.title,
      description: pendingAction.description,
      riskLevel: pendingAction.riskLevel,
      reason: "",
      reasonCategory: null,
      metadata: pendingAction.metadata,
    });
    closeConfirm();
  }, [pendingAction, openReason, closeConfirm]);

  const handleDialogKeyDown = useCallback(
    (event) => {
      if (event.key !== "Enter" || !pendingAction) return;
      if (!isSellerToolboxConfirmHighRisk(pendingAction.riskLevel)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    [pendingAction],
  );

  if (!isConfirmOpen || !pendingAction) return null;

  return (
    <div className="seller-toolbox-confirm" data-risk={pendingAction.riskLevel}>
      <div
        className="seller-toolbox-confirm__backdrop"
        aria-hidden
        onClick={handleCancel}
      />
      <div
        className="seller-toolbox-confirm__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-toolbox-confirm-title"
        aria-describedby="seller-toolbox-confirm-desc"
        onKeyDown={handleDialogKeyDown}
      >
        <header className="seller-toolbox-confirm__head">
          <span className={sellerToolboxConfirmRiskBadgeClassName(pendingAction.riskLevel)}>
            Risco {sellerToolboxConfirmRiskLabel(pendingAction.riskLevel)}
          </span>
          <h4 id="seller-toolbox-confirm-title" className="seller-toolbox-confirm__title">
            {pendingAction.title}
          </h4>
        </header>

        <p id="seller-toolbox-confirm-desc" className="seller-toolbox-confirm__message">
          {pendingAction.description}
        </p>

        <footer className="seller-toolbox-confirm__actions">
          <button
            ref={cancelRef}
            type="button"
            className="s7-btn s7-btn--secondary s7-btn--sm seller-toolbox-confirm__cancel"
            onClick={handleCancel}
          >
            <span className="s7-btn__label">{pendingAction.cancelLabel}</span>
          </button>
          <S7Button
            type="button"
            variant={pendingAction.riskLevel === "danger" ? "warning" : "primary"}
            size="sm"
            onClick={handleConfirmProceed}
          >
            {pendingAction.confirmLabel}
          </S7Button>
        </footer>
      </div>
    </div>
  );
}

export default memo(SellerToolboxConfirmActionOverlay);
