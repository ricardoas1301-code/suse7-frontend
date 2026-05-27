import { memo, useCallback, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { S7Button } from "../../../../../components/ui";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  sellerToolboxFeedbackToneClassName,
  sellerToolboxFeedbackTypeLabel,
} from "./sellerToolboxFeedbackModel";
import { useSellerToolboxFeedback } from "./useSellerToolboxFeedback";
import { useSellerToolboxOperationalLog } from "./useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "./sellerToolboxOperationalLog";
import "./SellerToolboxFeedback.css";

/** @type {Record<import("./sellerToolboxFeedbackModel").SellerToolboxFeedbackType, import("react").ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>>} */
const FEEDBACK_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function SellerToolboxFeedbackBanner() {
  const { sellerId } = useSellerToolbox();
  const { feedbackState, isVisible, clearFeedback } = useSellerToolboxFeedback();
  const { logOperation } = useSellerToolboxOperationalLog();
  const closeRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const loggedShowRef = useRef(false);

  useEffect(() => {
    if (!isVisible || !feedbackState) {
      loggedShowRef.current = false;
      return;
    }

    if (!loggedShowRef.current) {
      loggedShowRef.current = true;
      logSellerToolbox("feedback_show", {
        sellerId,
        type: feedbackState.type,
      });
      logOperation({
        event: "feedback_show",
        category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FEEDBACK,
        metadata: { type: feedbackState.type },
      });
    }

    closeRef.current?.focus();
  }, [isVisible, feedbackState, sellerId, logOperation]);

  const handleClose = useCallback(() => {
    if (feedbackState) {
      logSellerToolbox("feedback_close", {
        sellerId,
        type: feedbackState.type,
      });
      logOperation({
        event: "feedback_close",
        category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FEEDBACK,
        metadata: { type: feedbackState.type },
      });
    }
    clearFeedback();
  }, [sellerId, feedbackState, clearFeedback, logOperation]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    },
    [handleClose],
  );

  const handleOptionalAction = useCallback(() => {
    feedbackState?.action?.();
  }, [feedbackState]);

  if (!isVisible || !feedbackState) return null;

  const Icon = FEEDBACK_ICONS[feedbackState.type] ?? Info;

  return (
    <div
      className={`seller-toolbox-feedback ${sellerToolboxFeedbackToneClassName(feedbackState.type)}`}
      role="status"
      aria-live="polite"
      data-feedback-type={feedbackState.type}
      onKeyDown={handleKeyDown}
    >
      <div className="seller-toolbox-feedback__icon-wrap" aria-hidden>
        <Icon className="seller-toolbox-feedback__icon" strokeWidth={2} />
      </div>

      <div className="seller-toolbox-feedback__copy">
        <div className="seller-toolbox-feedback__headline">
          <span className="seller-toolbox-feedback__type">{sellerToolboxFeedbackTypeLabel(feedbackState.type)}</span>
          <h4 className="seller-toolbox-feedback__title">{feedbackState.title}</h4>
        </div>
        <p className="seller-toolbox-feedback__message">{feedbackState.description}</p>
        {feedbackState.actionLabel && feedbackState.action ? (
          <S7Button
            type="button"
            variant="utility"
            size="sm"
            className="seller-toolbox-feedback__action"
            onClick={handleOptionalAction}
          >
            {feedbackState.actionLabel}
          </S7Button>
        ) : null}
      </div>

      <button
        ref={closeRef}
        type="button"
        className="seller-toolbox-feedback__close"
        aria-label="Fechar feedback"
        onClick={handleClose}
        onKeyDown={handleKeyDown}
      >
        <X className="seller-toolbox-feedback__close-icon" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export default memo(SellerToolboxFeedbackBanner);
