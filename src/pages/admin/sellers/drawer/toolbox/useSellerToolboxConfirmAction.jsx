import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { normalizeSellerToolboxPendingAction } from "./sellerToolboxConfirmActionModel";

/** @typedef {import("./sellerToolboxConfirmActionModel").SellerToolboxPendingAction} SellerToolboxPendingAction */

/**
 * @typedef {{
 *   pendingAction: SellerToolboxPendingAction | null;
 *   isConfirmOpen: boolean;
 *   openConfirm: (action: Partial<SellerToolboxPendingAction>) => boolean;
 *   closeConfirm: () => void;
 *   confirmFake: () => void;
 * }} SellerToolboxConfirmActionValue
 */

/** @type {import("react").Context<SellerToolboxConfirmActionValue | null>} */
const SellerToolboxConfirmActionContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SellerToolboxConfirmActionProvider({ children }) {
  const [pendingAction, setPendingAction] = useState(/** @type {SellerToolboxPendingAction | null} */ (null));

  const isConfirmOpen = pendingAction != null;

  const closeConfirm = useCallback(() => {
    setPendingAction(null);
  }, []);

  const openConfirm = useCallback((action) => {
    const normalized = normalizeSellerToolboxPendingAction(action);
    if (!normalized) return false;
    setPendingAction(normalized);
    return true;
  }, []);

  const confirmFake = useCallback(() => {
    setPendingAction(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingAction,
      isConfirmOpen,
      openConfirm,
      closeConfirm,
      confirmFake,
    }),
    [pendingAction, isConfirmOpen, openConfirm, closeConfirm, confirmFake],
  );

  return (
    <SellerToolboxConfirmActionContext.Provider value={value}>{children}</SellerToolboxConfirmActionContext.Provider>
  );
}

export function useSellerToolboxConfirmAction() {
  const context = useContext(SellerToolboxConfirmActionContext);
  if (!context) {
    throw new Error("useSellerToolboxConfirmAction must be used within SellerToolboxConfirmActionProvider");
  }
  return context;
}
