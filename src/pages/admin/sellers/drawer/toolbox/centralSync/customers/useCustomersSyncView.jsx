import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../../sellerToolboxOperationalLog";
import { executeSubscriptionOperation } from "../../subscription/sellerToolboxSubscriptionOperationExecutor";
import { getSellerToolboxSubscriptionOperationConfig } from "../../subscription/sellerToolboxSubscriptionOperationModel";
import {
  resolveCustomersSyncPanelState,
  validateCustomersSyncQuery,
} from "./customersSyncModel";
import { SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID } from "./sellerToolboxSearchCustomerOperation";

/** @typedef {import("./customersSyncModel").CustomersSyncViewModel} CustomersSyncViewModel */
/** @typedef {import("./customersSyncModel").CustomersSyncSearchState} CustomersSyncSearchState */

/**
 * @typedef {{
 *   panelState: CustomersSyncSearchState | "loaded" | "empty" | "error" | "loading";
 *   searchState: CustomersSyncSearchState;
 *   query: string;
 *   customer: CustomersSyncViewModel | null;
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   lastSearchedAt: string | null;
 *   searchCustomer: (inputQuery?: string) => Promise<boolean>;
 *   setQuery: (query: string) => void;
 *   applyCustomerOperationResult: (result: Record<string, unknown>) => void;
 *   applyCustomers360ReprocessResult: (result: Record<string, unknown>) => void;
 *   applyCustomersSyncSearchResult: (result: Record<string, unknown>) => void;
 *   resetCustomersSync: () => void;
 * }} CustomersSyncViewValue
 */

/** @type {import("react").Context<CustomersSyncViewValue | null>} */
const CustomersSyncViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialCustomersSyncState() {
  return {
    searchQuery: "",
    searchState: /** @type {CustomersSyncSearchState} */ ("idle"),
    customer: /** @type {CustomersSyncViewModel | null} */ (null),
    searchEmpty: false,
    lastSearchedAt: /** @type {string | null} */ (null),
    searchError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function CustomersSyncViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [syncState, setSyncState] = useState(createInitialCustomersSyncState);

  useEffect(() => {
    setSyncState(createInitialCustomersSyncState());
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveCustomersSyncPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applyCustomersSyncSearchResult = useCallback((result) => {
    const customer = result?.customer;
    const isEmpty = Boolean(result.empty) || customer == null;

    if (isEmpty) {
      setSyncState((current) => ({
        ...current,
        searchState: "empty",
        customer: null,
        searchEmpty: true,
        lastSearchedAt:
          typeof result.searchedAt === "string" && result.searchedAt
            ? result.searchedAt
            : new Date().toISOString(),
        searchError: "",
      }));
      return;
    }

    if (!customer || typeof customer !== "object") return;

    setSyncState((current) => ({
      ...current,
      searchState: "loaded",
      customer: /** @type {CustomersSyncViewModel} */ (customer),
      searchEmpty: false,
      lastSearchedAt:
        typeof result.searchedAt === "string" && result.searchedAt
          ? result.searchedAt
          : new Date().toISOString(),
      searchError: "",
    }));
  }, []);

  const applyCustomerOperationResult = useCallback((result) => {
    if (!result || typeof result !== "object") return;

    setSyncState((current) => {
      if (!current.customer) return current;

      let nextCustomer = current.customer;

      if (typeof result.customer360ReprocessedAt === "string" && result.customer360ReprocessedAt) {
        nextCustomer = {
          ...nextCustomer,
          lastCustomer360SyncAt: result.customer360ReprocessedAt,
        };
      }

      if (typeof result.newStatus === "string") {
        nextCustomer = {
          ...nextCustomer,
          customer360Status: /** @type {CustomersSyncViewModel["customer360Status"]} */ (
            result.newStatus
          ),
        };
      }

      if (nextCustomer === current.customer) return current;

      return {
        ...current,
        customer: nextCustomer,
      };
    });
  }, []);

  const applyCustomers360ReprocessResult = useCallback(
    (result) => {
      applyCustomerOperationResult(result);
    },
    [applyCustomerOperationResult],
  );

  const searchCustomer = useCallback(
    async (inputQuery) => {
      const validation = validateCustomersSyncQuery(inputQuery ?? syncState.searchQuery);
      if (!validation.isValid) {
        setSyncState((current) => ({
          ...current,
          searchQuery: validation.query,
          searchState: "idle",
          searchError: validation.errorMessage,
          searchEmpty: false,
        }));
        return false;
      }

      if (!sellerId) return false;

      const config = getSellerToolboxSubscriptionOperationConfig(SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID);
      if (!config) return false;

      setSyncState((current) => ({
        ...current,
        searchQuery: validation.query,
        searchState: "loading",
        searchError: "",
        searchEmpty: false,
      }));

      const metadata = {
        sellerId,
        query: validation.query,
      };

      const result = await executeSubscriptionOperation({
        actionId: SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
        sellerId,
        reason: "",
        metadata,
        execute: (context) =>
          config.handler({
            ...context,
            query: validation.query,
          }),
        onSuccess: (data) => {
          applyCustomersSyncSearchResult(data);
          logOperation({
            event: config.operationalLog.event,
            category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
            metadata: config.operationalLog.buildMetadata(
              data,
              0,
              SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
              {
                ...metadata,
                customerId: data.customer?.customerId ?? null,
                customerEmail: data.customer?.email ?? null,
                customerPhone: data.customer?.phone ?? null,
                totalOrders: data.customer?.totalOrders ?? null,
              },
            ),
          });
        },
        onError: () => {
          setSyncState((current) => ({
            ...current,
            searchState: "error",
            customer: null,
            searchEmpty: false,
            searchError: "Não foi possível buscar o cliente. Tente novamente.",
          }));
        },
      });

      if (!result.success) {
        if (result.error?.code === "INVALID_REASON") return false;
        setSyncState((current) => ({
          ...current,
          searchState: "error",
          customer: null,
          searchEmpty: false,
        }));
        return false;
      }

      return true;
    },
    [sellerId, syncState.searchQuery, applyCustomersSyncSearchResult, logOperation],
  );

  const setQuery = useCallback((query) => {
    setSyncState((current) => ({
      ...current,
      searchQuery: String(query ?? ""),
      searchError: "",
    }));
  }, []);

  const resetCustomersSync = useCallback(() => {
    setSyncState(createInitialCustomersSyncState());
  }, []);

  const stateRef = useRef(syncState);
  stateRef.current = syncState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_CUSTOMERS_SYNC__ = {
      get: () => stateRef.current,
      search: (query) => searchCustomer(query),
      reset: () => resetCustomersSync(),
    };
  }, [searchCustomer, resetCustomersSync]);

  const loading = panelState === "loading" || syncState.searchState === "loading";
  const error =
    syncState.searchError ||
    (syncState.searchState === "error" ? "Não foi possível buscar o cliente." : "");
  const empty = syncState.searchEmpty || syncState.searchState === "empty";

  const value = useMemo(
    () => ({
      panelState,
      searchState: syncState.searchState,
      query: syncState.searchQuery,
      customer: syncState.customer,
      loading,
      error,
      empty,
      lastSearchedAt: syncState.lastSearchedAt,
      searchCustomer,
      setQuery,
      applyCustomerOperationResult,
      applyCustomers360ReprocessResult,
      applyCustomersSyncSearchResult,
      resetCustomersSync,
    }),
    [
      panelState,
      syncState,
      loading,
      error,
      empty,
      searchCustomer,
      setQuery,
      applyCustomerOperationResult,
      applyCustomers360ReprocessResult,
      applyCustomersSyncSearchResult,
      resetCustomersSync,
    ],
  );

  return (
    <CustomersSyncViewContext.Provider value={value}>{children}</CustomersSyncViewContext.Provider>
  );
}

export function useCustomersSyncView() {
  const context = useContext(CustomersSyncViewContext);
  if (!context) {
    throw new Error("useCustomersSyncView must be used within CustomersSyncViewProvider");
  }
  return context;
}
