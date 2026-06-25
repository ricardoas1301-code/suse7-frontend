// ======================================================================
// Estado independente dos filtros do Dashboard — Resumo Diário vs Top 10.
// Conta e período por bloco; trocar conta não reseta período.
// ======================================================================

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  getDefaultLast30DaysRange,
  resolveVendasPeriodRange,
} from "../../features/vendas/filters/vendasFiltersPeriod.js";
import {
  DASHBOARD_DAILY_SUMMARY_FILTERS_EXPANDED_KEY,
  DASHBOARD_TOP10_FILTERS_EXPANDED_KEY,
} from "./dashboardBlockFiltersConstants.js";

/** @typedef {import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi} VendasPeriodPresetUi */

/**
 * @typedef {{
 *   periodPreset: VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace: string;
 *   marketplaceAccountId: string;
 * }} DashboardBlockFiltersState
 */

const defaultLast30Range = getDefaultLast30DaysRange();
const defaultTodayRange = resolveVendasPeriodRange("today");

/** @returns {DashboardBlockFiltersState} */
function createInitialDailySummaryFilters() {
  return {
    periodPreset: "today",
    startDate: defaultTodayRange.startDate,
    endDate: defaultTodayRange.endDate,
    marketplace: "",
    marketplaceAccountId: "",
  };
}

/** @returns {DashboardBlockFiltersState} */
function createInitialTop10Filters() {
  return {
    periodPreset: "last_30_days",
    startDate: defaultLast30Range.startDate,
    endDate: defaultLast30Range.endDate,
    marketplace: "",
    marketplaceAccountId: "",
  };
}

function readExpandedFromSession(storageKey) {
  try {
    return sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function writeExpandedToSession(storageKey, expanded) {
  try {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** @type {React.Context<null | {
 *   dailySummaryFilters: DashboardBlockFiltersState;
 *   dailySummaryPeriodTouched: boolean;
 *   dailySummaryFiltersExpanded: boolean;
 *   top10Filters: DashboardBlockFiltersState;
 *   top10PeriodTouched: boolean;
 *   top10FiltersExpanded: boolean;
 *   applyDailySummaryPeriod: (payload: { preset: VendasPeriodPresetUi; startDate: string; endDate: string }) => void;
 *   setDailySummaryAccountId: (accountId: string) => void;
 *   toggleDailySummaryFiltersExpanded: () => void;
 *   applyTop10Period: (payload: { preset: VendasPeriodPresetUi; startDate: string; endDate: string }) => void;
 *   setTop10AccountId: (accountId: string) => void;
 *   toggleTop10FiltersExpanded: () => void;
 * }>} */
const DashboardBlockFiltersContext = createContext(null);

/** @param {{ children: import("react").ReactNode }} props */
export function DashboardBlockFiltersProvider({ children }) {
  const [dailySummaryFilters, setDailySummaryFilters] = useState(createInitialDailySummaryFilters);
  const [dailySummaryPeriodTouched, setDailySummaryPeriodTouched] = useState(false);
  const [dailySummaryFiltersExpanded, setDailySummaryFiltersExpandedState] = useState(() =>
    readExpandedFromSession(DASHBOARD_DAILY_SUMMARY_FILTERS_EXPANDED_KEY),
  );

  const [top10Filters, setTop10Filters] = useState(createInitialTop10Filters);
  const [top10PeriodTouched, setTop10PeriodTouched] = useState(false);
  const [top10FiltersExpanded, setTop10FiltersExpandedState] = useState(() =>
    readExpandedFromSession(DASHBOARD_TOP10_FILTERS_EXPANDED_KEY),
  );

  const applyDailySummaryPeriod = useCallback(
    /** @param {{ preset: VendasPeriodPresetUi; startDate: string; endDate: string }} payload */ (payload) => {
      const start = String(payload.startDate ?? "").trim();
      const end = String(payload.endDate ?? "").trim();
      if (!start || !end) return;
      setDailySummaryFilters((prev) => ({
        ...prev,
        periodPreset: payload.preset,
        startDate: start,
        endDate: end,
      }));
      setDailySummaryPeriodTouched(true);
    },
    [],
  );

  const setDailySummaryAccountId = useCallback((accountId) => {
    setDailySummaryFilters((prev) => ({
      ...prev,
      marketplaceAccountId: String(accountId ?? ""),
    }));
  }, []);

  const toggleDailySummaryFiltersExpanded = useCallback(() => {
    setDailySummaryFiltersExpandedState((prev) => {
      const next = !prev;
      writeExpandedToSession(DASHBOARD_DAILY_SUMMARY_FILTERS_EXPANDED_KEY, next);
      return next;
    });
  }, []);

  const applyTop10Period = useCallback(
    /** @param {{ preset: VendasPeriodPresetUi; startDate: string; endDate: string }} payload */ (payload) => {
      const start = String(payload.startDate ?? "").trim();
      const end = String(payload.endDate ?? "").trim();
      if (!start || !end) return;
      setTop10Filters((prev) => ({
        ...prev,
        periodPreset: payload.preset,
        startDate: start,
        endDate: end,
      }));
      setTop10PeriodTouched(true);
    },
    [],
  );

  const setTop10AccountId = useCallback((accountId) => {
    setTop10Filters((prev) => ({
      ...prev,
      marketplaceAccountId: String(accountId ?? ""),
    }));
  }, []);

  const toggleTop10FiltersExpanded = useCallback(() => {
    setTop10FiltersExpandedState((prev) => {
      const next = !prev;
      writeExpandedToSession(DASHBOARD_TOP10_FILTERS_EXPANDED_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      dailySummaryFilters,
      dailySummaryPeriodTouched,
      dailySummaryFiltersExpanded,
      top10Filters,
      top10PeriodTouched,
      top10FiltersExpanded,
      applyDailySummaryPeriod,
      setDailySummaryAccountId,
      toggleDailySummaryFiltersExpanded,
      applyTop10Period,
      setTop10AccountId,
      toggleTop10FiltersExpanded,
    }),
    [
      dailySummaryFilters,
      dailySummaryPeriodTouched,
      dailySummaryFiltersExpanded,
      top10Filters,
      top10PeriodTouched,
      top10FiltersExpanded,
      applyDailySummaryPeriod,
      setDailySummaryAccountId,
      toggleDailySummaryFiltersExpanded,
      applyTop10Period,
      setTop10AccountId,
      toggleTop10FiltersExpanded,
    ],
  );

  return (
    <DashboardBlockFiltersContext.Provider value={value}>{children}</DashboardBlockFiltersContext.Provider>
  );
}

export function useDashboardBlockFilters() {
  const ctx = useContext(DashboardBlockFiltersContext);
  if (!ctx) {
    throw new Error("useDashboardBlockFilters deve ser usado dentro de DashboardBlockFiltersProvider.");
  }
  return ctx;
}
