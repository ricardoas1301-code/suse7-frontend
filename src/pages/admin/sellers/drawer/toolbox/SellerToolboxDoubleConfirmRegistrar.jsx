import { useEffect } from "react";
import {
  registerToolboxDoubleConfirmHandler,
  unregisterToolboxDoubleConfirmHandler,
} from "./sellerToolboxDoubleConfirmRegistry";
import { useSellerToolboxConfirmAction } from "./useSellerToolboxConfirmAction";

/**
 * Registra handler para confirmação dupla Dev Center → Seller Toolbox.
 */
export function SellerToolboxDoubleConfirmRegistrar() {
  const { openConfirm } = useSellerToolboxConfirmAction();

  useEffect(() => {
    registerToolboxDoubleConfirmHandler((acao) => {
      const pending = acao.metadados?.__toolboxPendingConfirm;
      if (pending && typeof pending === "object") {
        openConfirm(pending);
      }
    });

    return () => unregisterToolboxDoubleConfirmHandler();
  }, [openConfirm]);

  return null;
}
