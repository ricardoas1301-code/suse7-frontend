import { useEffect, useState } from "react";
import {
  getCanonicalBusinessDateKey,
  msUntilNextCanonicalMidnight,
} from "../paymentHistoryPresentation";

/**
 * Data civil canônica do negócio, recalculada na virada do dia e ao retornar à aba.
 */
export function useCanonicalBusinessDate() {
  const [businessDateKey, setBusinessDateKey] = useState(() => getCanonicalBusinessDateKey());

  useEffect(() => {
    function refreshBusinessDate() {
      setBusinessDateKey(getCanonicalBusinessDateKey());
    }

    let timeoutId = window.setTimeout(function scheduleNextTick() {
      refreshBusinessDate();
      timeoutId = window.setTimeout(scheduleNextTick, msUntilNextCanonicalMidnight());
    }, msUntilNextCanonicalMidnight());

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshBusinessDate();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return businessDateKey;
}
