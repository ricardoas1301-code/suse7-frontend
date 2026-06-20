// ======================================================================
// Ciclo operacional do Resumo Diário (DASH.5)
// Calcula intervalo parcial desde o último encerramento operacional até agora.
// ======================================================================

/** Fallback seguro quando o campo ainda não existe no profile. */
export const DEFAULT_OPERATIONAL_DAY_CLOSES_AT = "18:00";

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
 * @param {{
 *   now?: Date;
 *   closesAt?: string;
 *   timezone?: string;
 * }} [input]
 */
export function resolveOperationalDayCycle(input = {}) {
  const now = input.now instanceof Date ? input.now : new Date();
  const closesAt = normalizeOperationalDayClosesAt(input.closesAt);
  const timezone =
    input.timezone != null && String(input.timezone).trim() !== ""
      ? String(input.timezone).trim()
      : DEFAULT_SELLER_TIMEZONE;

  const [closeHour, closeMinute] = closesAt.split(":").map(Number);
  const nowParts = getZonedParts(now, timezone);

  const todayClose = zonedDateTimeToUtc(
    {
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day,
      hour: closeHour,
      minute: closeMinute,
      second: 0,
    },
    timezone,
  );

  let cycleStart;
  if (now.getTime() >= todayClose.getTime()) {
    cycleStart = todayClose;
  } else {
    const yesterday = addDaysInTimeZone(
      { year: nowParts.year, month: nowParts.month, day: nowParts.day },
      -1,
      timezone,
    );
    cycleStart = zonedDateTimeToUtc(
      {
        ...yesterday,
        hour: closeHour,
        minute: closeMinute,
        second: 0,
      },
      timezone,
    );
  }

  const cycleEnd = now;
  const labelCompact = `${formatCompactOperationalLabel(cycleStart, timezone)} – ${formatCompactOperationalLabel(cycleEnd, timezone)}`;

  return {
    mode: "operational_cycle",
    timezone,
    closesAt,
    startAt: cycleStart,
    endAt: cycleEnd,
    startDatetimeIso: cycleStart.toISOString(),
    endDatetimeIso: cycleEnd.toISOString(),
    labelCompact,
    isPartial: true,
  };
}
