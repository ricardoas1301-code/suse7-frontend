// ======================================================================
// Período — presets e params de API (alinhado a saleExecutivePeriod.js no backend).
// Somente formatação de datas; sem cálculos financeiros.
// ======================================================================

/** @typedef {'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'} VendasPeriodPresetUi */

/**
 * @param {Date} d
 * @returns {string}
 */
export function formatIsoDateOnlyUtc(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string} iso YYYY-MM-DD
 */
export function formatIsoToBrDate(iso) {
  const s = String(iso ?? "").trim();
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

/**
 * @param {string} startIso
 * @param {string} endIso
 */
export function formatVendasOrderDateTriggerLabel(startIso, endIso) {
  const start = formatIsoToBrDate(startIso);
  const end = formatIsoToBrDate(endIso);
  if (!start || !end) return "Data do pedido";
  return `Data do pedido: ${start} até ${end}`;
}

/**
 * Início do dia UTC.
 * @param {Date} [base]
 */
export function utcTodayDateOnly(base = new Date()) {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
}

/**
 * Segunda-feira da semana UTC da data.
 * @param {Date} date
 */
function utcMondayOfWeek(date) {
  const d = new Date(date);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/**
 * Resolve intervalo exibível + params de API para um preset UI.
 * @param {VendasPeriodPresetUi} presetUi
 * @param {string} [customStart] YYYY-MM-DD
 * @param {string} [customEnd] YYYY-MM-DD
 */
export function resolveVendasPeriodRange(presetUi, customStart = "", customEnd = "") {
  const today = utcTodayDateOnly();

  if (presetUi === "custom") {
    const start = String(customStart ?? "").trim();
    const end = String(customEnd ?? "").trim();
    return {
      presetUi,
      apiPreset: "custom",
      startDate: start,
      endDate: end,
    };
  }

  if (presetUi === "today") {
    const iso = formatIsoDateOnlyUtc(today);
    return { presetUi, apiPreset: "today", startDate: iso, endDate: iso };
  }

  if (presetUi === "this_week") {
    const start = utcMondayOfWeek(today);
    return {
      presetUi,
      apiPreset: "custom",
      startDate: formatIsoDateOnlyUtc(start),
      endDate: formatIsoDateOnlyUtc(today),
    };
  }

  if (presetUi === "last_week") {
    const thisMonday = utcMondayOfWeek(today);
    const end = new Date(thisMonday);
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return {
      presetUi,
      apiPreset: "custom",
      startDate: formatIsoDateOnlyUtc(start),
      endDate: formatIsoDateOnlyUtc(end),
    };
  }

  if (presetUi === "last_month") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    return {
      presetUi,
      apiPreset: "custom",
      startDate: formatIsoDateOnlyUtc(start),
      endDate: formatIsoDateOnlyUtc(end),
    };
  }

  // this_month — mês corrente (UTC), contrato backend `month`
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return {
    presetUi,
    apiPreset: "month",
    startDate: formatIsoDateOnlyUtc(start),
    endDate: formatIsoDateOnlyUtc(today),
  };
}

/**
 * @param {{
 *   periodPreset: VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 *   rankingLimit?: number;
 * }} filters
 */
export function buildVendasExecutiveApiParams(filters) {
  const range = resolveVendasPeriodRange(filters.periodPreset, filters.startDate, filters.endDate);

  /** @type {import("../../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams} */
  const params = {
    marketplace: filters.marketplace?.trim() || undefined,
    marketplace_account_id: filters.marketplaceAccountId?.trim() || undefined,
    ranking_limit: filters.rankingLimit ?? 10,
  };

  if (range.apiPreset === "custom") {
    if (range.startDate) params.start_date = range.startDate;
    if (range.endDate) params.end_date = range.endDate;
    params.period_preset = "custom";
  } else {
    params.period_preset = range.apiPreset;
  }

  return params;
}

/**
 * @param {{
 *   periodPreset: VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 * }} filters
 */
export function buildVendasSalesListPeriodQuery(filters) {
  const range = resolveVendasPeriodRange(filters.periodPreset, filters.startDate, filters.endDate);
  const qs = new URLSearchParams();

  if (range.apiPreset === "custom") {
    qs.set("period_preset", "custom");
    if (range.startDate) qs.set("start_date", range.startDate);
    if (range.endDate) qs.set("end_date", range.endDate);
  } else if (range.apiPreset) {
    qs.set("period_preset", range.apiPreset);
  }

  const mkt = filters.marketplace?.trim();
  if (mkt) qs.set("marketplace", mkt);
  const acc = filters.marketplaceAccountId?.trim();
  if (acc) qs.set("marketplace_account_id", acc);

  return qs;
}

/**
 * @param {VendasPeriodPresetUi} presetUi
 * @param {string} startDate
 * @param {string} endDate
 */
export function formatVendasPeriodSummaryLabel(presetUi, startDate, endDate) {
  const labels = {
    today: "Hoje",
    this_week: "Esta semana",
    last_week: "Semana passada",
    this_month: "Este mês",
    last_month: "Mês passado",
    custom: "Período customizado",
  };
  const presetLabel = labels[presetUi] ?? "Período";
  if (startDate && endDate) {
    if (startDate === endDate) return `${presetLabel} · ${formatIsoToBrDate(startDate)}`;
    return `${presetLabel} · ${formatIsoToBrDate(startDate)} – ${formatIsoToBrDate(endDate)}`;
  }
  return presetLabel;
}

/**
 * @param {string} iso
 * @returns {Date | null}
 */
export function parseIsoDateOnlyUtc(iso) {
  const s = String(iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * @param {string} a
 * @param {string} b
 */
export function compareIsoDates(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * @param {string} iso
 * @param {string} start
 * @param {string} end
 */
export function isoInInclusiveRange(iso, start, end) {
  if (!iso || !start || !end) return false;
  return compareIsoDates(iso, start) >= 0 && compareIsoDates(iso, end) <= 0;
}
