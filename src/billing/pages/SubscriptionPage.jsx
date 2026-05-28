import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { S7Button, S7PageHeader } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import BillingStatusGate from "../components/BillingStatusGate";
import BillingUsageNotice from "../components/BillingUsageNotice";
import SubscriptionPlanCard from "../components/SubscriptionPlanCard";
import SubscriptionSummaryCard from "../components/SubscriptionSummaryCard";
import SubscriptionUsageBar from "../components/SubscriptionUsageBar";
import UpgradeCTA from "../components/UpgradeCTA";
import BillingUsageGrowthNotice from "../components/BillingUsageGrowthNotice";
import BillingBoletoModal from "../components/BillingBoletoModal";
import PixCheckoutModal from "../components/PixCheckoutModal";
import RenewalCheckoutSheet from "../components/RenewalCheckoutSheet";
import RenewalNoticePopup from "../components/RenewalNoticePopup";
import { recordRenewalNoticeSeen } from "../services/billingApi";
import { renewalNoticeBannerClass } from "../renewalNoticeUi";
import { buildPendingPixCheckoutFromPayment, inferBillingSandboxFromUrl, pickPaymentBoletoUrl } from "../checkoutUi";
import { resolvePlanDisplayName } from "../billingFormatters";
import { useBillingPlans } from "../hooks/useBillingPlans";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import { refreshBillingPaymentStatus, requestSubscriptionCancellation, reactivateSubscription } from "../services/billingApi";
import { canRequestSubscriptionCancellation, resolveSubscriptionAccessEndLabel } from "../subscriptionCancelUi";
import { canReactivateSubscription, resolvePlanChangeAccessEndLabel } from "../subscriptionPlanChangeUi";
import {
  resolveDelinquencyNoticeCopy,
  resolveOverdueInvoiceUrl,
  shouldShowDelinquencyNotice,
} from "../subscriptionDelinquencyUi";
import "../billing.css";

const PENDING_ACTION = {
  VIEW_PIX_QR: "VIEW_PIX_QR",
  VIEW_BOLETO: "VIEW_BOLETO",
  UPDATE_CARD: "UPDATE_CARD",
  WAITING_CARD_CONFIRMATION: "WAITING_CARD_CONFIRMATION",
  NONE: "NONE",
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { loading, refreshing, error, access, usage, limits, plan, subscriptions, statusExtras, refresh } =
    useSubscriptionStatus();
  const activeSubscription = statusExtras?.active_subscription ?? null;
  const pendingCheckout = statusExtras?.pending_checkout ?? null;
  const renewalNotice = statusExtras?.renewal_notice ?? null;
  const pendingRenewal = statusExtras?.pending_renewal ?? renewalNotice;
  const { plans } = useBillingPlans();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [growthNoticeDismissed, setGrowthNoticeDismissed] = useState(false);
  const [boletoModalOpen, setBoletoModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalPopupOpen, setRenewalPopupOpen] = useState(false);
  const [renewalBannerHidden, setRenewalBannerHidden] = useState(false);

  useEffect(() => {
    if (renewalNotice?.should_show_popup) {
      setRenewalPopupOpen(true);
    } else {
      setRenewalPopupOpen(false);
    }
  }, [renewalNotice?.renewal_cycle_id, renewalNotice?.should_show_popup, renewalNotice?.level]);

  const latestSubscription = activeSubscription ?? subscriptions?.[0] ?? null;
  const catalogPlan = useMemo(() => {
    const planId = plan?.plan_id ?? latestSubscription?.plan_id ?? access?.plan_id;
    if (!planId) return null;
    return plans.find((item) => item.id === planId) ?? null;
  }, [plan, latestSubscription, access, plans]);

  const resolvedPlan = plan ?? catalogPlan;
  const planName = resolvePlanDisplayName(resolvedPlan) || latestSubscription?.plan_key || "—";
  const planPriceMonthly = resolvedPlan?.price_monthly ?? latestSubscription?.amount;
  const salesLimitMonthly = limits?.monthly_sales_limit ?? resolvedPlan?.sales_limit_monthly ?? usage?.limit_sales_month;
  const canCancel = canRequestSubscriptionCancellation(latestSubscription, access);
  const canReactivate = canReactivateSubscription(latestSubscription);
  const accessEndsAt = latestSubscription?.access_ends_at ?? latestSubscription?.current_period_end ?? null;
  const accessEndsLabel = resolveSubscriptionAccessEndLabel(latestSubscription, accessEndsAt);
  const planChangeAccessEndLabel = resolvePlanChangeAccessEndLabel(latestSubscription, access);
  const scheduledPlanChangeTarget =
    latestSubscription?.plan_change_target_plan_slug ?? statusExtras?.plan_change_target_plan_slug ?? null;
  const showScheduledPlanChange =
    Boolean(latestSubscription?.plan_change_at_period_end ?? statusExtras?.plan_change_at_period_end) &&
    Boolean(scheduledPlanChangeTarget);
  const delinquencyNotice = resolveDelinquencyNoticeCopy(latestSubscription, { ...access, ...statusExtras });
  const overdueInvoiceUrl = resolveOverdueInvoiceUrl(statusExtras, latestSubscription, access);
  const showDelinquencyNotice = shouldShowDelinquencyNotice(latestSubscription, { ...access, ...statusExtras });
  const pendingPlanName = useMemo(() => {
    if (!pendingCheckout?.plan_key) return null;
    const match = plans.find((item) => String(item.plan_key || item.slug).toLowerCase() === String(pendingCheckout.plan_key).toLowerCase());
    return match?.name ?? pendingCheckout.plan_key;
  }, [pendingCheckout, plans]);
  const pendingPayment = pendingCheckout?.payment ?? null;
  const pendingActionType = String(pendingPayment?.action_type || PENDING_ACTION.NONE).toUpperCase();
  const pendingActionLabel = pendingPayment?.action_label ?? null;
  const pendingPixCheckout = useMemo(
    () => buildPendingPixCheckoutFromPayment(pendingPayment, pendingPlanName),
    [pendingPayment, pendingPlanName]
  );
  const pendingBoletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickPaymentBoletoUrl(pendingPayment)),
    [pendingPayment]
  );

  function handlePendingPaymentAction() {
    if (pendingPayment?.can_open === false && pendingPayment?.open_error_message) {
      addNotification({
        event_type: "BILLING_PENDING_PAYMENT_ERROR",
        entity_type: "billing",
        title: "Pagamento pendente",
        message: String(pendingPayment.open_error_message),
        severity: "warning",
      });
      return;
    }

    if (pendingActionType === PENDING_ACTION.VIEW_PIX_QR) {
      if (!pendingPixCheckout?.payment?.provider_payment_id) {
        addNotification({
          event_type: "BILLING_PENDING_PAYMENT_ERROR",
          entity_type: "billing",
          title: "Pagamento pendente",
          message: "Não foi possível carregar os dados deste pagamento. Tente atualizar o status.",
          severity: "warning",
        });
        return;
      }
      setPixModalOpen(true);
      return;
    }

    if (pendingActionType === PENDING_ACTION.VIEW_BOLETO) {
      if (!pickPaymentBoletoUrl(pendingPayment) && !pendingPayment?.identification_field) {
        addNotification({
          event_type: "BILLING_PENDING_PAYMENT_ERROR",
          entity_type: "billing",
          title: "Pagamento pendente",
          message: "Não foi possível carregar os dados deste pagamento. Tente atualizar o status.",
          severity: "warning",
        });
        return;
      }
      setBoletoModalOpen(true);
      return;
    }

    if (pendingActionType === PENDING_ACTION.UPDATE_CARD) {
      navigate("/perfil/assinatura/formas-de-pagamento");
    }
  }

  function handlePendingRenewalAction() {
    const source = renewalNotice ?? pendingRenewal;
    const actionType = String(source?.action_type || "").toUpperCase();
    if (actionType === "UPDATE_CARD") {
      navigate("/perfil/assinatura/formas-de-pagamento");
      return;
    }
    setRenewalModalOpen(true);
  }

  async function dismissRenewalBanner() {
    if (renewalNotice?.renewal_cycle_id) {
      await recordRenewalNoticeSeen(String(renewalNotice.renewal_cycle_id), {
        event: "banner_dismissed",
        level: renewalNotice.level ? String(renewalNotice.level) : null,
      });
    }
    setRenewalBannerHidden(true);
  }

  async function handleRefreshStatus() {
    const providerPaymentId = pendingCheckout?.payment?.provider_payment_id;
    if (providerPaymentId) {
      const payRes = await refreshBillingPaymentStatus({ provider_payment_id: providerPaymentId });
      if (payRes.ok && payRes.data?.confirmed) {
        await refresh();
        addNotification({
          event_type: "BILLING_PAYMENT_CONFIRMED",
          entity_type: "billing",
          title: "Pagamento confirmado",
          message: "Seu novo plano foi ativado.",
          severity: "success",
        });
        return;
      }
    }
    await refresh({ silent: true });
  }

  async function confirmReactivation() {
    if (reactivateLoading) return;
    setReactivateLoading(true);
    const res = await reactivateSubscription();
    setReactivateLoading(false);
    if (!res.ok) {
      addNotification({
        event_type: "BILLING_REACTIVATE_ERROR",
        entity_type: "billing",
        title: "Não foi possível reativar",
        message: res.error || res.data?.message || "Falha ao reativar a assinatura.",
        severity: "error",
      });
      return;
    }
    await refresh();
    addNotification({
      event_type: "BILLING_REACTIVATE_OK",
      entity_type: "billing",
      title: "Assinatura reativada",
      message: "O cancelamento agendado foi removido. Sua assinatura segue ativa normalmente.",
      severity: "success",
    });
  }

  async function confirmCancellation() {
    if (cancelLoading) return;
    setCancelLoading(true);
    const res = await requestSubscriptionCancellation();
    setCancelLoading(false);
    if (!res.ok) {
      addNotification({
        event_type: "BILLING_CANCEL_ERROR",
        entity_type: "billing",
        title: "Não foi possível cancelar",
        message: res.error || res.data?.message || "Falha ao solicitar cancelamento da assinatura.",
        severity: "error",
      });
      return;
    }
    setCancelOpen(false);
    await refresh();
    addNotification({
      event_type: "BILLING_CANCEL_OK",
      entity_type: "billing",
      title: "Cancelamento agendado",
      message: "Sua assinatura continuará ativa até o fim do ciclo atual.",
      severity: "success",
    });
  }

  return (
    <div className="s7-billing-page">
      <S7PageHeader
        title="Minha assinatura"
        subtitle="Status financeiro, acesso e consumo consolidados pelo backend do Suse7."
        actions={
          <S7Button
            variant="secondary"
            onClick={handleRefreshStatus}
            loading={loading || refreshing}
            disabled={loading || refreshing}
          >
            Atualizar status
          </S7Button>
        }
      />

      <BillingStatusGate />
      <BillingUsageNotice />

      {!loading && !error && statusExtras?.show_usage_growth_notice && !growthNoticeDismissed ? (
        <BillingUsageGrowthNotice onDismiss={() => setGrowthNoticeDismissed(true)} />
      ) : null}

      {loading ? <p className="s7-billing-muted">Carregando assinatura…</p> : null}
      {error ? <p className="s7-billing-error">{error}</p> : null}

      {!loading && !error && showDelinquencyNotice && delinquencyNotice ? (
        <section className="s7-billing-delinquency-notice" aria-live="polite">
          <strong>{delinquencyNotice.title}</strong>
          <p>{delinquencyNotice.message}</p>
          {overdueInvoiceUrl ? (
            <div className="s7-billing-delinquency-notice__actions">
              <a href={overdueInvoiceUrl} target="_blank" rel="noreferrer">
                <S7Button variant="primary">Regularizar pagamento</S7Button>
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && showScheduledPlanChange ? (
        <section className="s7-billing-cancel-notice" aria-live="polite">
          <strong>Mudança de plano agendada</strong>
          <p>
            Seu plano atual continua ativo até {planChangeAccessEndLabel}. Depois disso, sua assinatura passará para{" "}
            {scheduledPlanChangeTarget}.
          </p>
        </section>
      ) : null}

      {!loading && !error && latestSubscription?.cancel_at_period_end ? (
        <section className="s7-billing-cancel-notice" aria-live="polite">
          <strong>Cancelamento agendado</strong>
          <p>
            Seu plano continua ativo até {accessEndsLabel}. Depois disso, sua conta voltará para o plano Baby.
          </p>
          {canReactivate ? (
            <div className="s7-billing-cancel-notice__actions">
              <S7Button variant="primary" onClick={confirmReactivation} loading={reactivateLoading}>
                Reativar assinatura
              </S7Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && renewalNotice?.should_show_banner && !renewalBannerHidden ? (
        <section
          className={`s7-billing-pending-notice s7-billing-renewal-notice ${renewalNoticeBannerClass(renewalNotice.level)}`}
          aria-live="polite"
        >
          <strong>{renewalNotice.title}</strong>
          <p>{renewalNotice.message}</p>
          {renewalNotice.action_label ? (
            <div className="s7-billing-pending-notice__actions">
              <S7Button variant="primary" onClick={handlePendingRenewalAction}>
                {renewalNotice.action_label}
              </S7Button>
              {renewalNotice.popup_policy?.dismissible !== false ? (
                <S7Button variant="secondary" onClick={dismissRenewalBanner}>
                  Fechar aviso
                </S7Button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && pendingCheckout ? (
        <section className="s7-billing-pending-notice" aria-live="polite">
          <strong>Pagamento pendente</strong>
          <p>
            Aguardando pagamento para o plano {pendingPlanName || "selecionado"}. Seu plano atual permanece ativo até a
            confirmação.
          </p>
          {pendingActionType === PENDING_ACTION.WAITING_CARD_CONFIRMATION ? (
            <p className="s7-billing-muted">{pendingActionLabel || "Aguardando confirmação do cartão."}</p>
          ) : null}
          {pendingActionType !== PENDING_ACTION.NONE &&
          pendingActionType !== PENDING_ACTION.WAITING_CARD_CONFIRMATION &&
          pendingActionLabel ? (
            <div className="s7-billing-pending-notice__actions">
              <S7Button variant="primary" onClick={handlePendingPaymentAction}>
                {pendingActionLabel}
              </S7Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error ? (
        <div className="s7-billing-subscription-panel">
          <SubscriptionPlanCard
            access={access}
            subscription={latestSubscription}
            plan={resolvedPlan}
            planName={planName}
            planPriceMonthly={planPriceMonthly}
            salesLimitMonthly={salesLimitMonthly}
          />
          <SubscriptionUsageBar usage={usage} limits={limits} monthlySalesLimit={salesLimitMonthly} />
          <SubscriptionSummaryCard
            access={access}
            subscription={latestSubscription}
            usage={usage}
            limits={limits}
            planName={planName}
            planPriceMonthly={planPriceMonthly}
            salesLimitMonthly={salesLimitMonthly}
          />
        </div>
      ) : null}

      {access && !access.can_access ? (
        <div className="s7-billing-page__cta">
          <UpgradeCTA
            title="Seu acesso premium está bloqueado"
            description="Atualize o pagamento ou escolha um plano para continuar usando os recursos avançados."
          />
        </div>
      ) : null}

      <div className="s7-billing-page__actions">
        <Link to="/perfil/assinatura/planos">
          <S7Button variant="primary">Alterar plano</S7Button>
        </Link>
        <S7Button variant="secondary" disabled={!canCancel} onClick={() => setCancelOpen(true)}>
          Cancelar assinatura
        </S7Button>
      </div>

      <BillingBoletoModal
        open={boletoModalOpen}
        payment={pendingPayment}
        planName={pendingPlanName}
        isSandbox={pendingBoletoSandbox}
        onClose={() => setBoletoModalOpen(false)}
        onPaymentConfirmed={() => refresh({ silent: true })}
      />

      <PixCheckoutModal
        open={pixModalOpen}
        checkout={pendingPixCheckout}
        planName={pendingPlanName ?? ""}
        onClose={() => setPixModalOpen(false)}
        onPaymentConfirmed={() => refresh({ silent: true })}
      />

      <RenewalCheckoutSheet
        open={renewalModalOpen}
        pendingRenewal={pendingRenewal}
        onClose={() => setRenewalModalOpen(false)}
        onPaymentConfirmed={() => refresh({ silent: true })}
      />

      <RenewalNoticePopup
        open={renewalPopupOpen}
        renewalNotice={renewalNotice}
        onRenew={() => {
          setRenewalPopupOpen(false);
          handlePendingRenewalAction();
        }}
        onClose={() => setRenewalPopupOpen(false)}
      />

      {cancelOpen ? (
        <div className="s7-billing-checkout-sheet" role="dialog" aria-modal="true">
          <div className="s7-billing-checkout-sheet__panel">
            <h3>Cancelar assinatura?</h3>
            <p>
              Seu plano continuará ativo até o fim do ciclo atual. Depois disso, sua conta voltará para o plano Baby.
            </p>
            <p className="s7-billing-muted">Acesso garantido até {accessEndsLabel}.</p>
            <div className="s7-billing-checkout-sheet__actions">
              <S7Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelLoading}>
                Manter assinatura
              </S7Button>
              <S7Button variant="primary" onClick={confirmCancellation} disabled={cancelLoading}>
                {cancelLoading ? "Agendando cancelamento…" : "Cancelar ao fim do ciclo"}
              </S7Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
