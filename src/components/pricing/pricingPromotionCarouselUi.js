// ======================================================
// PI — Promoções: metadados dos mini-cards (somente apresentação).
// Status alinhado ao rail legado (`PricingScenarioRailItem` + `resolveRaioxListingBadge`).
// ======================================================

import {
  resolveRaioxListingBadge,
  resolveSaleXrayArticleKey,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import { resolverPrecoVendaPromocaoPainelExibicao } from "./pricingPromotionMoneyUi.js";
import {
  normalizarNomePromocaoExibicaoUi,
  resolverElegibilidadeMiniCardPromocao,
  resolverPeriodoMiniCardPromocao,
  resolverPromocaoRelampago,
  resolverRotuloDescontoMiniCardPromocao,
  resolverRotuloDescontoReaisMiniCardPromocao,
} from "./pricingPromotionMiniCardUi.js";

import { resolverLinhasFundingMiniCardPromocao } from "../../features/pricing/promotions/mercadoLivrePromotionFundingUi.js";

/**
 * @param {unknown} scenario
 * @returns {string | null}
 */
function resolverPrecoPromocaoHint(scenario) {
  return resolverPrecoVendaPromocaoPainelExibicao(scenario);
}

/**
 * @param {unknown} scenario
 * @returns {string | null}
 */
function resolverDescontoPromocaoHint(scenario) {
  return resolverRotuloDescontoMiniCardPromocao(scenario);
}

// Re-export centralizado para mini cards e cards centrais.
export { resolverPrecoVendaPromocaoPainelExibicao } from "./pricingPromotionMoneyUi.js";

/** @typedef {"ativa" | "programada" | "disponivel" | "neutro"} PromotionStatusKind */

function resolverDescontoReaisPromocaoHint(scenario) {
  return resolverRotuloDescontoReaisMiniCardPromocao(scenario);
}

/**
 * Id estável por promotion_id|type|offer_id — não usar índice como vínculo principal.
 *
 * @param {unknown} scenario
 * @param {number} index
 */
export function resolvePromotionSelectionId(row, index) {
  const scenario = row?.scenario;
  const r = scenario != null && typeof scenario === "object" ? /** @type {Record<string, unknown>} */ (scenario) : null;
  if (r != null) {
    const identityKey = r.ml_official_identity_key;
    if (identityKey != null && String(identityKey).trim() !== "") {
      return String(identityKey).trim();
    }
    const contract =
      r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
        ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
        : r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
          ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
          : null;
    const pid = contract?.promotion_id ?? r.promotion_id ?? r.id ?? "";
    const ptype = contract?.promotion_type ?? r.promotion_type ?? r.type ?? "";
    const offerId = contract?.offer_id ?? r.offer_id ?? r.ref_id ?? "";
    const composto = [pid, ptype, offerId].map((v) => (v != null ? String(v).trim() : "")).join("|");
    if (composto.replace(/\|/g, "") !== "") return `promo:${composto}`;
  }
  return resolveSaleXrayArticleKey(row.scenario, index);
}

/**
 * @param {string | null} statusLabel
 * @param {string} group
 * @returns {PromotionStatusKind}
 */
function resolveCardStatusKindFromBadge(statusLabel, group) {
  const st = statusLabel != null ? statusLabel.trim().toLowerCase() : "";
  if (group === "baseline") return "neutro";
  if (st.includes("program")) return "programada";
  if (st.includes("dispon")) return "disponivel";
  if (st.includes("ativa")) return "ativa";
  if (group === "participating") return "ativa";
  if (group === "available") return "disponivel";
  return "disponivel";
}

/**
 * @param {unknown} scenario
 * @param {string} group
 * @returns {PromotionStatusKind}
 */
export function resolvePromotionStatusKind(scenario, group) {
  const badge = resolveRaioxListingBadge(scenario);
  let statusLabel = badge.label != null && String(badge.label).trim() !== "" ? String(badge.label).trim() : null;
  if (statusLabel == null) {
    if (group === "participating") statusLabel = "Ativa";
    else if (group === "available") statusLabel = "Disponível";
  }
  return resolveCardStatusKindFromBadge(statusLabel, group);
}

/**
 * @param {unknown} scenario
 * @param {string} group
 * @returns {string | null}
 */
export function formatPromotionStatusLabel(scenario, group) {
  const kind = resolvePromotionStatusKind(scenario, group);
  if (kind === "disponivel") return null;
  if (kind === "ativa") return "PARTICIPANDO";
  if (kind === "programada") return "PROGRAMADO";
  return "PROMOÇÃO";
}

/**
 * Rótulo do botão de ação do mini card — mesma regra visual do rail legado.
 *
 * @param {PromotionStatusKind} statusKind
 * @returns {"Participar" | "Alterar" | null}
 */
export function resolvePromotionMiniCardActionLabel(statusKind) {
  if (statusKind === "ativa") return "Alterar";
  if (statusKind === "neutro") return null;
  return "Participar";
}

/**
 * @param {{ scenario: unknown; group: string }} row
 * @param {number} index
 */
export function resolvePromotionMiniCardMeta(row, index) {
  const isRelampago = resolverPromocaoRelampago(row.scenario);
  const nome = normalizarNomePromocaoExibicaoUi(row.scenario, isRelampago);
  const fundingUi = resolverLinhasFundingMiniCardPromocao(row.scenario);
  const temFundingEspecial = fundingUi.temFundingEspecial === true;

  return {
    selectionId: resolvePromotionSelectionId(row, index),
    nome,
    periodo: resolverPeriodoMiniCardPromocao(row.scenario, isRelampago),
    elegibilidade: resolverElegibilidadeMiniCardPromocao(row.scenario),
    isRelampago,
    status: formatPromotionStatusLabel(row.scenario, row.group),
    statusKind: resolvePromotionStatusKind(row.scenario, row.group),
    precoPromocional: temFundingEspecial ? null : resolverPrecoPromocaoHint(row.scenario),
    descontoResumo: temFundingEspecial ? null : resolverDescontoPromocaoHint(row.scenario),
    descontoReaisResumo: temFundingEspecial ? null : resolverDescontoReaisPromocaoHint(row.scenario),
    fundingLinhas: fundingUi.linhas,
    temFundingMl: temFundingEspecial,
    chipCentralSubsidiMl: null,
    acaoRotulo: resolvePromotionMiniCardActionLabel(
      resolvePromotionStatusKind(row.scenario, row.group),
    ),
  };
}
