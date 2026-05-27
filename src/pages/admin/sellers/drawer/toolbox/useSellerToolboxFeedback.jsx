import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { normalizeSellerToolboxFeedback } from "./sellerToolboxFeedbackModel";

/** @typedef {import("./sellerToolboxFeedbackModel").SellerToolboxFeedbackState} SellerToolboxFeedbackState */

/**
 * @typedef {{
 *   feedbackState: SellerToolboxFeedbackState | null;
 *   isVisible: boolean;
 *   showFeedback: (input: Partial<SellerToolboxFeedbackState>) => boolean;
 *   clearFeedback: () => void;
 * }} SellerToolboxFeedbackValue
 */

/** @type {import("react").Context<SellerToolboxFeedbackValue | null>} */
const SellerToolboxFeedbackContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerToolboxFeedbackProvider({ children }) {
  const [feedbackState, setFeedbackState] = useState(/** @type {SellerToolboxFeedbackState | null} */ (null));

  const isVisible = feedbackState != null;

  const clearFeedback = useCallback(() => {
    setFeedbackState(null);
  }, []);

  const showFeedback = useCallback((input) => {
    const normalized = normalizeSellerToolboxFeedback(input);
    if (!normalized) return false;
    setFeedbackState(normalized);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      feedbackState,
      isVisible,
      showFeedback,
      clearFeedback,
    }),
    [feedbackState, isVisible, showFeedback, clearFeedback],
  );

  return (
    <SellerToolboxFeedbackContext.Provider value={value}>{children}</SellerToolboxFeedbackContext.Provider>
  );
}

export function useSellerToolboxFeedback() {
  const context = useContext(SellerToolboxFeedbackContext);
  if (!context) {
    throw new Error("useSellerToolboxFeedback must be used within SellerToolboxFeedbackProvider");
  }
  return context;
}
