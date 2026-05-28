// ======================================================================
// UX de billing — apenas exibição a partir do payload do backend
// ======================================================================

const STATE_COPY = {
  none: {
    title: "Ative um plano para desbloquear recursos premium",
    description: "Escolha um plano e acompanhe o status da assinatura no seu perfil.",
    tone: "muted",
  },
  inactive: {
    title: "Assinatura inativa",
    description: "Reative sua assinatura para voltar a usar os módulos premium do Suse7.",
    tone: "muted",
  },
  internal_free: {
    title: "Plano gratuito ativo",
    description: "Você já usa o Suse7 no plano gratuito. Faça upgrade quando precisar de mais limite e recursos.",
    tone: "info",
  },
  active: {
    title: "Assinatura ativa",
    description: "Seu acesso premium está liberado conforme o status financeiro no backend.",
    tone: "success",
  },
  pending: {
    title: "Pagamento em processamento",
    description: "Conclua o pagamento ou use “Atualizar status” na tela do Pix. Seu plano atual continua ativo até a confirmação.",
    tone: "warning",
  },
  past_due: {
    title: "Pagamento em atraso",
    description: "Atualize o pagamento para evitar interrupções. O status continua sendo calculado no backend.",
    tone: "danger",
  },
  canceled: {
    title: "Assinatura cancelada",
    description: "Se ainda houver período vigente, o backend mantém o acesso até a data informada.",
    tone: "muted",
  },
  refunded: {
    title: "Assinatura reembolsada",
    description: "Escolha um novo plano para voltar a usar os recursos premium.",
    tone: "muted",
  },
};

/**
 * @param {Record<string, unknown> | null | undefined} access
 * @param {Array<Record<string, unknown>> | null | undefined} subscriptions
 * @param {Record<string, unknown> | null | undefined} statusExtras
 */
export function resolveBillingUx(access, subscriptions, statusExtras = null) {
  const pendingCheckout = statusExtras?.pending_checkout ?? null;
  const activeSubscription = statusExtras?.active_subscription ?? null;
  const hasPendingUpgrade = Boolean(pendingCheckout?.subscription_id);
  const canAccess = Boolean(access?.can_access);

  let state = String(access?.state || "none").toLowerCase();
  if (hasPendingUpgrade && canAccess) {
    state = String(activeSubscription?.status || access?.subscription_status || state).toLowerCase();
  }

  const displaySub = activeSubscription ?? (Array.isArray(subscriptions) ? subscriptions[0] : null);
  const copy = hasPendingUpgrade && canAccess ? STATE_COPY.active : STATE_COPY[state] || STATE_COPY.none;

  return {
    state,
    canAccess,
    planId: access?.plan_id ?? null,
    subscriptionId: access?.subscription_id ?? null,
    subscriptionStatus: access?.subscription_status ?? displaySub?.status ?? null,
    planKey: displaySub?.plan_key ?? null,
    currentPeriodEnd: displaySub?.current_period_end ?? null,
    nextDueDate: displaySub?.next_due_date ?? null,
    title: copy.title,
    description: copy.description,
    tone: copy.tone,
    showGraceNotice: state === "canceled" && canAccess && Boolean(displaySub?.current_period_end),
    hasPendingCheckout: hasPendingUpgrade,
  };
}
