import { useCallback, useEffect, useState } from "react";
import { fetchRevenueHealth } from "../services/billingApi";
import { normalizeRevenueHealth } from "../billingFinancialExperienceUi";
import { BILLING_RESILIENCE, withBillingFetchTimeout } from "../billingResilienceUi";

/**
 * Carrega somente a saúde financeira (Histórico financeiro — sem timeline/notificações).
 */
export function useRevenueHealth() {
  const [loading, setLoading] = useState(true);
  const [revenueHealth, setRevenueHealth] = useState(null);
  const [error, setError] = useState("");

  const applyResponse = useCallback((res) => {
    if (!res.ok) {
      setError(res.error || BILLING_RESILIENCE.healthError);
      setRevenueHealth(normalizeRevenueHealth(null));
      return null;
    }
    setRevenueHealth(normalizeRevenueHealth(res.data));
    setError("");
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await withBillingFetchTimeout(fetchRevenueHealth());
    applyResponse(res);
    setLoading(false);
    return res;
  }, [applyResponse]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await withBillingFetchTimeout(fetchRevenueHealth());
      if (!active) return;
      applyResponse(res);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applyResponse]);

  return {
    loading,
    revenueHealth,
    error,
    refresh,
  };
}
