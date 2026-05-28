import { useCallback, useEffect, useState } from "react";
import { fetchPaymentHistory } from "../services/billingApi";
import { normalizePaymentHistoryList } from "../paymentHistoryUi";

export function usePaymentHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);

  const applyResponse = useCallback((res) => {
    if (!res.ok) {
      setError(res.error || "Não foi possível carregar o histórico de pagamentos.");
      setPayments([]);
      return null;
    }
    setPayments(normalizePaymentHistoryList(res.data));
    setError("");
    return res.data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetchPaymentHistory();
    applyResponse(res);
    setLoading(false);
    return res;
  }, [applyResponse]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetchPaymentHistory();
      if (!active) return;
      applyResponse(res);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applyResponse]);

  return { loading, error, payments, refresh };
}
