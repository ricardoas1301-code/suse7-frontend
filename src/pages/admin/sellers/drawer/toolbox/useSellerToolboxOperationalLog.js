import { useCallback, useRef } from "react";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  clearSellerToolboxOperationalLogs,
  getSellerToolboxOperationalLogs,
  recordSellerToolboxOperation,
} from "./sellerToolboxOperationalLog";

/**
 * Hook local — buffer em módulo (ref estável, sem rerender global).
 */
export function useSellerToolboxOperationalLog() {
  const { sellerId } = useSellerToolbox();
  const sellerIdRef = useRef(sellerId);
  sellerIdRef.current = sellerId;

  const logOperation = useCallback(
    /**
     * @param {{
     *   event: string;
     *   category: import("./sellerToolboxOperationalLog").SellerToolboxOperationCategory;
     *   sellerId?: string | null;
     *   metadata?: Record<string, unknown> | null;
     * }} input
     */
    ({ event, category, sellerId: overrideSellerId = null, metadata = null }) =>
      recordSellerToolboxOperation({
        event,
        category,
        sellerId: overrideSellerId ?? sellerIdRef.current,
        metadata,
      }),
    [],
  );

  const getLogs = useCallback(() => getSellerToolboxOperationalLogs(), []);

  const clearLogs = useCallback(() => {
    clearSellerToolboxOperationalLogs();
  }, []);

  return {
    logOperation,
    getLogs,
    clearLogs,
  };
}
