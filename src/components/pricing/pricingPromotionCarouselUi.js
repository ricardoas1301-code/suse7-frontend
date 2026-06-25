// ======================================================
// PI — Promoções: metadados dos mini-cards (somente apresentação).
// Status alinhado ao rail legado (`PricingScenarioRailItem` + `resolveRaioxListingBadge`).
// ======================================================

import {
  cardHeadingLabel,
  resolveRaioxListingBadge,
  resolveSaleXrayArticleKey,
} from "../mercadoLivrePricingScenarioCompareShared.js";

/** @typedef {"ativa" | "programada" | "disponivel" | "neutro"} PromotionStatusKind */

/**
 * Id estável e único por linha — mesmo critério do `PricingScenarioRail` legado.
 *
 * @param {unknown} scenario
 * @param {number} index
 */
export function resolvePromotionSelectionId(row, index) {
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
 * @returns {string}
 */
export function formatPromotionStatusLabel(scenario, group) {
  const kind = resolvePromotionStatusKind(scenario, group);
  if (kind === "ativa") return "ATIVA";
  if (kind === "programada") return "PROGRAMADA";
  if (kind === "disponivel") return "DISPONÍVEL PARA PARTICIPAR";
  return "PROMOÇÃO";
}

/**
 * @param {{ scenario: unknown; group: string }} row
 * @param {number} index
 */
export function resolvePromotionMiniCardMeta(row, index) {
  const nomeRaw = cardHeadingLabel(row.scenario);
  const nome = nomeRaw != null && String(nomeRaw).trim() !== "" ? String(nomeRaw).trim() : "Promoção";
  return {
    selectionId: resolvePromotionSelectionId(row, index),
    nome,
    status: formatPromotionStatusLabel(row.scenario, row.group),
    statusKind: resolvePromotionStatusKind(row.scenario, row.group),
  };
}
