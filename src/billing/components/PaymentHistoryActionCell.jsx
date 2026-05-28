import {
  canExecutePaymentHistoryAction,
  getPaymentHistoryAction,
} from "../paymentHistoryAction";

/**
 * @param {{
 *   payment: Record<string, unknown>;
 *   onOpenPix: (payment: Record<string, unknown>) => void;
 *   onOpenBoleto: (payment: Record<string, unknown>) => void;
 *   onOpenPayUrl: (payment: Record<string, unknown>) => void;
 * }} props
 */
export default function PaymentHistoryActionCell({ payment, onOpenPix, onOpenBoleto, onOpenPayUrl }) {
  const action = getPaymentHistoryAction(payment);

  if (action.kind === "canceled_label") {
    return <span className="s7-billing-payment-history__label s7-billing-payment-history__label--muted">{action.label}</span>;
  }

  if (action.kind === "unavailable") {
    return <span className="s7-billing-payment-history__label">—</span>;
  }

  if (action.kind === "invoice_nf") {
    return (
      <button
        type="button"
        className="s7-billing-payment-history__action s7-billing-payment-history__action--disabled"
        disabled
        title={action.tooltip ?? undefined}
        aria-disabled="true"
      >
        {action.label}
      </button>
    );
  }

  function handleClick() {
    if (!action.actionable) return;
    if (action.kind === "pix_qr" && canExecutePaymentHistoryAction(payment, "pix_qr")) {
      onOpenPix(payment);
      return;
    }
    if (action.kind === "boleto_second_copy" && canExecutePaymentHistoryAction(payment, "boleto_second_copy")) {
      onOpenBoleto(payment);
      return;
    }
    if (action.kind === "pay_generic" && canExecutePaymentHistoryAction(payment, "pay_generic")) {
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
