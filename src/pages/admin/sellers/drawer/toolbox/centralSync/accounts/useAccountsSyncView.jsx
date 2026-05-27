import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../../sellerToolboxOperationalLog";
import { executeSubscriptionOperation } from "../../subscription/sellerToolboxSubscriptionOperationExecutor";
import { getSellerToolboxSubscriptionOperationConfig } from "../../subscription/sellerToolboxSubscriptionOperationModel";
import {
  resolveAccountsSyncPanelState,
  validateAccountsSyncQuery,
} from "./accountsSyncModel";
import { SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID } from "./sellerToolboxSearchMarketplaceAccountOperation";

/** @typedef {import("./accountsSyncModel").AccountsSyncViewModel} AccountsSyncViewModel */
/** @typedef {import("./accountsSyncModel").AccountsSyncSearchState} AccountsSyncSearchState */

/**
 * @typedef {{
 *   panelState: AccountsSyncSearchState | "loaded" | "empty" | "error" | "loading";
 *   searchState: AccountsSyncSearchState;
 *   query: string;
 *   account: AccountsSyncViewModel | null;
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   lastSearchedAt: string | null;
 *   searchAccount: (inputQuery?: string) => Promise<boolean>;
 *   setQuery: (query: string) => void;
 *   applyAccountOperationResult: (result: Record<string, unknown>) => void;
 *   applyAccountsTokenValidationResult: (result: Record<string, unknown>) => void;
 *   applyAccountsForceSyncResult: (result: Record<string, unknown>) => void;
 *   applyAccountsSyncSearchResult: (result: Record<string, unknown>) => void;
 *   resetAccountsSync: () => void;
 * }} AccountsSyncViewValue
 */

/** @type {import("react").Context<AccountsSyncViewValue | null>} */
const AccountsSyncViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialAccountsSyncState() {
  return {
    searchQuery: "",
    searchState: /** @type {AccountsSyncSearchState} */ ("idle"),
    account: /** @type {AccountsSyncViewModel | null} */ (null),
    searchEmpty: false,
    lastSearchedAt: /** @type {string | null} */ (null),
    searchError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function AccountsSyncViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [syncState, setSyncState] = useState(createInitialAccountsSyncState);

  useEffect(() => {
    setSyncState(createInitialAccountsSyncState());
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveAccountsSyncPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applyAccountsSyncSearchResult = useCallback((result) => {
    const account = result?.account;
    const isEmpty = Boolean(result.empty) || account == null;

    if (isEmpty) {
      setSyncState((current) => ({
        ...current,
        searchState: "empty",
        account: null,
        searchEmpty: true,
        lastSearchedAt:
          typeof result.searchedAt === "string" && result.searchedAt
            ? result.searchedAt
            : new Date().toISOString(),
        searchError: "",
      }));
      return;
    }

    if (!account || typeof account !== "object") return;

    setSyncState((current) => ({
      ...current,
      searchState: "loaded",
      account: /** @type {AccountsSyncViewModel} */ (account),
      searchEmpty: false,
      lastSearchedAt:
        typeof result.searchedAt === "string" && result.searchedAt
          ? result.searchedAt
          : new Date().toISOString(),
      searchError: "",
    }));
  }, []);

  const applyAccountOperationResult = useCallback((result) => {
    if (!result || typeof result !== "object") return;

    setSyncState((current) => {
      if (!current.account) return current;

      let nextAccount = current.account;

      if (typeof result.validatedAt === "string" && result.validatedAt) {
        if (typeof result.newTokenStatus === "string") {
          nextAccount = {
            ...nextAccount,
            tokenStatus: /** @type {AccountsSyncViewModel["tokenStatus"]} */ (result.newTokenStatus),
          };
        }
        if (typeof result.tokenExpiresAt === "string" && result.tokenExpiresAt) {
          nextAccount = {
            ...nextAccount,
            tokenExpiresAt: result.tokenExpiresAt,
          };
        }
      }

      if (typeof result.syncedAt === "string" && result.syncedAt) {
        nextAccount = {
          ...nextAccount,
          lastSyncAt: result.syncedAt,
        };

        if (typeof result.newSyncStatus === "string") {
          nextAccount = {
            ...nextAccount,
            syncStatus: /** @type {AccountsSyncViewModel["syncStatus"]} */ (result.newSyncStatus),
          };
        }

        if (Number.isFinite(Number(result.importedSales))) {
          nextAccount = {
            ...nextAccount,
            salesImportedToday: Number(result.importedSales),
          };
        }
      }

      if (nextAccount === current.account) return current;

      return {
        ...current,
        account: nextAccount,
      };
    });
  }, []);

  const applyAccountsTokenValidationResult = useCallback(
    (result) => {
      applyAccountOperationResult(result);
    },
    [applyAccountOperationResult],
  );

  const applyAccountsForceSyncResult = useCallback(
    (result) => {
      applyAccountOperationResult(result);
    },
    [applyAccountOperationResult],
  );

  const searchAccount = useCallback(
    async (inputQuery) => {
      const validation = validateAccountsSyncQuery(inputQuery ?? syncState.searchQuery);
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

      const config = getSellerToolboxSubscriptionOperationConfig(
        SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
      );
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
        actionId: SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
        sellerId,
        reason: "",
        metadata,
        execute: (context) =>
          config.handler({
            ...context,
            query: validation.query,
          }),
        onSuccess: (data) => {
          applyAccountsSyncSearchResult(data);
          logOperation({
            event: config.operationalLog.event,
            category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
            metadata: config.operationalLog.buildMetadata(
              data,
              0,
              SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
              {
                ...metadata,
                accountId: data.account?.accountId ?? null,
                accountLabel: data.account?.accountLabel ?? validation.query,
                marketplace: data.account?.marketplace ?? null,
              },
            ),
          });
        },
        onError: () => {
          setSyncState((current) => ({
            ...current,
            searchState: "error",
            account: null,
            searchEmpty: false,
            searchError: "Não foi possível buscar a conta. Tente novamente.",
          }));
        },
      });

      if (!result.success) {
        if (result.error?.code === "INVALID_REASON") return false;
        setSyncState((current) => ({
          ...current,
          searchState: "error",
          account: null,
          searchEmpty: false,
        }));
        return false;
      }

      return true;
    },
    [sellerId, syncState.searchQuery, applyAccountsSyncSearchResult, logOperation],
  );

  const setQuery = useCallback((query) => {
    setSyncState((current) => ({
      ...current,
      searchQuery: String(query ?? ""),
      searchError: "",
    }));
  }, []);

  const resetAccountsSync = useCallback(() => {
    setSyncState(createInitialAccountsSyncState());
  }, []);

  const stateRef = useRef(syncState);
  stateRef.current = syncState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_ACCOUNTS_SYNC__ = {
      get: () => stateRef.current,
      search: (query) => searchAccount(query),
      reset: () => resetAccountsSync(),
    };
  }, [searchAccount, resetAccountsSync]);

  const loading = panelState === "loading" || syncState.searchState === "loading";
  const error =
    syncState.searchError ||
    (syncState.searchState === "error" ? "Não foi possível buscar a conta." : "");
  const empty = syncState.searchEmpty || syncState.searchState === "empty";

  const value = useMemo(
    () => ({
      panelState,
      searchState: syncState.searchState,
      query: syncState.searchQuery,
      account: syncState.account,
      loading,
      error,
      empty,
      lastSearchedAt: syncState.lastSearchedAt,
      searchAccount,
      setQuery,
      applyAccountOperationResult,
      applyAccountsTokenValidationResult,
      applyAccountsForceSyncResult,
      applyAccountsSyncSearchResult,
      resetAccountsSync,
    }),
    [
      panelState,
      syncState,
      loading,
      error,
      empty,
      searchAccount,
      setQuery,
      applyAccountOperationResult,
      applyAccountsTokenValidationResult,
      applyAccountsForceSyncResult,
      applyAccountsSyncSearchResult,
      resetAccountsSync,
    ],
  );

  return (
    <AccountsSyncViewContext.Provider value={value}>{children}</AccountsSyncViewContext.Provider>
  );
}

export function useAccountsSyncView() {
  const context = useContext(AccountsSyncViewContext);
  if (!context) {
    throw new Error("useAccountsSyncView must be used within AccountsSyncViewProvider");
  }
  return context;
}
