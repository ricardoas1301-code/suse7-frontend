// ======================================================
// DOCUMENTAÇÃO VIVA — CONTEXTO + HOOK
// ------------------------------------------------------
// Mantido separado do Provider (.jsx) para respeitar o
// react-refresh: arquivos de componente só exportam
// componentes; contexto/hook ficam aqui.
// ======================================================

import { createContext, useContext } from "react";

export const DocumentacaoVivaContext = createContext(null);

/** Hook de acesso ao store da documentação viva. */
export function useDocumentacaoVivaStore() {
  const ctx = useContext(DocumentacaoVivaContext);
  if (!ctx) {
    throw new Error("useDocumentacaoVivaStore deve ser usado dentro de <DocumentacaoVivaProvider>");
  }
  return ctx;
}
