// ======================================================================
// Apresentação — estado financeiro canônico (sem regras de negócio)
// ======================================================================

export const BILLING_FINANCIAL_STATE = {
  CURRENT: "CURRENT",
  DUE_SOON: "DUE_SOON",
  DUE_TODAY: "DUE_TODAY",
  GRACE_PERIOD: "GRACE_PERIOD",
  SUSPENDED: "SUSPENDED",
};

export const BILLING_ACCESS_STATE = {
  LIBERATED: "LIBERATED",
  LIMITED: "LIMITED",
  DETAILED_ACCESS_RESTRICTED: "DETAILED_ACCESS_RESTRICTED",
  HARD_PAUSED: "HARD_PAUSED",
  BLOCKED: "BLOCKED",
};

export const BILLING_PAYMENT_CONTEXT = {
  MONTHLY_RENEWAL_GRACE: "MONTHLY_RENEWAL_GRACE",
  SUBSCRIPTION_REACTIVATION: "SUBSCRIPTION_REACTIVATION",
};

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function pickBillingFinancialStateSource(source) {
  if (!source || typeof source !== "object") return null;
  if (source.billing_financial_state) return source;
  if (source.renewal_experience && typeof source.renewal_experience === "object") {
    return /** @type {Record<string, unknown>} */ (source.renewal_experience);
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveBillingFinancialStateKey(source) {
  const row = pickBillingFinancialStateSource(source);
  return row?.billing_financial_state ? String(row.billing_financial_state).toUpperCase() : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveBillingAccessStateKey(source) {
  const row = pickBillingFinancialStateSource(source);
  return row?.access_state ? String(row.access_state).toUpperCase() : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} renewalExperience
 */
export function resolveFinancialStateAlert(renewalExperience) {
  const financialState = resolveBillingFinancialStateKey(renewalExperience);
  const dueDate = renewalExperience?.due_date ?? renewalExperience?.grace_period_end ?? null;

  if (financialState === BILLING_FINANCIAL_STATE.GRACE_PERIOD) {
    const dueLabel = formatDueDatePt(dueDate);
    return {
      tone: "warning",
      title: "Pagamento da assinatura pendente",
      message: `Sua assinatura venceu em ${dueLabel}. Regularize o pagamento durante o período de tolerância para manter seu ciclo e acesso.`,
      ctaLabel: renewalExperience?.primary_action?.label ?? "Renovar assinatura",
    };
  }

  if (financialState === BILLING_FINANCIAL_STATE.SUSPENDED) {
    if (renewalExperience?.usage_state === "LIMIT_RESTRICTED" && renewalExperience?.suspension_fallback_active) {
      return {
        tone: "danger",
        title: "Limite do plano Baby atingido",
        message:
          "Você atingiu o limite de 60 vendas do plano Baby. Reative seu plano ou aguarde a renovação do seu ciclo.",
        ctaLabel: renewalExperience?.primary_action?.label ?? "Reativar plano Elite",
        variant: "suspension_fallback_limit",
      };
    }
    if (renewalExperience?.suspension_fallback_active || renewalExperience?.effective_entitlement === "BABY_INTERNAL_FREE") {
      return {
        tone: "danger",
        title: "Sua assinatura foi suspensa",
        message:
          "Seu plano Elite não foi renovado e sua conta migrou automaticamente para o plano Baby gratuito. Você pode utilizar até 60 vendas neste ciclo ou reativar sua assinatura.",
        ctaLabel: renewalExperience?.primary_action?.label ?? "Reativar plano Elite",
        variant: "suspension_fallback",
      };
    }
    return {
      tone: "danger",
      title: "Assinatura suspensa",
      message:
        "Seu período de tolerância terminou. Reative sua assinatura para recuperar o acesso às funcionalidades da SUSE7.",
      ctaLabel: renewalExperience?.primary_action?.label ?? "Regularizar assinatura",
    };
  }

  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} renewalExperience
 */
export function shouldShowFinancialStateAlert(renewalExperience) {
  return Boolean(resolveFinancialStateAlert(renewalExperience));
}

/**
 * @param {Record<string, unknown> | null | undefined} renewalExperience
 */
export function resolveFinancialSubscriptionStatusLabel(renewalExperience) {
  if (renewalExperience?.suspension_fallback_active) {
    return `${capitalizePlanKey(renewalExperience.previous_contracted_plan_key ?? "Elite")} — Suspensa`;
  }
  const financialState = resolveBillingFinancialStateKey(renewalExperience);
  if (financialState === BILLING_FINANCIAL_STATE.GRACE_PERIOD) return "Pagamento pendente";
  if (financialState === BILLING_FINANCIAL_STATE.SUSPENDED) return "Suspensa";
  if (financialState === BILLING_FINANCIAL_STATE.DUE_TODAY) return "Vence hoje";
  return null;
}

export function resolveEffectivePlanUsageLabel(renewalExperience) {
  if (renewalExperience?.suspension_fallback_active || renewalExperience?.effective_entitlement === "BABY_INTERNAL_FREE") {
    return renewalExperience?.effective_plan_label ?? "Baby gratuito";
  }
  return null;
}

export function resolveEffectiveUsageLimitLabel(renewalExperience) {
  const limit = renewalExperience?.usage_limit;
  if (renewalExperience?.suspension_fallback_active && Number.isFinite(Number(limit))) {
    return `${limit} vendas por ciclo`;
  }
  return null;
}

/**
 * @param {unknown} value
 */
function capitalizePlanKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Plano";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * @param {Record<string, unknown> | null | undefined} renewalExperience
 */
export function resolveFinancialAccessStatusLabel(renewalExperience) {
  const accessState = resolveBillingAccessStateKey(renewalExperience);
  if (renewalExperience?.usage_state === "HARD_LIMIT_REACHED") return "Sincronização pausada";
  if (renewalExperience?.usage_state === "LIMIT_RESTRICTED") return "Restrito";
  if (renewalExperience?.usage_state === "LIMIT_REACHED_GRACE") return "Em tolerância de uso";
  if (accessState === BILLING_ACCESS_STATE.BLOCKED) return "Bloqueado";
  if (accessState === BILLING_ACCESS_STATE.HARD_PAUSED) return "Sincronização pausada";
  if (accessState === BILLING_ACCESS_STATE.DETAILED_ACCESS_RESTRICTED || accessState === BILLING_ACCESS_STATE.LIMITED) {
    return "Restrito";
  }
  if (accessState === BILLING_ACCESS_STATE.LIBERATED && resolveBillingFinancialStateKey(renewalExperience) === BILLING_FINANCIAL_STATE.GRACE_PERIOD) {
    return "Em tolerância";
  }
  if (accessState === BILLING_ACCESS_STATE.LIBERATED && renewalExperience?.suspension_fallback_active) {
    return "Liberado";
  }
  if (accessState === BILLING_ACCESS_STATE.LIBERATED) return "Liberado";
  return null;
}

/**
 * @param {unknown} isoDate
 */
function formatDueDatePt(isoDate) {
  if (!isoDate) return "—";
  const raw = String(isoDate).slice(0, 10);
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) return raw;
  return `${day}/${month}/${year}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} renewalExperience
 */
export function resolveCheckoutPaymentContext(renewalExperience) {
  const fromDto = renewalExperience?.payment_context;
  if (fromDto === BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION) {
    return BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION;
  }
  if (fromDto === BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL_GRACE) {
    return BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL_GRACE;
  }
  if (resolveBillingFinancialStateKey(renewalExperience) === BILLING_FINANCIAL_STATE.SUSPENDED) {
    return BILLING_PAYMENT_CONTEXT.SUBSCRIPTION_REACTIVATION;
  }
  return BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL_GRACE;
}
