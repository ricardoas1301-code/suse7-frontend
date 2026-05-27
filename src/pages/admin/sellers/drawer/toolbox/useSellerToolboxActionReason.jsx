import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createSellerToolboxReasonState,
  normalizeSellerToolboxReasonText,
  SELLER_TOOLBOX_REASON_MAX_LENGTH,
  validateSellerToolboxReasonText,
} from "./sellerToolboxActionReasonModel";
import {
  isSubscriptionManagementAuditableOperation,
  validateAdministrativeReason,
} from "./subscriptionManagement/subscriptionManagementAuditModel";

/**
 * @param {string | null | undefined} actionId
 * @param {string} reason
 */
function validateReasonForAction(actionId, reason) {
  if (isSubscriptionManagementAuditableOperation(actionId)) {
    const result = validateAdministrativeReason(reason);
    return {
      isValid: result.valid,
      errorMessage: result.message,
    };
  }

  return validateSellerToolboxReasonText(reason);
}

/** @typedef {import("./sellerToolboxActionReasonModel").SellerToolboxReasonState} SellerToolboxReasonState */

/**
 * @typedef {{
 *   actionId: string;
 *   status: "success" | "error_fake";
 *   metadata?: Record<string, unknown>;
 * }} SellerToolboxCompletedAction
 */

/**
 * @typedef {{
 *   reasonState: SellerToolboxReasonState | null;
 *   isReasonOpen: boolean;
 *   validationError: string;
 *   executingActionId: string | null;
 *   executingMetadata: Record<string, unknown> | null;
 *   completedAction: SellerToolboxCompletedAction | null;
 *   openReason: (input: Partial<SellerToolboxReasonState>) => boolean;
 *   closeReason: () => void;
 *   setReason: (reason: string) => void;
 *   applyQuickReason: (key: string, prefix: string) => void;
 *   validateReason: () => boolean;
 *   clearReason: () => void;
 * }} SellerToolboxActionReasonValue
 */

/** @type {import("react").Context<SellerToolboxActionReasonValue | null>} */
const SellerToolboxActionReasonContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerToolboxActionReasonProvider({ children }) {
  const [reasonState, setReasonState] = useState(/** @type {SellerToolboxReasonState | null} */ (null));
  const [validationError, setValidationError] = useState("");
  const [executingActionId, setExecutingActionId] = useState(/** @type {string | null} */ (null));
  const [executingMetadata, setExecutingMetadata] = useState(
    /** @type {Record<string, unknown> | null} */ (null),
  );
  const [completedAction, setCompletedAction] = useState(
    /** @type {SellerToolboxCompletedAction | null} */ (null),
  );

  const isReasonOpen = reasonState != null;

  const clearReason = useCallback(() => {
    setReasonState(null);
    setValidationError("");
    setExecutingActionId(null);
    setExecutingMetadata(null);
  }, []);

  const closeReason = useCallback(() => {
    clearReason();
  }, [clearReason]);

  const openReason = useCallback((input) => {
    const next = createSellerToolboxReasonState({
      ...input,
      reason: input?.reason ?? "",
      reasonCategory: input?.reasonCategory ?? null,
    });
    if (!next) return false;

    const validation = validateReasonForAction(next.actionId, next.reason);
    setCompletedAction(null);
    setReasonState({
      ...next,
      isValid: validation.isValid,
    });
    setValidationError("");
    setExecutingActionId(null);
    return true;
  }, []);

  const setReason = useCallback((reason) => {
    setReasonState((current) => {
      if (!current) return current;
      const trimmed = normalizeSellerToolboxReasonText(reason).slice(0, SELLER_TOOLBOX_REASON_MAX_LENGTH);
      const validation = validateReasonForAction(current.actionId, trimmed);
      return {
        ...current,
        reason: trimmed,
        isValid: validation.isValid,
      };
    });
    setValidationError("");
  }, []);

  const applyQuickReason = useCallback((key, prefix) => {
    setReasonState((current) => {
      if (!current) return current;
      const trimmedPrefix = normalizeSellerToolboxReasonText(prefix);
      const nextReason = trimmedPrefix
        ? current.reason.startsWith(trimmedPrefix)
          ? current.reason
          : trimmedPrefix
        : current.reason;
      const validation = validateReasonForAction(current.actionId, nextReason);
      return {
        ...current,
        reasonCategory: key,
        reason: nextReason.slice(0, SELLER_TOOLBOX_REASON_MAX_LENGTH),
        isValid: validation.isValid,
      };
    });
    setValidationError("");
  }, []);

  const validateReason = useCallback(() => {
    if (!reasonState) return false;

    if (isSubscriptionManagementAuditableOperation(reasonState.actionId)) {
      const previewRows = reasonState.metadata?.previewRows;
      if (!Array.isArray(previewRows) || previewRows.length === 0) {
        setValidationError("Preview operacional obrigatório antes de executar.");
        return false;
      }
    }

    const validation = validateReasonForAction(reasonState.actionId, reasonState.reason);
    setReasonState((current) =>
      current
        ? {
            ...current,
            isValid: validation.isValid,
          }
        : current,
    );
    setValidationError(validation.errorMessage);
    return validation.isValid;
  }, [reasonState]);

  const value = useMemo(
    () => ({
      reasonState,
      isReasonOpen,
      validationError,
      executingActionId,
      executingMetadata,
      completedAction,
      setExecutingActionId,
      setExecutingMetadata,
      setCompletedAction,
      openReason,
      closeReason,
      setReason,
      applyQuickReason,
      validateReason,
      clearReason,
    }),
    [
      reasonState,
      isReasonOpen,
      validationError,
      executingActionId,
      executingMetadata,
      completedAction,
      openReason,
      closeReason,
      setReason,
      applyQuickReason,
      validateReason,
      clearReason,
    ],
  );

  return (
    <SellerToolboxActionReasonContext.Provider value={value}>
      {children}
    </SellerToolboxActionReasonContext.Provider>
  );
}

export function useSellerToolboxActionReason() {
  const context = useContext(SellerToolboxActionReasonContext);
  if (!context) {
    throw new Error("useSellerToolboxActionReason must be used within SellerToolboxActionReasonProvider");
  }
  return context;
}
