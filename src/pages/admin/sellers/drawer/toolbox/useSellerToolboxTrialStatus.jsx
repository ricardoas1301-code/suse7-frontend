import { createContext, useCallback, useContext, useMemo, useState } from "react";

/** @typedef {"active" | "ended"} SellerToolboxTrialStatus */

/**
 * @typedef {{
 *   trialStatus: SellerToolboxTrialStatus;
 *   applyTrialStatusFromOperation: (trialStatus: SellerToolboxTrialStatus) => void;
 *   resetTrialStatus: () => void;
 * }} SellerToolboxTrialStatusValue
 */

/** @type {import("react").Context<SellerToolboxTrialStatusValue | null>} */
const SellerToolboxTrialStatusContext = createContext(null);

const DEFAULT_TRIAL_STATUS = /** @type {SellerToolboxTrialStatus} */ ("ended");

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerToolboxTrialStatusProvider({ children }) {
  const [trialStatus, setTrialStatus] = useState(/** @type {SellerToolboxTrialStatus} */ (DEFAULT_TRIAL_STATUS));

  const applyTrialStatusFromOperation = useCallback((nextStatus) => {
    if (nextStatus !== "active" && nextStatus !== "ended") return;
    setTrialStatus(nextStatus);
  }, []);

  const resetTrialStatus = useCallback(() => {
    setTrialStatus(DEFAULT_TRIAL_STATUS);
  }, []);

  const value = useMemo(
    () => ({
      trialStatus,
      applyTrialStatusFromOperation,
      resetTrialStatus,
    }),
    [trialStatus, applyTrialStatusFromOperation, resetTrialStatus],
  );

  return (
    <SellerToolboxTrialStatusContext.Provider value={value}>
      {children}
    </SellerToolboxTrialStatusContext.Provider>
  );
}

export function useSellerToolboxTrialStatus() {
  const context = useContext(SellerToolboxTrialStatusContext);
  if (!context) {
    throw new Error("useSellerToolboxTrialStatus must be used within SellerToolboxTrialStatusProvider");
  }
  return context;
}
