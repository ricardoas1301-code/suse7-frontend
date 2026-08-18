// ======================================================
// S4.3.6.16 — Contrato fail-closed da verdade promocional (frontend).
// Strategy/Resolver + registry. Default seguro = UNCONFIRMED_EMPTY.
// Não usa título, sibling, família ou aproximação.
// ======================================================

import Decimal from "decimal.js";

import {
  buildPromotionIdentityKeyParts,
  promotionIdentityIsComplete,
} from "./promotionIdentityKey.js";
import { resolverEstadoVerdadePrecoPromocaoExibicao } from "./resolvePromotionOfficialFinalPrice.js";
import { isValidDecimalMoneyString } from "./promotionManualSimulationPrice.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_COERENCIA_BRL = new Decimal("0.02");

/** @typedef {"CONFIRMED_OFFICIAL" | "UNCONFIRMED_EMPTY"} PromotionPriceTruthStatus */

/**
 * @typedef {{
 *   status: PromotionPriceTruthStatus;
 *   priceBrl: string | null;
 *   discountPercentage: string | null;
 *   discountAmountBrl: string | null;
 *   provenance: string;
 *   evidence: Record<string, unknown>;
 *   rejectionReasons: string[];
 *   promotionIdentityKey: string;
 *   resolverName: string;
 *   resolvedAt: string;
 * }} PromotionPriceTruthResolution
 */

/** Fontes proibidas para confirmação oficial. */
export const FONTES_PROIBIDAS_CONFIRMACAO = new Set([
  "sibling_deal_max_discounted_price",
  "sibling_deal_suggested_discounted_price",
  "sibling",
  "suggested_discounted_price",
  "max_discounted_price",
  "min_discounted_price",
  "generic_campaign_discount",
  "campaign_discount_percent",
  "seller_percentage",
  "meli_percentage",
  "seller_discount_percent",
  "discount_percent_display",
  "marketplace.sale_price_brl",
  "listing_generic_price",
  "catalog_row_price",
  "manual_other_promotion",
]);

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d */
function s2(d) {
  return d == null || !d.isFinite() ? null : d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} scenario */
function extrairCard(scenario) {
  const r =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : {};
  return r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
    ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
    : null;
}

/** @param {unknown} scenario */
function extrairTruth(scenario) {
  const card = extrairCard(scenario);
  return card?.promotion_display_price_truth != null &&
    typeof card.promotion_display_price_truth === "object"
    ? /** @type {Record<string, unknown>} */ (card.promotion_display_price_truth)
    : null;
}

/**
 * Coerência mínima (necessária, não suficiente).
 * @param {{
 *   salePrice: Decimal;
 *   basePrice?: Decimal | null;
 *   discountAmount?: Decimal | null;
 *   discountPct?: Decimal | null;
 *   marketplacePayout?: Decimal | null;
 *   fee?: Decimal | null;
 *   shipping?: Decimal | null;
 * }} params
 */
export function validarCoerenciaFinanceiraPromocional(params) {
  /** @type {string[]} */
  const rejected = [];
  /** @type {string[]} */
  const approved = [];

  const { salePrice, basePrice, discountAmount, discountPct, marketplacePayout, fee, shipping } =
    params;

  if (basePrice != null && basePrice.gt(0) && discountAmount != null) {
    const expectedAmount = basePrice.minus(salePrice);
    if (expectedAmount.minus(discountAmount).abs().gt(TOLERANCIA_COERENCIA_BRL)) {
      rejected.push("discount_amount_incoherent");
    } else {
      approved.push("discount_amount_coherent");
    }
  }

  if (basePrice != null && basePrice.gt(0) && discountPct != null) {
    const expectedPct = basePrice.minus(salePrice).div(basePrice).times(100);
    if (expectedPct.minus(discountPct).abs().gt(new Decimal("0.05"))) {
      rejected.push("discount_percentage_incoherent");
    } else {
      approved.push("discount_percentage_coherent");
    }
  }

  if (marketplacePayout != null && fee != null && shipping != null) {
    const expectedPayout = salePrice.minus(fee).minus(shipping);
    if (expectedPayout.minus(marketplacePayout).abs().gt(TOLERANCIA_COERENCIA_BRL)) {
      rejected.push("marketplace_payout_incoherent");
    } else {
      approved.push("marketplace_payout_coherent");
    }
  }

  return { approved, rejected, ok: rejected.length === 0 };
}

/**
 * @param {Partial<PromotionPriceTruthResolution> & {
 *   status: PromotionPriceTruthStatus;
 *   promotionIdentityKey: string;
 *   resolverName: string;
 * }} partial
 * @returns {PromotionPriceTruthResolution}
 */
function buildResolution(partial) {
  return {
    status: partial.status,
    priceBrl: partial.priceBrl ?? null,
    discountPercentage: partial.discountPercentage ?? null,
    discountAmountBrl: partial.discountAmountBrl ?? null,
    provenance: partial.provenance ?? "none",
    evidence: partial.evidence ?? {},
    rejectionReasons: partial.rejectionReasons ?? [],
    promotionIdentityKey: partial.promotionIdentityKey,
    resolverName: partial.resolverName,
    resolvedAt: new Date().toISOString(),
  };
}

/**
 * @param {{
 *   scenario?: unknown;
 *   listingExternalId?: string | null;
 *   accountId?: string | null;
 *   variationId?: string | null;
 * }} context
 */
function buildEmpty(context, resolverName, reasons, evidence = {}) {
  const identity = buildPromotionIdentityKeyParts(context);
  return buildResolution({
    status: "UNCONFIRMED_EMPTY",
    priceBrl: null,
    discountPercentage: null,
    discountAmountBrl: null,
    provenance: "unconfirmed_empty",
    evidence: {
      ...evidence,
      identity,
      fields_found: evidence.fields_found ?? [],
      fields_missing: evidence.fields_missing ?? [],
    },
    rejectionReasons: reasons,
    promotionIdentityKey: identity.identityKey,
    resolverName,
  });
}

/** Default seguro — qualquer promoção desconhecida. */
export const UnknownPromotionPriceTruthResolver = {
  name: "UnknownPromotionPriceTruthResolver",
  /** @param {unknown} _context */
  supports(_context) {
    return true;
  },
  /**
   * @param {{
   *   scenario?: unknown;
   *   listingExternalId?: string | null;
   *   accountId?: string | null;
   *   variationId?: string | null;
   * }} context
   */
  resolve(context) {
    return buildEmpty(context, this.name, ["unknown_promotion_payload_fail_closed"], {
      fields_missing: ["official_promotion_display_price_brl"],
    });
  },
};

/**
 * Resolver canônico: consome o contrato SSOT já existente (truth do card).
 * Nunca inventa preço; nunca usa sibling/título.
 */
export const CanonicalContractPromotionPriceTruthResolver = {
  name: "CanonicalContractPromotionPriceTruthResolver",
  /**
   * @param {{
   *   scenario?: unknown;
   * }} context
   */
  supports(context) {
    const card = extrairCard(context.scenario);
    return card != null;
  },
  /**
   * @param {{
   *   scenario?: unknown;
   *   listingExternalId?: string | null;
   *   accountId?: string | null;
   *   variationId?: string | null;
   * }} context
   */
  resolve(context) {
    const identity = buildPromotionIdentityKeyParts(context);
    /** @type {string[]} */
    const rejectionReasons = [];
    /** @type {string[]} */
    const fieldsFound = [];
    /** @type {string[]} */
    const fieldsMissing = [];
    /** @type {string[]} */
    const validationsApproved = [];

    if (!promotionIdentityIsComplete(identity)) {
      rejectionReasons.push("identity_incomplete");
      fieldsMissing.push("listingId+promotionId|offerId|dealId");
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
      });
    }
    validationsApproved.push("identity_complete");

    const truthBlob = extrairTruth(context.scenario);
    const contractState = resolverEstadoVerdadePrecoPromocaoExibicao(context.scenario);
    const card = extrairCard(context.scenario);

    const sourceField =
      truthBlob?.official_promotion_display_price_source != null
        ? String(truthBlob.official_promotion_display_price_source)
        : truthBlob?.source_field != null
          ? String(truthBlob.source_field)
          : card?.final_price_source != null
            ? String(card.final_price_source)
            : null;

    if (sourceField != null) fieldsFound.push(`source_field:${sourceField}`);

    if (sourceField != null && FONTES_PROIBIDAS_CONFIRMACAO.has(sourceField)) {
      rejectionReasons.push(`forbidden_source:${sourceField}`);
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
        validations_approved: validationsApproved,
      });
    }

    if (sourceField != null && /sibling/i.test(sourceField)) {
      rejectionReasons.push("sibling_source_forbidden");
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
        validations_approved: validationsApproved,
      });
    }

    const provenance =
      truthBlob?.official_promotion_display_price_provenance != null &&
      typeof truthBlob.official_promotion_display_price_provenance === "object"
        ? /** @type {Record<string, unknown>} */ (truthBlob.official_promotion_display_price_provenance)
        : null;

    if (provenance?.own_source_field != null) {
      const ownSrc = String(provenance.own_source_field);
      if (FONTES_PROIBIDAS_CONFIRMACAO.has(ownSrc) || /sibling/i.test(ownSrc)) {
        rejectionReasons.push(`forbidden_own_source:${ownSrc}`);
        return buildEmpty(context, this.name, rejectionReasons, {
          fields_found: fieldsFound,
          fields_missing: fieldsMissing,
          identity,
          validations_approved: validationsApproved,
        });
      }
    }

    const confirmed =
      contractState.isUnavailable !== true &&
      contractState.status === "OFFICIAL_EXACT" &&
      contractState.isUsable === true &&
      isValidDecimalMoneyString(contractState.finalPriceBrl);

    if (!confirmed) {
      if (contractState.status != null) rejectionReasons.push(`truth_status:${contractState.status}`);
      if (contractState.reasonCode != null) rejectionReasons.push(String(contractState.reasonCode));
      if (!isValidDecimalMoneyString(contractState.finalPriceBrl)) {
        fieldsMissing.push("official_promotion_display_price_brl");
        rejectionReasons.push("official_price_missing_or_invalid");
      }
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
        validations_approved: validationsApproved,
        contract_state: contractState,
      });
    }

    validationsApproved.push("official_exact_usable");
    fieldsFound.push("official_promotion_display_price_brl");

    const salePrice = toDec(contractState.finalPriceBrl);
    if (salePrice == null || !salePrice.gt(0)) {
      rejectionReasons.push("sale_price_not_positive");
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
        validations_approved: validationsApproved,
      });
    }

    const basePrice = toDec(card?.original_price_brl);
    const discountAmount = toDec(card?.discount_amount_brl);
    const discountPct = toDec(
      card?.discount_percent_display != null
        ? String(card.discount_percent_display).replace("%", "")
        : null,
    );

    const coerencia = validarCoerenciaFinanceiraPromocional({
      salePrice,
      basePrice,
      discountAmount,
      discountPct,
    });
    validationsApproved.push(...coerencia.approved);
    if (!coerencia.ok) {
      rejectionReasons.push(...coerencia.rejected);
      return buildEmpty(context, this.name, rejectionReasons, {
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        identity,
        validations_approved: validationsApproved,
      });
    }

    return buildResolution({
      status: "CONFIRMED_OFFICIAL",
      priceBrl: s2(salePrice),
      discountPercentage: discountPct != null ? s2(discountPct) : null,
      discountAmountBrl: discountAmount != null ? s2(discountAmount) : null,
      provenance: sourceField ?? "canonical_official_promotion_display_price_ssot",
      evidence: {
        identity,
        fields_found: fieldsFound,
        fields_missing: fieldsMissing,
        validations_approved: validationsApproved,
        validations_rejected: [],
        contract_status: contractState.status,
        source_field: sourceField,
        parity_validated: provenance?.parity_validated === true,
        no_sibling: true,
        no_title_association: true,
      },
      rejectionReasons: [],
      promotionIdentityKey: identity.identityKey,
      resolverName: this.name,
    });
  },
};

/** Registry ordenado — primeiro que supports vence; Unknown sempre no fim. */
export const PROMOTION_PRICE_TRUTH_RESOLVERS = [
  CanonicalContractPromotionPriceTruthResolver,
  UnknownPromotionPriceTruthResolver,
];

/**
 * Resolve a verdade promocional fail-closed.
 * @param {{
 *   scenario?: unknown;
 *   listingExternalId?: string | null;
 *   accountId?: string | null;
 *   variationId?: string | null;
 *   marketplace?: string | null;
 * }} context
 * @returns {PromotionPriceTruthResolution}
 */
export function resolvePromotionPriceTruthFailClosed(context = {}) {
  const resolver =
    PROMOTION_PRICE_TRUTH_RESOLVERS.find((r) => r.supports(context)) ??
    UnknownPromotionPriceTruthResolver;
  const resolution = resolver.resolve(context);

  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.DEV === true &&
    import.meta.env?.PROD !== true
  ) {
    logPromotionPriceTruthResolution(resolution);
  }

  return resolution;
}

/**
 * Observabilidade estruturada (sem tokens / sem payload sensível completo).
 * @param {PromotionPriceTruthResolution} resolution
 */
export function logPromotionPriceTruthResolution(resolution) {
  if (typeof console === "undefined" || typeof console.info !== "function") return;
  console.info("[S7_PROMOTION_PRICE_TRUTH_FAIL_CLOSED]", {
    promotionIdentityKey: resolution.promotionIdentityKey,
    resolver: resolution.resolverName,
    status: resolution.status,
    price_provenance: resolution.provenance,
    price_brl: resolution.priceBrl,
    fields_found: resolution.evidence?.fields_found ?? [],
    fields_missing: resolution.evidence?.fields_missing ?? [],
    validations_approved: resolution.evidence?.validations_approved ?? [],
    validations_rejected: resolution.rejectionReasons,
    resolved_at: resolution.resolvedAt,
  });
}

/**
 * Atalho: promoção confirmada oficialmente?
 * @param {unknown} scenario
 * @param {{ listingExternalId?: string | null; accountId?: string | null }} [ctx]
 */
export function promocaoPrecoConfirmadoOficialFailClosed(scenario, ctx = {}) {
  const r = resolvePromotionPriceTruthFailClosed({
    scenario,
    listingExternalId: ctx.listingExternalId ?? null,
    accountId: ctx.accountId ?? null,
  });
  return r.status === "CONFIRMED_OFFICIAL" && isValidDecimalMoneyString(r.priceBrl);
}
