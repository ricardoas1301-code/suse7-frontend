// ======================================================================
// Planos — identificação do plano atual e rótulos de CTA (UI only)
// ======================================================================

/**
 * @param {unknown} source
 * @returns {string | null}
 */
export function normalizePlanKey(source) {
  if (source == null) return null;
  if (typeof source === "string") {
    const value = source.trim().toLowerCase();
    return value || null;
  }
  if (typeof source !== "object") return null;
  const value = source.slug ?? source.code ?? source.plan_key ?? null;
  return value != null && String(value).trim() !== "" ? String(value).trim().toLowerCase() : null;
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} subscriptions
 */
export function pickPrimarySubscription(subscriptions) {
  if (!Array.isArray(subscriptions)) return null;
  const accessGranting = new Set(["active", "internal_free", "past_due"]);
  for (const sub of subscriptions) {
    const status = String(sub?.status || "").toLowerCase();
    if (status === "canceled" || status === "refunded") continue;
    if (accessGranting.has(status)) return sub;
  }
  for (const sub of subscriptions) {
    const status = String(sub?.status || "").toLowerCase();
    if (status === "canceled" || status === "refunded") continue;
    return sub;
  }
  return subscriptions[0] ?? null;
}

/**
 * @param {{ plan?: Record<string, unknown> | null; subscriptions?: Array<Record<string, unknown>>; access?: Record<string, unknown> | null } | null | undefined} status
 */
export function getCurrentPlanKey(status) {
  if (!status) return null;
  const fromPlan = normalizePlanKey(status.plan);
  if (fromPlan) return fromPlan;
  const subscription = pickPrimarySubscription(status.subscriptions);
  const fromSubscription = normalizePlanKey(subscription?.plan_key ?? subscription?.plan_slug);
  if (fromSubscription) return fromSubscription;
  const planId = status.access?.plan_id;
  return planId != null && String(planId).trim() !== "" ? String(planId).trim().toLowerCase() : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 * @param {Array<Record<string, unknown>>} [catalogPlans]
 */
function resolveCatalogPlan(plan, catalogPlans = []) {
  if (!plan) return null;
  const planId = plan.id != null ? String(plan.id) : null;
  const planKey = normalizePlanKey(plan);
  return (
    catalogPlans.find((item) => planId && String(item.id) === planId) ??
    catalogPlans.find((item) => planKey && normalizePlanKey(item) === planKey) ??
    plan
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} currentPlan
 * @param {Array<Record<string, unknown>>} [catalogPlans]
 * @param {Record<string, unknown> | null | undefined} [fallbackPlan]
 */
function resolvePlanSortOrder(currentPlan, catalogPlans = [], fallbackPlan = null) {
  const catalogPlan = resolveCatalogPlan(fallbackPlan ?? currentPlan?.plan ?? currentPlan, catalogPlans);
  const sortOrder = Number(catalogPlan?.sort_order);
  return Number.isFinite(sortOrder) ? sortOrder : null;
}

/**
 * @param {{ plan?: Record<string, unknown> | null; subscriptions?: Array<Record<string, unknown>>; access?: Record<string, unknown> | null } | null | undefined} status
 * @param {Array<Record<string, unknown>>} [catalogPlans]
 */
export function resolveCurrentPlanSnapshot(status, catalogPlans = []) {
  const plans = Array.isArray(catalogPlans) ? catalogPlans : [];
  const subscription =
    status?.active_subscription ?? pickPrimarySubscription(status?.subscriptions);
  const planId = status?.plan?.plan_id ?? status?.plan?.id ?? status?.access?.plan_id ?? subscription?.plan_id ?? null;
  const planKey = getCurrentPlanKey(status);
  const catalogMatch =
    (planId ? plans.find((item) => String(item.id) === String(planId)) : null) ??
    (planKey ? plans.find((item) => normalizePlanKey(item) === planKey) : null);
  const billingRequired = catalogMatch?.billing_required ?? status?.plan?.billing_required ?? true;

  return {
    planId: planId != null ? String(planId) : catalogMatch?.id != null ? String(catalogMatch.id) : null,
    planKey: planKey ?? normalizePlanKey(catalogMatch),
    sortOrder: resolvePlanSortOrder({ plan: catalogMatch ?? status?.plan }, plans, catalogMatch ?? status?.plan),
    billingRequired,
    isFree: billingRequired === false,
    plan: status?.plan ?? catalogMatch ?? null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function isEnterprisePlan(plan) {
  const key = normalizePlanKey(plan);
  if (!key) return false;
  if (key === "enterprise") return true;
  return Boolean(plan?.contact_sales || plan?.requires_sales_contact);
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 * @param {ReturnType<typeof resolveCurrentPlanSnapshot> | null | undefined} currentPlan
 */
export function isCurrentPlan(plan, currentPlan) {
  if (!plan || !currentPlan) return false;
  if (currentPlan.planId && plan.id != null && String(currentPlan.planId) === String(plan.id)) return true;
  const planKey = normalizePlanKey(plan);
  return Boolean(planKey && currentPlan.planKey && planKey === currentPlan.planKey);
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 * @param {ReturnType<typeof resolveCurrentPlanSnapshot> | null | undefined} currentPlan
 * @param {Array<Record<string, unknown>>} [catalogPlans]
 */
export function getPlanCtaLabel(plan, currentPlan, catalogPlans = []) {
  if (!plan) return "Selecionar plano";
  if (isCurrentPlan(plan, currentPlan)) return "Plano atual";
  if (isEnterprisePlan(plan)) return "Falar com suporte";

  if (plan.billing_required === false) return "Ativar plano gratuito";

  const currentSort = resolvePlanSortOrder(currentPlan, catalogPlans, currentPlan?.plan);
  const targetSort = resolvePlanSortOrder(null, catalogPlans, plan);

  if (currentPlan?.isFree) return "Assinar plano";
  if (currentSort != null && targetSort != null) {
    if (targetSort > currentSort) return "Alterar plano";
    if (targetSort < currentSort) return "Agendar downgrade";
  }
  return "Assinar plano";
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 * @param {ReturnType<typeof resolveCurrentPlanSnapshot> | null | undefined} currentPlan
 * @param {Array<Record<string, unknown>>} [catalogPlans]
 */
export function getPlanCardCtaState(plan, currentPlan, catalogPlans = []) {
  const current = isCurrentPlan(plan, currentPlan);
  const enterprise = isEnterprisePlan(plan);
  const label = getPlanCtaLabel(plan, currentPlan, catalogPlans);
  const currentSort = resolvePlanSortOrder(currentPlan, catalogPlans, currentPlan?.plan);
  const targetSort = resolvePlanSortOrder(null, catalogPlans, plan);
  const changeKind =
    !current && !enterprise && currentSort != null && targetSort != null
      ? targetSort > currentSort
        ? "upgrade"
        : targetSort < currentSort
          ? "downgrade"
          : "switch"
      : currentPlan?.isFree
        ? "upgrade"
        : "switch";

  return {
    label,
    disabled: current,
    badge: current ? "Seu plano" : null,
    isEnterprise: enterprise,
    isCurrent: current,
    usesCheckout: !current && !enterprise && changeKind !== "downgrade",
    changeKind,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function getEnterpriseContactHref(plan) {
  const planName = plan?.marketing_name ?? plan?.display_name ?? plan?.name ?? plan?.plan_key ?? "Enterprise";
  const subject = encodeURIComponent(`Suse7 — Plano ${planName}`);
  return `mailto:contato@suse7.com.br?subject=${subject}`;
}
