// ======================================================================
// Período — presets e params de API (alinhado a saleExecutivePeriod.js no backend).
// Somente formatação de datas; sem cálculos financeiros.
// ======================================================================

/** @typedef {'last_30_days' | 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'} VendasPeriodPresetUi */

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
 * Faixa padrão oficial S7 para Vendas/Top 10.
 * Ex.: hoje 23/06 => início 24/05.
 *
 * @param {Date} [now]
 * @returns {{ preset: "last_30_days"; label: "Últimos 30 dias"; startDate: string; endDate: string }}
 */
export function getDefaultLast30DaysRange(now = new Date()) {
  const today = utcTodayDateOnly(now);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 30);
  return {
    preset: "last_30_days",
    label: "Últimos 30 dias",
    startDate: formatIsoDateOnlyUtc(start),
    endDate: formatIsoDateOnlyUtc(today),
  };
}

/**
 * @param {VendasPeriodPresetUi} presetUi
 */
export function getVendasPeriodPresetLabel(presetUi) {
  const labels = {
    last_30_days: "Últimos 30 dias",
    today: "Hoje",
    this_week: "Esta semana",
    last_week: "Semana passada",
    this_month: "Este mês",
    last_month: "Mês passado",
    custom: "Período customizado",
  };
  return labels[presetUi] ?? "Período";
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

  if (presetUi === "last_30_days") {
    const last30 = getDefaultLast30DaysRange(today);
    return {
      presetUi,
      apiPreset: "custom",
      startDate: last30.startDate,
      endDate: last30.endDate,
    };
  }

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
 * Params de API para ciclo operacional parcial (Resumo Diário sem filtro — DASH.5).
 * @param {{
 *   cycle: import("../../features/dashboard/operationalDayCycle.js").ReturnType<typeof import("../../features/dashboard/operationalDayCycle.js").resolveOperationalDayCycle> | null;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 *   rankingLimit?: number;
 * }} input
 */
export function buildOperationalCycleExecutiveApiParams(input) {
  const cycle = input.cycle;
  /** @type {import("../../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams} */
  const params = {
    marketplace: input.marketplace?.trim() || undefined,
    marketplace_account_id: input.marketplaceAccountId?.trim() || undefined,
    ranking_limit: input.rankingLimit ?? 10,
    period_preset: "operational_cycle",
  };

  if (cycle?.startDatetimeIso) params.start_datetime = cycle.startDatetimeIso;
  if (cycle?.endDatetimeIso) params.end_datetime = cycle.endDatetimeIso;

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
  const presetLabel = getVendasPeriodPresetLabel(presetUi);
  const prefix = presetUi === "last_30_days" ? "Período · últimos 30 dias" : presetLabel;
  if (startDate && endDate) {
    if (startDate === endDate) return `${prefix} · ${formatIsoToBrDate(startDate)}`;
    return `${prefix} · ${formatIsoToBrDate(startDate)} – ${formatIsoToBrDate(endDate)}`;
  }
  return prefix;
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
