// ======================================================================
// Ciclo operacional do Resumo Diário (DASH.5)
// Calcula intervalo parcial desde o último encerramento operacional até agora.
// DASH.5.1: considera dias de operação configurados no profile.
// ======================================================================

import { normalizeOperationalWorkingDays } from "./operationalWorkingDays.js";

/** Fallback seguro quando o campo ainda não existe no profile. */
export const DEFAULT_OPERATIONAL_DAY_CLOSES_AT = "18:00";

/** Máximo de dias calendário para buscar o último encerramento operacional válido. */
const MAX_OPERATIONAL_LOOKBACK_DAYS = 21;

/** Timezone padrão para sellers BR quando não houver configuração. */
export const DEFAULT_SELLER_TIMEZONE = "America/Sao_Paulo";

/**
 * @param {unknown} raw
 * @returns {string} HH:mm
 */
export function normalizeOperationalDayClosesAt(raw) {
  const s = String(raw ?? "").trim();
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return DEFAULT_OPERATIONAL_DAY_CLOSES_AT;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return DEFAULT_OPERATIONAL_DAY_CLOSES_AT;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return DEFAULT_OPERATIONAL_DAY_CLOSES_AT;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * @param {Date} date
 * @param {string} timeZone
 */
export function getZonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  /** @param {string} type */
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "0";
  const hourRaw = get("hour");
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(hourRaw === "24" ? "0" : hourRaw),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/**
 * @param {{ year: number; month: number; day: number; hour?: number; minute?: number; second?: number }} parts
 * @param {string} timeZone
 */
export function zonedDateTimeToUtc(parts, timeZone) {
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const second = parts.second ?? 0;
  let ms = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);

  for (let i = 0; i < 8; i++) {
    const actual = getZonedParts(new Date(ms), timeZone);
    const targetMs = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);
    const actualMs = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const delta = targetMs - actualMs;
    if (delta === 0) break;
    ms += delta;
  }

  return new Date(ms);
}

/**
 * @param {{ year: number; month: number; day: number }} dateParts
 * @param {number} deltaDays
 * @param {string} timeZone
 */
export function addDaysInTimeZone(dateParts, deltaDays, timeZone) {
  const anchor = zonedDateTimeToUtc({ ...dateParts, hour: 12, minute: 0, second: 0 }, timeZone);
  const shifted = new Date(anchor.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  const p = getZonedParts(shifted, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

/**
 * @param {Date} date
 * @param {string} timeZone
 */
export function formatCompactOperationalLabel(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/**
 * @param {{ year: number; month: number; day: number }} dateParts
 * @param {string} timeZone
 * @returns {number} 0=domingo … 6=sábado
 */
export function getWeekdayInTimeZone(dateParts, timeZone) {
  const anchor = zonedDateTimeToUtc({ ...dateParts, hour: 12, minute: 0, second: 0 }, timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(anchor);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/**
 * Último encerramento operacional válido (<= agora) em dia de operação.
 * @param {Date} now
 * @param {string} closesAt
 * @param {string} timezone
 * @param {unknown} workingDays
 */
export function resolveLastOperationalCloseAt(now, closesAt, timezone, workingDays) {
  const activeDays = new Set(normalizeOperationalWorkingDays(workingDays));
  const [closeHour, closeMinute] = closesAt.split(":").map(Number);
  const nowParts = getZonedParts(now, timezone);
  const todayParts = { year: nowParts.year, month: nowParts.month, day: nowParts.day };

  for (let offset = 0; offset <= MAX_OPERATIONAL_LOOKBACK_DAYS; offset += 1) {
    const dateParts = offset === 0 ? todayParts : addDaysInTimeZone(todayParts, -offset, timezone);
    if (!activeDays.has(getWeekdayInTimeZone(dateParts, timezone))) continue;

    const closeInstant = zonedDateTimeToUtc(
      {
        ...dateParts,
        hour: closeHour,
        minute: closeMinute,
        second: 0,
      },
      timezone,
    );

    if (closeInstant.getTime() <= now.getTime()) {
      return closeInstant;
    }
  }

  const yesterday = addDaysInTimeZone(todayParts, -1, timezone);
  return zonedDateTimeToUtc(
    {
      ...yesterday,
      hour: closeHour,
      minute: closeMinute,
      second: 0,
    },
    timezone,
  );
}

/**
 * @param {{
 *   now?: Date;
 *   closesAt?: string;
 *   timezone?: string;
 *   workingDays?: unknown;
 * }} [input]
 */
export function resolveOperationalDayCycle(input = {}) {
  const now = input.now instanceof Date ? input.now : new Date();
  const closesAt = normalizeOperationalDayClosesAt(input.closesAt);
  const timezone =
    input.timezone != null && String(input.timezone).trim() !== ""
      ? String(input.timezone).trim()
      : DEFAULT_SELLER_TIMEZONE;
  const workingDays = normalizeOperationalWorkingDays(input.workingDays);

  const cycleStart = resolveLastOperationalCloseAt(now, closesAt, timezone, workingDays);
  const cycleEnd = now;
  const labelCompact = `${formatCompactOperationalLabel(cycleStart, timezone)} – ${formatCompactOperationalLabel(cycleEnd, timezone)}`;

  return {
    mode: "operational_cycle",
    timezone,
    closesAt,
    workingDays,
    startAt: cycleStart,
    endAt: cycleEnd,
    startDatetimeIso: cycleStart.toISOString(),
    endDatetimeIso: cycleEnd.toISOString(),
    labelCompact,
    isPartial: true,
  };
}
