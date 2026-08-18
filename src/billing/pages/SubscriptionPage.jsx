import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { S7Button, S7PageHeader } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import BillingStatusGate from "../components/BillingStatusGate";
import SubscriptionPlanCard from "../components/SubscriptionPlanCard";
import SubscriptionSummaryCard from "../components/SubscriptionSummaryCard";
import SubscriptionUsageBar from "../components/SubscriptionUsageBar";
import UpgradeCTA from "../components/UpgradeCTA";
import BillingUsageGrowthNotice from "../components/BillingUsageGrowthNotice";
import BillingBoletoModal from "../components/BillingBoletoModal";
import PixCheckoutModal from "../components/PixCheckoutModal";
import RenewalCheckoutSheet from "../components/RenewalCheckoutSheet";
import RenewalNoticePopup from "../components/RenewalNoticePopup";
import S7BillingAlertBanner from "../components/S7BillingAlertBanner";
import { resolveSubscriptionDisplayPriceMonthly } from "../billingPriceUi";
import { recordRenewalNoticeSeen, payRenewalCycle } from "../services/billingApi";
import { renewalNoticeBannerClass } from "../renewalNoticeUi";
import {
  RENEWAL_EXPERIENCE_ACTION,
  RENEWAL_EXPERIENCE_STATE,
} from "../renewalExperienceUi";
import { useBillingRenewalExperience } from "../hooks/useBillingRenewalExperience.jsx";
import { buildPendingPixCheckoutFromPayment, inferBillingSandboxFromUrl, isCheckoutAwaitingPayment, pickCheckoutBoletoUrl, pickPaymentBoletoUrl } from "../checkoutUi";
import { resolvePlanDisplayName } from "../billingFormatters";
import { useBillingPlans } from "../hooks/useBillingPlans";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import SubscriptionCancelModal from "../components/SubscriptionCancelModal";
import { reactivateSubscription } from "../services/billingApi";
import { canRequestSubscriptionCancellation, resolveSubscriptionAccessEndLabel } from "../subscriptionCancelUi";
import { canReactivateSubscription, resolvePlanChangeAccessEndLabel } from "../subscriptionPlanChangeUi";
import {
  resolveDelinquencyNoticeCopy,
  resolveOverdueInvoiceUrl,
  shouldShowDelinquencyNotice,
} from "../subscriptionDelinquencyUi";
import { shouldShowFinancialStateAlert } from "../billingFinancialStateUi.js";
import "../billing.css";

const REACTIVATE_ERROR_MESSAGES = {
  SUBSCRIPTION_NOT_FOUND: "Não foi possível localizar esta assinatura.",
  SUBSCRIPTION_FORBIDDEN: "Você não possui permissão para reativar esta assinatura.",
  SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION: "Esta assinatura não possui cancelamento agendado.",
  SUBSCRIPTION_ALREADY_ENDED: "Esta assinatura já foi encerrada. Escolha um plano para continuar.",
  REACTIVATION_NOT_AVAILABLE: "Nenhuma assinatura elegível para reativação.",
  PROVIDER_REACTIVATION_FAILED: "Não foi possível reativar a assinatura agora. Tente novamente em instantes.",
  AUTH_SESSION_INVALID: "Sua sessão expirou. Entre novamente para continuar.",
  SERVICE_UNAVAILABLE: "O serviço está temporariamente indisponível. Tente novamente em instantes.",
};

function resolveReactivateErrorMessage(code, fallback) {
  if (code && REACTIVATE_ERROR_MESSAGES[code]) {
    return REACTIVATE_ERROR_MESSAGES[code];
  }
  return fallback || REACTIVATE_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
}

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
  const {
    renewalExperience,
    renewalCheckoutOpen,
    setRenewalCheckoutOpen,
    openRenewalCheckout,
    pendingRenewalAlert,
  } = useBillingRenewalExperience();
  const { plans } = useBillingPlans();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [growthNoticeDismissed, setGrowthNoticeDismissed] = useState(false);
  const [boletoModalOpen, setBoletoModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [renewalPopupOpen, setRenewalPopupOpen] = useState(false);
  const [renewalBannerHidden, setRenewalBannerHidden] = useState(false);
  const [renewalPrimaryLoading, setRenewalPrimaryLoading] = useState(false);
  const [renewalPixCheckout, setRenewalPixCheckout] = useState(null);
  const [renewalPixModalOpen, setRenewalPixModalOpen] = useState(false);
  const [renewalBoletoCheckout, setRenewalBoletoCheckout] = useState(null);
  const [renewalBoletoModalOpen, setRenewalBoletoModalOpen] = useState(false);
  const reactivateRequestRef = useRef(0);

  useEffect(() => {
    // Rotas financeiras: card contextual substitui popup automático de suspensão (S1.HF.6.5).
    setRenewalPopupOpen(false);
  }, [renewalNotice?.renewal_cycle_id, renewalNotice?.should_show_popup, renewalNotice?.level]);

  const latestSubscription = activeSubscription ?? subscriptions?.[0] ?? null;
  const catalogPlan = useMemo(() => {
    const planId = plan?.plan_id ?? latestSubscription?.plan_id ?? access?.plan_id;
    if (!planId) return null;
    return plans.find((item) => item.id === planId) ?? null;
  }, [plan, latestSubscription, access, plans]);

  const resolvedPlan = plan ?? catalogPlan;
  const planName = resolvePlanDisplayName(resolvedPlan) || latestSubscription?.plan_key || "—";
  const planPriceMonthly = resolveSubscriptionDisplayPriceMonthly({
    renewalExperience,
    catalogPlan,
    resolvedPlan,
    subscription: latestSubscription,
  });
  const pendingRenewalAlertResolved = pendingRenewalAlert;
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
  const showDelinquencyNotice =
    shouldShowDelinquencyNotice(latestSubscription, { ...access, ...statusExtras }) &&
    !shouldShowFinancialStateAlert(renewalExperience);
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
  const usageUnavailable = Boolean(statusExtras?.usage_fallback) || usage?.usage_status === "unavailable";
  const pendingBoletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickPaymentBoletoUrl(pendingPayment)),
    [pendingPayment]
  );
  const renewalPlanName = renewalExperience?.plan?.name ?? planName;

  async function openRenewalCheckoutSheet() {
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

  const renewalBoletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickCheckoutBoletoUrl(renewalBoletoCheckout)),
    [renewalBoletoCheckout]
  );

  async function handleRenewalChargeGenerated({ checkout, paymentMethod }) {
    await refresh({ silent: true });
    if (paymentMethod === "PIX") {
      setRenewalPixCheckout(checkout);
      setRenewalPixModalOpen(true);
      return;
    }
    if (paymentMethod === "BOLETO") {
      setRenewalBoletoCheckout(checkout);
      setRenewalBoletoModalOpen(true);
    }
  }

  async function handleRenewalPrimaryAction() {
    const action = String(renewalExperience?.primary_action?.action || "");
    if (action === RENEWAL_EXPERIENCE_ACTION.RENEW_SUBSCRIPTION) {
      openRenewalCheckoutSheet();
      return;
    }
    if (
      action === RENEWAL_EXPERIENCE_ACTION.VIEW_PIX ||
      action === RENEWAL_EXPERIENCE_ACTION.REISSUE_BOLETO
    ) {
      if (renewalPrimaryLoading || !renewalExperience?.renewal_cycle_id) return;
      setRenewalPrimaryLoading(true);
      const paymentMethod = action === RENEWAL_EXPERIENCE_ACTION.VIEW_PIX ? "PIX" : "BOLETO";
      const res = await payRenewalCycle(String(renewalExperience.renewal_cycle_id), { payment_method: paymentMethod });
      setRenewalPrimaryLoading(false);
      if (!res.ok) {
        addNotification({
          event_type: "BILLING_RENEWAL_ERROR",
          entity_type: "billing",
          title: "Falha ao abrir cobrança",
          message: res.error || res.data?.message || "Não foi possível recuperar a cobrança de renovação.",
          severity: "error",
        });
        return;
      }
      const checkout =
        res.data?.checkout && typeof res.data.checkout === "object" ? res.data.checkout : res.data;
      if (!isCheckoutAwaitingPayment(checkout)) {
        await refresh({ silent: true });
        return;
      }
      await handleRenewalChargeGenerated({
        checkout: /** @type {Record<string, unknown>} */ (checkout),
        paymentMethod,
      });
    }
  }

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
    openRenewalCheckoutSheet();
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

  async function confirmReactivation() {
    if (reactivateLoading) return;
    const requestId = ++reactivateRequestRef.current;
    setReactivateLoading(true);
    const res = await reactivateSubscription({
      subscription_id: latestSubscription?.id ?? access?.subscription_id ?? undefined,
    });
    if (requestId !== reactivateRequestRef.current) return;
    setReactivateLoading(false);
    if (!res.ok) {
      const code = res.data?.code ?? res.error;
      addNotification({
        event_type: "BILLING_REACTIVATE_ERROR",
        entity_type: "billing",
        title: "Não foi possível reativar",
        message: resolveReactivateErrorMessage(code, res.error || res.data?.message),
        severity: "error",
      });
      return;
    }
    await refresh();
    addNotification({
      event_type: "BILLING_REACTIVATE_OK",
      entity_type: "billing",
      title: "Assinatura reativada",
      message: "Seu plano continuará ativo normalmente.",
      severity: "success",
    });
  }

  const billingPeriodStart = usage?.period_start ?? limits?.period_start ?? null;
  const billingPeriodEnd = usage?.period_end ?? limits?.period_end ?? null;

  async function handleCancellationCompleted() {
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
    <div className="dados-empresa-page minha-assinatura-page">
      <div className="profile-card s7-minha-assinatura-hero">
        <div className="s7-billing-page">
      <S7PageHeader
        title="Minha assinatura"
        subtitle="Status financeiro, acesso e consumo consolidados."
        actions={
          <div className="s7-billing-subscription-header-actions">
            <Link to="/perfil/assinatura/planos">
              <S7Button variant="primary">Alterar plano</S7Button>
            </Link>
          </div>
        }
      />

      <BillingStatusGate />

      {!loading && !error && pendingRenewalAlertResolved ? (
        <S7BillingAlertBanner
          title={pendingRenewalAlertResolved.title}
          message={pendingRenewalAlertResolved.message}
          ctaLabel={pendingRenewalAlertResolved.ctaLabel}
          onCtaClick={openRenewalCheckoutSheet}
          tone={pendingRenewalAlertResolved.tone ?? "warning"}
        />
      ) : null}

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
              <S7Button variant="primary" onClick={confirmReactivation} loading={reactivateLoading} disabled={reactivateLoading}>
                {reactivateLoading ? "Reativando…" : "Reativar assinatura"}
              </S7Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && renewalNotice?.should_show_banner && !renewalBannerHidden && !shouldShowFinancialStateAlert(renewalExperience) ? (
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
        <div className="s7-billing-subscription-layout">
          <div className="s7-billing-subscription-layout__top">
            <SubscriptionPlanCard
              access={access}
              subscription={latestSubscription}
              plan={resolvedPlan}
              planName={planName}
              planPriceMonthly={planPriceMonthly}
              salesLimitMonthly={salesLimitMonthly}
              renewalExperience={renewalExperience}
            />
            <SubscriptionSummaryCard
              access={access}
              subscription={latestSubscription}
              planName={planName}
              planPriceMonthly={planPriceMonthly}
              salesLimitMonthly={salesLimitMonthly}
              billingPeriodStart={billingPeriodStart}
              billingPeriodEnd={billingPeriodEnd}
              renewalExperience={renewalExperience}
            />
          </div>
          <div className="s7-billing-subscription-layout__usage">
            <SubscriptionUsageBar
            usage={usage}
            limits={limits}
            monthlySalesLimit={salesLimitMonthly}
            loading={loading || refreshing}
            usageUnavailable={usageUnavailable}
            />
          </div>
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

      <div className="s7-billing-page__actions s7-billing-page__actions--subscription-footer">
        <S7Button variant="secondary" disabled={!canCancel} onClick={() => setCancelOpen(true)}>
          Cancelar assinatura
        </S7Button>
      </div>
        </div>
      </div>

      <RenewalCheckoutSheet
        open={renewalCheckoutOpen}
        renewalExperience={renewalExperience}
        pendingRenewal={pendingRenewal}
        planName={planName}
        onClose={() => setRenewalCheckoutOpen(false)}
        onPaymentConfirmed={() => refresh({ silent: true })}
        onPixGenerated={handleRenewalChargeGenerated}
        onBoletoGenerated={handleRenewalChargeGenerated}
      />

      <PixCheckoutModal
        open={renewalPixModalOpen}
        checkout={renewalPixCheckout}
        planName={renewalPlanName ?? ""}
        onClose={() => {
          setRenewalPixModalOpen(false);
          setRenewalPixCheckout(null);
        }}
        onPaymentConfirmed={() => refresh({ silent: true })}
      />

      <BillingBoletoModal
        open={renewalBoletoModalOpen}
        checkout={renewalBoletoCheckout}
        planName={renewalPlanName ?? ""}
        isSandbox={renewalBoletoSandbox}
        onClose={() => {
          setRenewalBoletoModalOpen(false);
          setRenewalBoletoCheckout(null);
        }}
        onPaymentConfirmed={() => refresh({ silent: true })}
      />

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

      <RenewalNoticePopup
        open={renewalPopupOpen}
        renewalNotice={renewalNotice}
        onRenew={() => {
          setRenewalPopupOpen(false);
          handlePendingRenewalAction();
        }}
        onClose={() => setRenewalPopupOpen(false)}
      />

      <SubscriptionCancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        accessEndsLabel={accessEndsLabel}
        subscriptionId={latestSubscription?.id ?? access?.subscription_id ?? null}
        onCancelled={handleCancellationCompleted}
      />
    </div>
  );
}
