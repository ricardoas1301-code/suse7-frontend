// ======================================================================
// Fase 3.0.2+3.0.3 — apresentação visual (contratos do backend, sem regras)
// ======================================================================

import {
  BILLING_TIMELINE_S7_ICONS,
  formatEventSourceLabel,
  formatFriendlyReferenceId,
  resolveTimelineImportance,
} from "./billingTimelineUi.js";

const REVENUE_HEALTH_PRESENTATION = {
  HEALTHY: {
    title: "Saúde financeira em dia",
    description: "Sua assinatura está regular. Cobranças e renovações seguem o fluxo normal.",
    insight: "Seu histórico financeiro está saudável.",
    recommendation: "Os pagamentos estão sendo processados normalmente.",
    badgeClass: "success",
    actionHint: null,
  },
  WARNING: {
    title: "Atenção à renovação",
    description: "Há uma cobrança ou renovação que merece sua atenção em breve.",
    insight: "Existe um ponto de atenção no ciclo financeiro.",
    recommendation: "Revise cobranças pendentes ou atualize a forma de pagamento.",
    badgeClass: "warning",
    actionHint: null,
  },
  RISK: {
    title: "Risco de interrupção",
    description: "Sua assinatura está em período de tolerância. Regularize para evitar bloqueio.",
    insight: "Sua assinatura está em período sensível.",
    recommendation: "Quite a cobrança em aberto o quanto antes para manter o acesso.",
    badgeClass: "warning",
    actionHint: "Quite a cobrança em aberto o quanto antes.",
  },
  CRITICAL: {
    title: "Situação crítica",
    description: "Há inadimplência ou suspensão ativa. Ação imediata é recomendada.",
    insight: "Há bloqueio ou risco imediato no acesso.",
    recommendation: "Regularize o pagamento para reativar o acesso completo.",
    badgeClass: "danger",
    actionHint: "Regularize o pagamento para reativar o acesso completo.",
  },
};

/** Labels visuais — valor técnico (`health_level`) permanece inalterado na API. */
export const REVENUE_HEALTH_LEVEL_LABELS = {
  HEALTHY: "SAUDÁVEL",
  WARNING: "ATENÇÃO",
  RISK: "ATENÇÃO",
  CRITICAL: "CRÍTICA",
};

/**
 * @param {unknown} level
 */
export function resolveRevenueHealthLevelLabel(level) {
  const key = String(level ?? "HEALTHY").trim().toUpperCase();
  return REVENUE_HEALTH_LEVEL_LABELS[key] ?? REVENUE_HEALTH_LEVEL_LABELS.HEALTHY;
}

const TIMELINE_EVENT_PRESENTATION = {
  PAYMENT_GENERATED: { icon: "payment", defaultTitle: "Cobrança gerada", defaultSummary: "Uma nova cobrança foi registrada." },
  PAYMENT_CONFIRMED: { icon: "success", defaultTitle: "Pagamento confirmado", defaultSummary: "Pagamento confirmado com sucesso." },
  PAYMENT_FAILED: { icon: "danger", defaultTitle: "Falha no pagamento", defaultSummary: "A cobrança não foi confirmada no prazo." },
  RENEWAL_STARTED: { icon: "renewal", defaultTitle: "Renovação iniciada", defaultSummary: "Ciclo de renovação em andamento." },
  RENEWAL_COMPLETED: { icon: "renewal", defaultTitle: "Renovação concluída", defaultSummary: "Renovação quitada com sucesso." },
  ENTERED_GRACE: { icon: "grace", defaultTitle: "Período de tolerância", defaultSummary: "Assinatura entrou em tolerância." },
  SUSPENDED: { icon: "suspended", defaultTitle: "Assinatura suspensa", defaultSummary: "Acesso restrito por inadimplência." },
  REACTIVATED: { icon: "reactivated", defaultTitle: "Assinatura reativada", defaultSummary: "Acesso regularizado após pagamento." },
  PLAN_CHANGED: { icon: "plan", defaultTitle: "Plano alterado", defaultSummary: "Mudança de plano registrada." },
  SUBSCRIPTION_CREATED: { icon: "plan", defaultTitle: "Assinatura criada", defaultSummary: "Nova assinatura registrada." },
  LIMIT_REACHED: { icon: "warning", defaultTitle: "Limite atingido", defaultSummary: "Limite do plano foi atingido." },
};

const SEVERITY_BADGE = {
  info: { label: "Informativo", className: "info" },
  warning: { label: "Atenção", className: "warning" },
  danger: { label: "Crítico", className: "danger" },
  critical: { label: "Crítico", className: "danger" },
};

const NOTIFICATION_TEMPLATE_PRESENTATION = {
  "payment.confirmed": { icon: "success", category: "Pagamento" },
  "payment.failed": { icon: "danger", category: "Pagamento" },
  "payment.generated": { icon: "payment", category: "Pagamento" },
  "renewal.reminder_3_days": { icon: "renewal", category: "Renovação" },
  "renewal.reminder_2_days": { icon: "renewal", category: "Renovação" },
  "renewal.reminder_1_day": { icon: "renewal", category: "Renovação" },
  "renewal.due_today": { icon: "renewal", category: "Renovação" },
  "grace.started": { icon: "grace", category: "Tolerância" },
  "subscription.suspended": { icon: "suspended", category: "Suspensão" },
  "plan.changed": { icon: "plan", category: "Plano" },
  "limit.reached": { icon: "warning", category: "Uso" },
};

/**
 * @param {unknown} value
 */
function asTrimmedString(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * @param {unknown} value
 */
export function formatBillingDateTime(value) {
  const raw = asTrimmedString(value);
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * @param {unknown} payload
 */
const REVENUE_HEALTH_FALLBACK = {
  level: "HEALTHY",
  levelLabel: REVENUE_HEALTH_LEVEL_LABELS.HEALTHY,
  score: null,
  title: "Saúde financeira",
  description: "Não foi possível calcular o score agora. Consulte cobranças e timeline abaixo.",
  insight: "Informação temporariamente indisponível.",
  recommendation: "Atualize a página em instantes ou verifique seus pagamentos recentes.",
  badgeClass: "success",
  actionHint: null,
  factors: [],
  computedAtLabel: null,
  subscriptionStatus: null,
  delinquencyStatus: null,
  renewalStatus: null,
  s7Icon: "info",
  unavailable: true,
};

export function normalizeRevenueHealth(payload) {
  const health = payload?.revenue_health ?? payload;
  if (!health || typeof health !== "object") return { ...REVENUE_HEALTH_FALLBACK };
  const row = /** @type {Record<string, unknown>} */ (health);
  const level = String(row.health_level ?? "HEALTHY").toUpperCase();
  const preset = REVENUE_HEALTH_PRESENTATION[level] ?? REVENUE_HEALTH_PRESENTATION.HEALTHY;
  const score = Number(row.health_score);
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;

  return {
    level,
    levelLabel: resolveRevenueHealthLevelLabel(level),
    score: safeScore,
    title: preset.title,
    description: preset.description,
    insight: preset.insight,
    recommendation: preset.recommendation,
    badgeClass: preset.badgeClass,
    actionHint: preset.actionHint,
    factors: Array.isArray(row.factors) ? row.factors.map(String) : [],
    computedAtLabel: formatBillingDateTime(row.computed_at),
    subscriptionStatus: asTrimmedString(row.subscription_status),
    delinquencyStatus: asTrimmedString(row.delinquency_status),
    renewalStatus: asTrimmedString(row.renewal_status),
    s7Icon:
      level === "CRITICAL"
        ? "billing_alert"
        : level === "HEALTHY"
          ? "billing_check"
          : "billing_clock",
    unavailable: false,
  };
}

/**
 * @param {unknown} payload
 */
function readPayloadObject(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? /** @type {Record<string, unknown>} */ (payload)
    : {};
}

/**
 * @param {unknown} event
 */
export function normalizeTimelineEvent(event) {
  if (!event || typeof event !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (event);
  const id = row.id != null ? String(row.id) : "";
  if (!id) return null;

  const eventType = String(row.event_type ?? "").toUpperCase();
  const preset = TIMELINE_EVENT_PRESENTATION[eventType] ?? {
    icon: "info",
    defaultTitle: "Evento financeiro",
    defaultSummary: "Atualização registrada na sua assinatura.",
  };
  const severity = String(row.severity ?? "info").toLowerCase();
  const severityBadge = SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.info;
  const payload = readPayloadObject(row.payload);

  /** @type {{ label: string; value: string }[]} */
  const metaLines = [];
  const providerPaymentId = asTrimmedString(payload.provider_payment_id);
  const billingPaymentId = asTrimmedString(payload.billing_payment_id);
  const amount = payload.amount ?? payload.value;
  const method = asTrimmedString(payload.payment_method ?? payload.billingType);

  if (providerPaymentId) metaLines.push({ label: "Cobrança", value: providerPaymentId });
  else if (billingPaymentId) metaLines.push({ label: "Pagamento", value: billingPaymentId });
  if (amount != null && amount !== "") {
    const num = Number(amount);
    metaLines.push({
      label: "Valor",
      value: Number.isFinite(num)
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
        : String(amount),
    });
  }
  if (method) metaLines.push({ label: "Método", value: method });

  const occurredAtIso = asTrimmedString(row.occurred_at) ?? asTrimmedString(row.created_at) ?? "";
  const correlationId = asTrimmedString(row.correlation_id);
  const paymentId = row.payment_id != null ? String(row.payment_id) : null;
  const eventSource = asTrimmedString(row.event_source);

  /** @type {{ label: string; value: string }[]} */
  const detailLines = [
    { label: "Referência do evento", value: formatFriendlyReferenceId(correlationId ?? id) },
    { label: "Pagamento interno", value: formatFriendlyReferenceId(paymentId ?? billingPaymentId) },
    { label: "Cobrança Asaas", value: formatFriendlyReferenceId(providerPaymentId) },
    { label: "Origem", value: formatEventSourceLabel(eventSource) },
    { label: "Registrado em", value: formatBillingDateTime(occurredAtIso) },
  ].filter((line) => line.value !== "—");

  return {
    id,
    eventType,
    icon: preset.icon,
    s7IconName: BILLING_TIMELINE_S7_ICONS[preset.icon] ?? BILLING_TIMELINE_S7_ICONS.info,
    title: asTrimmedString(row.title) ?? preset.defaultTitle,
    summary: asTrimmedString(row.summary) ?? preset.defaultSummary,
    occurredAtIso,
    occurredAtLabel: formatBillingDateTime(occurredAtIso),
    severity,
    severityLabel: severityBadge.label,
    severityClass: severityBadge.className,
    importance: resolveTimelineImportance(eventType, severity),
    metaLines,
    detailLines,
    eventSource,
    hasDetails: detailLines.length > 0,
  };
}

/**
 * @param {unknown} payload
 */
export function normalizeTimelineList(payload) {
  const list = Array.isArray(payload?.timeline) ? payload.timeline : [];
  return list.map((item) => normalizeTimelineEvent(item)).filter(Boolean);
}

/**
 * @param {unknown} row
 */
export function normalizeBillingNotification(row) {
  if (!row || typeof row !== "object") return null;
  const item = /** @type {Record<string, unknown>} */ (row);
  const id = item.id != null ? String(item.id) : "";
  if (!id) return null;

  const templateKey = asTrimmedString(item.template_key) ?? "unknown";
  const preset = NOTIFICATION_TEMPLATE_PRESENTATION[templateKey] ?? {
    icon: "info",
    category: "Assinatura",
  };

  return {
    id,
    templateKey,
    icon: preset.icon,
    s7IconName: BILLING_TIMELINE_S7_ICONS[preset.icon] ?? BILLING_TIMELINE_S7_ICONS.info,
    category: preset.category,
    title: asTrimmedString(item.rendered_subject) ?? "Notificação financeira",
    body: asTrimmedString(item.rendered_body) ?? "",
    status: asTrimmedString(item.status) ?? "pending",
    createdAtLabel: formatBillingDateTime(item.created_at ?? item.sent_at),
    channel: asTrimmedString(item.channel) ?? "in_app",
  };
}

/**
 * @param {unknown} payload
 */
export function normalizeBillingNotificationList(payload) {
  const list = Array.isArray(payload?.notifications) ? payload.notifications : [];
  return list.map((item) => normalizeBillingNotification(item)).filter(Boolean);
}

/** Amostras DEV (?preview=finance) */
export function buildBillingTimelinePreviewSamples() {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 26 * 3600000).toISOString();
  return [
    normalizeTimelineEvent({
      id: "preview-1",
      event_type: "PAYMENT_CONFIRMED",
      title: "Pagamento confirmado",
      summary: "Recebemos o pagamento do plano Pro.",
      severity: "info",
      occurred_at: now,
      correlation_id: "evt_preview_confirmed",
      event_source: "webhook",
      payload: { provider_payment_id: "pay_preview_001", value: 99.9, billingType: "PIX" },
    }),
    normalizeTimelineEvent({
      id: "preview-2",
      event_type: "PAYMENT_GENERATED",
      title: "Cobrança gerada",
      summary: "Nova cobrança registrada no Asaas.",
      severity: "info",
      occurred_at: yesterday,
      correlation_id: "evt_preview_created",
      event_source: "webhook",
      payload: { provider_payment_id: "pay_preview_001" },
    }),
  ].filter(Boolean);
}

export function buildRevenueHealthPreviewSample() {
  return normalizeRevenueHealth({
    health_level: "HEALTHY",
    health_score: 92,
    factors: ["renewal_window_open"],
    computed_at: new Date().toISOString(),
    subscription_status: "active",
    delinquency_status: "none",
  });
}

export function buildBillingNotificationPreviewSamples() {
  const now = new Date().toISOString();
  return [
    normalizeBillingNotification({
      id: "preview-n1",
      template_key: "payment.confirmed",
      rendered_subject: "Pagamento confirmado",
      rendered_body: "Recebemos o pagamento do plano Pro. Obrigado por continuar no Suse7.",
      status: "sent",
      channel: "in_app",
      created_at: now,
    }),
  ].filter(Boolean);
}
