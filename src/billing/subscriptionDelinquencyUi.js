import { formatBillingDate } from "./billingFormatters";

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function shouldShowDelinquencyNotice(subscription, access) {
  const status = String(subscription?.delinquency_status || access?.delinquency_status || "none").toLowerCase();
  return status === "grace" || status === "suspended";
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function resolveDelinquencyGraceEndLabel(subscription, access) {
  const value = subscription?.grace_period_ends_at ?? access?.grace_period_ends_at;
  return formatBillingDate(value);
}

/**
 * @param {Record<string, unknown> | null | undefined} payload
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function resolveOverdueInvoiceUrl(payload, subscription, access) {
  const direct = payload?.overdue_invoice_url;
  if (typeof direct === "string" && direct.trim() !== "") return direct.trim();
  const fromSubscription = subscription?.overdue_invoice_url;
  if (typeof fromSubscription === "string" && fromSubscription.trim() !== "") return fromSubscription.trim();
  const fromAccess = access?.overdue_invoice_url;
  if (typeof fromAccess === "string" && fromAccess.trim() !== "") return fromAccess.trim();
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function resolveDelinquencyNoticeCopy(subscription, access) {
  const status = String(subscription?.delinquency_status || access?.delinquency_status || "none").toLowerCase();
  const graceEndsLabel = resolveDelinquencyGraceEndLabel(subscription, access);
  if (status === "grace") {
    return {
      title: "Cobrança vencida",
      message: `Identificamos uma cobrança em atraso. Seu acesso continua liberado até ${graceEndsLabel}, enquanto você regulariza o pagamento.`,
    };
  }
  if (status === "suspended") {
    return {
      title: "Acesso suspenso por inadimplência",
      message: "O prazo de tolerância terminou. Regularize o pagamento para reativar os recursos premium.",
    };
  }
  return null;
}
