import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSellerToolbox } from "../../SellerToolboxContext";
import { useSellerToolboxOperationalLog } from "../../useSellerToolboxOperationalLog";
import { SELLER_TOOLBOX_OPERATION_CATEGORIES } from "../../sellerToolboxOperationalLog";
import { executeSubscriptionOperation } from "../../subscription/sellerToolboxSubscriptionOperationExecutor";
import { getSellerToolboxSubscriptionOperationConfig } from "../../subscription/sellerToolboxSubscriptionOperationModel";
import {
  PRODUCTS_SYNC_DEFAULT_MOCK_SKU,
  resolveProductsSyncPanelState,
  validateProductsSyncQuery,
} from "./productsSyncModel";
import { SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID } from "./sellerToolboxSearchProductOperation";

/** @typedef {import("./productsSyncModel").ProductsSyncViewModel} ProductsSyncViewModel */
/** @typedef {import("./productsSyncModel").ProductsSyncSearchState} ProductsSyncSearchState */

/**
 * @typedef {{
 *   panelState: import("./productsSyncModel").ProductsSyncSearchState | "loaded" | "empty" | "error" | "loading";
 *   searchState: ProductsSyncSearchState;
 *   query: string;
 *   product: ProductsSyncViewModel | null;
 *   loading: boolean;
 *   error: string;
 *   empty: boolean;
 *   lastSearchedAt: string | null;
 *   searchProduct: (inputQuery?: string) => Promise<boolean>;
 *   setQuery: (query: string) => void;
 *   applyProductOperationResult: (result: Record<string, unknown>) => void;
 *   applyProductsListingLinkReprocessResult: (result: Record<string, unknown>) => void;
 *   applyProductsSyncSearchResult: (result: Record<string, unknown>) => void;
 *   resetProductsSync: () => void;
 * }} ProductsSyncViewValue
 */

/** @type {import("react").Context<ProductsSyncViewValue | null>} */
const ProductsSyncViewContext = createContext(null);

let devBridgeInitialized = false;

function createInitialProductsSyncState() {
  return {
    searchQuery: PRODUCTS_SYNC_DEFAULT_MOCK_SKU,
    searchState: /** @type {ProductsSyncSearchState} */ ("idle"),
    product: /** @type {ProductsSyncViewModel | null} */ (null),
    searchEmpty: false,
    lastSearchedAt: /** @type {string | null} */ (null),
    searchError: "",
  };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function ProductsSyncViewProvider({ children }) {
  const { sellerId, drawerState, toolboxState, isReady } = useSellerToolbox();
  const { logOperation } = useSellerToolboxOperationalLog();
  const [syncState, setSyncState] = useState(createInitialProductsSyncState);

  useEffect(() => {
    setSyncState(createInitialProductsSyncState());
  }, [sellerId]);

  const panelState = useMemo(
    () =>
      resolveProductsSyncPanelState({
        sellerId,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, drawerState, toolboxState, isReady],
  );

  const applyProductsSyncSearchResult = useCallback((result) => {
    const product = result?.product;
    const isEmpty = Boolean(result.empty) || product == null;

    if (isEmpty) {
      setSyncState((current) => ({
        ...current,
        searchState: "empty",
        product: null,
        searchEmpty: true,
        lastSearchedAt:
          typeof result.searchedAt === "string" && result.searchedAt
            ? result.searchedAt
            : new Date().toISOString(),
        searchError: "",
      }));
      return;
    }

    if (!product || typeof product !== "object") return;

    setSyncState((current) => ({
      ...current,
      searchState: "loaded",
      product: /** @type {ProductsSyncViewModel} */ (product),
      searchEmpty: false,
      lastSearchedAt:
        typeof result.searchedAt === "string" && result.searchedAt
          ? result.searchedAt
          : new Date().toISOString(),
      searchError: "",
    }));
  }, []);

  const applyProductOperationResult = useCallback((result) => {
    if (!result || typeof result !== "object") return;

    setSyncState((current) => {
      if (!current.product) return current;

      let nextProduct = current.product;

      if (typeof result.reprocessedAt === "string" && result.reprocessedAt) {
        nextProduct = {
          ...nextProduct,
          lastLinkSyncAt: result.reprocessedAt,
        };
      }

      if (typeof result.newLinkStatus === "string") {
        nextProduct = {
          ...nextProduct,
          listingLinkStatus: /** @type {ProductsSyncViewModel["listingLinkStatus"]} */ (
            result.newLinkStatus
          ),
        };
      }

      if (nextProduct === current.product) return current;

      return {
        ...current,
        product: nextProduct,
      };
    });
  }, []);

  const applyProductsListingLinkReprocessResult = useCallback(
    (result) => {
      applyProductOperationResult(result);
    },
    [applyProductOperationResult],
  );

  const searchProduct = useCallback(
    async (inputQuery) => {
      const validation = validateProductsSyncQuery(inputQuery ?? syncState.searchQuery);
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

      const config = getSellerToolboxSubscriptionOperationConfig(SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID);
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
        actionId: SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
        sellerId,
        reason: "",
        metadata,
        execute: (context) =>
          config.handler({
            ...context,
            query: validation.query,
          }),
        onSuccess: (data) => {
          applyProductsSyncSearchResult(data);
          logOperation({
            event: config.operationalLog.event,
            category: SELLER_TOOLBOX_OPERATION_CATEGORIES.FUTURE_ACTION,
            metadata: config.operationalLog.buildMetadata(
              data,
              0,
              SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
              {
                ...metadata,
                productId: data.product?.productId ?? null,
                sku: data.product?.sku ?? validation.query,
                linkedListingsCount: data.product?.linkedListingsCount ?? null,
              },
            ),
          });
        },
        onError: () => {
          setSyncState((current) => ({
            ...current,
            searchState: "error",
            product: null,
            searchEmpty: false,
            searchError: "Não foi possível buscar o produto. Tente novamente.",
          }));
        },
      });

      if (!result.success) {
        if (result.error?.code === "INVALID_REASON") return false;
        setSyncState((current) => ({
          ...current,
          searchState: "error",
          product: null,
          searchEmpty: false,
        }));
        return false;
      }

      return true;
    },
    [sellerId, syncState.searchQuery, applyProductsSyncSearchResult, logOperation],
  );

  const setQuery = useCallback((query) => {
    setSyncState((current) => ({
      ...current,
      searchQuery: String(query ?? ""),
      searchError: "",
    }));
  }, []);

  const resetProductsSync = useCallback(() => {
    setSyncState(createInitialProductsSyncState());
  }, []);

  const stateRef = useRef(syncState);
  stateRef.current = syncState;

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
    devBridgeInitialized = true;

    window.__S7_TOOLBOX_PRODUCTS_SYNC__ = {
      get: () => stateRef.current,
      search: (query) => searchProduct(query),
      reset: () => resetProductsSync(),
    };
  }, [searchProduct, resetProductsSync]);

  const loading = panelState === "loading" || syncState.searchState === "loading";
  const error =
    syncState.searchError ||
    (syncState.searchState === "error" ? "Não foi possível buscar o produto." : "");
  const empty = syncState.searchEmpty || syncState.searchState === "empty";

  const value = useMemo(
    () => ({
      panelState,
      searchState: syncState.searchState,
      query: syncState.searchQuery,
      product: syncState.product,
      loading,
      error,
      empty,
      lastSearchedAt: syncState.lastSearchedAt,
      searchProduct,
      setQuery,
      applyProductOperationResult,
      applyProductsListingLinkReprocessResult,
      applyProductsSyncSearchResult,
      resetProductsSync,
    }),
    [
      panelState,
      syncState,
      loading,
      error,
      empty,
      searchProduct,
      setQuery,
      applyProductOperationResult,
      applyProductsListingLinkReprocessResult,
      applyProductsSyncSearchResult,
      resetProductsSync,
    ],
  );

  return <ProductsSyncViewContext.Provider value={value}>{children}</ProductsSyncViewContext.Provider>;
}

export function useProductsSyncView() {
  const context = useContext(ProductsSyncViewContext);
  if (!context) {
    throw new Error("useProductsSyncView must be used within ProductsSyncViewProvider");
  }
  return context;
}
