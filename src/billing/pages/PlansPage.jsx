import { useMemo, useState } from "react";
import { S7Button, S7PageHeader } from "../../components/ui";
import { useNotifications } from "../../contexts/NotificationContext";
import PlanCard from "../components/PlanCard";
import {
  inferBillingSandboxFromUrl,
  isCardCheckoutApproved,
  isCheckoutAwaitingPayment,
  pickCheckoutBoletoUrl,
  resolveCheckoutPlanSlug,
} from "../checkoutUi";
import PixCheckoutModal from "../components/PixCheckoutModal";
import BillingBoletoModal from "../components/BillingBoletoModal";
import CardCheckoutModal from "../components/CardCheckoutModal";
import CheckoutPaymentMethodSelector from "../components/CheckoutPaymentMethodSelector";
import { useBillingPlans } from "../hooks/useBillingPlans";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import { getEnterpriseContactHref, resolveCurrentPlanSnapshot } from "../planCta";
import { changeSubscriptionPlan, startBillingCheckout, startCardBillingCheckout } from "../services/billingApi";
import { resolveBillingCardErrorMessage } from "../billingCheckoutErrors";
import { resolvePlanChangeAccessEndLabel } from "../subscriptionPlanChangeUi";
import "../billing.css";

export default function PlansPage() {
  const { addNotification } = useNotifications();
  const { loading: plansLoading, error: plansError, plans, refresh: refreshPlans } = useBillingPlans();
  const {
    loading: statusLoading,
    error: statusError,
    plan,
    subscriptions,
    access,
    statusExtras,
    refresh: refreshStatus,
  } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardCheckoutLoading, setCardCheckoutLoading] = useState(false);
  const [cardCheckoutError, setCardCheckoutError] = useState(null);
  const [cardApproved, setCardApproved] = useState(false);
  const { methods: savedPaymentMethods, refresh: refreshPaymentMethods } = usePaymentMethods();
  const [downgradePlan, setDowngradePlan] = useState(null);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const statusPayload = useMemo(
    () => ({ plan, subscriptions, access, active_subscription: statusExtras?.active_subscription }),
    [plan, subscriptions, access, statusExtras?.active_subscription]
  );
  const currentPlan = useMemo(() => resolveCurrentPlanSnapshot(statusPayload, plans), [statusPayload, plans]);
  const loading = plansLoading || statusLoading;
  const error = plansError || statusError;
  const showPixModal =
    Boolean(checkoutResult) && paymentMethod === "PIX" && isCheckoutAwaitingPayment(checkoutResult);
  const showBoletoModal =
    Boolean(checkoutResult) && paymentMethod === "BOLETO" && isCheckoutAwaitingPayment(checkoutResult);
  const boletoSandbox = useMemo(
    () => inferBillingSandboxFromUrl(pickCheckoutBoletoUrl(checkoutResult)),
    [checkoutResult]
  );
  const latestSubscription = subscriptions?.[0] ?? null;
  const planChangeAccessEndLabel = useMemo(
    () => resolvePlanChangeAccessEndLabel(latestSubscription, access),
    [latestSubscription, access]
  );

  function retryLoad() {
    refreshPlans();
    refreshStatus();
  }

  function resetCheckoutSheet() {
    setSelectedPlan(null);
    setCheckoutResult(null);
    setCheckoutLoading(false);
    setPaymentMethod("PIX");
    setCardModalOpen(false);
    setCardCheckoutLoading(false);
    setCardCheckoutError(null);
    setCardApproved(false);
  }

  function startCheckout(plan) {
    setCheckoutResult(null);
    setPaymentMethod("PIX");
    setSelectedPlan(plan);
  }

  function handlePlanSelect(plan, cta) {
    if (cta.disabled) return;
    if (cta.isEnterprise) {
      window.location.href = getEnterpriseContactHref(plan);
      return;
    }
    if (cta.changeKind === "downgrade") {
      setDowngradePlan(plan);
      return;
    }
    startCheckout(plan);
  }

  function resetDowngradeSheet() {
    setDowngradePlan(null);
    setDowngradeLoading(false);
  }

  async function confirmScheduledDowngrade() {
    if (!downgradePlan || downgradeLoading) return;

    const planSlug = resolveCheckoutPlanSlug(downgradePlan);
    if (!planSlug) {
      addNotification({
        event_type: "BILLING_PLAN_CHANGE_ERROR",
        entity_type: "billing",
        title: "Downgrade indisponível",
        message: "Não foi possível identificar o plano selecionado.",
        severity: "error",
      });
      return;
    }

    setDowngradeLoading(true);
    const res = await changeSubscriptionPlan({ target_plan_slug: planSlug });
    setDowngradeLoading(false);

    if (!res.ok) {
      addNotification({
        event_type: "BILLING_PLAN_CHANGE_ERROR",
        entity_type: "billing",
        title: "Não foi possível agendar",
        message: res.error || res.data?.message || "Falha ao agendar downgrade do plano.",
        severity: "error",
      });
      return;
    }

    resetDowngradeSheet();
    await refreshStatus({ silent: true });
    addNotification({
      event_type: "BILLING_PLAN_CHANGE_OK",
      entity_type: "billing",
      title: "Downgrade agendado",
      message: `A mudança para ${downgradePlan.name} ocorrerá ao fim do ciclo atual.`,
      severity: "success",
    });
  }

  function openCardCheckoutModal() {
    setCardCheckoutError(null);
    setCardModalOpen(true);
  }

  async function submitCardCheckout(cardPayload) {
    if (!selectedPlan || cardCheckoutLoading) return;

    const planSlug = resolveCheckoutPlanSlug(selectedPlan);
    if (!planSlug) {
      setCardCheckoutError("Não foi possível identificar o plano selecionado.");
      return;
    }

    setCardCheckoutLoading(true);
    setCardCheckoutError(null);

    const res = await startCardBillingCheckout({
      plan_slug: planSlug,
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

    const approved = isCardCheckoutApproved(res.data);
    setCheckoutResult(res.data);
    setCardModalOpen(false);
    await refreshStatus({ silent: true });
    await refreshPaymentMethods();

    if (approved) {
      setCardApproved(true);
      addNotification({
        event_type: "BILLING_CHECKOUT_OK",
        entity_type: "billing",
        title: "Pagamento aprovado",
        message: `Plano ${selectedPlan.name} ativado com sucesso.`,
        severity: "success",
      });
      return;
    }

    setCardCheckoutError(
      "Pagamento não aprovado. Confira os dados do cartão ou tente outro método."
    );
  }

  async function confirmPaidCheckout() {
    if (!selectedPlan || checkoutLoading) return;

    if (paymentMethod === "CREDIT_CARD") {
      openCardCheckoutModal();
      return;
    }

    const planSlug = resolveCheckoutPlanSlug(selectedPlan);
    if (!planSlug) {
      addNotification({
        event_type: "BILLING_CHECKOUT_ERROR",
        entity_type: "billing",
        title: "Checkout indisponível",
        message: "Não foi possível identificar o plano selecionado.",
        severity: "error",
      });
      return;
    }

    setCheckoutLoading(true);
    const usePlanChange =
      paymentMethod !== "CREDIT_CARD" && !currentPlan?.isFree && currentPlan?.billingRequired !== false;
    const res = usePlanChange
      ? await changeSubscriptionPlan({
          target_plan_slug: planSlug,
          payment_method: paymentMethod,
          explicit_user_action: true,
        })
      : await startBillingCheckout({
          plan_slug: planSlug,
          payment_method: paymentMethod,
          explicit_user_action: true,
        });
    setCheckoutLoading(false);

    if (!res.ok) {
      addNotification({
        event_type: "BILLING_CHECKOUT_ERROR",
        entity_type: "billing",
        title: "Falha no checkout",
        message: res.error || res.data?.message || "Não foi possível iniciar a assinatura.",
        severity: "error",
      });
      return;
    }

    setCheckoutResult(res.data);
    await refreshStatus({ silent: true });

    if (res.data?.kind === "internal_free") {
      addNotification({
        event_type: "BILLING_CHECKOUT_OK",
        entity_type: "billing",
        title: "Plano ativado",
        message: "Seu plano foi atualizado. O acesso já está disponível.",
        severity: "success",
      });
      return;
    }

    addNotification({
      event_type: "BILLING_CHECKOUT_OK",
      entity_type: "billing",
      title: "Pagamento gerado",
      message: "Conclua o pagamento para liberar o acesso premium.",
      severity: "info",
    });
  }

  return (
    <div className="s7-billing-page">
      <S7PageHeader
        title="Planos"
        subtitle="Escolha o plano ideal para o seu momento. Limites e preços vêm do catálogo oficial do Suse7."
      />

      {loading ? <p className="s7-billing-muted">Carregando planos e status da assinatura…</p> : null}
      {error ? (
        <section className="s7-billing-page__state s7-billing-page__state--error" aria-live="polite">
          <p className="s7-billing-error">{error}</p>
          <S7Button variant="secondary" onClick={retryLoad}>
            Tentar novamente
          </S7Button>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="s7-billing-plans-grid" aria-label="Catálogo de planos">
          {plans.map((catalogPlan) => (
            <PlanCard
              key={catalogPlan.id}
              plan={catalogPlan}
              currentPlan={currentPlan}
              catalogPlans={plans}
              onSelect={handlePlanSelect}
            />
          ))}
        </section>
      ) : null}

      {selectedPlan && cardApproved ? (
        <div className="s7-billing-checkout-sheet" role="dialog" aria-modal="true">
          <div className="s7-billing-checkout-sheet__panel">
            <h3>Pagamento aprovado</h3>
            <p>
              Plano {selectedPlan.name} ativado. Sua assinatura está ativa e o cartão foi salvo para cobranças
              recorrentes.
            </p>
            <div className="s7-billing-checkout-sheet__actions">
              <S7Button variant="primary" onClick={resetCheckoutSheet}>
                Voltar aos planos
              </S7Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedPlan && !showPixModal && !showBoletoModal && !cardApproved ? (
        <div
          className="s7-billing-checkout-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="s7-checkout-payment-title"
          onClick={() => {
            if (!checkoutLoading) resetCheckoutSheet();
          }}
        >
          <div className="s7-billing-checkout-sheet__panel" onClick={(event) => event.stopPropagation()}>
            {checkoutResult?.kind === "internal_free" ? (
              <>
                <h3 id="s7-checkout-payment-title">Plano ativado</h3>
                <p>Plano {selectedPlan.name} ativado. Você já pode usar o Suse7 com o novo plano.</p>
              </>
            ) : !checkoutResult ? (
              <CheckoutPaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={checkoutLoading}
                planName={selectedPlan.name}
                title="Pagamento"
              />
            ) : null}
            <CheckoutSheetActions
              checkoutLoading={checkoutLoading}
              checkoutResult={checkoutResult}
              paymentMethod={paymentMethod}
              onConfirm={confirmPaidCheckout}
            />
          </div>
        </div>
      ) : null}

      <PixCheckoutModal
        open={showPixModal}
        checkout={checkoutResult}
        planName={selectedPlan?.name || checkoutResult?.plan?.name || ""}
        onClose={() => {
          setCheckoutResult(null);
          setSelectedPlan(null);
        }}
        onPaymentConfirmed={() => refreshStatus({ silent: true })}
        onBackToPlans={() => {
          setCheckoutResult(null);
          setSelectedPlan(null);
        }}
      />

      <CardCheckoutModal
        open={cardModalOpen}
        mode="checkout"
        planName={selectedPlan?.name}
        planValue={selectedPlan?.price_monthly}
        savedMethods={savedPaymentMethods}
        loading={cardCheckoutLoading}
        errorMessage={cardCheckoutError}
        onClose={() => {
          if (!cardCheckoutLoading) setCardModalOpen(false);
        }}
        onSubmit={submitCardCheckout}
      />

      <BillingBoletoModal
        open={showBoletoModal}
        checkout={checkoutResult}
        planName={selectedPlan?.name || checkoutResult?.plan?.name || ""}
        isSandbox={boletoSandbox}
        onClose={() => {
          setCheckoutResult(null);
          setSelectedPlan(null);
        }}
        onPaymentConfirmed={() => refreshStatus({ silent: true })}
      />

      {downgradePlan ? (
        <div className="s7-billing-checkout-sheet" role="dialog" aria-modal="true">
          <div className="s7-billing-checkout-sheet__panel">
            <h3>Agendar downgrade?</h3>
            <p>
              Seu plano atual continua ativo até {planChangeAccessEndLabel}. Depois disso, sua assinatura passará para{" "}
              {downgradePlan.name}.
            </p>
            <p className="s7-billing-muted">Nenhuma cobrança extra é gerada agora. O histórico financeiro é preservado.</p>
            <div className="s7-billing-checkout-sheet__actions">
              <S7Button variant="secondary" onClick={resetDowngradeSheet} disabled={downgradeLoading}>
                Manter plano atual
              </S7Button>
              <S7Button variant="primary" onClick={confirmScheduledDowngrade} disabled={downgradeLoading}>
                {downgradeLoading ? "Agendando downgrade…" : "Agendar downgrade"}
              </S7Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckoutSheetActions({ checkoutLoading, checkoutResult, paymentMethod = "PIX", onConfirm }) {
  if (checkoutResult) return null;

  const isCard = paymentMethod === "CREDIT_CARD";
  const label = isCard
    ? checkoutLoading
      ? "Abrindo cartão…"
      : "Continuar com cartão"
    : checkoutLoading
      ? "Gerando pagamento…"
      : "Gerar pagamento";

  return (
    <div className="s7-billing-checkout-sheet__actions s7-billing-checkout-sheet__actions--primary-only">
      <S7Button variant="primary" onClick={onConfirm} disabled={checkoutLoading}>
        {label}
      </S7Button>
    </div>
  );
}

