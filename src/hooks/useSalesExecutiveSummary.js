import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureAuthSessionBootstrapped } from "../auth/authBootstrapService";
import {
  buildSalesExecutiveSummaryQueryKey,
  fetchSalesExecutiveSummary,
} from "../services/salesExecutiveSummaryApi";

/** Evita flicker quando a API responde muito rápido (skeleton some suave). */
const EXECUTIVE_SUMMARY_MIN_LOADING_MS = 280;

/**
 * @typedef {'idle' | 'loading' | 'success' | 'refreshing' | 'error'} ExecutiveSummaryStatus
 */

/**
 * @param {import("../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams} parsedParams
 * @param {AbortSignal} signal
 */
async function fetchExecutiveSummaryWithAuthRetry(parsedParams, signal) {
  let res = await fetchSalesExecutiveSummary(parsedParams, { signal });
  if (res.aborted) return res;
  const shouldRetry =
    !res.ok && (res.status === 401 || res.status === 0 || Boolean(res.connectionError));
  if (shouldRetry) {
    await ensureAuthSessionBootstrapped();
    res = await fetchSalesExecutiveSummary(parsedParams, { signal });
  }
  return res;
}

/**
 * @param {import("../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams | null | undefined} params
 * @param {{ enabled?: boolean }} [options]
 */
export function useSalesExecutiveSummary(params, options = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [status, setStatus] = useState(/** @type {ExecutiveSummaryStatus} */ ("idle"));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const paramsKey = useMemo(() => buildSalesExecutiveSummaryQueryKey(params), [params]);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(/** @type {AbortController | null} */ (null));
  const dataRef = useRef(/** @type {Record<string, unknown> | null} */ (null));
  dataRef.current = data;

  const loading = status === "loading" || status === "refreshing";
  const refreshing = status === "refreshing";

  const finishLoadingAfterMinDelay = useCallback(async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    const waitMs = EXECUTIVE_SUMMARY_MIN_LOADING_MS - elapsed;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }, []);

  const applyStaleAbortState = useCallback(() => {
    if (dataRef.current != null) {
      setStatus("success");
      return;
    }
    setStatus("idle");
  }, []);

  const refetch = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!enabled) {
      setStatus("idle");
      setError(null);
      setData(null);
      return null;
    }

    const hasPreviousData = dataRef.current != null;
    setStatus(hasPreviousData ? "refreshing" : "loading");
    if (!hasPreviousData) setError(null);

    const startedAt = Date.now();
    const parsedParams = params ?? {};
    const res = await fetchExecutiveSummaryWithAuthRetry(parsedParams, controller.signal);

    if (seq !== requestSeqRef.current) return null;

    if (controller.signal.aborted || res.aborted) {
      applyStaleAbortState();
      return null;
    }

    await finishLoadingAfterMinDelay(startedAt);
    if (seq !== requestSeqRef.current || controller.signal.aborted) {
      if (seq === requestSeqRef.current) applyStaleAbortState();
      return null;
    }

    if (!res.ok) {
      const errMsg =
        res.error ??
        (res.timedOut ? "Tempo esgotado ao carregar o resumo executivo." : "Não foi possível carregar o resumo executivo.");
      setStatus("error");
      setError(errMsg);
      if (!hasPreviousData) setData(null);
      return null;
    }

    setError(null);
    setData(res.data ?? null);
    setStatus("success");
    return res.data ?? null;
  }, [applyStaleAbortState, enabled, finishLoadingAfterMinDelay, params]);

  useEffect(() => {
    const seq = ++requestSeqRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let disposed = false;

    (async () => {
      if (!enabled) {
        if (!disposed) {
          setStatus("idle");
          setError(null);
          setData(null);
        }
        return;
      }

      const hasPreviousData = dataRef.current != null;
      if (!disposed) {
        setStatus(hasPreviousData ? "refreshing" : "loading");
        if (!hasPreviousData) setError(null);
      }

      const startedAt = Date.now();
      const parsedParams = params ?? {};
      const res = await fetchExecutiveSummaryWithAuthRetry(parsedParams, controller.signal);

      if (disposed || seq !== requestSeqRef.current) return;

      if (controller.signal.aborted || res.aborted) {
        applyStaleAbortState();
        return;
      }

      await finishLoadingAfterMinDelay(startedAt);
      if (disposed || seq !== requestSeqRef.current || controller.signal.aborted) {
        if (seq === requestSeqRef.current) applyStaleAbortState();
        return;
      }

      if (!res.ok) {
        const errMsg =
          res.error ??
          (res.timedOut ? "Tempo esgotado ao carregar o resumo executivo." : "Não foi possível carregar o resumo executivo.");
        if (import.meta.env.DEV) {
          console.warn("[S7][ExecutiveSummary request failed]", {
            status: res.status,
            timedOut: Boolean(res.timedOut),
            aborted: Boolean(res.aborted),
            error: errMsg,
            query_key: paramsKey,
          });
        }
        setStatus("error");
        setError(errMsg);
        if (!hasPreviousData) setData(null);
        return;
      }

      setError(null);
      setData(res.data ?? null);
      setStatus("success");

      if (import.meta.env.DEV && res.data) {
        const payload = res.data;
        console.info("[S7][ExecutiveSummary response]", {
          query_key: paramsKey,
          ordersCount: payload.summary?.orders_count ?? null,
          listingsCount: Array.isArray(payload.rankings?.listings) ? payload.rankings.listings.length : 0,
          productsCount: Array.isArray(payload.rankings?.products) ? payload.rankings.products.length : 0,
          dataQualityStatus: payload.data_quality?.status ?? null,
          periodPreset: payload.period?.preset ?? null,
        });
      }
    })();

    return () => {
      disposed = true;
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [applyStaleAbortState, enabled, finishLoadingAfterMinDelay, params, paramsKey]);

  const summary = useMemo(() => {
    const s = data?.summary;
    return s != null && typeof s === "object" ? /** @type {Record<string, unknown>} */ (s) : null;
  }, [data]);

  const topListings = useMemo(() => {
    const rankings = data?.rankings != null && typeof data.rankings === "object" ? data.rankings : null;
    const byQty = rankings?.listings_by_quantity;
    if (Array.isArray(byQty) && byQty.length > 0) return byQty;
    const list = rankings?.listings;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const topListingsByQuantity = useMemo(() => {
    const list =
      data?.rankings != null && typeof data.rankings === "object" ? data.rankings.listings_by_quantity : null;
    if (Array.isArray(list)) return list;
    return topListings;
  }, [data, topListings]);

  const topListingsByGrossRevenue = useMemo(() => {
    const list =
      data?.rankings != null && typeof data.rankings === "object" ? data.rankings.listings_by_gross_revenue : null;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const topListingsByNetProfit = useMemo(() => {
    const list =
      data?.rankings != null && typeof data.rankings === "object" ? data.rankings.listings_by_net_profit : null;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const topProducts = useMemo(() => {
    const list = data?.rankings != null && typeof data.rankings === "object" ? data.rankings.products : null;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const health = useMemo(() => {
    const h = data?.health;
    return h != null && typeof h === "object" ? /** @type {Record<string, unknown>} */ (h) : null;
  }, [data]);

  const distributionByAccount = useMemo(() => {
    const dist = data?.distribution != null && typeof data.distribution === "object" ? data.distribution : null;
    const byAccount = dist?.by_account;
    return Array.isArray(byAccount) ? byAccount : [];
  }, [data]);

  const dataQuality = useMemo(() => {
    const dq = data?.data_quality;
    return dq != null && typeof dq === "object" ? /** @type {Record<string, unknown>} */ (dq) : null;
  }, [data]);

  const period = useMemo(() => {
    const p = data?.period;
    return p != null && typeof p === "object" ? /** @type {Record<string, unknown>} */ (p) : null;
  }, [data]);

  const filtersApplied = useMemo(() => {
    const f = data?.filters_applied;
    return f != null && typeof f === "object" ? /** @type {Record<string, unknown>} */ (f) : null;
  }, [data]);

  const truncatedScan = Boolean(data?.truncated_scan);

  return {
    data,
    summary,
    topListings,
    topListingsByQuantity,
    topListingsByGrossRevenue,
    topListingsByNetProfit,
    topProducts,
    health,
    distributionByAccount,
    dataQuality,
    period,
    filtersApplied,
    truncatedScan,
    status,
    loading,
    refreshing,
    error,
    refetch,
  };
}
