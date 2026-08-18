// ======================================================
// S4.3.6.26 — Strategy ML de hidratação de cenário promocional.
// Fronteira multi-marketplace: só este módulo conhece o endpoint ML.
// ======================================================

import { sanitizarCenarioSimuladoBrutoPromocao } from "../../features/pricing/promotions/aplicarReducaoTarifaPromocaoNoCenario.js";
import {
  montarPayloadSelecaoPromocaoSimulacao,
  simularCenarioListingTypeOficial,
} from "../../utils/simulateListingTypeScenarioOficial.js";
import { chaveCacheSimulacaoOficial } from "../../utils/simulateListingTypeScenarioKeys.js";
import {
  getOrFetchSimulacaoOficialCache,
  peekSimulacaoOficialCache,
  setSimulacaoOficialCache,
} from "../../utils/simulacaoOficialListingTypeCache.js";
import { extrairContextoSelecaoPromocao } from "./pricingPromotionClassicPremiumScenario.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: ListingTypeChoice;
 *   salePrice: number;
 *   scenario: unknown;
 *   configuracaoFinanceira?: unknown;
 *   selectedFinalPriceOverride?: string | number | null;
 * }} params
 */
export function montarChaveHidratacaoPromocaoMl(params) {
  const ctx = extrairContextoSelecaoPromocao(params.scenario);
  const promotionId =
    ctx.promotion_id != null && String(ctx.promotion_id).trim() !== ""
      ? String(ctx.promotion_id).trim()
      : null;
  return chaveCacheSimulacaoOficial({
    listingExternalId: params.listingExternalId,
    listingId: params.listingId,
    listingType: params.listingType,
    kind: "preco",
    value: params.salePrice,
    configuracaoFinanceira:
      /** @type {import("../../utils/simulateListingTypeScenarioOficial.js").ConfiguracaoFinanceiraExtras | null} */ (
        params.configuracaoFinanceira ?? null
      ),
    promotionId,
  });
}

/**
 * Hidrata um cenário promocional via resolver oficial ML + cache compartilhado.
 * Deduplica inflight com cards Classic/Premium e Comparativo via getOrFetch.
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: ListingTypeChoice;
 *   salePrice: number;
 *   scenario: unknown;
 *   configuracaoFinanceira?: unknown;
 *   selectedFinalPriceOverride?: string | number | null;
 *   revision?: number;
 * }} params
 * @returns {Promise<{
 *   ok: boolean;
 *   fromCache: boolean;
 *   cacheKey: string;
 *   revision: number;
 *   estado: import("../../utils/simulacaoOficialListingTypeCache.js").EstadoSimulacaoTipoCache | null;
 *   error?: string;
 * }>}
 */
export async function hidratarCenarioPromocaoMercadoLivre(params) {
  const salePrice = Math.round(Number(params.salePrice) * 100) / 100;
  const revision = params.revision ?? 0;
  const cacheKey = montarChaveHidratacaoPromocaoMl({ ...params, salePrice });

  const hitAntes = peekSimulacaoOficialCache(cacheKey);
  if (hitAntes?.scenario != null) {
    return { ok: true, fromCache: true, cacheKey, revision, estado: hitAntes };
  }

  const ctx = extrairContextoSelecaoPromocao(params.scenario);
  const selectedFinal =
    params.selectedFinalPriceOverride != null && String(params.selectedFinalPriceOverride).trim() !== ""
      ? String(params.selectedFinalPriceOverride).trim()
      : salePrice > 0
        ? String(salePrice)
        : ctx.selected_final_price;
  const promotionSelection = montarPayloadSelecaoPromocaoSimulacao({
    ...ctx,
    selected_final_price: selectedFinal,
  });

  const { estado, fromCache } = await getOrFetchSimulacaoOficialCache(cacheKey, async () => {
    const res = await simularCenarioListingTypeOficial({
      listingExternalId: params.listingExternalId,
      listingId: params.listingId,
      listingType: params.listingType,
      salePrice,
      configuracaoFinanceira:
        /** @type {import("../../utils/simulateListingTypeScenarioOficial.js").ConfiguracaoFinanceiraExtras | null} */ (
          params.configuracaoFinanceira ?? null
        ),
      promotionSelection,
    });

    if (!res.ok || res.data?.scenario == null) return null;

    const simBruto = sanitizarCenarioSimuladoBrutoPromocao(res.data.scenario);
    if (simBruto == null) return null;

    const data = /** @type {Record<string, unknown>} */ (res.data);
    const financial =
      data.financial != null && typeof data.financial === "object"
        ? /** @type {Record<string, unknown>} */ (data.financial)
        : null;
    const resCenario =
      simBruto.result != null && typeof simBruto.result === "object"
        ? /** @type {Record<string, unknown>} */ (simBruto.result)
        : null;
    const resolvedMarginRaw = resCenario?.margin_pct ?? financial?.margin_percent ?? null;
    const resolvedMargin =
      resolvedMarginRaw != null && String(resolvedMarginRaw).trim() !== ""
        ? Number(String(resolvedMarginRaw).replace(",", "."))
        : null;

    /** @type {import("../../utils/simulacaoOficialListingTypeCache.js").EstadoSimulacaoTipoCache} */
    const novo = {
      scenario: simBruto,
      loading: false,
      erro: null,
      resolvedPrice: salePrice,
      resolvedMargin: Number.isFinite(resolvedMargin) ? resolvedMargin : null,
      commissionSource: null,
      feePercent: null,
      key: cacheKey,
    };
    setSimulacaoOficialCache(cacheKey, novo);
    return novo;
  });

  if (estado?.scenario == null) {
    return {
      ok: false,
      fromCache: false,
      cacheKey,
      revision,
      estado: null,
      error: "Falha ao hidratar promoção",
    };
  }

  return { ok: true, fromCache: Boolean(fromCache), cacheKey, revision, estado };
}

/** Interface conceitual multi-marketplace. */
export const MercadoLivrePromotionScenarioHydrationStrategy = {
  id: "mercadolivre",
  montarChave: montarChaveHidratacaoPromocaoMl,
  hidratar: hidratarCenarioPromocaoMercadoLivre,
};
