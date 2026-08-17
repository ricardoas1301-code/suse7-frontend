import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import {
  extrairFaseSincronizacaoInicialOperacional,
} from "./operationalTasksMarketplaceSyncState.js";
import {
  fetchOperationalTasks,
  invalidateOperationalTasksCache,
  OPERATIONAL_TASKS_INVALIDATE_EVENT,
} from "./operationalTasksApi.js";

const MIN_LOADING_MS = 220;

/**
 * @param {{ enabled?: boolean }} [options]
 */
export function useOperationalTasks(options = {}) {
  const { enabled = true } = options;
  const { ready: authReady } = useAuthBootstrap();
  const effectivelyEnabled = enabled && authReady;

  const [tasks, setTasks] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [totalTasks, setTotalTasks] = useState(0);
  const [mlInitialSyncPhase, setMlInitialSyncPhase] = useState(/** @type {string | null} */ (null));
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);

  const requestSeqRef = useRef(0);
  const hasResolvedOnceRef = useRef(false);

  const finishLoadingAfterMinDelay = useCallback(async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    const waitMs = MIN_LOADING_MS - elapsed;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }, []);

  const applySuccess = useCallback((res) => {
    const data = res.data && typeof res.data === "object" ? res.data : {};
    const nextTasks = Array.isArray(res.tasks) ? res.tasks : Array.isArray(data.tasks) ? data.tasks : [];
    setError(null);
    setTasks(nextTasks);
    setTotalTasks(Number(res.total_tasks ?? data.total_tasks) || nextTasks.length);
    setMlInitialSyncPhase(extrairFaseSincronizacaoInicialOperacional(data));

    if (import.meta.env.DEV) {
      console.info("[S7_OPERATIONAL_TASKS_LOAD]", {
        total_tasks: nextTasks.length,
        task_count: nextTasks[0]?.count ?? null,
        from_cache: Boolean(res.fromCache),
        refreshing: hasResolvedOnceRef.current,
        ml_initial_sync_phase: extrairFaseSincronizacaoInicialOperacional(data),
      });
    }

    return { tasks: nextTasks, total_tasks: nextTasks.length };
  }, []);

  const applyImmediatePatch = useCallback((/** @type {{ tasks?: Record<string, unknown>[]; total_tasks?: number }} */ patched) => {
    if (!patched || !Array.isArray(patched.tasks)) return;
    setError(null);
    setTasks(patched.tasks);
    setTotalTasks(Number(patched.total_tasks) || patched.tasks.length);
    setHasResolvedOnce(true);
    hasResolvedOnceRef.current = true;
    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  const applyFailure = useCallback((res, isRefresh) => {
    const errMsg = res.error || "Não foi possível carregar pendências da operação.";
    if (import.meta.env.DEV) {
      console.warn("[S7_OPERATIONAL_TASKS_LOAD] failed", { error: errMsg, is_refresh: isRefresh });
    }
    setError(errMsg);
    if (!isRefresh) {
      setTasks([]);
      setTotalTasks(0);
    }
    return null;
  }, []);

  const beginFetchPhase = useCallback(() => {
    const isRefresh = hasResolvedOnceRef.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
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
        setTasks([]);
        setTotalTasks(0);
        setHasResolvedOnce(true);
        hasResolvedOnceRef.current = true;
        return { tasks: [], total_tasks: 0 };
      }

      const isRefresh = beginFetchPhase();

      const startedAt = Date.now();
      await ensureAuthSessionBootstrapped();
      const res = await fetchOperationalTasks({ force: Boolean(opts.force) });

      if (seq !== requestSeqRef.current) return null;

      await finishLoadingAfterMinDelay(startedAt);
      if (seq !== requestSeqRef.current) return null;

      endFetchPhase();

      if (!res.ok) {
        return applyFailure(res, isRefresh);
      }

      return applySuccess(res);
    },
    [applyFailure, applySuccess, beginFetchPhase, effectivelyEnabled, endFetchPhase, finishLoadingAfterMinDelay]
  );

  useEffect(() => {
    let cancelled = false;
    const seq = ++requestSeqRef.current;

    (async () => {
      if (!effectivelyEnabled) {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
          setTasks([]);
          setTotalTasks(0);
          setHasResolvedOnce(true);
          hasResolvedOnceRef.current = true;
        }
        return;
      }

      const isRefresh = beginFetchPhase();

      const startedAt = Date.now();
      await ensureAuthSessionBootstrapped();
      const res = await fetchOperationalTasks();

      if (cancelled || seq !== requestSeqRef.current) return;

      await finishLoadingAfterMinDelay(startedAt);
      if (cancelled || seq !== requestSeqRef.current) return;

      endFetchPhase();

      if (!res.ok) {
        applyFailure(res, isRefresh);
        return;
      }

      applySuccess(res);
    })();

    return () => {
      cancelled = true;
    };
  }, [effectivelyEnabled, applyFailure, applySuccess, beginFetchPhase, endFetchPhase, finishLoadingAfterMinDelay]);

  useEffect(() => {
    const handleOperationalTasksEvent = (/** @type {Event} */ event) => {
      const detail =
        event instanceof CustomEvent && event.detail != null && typeof event.detail === "object"
          ? /** @type {Record<string, unknown>} */ (event.detail)
          : {};

      if (detail.patched != null) {
        applyImmediatePatch(
          /** @type {{ tasks?: Record<string, unknown>[]; total_tasks?: number }} */ (detail.patched)
        );
      }

      if (detail.force_revalidate !== false) {
        void refetch({ force: true });
      }
    };

    window.addEventListener(OPERATIONAL_TASKS_INVALIDATE_EVENT, handleOperationalTasksEvent);
    return () => window.removeEventListener(OPERATIONAL_TASKS_INVALIDATE_EVENT, handleOperationalTasksEvent);
  }, [applyImmediatePatch, refetch]);

  const invalidateAndRefetch = useCallback(async () => {
    invalidateOperationalTasksCache({ force_revalidate: true });
    return refetch({ force: true });
  }, [refetch]);

  return {
    tasks,
    totalTasks,
    mlInitialSyncPhase,
    initialLoading,
    refreshing,
    /** @deprecated use initialLoading + refreshing */
    loading: initialLoading,
    error,
    hasResolvedOnce,
    refetch,
    invalidateAndRefetch,
  };
}

export { invalidateOperationalTasksCache, notifyProductCostsSaved } from "./operationalTasksApi.js";
