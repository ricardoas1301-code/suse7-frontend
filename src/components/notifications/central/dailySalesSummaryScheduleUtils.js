// =============================================================================
// Validação client-side — agendamento Resumo de vendas do dia
// Espelha regras do backend (validateDailySalesSummaryAutomationConfig.js)
// =============================================================================

const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAILY_SALES_SUMMARY_MIN_INTERVAL_MINUTES = 4 * 60;

export const DAILY_SALES_SUMMARY_TIMEZONE = "America/Sao_Paulo";

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export const DEFAULT_DAILY_SALES_SUMMARY_CONFIG = {
  channels: {
    whatsapp: true,
    email: true,
    in_app: true,
    popup: true,
  },
  weekdays: [1, 2, 3, 4, 5],
  times: ["18:00"],
  timezone: DAILY_SALES_SUMMARY_TIMEZONE,
};

/**
 * @param {string} raw
 */
export function isValidDailySalesSummaryTime(raw) {
  return HH_MM_RE.test(String(raw ?? "").trim());
}

/**
 * @param {unknown} raw
 * @returns {number[]}
 */
export function normalizeDailySalesSummaryWeekdays(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const set = new Set();
  for (const item of list) {
    const n = Number(item);
    if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeDailySalesSummaryTimes(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const normalized = [];
  for (const item of list) {
    const t = String(item ?? "").trim();
    if (!isValidDailySalesSummaryTime(t)) continue;
    if (!normalized.includes(t)) normalized.push(t);
  }
  return normalized.sort();
}

/**
 * @param {string} time
 */
function parseDailySalesSummaryTimeToMinutes(time) {
  if (!isValidDailySalesSummaryTime(time)) return null;
  const [hour, minute] = String(time).split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * @param {Record<string, unknown> | null | undefined} config
 */
export function formatDailySalesSummaryScheduleSummary(config) {
  const weekdays = normalizeDailySalesSummaryWeekdays(config?.weekdays);
  const times = normalizeDailySalesSummaryTimes(config?.times);
  if (weekdays.length === 0 || times.length === 0) return null;

  const weekdayLabel =
    weekdays.length === 7
      ? "Todos os dias"
      : weekdays.map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d]).join(", ");

  const timesLabel = times.join(" e ");
  return `${weekdayLabel}\n${timesLabel}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} rule
 */
export function getDailySalesSummaryCardDisplayState(rule) {
  const enabled = rule?.enabled !== false;

  if (!enabled) {
    return {
      badge: "Desativado",
      badgeVariant: "disabled",
      summary: "Notificação desligada",
    };
  }

  const config =
    rule?.config && typeof rule.config === "object"
      ? /** @type {Record<string, unknown>} */ (rule.config)
      : {};

  const weekdays = normalizeDailySalesSummaryWeekdays(config.weekdays);
  const times = normalizeDailySalesSummaryTimes(config.times);
  const scheduleSummary = formatDailySalesSummaryScheduleSummary(config);

  if (weekdays.length > 0 && times.length > 0 && scheduleSummary) {
    return {
      badge: "Regras salvas",
      badgeVariant: "saved",
      summary: scheduleSummary,
    };
  }

  return {
    badge: "Configuração pendente",
    badgeVariant: "pending",
    summary: "Selecione dias e horário de envio",
  };
}

/**
 * @param {{ enabled?: boolean; config?: Record<string, unknown> }} draft
 */
export function validateDailySalesSummaryDraft(draft) {
  const enabled = draft?.enabled !== false;
  const config = draft?.config && typeof draft.config === "object" ? draft.config : {};
  const weekdays = normalizeDailySalesSummaryWeekdays(config.weekdays);
  const times = normalizeDailySalesSummaryTimes(config.times);

  if (!enabled) {
    return { ok: true, config: { ...config, weekdays, times } };
  }

  if (enabled && times.length === 0) {
    return { ok: false, message: "Informe ao menos um horário válido (HH:mm)." };
  }
  if (enabled && weekdays.length === 0) {
    return { ok: false, message: "Selecione ao menos um dia da semana." };
  }

  const rawTimes = Array.isArray(config.times) ? config.times : [];
  for (const t of rawTimes) {
    const s = String(t ?? "").trim();
    if (s && !isValidDailySalesSummaryTime(s)) {
      return { ok: false, message: `Horário inválido: ${s}` };
    }
  }

  const time1 = String(rawTimes[0] ?? "").trim();
  const time2 = String(rawTimes[1] ?? "").trim();
  if (time1 && time2 && time1 === time2) {
    return { ok: false, message: "Os horários não podem ser duplicados." };
  }

  if (times.length > 2) {
    return { ok: false, message: "Máximo de 2 horários por dia." };
  }

  if (times.length === 2) {
    const first = parseDailySalesSummaryTimeToMinutes(times[0]);
    const second = parseDailySalesSummaryTimeToMinutes(times[1]);
    if (
      Number.isInteger(first) &&
      Number.isInteger(second) &&
      Math.abs(second - first) < DAILY_SALES_SUMMARY_MIN_INTERVAL_MINUTES
    ) {
      return {
        ok: false,
        message: "Use no máximo 2 horários com intervalo mínimo de 4 horas entre eles.",
      };
    }
  }

  return { ok: true, config: { ...config, weekdays, times } };
}
