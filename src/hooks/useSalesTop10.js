import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureAuthSessionBootstrapped } from "../auth/authBootstrapService";
import {
  buildSalesTop10QueryKey,
  fetchSalesTop10,
} from "../services/salesTop10Api";

const TOP10_MIN_LOADING_MS = 280;

/**
 * @typedef {'idle' | 'loading' | 'success' | 'refreshing' | 'error'} Top10Status
 */

/**
 * @param {import("../services/salesTop10Api.js").SalesTop10Params} parsedParams
 * @param {AbortSignal} signal
 */
async function fetchTop10WithAuthRetry(parsedParams, signal) {
  let res = await fetchSalesTop10(parsedParams, { signal });
  if (res.aborted) return res;
  const shouldRetry =
    !res.ok && (res.status === 401 || res.status === 0 || Boolean(res.connectionError));
  if (shouldRetry) {
    await ensureAuthSessionBootstrapped();
    res = await fetchSalesTop10(parsedParams, { signal });
  }
  return res;
}

/**
 * @param {import("../services/salesTop10Api.js").SalesTop10Params | null | undefined} params
 * @param {{ enabled?: boolean }} [options]
 */
export function useSalesTop10(params, options = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [status, setStatus] = useState(/** @type {Top10Status} */ ("idle"));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const paramsKey = useMemo(() => buildSalesTop10QueryKey(params), [params]);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(/** @type {AbortController | null} */ (null));
  const dataRef = useRef(/** @type {Record<string, unknown> | null} */ (null));
  dataRef.current = data;

  const loading = status === "loading" || status === "refreshing";
  const refreshing = status === "refreshing";
  const succeeded = status === "success";

  const finishLoadingAfterMinDelay = useCallback(async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    const waitMs = TOP10_MIN_LOADING_MS - elapsed;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }, []);

  const applyFetchResult = useCallback(
    /**
     * @param {{
     *   res: Awaited<ReturnType<typeof fetchTop10WithAuthRetry>>;
     *   hasPreviousData: boolean;
     * }} input
     */
    ({ res, hasPreviousData }) => {
      if (res.aborted) {
        if (dataRef.current != null) setStatus("success");
        else setStatus("idle");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setError(
          res.error ??
            (res.timedOut ? "Tempo esgotado ao carregar o Top 10." : "Não foi possível carregar o Top 10."),
        );
        if (!hasPreviousData) setData(null);
        return;
      }

      setError(null);
      setData(res.data ?? null);
      setStatus("success");
    },
    [],
  );

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
    const res = await fetchTop10WithAuthRetry(params ?? {}, controller.signal);
    if (seq !== requestSeqRef.current) return null;

    await finishLoadingAfterMinDelay(startedAt);
    if (seq !== requestSeqRef.current) return null;

    applyFetchResult({ res, hasPreviousData });
    return res.ok ? res.data ?? null : null;
  }, [applyFetchResult, enabled, finishLoadingAfterMinDelay, params]);

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
      const res = await fetchTop10WithAuthRetry(params ?? {}, controller.signal);

      if (disposed || seq !== requestSeqRef.current) return;

      await finishLoadingAfterMinDelay(startedAt);
      if (disposed || seq !== requestSeqRef.current) return;

      applyFetchResult({ res, hasPreviousData });
    })();

    return () => {
      disposed = true;
      controller.abort();
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [applyFetchResult, enabled, finishLoadingAfterMinDelay, params, paramsKey]);

  const summary = useMemo(() => {
    const s = data?.summary;
    return s != null && typeof s === "object" ? /** @type {Record<string, unknown>} */ (s) : null;
  }, [data]);

  const topListingsByQuantity = useMemo(() => {
    const list =
      data?.rankings != null && typeof data.rankings === "object" ? data.rankings.listings_by_quantity : null;
    return Array.isArray(list) ? list : [];
  }, [data]);

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

  const period = useMemo(() => {
    const p = data?.period;
    return p != null && typeof p === "object" ? /** @type {Record<string, unknown>} */ (p) : null;
  }, [data]);

  const isRealEmpty = useMemo(() => {
    if (!succeeded || summary == null) return false;
    const orders = Number(summary.orders_count ?? 0);
    const qty = Number(summary.items_quantity_sold ?? 0);
    return orders === 0 && qty === 0;
  }, [succeeded, summary]);

  return {
    data,
    summary,
    topListingsByQuantity,
    topListingsByGrossRevenue,
    topListingsByNetProfit,
    period,
    status,
    loading,
    refreshing,
    succeeded,
    error,
    isRealEmpty,
    refetch,
  };
}
