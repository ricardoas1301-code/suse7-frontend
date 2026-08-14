import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import {
  fetchConfigurationSnapshot,
  invalidateConfigurationSnapshotCache,
} from "./configurationOnboardingApi.js";

const MIN_LOADING_MS = 220;

/**
 * @param {{ enabled?: boolean }} [options]
 */
export function useConfigurationSnapshot(options = {}) {
  const { enabled = true } = options;
  const { ready: authReady } = useAuthBootstrap();
  const effectivelyEnabled = enabled && authReady;

  const [snapshot, setSnapshot] = useState(
    /** @type {{ configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[] } | null} */ (null),
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);

  const requestSeqRef = useRef(0);
  const hasResolvedOnceRef = useRef(false);

  const finishLoadingAfterMinDelay = useCallback(async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    const waitMs = MIN_LOADING_MS - elapsed;
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  }, []);

  const applySuccess = useCallback((res) => {
    setError(null);
    setSnapshot({
      configuration: res.configuration,
      milestones: Array.isArray(res.milestones) ? res.milestones : [],
    });
    if (import.meta.env.DEV) {
      console.info("[S7_CONFIGURATION_SNAPSHOT_LOAD]", {
        percent: res.configuration?.percent,
        completed: res.configuration?.completed,
        from_cache: Boolean(res.fromCache),
      });
    }
  }, []);

  const applyFailure = useCallback((res, isRefresh) => {
    const errMsg = res.error || "Não foi possível carregar a configuração inicial.";
    if (import.meta.env.DEV) {
      console.warn("[S7_CONFIGURATION_SNAPSHOT_LOAD] failed", { error: errMsg, is_refresh: isRefresh });
    }
    setError(errMsg);
    if (!isRefresh) setSnapshot(null);
  }, []);

  const beginFetchPhase = useCallback(() => {
    const isRefresh = hasResolvedOnceRef.current;
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);
    return isRefresh;
  }, []);

  const endFetchPhase = useCallback(() => {
    setInitialLoading(false);
    setRefreshing(false);
    setHasResolvedOnce(true);
    hasResolvedOnceRef.current = true;
  }, []);

  const refetch = useCallback(
    async (/** @type {{ force?: boolean }} */ opts = {}) => {
      const seq = ++requestSeqRef.current;
      if (!effectivelyEnabled) {
        setInitialLoading(false);
        setRefreshing(false);
        setError(null);
        setSnapshot(null);
        setHasResolvedOnce(true);
        hasResolvedOnceRef.current = true;
        return null;
      }

      const isRefresh = beginFetchPhase();
      const startedAt = Date.now();
      await ensureAuthSessionBootstrapped();
      const res = await fetchConfigurationSnapshot({ force: Boolean(opts.force) });

      if (seq !== requestSeqRef.current) return null;
      await finishLoadingAfterMinDelay(startedAt);
      if (seq !== requestSeqRef.current) return null;

      endFetchPhase();
      if (!res.ok) {
        applyFailure(res, isRefresh);
        return null;
      }
      applySuccess(res);
      return res;
    },
    [
      applyFailure,
      applySuccess,
      beginFetchPhase,
      effectivelyEnabled,
      endFetchPhase,
      finishLoadingAfterMinDelay,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    const seq = ++requestSeqRef.current;

    (async () => {
      if (!effectivelyEnabled) {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
          setSnapshot(null);
          setHasResolvedOnce(true);
          hasResolvedOnceRef.current = true;
        }
        return;
      }

      const isRefresh = beginFetchPhase();
      const startedAt = Date.now();
      await ensureAuthSessionBootstrapped();
      const res = await fetchConfigurationSnapshot();

      if (cancelled || seq !== requestSeqRef.current) return;
      await finishLoadingAfterMinDelay(startedAt);
      if (cancelled || seq !== requestSeqRef.current) return;

      endFetchPhase();
      if (!res.ok) applyFailure(res, isRefresh);
      else applySuccess(res);
    })();

    return () => {
      cancelled = true;
    };
  }, [effectivelyEnabled, applyFailure, applySuccess, beginFetchPhase, endFetchPhase, finishLoadingAfterMinDelay]);

  const refresh = useCallback(async () => {
    invalidateConfigurationSnapshotCache();
    return refetch({ force: true });
  }, [refetch]);

  return {
    snapshot,
    initialLoading,
    refreshing,
    error,
    hasResolvedOnce,
    refetch,
    refresh,
  };
}
