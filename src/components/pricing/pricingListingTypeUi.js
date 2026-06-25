// ======================================================
// UI — tipo de anúncio Clássico / Premium (Precificação Inteligente)
//
// Camadas (não misturar):
// 1) baseline_real — espelho do anúncio publicado (cenário baseline da API)
// 2) cenario_alternativo_ml — outro tipo de anúncio no mesmo preço (ML → backend → API)
// 3) simulacao_seller — só após edição pelo lápis (motor local, sem persistência)
//
// Fonte de verdade: Mercado Livre → backend → payload pricing-scenarios / sale_xray_modal
// ======================================================

import {
  classifyScenarioUxGroup,
  extractCanonicalMlScenarios,
} from "../mercadoLivrePricingScenarioCompareShared.js";

/** @typedef {"classic" | "premium"} ListingTypeChoice */

const LISTING_TYPE_ORDER = /** @type {const} */ (["classic", "premium"]);

/**
 * @param {string} raw
 * @returns {ListingTypeChoice | null}
 */
function inferListingTypeFromLabel(raw) {
  const norm = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (norm.includes("PREMIUM")) return "premium";
  if (norm.includes("CLASSICO")) return "classic";
  if (norm.includes("GOLD_PRO") || norm === "GOLD PRO") return "premium";
  if (norm.includes("GOLD_SPECIAL") || norm === "GOLD SPECIAL") return "classic";
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {ListingTypeChoice}
 */
export function inferListingTypeFromCatalogRow(row) {
  const pcm =
    row != null &&
    typeof row === "object" &&
    row.product_card_metrics != null &&
    typeof row.product_card_metrics === "object"
      ? /** @type {Record<string, unknown>} */ (row.product_card_metrics)
      : null;

  const raw = [
    pcm?.listingType,
    row?.listingTypeLabel,
    row?.listing_type_label,
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v))
    .join(" ");

  return inferListingTypeFromLabel(raw) ?? "classic";
}

/**
 * @param {unknown} scenario
 * @returns {ListingTypeChoice | null}
 */
export function inferListingTypeFromScenario(scenario) {
  if (!scenario || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const m =
    r.marketplace != null && typeof r.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (r.marketplace)
      : {};
  const sx =
    r.sale_xray_pricing != null && typeof r.sale_xray_pricing === "object"
      ? /** @type {Record<string, unknown>} */ (r.sale_xray_pricing)
      : {};

  const raw = [
    m.listing_type_label,
    sx.fee_type_label,
    r.listing_type_label,
    r.fee_type_label,
    r.scenario_id,
    r.scenario_key,
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v))
    .join(" ");

  return inferListingTypeFromLabel(raw);
}

/**
 * @param {ListingTypeChoice} type
 */
export function listingTypeScenarioTitle(type) {
  return type === "classic" ? "Anúncio Clássico" : "Anúncio Premium";
}

/** Pill ML no cabeçalho do card (mesmo padrão do card produto — Tipo do anúncio). */
export function listingTypePillLabel(type) {
  return type === "classic" ? "CLÁSSICO" : "PREMIUM";
}

/**
 * @param {unknown} scenario
 */
function isPromotionScenarioRow(scenario) {
  if (!scenario || typeof scenario !== "object") return false;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return false;
  if (isListingTypeFeeScenarioRow(scenario)) return false;

  const pid = r.promotion_id != null ? String(r.promotion_id).trim() : "";
  if (pid !== "") return true;

  const st = String(r.scenario_type ?? "").toLowerCase();
  if (st === "promotion") return true;

  const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (kind === "promotion") return true;

  const g = classifyScenarioUxGroup(scenario);
  return g === "participating" || g === "available";
}

/**
 * @param {unknown} scenario
 */
function isListingTypeFeeScenarioRow(scenario) {
  if (!scenario || typeof scenario !== "object") return false;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const st = String(r.scenario_type ?? r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (st.includes("listing") && st.includes("type")) return true;
  if (st === "listing_type" || st === "listing_type_fee" || st === "listing_fee") return true;

  const sid = String(r.scenario_id ?? r.scenario_key ?? "").toLowerCase();
  if (
    sid === "gold_special" ||
    sid === "gold_pro" ||
    sid === "classic" ||
    sid === "premium" ||
    sid.includes("listing_type") ||
    sid.includes("gold_special") ||
    sid.includes("gold_pro")
  ) {
    return true;
  }

  if (inferListingTypeFromScenario(scenario) != null) {
    const pid = r.promotion_id != null ? String(r.promotion_id).trim() : "";
    const pname = r.promotion_name != null ? String(r.promotion_name).trim() : "";
    if (pid === "" && pname === "" && r.is_baseline !== true) return true;
  }

  return false;
}

/**
 * @param {Record<string, unknown>[]} canonical
 * @param {ListingTypeChoice} type
 * @returns {Record<string, unknown> | null}
 */
function findListingTypeScenarioInCanonical(canonical, type) {
  for (const s of canonical) {
    if (!s || typeof s !== "object") continue;
    if (isPromotionScenarioRow(s)) continue;
    if (inferListingTypeFromScenario(s) === type) return s;
  }

  const sidNeedle = type === "premium" ? "gold_pro" : "gold_special";
  for (const s of canonical) {
    if (!s || typeof s !== "object") continue;
    const sid = String(s.scenario_id ?? s.scenario_key ?? "").toLowerCase();
    if (sid.includes(sidNeedle) || sid === type) return s;
  }

  return null;
}

/**
 * Busca por scenario_id / listing_type_label sem filtrar promoção (payload ML às vezes mistura flags).
 * @param {Record<string, unknown>[]} list
 * @param {ListingTypeChoice} type
 */
function findListingTypeScenarioLoose(list, type) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const sidNeedle = type === "premium" ? "gold_pro" : "gold_special";
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (s);
    const sid = String(r.scenario_id ?? r.scenario_key ?? "").toLowerCase();
    if (sid.includes(sidNeedle) || sid === type) return s;
    if (inferListingTypeFromScenario(s) === type) return s;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} sx
 * @param {ListingTypeChoice} type
 */
/**
 * Cenários de tipo de anúncio às vezes vêm em `promotion_scenarios` (ex.: gold_special).
 * @param {Record<string, unknown>} sx
 * @param {ListingTypeChoice} type
 */
function buscarCenarioListingTypeEmPromotionScenarios(sx, type) {
  const arr = sx.promotion_scenarios;
  if (!Array.isArray(arr)) return null;
  const needle = type === "premium" ? "gold_pro" : "gold_special";
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (item);
    const key = String(r.scenario_key ?? r.scenario_id ?? "").toLowerCase();
    if (
      key.includes(needle) ||
      key === type ||
      key.includes("listing_type") ||
      key.includes("gold_special") ||
      key.includes("gold_pro")
    ) {
      const built = normalizeModalListingTypeNode(item, type);
      if (built != null) return built;
    }
    if (inferListingTypeFromScenario(item) === type) {
      const built = normalizeModalListingTypeNode(item, type);
      if (built != null) return built;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>[]} list
 * @param {ListingTypeChoice} type
 * @param {unknown} baselineScenario
 */
function findListingTypeInScenariosNonBaseline(list, type, baselineScenario) {
  const baselineId =
    baselineScenario != null && typeof baselineScenario === "object"
      ? String(/** @type {Record<string, unknown>} */ (baselineScenario).scenario_id ?? "")
          .trim()
          .toLowerCase()
      : "";
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (s);
    if (r.is_baseline === true) continue;
    const sid = String(r.scenario_id ?? r.scenario_key ?? "")
      .trim()
      .toLowerCase();
    if (baselineId !== "" && sid === baselineId) continue;
    if (inferListingTypeFromScenario(s) === type) return s;
  }
  return null;
}

function buscarCenarioListingTypeNasChavesDoModal(sx, type) {
  const exactKeys =
    type === "classic"
      ? ["classic_scenario", "classico_scenario", "gold_special_scenario", "gold_special", "classic", "classico"]
      : ["premium_scenario", "gold_pro_scenario", "gold_pro", "premium"];

  for (const key of exactKeys) {
    if (!(key in sx)) continue;
    const built = normalizeModalListingTypeNode(sx[key], type);
    if (built != null) return built;
  }

  for (const [key, val] of Object.entries(sx)) {
    const k = key.toLowerCase();
    const match =
      type === "classic"
        ? k.includes("classic") || k.includes("classico") || k.includes("gold_special")
        : k.includes("premium") || k.includes("gold_pro");
    if (!match) continue;
    const built = normalizeModalListingTypeNode(val, type);
    if (built != null) return built;
  }
  return null;
}

/**
 * @param {unknown} node
 * @param {ListingTypeChoice | null} typeHint
 * @returns {Record<string, unknown> | null}
 */
function normalizeModalListingTypeNode(node, typeHint) {
  if (!node || typeof node !== "object") return null;
  const n = /** @type {Record<string, unknown>} */ (node);

  if (n.marketplace != null || n.result != null || n.sale_xray_pricing != null) {
    return { ...n };
  }

  const pricing =
    n.pricing != null && typeof n.pricing === "object"
      ? /** @type {Record<string, unknown>} */ (n.pricing)
      : n;
  const m = { ...pricing };
  if (pricing.fee_type_label != null) m.listing_type_label = pricing.fee_type_label;

  const t = typeHint ?? inferListingTypeFromLabel(String(n.type ?? n.listing_type ?? ""));
  return {
    scenario_id: t === "premium" ? "gold_pro" : "gold_special",
    scenario_type: "listing_type",
    kind: "listing_type",
    marketplace: m,
    sale_xray_pricing: pricing,
    result: n.result ?? null,
    internal_costs: n.internal_costs ?? null,
  };
}

/**
 * @param {unknown} payload
 * @returns {{ classic: Record<string, unknown> | null; premium: Record<string, unknown> | null }}
 */
function extractListingTypesFromSaleXrayModal(payload) {
  if (!payload || typeof payload !== "object") {
    return { classic: null, premium: null };
  }
  const rec = /** @type {Record<string, unknown>} */ (payload);
  const sx = rec.sale_xray_modal;
  if (!sx || typeof sx !== "object") {
    return { classic: null, premium: null };
  }
  const S = /** @type {Record<string, unknown>} */ (sx);

  let classic = normalizeModalListingTypeNode(
    S.classic_scenario ??
      S.classico_scenario ??
      S.gold_special_scenario ??
      S.classic ??
      S.gold_special,
    "classic",
  );
  let premium = normalizeModalListingTypeNode(
    S.premium_scenario ?? S.gold_pro_scenario ?? S.premium ?? S.gold_pro,
    "premium",
  );

  const normal = S.normal_scenario;
  if (normal != null && typeof normal === "object") {
    const N = /** @type {Record<string, unknown>} */ (normal);
    if (classic == null) {
      classic = normalizeModalListingTypeNode(
        N.classic_scenario ?? N.classico_scenario ?? N.gold_special_scenario ?? N.alternate_classic,
        "classic",
      );
    }
    if (premium == null) {
      premium = normalizeModalListingTypeNode(
        N.premium_scenario ?? N.gold_pro_scenario ?? N.alternate_premium,
        "premium",
      );
    }
  }

  const arr = S.listing_type_scenarios ?? S.listing_type_comparison ?? S.alternate_listing_types;
  if (Array.isArray(arr)) {
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const it = /** @type {Record<string, unknown>} */ (item);
      const t = inferListingTypeFromLabel(
        [it.listing_type_label, it.type, it.listing_type, it.fee_type_label, it.scenario_key]
          .filter((v) => v != null)
          .map((v) => String(v))
          .join(" "),
      );
      const built = normalizeModalListingTypeNode(it, t);
      if (t === "classic" && classic == null) classic = built;
      if (t === "premium" && premium == null) premium = built;
    }
  }

  return { classic, premium };
}

/**
 * @typedef {{ scenario: Record<string, unknown> | null; path: string | null }} CenarioListingTypeResolvido
 */

/**
 * Resolve cenário Clássico/Premium no payload e informa o caminho (diagnóstico DEV / mapper).
 *
 * @param {unknown} payload
 * @param {{ scenario: unknown; group?: string } | null} baselineRow
 * @param {ListingTypeChoice} type
 * @returns {CenarioListingTypeResolvido}
 */
export function resolverCenarioListingTypeComCaminho(payload, baselineRow, type) {
  const baselineScenario = baselineRow?.scenario ?? null;
  const rec =
    payload != null && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload) : null;
  const canonical = payload != null ? extractCanonicalMlScenarios(payload) : [];
  const fromModal = payload != null ? extractListingTypesFromSaleXrayModal(payload) : { classic: null, premium: null };
  const scenariosLista = Array.isArray(rec?.scenarios)
    ? /** @type {Record<string, unknown>[]} */ (rec.scenarios)
    : [];
  const sx =
    rec?.sale_xray_modal != null && typeof rec.sale_xray_modal === "object"
      ? /** @type {Record<string, unknown>} */ (rec.sale_xray_modal)
      : null;

  const asHit = (/** @type {unknown} */ scenario, /** @type {string} */ path) => {
    if (scenario == null || typeof scenario !== "object") return null;
    return { scenario: /** @type {Record<string, unknown>} */ (scenario), path };
  };

  let hit = asHit(findListingTypeScenarioInCanonical(canonical, type), "rec.scenarios|canonical");
  if (hit) return hit;

  hit = asHit(findListingTypeScenarioLoose(scenariosLista, type), "rec.scenarios|loose_id");
  if (hit) return hit;

  hit = asHit(findListingTypeInScenariosNonBaseline(scenariosLista, type, baselineScenario), "rec.scenarios|non_baseline");
  if (hit) return hit;

  hit = asHit(fromModal[type], `sale_xray_modal|extractListingTypes.${type}`);
  if (hit) return hit;

  if (sx != null) {
    hit = asHit(buscarCenarioListingTypeNasChavesDoModal(sx, type), `sale_xray_modal|deep_keys.${type}`);
    if (hit) return hit;

    hit = asHit(buscarCenarioListingTypeEmPromotionScenarios(sx, type), `sale_xray_modal.promotion_scenarios|${type}`);
    if (hit) return hit;
  }

  return { scenario: null, path: null };
}

/**
 * Par Clássico + Premium para exibição simultânea (ordem fixa).
 *
 * @param {{
 *   payload?: unknown;
 *   baselineRow?: { scenario: unknown; group: string } | null;
 *   catalogRow?: Record<string, unknown> | null;
 * }} input
 * @returns {{
 *   cards: { type: ListingTypeChoice; title: string; scenario: unknown; group: string; isAtual: boolean }[];
 *   currentListingType: ListingTypeChoice;
 * }}
 */
export function resolveListingTypeCompareCards({ payload, baselineRow = null, catalogRow = null }) {
  const baselineScenario = baselineRow?.scenario ?? null;
  const baselineGroup = baselineRow?.group ?? "baseline";
  const currentListingType = inferListingTypeFromCatalogRow(catalogRow);
  const alternateType = currentListingType === "classic" ? "premium" : "classic";

  const classicRes = resolverCenarioListingTypeComCaminho(payload, baselineRow, "classic");
  const premiumRes = resolverCenarioListingTypeComCaminho(payload, baselineRow, "premium");

  /** Cenários por tipo vindos só da API (sem duplicar baseline no outro card). */
  const cenarioApiPorTipo = {
    classic: classicRes.scenario,
    premium: premiumRes.scenario,
  };

  /** @type {Record<ListingTypeChoice, Record<string, unknown> | null>} */
  const byType = { classic: cenarioApiPorTipo.classic, premium: cenarioApiPorTipo.premium };

  if (baselineScenario != null && typeof baselineScenario === "object") {
    byType[currentListingType] = /** @type {Record<string, unknown>} */ ({ ...baselineScenario });
  }

  const cards = LISTING_TYPE_ORDER.map((type) => {
    const isAtual = currentListingType === type;
    return {
      type,
      title: listingTypeScenarioTitle(type),
      scenario: byType[type],
      group: baselineGroup,
      isAtual,
      papel: isAtual ? "baseline_real" : "cenario_alternativo_ml",
      cenarioDisponivel: byType[type] != null,
    };
  });

  return { cards, currentListingType, alternateType };
}
