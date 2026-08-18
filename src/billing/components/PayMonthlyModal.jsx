import { useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import CheckoutPaymentMethodCard from "./CheckoutPaymentMethodCard";
import { CHECKOUT_PAYMENT_METHOD_OPTIONS } from "../checkoutPaymentMethodUi";
import { formatPaymentDueDatePt, formatPlanDisplayName, formatPlanPriceBRL } from "../billingFormatters";
import { payRenewalCycle } from "../services/billingApi";
import { isCheckoutAwaitingPayment } from "../checkoutUi";
import { formatRenewalPeriodLabel } from "../renewalExperienceUi";
import "../../components/CompleteProfileModal.css";
import "./PayMonthlyModal.css";

const MONTHLY_PAYMENT_OPTIONS = CHECKOUT_PAYMENT_METHOD_OPTIONS.filter(
  (option) => option.id === "PIX" || option.id === "BOLETO"
);

/**
 * @param {{
 *   open: boolean;
 *   payment: Record<string, unknown> | null;
 *   onClose: () => void;
 *   mode?: "monthly" | "renewal";
 *   onChargeGenerated?: (payload: {
 *     payment: Record<string, unknown>;
 *     checkout: Record<string, unknown>;
 *     paymentMethod: string;
 *   }) => void | Promise<void>;
 * }} props
 */
export default function PayMonthlyModal({ open, payment, onClose, onChargeGenerated, mode = "monthly" }) {
  const { addNotification } = useNotifications();
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [loading, setLoading] = useState(false);
  const isRenewal = mode === "renewal";

  const planName = payment?.plan_name ? String(payment.plan_name) : "seu plano";
  const renewalCycleId = payment?.renewal_cycle_id ? String(payment.renewal_cycle_id) : "";
  const dueDateLabel = useMemo(
    () => formatPaymentDueDatePt(payment?.due_date) || "—",
    [payment?.due_date]
  );
  const amountLabel = useMemo(() => {
    const cents = payment?.amount_cents == null ? null : Number(payment.amount_cents);
    if (!Number.isFinite(cents)) return "—";
    return formatPlanPriceBRL(cents / 100);
  }, [payment?.amount_cents]);
  const displayPlanName = useMemo(() => formatPlanDisplayName(planName), [planName]);
  const periodLabel = useMemo(() => {
    if (payment?.period_start && payment?.period_end) {
      return formatRenewalPeriodLabel({ period: { start: payment.period_start, end: payment.period_end } });
    }
    return "—";
  }, [payment?.period_end, payment?.period_start]);
  const title = isRenewal ? "Renovar assinatura" : "Pagar mensalidade";
  const subtitle = isRenewal
    ? "Escolha como deseja realizar o pagamento da sua mensalidade."
    : "Confirme os dados e escolha como deseja pagar.";

  useEffect(() => {
    if (!open) {
      setPaymentMethod("PIX");
      setLoading(false);
    }
  }, [open]);

  if (!open || !payment) return null;

  function handleBackdropClick() {
    if (loading) return;
    onClose();
  }

  async function handleConfirm() {
    if (!renewalCycleId || loading) return;

    setLoading(true);
    const res = await payRenewalCycle(renewalCycleId, { payment_method: paymentMethod });
    setLoading(false);

    if (!res.ok) {
      addNotification({
        event_type: "BILLING_MONTHLY_PAY_ERROR",
        entity_type: "billing",
        title: isRenewal ? "Falha ao gerar renovação" : "Falha ao gerar cobrança",
        message: res.error || res.data?.message || "Não foi possível gerar a cobrança da mensalidade.",
        severity: "error",
      });
      return;
    }

    const checkout =
      res.data?.checkout && typeof res.data.checkout === "object" ? res.data.checkout : res.data;
    if (!isCheckoutAwaitingPayment(checkout)) {
      addNotification({
        event_type: "BILLING_MONTHLY_PAY_OK",
        entity_type: "billing",
        title: "Pagamento registrado",
        message: "A mensalidade foi processada.",
        severity: "success",
      });
      onClose();
      return;
    }

    await onChargeGenerated?.({
      payment,
      checkout: /** @type {Record<string, unknown>} */ (checkout),
      paymentMethod,
    });
    onClose();
  }

  const loadingLabel = paymentMethod === "PIX" ? "Gerando Pix…" : "Gerando boleto…";

  return (
    <div className="profile-modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <div
        className="profile-modal s7-billing-pay-monthly-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-billing-pay-monthly-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="s7-billing-pay-monthly-title">{title}</h3>
        <p className="s7-billing-muted">{subtitle}</p>

        <dl className="s7-billing-pay-monthly-modal__summary">
          <div>
            <dt>Plano</dt>
            <dd>{displayPlanName}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{amountLabel}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{dueDateLabel}</dd>
          </div>
          {isRenewal ? (
            <div>
              <dt>Período</dt>
              <dd>{periodLabel}</dd>
            </div>
          ) : null}
          {isRenewal ? (
            <div>
              <dt>Status</dt>
              <dd>{payment?.status_label ? String(payment.status_label) : "Renovação pendente"}</dd>
            </div>
          ) : null}
        </dl>

        <div className="s7-billing-pay-monthly-modal__methods" role="radiogroup" aria-label="Forma de pagamento">
          {MONTHLY_PAYMENT_OPTIONS.map((option) => (
            <CheckoutPaymentMethodCard
              key={option.id}
              id={option.id}
              label={option.label}
              description={option.description}
              enabled={option.enabled}
              selected={paymentMethod === option.id}
              disabled={loading}
              onSelect={setPaymentMethod}
            />
          ))}
        </div>

        <div className="s7-billing-pay-monthly-modal__actions">
          <S7Button variant="primary" onClick={handleConfirm} disabled={loading || !renewalCycleId}>
            {loading ? loadingLabel : paymentMethod === "PIX" ? "Gerar Pix" : "Gerar boleto"}
          </S7Button>
        </div>
      </div>
    </div>
  );
}
