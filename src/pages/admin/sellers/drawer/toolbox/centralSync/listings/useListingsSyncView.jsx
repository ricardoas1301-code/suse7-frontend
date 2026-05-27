import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../../sellerToolboxOperationalLog";
import { executeSubscriptionOperation } from "../../subscription/sellerToolboxSubscriptionOperationExecutor";
import { getSellerToolboxSubscriptionOperationConfig } from "../../subscription/sellerToolboxSubscriptionOperationModel";
import {
  LISTINGS_SYNC_DEFAULT_MOCK_QUERY,
  resolveListingsSyncPanelState,
  validateListingsSyncQuery,
} from "./listingsSyncModel";
import { SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID } from "./sellerToolboxSearchListingOperation";

/** @typedef {import("./listingsSyncModel").ListingsSyncViewModel} ListingsSyncViewModel */
/** @typedef {import("./listingsSyncModel").ListingsSyncSearchState} ListingsSyncSearchState */

/**
 * @typedef {{
 *   panelState: import("./listingsSyncModel").ListingsSyncSearchState | "loaded" | "empty" | "error" | "loading";
 *   searchState: ListingsSyncSearchState;
 *   query: string;
 *   listing: ListingsSyncViewModel | null;
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   lastSearchedAt: string | null;
 *   searchListing: (inputQuery?: string) => Promise<boolean>;
 *   setQuery: (query: string) => void;
 *   applyListingOperationResult: (result: Record<string, unknown>) => void;
 *   applyListingsReimportResult: (result: Record<string, unknown>) => void;
 *   applyListingsHealthRecalculateResult: (result: Record<string, unknown>) => void;
 *   applyListingsSyncSearchResult: (result: Record<string, unknown>) => void;
 *   resetListingsSync: () => void;
 * }} ListingsSyncViewValue
 */

/** @type {import("react").Context<ListingsSyncViewValue | null>} */
const ListingsSyncViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialListingsSyncState() {
  return {
    searchQuery: LISTINGS_SYNC_DEFAULT_MOCK_QUERY,
    searchState: /** @type {ListingsSyncSearchState} */ ("idle"),
    listing: /** @type {ListingsSyncViewModel | null} */ (null),
    searchEmpty: false,
    lastSearchedAt: /** @type {string | null} */ (null),
    searchError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function ListingsSyncViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [syncState, setSyncState] = useState(createInitialListingsSyncState);

  useEffect(() => {
    setSyncState(createInitialListingsSyncState());
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveListingsSyncPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applyListingsSyncSearchResult = useCallback((result) => {
    const listing = result?.listing;
    const isEmpty = Boolean(result.empty) || listing == null;

    if (isEmpty) {
      setSyncState((current) => ({
        ...current,
        searchState: "empty",
        listing: null,
        searchEmpty: true,
        lastSearchedAt:
          typeof result.searchedAt === "string" && result.searchedAt
            ? result.searchedAt
            : new Date().toISOString(),
        searchError: "",
      }));
      return;
    }

    if (!listing || typeof listing !== "object") return;

    setSyncState((current) => ({
      ...current,
      searchState: "loaded",
      listing: /** @type {ListingsSyncViewModel} */ (listing),
      searchEmpty: false,
      lastSearchedAt:
        typeof result.searchedAt === "string" && result.searchedAt
          ? result.searchedAt
          : new Date().toISOString(),
      searchError: "",
    }));
  }, []);

  const applyListingOperationResult = useCallback((result) => {
    if (!result || typeof result !== "object") return;

    setSyncState((current) => {
      if (!current.listing) return current;

      let nextListing = current.listing;

      if (typeof result.reimportedAt === "string" && result.reimportedAt) {
        nextListing = {
          ...nextListing,
          lastSyncAt: result.reimportedAt,
        };
      }

      const newHealthScore = Number(result.newHealthScore);
      if (Number.isFinite(newHealthScore)) {
        nextListing = {
          ...nextListing,
          healthScore: newHealthScore,
          healthStatus:
            typeof result.healthStatus === "string"
              ? /** @type {ListingsSyncViewModel["healthStatus"]} */ (result.healthStatus)
              : nextListing.healthStatus,
        };
      }

      if (nextListing === current.listing) return current;

      return {
        ...current,
        listing: nextListing,
      };
    });
  }, []);

  const applyListingsReimportResult = useCallback((result) => {
    applyListingOperationResult(result);
  }, [applyListingOperationResult]);

  const applyListingsHealthRecalculateResult = useCallback((result) => {
    applyListingOperationResult(result);
  }, [applyListingOperationResult]);

  const searchListing = useCallback(
    async (inputQuery) => {
      const validation = validateListingsSyncQuery(inputQuery ?? syncState.searchQuery);
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

      const config = getSellerToolboxSubscriptionOperationConfig(SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID);
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
        actionId: SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
        sellerId,
        reason: "",
        metadata,
        execute: (context) =>
          config.handler({
            ...context,
            query: validation.query,
          }),
        onSuccess: (data) => {
          applyListingsSyncSearchResult(data);
          logOperation({
            event: config.operationalLog.event,
            category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
            metadata: config.operationalLog.buildMetadata(
              data,
              0,
              SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
              {
                ...metadata,
                listingId: data.listing?.listingId ?? null,
                sku: data.listing?.sku ?? null,
                marketplace: data.listing?.marketplace ?? null,
              },
            ),
          });
        },
        onError: () => {
          setSyncState((current) => ({
            ...current,
            searchState: "error",
            listing: null,
            searchEmpty: false,
            searchError: "Não foi possível buscar o anúncio. Tente novamente.",
          }));
        },
      });

      if (!result.success) {
        if (result.error?.code === "INVALID_REASON") return false;
        setSyncState((current) => ({
          ...current,
          searchState: "error",
          listing: null,
          searchEmpty: false,
        }));
        return false;
      }

      return true;
    },
    [sellerId, syncState.searchQuery, applyListingsSyncSearchResult, logOperation],
  );

  const setQuery = useCallback((query) => {
    setSyncState((current) => ({
      ...current,
      searchQuery: String(query ?? ""),
      searchError: "",
    }));
  }, []);

  const resetListingsSync = useCallback(() => {
    setSyncState(createInitialListingsSyncState());
  }, []);

  const stateRef = useRef(syncState);
  stateRef.current = syncState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_LISTINGS_SYNC__ = {
      get: () => stateRef.current,
      search: (query) => searchListing(query),
      reset: () => resetListingsSync(),
    };
  }, [searchListing, resetListingsSync]);

  const loading = panelState === "loading" || syncState.searchState === "loading";
  const error = syncState.searchError || (syncState.searchState === "error" ? "Não foi possível buscar o anúncio." : "");
  const empty = syncState.searchEmpty || syncState.searchState === "empty";

  const value = useMemo(
    () => ({
      panelState,
      searchState: syncState.searchState,
      query: syncState.searchQuery,
      listing: syncState.listing,
      loading,
      error,
      empty,
      lastSearchedAt: syncState.lastSearchedAt,
      searchListing,
      setQuery,
      applyListingOperationResult,
      applyListingsReimportResult,
      applyListingsHealthRecalculateResult,
      applyListingsSyncSearchResult,
      resetListingsSync,
    }),
    [
      panelState,
      syncState,
      loading,
      error,
      empty,
      searchListing,
      setQuery,
      applyListingOperationResult,
      applyListingsReimportResult,
      applyListingsHealthRecalculateResult,
      applyListingsSyncSearchResult,
      resetListingsSync,
    ],
  );

  return <ListingsSyncViewContext.Provider value={value}>{children}</ListingsSyncViewContext.Provider>;
}

export function useListingsSyncView() {
  const context = useContext(ListingsSyncViewContext);
  if (!context) {
    throw new Error("useListingsSyncView must be used within ListingsSyncViewProvider");
  }
  return context;
}
