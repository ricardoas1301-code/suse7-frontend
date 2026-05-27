/** @typedef {"active" | "past_due" | "cancelled" | "trialing"} SubscriptionManagementStatus */

/** @typedef {"monthly" | "yearly"} SubscriptionManagementBillingCycle */

/**
 * @typedef {{
 *   currentPlan: string;
 *   subscriptionPrice: number;
 *   salesLimit: number;
 *   currentConsumption: number;
 *   remainingSales: number;
 *   billingCycle: SubscriptionManagementBillingCycle;
 *   subscriptionStatus: SubscriptionManagementStatus;
 * }} SubscriptionManagementStateViewModel
 */

/**
 * @typedef {{
 *   label: string;
 *   before: string;
 *   after: string;
 * }} SubscriptionManagementPreviewRow
 */

/**
 * @typedef {"initial" | "loaded" | "previewing" | "executing" | "success" | "error"} SubscriptionManagementPanelState
 */

export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PLAN = "Enterprise";
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PRICE = 199.9;
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_LIMIT = 10000;
export const SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION = 1450;

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
  const salesLimit = 5000;
  const currentConsumption = 1825;

  return {
    currentPlan: "Pro",
    subscriptionPrice: 149.9,
    salesLimit,
    currentConsumption,
    remainingSales: computeRemainingSales(salesLimit, currentConsumption),
    billingCycle: "monthly",
    subscriptionStatus: "active",
  };
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
 * @param {SubscriptionManagementStatus | string | null | undefined} status
 */
export function resolveSubscriptionStatusLabel(status) {
  switch (status) {
    case "active":
      return "Ativo";
    case "past_due":
      return "Inadimplente";
    case "cancelled":
      return "Cancelado";
    case "trialing":
      return "Trial";
    default:
      return String(status ?? "—");
  }
}

/**
 * @param {SubscriptionManagementStatus | string | null | undefined} status
 */
export function resolveSubscriptionStatusVariant(status) {
  switch (status) {
    case "active":
      return "healthy";
    case "trialing":
      return "info";
    case "past_due":
      return "warning";
    case "cancelled":
      return "muted";
    default:
      return "neutral";
  }
}

/**
 * @param {SubscriptionManagementStatus | string | null | undefined} status
 */
export function subscriptionManagementStatusClassName(status) {
  const variant = resolveSubscriptionStatusVariant(status);
  return `subscription-management-current-state__status subscription-management-current-state__status--${variant}`;
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
 * @param {Record<string, unknown>} result
 * @param {SubscriptionManagementStateViewModel} currentState
 * @returns {SubscriptionManagementStateViewModel}
 */
export function applySubscriptionManagementOperationResult(result, currentState) {
  const next = { ...currentState };

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

  return next;
}
