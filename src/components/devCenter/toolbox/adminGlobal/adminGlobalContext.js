// ======================================================
// ADMIN GLOBAL — CONTEXT + HOOK (S1_2.4)
// ------------------------------------------------------
// Separado do Provider para cumprir react-refresh
// (arquivo de componente exporta apenas componentes).
// ======================================================

import { createContext, useContext } from "react";

export const AdminGlobalContext = createContext(null);

/** Hook de acesso ao estado administrativo global. */
export function useAdminGlobalStore() {
  const ctx = useContext(AdminGlobalContext);
  if (!ctx) {
    throw new Error("useAdminGlobalStore deve ser usado dentro de AdminGlobalProvider");
  }
  return ctx;
}
