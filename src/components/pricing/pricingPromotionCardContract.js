// ======================================================
// PI — Promoções: contrato mínimo de preço (promotion_card_contract).
// Somente nome, preço original, preço final real e desconto derivado.
// ======================================================

import {
  formatarPrecoRealExibicao,
  interpretarPrecoUnitarioBrlBruto,
} from "./precoInicialAnuncioPrecificacao.js";

/** @param {unknown} raw @returns {number | null} */
function parsePrecoOriginalMonetario(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const parsed = interpretarPrecoUnitarioBrlBruto(raw);
  return parsed.ok && parsed.valor > 0 ? parsed.valor : null;
}

/** @param {Record<string, unknown> | null | undefined} src @param {string[]} keys */
function pickPrecoOriginalDeCampos(src, keys) {
  if (src == null || typeof src !== "object") return null;
  for (const key of keys) {
    const valor = parsePrecoOriginalMonetario(src[key]);
    if (valor != null) return { valor, source: key };
  }
  return null;
}

const CHAVES_PRECO_ORIGINAL_CONTRATO = [
  "original_price_brl",
  "original_price",
  "regular_amount",
  "base_price",
  "list_price",
  "regular_price",
  "full_price",
];

/**
 * @param {unknown} scenario
 * @param {Record<string, unknown> | null | undefined} [catalogRow]
 * @returns {{ valor: number; source: string } | null}
 */
export function resolverPrecoOriginalPromocaoMonetario(scenario, catalogRow = null) {
  const contract = obterContratoPrecoMiniCardPromocao(scenario);
  const fromContract = pickPrecoOriginalDeCampos(contract, CHAVES_PRECO_ORIGINAL_CONTRATO);
  if (fromContract != null) {
    return { valor: fromContract.valor, source: `promotion_card_contract.${fromContract.source}` };
  }

  if (scenario != null && typeof scenario === "object") {
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : null;
    const fromMarketplace = pickPrecoOriginalDeCampos(m, ["original_price_brl", "original_price"]);
    if (fromMarketplace != null) {
      return { valor: fromMarketplace.valor, source: `marketplace.${fromMarketplace.source}` };
    }

    const sourceFields =
      contract?.source_fields != null && typeof contract.source_fields === "object"
        ? /** @type {Record<string, unknown>} */ (contract.source_fields)
        : null;
    const fromSourceFields = pickPrecoOriginalDeCampos(sourceFields, CHAVES_PRECO_ORIGINAL_CONTRATO);
    if (fromSourceFields != null) {
      return { valor: fromSourceFields.valor, source: `source_fields.${fromSourceFields.source}` };
    }

    const lr =
      r._raiox_listing_row != null && typeof r._raiox_listing_row === "object"
        ? /** @type {Record<string, unknown>} */ (r._raiox_listing_row)
        : null;
    const fromListingRow = pickPrecoOriginalDeCampos(lr, ["originalPrice", "original_price", "price", "base_price"]);
    if (fromListingRow != null) {
      return { valor: fromListingRow.valor, source: `_raiox_listing_row.${fromListingRow.source}` };
    }
  }

  if (catalogRow != null && typeof catalogRow === "object") {
    const c = /** @type {Record<string, unknown>} */ (catalogRow);
    const fromCatalog = pickPrecoOriginalDeCampos(c, [
      "originalPrice",
      "original_price",
      "base_price",
      "price",
    ]);
    if (fromCatalog != null) {
      return { valor: fromCatalog.valor, source: `catalogRow.${fromCatalog.source}` };
    }
  }

  return null;
}

/**
 * @param {unknown} scenario
 * @param {Record<string, unknown> | null | undefined} [catalogRow]
 * @returns {string | null}
 */
export function resolverPrecoOriginalPromocaoExibicao(scenario, catalogRow = null) {
  const hit = resolverPrecoOriginalPromocaoMonetario(scenario, catalogRow);
  if (hit == null) return null;
  return `Preço ${formatarPrecoRealExibicao(hit.valor)}`;
}

/**
 * @param {unknown} scenario
 * @returns {Record<string, unknown> | null}
 */
export function obterContratoPrecoMiniCardPromocao(scenario) {
  if (scenario == null || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);

  const card =
    r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
      : null;
  if (card != null) return card;

  const offer =
    r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
      : null;
  if (offer == null) return null;

  return {
    listing_id: offer.listing_id ?? null,
    marketplace_account_id: offer.marketplace_account_id ?? null,
    promotion_id: offer.promotion_id ?? null,
    promotion_name: offer.promotion_name ?? null,
    promotion_type: offer.promotion_type ?? null,
    original_price_brl: offer.original_price_brl ?? null,
    real_promotion_final_price_brl: offer.buyer_final_price_brl ?? offer.final_price_brl ?? null,
    final_price_source: offer.final_price_source ?? null,
    discount_amount_brl: offer.discount_amount_brl ?? null,
    discount_percent_display: offer.discount_percent_display ?? null,
    source_fields: offer.raw_source_fields ?? offer.source_fields ?? null,
  };
}

/**
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function resolverNomePromocaoContratoPreco(scenario) {
  const contract = obterContratoPrecoMiniCardPromocao(scenario);
  if (contract?.promotion_name != null && String(contract.promotion_name).trim() !== "") {
    return String(contract.promotion_name).trim();
  }
  if (scenario == null || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const nome =
    r.promotion_name != null
      ? String(r.promotion_name).trim()
      : r.label != null
        ? String(r.label).trim()
        : "";
  return nome !== "" ? nome : null;
}
