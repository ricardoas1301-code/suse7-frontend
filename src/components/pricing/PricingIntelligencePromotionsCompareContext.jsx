// ======================================================
// PI — Provider da comparação de promoções (detalhe + picker compacto).
// ======================================================

import { createContext, useContext } from "react";

import { usePricingIntelligencePromocoesCompare } from "./usePricingIntelligencePromocoesCompare.js";

/** @typedef {ReturnType<typeof usePricingIntelligencePromocoesCompare>} PromocoesCompareApi */

const PromocoesCompareContext = createContext(/** @type {PromocoesCompareApi | null} */ (null));

/**
 * @param {{
 *   rows: { scenario: unknown; group: string }[];
 *   listingHintForAudit?: string;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown; group: string } | null;
 *   catalogRow?: Record<string, unknown> | null | undefined;
 *   configuracaoFinanceira?: Record<string, unknown>;
 *   children: import("react").ReactNode;
 * }} props
 */
export function PricingIntelligencePromotionsCompareProvider({
  rows,
  listingHintForAudit = "",
  mlScenariosPayload = null,
  baselineRow = null,
  catalogRow = null,
  configuracaoFinanceira = {},
  children,
}) {
  const api = usePricingIntelligencePromocoesCompare(
    rows,
    listingHintForAudit,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    configuracaoFinanceira,
  );
  return <PromocoesCompareContext.Provider value={api}>{children}</PromocoesCompareContext.Provider>;
}

export function usePromocoesCompareContext() {
  const ctx = useContext(PromocoesCompareContext);
  if (ctx == null) {
    throw new Error("usePromocoesCompareContext deve ser usado dentro de PricingIntelligencePromotionsCompareProvider");
  }
  return ctx;
}

/** S4.3.6.21 — Comparativo pode montar fora da aba Promoções. */
export function useOptionalPromocoesCompareContext() {
  return useContext(PromocoesCompareContext);
}
