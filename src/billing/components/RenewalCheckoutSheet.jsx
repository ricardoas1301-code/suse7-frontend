import { useCallback, useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import { resolveBillingCardErrorMessage } from "../billingCheckoutErrors";
import { resolveCheckoutPaymentContext } from "../billingFinancialStateUi.js";
import {
  BILLING_PAYMENT_CONTEXT,
  buildBillingPaymentContextCopy,
  buildRenewalRecurringConsentCopy,
  normalizeAvailablePaymentMethods,
  resolveBillingPaymentConfirmLabel,
} from "../billingPaymentContextUi.js";
import {
  formatPlanDisplayName,
  formatPlanPriceBRL,
  formatPaymentDueDatePt,
} from "../billingFormatters";
import {
  inferBillingSandboxFromUrl,
  isCardCheckoutApproved,
  isCheckoutAwaitingPayment,
  pickCheckoutBoletoUrl,
} from "../checkoutUi";
import { normalizeCheckoutPaymentMethod } from "../checkoutPaymentMethodUi";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { payRenewalCycle } from "../services/billingApi";
import {
  buildRenewalModalPayment,
  formatRenewalCompetenciaLabel,
  formatRenewalPeriodLabel,
} from "../renewalExperienceUi.js";
import BillingBoletoModal from "./BillingBoletoModal.jsx";
import CardCheckoutModal from "./CardCheckoutModal.jsx";
import CheckoutPaymentMethodSelector from "./CheckoutPaymentMethodSelector.jsx";
import PixCheckoutModal from "./PixCheckoutModal.jsx";

function createCorrelationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `renewal-${Date.now()}`;
}

/**
 * Modal canônico de pagamento — contexto MONTHLY_RENEWAL (Pix, cartão, boleto).
 * Reutiliza CheckoutPaymentMethodSelector + CardCheckoutModal do checkout homologado.
 */
export default function RenewalCheckoutSheet({
  open,
  onClose,
  renewalExperience,
  pendingRenewal = null,
  planName: planNameProp = null,
  onPaymentConfirmed,
  onPixGenerated,
  onBoletoGenerated,
}) {
  const { addNotification } = useNotifications();
  const { methods: savedPaymentMethods, refresh: refreshPaymentMethods } = usePaymentMethods();

  const experience = useMemo(() => {
    if (renewalExperience?.renewal_cycle_id) return renewalExperience;
    if (pendingRenewal?.renewal_cycle_id) {
      return {
        renewal_cycle_id: pendingRenewal.renewal_cycle_id,
        plan: {
          name: pendingRenewal.plan_name ?? pendingRenewal.plan_key ?? null,
          plan_key: pendingRenewal.plan_key ?? null,
        },
        amount: pendingRenewal.amount ?? null,
        due_date: pendingRenewal.renewal_due_date ?? null,
        available_payment_methods: ["PIX", "CREDIT_CARD", "BOLETO"],
      };
    }
    return null;
  }, [renewalExperience, pendingRenewal]);

  const context = useMemo(() => resolveCheckoutPaymentContext(experience), [experience]);
  const copy = useMemo(() => buildBillingPaymentContextCopy(context), [context]);
  const recurringCopy = useMemo(() => buildRenewalRecurringConsentCopy(), []);
  const isReactivation = context === BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION;

  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardCheckoutLoading, setCardCheckoutLoading] = useState(false);
  const [cardCheckoutError, setCardCheckoutError] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [boletoModalOpen, setBoletoModalOpen] = useState(false);

  const renewalCycleId = experience?.renewal_cycle_id ? String(experience.renewal_cycle_id) : "";
  const modalPayment = useMemo(() => buildRenewalModalPayment(experience), [experience]);
  const availableMethods = useMemo(
    () => normalizeAvailablePaymentMethods(experience?.available_payment_methods),
    [experience?.available_payment_methods]
  );
  const displayPlanName = useMemo(() => {
    const raw = planNameProp ?? modalPayment?.plan_name ?? experience?.plan?.name ?? "seu plano";
    return formatPlanDisplayName(String(raw));
  }, [experience?.plan?.name, modalPayment?.plan_name, planNameProp]);
  const amountLabel = useMemo(() => {
    const cents = modalPayment?.amount_cents;
    if (!Number.isFinite(cents)) return "—";
    return formatPlanPriceBRL(cents / 100);
  }, [modalPayment?.amount_cents]);
  const dueDateLabel = useMemo(
    () => formatPaymentDueDatePt(modalPayment?.due_date) || "—",
    [modalPayment?.due_date]
  );
  const competenciaLabel = modalPayment?.competencia_label ?? formatRenewalCompetenciaLabel(experience) ?? "—";
  const periodoLabel = modalPayment?.periodo_label ?? formatRenewalPeriodLabel(experience);
  const boletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickCheckoutBoletoUrl(checkoutResult)),
    [checkoutResult]
  );

  const normalizedMethod = normalizeCheckoutPaymentMethod(paymentMethod);
  const confirmLabel = resolveBillingPaymentConfirmLabel(context, normalizedMethod);
  const requiresRecurringConsent = normalizedMethod === "CREDIT_CARD";
  const canConfirm = Boolean(renewalCycleId) && !loading && (!requiresRecurringConsent || recurringConsent);

  useEffect(() => {
    if (!open) return;
    setPaymentMethod("PIX");
    setError("");
    setLoading(false);
    setRecurringConsent(false);
    setCardModalOpen(false);
    setCardCheckoutLoading(false);
    setCardCheckoutError(null);
    setCheckoutResult(null);
    setPixModalOpen(false);
    setBoletoModalOpen(false);
  }, [open, renewalCycleId]);

  const handleBackdropClose = useCallback(() => {
    if (loading || cardCheckoutLoading) return;
    onClose?.();
  }, [cardCheckoutLoading, loading, onClose]);

  const emitCheckoutResult = useCallback(
    async (checkout, method) => {
      if (method === "PIX") {
        setCheckoutResult(checkout);
        setPixModalOpen(true);
        onPixGenerated?.({ checkout, paymentMethod: method });
        return;
      }
      if (method === "BOLETO") {
        setCheckoutResult(checkout);
        setBoletoModalOpen(true);
        onBoletoGenerated?.({ checkout, paymentMethod: method });
      }
    },
    [onBoletoGenerated, onPixGenerated]
  );

  const handlePayRenewal = useCallback(
    async ({ method, cardPayload = null }) => {
      if (!renewalCycleId) {
        setError("Renovação indisponível no momento.");
        return null;
      }

      setLoading(true);
      setError("");

      const correlationId = createCorrelationId();
      const res = await payRenewalCycle(renewalCycleId, {
        payment_method: method,
        recurring_consent: method === "CREDIT_CARD",
        correlation_id: correlationId,
        ...(cardPayload ?? {}),
      });

      setLoading(false);

      if (!res.ok) {
        const message =
          res.error ||
          res.data?.message ||
          (method === "CREDIT_CARD"
            ? "Pagamento não aprovado. Confira os dados do cartão ou tente outro método."
            : "Não foi possível iniciar o pagamento da renovação.");
        setError(message);
        return null;
      }

      const checkout =
        res.data?.checkout && typeof res.data.checkout === "object" ? res.data.checkout : res.data;

      if (method === "CREDIT_CARD") {
        if (isCardCheckoutApproved(res.data) || !isCheckoutAwaitingPayment(checkout)) {
          await refreshPaymentMethods();
          await onPaymentConfirmed?.();
          onClose?.();
          addNotification({
            event_type: "BILLING_RENEWAL_CARD_OK",
            entity_type: "billing",
            title: "Renovação confirmada",
            message: "Pagamento aprovado e renovação automática ativada no cartão selecionado.",
            severity: "success",
          });
          return res.data;
        }
      }

      if (isCheckoutAwaitingPayment(checkout)) {
        onClose?.();
        await emitCheckoutResult(/** @type {Record<string, unknown>} */ (checkout), method);
        return res.data;
      }

      await onPaymentConfirmed?.();
      onClose?.();
      return res.data;
    },
    [addNotification, emitCheckoutResult, onClose, onPaymentConfirmed, refreshPaymentMethods, renewalCycleId]
  );

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;

    if (normalizedMethod === "CREDIT_CARD") {
      setCardCheckoutError(null);
      setCardModalOpen(true);
      return;
    }

    await handlePayRenewal({ method: normalizedMethod });
  }, [canConfirm, handlePayRenewal, normalizedMethod]);

  const submitCardCheckout = useCallback(
    async (cardPayload) => {
      if (!renewalCycleId || cardCheckoutLoading) return;

      if (requiresRecurringConsent && !recurringConsent) {
        setCardCheckoutError("Confirme o consentimento para renovação automática no cartão.");
        return;
      }

      setCardCheckoutLoading(true);
      setCardCheckoutError(null);

      const res = await payRenewalCycle(renewalCycleId, {
        payment_method: "CREDIT_CARD",
        recurring_consent: true,
        correlation_id: createCorrelationId(),
        ...cardPayload,
      });

      setCardCheckoutLoading(false);

      if (!res.ok) {
        setCardCheckoutError(
          resolveBillingCardErrorMessage(
            res,
            "Pagamento não aprovado. Confira os dados do cartão ou tente outro método."
          )
        );
        return;
      }

      const approved = isCardCheckoutApproved(res.data);
      setCardModalOpen(false);
      await refreshPaymentMethods();

      if (approved) {
        await onPaymentConfirmed?.();
        onClose?.();
        addNotification({
          event_type: "BILLING_RENEWAL_CARD_OK",
          entity_type: "billing",
          title: "Renovação confirmada",
          message: "Pagamento aprovado e renovação automática ativada no cartão selecionado.",
          severity: "success",
        });
        return;
      }

      setCardCheckoutError(
        "Pagamento não aprovado. Confira os dados do cartão ou tente Pix ou boleto."
      );
    },
    [
      addNotification,
      cardCheckoutLoading,
      onClose,
      onPaymentConfirmed,
      recurringConsent,
      refreshPaymentMethods,
      renewalCycleId,
      requiresRecurringConsent,
    ]
  );

  if (!open || !experience) return null;

  return (
    <>
      <div
        className="s7-billing-checkout-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-renewal-checkout-title"
        onClick={handleBackdropClose}
      >
        <div
          className="s7-billing-checkout-sheet__panel s7-billing-checkout-sheet__panel--renewal"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="s7-billing-renewal-checkout-header s7-billing-checkout-sheet__header">
            <h3 id="s7-renewal-checkout-title">{copy.title}</h3>
            <p className="s7-billing-modal-subtitle">{copy.subtitle}</p>
          </header>

          <div className="s7-billing-checkout-sheet__body">
            <div className="s7-billing-renewal-checkout-summary">
              <div className="s7-billing-renewal-checkout-summary-row">
                <span>Plano</span>
                <strong>{displayPlanName}</strong>
              </div>
              <div className="s7-billing-renewal-checkout-summary-row">
                <span>Valor mensal</span>
                <strong>{amountLabel}</strong>
              </div>
              {isReactivation ? (
                <>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Operação</span>
                    <strong>Reativação da assinatura</strong>
                  </div>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Novo período</span>
                    <strong>Inicia após a confirmação do pagamento</strong>
                  </div>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Próxima cobrança</span>
                    <strong>Calculada a partir da confirmação</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Competência</span>
                    <strong>{competenciaLabel}</strong>
                  </div>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Período a quitar</span>
                    <strong>{periodoLabel}</strong>
                  </div>
                  <div className="s7-billing-renewal-checkout-summary-row">
                    <span>Vencimento</span>
                    <strong>{dueDateLabel}</strong>
                  </div>
                </>
              )}
            </div>

            <CheckoutPaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={loading || cardCheckoutLoading}
              planName={displayPlanName}
              title={copy.selectorTitle}
              subtitle={copy.selectorSubtitle}
              availableMethods={availableMethods}
            />

            {requiresRecurringConsent ? (
              <label className="s7-billing-renewal-recurring-consent">
                <input
                  type="checkbox"
                  checked={recurringConsent}
                  onChange={(event) => setRecurringConsent(event.target.checked)}
                  disabled={loading || cardCheckoutLoading}
                />
                <span>{recurringCopy.message}</span>
              </label>
            ) : null}

            {error ? (
              <p className="s7-billing-modal-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="s7-billing-checkout-sheet__footer">
            <div className="s7-billing-checkout-sheet__actions s7-billing-checkout-sheet__actions--primary-only">
              <S7Button variant="primary" onClick={handleConfirm} disabled={!canConfirm} loading={loading}>
                {loading ? "Processando…" : confirmLabel}
              </S7Button>
            </div>
          </footer>
        </div>
      </div>

      <CardCheckoutModal
        open={cardModalOpen}
        mode="checkout"
        planName={displayPlanName}
        planValue={modalPayment?.amount_cents != null ? modalPayment.amount_cents / 100 : experience.amount}
        savedMethods={savedPaymentMethods}
        loading={cardCheckoutLoading}
        errorMessage={cardCheckoutError}
        onClose={() => {
          if (cardCheckoutLoading) return;
          setCardModalOpen(false);
        }}
        onSubmit={submitCardCheckout}
      />

      <PixCheckoutModal
        open={pixModalOpen}
        checkout={checkoutResult}
        planName={displayPlanName}
        onClose={() => {
          setPixModalOpen(false);
          setCheckoutResult(null);
        }}
        onPaymentConfirmed={() => onPaymentConfirmed?.()}
      />

      <BillingBoletoModal
        open={boletoModalOpen}
        checkout={checkoutResult}
        planName={displayPlanName}
        isSandbox={boletoSandbox}
        onClose={() => {
          setBoletoModalOpen(false);
          setCheckoutResult(null);
        }}
        onPaymentConfirmed={() => onPaymentConfirmed?.()}
      />
    </>
  );
}
