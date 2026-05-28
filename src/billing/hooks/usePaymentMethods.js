import { useCallback, useEffect, useState } from "react";
import { fetchPaymentMethods } from "../services/billingApi";
import { normalizePaymentMethodsList } from "../paymentMethodUi";

export function usePaymentMethods() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [methods, setMethods] = useState([]);

  const applyResponse = useCallback((res) => {
    if (!res.ok) {
      setError(res.error || "Não foi possível carregar as formas de pagamento.");
      setMethods([]);
      return null;
    }
    setMethods(normalizePaymentMethodsList(res.data));
    setError("");
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetchPaymentMethods();
    applyResponse(res);
    setLoading(false);
    return res;
  }, [applyResponse]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetchPaymentMethods();
      if (!active) return;
      applyResponse(res);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applyResponse]);

  return { loading, error, methods, refresh };
}
