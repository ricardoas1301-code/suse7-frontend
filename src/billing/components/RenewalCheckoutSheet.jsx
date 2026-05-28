import { useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import CheckoutPaymentMethodSelector from "./CheckoutPaymentMethodSelector";
import PixCheckoutModal from "./PixCheckoutModal";
import BillingBoletoModal from "./BillingBoletoModal";
import CardCheckoutModal from "./CardCheckoutModal";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { payRenewalCycle } from "../services/billingApi";
import { resolveBillingCardErrorMessage } from "../billingCheckoutErrors";
import {
  inferBillingSandboxFromUrl,
  isCardCheckoutApproved,
  isCheckoutAwaitingPayment,
  pickCheckoutBoletoUrl,
} from "../checkoutUi";

/**
 * @param {{
 *   open: boolean;
 *   pendingRenewal: Record<string, unknown> | null;
 *   onClose: () => void;
 *   onPaymentConfirmed?: () => void | Promise<void>;
 * }} props
 */
export default function RenewalCheckoutSheet({ open, pendingRenewal, onClose, onPaymentConfirmed }) {
  const { addNotification } = useNotifications();
  const { methods: savedPaymentMethods, refresh: refreshPaymentMethods } = usePaymentMethods();
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardCheckoutLoading, setCardCheckoutLoading] = useState(false);
  const [cardCheckoutError, setCardCheckoutError] = useState(null);

  const planName = pendingRenewal?.plan_name ? String(pendingRenewal.plan_name) : "seu plano";
  const renewalCycleId = pendingRenewal?.renewal_cycle_id ? String(pendingRenewal.renewal_cycle_id) : "";

  useEffect(() => {
    if (!open) {
      setPaymentMethod("PIX");
      setCheckoutResult(null);
      setCheckoutLoading(false);
      setCardModalOpen(false);
      setCardCheckoutLoading(false);
      setCardCheckoutError(null);
    }
  }, [open]);

  const showPixModal =
    Boolean(checkoutResult) && paymentMethod === "PIX" && isCheckoutAwaitingPayment(checkoutResult);
  const showBoletoModal =
    Boolean(checkoutResult) && paymentMethod === "BOLETO" && isCheckoutAwaitingPayment(checkoutResult);
  const boletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickCheckoutBoletoUrl(checkoutResult)),
    [checkoutResult]
  );

  if (!open || !pendingRenewal) return null;

  async function handleCheckoutSuccess(data) {
    const checkout = data?.checkout && typeof data.checkout === "object" ? data.checkout : data;
    setCheckoutResult(checkout);
    await refreshPaymentMethods();
    if (isCardCheckoutApproved(data?.checkout ?? data)) {
      addNotification({
        event_type: "BILLING_RENEWAL_OK",
        entity_type: "billing",
        title: "Renovação aprovada",
        message: `Plano ${planName} renovado com sucesso.`,
        severity: "success",
      });
      await onPaymentConfirmed?.();
      onClose();
    }
  }

  async function confirmRenewalPayment() {
    if (!renewalCycleId || checkoutLoading) return;

    if (paymentMethod === "CREDIT_CARD") {
      setCardCheckoutError(null);
      setCardModalOpen(true);
      return;
    }

    setCheckoutLoading(true);
    const res = await payRenewalCycle(renewalCycleId, { payment_method: paymentMethod });
    setCheckoutLoading(false);

    if (!res.ok) {
      addNotification({
        event_type: "BILLING_RENEWAL_ERROR",
        entity_type: "billing",
        title: "Falha na renovação",
        message: res.error || res.data?.message || "Não foi possível gerar a cobrança de renovação.",
        severity: "error",
      });
      return;
    }

    await handleCheckoutSuccess(res.data);
    if (!isCardCheckoutApproved(res.data?.checkout) && isCheckoutAwaitingPayment(res.data?.checkout)) {
      addNotification({
        event_type: "BILLING_RENEWAL_OK",
        entity_type: "billing",
        title: "Cobrança gerada",
        message: "Conclua o pagamento para renovar seu plano.",
        severity: "info",
      });
    }
  }

  async function submitCardRenewal(cardPayload) {
    if (!renewalCycleId || cardCheckoutLoading) return;

    setCardCheckoutLoading(true);
    setCardCheckoutError(null);

    const res = await payRenewalCycle(renewalCycleId, {
      payment_method: "CREDIT_CARD",
      card_type: "credit",
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

    setCardModalOpen(false);
    await handleCheckoutSuccess(res.data);

    if (!isCardCheckoutApproved(res.data?.checkout)) {
      setCardCheckoutError(
        "Pagamento não aprovado. Confira os dados do cartão ou tente outro método."
      );
    }
  }

  const sheetOpen = open && !showPixModal && !showBoletoModal;

  return (
    <>
      {sheetOpen ? (
        <div className="s7-billing-checkout-sheet" role="dialog" aria-modal="true" aria-labelledby="s7-renewal-checkout-title">
          <div className="s7-billing-checkout-sheet__panel" onClick={(event) => event.stopPropagation()}>
            <h3 id="s7-renewal-checkout-title">Renovar plano {planName}</h3>
            <p className="s7-billing-muted">Escolha como renovar seu plano atual.</p>
            {!checkoutResult ? (
              <CheckoutPaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={checkoutLoading}
                planName={planName}
                title="Pagamento"
                subtitle="Escolha como renovar seu plano atual. O acesso continua até a confirmação do pagamento."
              />
            ) : null}
            {!checkoutResult ? (
              <div className="s7-billing-checkout-sheet__actions s7-billing-checkout-sheet__actions--primary-only">
                <S7Button variant="primary" onClick={confirmRenewalPayment} disabled={checkoutLoading}>
                  {checkoutLoading
                    ? "Gerando cobrança…"
                    : paymentMethod === "CREDIT_CARD"
                      ? "Continuar com cartão"
                      : "Gerar pagamento"}
                </S7Button>
                <S7Button variant="secondary" onClick={onClose} disabled={checkoutLoading}>
                  Cancelar
                </S7Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <PixCheckoutModal
        open={showPixModal}
        checkout={checkoutResult}
        planName={planName}
        onClose={() => {
          setCheckoutResult(null);
          onClose();
        }}
        onPaymentConfirmed={onPaymentConfirmed}
      />

      <BillingBoletoModal
        open={showBoletoModal}
        checkout={checkoutResult}
        planName={planName}
        isSandbox={boletoSandbox}
        onClose={() => {
          setCheckoutResult(null);
          onClose();
        }}
        onPaymentConfirmed={onPaymentConfirmed}
      />

      <CardCheckoutModal
        open={cardModalOpen}
        mode="checkout"
        planName={planName}
        planValue={pendingRenewal?.amount}
        savedMethods={savedPaymentMethods}
        loading={cardCheckoutLoading}
        errorMessage={cardCheckoutError}
        onClose={() => {
          if (!cardCheckoutLoading) setCardModalOpen(false);
        }}
        onSubmit={submitCardRenewal}
      />
    </>
  );
}
