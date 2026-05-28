// ======================================================================

// Estado central dos filtros da página Vendas (fonte única de verdade).

// ======================================================================



import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {

  buildVendasExecutiveApiParams,

  formatVendasPeriodSummaryLabel,

  resolveVendasPeriodRange,

} from "./vendasFiltersPeriod";

import { VENDAS_FILTERS_EXPANDED_STORAGE_KEY, VENDAS_MARKETPLACE_OPTIONS } from "./vendasFiltersConstants";



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

 * }>} */

const VendasFiltersContext = createContext(null);



function readExpandedFromSession() {

  try {

    return sessionStorage.getItem(VENDAS_FILTERS_EXPANDED_STORAGE_KEY) === "1";

  } catch {

    return false;

  }

}



function writeExpandedToSession(expanded) {

  try {

    sessionStorage.setItem(VENDAS_FILTERS_EXPANDED_STORAGE_KEY, expanded ? "1" : "0");

  } catch {

    /* ignore */

  }

}



const defaultMonthRange = resolveVendasPeriodRange("this_month");



/** @param {{ children: import("react").ReactNode }} props */

export function VendasFiltersProvider({ children }) {

  const [expanded, setExpandedState] = useState(() => readExpandedFromSession());

  const [periodPreset, setPeriodPresetState] = useState(/** @type {VendasPeriodPresetUi} */ ("this_month"));

  const [startDate, setStartDate] = useState(defaultMonthRange.startDate);

  const [endDate, setEndDate] = useState(defaultMonthRange.endDate);

  const [marketplace, setMarketplace] = useState("");

  const [marketplaceAccountId, setMarketplaceAccountId] = useState("");



  const setExpanded = useCallback((value) => {

    setExpandedState(Boolean(value));

    writeExpandedToSession(Boolean(value));

  }, []);



  const toggleExpanded = useCallback(() => {

    setExpandedState((prev) => {

      const next = !prev;

      writeExpandedToSession(next);

      return next;

    });

  }, []);



  const applyPeriod = useCallback(

    /** @param {{ preset: VendasPeriodPresetUi; startDate: string; endDate: string }} payload */ (

      payload,

    ) => {

      const start = String(payload.startDate ?? "").trim();

      const end = String(payload.endDate ?? "").trim();

      if (!start || !end) return;

      setPeriodPresetState(payload.preset);

      setStartDate(start);

      setEndDate(end);

    },

    [],

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



  const value = useMemo(

    () => ({

      filters,

      periodRange,

      executiveApiParams,

      periodSummaryLabel,

      filtersSummaryLabel,

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

      setExpanded,

      toggleExpanded,

      applyPeriod,

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


