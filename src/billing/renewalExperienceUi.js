// ======================================================================
// Experiência de renovação manual — apresentação (sem regras de negócio)
// ======================================================================

export const RENEWAL_EXPERIENCE_STATE = {
  ACTIVE_NOT_DUE: "ACTIVE_NOT_DUE",
  RENEWAL_AWAITING_GENERATION: "RENEWAL_AWAITING_GENERATION",
  REACTIVATION_AWAITING_GENERATION: "REACTIVATION_AWAITING_GENERATION",
  RENEWAL_PAYMENT_GENERATING: "RENEWAL_PAYMENT_GENERATING",
  RENEWAL_PIX_OPEN: "RENEWAL_PIX_OPEN",
  RENEWAL_BOLETO_OPEN: "RENEWAL_BOLETO_OPEN",
  RENEWAL_PAID: "RENEWAL_PAID",
  PAYMENT_EXPIRED_OR_INVALID: "PAYMENT_EXPIRED_OR_INVALID",
};

export const RENEWAL_EXPERIENCE_ACTION = {
  RENEW_SUBSCRIPTION: "RENEW_SUBSCRIPTION",
  VIEW_PIX: "VIEW_PIX",
  REISSUE_BOLETO: "REISSUE_BOLETO",
};

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function shouldShowRenewalPrimaryAction(experience) {
  const action = String(experience?.primary_action?.action || "");
  if (
    experience?.primary_action?.label &&
    (action === RENEWAL_EXPERIENCE_ACTION.RENEW_SUBSCRIPTION ||
      action === RENEWAL_EXPERIENCE_ACTION.VIEW_PIX ||
      action === RENEWAL_EXPERIENCE_ACTION.REISSUE_BOLETO)
  ) {
    return true;
  }
  return Boolean(
    experience?.primary_action?.label &&
      Array.isArray(experience?.available_actions) &&
      experience.available_actions.length > 0
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function normalizeRenewalExperienceState(experience) {
  const state = experience?.renewal_state ?? experience?.state;
  if (typeof state === "string" && Object.values(RENEWAL_EXPERIENCE_STATE).includes(state)) {
    return state;
  }
  return RENEWAL_EXPERIENCE_STATE.ACTIVE_NOT_DUE;
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function formatRenewalCompetenciaLabel(experience) {
  const start = experience?.period?.start;
  if (!start) return null;
  const [year, month] = String(start).split("-");
  if (!year || !month) return null;
  return `${month}/${year}`;
}

export function buildRenewalModalPayment(experience) {
  if (!experience?.renewal_cycle_id) return null;
  const amountNumber = experience.amount != null ? Number(experience.amount) : null;
  const amountCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : null;

  return {
    renewal_cycle_id: String(experience.renewal_cycle_id),
    plan_name: experience.plan?.name ?? experience.plan?.plan_key ?? null,
    amount_cents: amountCents,
    due_date: experience.due_date ?? null,
    period_start: experience.period?.start ?? null,
    period_end: experience.period?.end ?? null,
    competencia_label: formatRenewalCompetenciaLabel(experience),
    periodo_label: formatRenewalPeriodLabel(experience),
    billing_state: "awaiting_generation",
    status_label: experience.renewal_state === RENEWAL_EXPERIENCE_STATE.RENEWAL_AWAITING_GENERATION ? "Renovação pendente" : null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function resolveRenewalPaymentMethodForAction(experience) {
  const action = String(experience?.primary_action?.action || "");
  if (action === RENEWAL_EXPERIENCE_ACTION.VIEW_PIX) return "PIX";
  if (action === RENEWAL_EXPERIENCE_ACTION.REISSUE_BOLETO) return "BOLETO";
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function formatRenewalPeriodLabel(experience) {
  const start = experience?.period?.start;
  const end = experience?.period?.end;
  if (!start || !end) return "—";
  const fmt = (iso) => {
    const [y, m, d] = String(iso).split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };
  return `${fmt(start)} — ${fmt(end)}`;
}
