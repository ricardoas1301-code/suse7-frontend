// ======================================================
// Cliente — simulação oficial de cenário por tipo de anúncio (Precificação Inteligente).
// Liga o frontend ao resolver backend (engine homologada Anúncios/Raio-X).
// O frontend NÃO calcula frete/comissão/repasse: só envia o cenário e renderiza o oficial.
// ======================================================

import { apiFetch, buildApiUrl } from "../config/api";
import {
  chaveCacheSimulacaoOficial,
  chaveExtrasPrecificacaoInteligente,
  montarPayloadExtrasPrecificacaoInteligente,
} from "./simulateListingTypeScenarioKeys.js";

export {
  chaveCacheSimulacaoOficial,
  chaveExtrasPrecificacaoInteligente,
  montarPayloadExtrasPrecificacaoInteligente,
};

/**
 * @typedef {import("./simulateListingTypeScenarioKeys.js").ConfiguracaoFinanceiraExtras} ConfiguracaoFinanceiraExtras
 */

/**
 * @param {{
 *   promotion_id?: string | null;
 *   promotion_name?: string | null;
 *   promotion_type?: string | null;
 *   selected_final_price?: string | null;
 *   selected_discount_amount?: string | null;
 *   selected_rule?: string | null;
 *   source_trace?: unknown;
 * } | null | undefined} ctx
 */
export function montarPayloadSelecaoPromocaoSimulacao(ctx) {
  if (ctx == null || typeof ctx !== "object") return null;
  if (ctx.promotion_id == null && ctx.selected_final_price == null) return null;
  return {
    promotionId: ctx.promotion_id,
    promotion_id: ctx.promotion_id,
    promotion_name: ctx.promotion_name,
    promotion_type: ctx.promotion_type,
    selected_final_price: ctx.selected_final_price,
    selected_discount_amount: ctx.selected_discount_amount,
    selected_rule: ctx.selected_rule,
    source_trace: ctx.source_trace,
  };
}

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   salePrice?: string | number | null;
 *   targetMarginPct?: string | number | null;
 *   configuracaoFinanceira?: ConfiguracaoFinanceiraExtras | null;
 *   promotionSelection?: ReturnType<typeof montarPayloadSelecaoPromocaoSimulacao>;
 * }} params
 * @returns {Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>}
 */
export async function simularCenarioListingTypeOficial(params) {
  const url = buildApiUrl("/api/ml/listings/pricing-simulate-scenario");
  if (!url) return { ok: false, error: "API não configurada" };

  /** @type {Record<string, unknown>} */
  const body = { listingType: params.listingType === "premium" ? "premium" : "classic" };
  if (params.listingExternalId != null && String(params.listingExternalId).trim() !== "") {
    body.listingExternalId = String(params.listingExternalId).trim();
  }
  if (params.listingId != null && String(params.listingId).trim() !== "") {
    body.listingId = String(params.listingId).trim();
  }
  if (params.salePrice != null && String(params.salePrice).trim() !== "") {
    body.salePrice = params.salePrice;
  }
  if (params.targetMarginPct != null && String(params.targetMarginPct).trim() !== "") {
    body.targetMarginPct = params.targetMarginPct;
  }

  const extras = montarPayloadExtrasPrecificacaoInteligente(params.configuracaoFinanceira);
  if (extras != null) {
    body.financialExtras = extras;
  }

  if (params.promotionSelection != null && typeof params.promotionSelection === "object") {
    body.promotionSelection = params.promotionSelection;
  }

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, error: res.error ?? "Falha ao simular o cenário oficial." };
  }
  return { ok: true, data: res.data ?? {} };
}
