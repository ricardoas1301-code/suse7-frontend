import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../../sellerToolboxOperationalLog";
import { executeSubscriptionOperation } from "../../subscription/sellerToolboxSubscriptionOperationExecutor";
import { getSellerToolboxSubscriptionOperationConfig } from "../../subscription/sellerToolboxSubscriptionOperationModel";
import {
  resolveSalesSyncPanelState,
  SALES_SYNC_DEFAULT_MOCK_SALE_ID,
  validateSalesSyncSaleId,
} from "./salesSyncModel";
import { SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID } from "./sellerToolboxSearchSaleOperation";

/** @typedef {import("./salesSyncModel").SalesSyncViewModel} SalesSyncViewModel */
/** @typedef {import("./salesSyncModel").SalesSyncSearchState} SalesSyncSearchState */

/**
 * @typedef {{
 *   panelState: import("./salesSyncModel").SalesSyncSearchState | "loaded" | "empty" | "error" | "loading";
 *   searchState: SalesSyncSearchState;
 *   searchQuery: string;
 *   sale: SalesSyncViewModel | null;
 *   lastSearchedAt: string | null;
 *   searchError: string;
 *   searchSale: (saleId?: string) => Promise<boolean>;
 *   setSearchQuery: (query: string) => void;
 *   applySalesSyncSearchResult: (result: Record<string, unknown>) => void;
 *   applySalesReimportResult: (result: Record<string, unknown>) => void;
 *   applySalesFinancialRecalculateResult: (result: Record<string, unknown>) => void;
 *   applySalesCustomerReprocessResult: (result: Record<string, unknown>) => void;
 *   resetSalesSync: () => void;
 * }} SalesSyncViewValue
 */

/** @type {import("react").Context<SalesSyncViewValue | null>} */
const SalesSyncViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialSalesSyncState() {
  return {
    searchQuery: SALES_SYNC_DEFAULT_MOCK_SALE_ID,
    searchState: /** @type {SalesSyncSearchState} */ ("idle"),
    sale: /** @type {SalesSyncViewModel | null} */ (null),
    lastSearchedAt: /** @type {string | null} */ (null),
    searchError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SalesSyncViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [syncState, setSyncState] = useState(createInitialSalesSyncState);

  useEffect(() => {
    setSyncState(createInitialSalesSyncState());
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveSalesSyncPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applySalesSyncSearchResult = useCallback((result) => {
    const sale = result?.sale;
    if (!sale || typeof sale !== "object") return;

    setSyncState((current) => ({
      ...current,
      searchState: "loaded",
      sale: /** @type {SalesSyncViewModel} */ (sale),
      lastSearchedAt:
        typeof result.searchedAt === "string" && result.searchedAt
          ? result.searchedAt
          : new Date().toISOString(),
      searchError: "",
    }));
  }, []);

  const applySalesReimportResult = useCallback((result) => {
    const reimportedAt =
      typeof result.reimportedAt === "string" && result.reimportedAt
        ? result.reimportedAt
        : new Date().toISOString();

    setSyncState((current) => {
      if (!current.sale) return current;
      return {
        ...current,
        sale: {
          ...current.sale,
          lastSyncAt: reimportedAt,
        },
      };
    });
  }, []);

  const applySalesFinancialRecalculateResult = useCallback((result) => {
    setSyncState((current) => {
      if (!current.sale) return current;
      const newNetAmount = Number(result.newNetAmount);
      return {
        ...current,
        sale: {
          ...current.sale,
          netAmount: Number.isFinite(newNetAmount) ? newNetAmount : current.sale.netAmount,
          financialStatus:
            typeof result.financialStatus === "string"
              ? /** @type {SalesSyncViewModel["financialStatus"]} */ (result.financialStatus)
              : current.sale.financialStatus,
        },
      };
    });
  }, []);

  const applySalesCustomerReprocessResult = useCallback((result) => {
    setSyncState((current) => {
      if (!current.sale) return current;
      return {
        ...current,
        sale: {
          ...current.sale,
          customerStatus:
            typeof result.customerStatus === "string"
              ? /** @type {SalesSyncViewModel["customerStatus"]} */ (result.customerStatus)
              : "processed",
        },
      };
    });
  }, []);

  const searchSale = useCallback(
    async (inputSaleId) => {
      const validation = validateSalesSyncSaleId(inputSaleId ?? syncState.searchQuery);
      if (!validation.isValid) {
        setSyncState((current) => ({
          ...current,
          searchQuery: validation.saleId,
          searchState: "idle",
          searchError: validation.errorMessage,
        }));
        return false;
      }

      if (!sellerId) return false;

      const config = getSellerToolboxSubscriptionOperationConfig(SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID);
      if (!config) return false;

      setSyncState((current) => ({
        ...current,
        searchQuery: validation.saleId,
        searchState: "loading",
        searchError: "",
      }));

      const metadata = {
        sellerId,
        saleId: validation.saleId,
      };

      const result = await executeSubscriptionOperation({
        actionId: SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID,
        sellerId,
        reason: "",
        metadata,
        execute: (context) =>
          config.handler({
            ...context,
            saleId: validation.saleId,
          }),
        onSuccess: (data) => {
          applySalesSyncSearchResult(data);
          logOperation({
            event: config.operationalLog.event,
            category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
            metadata: config.operationalLog.buildMetadata(data, 0, SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID, metadata),
          });
        },
        onError: () => {
          setSyncState((current) => ({
            ...current,
            searchState: "error",
            sale: null,
            searchError: "Não foi possível buscar a venda. Tente novamente.",
          }));
        },
      });

      if (!result.success) {
        if (result.error?.code === "INVALID_REASON") return false;
        setSyncState((current) => ({
          ...current,
          searchState: "error",
          sale: null,
        }));
        return false;
      }

      return true;
    },
    [sellerId, syncState.searchQuery, applySalesSyncSearchResult, logOperation],
  );

  const setSearchQuery = useCallback((query) => {
    setSyncState((current) => ({
      ...current,
      searchQuery: String(query ?? ""),
      searchError: "",
    }));
  }, []);

  const resetSalesSync = useCallback(() => {
    setSyncState(createInitialSalesSyncState());
  }, []);

  const stateRef = useRef(syncState);
  stateRef.current = syncState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_SALES_SYNC__ = {
      get: () => stateRef.current,
      search: (saleId) => searchSale(saleId),
      reset: () => resetSalesSync(),
    };
  }, [searchSale, resetSalesSync]);

  const value = useMemo(
    () => ({
      panelState,
      searchState: syncState.searchState,
      searchQuery: syncState.searchQuery,
      sale: syncState.sale,
      lastSearchedAt: syncState.lastSearchedAt,
      searchError: syncState.searchError,
      searchSale,
      setSearchQuery,
      applySalesSyncSearchResult,
      applySalesReimportResult,
      applySalesFinancialRecalculateResult,
      applySalesCustomerReprocessResult,
      resetSalesSync,
    }),
    [
      panelState,
      syncState,
      searchSale,
      setSearchQuery,
      applySalesSyncSearchResult,
      applySalesReimportResult,
      applySalesFinancialRecalculateResult,
      applySalesCustomerReprocessResult,
      resetSalesSync,
    ],
  );

  return <SalesSyncViewContext.Provider value={value}>{children}</SalesSyncViewContext.Provider>;
}

export function useSalesSyncView() {
  const context = useContext(SalesSyncViewContext);
  if (!context) {
    throw new Error("useSalesSyncView must be used within SalesSyncViewProvider");
  }
  return context;
}
