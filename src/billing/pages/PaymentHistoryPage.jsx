import { useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";

import { S7Button, S7PageHeader } from "../../components/ui";

import PixCheckoutModal from "../components/PixCheckoutModal";
import RenewalCheckoutSheet from "../components/RenewalCheckoutSheet";
import BillingBoletoModal from "../components/BillingBoletoModal";

import PaymentHistoryActionCell from "../components/PaymentHistoryActionCell";

import BillingRevenueHealthCard from "../components/BillingRevenueHealthCard";

import { buildRevenueHealthPreviewSample } from "../billingFinancialExperienceUi";

import {

  buildPaymentHistoryPreviewSamples,

  formatPaymentHistoryDate,

  formatPaymentHistoryMethodLabel,

} from "../paymentHistoryUi";

import {

  buildPaymentHistoryBoletoPayment,

  buildPaymentHistoryPixCheckout,

  canExecutePaymentHistoryAction,

} from "../paymentHistoryAction";

import {

  formatPaymentHistoryDueDateLabel,

  formatPaymentHistoryPaidDateLabel,

  paymentHistoryPresentationStatusClass,

  resolvePaymentHistoryRowPresentation,

} from "../paymentHistoryPresentation";

import { useNotifications } from "../../contexts/NotificationContext";
import { useBillingRenewalExperience } from "../hooks/useBillingRenewalExperience.jsx";
import { useCanonicalBusinessDate } from "../hooks/useCanonicalBusinessDate";

import { inferBillingSandboxFromUrl, pickCheckoutBoletoUrl } from "../checkoutUi";

import { usePaymentHistory } from "../hooks/usePaymentHistory";

import { useRevenueHealth } from "../hooks/useRevenueHealth";

import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";

import { isBillingDevPreviewEnabled } from "../billingDevGuard";

import "../billing.css";



export default function PaymentHistoryPage() {

  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  const businessDateKey = useCanonicalBusinessDate();

  const { loading, error, payments, refresh } = usePaymentHistory();

  const { loading: healthLoading, revenueHealth, error: healthError, refresh: refreshHealth } = useRevenueHealth();

  const { statusExtras, refresh: refreshSubscriptionStatus } = useSubscriptionStatus();
  const {
    renewalExperience,
    renewalCheckoutOpen,
    setRenewalCheckoutOpen,
    openRenewalCheckout,
    showRenewalPrimaryAction,
  } = useBillingRenewalExperience();

  const [pixPayment, setPixPayment] = useState(null);

  const [pixCheckoutFromPay, setPixCheckoutFromPay] = useState(null);

  const [boletoPayment, setBoletoPayment] = useState(null);

  const [boletoCheckoutFromPay, setBoletoCheckoutFromPay] = useState(null);



  const previewEnabled = isBillingDevPreviewEnabled(searchParams.get("preview"), "payments");

  const financePreviewEnabled = isBillingDevPreviewEnabled(searchParams.get("preview"), "finance");



  const displayedPayments = useMemo(() => {

    if (payments.length > 0) return payments;

    if (previewEnabled) return buildPaymentHistoryPreviewSamples();

    return payments;

  }, [payments, previewEnabled]);



  const displayedHealth = useMemo(() => {

    if (financePreviewEnabled && !healthError) return buildRevenueHealthPreviewSample();

    return revenueHealth;

  }, [revenueHealth, financePreviewEnabled, healthError]);



  const pixCheckout = useMemo(
    () => (pixCheckoutFromPay ? pixCheckoutFromPay : pixPayment ? buildPaymentHistoryPixCheckout(pixPayment) : null),
    [pixPayment, pixCheckoutFromPay],
  );

  const boletoModalPayment = useMemo(
    () =>
      boletoCheckoutFromPay
        ? null
        : boletoPayment
          ? buildPaymentHistoryBoletoPayment(boletoPayment)
          : null,
    [boletoPayment, boletoCheckoutFromPay],
  );

  const boletoSandbox = useMemo(() => {
    if (boletoCheckoutFromPay) {
      return inferBillingSandboxFromUrl(pickCheckoutBoletoUrl(boletoCheckoutFromPay));
    }
    return inferBillingSandboxFromUrl(boletoPayment?.invoice_url);
  }, [boletoCheckoutFromPay, boletoPayment]);



  function refreshAllData() {

    refresh();

    refreshHealth();

    refreshSubscriptionStatus({ silent: true });

  }



  async function handleOpenRenewSubscription(payment) {
    if (
      !canExecutePaymentHistoryAction(payment, "pay_monthly", { businessDateKey }) &&
      String(payment?.billing_state || "").toLowerCase() !== "awaiting_generation"
    ) {
      addNotification({
        event_type: "BILLING_RENEWAL_ERROR",
        entity_type: "billing",
        title: "Renovação indisponível",
        message: "Esta linha não está elegível para renovação no momento.",
        severity: "warning",
      });
      return;
    }

    const result = await openRenewalCheckout();
    if (!result.ok) {
      addNotification({
        event_type: "BILLING_RENEWAL_ERROR",
        entity_type: "billing",
        title: "Renovação indisponível",
        message: "Não foi possível carregar o ciclo de renovação. Atualize a página e tente novamente.",
        severity: "error",
      });
    }
  }

  async function openRenewalCheckoutFromHealth() {
    const result = await openRenewalCheckout();
    if (!result.ok) {
      addNotification({
        event_type: "BILLING_RENEWAL_ERROR",
        entity_type: "billing",
        title: "Renovação indisponível",
        message: "Não foi possível carregar o ciclo de renovação. Atualize a página e tente novamente.",
        severity: "error",
      });
    }
  }

  function handleOpenPix(payment) {
    if (!canExecutePaymentHistoryAction(payment, "pix_qr", { businessDateKey })) return;
    setPixCheckoutFromPay(null);
    setPixPayment(payment);
  }

  function handleOpenBoleto(payment) {
    if (!canExecutePaymentHistoryAction(payment, "boleto_second_copy", { businessDateKey })) return;
    setBoletoCheckoutFromPay(null);
    setBoletoPayment(payment);
  }

  async function handleRenewalChargeGenerated({ checkout, paymentMethod }) {
    await refreshAllData();
    if (paymentMethod === "PIX") {
      setPixCheckoutFromPay(checkout);
      setPixPayment(
        checkout?.payment
          ? { ...checkout.payment, plan_name: checkout?.plan?.name ?? renewalExperience?.plan?.name }
          : null
      );
      return;
    }
    if (paymentMethod === "BOLETO") {
      setBoletoCheckoutFromPay(checkout);
      setBoletoPayment(
        checkout?.payment
          ? { ...checkout.payment, plan_name: checkout?.plan?.name ?? renewalExperience?.plan?.name }
          : null
      );
    }
  }

  function handleOpenPayUrl(payment) {

    if (!canExecutePaymentHistoryAction(payment, "pay_generic", { businessDateKey })) return;

    const url = typeof payment.invoice_url === "string" ? payment.invoice_url.trim() : "";

    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");

  }



  return (

    <div className="dados-empresa-page minha-assinatura-page s7-historico-financeiro-page">

      <div className="profile-card s7-minha-assinatura-hero s7-historico-financeiro-hero">

        <div className="s7-billing-page">

          <S7PageHeader

            title="Histórico financeiro"

            subtitle="Acompanhe cobranças, pagamentos, renovações e eventos da sua assinatura."

          />



          <BillingRevenueHealthCard
            health={displayedHealth}
            loading={healthLoading}
            error={healthError}
            onRetry={refreshHealth}
            showRenewalCta={showRenewalPrimaryAction}
            onRenewClick={openRenewalCheckoutFromHealth}
          />



          <section className="s7-billing-payments-section" aria-label="Histórico de cobranças e pagamentos">

            <header className="s7-billing-payments-section__header">

              <h2>Cobranças e pagamentos</h2>

              <p>Lista detalhada de cobranças com status, método e ações disponíveis.</p>

            </header>



            {loading ? <p className="s7-billing-muted">Carregando histórico de pagamentos…</p> : null}

            {error ? (

              <section className="s7-billing-page__state s7-billing-page__state--error" aria-live="polite">

                <p className="s7-billing-error">{error}</p>

                <S7Button variant="secondary" onClick={() => refresh()}>

                  Tentar novamente

                </S7Button>

              </section>

            ) : null}



            {!loading && !error && displayedPayments.length === 0 ? (

              <section className="s7-billing-payment-empty" aria-live="polite">

                <div className="s7-billing-payment-empty__icon" aria-hidden="true">

                  $

                </div>

                <h3>Nenhuma cobrança listada ainda</h3>

                <p>Quando uma cobrança for criada ou paga, ela aparecerá nesta tabela com status e ações.</p>

              </section>

            ) : null}



            {!loading && !error && displayedPayments.length > 0 ? (

              <div className="s7-billing-payment-history">

                <div className="s7-billing-payment-history__table-wrap">

                  <table className="s7-billing-payment-history__table">

                    <thead>

                      <tr>

                        <th scope="col">Data</th>

                        <th scope="col">Plano</th>

                        <th scope="col">Valor</th>

                        <th scope="col">Método</th>

                        <th scope="col">Vencimento</th>

                        <th scope="col">Data de pagamento</th>

                        <th scope="col">Status</th>

                        <th scope="col">Ação</th>

                      </tr>

                    </thead>

                    <tbody>

                      {displayedPayments.map((payment) => {

                        const presentation = resolvePaymentHistoryRowPresentation({

                          payment,

                          businessDateKey,

                        });



                        return (

                          <tr key={payment.id}>

                            <td>{formatPaymentHistoryDate(payment.created_at)}</td>

                            <td>{payment.plan_name || "—"}</td>

                            <td>{payment.amount_label}</td>

                            <td>{formatPaymentHistoryMethodLabel(payment.payment_method_type)}</td>

                            <td>{formatPaymentHistoryDueDateLabel(payment.due_date)}</td>

                            <td>{formatPaymentHistoryPaidDateLabel(payment.paid_at)}</td>

                            <td>

                              <span

                                className={`s7-billing-payment-card__status s7-billing-payment-card__status--${paymentHistoryPresentationStatusClass(presentation)}`}

                              >

                                {presentation.displayStatusLabel}

                              </span>

                            </td>

                            <td>

                              <PaymentHistoryActionCell

                                payment={payment}

                                businessDateKey={businessDateKey}

                                onOpenPix={handleOpenPix}

                                onOpenBoleto={handleOpenBoleto}

                                onOpenPayUrl={handleOpenPayUrl}

                                onOpenPayMonthly={handleOpenRenewSubscription}

                              />

                            </td>

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

              </div>

            ) : null}

          </section>

        </div>

      </div>



      <RenewalCheckoutSheet
        open={renewalCheckoutOpen}
        renewalExperience={renewalExperience}
        planName={renewalExperience?.plan?.name ?? null}
        onClose={() => setRenewalCheckoutOpen(false)}
        onPaymentConfirmed={() => refreshAllData()}
        onPixGenerated={handleRenewalChargeGenerated}
        onBoletoGenerated={handleRenewalChargeGenerated}
      />

      <PixCheckoutModal
        open={Boolean(pixPayment)}
        checkout={pixCheckout}
        planName={pixPayment?.plan_name ?? ""}
        onClose={() => {
          setPixPayment(null);
          setPixCheckoutFromPay(null);
        }}
        onPaymentConfirmed={() => refreshAllData()}
      />

      <BillingBoletoModal
        open={Boolean(boletoPayment)}
        payment={boletoModalPayment}
        checkout={boletoCheckoutFromPay}
        planName={boletoPayment?.plan_name ?? ""}
        isSandbox={boletoSandbox}
        onClose={() => {
          setBoletoPayment(null);
          setBoletoCheckoutFromPay(null);
        }}
        onPaymentConfirmed={() => refreshAllData()}
      />

    </div>

  );

}

