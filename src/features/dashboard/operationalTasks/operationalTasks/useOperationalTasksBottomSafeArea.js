import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { startOperationalTasksBottomSafeAreaWatch } from "./operationalTasksBottomSafeArea.js";

/**
 * @param {boolean} enabled
 */
export function useOperationalTasksBottomSafeArea(enabled) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!enabled) {
      return startOperationalTasksBottomSafeAreaWatch({ enabled: false, pathname });
    }

    return startOperationalTasksBottomSafeAreaWatch({ enabled: true, pathname });
  }, [enabled, pathname]);
}
