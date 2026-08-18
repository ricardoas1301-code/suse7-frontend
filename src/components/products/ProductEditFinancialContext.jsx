// ======================================================================
// Contexto financeiro do modal/página de edição de produto.
// ======================================================================

import { createContext, useContext } from "react";
import { useProductFinancialRayX } from "../../features/products/financial/useProductFinancialRayX.js";

/** @type {import("react").Context<ReturnType<typeof useProductFinancialRayX> | null>} */
const ProductEditFinancialContext = createContext(null);

/**
 * @param {{
 *   productId: string;
 *   enabled?: boolean;
 *   children: import("react").ReactNode;
 * }} props
 */
export function ProductEditFinancialProvider({ productId, enabled = true, children }) {
  const value = useProductFinancialRayX(productId, { enabled });
  return <ProductEditFinancialContext.Provider value={value}>{children}</ProductEditFinancialContext.Provider>;
}

export function useProductEditFinancial() {
  const ctx = useContext(ProductEditFinancialContext);
  if (!ctx) {
    throw new Error("useProductEditFinancial deve ser usado dentro de ProductEditFinancialProvider");
  }
  return ctx;
}

/**
 * Versão opcional — não lança quando fora do provider (aba página sem share).
 * @returns {ReturnType<typeof useProductFinancialRayX> | null}
 */
export function useOptionalProductEditFinancial() {
  return useContext(ProductEditFinancialContext);
}
