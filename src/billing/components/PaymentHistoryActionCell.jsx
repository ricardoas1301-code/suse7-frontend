import { S7Tooltip } from "../../components/ui";
import {
  canExecutePaymentHistoryAction,
  getPaymentHistoryAction,
  PAYMENT_HISTORY_INVOICE_NF_TOOLTIP,
} from "../paymentHistoryAction";

/**
 * @param {{
 *   payment: Record<string, unknown>;
 *   businessDateKey?: string;
 *   onOpenPix: (payment: Record<string, unknown>) => void;
 *   onOpenBoleto: (payment: Record<string, unknown>) => void;
 *   onOpenPayUrl: (payment: Record<string, unknown>) => void;
 *   onOpenPayMonthly: (payment: Record<string, unknown>) => void;
 * }} props
 */
export default function PaymentHistoryActionCell({
  payment,
  businessDateKey,
  onOpenPix,
  onOpenBoleto,
  onOpenPayUrl,
  onOpenPayMonthly,
}) {
  const actionOptions = businessDateKey ? { businessDateKey } : {};
  const action = getPaymentHistoryAction(payment, actionOptions);

  if (action.kind === "canceled_label") {
    return <span className="s7-billing-payment-history__label s7-billing-payment-history__label--muted">{action.label}</span>;
  }

  if (action.kind === "unavailable") {
    return <span className="s7-billing-payment-history__label">—</span>;
  }

  if (action.kind === "invoice_nf") {
    return (
      <S7Tooltip
        richContent={
          <div className="s7-billing-payment-history__nf-tooltip">
            <strong className="s7-billing-payment-history__nf-tooltip-title">
              {PAYMENT_HISTORY_INVOICE_NF_TOOLTIP.title}
            </strong>
            <p className="s7-billing-payment-history__nf-tooltip-text">{PAYMENT_HISTORY_INVOICE_NF_TOOLTIP.text}</p>
          </div>
        }
        className="s7-billing-payment-history__nf-tooltip-trigger"
      >
        <span className="s7-billing-payment-history__action-accessible" tabIndex={0}>
          <button
            type="button"
            className="s7-billing-payment-history__action s7-billing-payment-history__action--disabled"
            disabled
            aria-disabled="true"
            tabIndex={-1}
          >
            {action.label}
          </button>
        </span>
      </S7Tooltip>
    );
  }

  if (action.kind === "expired") {
    const tooltip = action.tooltip ?? { title: action.label, text: "" };
    return (
      <S7Tooltip
        richContent={
          <div className="s7-billing-payment-history__nf-tooltip">
            <strong className="s7-billing-payment-history__nf-tooltip-title">{tooltip.title}</strong>
            <p className="s7-billing-payment-history__nf-tooltip-text">{tooltip.text}</p>
          </div>
        }
        className="s7-billing-payment-history__nf-tooltip-trigger"
      >
        <span className="s7-billing-payment-history__action-accessible" tabIndex={0}>
          <span
            className="s7-billing-payment-history__action s7-billing-payment-history__action--disabled"
            aria-disabled="true"
            role="text"
          >
            {action.label}
          </span>
        </span>
      </S7Tooltip>
    );
  }

  function handleClick() {
    if (!action.actionable || action.disabled) return;
    if (action.kind === "pay_monthly" && canExecutePaymentHistoryAction(payment, "pay_monthly", actionOptions)) {
      onOpenPayMonthly(payment);
      return;
    }
    if (action.kind === "pix_qr" && canExecutePaymentHistoryAction(payment, "pix_qr", actionOptions)) {
      onOpenPix(payment);
      return;
    }
    if (action.kind === "boleto_second_copy" && canExecutePaymentHistoryAction(payment, "boleto_second_copy", actionOptions)) {
      onOpenBoleto(payment);
      return;
    }
    if (action.kind === "pay_generic" && canExecutePaymentHistoryAction(payment, "pay_generic", actionOptions)) {
      onOpenPayUrl(payment);
    }
  }

  if (!action.actionable) {
    return <span className="s7-billing-payment-history__label">—</span>;
  }

  return (
    <button type="button" className="s7-billing-payment-history__action" onClick={handleClick}>
      {action.label}
    </button>
  );
}
