/** @typedef {"active" | "suspended" | "canceled" | "trial" | "past_due" | "cancelled" | "trialing"} SubscriptionManagementLifecycleStatus */

/** @typedef {"monthly" | "yearly"} SubscriptionManagementBillingCycle */

/**
 * @typedef {{
 *   currentPlan: string;
 *   subscriptionPrice: number;
 *   salesLimit: number;
 *   currentConsumption: number;
 *   remainingSales: number;
 *   billingCycle: SubscriptionManagementBillingCycle;
 *   subscriptionStatus: SubscriptionManagementLifecycleStatus;
 *   benefits: string[];
 * }} SubscriptionManagementStateViewModel
 */

/**
 * @typedef {{
 *   label: string;
 *   before: string;
 *   after: string;
 *   changeType?: "default" | "benefit-add" | "benefit-remove";
 * }} SubscriptionManagementPreviewRow
 */

/**
 * @typedef {"initial" | "loaded" | "previewing" | "executing" | "success" | "error"} SubscriptionManagementPanelState
 */

export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PLAN = "Enterprise";
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PRICE = 199.9;
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_LIMIT = 10000;
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION = 1450;

/** @type {readonly string[]} */
export const SUBSCRIPTION_MANAGEMENT_MOCK_BENEFIT_KEYS = [
  "pricing_ai",
  "whatsapp_notifications",
  "advanced_dashboard",
  "priority_support",
  "multi_marketplace",
  "api_access",
];

/** @type {Record<string, { label: string; category?: string }>} */
export const SUBSCRIPTION_MANAGEMENT_BENEFIT_CATALOG = {
  pricing_ai: { label: "Precificação IA", category: "Inteligência" },
  whatsapp_notifications: { label: "Notificações WhatsApp", category: "Comunicação" },
  advanced_dashboard: { label: "Dashboard Avançado", category: "Analytics" },
  priority_support: { label: "Priority Support", category: "Suporte" },
  multi_marketplace: { label: "Multi Marketplace", category: "Integração" },
  api_access: { label: "API Access", category: "Integração" },
};

/**
 * @param {number} salesLimit
 * @param {number} currentConsumption
 */
export function computeRemainingSales(salesLimit, currentConsumption) {
  return Math.max(0, salesLimit - currentConsumption);
}

/**
 * @returns {SubscriptionManagementStateViewModel}
 */
export function buildSubscriptionManagementMockState() {
  const salesLimit = 10000;
  const currentConsumption = 1450;

  return {
    currentPlan: "Enterprise",
    subscriptionPrice: 199.9,
    salesLimit,
    currentConsumption,
    remainingSales: computeRemainingSales(salesLimit, currentConsumption),
    billingCycle: "monthly",
    subscriptionStatus: "active",
    benefits: ["pricing_ai", "whatsapp_notifications", "advanced_dashboard"],
  };
}

/**
 * @param {string | null | undefined} benefitKey
 */
export function resolveBenefitLabel(benefitKey) {
  const key = String(benefitKey ?? "").trim();
  if (!key) return "—";
  return SUBSCRIPTION_MANAGEMENT_BENEFIT_CATALOG[key]?.label ?? key;
}

/**
 * @param {string | null | undefined} benefitKey
 */
export function resolveBenefitCategory(benefitKey) {
  const key = String(benefitKey ?? "").trim();
  if (!key) return null;
  return SUBSCRIPTION_MANAGEMENT_BENEFIT_CATALOG[key]?.category ?? null;
}

/**
 * @param {number | null | undefined} value
 */
export function formatSubscriptionPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

/**
 * @param {number | null | undefined} value
 */
export function formatSalesLimit(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR").format(Number(value));
}

/**
 * @param {SubscriptionManagementBillingCycle | string | null | undefined} cycle
 */
export function resolveBillingCycleLabel(cycle) {
  switch (cycle) {
    case "monthly":
      return "Mensal";
    case "yearly":
      return "Anual";
    default:
      return String(cycle ?? "—");
  }
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function resolveSubscriptionLifecycleStatusLabel(status) {
  switch (status) {
    case "active":
      return "Ativa";
    case "suspended":
      return "Suspensa";
    case "canceled":
    case "cancelled":
      return "Cancelada";
    case "trial":
    case "trialing":
      return "Trial";
    case "past_due":
      return "Inadimplente";
    default:
      return String(status ?? "—");
  }
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function resolveSubscriptionLifecycleStatusVariant(status) {
  switch (status) {
    case "active":
      return "healthy";
    case "trial":
    case "trialing":
      return "info";
    case "suspended":
    case "past_due":
      return "warning";
    case "canceled":
    case "cancelled":
      return "muted";
    default:
      return "neutral";
  }
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function resolveSubscriptionStatusLabel(status) {
  return resolveSubscriptionLifecycleStatusLabel(status);
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function resolveSubscriptionStatusVariant(status) {
  return resolveSubscriptionLifecycleStatusVariant(status);
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function subscriptionManagementStatusClassName(status) {
  const variant = resolveSubscriptionLifecycleStatusVariant(status);
  return `subscription-management-current-state__status subscription-management-current-state__status--${variant}`;
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string | null | undefined} status
 */
export function subscriptionManagementLifecycleStatusClassName(status) {
  const variant = resolveSubscriptionLifecycleStatusVariant(status);
  return `subscription-management-governance__status subscription-management-governance__status--${variant}`;
}

/**
 * @param {{
 *   sellerId: string | null | undefined;
 *   drawerState: string | null | undefined;
 *   toolboxState: string | null | undefined;
 *   isReady: boolean;
 * }} input
 * @returns {SubscriptionManagementPanelState}
 */
export function resolveSubscriptionManagementPanelState({
  sellerId,
  drawerState,
  toolboxState,
  isReady,
}) {
  if (!sellerId || drawerState !== "open") return "initial";
  if (!isReady || toolboxState === "loading") return "initial";
  if (toolboxState === "error") return "error";
  if (toolboxState === "empty") return "error";
  return "loaded";
}

/**
 * @param {SubscriptionManagementBillingCycle | string} billingCycle
 */
export function resolveNextBillingCycle(billingCycle) {
  return billingCycle === "yearly" ? "monthly" : "yearly";
}

/**
 * @param {SubscriptionManagementLifecycleStatus | string} status
 */
export function resolveNextSubscriptionLifecycleStatus(status) {
  if (status === "active") return "suspended";
  if (status === "suspended") return "active";
  return "active";
}

/**
 * @param {string[]} benefits
 */
export function resolveNextBenefitsMutation(benefits) {
  const current = Array.isArray(benefits) ? [...benefits] : [];

  if (current.includes("advanced_dashboard")) {
    return {
      action: "remove",
      benefitKey: "advanced_dashboard",
      newBenefits: current.filter((key) => key !== "advanced_dashboard"),
    };
  }

  if (!current.includes("priority_support")) {
    return {
      action: "add",
      benefitKey: "priority_support",
      newBenefits: [...current, "priority_support"],
    };
  }

  return {
    action: "remove",
    benefitKey: "priority_support",
    newBenefits: current.filter((key) => key !== "priority_support"),
  };
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildChangePlanPreviewRows(state) {
  return [
    {
      label: "Plano",
      before: state.currentPlan,
      after: SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PLAN,
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildEditPricePreviewRows(state) {
  return [
    {
      label: "Valor",
      before: formatSubscriptionPrice(state.subscriptionPrice),
      after: formatSubscriptionPrice(SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PRICE),
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildAdjustLimitPreviewRows(state) {
  return [
    {
      label: "Limite",
      before: formatSalesLimit(state.salesLimit),
      after: formatSalesLimit(SUBSCRIPTION_MANAGEMENT_FAKE_NEW_LIMIT),
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildCorrectConsumptionPreviewRows(state) {
  const newRemaining = computeRemainingSales(state.salesLimit, SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION);

  return [
    {
      label: "Consumo",
      before: formatSalesLimit(state.currentConsumption),
      after: formatSalesLimit(SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION),
    },
    {
      label: "Disponível",
      before: formatSalesLimit(state.remainingSales),
      after: formatSalesLimit(newRemaining),
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildChangeBillingCyclePreviewRows(state) {
  const nextCycle = resolveNextBillingCycle(state.billingCycle);

  return [
    {
      label: "Ciclo",
      before: resolveBillingCycleLabel(state.billingCycle),
      after: resolveBillingCycleLabel(nextCycle),
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildManageSubscriptionStatusPreviewRows(state) {
  const nextStatus = resolveNextSubscriptionLifecycleStatus(state.subscriptionStatus);

  return [
    {
      label: "Status",
      before: resolveSubscriptionLifecycleStatusLabel(state.subscriptionStatus),
      after: resolveSubscriptionLifecycleStatusLabel(nextStatus),
    },
  ];
}

/**
 * @param {SubscriptionManagementStateViewModel} state
 * @returns {SubscriptionManagementPreviewRow[]}
 */
export function buildManageBenefitsPreviewRows(state) {
  const mutation = resolveNextBenefitsMutation(state.benefits ?? []);
  const benefitLabel = resolveBenefitLabel(mutation.benefitKey);

  if (mutation.action === "remove") {
    return [
      {
        label: "Benefícios",
        before: benefitLabel,
        after: `- ${benefitLabel}`,
        changeType: "benefit-remove",
      },
    ];
  }

  return [
    {
      label: "Benefícios",
      before: "—",
      after: `+ ${benefitLabel}`,
      changeType: "benefit-add",
    },
  ];
}

/**
 * @param {Record<string, unknown>} result
 * @param {SubscriptionManagementStateViewModel} currentState
 * @returns {SubscriptionManagementStateViewModel}
 */
export function applySubscriptionManagementOperationResult(result, currentState) {
  const next = {
    ...currentState,
    benefits: Array.isArray(currentState.benefits) ? [...currentState.benefits] : [],
  };

  if (typeof result.newPlan === "string" && result.newPlan) {
    next.currentPlan = result.newPlan;
  }

  if (result.newPrice != null && !Number.isNaN(Number(result.newPrice))) {
    next.subscriptionPrice = Number(result.newPrice);
  }

  if (result.newLimit != null && !Number.isNaN(Number(result.newLimit))) {
    next.salesLimit = Number(result.newLimit);
    next.remainingSales = computeRemainingSales(next.salesLimit, next.currentConsumption);
  }

  if (result.newConsumption != null && !Number.isNaN(Number(result.newConsumption))) {
    next.currentConsumption = Number(result.newConsumption);
    next.remainingSales =
      result.remainingSales != null && !Number.isNaN(Number(result.remainingSales))
        ? Number(result.remainingSales)
        : computeRemainingSales(next.salesLimit, next.currentConsumption);
  }

  if (typeof result.newBillingCycle === "string" && result.newBillingCycle) {
    next.billingCycle = /** @type {SubscriptionManagementBillingCycle} */ (result.newBillingCycle);
  }

  if (typeof result.newStatus === "string" && result.newStatus) {
    next.subscriptionStatus = /** @type {SubscriptionManagementLifecycleStatus} */ (result.newStatus);
  }

  if (Array.isArray(result.newBenefits)) {
    next.benefits = result.newBenefits.map((key) => String(key));
  }

  return next;
}
