import { useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";

import { S7Button, S7PageHeader } from "../../components/ui";

import PixCheckoutModal from "../components/PixCheckoutModal";

import BillingBoletoModal from "../components/BillingBoletoModal";

import PaymentHistoryActionCell from "../components/PaymentHistoryActionCell";

import BillingRevenueHealthCard from "../components/BillingRevenueHealthCard";

import BillingTimeline from "../components/BillingTimeline";

import BillingNotificationList from "../components/BillingNotificationList";

import {

  buildBillingNotificationPreviewSamples,

  buildBillingTimelinePreviewSamples,

  buildRevenueHealthPreviewSample,

} from "../billingFinancialExperienceUi";

import {

  buildPaymentHistoryPreviewSamples,

  formatPaymentHistoryDate,

  formatPaymentHistoryMethodLabel,

  paymentHistoryStatusClass,

} from "../paymentHistoryUi";

import {

  buildPaymentHistoryBoletoPayment,

  buildPaymentHistoryPixCheckout,

  canExecutePaymentHistoryAction,

} from "../paymentHistoryAction";

import { inferBillingSandboxFromUrl } from "../checkoutUi";

import { usePaymentHistory } from "../hooks/usePaymentHistory";

import { useBillingFinancialExperience } from "../hooks/useBillingFinancialExperience";
import { isBillingDevPreviewEnabled } from "../billingDevGuard";
import { BILLING_RESILIENCE } from "../billingResilienceUi";

import "../billing.css";



export default function PaymentHistoryPage() {

  const [searchParams] = useSearchParams();

  const { loading, error, payments, refresh } = usePaymentHistory();

  const {

    loading: financeLoading,

    timeline,

    revenueHealth,

    notifications,

    errors: financeErrors,

    hints: financeHints,

    refresh: refreshFinance,

  } = useBillingFinancialExperience();

  const [pixPayment, setPixPayment] = useState(null);

  const [boletoPayment, setBoletoPayment] = useState(null);



  const previewEnabled = isBillingDevPreviewEnabled(searchParams.get("preview"), "payments");

  const financePreviewEnabled = isBillingDevPreviewEnabled(searchParams.get("preview"), "finance");



  const displayedPayments = useMemo(() => {

    if (payments.length > 0) return payments;

    if (previewEnabled) return buildPaymentHistoryPreviewSamples();

    return payments;

  }, [payments, previewEnabled]);



  const displayedTimeline = useMemo(() => {

    if (timeline.length > 0) return timeline;

    if (financePreviewEnabled) return buildBillingTimelinePreviewSamples();

    return timeline;

  }, [timeline, financePreviewEnabled]);



  const displayedHealth = useMemo(() => {
    if (financePreviewEnabled && !financeErrors.revenueHealth) return buildRevenueHealthPreviewSample();
    return revenueHealth;
  }, [revenueHealth, financePreviewEnabled, financeErrors.revenueHealth]);



  const displayedNotifications = useMemo(() => {

    if (notifications.length > 0) return notifications;

    if (financePreviewEnabled) return buildBillingNotificationPreviewSamples();

    return notifications;

  }, [notifications, financePreviewEnabled]);



  const pixCheckout = useMemo(

    () => (pixPayment ? buildPaymentHistoryPixCheckout(pixPayment) : null),

    [pixPayment]

  );

  const boletoModalPayment = useMemo(

    () => (boletoPayment ? buildPaymentHistoryBoletoPayment(boletoPayment) : null),

    [boletoPayment]

  );



  const pageRefreshing = loading || financeLoading;



  function handleRefreshAll() {

    refresh();

    refreshFinance();

  }



  function handleOpenPix(payment) {

    if (!canExecutePaymentHistoryAction(payment, "pix_qr")) return;

    setPixPayment(payment);

  }



  function handleOpenBoleto(payment) {

    if (!canExecutePaymentHistoryAction(payment, "boleto_second_copy")) return;

    setBoletoPayment(payment);

  }



  function handleOpenPayUrl(payment) {

    if (!canExecutePaymentHistoryAction(payment, "pay_generic")) return;

    const url = typeof payment.invoice_url === "string" ? payment.invoice_url.trim() : "";

    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");

  }



  return (

    <div className="s7-billing-page">

      <S7PageHeader

        title="Histórico financeiro"

        subtitle="Acompanhe cobranças, pagamentos, renovações e eventos da sua assinatura."

        actions={

          <S7Button variant="secondary" onClick={handleRefreshAll} loading={pageRefreshing}>

            Atualizar

          </S7Button>

        }

      />



      <section className="s7-billing-finance-dashboard" aria-label="Resumo financeiro da assinatura">

        <BillingRevenueHealthCard

          health={displayedHealth}

          loading={financeLoading}

          error={financeErrors.revenueHealth}

          onRetry={refreshFinance}

        />



        <div className="s7-billing-finance-dashboard__grid">

          <BillingTimeline

            events={displayedTimeline}

            loading={financeLoading}

            error={financeErrors.timeline}

            hint={financeHints.timeline}

            onRetry={refreshFinance}

          />

          <BillingNotificationList

            notifications={displayedNotifications}

            loading={financeLoading}

            error={financeErrors.notifications}

            onRetry={refreshFinance}

          />

        </div>

      </section>



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

                    <th scope="col">Status</th>

                    <th scope="col">Ação</th>

                  </tr>

                </thead>

                <tbody>

                  {displayedPayments.map((payment) => (

                    <tr key={payment.id}>

                      <td>{formatPaymentHistoryDate(payment.created_at)}</td>

                      <td>{payment.plan_name || "—"}</td>

                      <td>{payment.amount_label}</td>

                      <td>{formatPaymentHistoryMethodLabel(payment.payment_method_type)}</td>

                      <td>{formatPaymentHistoryDate(payment.due_date)}</td>

                      <td>

                        <span

                          className={`s7-billing-payment-card__status s7-billing-payment-card__status--${paymentHistoryStatusClass(payment)}`}

                        >

                          {payment.status_label}

                        </span>

                      </td>

                      <td>

                        <PaymentHistoryActionCell

                          payment={payment}

                          onOpenPix={handleOpenPix}

                          onOpenBoleto={handleOpenBoleto}

                          onOpenPayUrl={handleOpenPayUrl}

                        />

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        ) : null}

      </section>



      <PixCheckoutModal

        open={Boolean(pixPayment)}

        checkout={pixCheckout}

        planName={pixPayment?.plan_name ?? ""}

        onClose={() => setPixPayment(null)}

        onPaymentConfirmed={() => handleRefreshAll()}

      />



      <BillingBoletoModal

        open={Boolean(boletoPayment)}

        payment={boletoModalPayment}

        planName={boletoPayment?.plan_name ?? ""}

        isSandbox={inferBillingSandboxFromUrl(boletoPayment?.invoice_url)}

        onClose={() => setBoletoPayment(null)}

        onPaymentConfirmed={() => handleRefreshAll()}

      />

    </div>

  );

}


