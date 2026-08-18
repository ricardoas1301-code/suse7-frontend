// ======================================================
// ADMIN GLOBAL — FEATURES: CONTEXT + HOOK (S1_4)
// ------------------------------------------------------
// Separado do Provider para cumprir react-refresh.
// ======================================================

import { createContext, useContext } from "react";

export const AdminFeaturesContext = createContext(null);

/** Hook de acesso ao estado de features administrativas. */
export function useAdminFeaturesStore() {
  const ctx = useContext(AdminFeaturesContext);
  if (!ctx) {
    throw new Error("useAdminFeaturesStore deve ser usado dentro de AdminFeaturesProvider");
  }
  return ctx;
}
