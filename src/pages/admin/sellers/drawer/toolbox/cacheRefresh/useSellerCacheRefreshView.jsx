import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  resolveSellerCacheRefreshViewState,
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPE_KEYS,
  SELLER_TOOLBOX_REFRESH_SELLER_SCOPE_KEYS,
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANEL_KEYS,
} from "./sellerToolboxCacheRefreshModel";

/** @typedef {import("./sellerToolboxCacheRefreshModel").SellerCacheRefreshViewState} SellerCacheRefreshViewState */

/**
 * @typedef {{
 *   viewState: SellerCacheRefreshViewState;
 *   lastRefreshedAt: string | null;
 *   refreshedScopes: string[];
 *   lastClearedAt: string | null;
 *   clearedScopes: string[];
 *   lastReloadedAt: string | null;
 *   reloadedPanels: string[];
 *   loading: boolean;
 *   error: boolean;
 *   applyRefreshResult: (result: Record<string, unknown>) => void;
 *   applyClearCacheResult: (result: Record<string, unknown>) => void;
 *   applyReloadPanelResult: (result: Record<string, unknown>) => void;
 *   resetCacheRefresh: () => void;
 * }} SellerCacheRefreshViewValue
 */

/** @type {import("react").Context<SellerCacheRefreshViewValue | null>} */
const SellerCacheRefreshViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialCacheRefreshState() {
  return {
    lastRefreshedAt: /** @type {string | null} */ (null),
    refreshedScopes: /** @type {string[]} */ ([]),
    lastClearedAt: /** @type {string | null} */ (null),
    clearedScopes: /** @type {string[]} */ ([]),
    lastReloadedAt: /** @type {string | null} */ (null),
    reloadedPanels: /** @type {string[]} */ ([]),
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerCacheRefreshViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const [refreshState, setRefreshState] = useState(createInitialCacheRefreshState);

  useEffect(() => {
    setRefreshState(createInitialCacheRefreshState());
  }, [sellerId]);

  const viewState = useMemo(
    () =>
      resolveSellerCacheRefreshViewState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applyRefreshResult = useCallback((result) => {
    const refreshedAt =
      typeof result.refreshedAt === "string" && result.refreshedAt
        ? result.refreshedAt
        : new Date().toISOString();
    const refreshedScopes = Array.isArray(result.refreshedScopes)
      ? result.refreshedScopes.map((scope) => String(scope))
      : [...SELLER_TOOLBOX_REFRESH_SELLER_SCOPE_KEYS];

    setRefreshState((current) => ({
      ...current,
      lastRefreshedAt: refreshedAt,
      refreshedScopes,
    }));
  }, []);

  const applyClearCacheResult = useCallback((result) => {
    const clearedAt =
      typeof result.clearedAt === "string" && result.clearedAt
        ? result.clearedAt
        : new Date().toISOString();
    const clearedScopes = Array.isArray(result.clearedScopes)
      ? result.clearedScopes.map((scope) => String(scope))
      : [...SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPE_KEYS];

    setRefreshState((current) => ({
      ...current,
      lastClearedAt: clearedAt,
      clearedScopes,
    }));
  }, []);

  const applyReloadPanelResult = useCallback((result) => {
    const reloadedAt =
      typeof result.reloadedAt === "string" && result.reloadedAt
        ? result.reloadedAt
        : new Date().toISOString();
    const reloadedPanels = Array.isArray(result.reloadedPanels)
      ? result.reloadedPanels.map((panel) => String(panel))
      : [...SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANEL_KEYS];

    setRefreshState((current) => ({
      ...current,
      lastReloadedAt: reloadedAt,
      reloadedPanels,
    }));
  }, []);

  const resetCacheRefresh = useCallback(() => {
    setRefreshState(createInitialCacheRefreshState());
  }, []);

  const stateRef = useRef(refreshState);
  stateRef.current = refreshState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_CACHE_REFRESH__ = {
      get: () => stateRef.current,
      reset: () => {
        resetCacheRefresh();
      },
    };
  }, [resetCacheRefresh]);

  const value = useMemo(
    () => ({
      viewState,
      lastRefreshedAt: refreshState.lastRefreshedAt,
      refreshedScopes: refreshState.refreshedScopes,
      lastClearedAt: refreshState.lastClearedAt,
      clearedScopes: refreshState.clearedScopes,
      lastReloadedAt: refreshState.lastReloadedAt,
      reloadedPanels: refreshState.reloadedPanels,
      loading: viewState === "loading",
      error: viewState === "error",
      applyRefreshResult,
      applyClearCacheResult,
      applyReloadPanelResult,
      resetCacheRefresh,
    }),
    [
      viewState,
      refreshState,
      applyRefreshResult,
      applyClearCacheResult,
      applyReloadPanelResult,
      resetCacheRefresh,
    ],
  );

  return (
    <SellerCacheRefreshViewContext.Provider value={value}>
      {children}
    </SellerCacheRefreshViewContext.Provider>
  );
}

export function useSellerCacheRefreshView() {
  const context = useContext(SellerCacheRefreshViewContext);
  if (!context) {
    throw new Error("useSellerCacheRefreshView must be used within SellerCacheRefreshViewProvider");
  }
  return context;
}
