import { useMemo, useRef, useState } from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import S7ConfirmModal from "../../components/ui/S7ConfirmModal";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  buildPaymentMethodRemoveDescription,
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
 *   totalMethodsCount?: number;
 *   onChanged?: () => void | Promise<void>;
 *   preview?: boolean;
 * }} props
 */
export default function PaymentMethodCard({ method, totalMethodsCount = 1, onChanged, preview = false }) {
  const { addNotification } = useNotifications();
  const actions = getPaymentMethodActionLabels();
  const statusTone = getPaymentMethodStatusTone(method);
  const [defaultLoading, setDefaultLoading] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  const removeButtonRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const cardType = resolvePaymentMethodCardType(method);
  const isCard = cardType === "CREDIT" || cardType === "DEBIT" || String(method.method_type).toLowerCase().includes("card");
  const showPrimaryActions = totalMethodsCount > 1;

  const removeDescription = useMemo(
    () => buildPaymentMethodRemoveDescription(method, totalMethodsCount),
    [method, totalMethodsCount]
  );

  function focusRemoveButton() {
    const button = removeButtonRef.current?.querySelector("button");
    button?.focus();
  }

  function openRemoveModal() {
    if (preview || defaultLoading || removeLoading) return;
    setRemoveError(null);
    setRemoveOpen(true);
  }

  function closeRemoveModal() {
    if (removeLoading) return;
    setRemoveOpen(false);
    setRemoveError(null);
    requestAnimationFrame(() => focusRemoveButton());
  }

  async function handleMakeDefault() {
    if (preview || method.is_default || defaultLoading || removeLoading) return;
    setDefaultLoading(true);
    const res = await setDefaultPaymentMethod(method.id);
    setDefaultLoading(false);
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

  async function handleConfirmRemove() {
    if (preview || removeLoading) return;

    setRemoveLoading(true);
    setRemoveError(null);
    const res = await deletePaymentMethod(method.id);
    setRemoveLoading(false);

    if (!res.ok) {
      setRemoveError(res.error || res.data?.message || "Não foi possível remover. Tente novamente.");
      return;
    }

    setRemoveOpen(false);
    setRemoveError(null);
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
    <>
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
        </dl>

        {isCard ? (
          <div className="s7-billing-payment-card__actions">
            {showPrimaryActions ? (
              method.is_default ? (
                <span className="s7-billing-payment-card__primary-label">{actions.primary}</span>
              ) : (
                <S7Button
                  variant="secondary"
                  size="sm"
                  disabled={preview || defaultLoading || removeLoading}
                  loading={defaultLoading}
                  loadingLabel="Definindo…"
                  onClick={handleMakeDefault}
                >
                  {actions.makeDefault}
                </S7Button>
              )
            ) : null}
            <span ref={removeButtonRef} className="s7-billing-payment-card__remove-anchor">
              <S7Button
                variant="secondary"
                size="sm"
                disabled={preview || defaultLoading || removeLoading}
                onClick={openRemoveModal}
              >
                {actions.remove}
              </S7Button>
            </span>
          </div>
        ) : null}
      </article>

      <S7ConfirmModal
        open={removeOpen}
        title="Remover forma de pagamento?"
        confirmLabel="Remover cartão"
        confirmVariant="danger"
        hideCancel
        dangerBorder
        loading={removeLoading}
        loadingLabel="Removendo cartão…"
        onCancel={closeRemoveModal}
        onConfirm={handleConfirmRemove}
      >
        <p>{removeDescription}</p>
        {removeError ? (
          <p className="s7-billing-payment-remove-modal__error" role="alert">
            {removeError}
          </p>
        ) : null}
      </S7ConfirmModal>
    </>
  );
}

function PaymentMethodIcon({ methodType }) {
  const type = String(methodType || "").toLowerCase();
  if (type === "pix") {
    return (
      <span className="s7-billing-payment-card__icon" aria-hidden="true">
        <QrCode size={22} />
      </span>
    );
  }
  if (type === "boleto") {
    return (
      <span className="s7-billing-payment-card__icon" aria-hidden="true">
        <Banknote size={22} />
      </span>
    );
  }

  return (
    <span className="s7-billing-payment-card__icon s7-billing-payment-card__icon--card" aria-hidden="true">
      <CreditCard size={36} strokeWidth={1.75} />
    </span>
  );
}
