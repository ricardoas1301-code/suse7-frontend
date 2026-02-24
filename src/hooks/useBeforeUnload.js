// ======================================================================
// SUSE7 — useBeforeUnload
// Proteção ao fechar/recarregar com alterações não salvas.
// NÃO usa useBlocker (requer Data Router). Usa beforeunload nativo.
// ======================================================================

import { useEffect } from "react";

/**
 * Exibe confirmação nativa do browser ao fechar/recarregar quando dirty.
 * @param {boolean} isDirty - se true, ativa o aviso
 */
export function useBeforeUnload(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
