// ======================================================================
// useBillingAccess — provider com retry resiliente (UX)
// ======================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getAuthBootstrapAccessToken } from "../../auth/authBootstrapService";
import { logAuthBootstrap } from "../../auth/authBootstrapDevLog";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { resolveBillingUx } from "../billingAccessUx";
import {
  logPlanPermissionsLoadingGuard,
  PLAN_PERMISSIONS_STATUS_ENDPOINT,
} from "../dev/planPermissionsLoadingGuardDevLog";
import { fetchSubscriptionStatus, invalidateSubscriptionStatusInflight } from "../services/billingApi";
const BillingAccessContext = createContext(null);

const AUTH_LOADING_GUARD_MS = import.meta.env.DEV ? 8_000 : 15_000;
const PERMISSIONS_LOADING_WATCHDOG_MS = import.meta.env.DEV ? 18_000 : 25_000;
const MAX_TRANSIENT_RETRIES = 2;

/** @type {readonly number[]} */
const RETRY_DELAYS_MS = [1000, 2500];

function detectSessionPresent(authReady, authLoading) {
  if (authReady) return true;
  if (authLoading) return Boolean(getAuthBootstrapAccessToken());
  return Boolean(getAuthBootstrapAccessToken());
}

/**
 * @param {{ ok?: boolean; status?: number; timedOut?: boolean; connectionError?: boolean }} res
 */
function isTransientBillingFailure(res) {
  if (res.ok) return false;
  if (res.status === 401 || res.status === 403) return false;
  return Boolean(
    res.connectionError || res.timedOut || res.status === 0 || res.status === 408 || (res.status != null && res.status >= 500)
  );
}

function jitterDelay(baseMs) {
  return Math.round(baseMs + Math.random() * 400);
}

export function BillingAccessProvider({ children }) {
  const { ready: authReady, loading: authLoading } = useAuthBootstrap();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transientRetrying, setTransientRetrying] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState(false);
  const [access, setAccess] = useState(null);
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [breakdowns, setBreakdowns] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusExtras, setStatusExtras] = useState({});
  const [authLoadingGuardExpired, setAuthLoadingGuardExpired] = useState(false);
  const loadAttemptRef = useRef(0);
  const autoFetchDoneRef = useRef(false);
  const sessionTokenRef = useRef(null);
  const transientRetryCountRef = useRef(0);
  const retryTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const scheduleTransientRetryRef = useRef(/** @type {(() => void) | null} */ (null));

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const applyStatusPayload = useCallback(
    (res, { silent = false, guardMeta = {} } = {}) => {
      const isConnectionError = Boolean(
        res.connectionError || res.status === 0 || res.timedOut || res.status === 408
      );
      if (!res.ok) {
        const transient = isTransientBillingFailure(res);
        const canDeferError = transient && transientRetryCountRef.current < MAX_TRANSIENT_RETRIES;

        if (canDeferError) {
          setTransientRetrying(true);
          setConnectionError(isConnectionError);
          setError("");
          if (!silent) setLoading(false);
          setRefreshing(false);
          logPlanPermissionsLoadingGuard({
            status: res.status ?? 0,
            duration_ms: guardMeta.durationMs ?? null,
            error_message: res.error ?? "transient_deferred",
            fallback_applied: false,
            user_session: guardMeta.userSession ?? "unknown",
            trigger: "transient_retry_deferred",
            ...guardMeta,
          });
          queueMicrotask(() => scheduleTransientRetryRef.current?.());
          return null;
        }

        setTransientRetrying(false);
        setConnectionError(isConnectionError);
        setError(
          res.error ||
            (res.timedOut
              ? "Tempo esgotado ao carregar as permissões do plano. Verifique o backend e tente novamente."
              : isConnectionError
                ? "Não foi possível carregar as permissões do plano. Verifique a conexão com o backend e tente novamente."
                : "Não foi possível carregar a assinatura.")
        );
        setAccess(null);
        setLimits(null);
        setUsage(null);
        setBreakdowns(null);
        setPlan(null);
        setSubscriptions([]);
        setStatusExtras({});
        if (!silent) setLoading(false);
        setRefreshing(false);
        logPlanPermissionsLoadingGuard({
          status: res.status ?? 0,
          duration_ms: guardMeta.durationMs ?? null,
          error_message: res.error ?? res.errorMessage ?? "subscription_status_failed",
          fallback_applied: Boolean(guardMeta.fallbackApplied),
          user_session: guardMeta.userSession ?? "unknown",
          ...guardMeta,
        });
        return null;
      }

      transientRetryCountRef.current = 0;
      setTransientRetrying(false);
      const payload = res.data ?? {};
      const resolvedAccess = {
        ...(payload.access ?? {}),
        can_access: Boolean(payload.can_access ?? payload.access?.can_access),
      };
      setAccess(resolvedAccess);
      setLimits(payload.limits ?? null);
      setUsage(payload.usage ?? null);
      setBreakdowns(payload.breakdowns ?? null);
      setPlan(payload.plan ?? null);
      setSubscriptions(Array.isArray(payload.subscriptions) ? payload.subscriptions : []);
      setStatusExtras({
        overdue_invoice_url: payload.overdue_invoice_url ?? null,
        delinquency_status: payload.delinquency_status ?? null,
        overdue_since: payload.overdue_since ?? null,
        grace_period_ends_at: payload.grace_period_ends_at ?? null,
        access_suspended_at: payload.access_suspended_at ?? null,
        delinquency_warning: payload.delinquency_warning ?? false,
        plan_change_at_period_end: payload.plan_change_at_period_end ?? false,
        plan_change_requested_at: payload.plan_change_requested_at ?? null,
        plan_change_target_plan_slug: payload.plan_change_target_plan_slug ?? null,
        plan_change_access_ends_at: payload.plan_change_access_ends_at ?? null,
        active_subscription: payload.active_subscription ?? null,
        pending_checkout: payload.pending_checkout ?? null,
        pending_renewal: payload.pending_renewal ?? null,
        renewal_notice: payload.renewal_notice ?? null,
        subscription_status: payload.subscription_status ?? null,
        access_status: payload.access_status ?? "FULL",
        access_restrictions: payload.access_restrictions ?? {
          operational_blocked: false,
          allowed_path_prefixes: [],
          blocked_path_prefixes: [],
          reason: null,
        },
        grace_period_until: payload.grace_period_until ?? null,
        show_usage_growth_notice: payload.show_usage_growth_notice ?? false,
        usage_growth_grace: payload.usage_growth_grace ?? null,
      });
      setError("");
      setConnectionError(false);
      if (!silent) setLoading(false);
      setRefreshing(false);
      logPlanPermissionsLoadingGuard({
        status: res.status ?? 200,
        duration_ms: guardMeta.durationMs ?? null,
        error_message: null,
        fallback_applied: false,
        user_session: guardMeta.userSession ?? "unknown",
        ...guardMeta,
      });
      return payload;
    },
    []
  );

  const loadSubscriptionStatus = useCallback(
    async ({ silent = false, guardMeta = {} } = {}) => {
      const startedAt = performance.now();
      const userSession = detectSessionPresent(authReady, authLoading) ? "present" : "absent";
      const res = await fetchSubscriptionStatus();
      const durationMs = Math.round(performance.now() - startedAt);
      return applyStatusPayload(res, {
        silent,
        guardMeta: {
          endpoint: PLAN_PERMISSIONS_STATUS_ENDPOINT,
          userSession,
          durationMs,
          fallbackApplied:
            import.meta.env.DEV &&
            userSession === "present" &&
            Boolean(res.connectionError || res.timedOut || res.status === 0 || res.status === 408),
          ...guardMeta,
        },
      });
    },
    [applyStatusPayload, authReady, authLoading]
  );

  const scheduleTransientRetry = useCallback(() => {
    clearRetryTimer();
    if (transientRetryCountRef.current >= MAX_TRANSIENT_RETRIES) {
      setTransientRetrying(false);
      setConnectionError(true);
      setError(
        "Tempo esgotado ao carregar as permissões do plano. Verifique o backend e tente novamente."
      );
      return;
    }
    const delay = jitterDelay(RETRY_DELAYS_MS[transientRetryCountRef.current] ?? 2500);
    transientRetryCountRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      invalidateSubscriptionStatusInflight();
      loadSubscriptionStatus({
        silent: true,
        guardMeta: { trigger: `transient_retry_${transientRetryCountRef.current}` },
      });
    }, delay);
  }, [clearRetryTimer, loadSubscriptionStatus]);

  scheduleTransientRetryRef.current = scheduleTransientRetry;

  useEffect(() => {
    return () => {
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  const refresh = useCallback(
    async ({ silent = true } = {}) => {
      clearRetryTimer();
      transientRetryCountRef.current = 0;
      setTransientRetrying(false);
      invalidateSubscriptionStatusInflight();
      setError("");
      setConnectionError(false);
      if (silent) setRefreshing(true);
      else setLoading(true);
      return loadSubscriptionStatus({ silent, guardMeta: { trigger: "manual_refresh" } });
    },
    [clearRetryTimer, loadSubscriptionStatus]
  );

  useEffect(() => {
    if (!authLoading) {
      setAuthLoadingGuardExpired(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setAuthLoadingGuardExpired(true);
      logPlanPermissionsLoadingGuard({
        status: null,
        duration_ms: AUTH_LOADING_GUARD_MS,
        error_message: "auth_loading_timeout",
        fallback_applied: import.meta.env.DEV && Boolean(getAuthBootstrapAccessToken()),
        user_session: getAuthBootstrapAccessToken() ? "present" : "absent",
        trigger: "auth_loading_guard",
      });
    }, AUTH_LOADING_GUARD_MS);

    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (authLoading && !authLoadingGuardExpired) return;

    const sessionPresent = detectSessionPresent(authReady, authLoading);
    const sessionToken = getAuthBootstrapAccessToken() || null;
    if (sessionToken !== sessionTokenRef.current) {
      sessionTokenRef.current = sessionToken;
      autoFetchDoneRef.current = false;
      transientRetryCountRef.current = 0;
    }

    if (!sessionPresent) {
      autoFetchDoneRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setError("");
      setConnectionError(false);
      setTransientRetrying(false);
      return undefined;
    }

    if (autoFetchDoneRef.current) return undefined;
    autoFetchDoneRef.current = true;

    const attemptId = ++loadAttemptRef.current;
    let active = true;

    (async () => {
      await loadSubscriptionStatus({
        silent: false,
        guardMeta: {
          trigger: authLoadingGuardExpired ? "auth_guard_expired_fetch" : "initial_fetch",
        },
      });
      if (!active || attemptId !== loadAttemptRef.current) return;

      logAuthBootstrap("permissions_ready", {
        auth_loading_guard_expired: authLoadingGuardExpired,
      });
    })();

    return () => {
      active = false;
    };
  }, [authLoading, authReady, authLoadingGuardExpired, loadSubscriptionStatus]);

  useEffect(() => {
    if (!loading) return undefined;

    const watchdog = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
      setConnectionError(true);
      setError(
        "Tempo esgotado ao carregar as permissões do plano. Verifique o backend e tente novamente."
      );
      logPlanPermissionsLoadingGuard({
        status: 408,
        duration_ms: PERMISSIONS_LOADING_WATCHDOG_MS,
        error_message: "permissions_loading_watchdog",
        fallback_applied: import.meta.env.DEV && Boolean(getAuthBootstrapAccessToken()),
        user_session: getAuthBootstrapAccessToken() ? "present" : "absent",
        trigger: "permissions_loading_watchdog",
      });
    }, PERMISSIONS_LOADING_WATCHDOG_MS);

    return () => clearTimeout(watchdog);
  }, [loading]);

  const ux = useMemo(
    () => resolveBillingUx(access, subscriptions, statusExtras),
    [access, subscriptions, statusExtras]
  );

  const value = useMemo(
    () => ({
      loading,
      refreshing,
      transientRetrying,
      error,
      connectionError,
      access,
      limits,
      usage,
      breakdowns,
      plan,
      subscriptions,
      statusExtras,
      refresh,
      canAccess: Boolean(access?.can_access),
      ux,
    }),
    [
      loading,
      refreshing,
      transientRetrying,
      error,
      connectionError,
      access,
      limits,
      usage,
      breakdowns,
      plan,
      subscriptions,
      statusExtras,
      refresh,
      ux,
    ]
  );

  return <BillingAccessContext.Provider value={value}>{children}</BillingAccessContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBillingAccess() {
  const ctx = useContext(BillingAccessContext);
  if (!ctx) {
    throw new Error("useBillingAccess deve ser usado dentro de BillingAccessProvider");
  }
  return ctx;
}
