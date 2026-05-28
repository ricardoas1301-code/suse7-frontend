import { useState } from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  formatPaymentMethodExpiry,
  formatPaymentMethodStatusLabel,
  formatPaymentMethodTitle,
  formatPaymentMethodTypeLabel,
  getPaymentMethodActionLabels,
  getPaymentMethodStatusTone,
  resolvePaymentMethodCardType,
} from "../paymentMethodUi";
import { deletePaymentMethod, setDefaultPaymentMethod } from "../services/billingApi";

/**
 * @param {{
 *   method: import("../paymentMethodUi").BillingPaymentMethod;
 *   onChanged?: () => void | Promise<void>;
 *   preview?: boolean;
 * }} props
 */
export default function PaymentMethodCard({ method, onChanged, preview = false }) {
  const { addNotification } = useNotifications();
  const actions = getPaymentMethodActionLabels();
  const statusTone = getPaymentMethodStatusTone(method);
  const [busy, setBusy] = useState(false);
  const cardType = resolvePaymentMethodCardType(method);
  const isCard = cardType === "CREDIT" || cardType === "DEBIT" || String(method.method_type).toLowerCase().includes("card");

  async function handleMakeDefault() {
    if (preview || method.is_default || busy) return;
    setBusy(true);
    const res = await setDefaultPaymentMethod(method.id);
    setBusy(false);
    if (!res.ok) {
      addNotification({
        event_type: "BILLING_CARD_DEFAULT_ERROR",
        entity_type: "billing",
        title: "Não foi possível definir padrão",
        message: res.error || res.data?.message || "Tente novamente.",
        severity: "error",
      });
      return;
    }
    await onChanged?.();
    addNotification({
      event_type: "BILLING_CARD_DEFAULT_OK",
      entity_type: "billing",
      title: "Cartão principal",
      message: "Forma de pagamento padrão atualizada.",
      severity: "success",
    });
  }

  async function handleRemove() {
    if (preview || busy) return;
    const confirmed = window.confirm("Remover esta forma de pagamento? Cobranças futuras usarão outro método cadastrado.");
    if (!confirmed) return;

    setBusy(true);
    const res = await deletePaymentMethod(method.id);
    setBusy(false);
    if (!res.ok) {
      addNotification({
        event_type: "BILLING_CARD_REMOVE_ERROR",
        entity_type: "billing",
        title: "Não foi possível remover",
        message: res.error || res.data?.message || "Tente novamente.",
        severity: "error",
      });
      return;
    }
    await onChanged?.();
    addNotification({
      event_type: "BILLING_CARD_REMOVED",
      entity_type: "billing",
      title: "Forma removida",
      message: "O cartão foi desativado com sucesso.",
      severity: "success",
    });
  }

  return (
    <article className={`s7-billing-payment-card s7-billing-payment-card--${statusTone}`}>
      <header className="s7-billing-payment-card__header">
        <div className="s7-billing-payment-card__brand">
          <PaymentMethodIcon methodType={method.method_type} />
          <div className="s7-billing-payment-card__copy">
            <h3>{formatPaymentMethodTitle(method)}</h3>
            <p>{formatPaymentMethodTypeLabel(method)}</p>
          </div>
        </div>
        <div className="s7-billing-payment-card__badges">
          {method.is_default ? <span className="s7-billing-payment-card__pill">Padrão</span> : null}
          {isCard && !method.supports_auto_renew ? (
            <span className="s7-billing-payment-card__pill s7-billing-payment-card__pill--muted">Manual</span>
          ) : null}
          <span className={`s7-billing-payment-card__status s7-billing-payment-card__status--${statusTone}`}>
            {formatPaymentMethodStatusLabel(method)}
          </span>
        </div>
      </header>

      <dl className="s7-billing-payment-card__meta">
        {method.holder_name ? (
          <div>
            <dt>Titular</dt>
            <dd>{method.holder_name}</dd>
          </div>
        ) : null}
        {isCard ? (
          <div>
            <dt>Validade</dt>
            <dd>{formatPaymentMethodExpiry(method)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Gateway</dt>
          <dd>{method.provider}</dd>
        </div>
      </dl>

      {isCard ? (
        <div className="s7-billing-payment-card__actions">
          <S7Button
            variant="secondary"
            size="sm"
            disabled={preview || busy || method.is_default}
            onClick={handleMakeDefault}
          >
            {actions.makeDefault}
          </S7Button>
          <S7Button variant="secondary" size="sm" disabled={preview || busy} onClick={handleRemove}>
            {actions.remove}
          </S7Button>
        </div>
      ) : null}
    </article>
  );
}

function PaymentMethodIcon({ methodType }) {
  const type = String(methodType || "").toLowerCase();
  if (type === "pix") return <QrCode size={22} aria-hidden="true" />;
  if (type === "boleto") return <Banknote size={22} aria-hidden="true" />;
  return <CreditCard size={22} aria-hidden="true" />;
}
