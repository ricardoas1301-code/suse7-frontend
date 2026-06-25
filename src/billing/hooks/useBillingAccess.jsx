import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { logAuthBootstrap } from "../../auth/authBootstrapDevLog";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { resolveBillingUx } from "../billingAccessUx";
import { fetchSubscriptionStatus } from "../services/billingApi";

const BillingAccessContext = createContext(null);

export function BillingAccessProvider({ children }) {
  const { ready: authReady, loading: authLoading } = useAuthBootstrap();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState(false);
  const [access, setAccess] = useState(null);
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [breakdowns, setBreakdowns] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusExtras, setStatusExtras] = useState({});

  const applyStatusPayload = useCallback((res, { silent = false } = {}) => {
    const isConnectionError = Boolean(res.connectionError || res.status === 0);
    if (!res.ok) {
      setConnectionError(isConnectionError);
      setError(
        res.error ||
          (isConnectionError
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
      return null;
    }
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
    return payload;
  }, []);

  const refresh = useCallback(
    async ({ silent = true } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const res = await fetchSubscriptionStatus();
      return applyStatusPayload(res, { silent });
    },
    [applyStatusPayload]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!authReady) {
      setLoading(false);
      setRefreshing(false);
      setError("");
      setConnectionError(false);
      return;
    }

    let active = true;
    (async () => {
      const res = await fetchSubscriptionStatus();
      if (!active) return;
      applyStatusPayload(res, { silent: false });
      logAuthBootstrap("permissions_ready", {
        ok: res.ok,
        status: res.status,
      });
    })();
    return () => {
      active = false;
    };
  }, [authLoading, authReady, applyStatusPayload]);

  const ux = useMemo(
    () => resolveBillingUx(access, subscriptions, statusExtras),
    [access, subscriptions, statusExtras]
  );

  const value = useMemo(
    () => ({
      loading,
      refreshing,
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
