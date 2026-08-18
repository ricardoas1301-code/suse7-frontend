// ======================================================================

// Estado central dos filtros da página Vendas (fonte única de verdade).

// ======================================================================



import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {

  buildVendasExecutiveApiParams,

  formatVendasPeriodSummaryLabel,
  getDefaultLast30DaysRange,

  resolveVendasPeriodRange,

} from "./vendasFiltersPeriod";

import {
  DASHBOARD_FILTERS_EXPANDED_STORAGE_KEY,
  VENDAS_FILTERS_EXPANDED_STORAGE_KEY,
  VENDAS_MARKETPLACE_OPTIONS,
} from "./vendasFiltersConstants";



/** @typedef {import("./vendasFiltersPeriod.js").VendasPeriodPresetUi} VendasPeriodPresetUi */



/**

 * @typedef {{

 *   expanded: boolean;

 *   periodPreset: VendasPeriodPresetUi;

 *   startDate: string;

 *   endDate: string;

 *   marketplace: string;

 *   marketplaceAccountId: string;

 * }} VendasFiltersState

 */



/** @type {React.Context<null | {

 *   filters: VendasFiltersState;

 *   periodRange: ReturnType<typeof resolveVendasPeriodRange>;

 *   executiveApiParams: import("../../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams;

 *   periodSummaryLabel: string;

 *   filtersSummaryLabel: string;

 *   setExpanded: (value: boolean) => void;

 *   toggleExpanded: () => void;

 *   applyPeriod: (payload: { preset: VendasPeriodPresetUi; startDate: string; endDate: string }) => void;

 *   setMarketplace: (marketplace: string) => void;
 *   setMarketplaceAccountId: (accountId: string) => void;
 *   dashboardFilterParams: { periodStart: string; periodEnd: string; marketplaceAccountId: string | null };
 *   dashboardFilterTouched: boolean;
 * }>} */
const VendasFiltersContext = createContext(null);

/** @typedef {"vendas" | "dashboard"} VendasFiltersScope */

function readExpandedFromSession(storageKey) {
  try {
    return sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function readInitialFiltersExpanded(scope) {
  if (scope === "dashboard") {
    return readExpandedFromSession(DASHBOARD_FILTERS_EXPANDED_STORAGE_KEY);
  }
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
    return false;
  }
  return readExpandedFromSession(VENDAS_FILTERS_EXPANDED_STORAGE_KEY);
}

function writeExpandedToSession(storageKey, expanded) {
  try {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}



const defaultLast30Range = getDefaultLast30DaysRange();



/** @param {{ children: import("react").ReactNode; scope?: VendasFiltersScope }} props */
export function VendasFiltersProvider({ children, scope = "vendas" }) {
  const expandedStorageKey =
    scope === "dashboard" ? DASHBOARD_FILTERS_EXPANDED_STORAGE_KEY : VENDAS_FILTERS_EXPANDED_STORAGE_KEY;

  const [expanded, setExpandedState] = useState(() => readInitialFiltersExpanded(scope));

  const [periodPreset, setPeriodPresetState] = useState(/** @type {VendasPeriodPresetUi} */ ("last_30_days"));

  const [startDate, setStartDate] = useState(defaultLast30Range.startDate);

  const [endDate, setEndDate] = useState(defaultLast30Range.endDate);

  const [marketplace, setMarketplaceState] = useState("");

  const [marketplaceAccountId, setMarketplaceAccountIdState] = useState("");

  /** DASH.6B — distingue estado inicial automático vs filtro aplicado manualmente no Dashboard. */
  const [dashboardFilterTouched, setDashboardFilterTouched] = useState(false);

  const markDashboardFilterTouched = useCallback(() => {
    if (scope === "dashboard") {
      setDashboardFilterTouched(true);
    }
  }, [scope]);



  const setExpanded = useCallback((value) => {
    setExpandedState(Boolean(value));
    writeExpandedToSession(expandedStorageKey, Boolean(value));
  }, [expandedStorageKey]);

  const toggleExpanded = useCallback(() => {
    setExpandedState((prev) => {
      const next = !prev;
      writeExpandedToSession(expandedStorageKey, next);
      return next;
    });
  }, [expandedStorageKey]);



  const applyPeriod = useCallback(

    /** @param {{ preset: VendasPeriodPresetUi; startDate: string; endDate: string }} payload */ (

      payload,

    ) => {

      const start = String(payload.startDate ?? "").trim();

      const end = String(payload.endDate ?? "").trim();

      if (!start || !end) return;

      setPeriodPresetState(payload.preset);

      setStartDate(start);

      setStartDate(start);

      setEndDate(end);

      markDashboardFilterTouched();

    },

    [markDashboardFilterTouched],

  );

  const setMarketplaceAccountId = useCallback(
    (accountId) => {
      setMarketplaceAccountIdState(String(accountId ?? ""));
      markDashboardFilterTouched();
    },
    [markDashboardFilterTouched],
  );

  const setMarketplace = useCallback(
    (value) => {
      setMarketplaceState(String(value ?? ""));
      markDashboardFilterTouched();
    },
    [markDashboardFilterTouched],
  );



  const filters = useMemo(

    () => ({

      expanded,

      periodPreset,

      startDate,

      endDate,

      marketplace,

      marketplaceAccountId,

    }),

    [expanded, periodPreset, startDate, endDate, marketplace, marketplaceAccountId],

  );



  const periodRange = useMemo(

    () => resolveVendasPeriodRange(periodPreset, startDate, endDate),

    [periodPreset, startDate, endDate],

  );



  const executiveApiParams = useMemo(

    () =>

      buildVendasExecutiveApiParams({

        periodPreset,

        startDate,

        endDate,

        marketplace,

        marketplaceAccountId,

        rankingLimit: 10,

      }),

    [periodPreset, startDate, endDate, marketplace, marketplaceAccountId],

  );



  const periodSummaryLabel = useMemo(

    () => formatVendasPeriodSummaryLabel(periodPreset, periodRange.startDate, periodRange.endDate),

    [periodPreset, periodRange.startDate, periodRange.endDate],

  );



  const filtersSummaryLabel = useMemo(() => {

    const mkt =

      VENDAS_MARKETPLACE_OPTIONS.find((o) => o.id === marketplace)?.label ?? "Todos os marketplaces";

    const account = marketplaceAccountId ? "Conta selecionada" : "Todas as contas";

    return [periodSummaryLabel, account, mkt].join(" · ");

  }, [periodSummaryLabel, marketplaceAccountId, marketplace]);

  const dashboardFilterParams = useMemo(
    () => ({
      periodStart: periodRange.startDate,
      periodEnd: periodRange.endDate,
      marketplaceAccountId: marketplaceAccountId ? String(marketplaceAccountId).trim() : null,
    }),
    [periodRange.startDate, periodRange.endDate, marketplaceAccountId],
  );

  const value = useMemo(
    () => ({
      filters,
      periodRange,
      executiveApiParams,
      periodSummaryLabel,
      filtersSummaryLabel,
      dashboardFilterParams,
      dashboardFilterTouched,
      setExpanded,
      toggleExpanded,
      applyPeriod,
      setMarketplace,
      setMarketplaceAccountId,
    }),
    [
      filters,
      periodRange,
      executiveApiParams,
      periodSummaryLabel,
      filtersSummaryLabel,
      dashboardFilterParams,
      dashboardFilterTouched,
      setExpanded,
      toggleExpanded,
      applyPeriod,
      setMarketplace,
      setMarketplaceAccountId,
    ],
  );



  return <VendasFiltersContext.Provider value={value}>{children}</VendasFiltersContext.Provider>;

}



export function useVendasFilters() {

  const ctx = useContext(VendasFiltersContext);

  if (!ctx) {

    throw new Error("useVendasFilters deve ser usado dentro de VendasFiltersProvider.");

  }

  return ctx;

}


