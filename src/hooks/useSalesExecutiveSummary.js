import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureAuthSessionBootstrapped } from "../auth/authBootstrapService";
import {
  fetchSalesExecutiveSummary,
  runExecutiveSummaryFetchSerialized,
} from "../services/salesExecutiveSummaryApi";

/** Evita flicker quando a API responde muito rápido (skeleton some suave). */
const EXECUTIVE_SUMMARY_MIN_LOADING_MS = 280;

/**
 * @param {import("../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams} parsedParams
 */
async function fetchExecutiveSummaryWithAuthRetry(parsedParams) {
  return runExecutiveSummaryFetchSerialized(async () => {
    let res = await fetchSalesExecutiveSummary(parsedParams);
    const shouldRetry =
      !res.ok && (res.status === 401 || res.status === 0 || Boolean(res.connectionError));
    if (shouldRetry) {
      await ensureAuthSessionBootstrapped();
      res = await fetchSalesExecutiveSummary(parsedParams);
    }
    return res;
  });
}

/**
 * @param {import("../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams | null | undefined} params
 * @param {{ enabled?: boolean }} [options]
 */
export function useSalesExecutiveSummary(params, options = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const requestSeqRef = useRef(0);

  const finishLoadingAfterMinDelay = useCallback(async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    const waitMs = EXECUTIVE_SUMMARY_MIN_LOADING_MS - elapsed;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }, []);

  const refetch = useCallback(async () => {
    const seq = ++requestSeqRef.current;

    if (!enabled) {
      setLoading(false);
      setError(null);
      setData(null);
      return null;
    }

    setLoading(true);
    setError(null);

    const startedAt = Date.now();
    const parsedParams = paramsKey ? JSON.parse(paramsKey) : {};
    const res = await fetchExecutiveSummaryWithAuthRetry(parsedParams);

    if (seq !== requestSeqRef.current) return null;

    await finishLoadingAfterMinDelay(startedAt);
    if (seq !== requestSeqRef.current) return null;

    setLoading(false);

    if (!res.ok) {
      const errMsg =
        res.error ??
        (res.timedOut ? "Tempo esgotado ao carregar o resumo executivo." : "Não foi possível carregar o resumo executivo.");
      setError(errMsg);
      setData(null);
      return null;
    }

    setData(res.data ?? null);
    return res.data ?? null;
  }, [enabled, finishLoadingAfterMinDelay, paramsKey]);

  useEffect(() => {
    let cancelled = false;
    const seq = ++requestSeqRef.current;

    (async () => {
      if (!enabled) {
        if (!cancelled) {
          setLoading(false);
          setError(null);
          setData(null);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      const startedAt = Date.now();
      const parsedParams = paramsKey ? JSON.parse(paramsKey) : {};
      const res = await fetchExecutiveSummaryWithAuthRetry(parsedParams);

      if (cancelled || seq !== requestSeqRef.current) return;

      await finishLoadingAfterMinDelay(startedAt);
      if (cancelled || seq !== requestSeqRef.current) return;

      setLoading(false);

      if (!res.ok) {
        const errMsg =
          res.error ??
          (res.timedOut ? "Tempo esgotado ao carregar o resumo executivo." : "Não foi possível carregar o resumo executivo.");
        if (import.meta.env.DEV) {
          console.warn("[S7][ExecutiveSummary request failed]", {
            status: res.status,
            timedOut: Boolean(res.timedOut),
            error: errMsg,
          });
        }
        setError(errMsg);
        setData(null);
        return;
      }

      setData(res.data ?? null);

      if (import.meta.env.DEV && res.data) {
        const data = res.data;
        console.info("[S7][ExecutiveSummary response]", {
          ordersCount: data.summary?.orders_count ?? null,
          listingsCount: Array.isArray(data.rankings?.listings) ? data.rankings.listings.length : 0,
          productsCount: Array.isArray(data.rankings?.products) ? data.rankings.products.length : 0,
          dataQualityStatus: data.data_quality?.status ?? null,
          periodPreset: data.period?.preset ?? null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, finishLoadingAfterMinDelay, paramsKey]);

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
    loading,
    error,
    refetch,
  };
}
