// ======================================================
// PI — Promoções: resolver de PREÇO FINAL OFICIAL + auditoria de freshness/candidatos.
// S1.PROMO-FINAL-PRICE-FRESHNESS-AND-CANDIDATE-AUDIT.
//
// Serve para:
//   1) enumerar todos os candidatos de preço por camada (frontend_contract / central_card);
//   2) apontar qual candidato a UI escolhia antes e por quê;
//   3) priorizar o preço final OFICIAL por anúncio/listing, nunca o desconto genérico
//      de campanha quando existir preço oficial do item.
//
// Prioridade (resolvePromotionOfficialFinalPrice):
//   1. preço final oficial específico do anúncio/listing (final_price_source oficial por item);
//   2. buyer_final_price_brl / real_promotion_final_price_brl / final_price_brl do item;
//   3. preço do payload de participação (raw_source_fields por item);
//   4. preço simulado oficial do cenário (marketplace.sale_price_brl);
//   5. último caso: desconto genérico da campanha sobre o preço original, com warning.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;

// final_price_source considerados OFICIAIS por item (não genéricos de campanha).
const FONTES_OFICIAIS_POR_ITEM = new Set([
  "price",
  "buyer_final_price",
  "real_promotion_final_price",
  "final_price",
  "deal_price",
  "top_deal_price",
  "suggested_discounted_price",
  "max_discounted_price",
  "min_discounted_price",
  "sibling_deal_max_discounted_price",
  "sibling_deal_suggested_discounted_price",
  "total_price_for_boosted_offer",
]);

// final_price_source suspeitos de desconto genérico de campanha.
const FONTES_GENERICAS_CAMPANHA = new Set([
  "seller_percentage",
  "meli_percentage",
  "campaign_discount_percent",
  "seller_discount_percent",
  "generic_campaign_discount",
  "discount_percent_display",
]);

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const norm = String(v).trim().replace(/[^\d,.-]/g, "").replace(",", ".");
    if (norm === "" || norm === "-" || norm === ".") return null;
    const d = new Decimal(norm);
    return d.isFinite() && d.gt(0) ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null} d */
function s2(d) {
  return d == null ? null : d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} v */
function s2Value(v) {
  return s2(toDec(v));
}

/** @param {unknown} o @returns {Record<string, unknown>} */
function rec(o) {
  return o != null && typeof o === "object" ? /** @type {Record<string, unknown>} */ (o) : {};
}

/**
 * Extrai os contratos/campos relevantes do scenario de uma promoção.
 * @param {unknown} scenario
 */
function extrairCamadas(scenario) {
  const r = rec(scenario);
  const cardContract =
    r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
      ? rec(r.promotion_card_contract)
      : null;
  const offerContract =
    r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
      ? rec(r.promotion_offer_contract)
      : null;
  const rawSource = rec(offerContract?.raw_source_fields ?? cardContract?.source_fields);
  const marketplace = rec(r.marketplace);
  const mlAudit = rec(r.ml_financial_audit);
  return { r, cardContract, offerContract, rawSource, marketplace, mlAudit };
}

/** @param {unknown} v */
function normId(v) {
  const s = v != null ? String(v).trim() : "";
  return s !== "" ? s : null;
}

/** @param {Record<string, unknown> | null | undefined} obj @param {string[]} keys */
function pickIdentityValue(obj, keys) {
  if (obj == null) return null;
  for (const key of keys) {
    const value = normId(obj[key]);
    if (value != null) return value;
  }
  return null;
}

/**
 * @param {{
 *   r?: Record<string, unknown>;
 *   cardContract?: Record<string, unknown> | null;
 *   offerContract?: Record<string, unknown> | null;
 *   rawSource?: Record<string, unknown> | null;
 * }} src
 */
function buildPromotionIdentity({ r = {}, cardContract = null, offerContract = null, rawSource = null }) {
  const promotionId = pickIdentityValue(
    cardContract ?? offerContract ?? rawSource ?? r,
    ["promotion_id", "id"],
  );
  const offerId = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, ["offer_id", "ref_id"]);
  const type = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, ["promotion_type", "type"]);
  const subType = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, ["sub_type", "subtype"]);
  const sourceIdentityKey = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, [
    "source_identity_key",
    "identity_key",
    "ml_official_identity_key",
  ]);
  const listingId = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, [
    "listing_id",
    "listing_external_id",
    "external_listing_id",
  ]);
  const marketplaceAccountId = pickIdentityValue(cardContract ?? offerContract ?? rawSource ?? r, [
    "marketplace_account_id",
  ]);

  return {
    listing_id: listingId,
    marketplace_account_id: marketplaceAccountId,
    promotion_id: promotionId,
    offer_id: offerId,
    promotion_type: type,
    sub_type: subType,
    identity_key: sourceIdentityKey ?? [promotionId, offerId, type, subType].map((v) => v ?? "").join("|"),
  };
}

/** @param {Record<string, unknown>} candidate @param {ReturnType<typeof buildPromotionIdentity>} identity */
function candidateMatchesIdentity(candidate, identity) {
  const checks = [
    ["listing_id", ["listing_id", "listing_external_id", "external_listing_id"]],
    ["marketplace_account_id", ["marketplace_account_id"]],
    ["promotion_id", ["promotion_id", "id"]],
    ["offer_id", ["offer_id", "ref_id"]],
    ["promotion_type", ["promotion_type", "type"]],
    ["sub_type", ["sub_type", "subtype"]],
  ];

  for (const [identityKey, candidateKeys] of checks) {
    const candidateValue = pickIdentityValue(candidate, /** @type {string[]} */ (candidateKeys));
    const identityValue = identity[identityKey];
    if (candidateValue != null && identityValue != null && candidateValue !== identityValue) return false;
  }

  const candidateIdentityKey = pickIdentityValue(candidate, [
    "source_identity_key",
    "identity_key",
    "ml_official_identity_key",
  ]);
  if (candidateIdentityKey != null && identity.identity_key != null && candidateIdentityKey !== identity.identity_key) {
    return false;
  }

  return true;
}

/**
 * @param {Record<string, unknown>} rawSource
 * @param {ReturnType<typeof buildPromotionIdentity>} identity
 */
function extrairCandidatosRawPorItem(rawSource, identity) {
  if (!candidateMatchesIdentity(rawSource, identity)) return [];
  return [
    ["raw_source_fields.price", rawSource.price],
    ["raw_source_fields.price_raw", rawSource.price_raw],
    ["raw_source_fields.promotion_price", rawSource.promotion_price],
    ["raw_source_fields.promotion_price_raw", rawSource.promotion_price_raw],
    ["raw_source_fields.buyer_final_price_brl", rawSource.buyer_final_price_brl],
    ["raw_source_fields.real_promotion_final_price_brl", rawSource.real_promotion_final_price_brl],
    ["raw_source_fields.final_price_brl", rawSource.final_price_brl],
    ["raw_source_fields.deal_price", rawSource.deal_price],
    ["raw_source_fields.deal_price_raw", rawSource.deal_price_raw],
    ["raw_source_fields.top_deal_price", rawSource.top_deal_price],
    ["raw_source_fields.top_deal_price_raw", rawSource.top_deal_price_raw],
    ["raw_source_fields.suggested_discounted_price", rawSource.suggested_discounted_price],
    ["raw_source_fields.suggested_discounted_price_raw", rawSource.suggested_discounted_price_raw],
    ["raw_source_fields.max_discounted_price", rawSource.max_discounted_price],
    ["raw_source_fields.max_discounted_price_raw", rawSource.max_discounted_price_raw],
    ["raw_source_fields.min_discounted_price", rawSource.min_discounted_price],
    ["raw_source_fields.min_discounted_price_raw", rawSource.min_discounted_price_raw],
    ["raw_source_fields.total_price_for_boosted_offer", rawSource.total_price_for_boosted_offer],
    ["raw_source_fields.total_price_for_boosted_offer_raw", rawSource.total_price_for_boosted_offer_raw],
  ]
    .map(([field, value]) => ({ field: String(field), value: toDec(value), raw_value: value ?? null }))
    .filter((candidate) => candidate.value != null);
}

/**
 * Resolve o preço final OFICIAL da promoção respeitando a prioridade da missão.
 * @param {{ scenario?: unknown }} params
 * @returns {{
 *   final_price_brl: string | null;
 *   selected_candidate_field: string | null;
 *   selected_candidate_reason: string | null;
 *   used_generic_campaign_discount: boolean;
 *   warnings: string[];
 * }}
 */
export function resolvePromotionOfficialFinalPrice({ scenario = null } = {}) {
  const { r, cardContract, offerContract, rawSource, marketplace } = extrairCamadas(scenario);
  /** @type {string[]} */
  const warnings = [];

  const cardSource = cardContract?.final_price_source != null ? String(cardContract.final_price_source) : null;
  const offerSource = offerContract?.final_price_source != null ? String(offerContract.final_price_source) : null;
  const contaminado =
    offerContract?.contaminated_by_anonymous_price_discount === true ||
    cardContract?.contaminated_by_anonymous_price_discount === true;
  if (contaminado) warnings.push("contaminated_by_anonymous_price_discount");

  // 1) Candidatos oficiais por item no payload cru de participação. Em caso de
  // divergência, esse é o dado mais próximo do ML/live que chegou ao frontend.
  const identity = buildPromotionIdentity({ r, cardContract, offerContract, rawSource });
  const rawCandidatos = extrairCandidatosRawPorItem(rawSource, identity);
  const rawHit = rawCandidatos.find((candidate) => candidate.value != null);
  if (rawHit && !contaminado) {
    return {
      final_price_brl: s2(rawHit.value),
      selected_candidate_field: rawHit.field,
      selected_candidate_reason: "official_per_listing_identity_price_from_raw_payload",
      used_generic_campaign_discount: false,
      warnings,
    };
  }

  // 2) Preço oficial por item do contrato do card, quando a fonte é oficial por item.
  const cardFinal = toDec(cardContract?.real_promotion_final_price_brl);
  if (cardFinal != null && cardSource != null && FONTES_OFICIAIS_POR_ITEM.has(cardSource) && !contaminado) {
    return {
      final_price_brl: s2(cardFinal),
      selected_candidate_field: `promotion_card_contract.real_promotion_final_price_brl (${cardSource})`,
      selected_candidate_reason: "official_per_listing_price_from_card_contract",
      used_generic_campaign_discount: false,
      warnings,
    };
  }

  // 2) Contrato de oferta (buyer/final) com fonte oficial por item.
  const offerFinal = toDec(offerContract?.buyer_final_price_brl ?? offerContract?.final_price_brl);
  if (offerFinal != null && offerSource != null && FONTES_OFICIAIS_POR_ITEM.has(offerSource) && !contaminado) {
    return {
      final_price_brl: s2(offerFinal),
      selected_candidate_field: `promotion_offer_contract.final_price_brl (${offerSource})`,
      selected_candidate_reason: "official_per_listing_price_from_offer_contract",
      used_generic_campaign_discount: false,
      warnings,
    };
  }

  // 4) Preço simulado oficial do cenário.
  const simFinal = toDec(marketplace.sale_price_brl);
  const simSource = cardSource ?? offerSource;
  if (simFinal != null && (simSource == null || !FONTES_GENERICAS_CAMPANHA.has(simSource))) {
    return {
      final_price_brl: s2(simFinal),
      selected_candidate_field: "marketplace.sale_price_brl",
      selected_candidate_reason: "official_simulated_scenario_price",
      used_generic_campaign_discount: false,
      warnings,
    };
  }

  // 5) Último caso: desconto genérico da campanha sobre o preço original (com warning).
  const original = toDec(
    cardContract?.original_price_brl ?? offerContract?.original_price_brl ?? marketplace.original_price_brl,
  );
  const pctRaw =
    marketplace.seller_discount_percent ??
    cardContract?.discount_percent_display ??
    offerContract?.discount_percent_display ??
    null;
  const pct = toDec(pctRaw != null ? String(pctRaw).replace("%", "") : null);
  if (original != null && pct != null) {
    const generic = original.mul(new Decimal(1).minus(pct.div(100))).toDecimalPlaces(2, ROUND);
    warnings.push("used_generic_campaign_discount_no_official_price_found");
    return {
      final_price_brl: s2(generic),
      selected_candidate_field: "original_price × (1 − campaign_discount_percent)",
      selected_candidate_reason: "fallback_generic_campaign_discount",
      used_generic_campaign_discount: true,
      warnings,
    };
  }

  warnings.push("no_final_price_candidate_resolved");
  return {
    final_price_brl: s2(cardFinal ?? offerFinal ?? simFinal),
    selected_candidate_field: null,
    selected_candidate_reason: "no_candidate",
    used_generic_campaign_discount: false,
    warnings,
  };
}

/**
 * Monta o payload de auditoria de freshness/candidatos para UMA promoção (camada frontend).
 * @param {{
 *   scenario?: unknown;
 *   listingId?: string | null;
 *   sku?: string | null;
 *   sourceLayer?: "frontend_contract" | "central_card";
 * }} ctx
 */
export function buildPromotionFinalPriceFreshnessAudit({
  scenario = null,
  listingId = null,
  sku = null,
  sourceLayer = "frontend_contract",
}) {
  const { r, cardContract, offerContract, rawSource, marketplace, mlAudit } = extrairCamadas(scenario);
  const identity = buildPromotionIdentity({ r, cardContract, offerContract, rawSource });
  const resolved = resolvePromotionOfficialFinalPrice({ scenario });

  const uiSelectedField =
    cardContract?.real_promotion_final_price_brl != null
      ? "promotion_card_contract.real_promotion_final_price_brl"
      : offerContract?.buyer_final_price_brl != null || offerContract?.final_price_brl != null
        ? "promotion_offer_contract.final_price_brl"
        : "marketplace.sale_price_brl";

  const uiPrice =
    cardContract?.real_promotion_final_price_brl ??
    offerContract?.buyer_final_price_brl ??
    offerContract?.final_price_brl ??
    marketplace.sale_price_brl ??
    null;

  const candidateFields = {
    identity,
    card_real_promotion_final_price_brl: cardContract?.real_promotion_final_price_brl ?? null,
    card_final_price_source: cardContract?.final_price_source ?? null,
    card_source_identity_key: cardContract?.source_identity_key ?? null,
    offer_buyer_final_price_brl: offerContract?.buyer_final_price_brl ?? null,
    offer_final_price_brl: offerContract?.final_price_brl ?? null,
    offer_final_price_source: offerContract?.final_price_source ?? null,
    offer_source_identity_key: offerContract?.source_identity_key ?? null,
    offer_contaminated: offerContract?.contaminated_by_anonymous_price_discount ?? null,
    raw_price: rawSource.price ?? rawSource.promotion_price ?? null,
    raw_price_raw: rawSource.price_raw ?? rawSource.promotion_price_raw ?? null,
    raw_deal_price: rawSource.deal_price ?? null,
    raw_deal_price_raw: rawSource.deal_price_raw ?? null,
    raw_top_deal_price: rawSource.top_deal_price ?? null,
    raw_top_deal_price_raw: rawSource.top_deal_price_raw ?? null,
    raw_suggested_discounted_price: rawSource.suggested_discounted_price ?? null,
    raw_suggested_discounted_price_raw: rawSource.suggested_discounted_price_raw ?? null,
    raw_max_discounted_price: rawSource.max_discounted_price ?? null,
    raw_max_discounted_price_raw: rawSource.max_discounted_price_raw ?? null,
    raw_min_discounted_price: rawSource.min_discounted_price ?? null,
    raw_min_discounted_price_raw: rawSource.min_discounted_price_raw ?? null,
    raw_total_price_for_boosted_offer: rawSource.total_price_for_boosted_offer ?? null,
    raw_total_price_for_boosted_offer_raw: rawSource.total_price_for_boosted_offer_raw ?? null,
    ml_expected_final_price_brl:
      r.ml_expected_final_price_brl ??
      r.official_expected_final_price_brl ??
      rawSource.ml_expected_final_price_brl ??
      rawSource.official_expected_final_price_brl ??
      mlAudit.ml_expected_final_price_brl ??
      mlAudit.official_expected_final_price_brl ??
      null,
    ml_live_final_price_brl:
      r.ml_live_final_price_brl ??
      rawSource.ml_live_final_price_brl ??
      mlAudit.ml_live_final_price_brl ??
      mlAudit.promotion_price ??
      null,
    raw_seller_percentage: rawSource.seller_percentage ?? null,
    raw_meli_percentage: rawSource.meli_percentage ?? null,
    marketplace_sale_price_brl: marketplace.sale_price_brl ?? null,
    marketplace_seller_discount_percent: marketplace.seller_discount_percent ?? null,
  };
  const rawCandidates = extrairCandidatosRawPorItem(rawSource, identity).map((candidate) => ({
    field: candidate.field,
    value_brl: s2(candidate.value),
    raw_value: candidate.raw_value,
    identity_key: identity.identity_key,
  }));
  const hasListingSpecificPriceCandidate = rawCandidates.length > 0;

  const dbUpdatedAt =
    r.db_snapshot_updated_at ?? r.listing_updated_at ?? cardContract?.db_updated_at ?? null;
  const liveFetchedAt = r.ml_live_fetched_at ?? cardContract?.ml_live_fetched_at ?? null;
  const capturedAt = r.captured_at ?? offerContract?.captured_at ?? null;

  return {
    listing_id: listingId ?? identity.listing_id ?? cardContract?.listing_id ?? offerContract?.listing_id ?? r.external_listing_id ?? null,
    sku: sku ?? null,
    marketplace_account_id: identity.marketplace_account_id,
    promotion_name:
      cardContract?.promotion_name ?? offerContract?.promotion_name ?? r.promotion_name ?? r.label ?? null,
    promotion_id: identity.promotion_id ?? cardContract?.promotion_id ?? offerContract?.promotion_id ?? r.promotion_id ?? null,
    promotion_type: identity.promotion_type ?? cardContract?.promotion_type ?? offerContract?.promotion_type ?? r.promotion_type ?? null,
    offer_id: identity.offer_id,
    sub_type: identity.sub_type,
    identity_key: identity.identity_key,
    status: offerContract?.participation_status ?? r.ml_promotion_raw_status ?? null,
    source_layer: sourceLayer,
    original_price_brl:
      cardContract?.original_price_brl ?? offerContract?.original_price_brl ?? marketplace.original_price_brl ?? null,
    final_price_brl: uiPrice,
    discount_brl: cardContract?.discount_amount_brl ?? offerContract?.discount_amount_brl ?? null,
    discount_percent:
      cardContract?.discount_percent_display ?? offerContract?.discount_percent_display ?? null,
    amount_to_receive_brl:
      offerContract?.seller_receives_brl ?? marketplace.marketplace_payout_amount_brl ?? mlAudit.amount_to_receive ?? null,
    candidate_fields: candidateFields,
    listing_specific_price_candidates: rawCandidates,
    ui_selected_candidate_field: uiSelectedField,
    resolver_selected_candidate_field: resolved.selected_candidate_field,
    resolver_selected_candidate_reason: resolved.selected_candidate_reason,
    resolver_final_price_brl: resolved.final_price_brl,
    resolver_used_generic_campaign_discount: resolved.used_generic_campaign_discount,
    has_listing_specific_price_candidate: hasListingSpecificPriceCandidate,
    ui_vs_resolver_divergent:
      uiPrice != null &&
      resolved.final_price_brl != null &&
      String(toDec(uiPrice)?.toDecimalPlaces(2, ROUND).toFixed(2)) !== resolved.final_price_brl,
    payload_updated_at: liveFetchedAt,
    db_updated_at: dbUpdatedAt,
    captured_at: capturedAt,
    is_stale_vs_live:
      dbUpdatedAt != null && liveFetchedAt != null
        ? new Date(String(dbUpdatedAt)).getTime() < new Date(String(liveFetchedAt)).getTime()
        : null,
    warnings: resolved.warnings,
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromotionFinalPriceFreshnessAudit(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_FINAL_PRICE_FRESHNESS_AUDIT]", payload);
}

/** @param {ReturnType<typeof buildPromotionFinalPriceFreshnessAudit>} audit */
export function buildPromotionOfficialFinalPriceCandidateFixLog(audit) {
  const warning =
    audit.resolver_used_generic_campaign_discount === true
      ? "no_listing_specific_price_candidate_using_generic_campaign_discount"
      : audit.ui_vs_resolver_divergent === true
        ? "frontend_candidate_priority_corrected"
        : null;

  return {
    listing_id: audit.listing_id,
    sku: audit.sku,
    promotion_name: audit.promotion_name,
    promotion_id: audit.promotion_id,
    original_price_brl: audit.original_price_brl,
    ui_previous_final_price_brl: audit.final_price_brl,
    resolver_final_price_brl: audit.resolver_final_price_brl,
    selected_candidate_field: audit.resolver_selected_candidate_field,
    selected_candidate_reason: audit.resolver_selected_candidate_reason,
    candidate_fields: audit.candidate_fields,
    used_generic_campaign_discount: audit.resolver_used_generic_campaign_discount,
    has_listing_specific_price_candidate: audit.has_listing_specific_price_candidate,
    needs_resync:
      audit.has_listing_specific_price_candidate !== true &&
      audit.resolver_used_generic_campaign_discount === true,
    warning,
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromotionOfficialFinalPriceCandidateFix(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_OFFICIAL_FINAL_PRICE_CANDIDATE_FIX]", payload);
}

/**
 * @param {ReturnType<typeof buildPromotionFinalPriceFreshnessAudit>} audit
 * @returns {string | null}
 */
function resolveExpectedFinalPrice(audit) {
  return (
    s2Value(audit.candidate_fields?.ml_expected_final_price_brl) ??
    s2Value(audit.candidate_fields?.official_expected_final_price_brl) ??
    s2Value(audit.candidate_fields?.ml_live_final_price_brl) ??
    null
  );
}

/**
 * @param {ReturnType<typeof buildPromotionFinalPriceFreshnessAudit>} audit
 * @returns {"frontend_candidate_priority" | "sync_cache_stale" | "server_payload_missing_official_price" | "ok"}
 */
function diagnoseFreshness(audit) {
  const expected = resolveExpectedFinalPrice(audit);
  const resolver = s2Value(audit.resolver_final_price_brl);
  const matchesExpected = expected != null && resolver === expected;

  if (matchesExpected) return "ok";
  if (expected == null && audit.resolver_used_generic_campaign_discount !== true) return "ok";
  if (audit.has_listing_specific_price_candidate === true) return "frontend_candidate_priority";
  if (audit.is_stale_vs_live === true) return "sync_cache_stale";
  return "server_payload_missing_official_price";
}

/** @param {ReturnType<typeof buildPromotionFinalPriceFreshnessAudit>} audit */
export function buildPromotionFinalPriceFreshnessConfirmationLog(audit) {
  const diagnosis = diagnoseFreshness(audit);
  const expected = resolveExpectedFinalPrice(audit);
  const uiFinal = s2Value(audit.resolver_final_price_brl);

  return {
    listing_id: audit.listing_id,
    sku: audit.sku,
    marketplace_account_id: audit.marketplace_account_id,
    promotion_id: audit.promotion_id,
    promotion_type: audit.promotion_type,
    promotion_name: audit.promotion_name,
    offer_id: audit.offer_id,
    sub_type: audit.sub_type,
    identity_key: audit.identity_key,
    ml_expected_final_price_brl: expected,
    ui_final_price_brl: uiFinal,
    resolver_final_price_brl: s2Value(audit.resolver_final_price_brl),
    selected_candidate_field: audit.resolver_selected_candidate_field,
    selected_candidate_reason: audit.resolver_selected_candidate_reason,
    resolved_source: audit.resolver_selected_candidate_field,
    candidate_fields: audit.candidate_fields,
    listing_specific_price_candidates: audit.listing_specific_price_candidates,
    has_listing_specific_price_candidate: audit.has_listing_specific_price_candidate,
    used_generic_campaign_discount: audit.resolver_used_generic_campaign_discount,
    payload_updated_at: audit.payload_updated_at,
    db_updated_at: audit.db_updated_at,
    is_stale_vs_live: audit.is_stale_vs_live,
    needs_resync:
      diagnosis === "sync_cache_stale" || diagnosis === "server_payload_missing_official_price",
    diagnosis,
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromotionFinalPriceFreshnessConfirmation(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_FINAL_PRICE_FRESHNESS_CONFIRMATION]", payload);
}
