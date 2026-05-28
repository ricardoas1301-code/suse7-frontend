import { useCallback, useEffect, useState } from "react";
import { fetchBillingPlans } from "../services/billingApi";

export function useBillingPlans() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);

  const applyPlansResponse = useCallback((res) => {
    if (!res.ok) {
      setError(res.error || "Não foi possível carregar os planos.");
      setPlans([]);
      return null;
    }
    setPlans(Array.isArray(res.data?.plans) ? res.data.plans : []);
    setError("");
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetchBillingPlans();
    applyPlansResponse(res);
    setLoading(false);
    return res;
  }, [applyPlansResponse]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetchBillingPlans();
      if (!active) return;
      applyPlansResponse(res);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applyPlansResponse]);

  return { loading, error, plans, refresh };
}
