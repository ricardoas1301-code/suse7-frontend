import { formatPlanDisplay, formatSellerDate } from "../../sellerOpsUtils";
import {
  formatSubscriptionCycleLabel,
  formatSubscriptionStatusLabel,
} from "../sellerDrawerSectionModel";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxSubscriptionPanelState */

/**
 * @typedef {{
 *   planName: string;
 *   planNameDisplay: string;
 *   planValue: string | null;
 *   planValueDisplay: string;
 *   planType: string | null;
 *   planTypeDisplay: string;
 *   statusLabel: string;
 *   cycleLabel: string;
 *   inTrial: boolean;
 *   inGrace: boolean;
 *   isPastDue: boolean;
 *   cycleStartLabel: string;
 *   cycleEndLabel: string;
 *   renewalLabel: string;
 *   daysRemainingLabel: string;
 *   consumptionAvailable: boolean;
 *   consumptionCurrentLabel: string;
 *   consumptionLimitLabel: string;
 *   consumptionPercentLabel: string;
 *   consumptionSummaryLabel: string;
 * }} SellerToolboxSubscriptionModel
 */

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatSubscriptionField(value, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "—") return fallback;
  return normalized;
}

/**
 * @param {...unknown} values
 */
function pickOptionalNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * @param {...unknown} values
 */
function pickFirstString(...values) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return null;
}

/**
 * @param {unknown} amount
 * @param {unknown} currency
 */
function formatPlanValue(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;

  const cur = String(currency ?? "BRL").trim().toUpperCase() || "BRL";
  if (cur === "BRL") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return `${value} ${cur}`;
}

/**
 * @param {import("../../sellerOpsTypes").SellerListRow | null | undefined} listPreview
 */
function formatSubscriptionStatusFromPreview(listPreview) {
  const status = String(listPreview?.subscription_status ?? "").trim();
  if (!status || status === "—") return "Sem assinatura";
  return formatSubscriptionStatusLabel({ status });
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 */
function buildOfficialConsumption(subscription) {
  if (!subscription || typeof subscription !== "object") {
    return {
      available: false,
      currentLabel: "Não informado",
      limitLabel: "Não informado",
      percentLabel: "Não informado",
      summaryLabel: "Consumo oficial não disponível",
    };
  }

  const nestedUsage =
    subscription.usage && typeof subscription.usage === "object" ? subscription.usage : null;

  const current = pickOptionalNumber(
    subscription.usage_current,
    nestedUsage?.current,
    nestedUsage?.used,
    subscription.consumption_current,
  );
  const limit = pickOptionalNumber(
    subscription.usage_limit,
    subscription.monthly_limit,
    nestedUsage?.limit,
    nestedUsage?.monthly_limit,
    subscription.consumption_limit,
  );
  const percent = pickOptionalNumber(
    subscription.usage_percent,
    nestedUsage?.percent,
    nestedUsage?.usage_percent,
  );

  if (current == null && limit == null && percent == null) {
    return {
      available: false,
      currentLabel: "Não informado",
      limitLabel: "Não informado",
      percentLabel: "Não informado",
      summaryLabel: "Consumo oficial não disponível",
    };
  }

  return {
    available: true,
    currentLabel: current != null ? String(current) : "Não informado",
    limitLabel: limit != null ? String(limit) : "Não informado",
    percentLabel: percent != null ? `${percent}%` : "Não informado",
    summaryLabel: "",
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerToolboxSubscriptionModel}
 */
export function buildSellerToolboxSubscriptionModel({ listPreview = null, detail = null }) {
  const subscription = detail?.subscription ?? null;
  const hasSubscriptionObject = Boolean(subscription && typeof subscription === "object");

  const planName = formatPlanDisplay(
    /** @type {string | null | undefined} */ (subscription?.plan_key ?? listPreview?.plan_key),
    /** @type {string | null | undefined} */ (subscription?.plan_label ?? listPreview?.plano),
  );

  const planValue = hasSubscriptionObject
    ? formatPlanValue(subscription?.amount, subscription?.currency)
    : null;

  const planType = hasSubscriptionObject
    ? pickFirstString(subscription?.plan_type, subscription?.billing_interval, subscription?.interval)
    : null;

  const statusLabel = hasSubscriptionObject
    ? formatSubscriptionStatusLabel(subscription)
    : formatSubscriptionStatusFromPreview(listPreview);

  const cycleLabel = hasSubscriptionObject
    ? formatSubscriptionCycleLabel(subscription)
    : listPreview?.in_trial
      ? "Trial"
      : listPreview?.in_grace
        ? "Grace period"
        : listPreview?.is_past_due
          ? "Inadimplente"
          : "—";

  const inTrial = Boolean(subscription?.in_trial ?? listPreview?.in_trial);
  const inGrace = Boolean(subscription?.in_grace ?? listPreview?.in_grace);
  const isPastDue = Boolean(subscription?.is_past_due ?? listPreview?.is_past_due);

  const cycleStartLabel = hasSubscriptionObject
    ? formatSellerDate(/** @type {string | null | undefined} */ (subscription?.current_period_start))
    : "—";

  const cycleEndLabel = hasSubscriptionObject
    ? formatSellerDate(/** @type {string | null | undefined} */ (subscription?.current_period_end))
    : "—";

  const renewalLabel = hasSubscriptionObject
    ? formatSellerDate(
        /** @type {string | null | undefined} */ (
          subscription?.current_period_end ?? subscription?.next_due_date
        ),
      )
    : "—";

  const daysRemaining = hasSubscriptionObject
    ? pickOptionalNumber(subscription?.days_remaining, subscription?.period_days_remaining)
    : null;

  const consumption = buildOfficialConsumption(
    hasSubscriptionObject ? subscription : null,
  );

  return {
    planName,
    planNameDisplay: formatSubscriptionField(planName === "—" ? null : planName),
    planValue,
    planValueDisplay: planValue ?? "Não informado",
    planType,
    planTypeDisplay: formatSubscriptionField(planType),
    statusLabel,
    cycleLabel: formatSubscriptionField(cycleLabel === "—" ? null : cycleLabel),
    inTrial,
    inGrace,
    isPastDue,
    cycleStartLabel: formatSubscriptionField(cycleStartLabel === "—" ? null : cycleStartLabel),
    cycleEndLabel: formatSubscriptionField(cycleEndLabel === "—" ? null : cycleEndLabel),
    renewalLabel: formatSubscriptionField(renewalLabel === "—" ? null : renewalLabel),
    daysRemainingLabel:
      daysRemaining != null ? `${daysRemaining} dias` : "Não informado",
    consumptionAvailable: consumption.available,
    consumptionCurrentLabel: consumption.currentLabel,
    consumptionLimitLabel: consumption.limitLabel,
    consumptionPercentLabel: consumption.percentLabel,
    consumptionSummaryLabel: consumption.summaryLabel,
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function isSellerToolboxSubscriptionEmpty({ listPreview = null, detail = null }) {
  const subscription = detail?.subscription ?? null;
  if (subscription && typeof subscription === "object" && Object.keys(subscription).length > 0) {
    return false;
  }

  if (listPreview?.plan_key) return false;
  if (listPreview?.plano && listPreview.plano !== "—") return false;
  if (listPreview?.subscription_status) return false;
  if (listPreview?.in_trial || listPreview?.in_grace || listPreview?.is_past_due) return false;

  return true;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState?: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("./sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 * @returns {SellerToolboxSubscriptionPanelState}
 */
export function resolveSellerToolboxSubscriptionPanelState({
  sellerId = null,
  listPreview = null,
  detail = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";

  if (isSellerToolboxSubscriptionEmpty({ listPreview, detail })) return "empty";
  return "loaded";
}

/**
 * @param {"status" | "trial" | "grace" | "past_due"} kind
 */
export function sellerToolboxSubscriptionBadgeClassName(kind) {
  const base = "seller-toolbox-subscription-badge dc-seller-pill";
  if (kind === "trial") return `${base} dc-seller-pill--status-muted`;
  if (kind === "grace" || kind === "past_due") return `${base} dc-seller-pill--health-warn`;
  return `${base} dc-seller-pill--status-active`;
}
