// ======================================================
// ADMIN GLOBAL — CONFIRMAÇÃO DUPLA: CONTEXT + HOOK (S1_5.5)
// ------------------------------------------------------
// Separado do Provider para cumprir react-refresh.
// ======================================================

import { createContext, useContext } from "react";

export const AdminConfirmContext = createContext(null);

/** Hook de confirmação dupla administrativa. */
export function useAdminConfirm() {
  const ctx = useContext(AdminConfirmContext);
  if (!ctx) {
    throw new Error("useAdminConfirm deve ser usado dentro de AdminConfirmProvider");
  }
  return ctx;
}
