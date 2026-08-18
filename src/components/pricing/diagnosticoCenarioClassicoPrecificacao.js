// ======================================================
// Diagnóstico DEV — cenário Clássico na Precificação Inteligente (não altera dados exibidos).
// ======================================================

import { cardHeadingLabel } from "../mercadoLivrePricingScenarioCompareShared.js";
import {
  inferListingTypeFromCatalogRow,
  inferListingTypeFromScenario,
  resolverCenarioListingTypeComCaminho,
} from "./pricingListingTypeUi.js";

const CHAVES_CLASSICO = [
  "classic",
  "classico",
  "gold_special",
  "classic_scenario",
  "classico_scenario",
  "gold_special_scenario",
  "listing_type_scenarios",
  "listing_type_comparison",
  "alternate_listing_types",
];

/**
 * @param {unknown} node
 * @param {string} path
 * @param {string[]} needles
 * @param {number} depth
 * @param {{ path: string; keys: string[]; preview: Record<string, unknown> }[]} out
 */
function varrerObjeto(node, path, needles, depth, out) {
  if (depth > 10 || node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => varrerObjeto(item, `${path}[${i}]`, needles, depth + 1, out));
    return;
  }
  const rec = /** @type {Record<string, unknown>} */ (node);
  for (const key of Object.keys(rec)) {
    const lower = key.toLowerCase();
    const nextPath = path ? `${path}.${key}` : key;
    if (needles.some((n) => lower.includes(n))) {
      const val = rec[key];
      const preview = {};
      if (val != null && typeof val === "object" && !Array.isArray(val)) {
        const v = /** @type {Record<string, unknown>} */ (val);
        for (const k of ["scenario_id", "scenario_key", "fee_type_label", "listing_type_label", "sale_price_brl"]) {
          if (v[k] != null) preview[k] = v[k];
        }
        if (v.pricing != null && typeof v.pricing === "object") {
          const p = /** @type {Record<string, unknown>} */ (v.pricing);
          if (p.fee_type_label != null) preview.fee_type_label = p.fee_type_label;
          if (p.sale_price_brl != null) preview.sale_price_brl = p.sale_price_brl;
        }
        if (v.marketplace != null && typeof v.marketplace === "object") {
          const m = /** @type {Record<string, unknown>} */ (v.marketplace);
          if (m.sale_price_brl != null) preview.sale_price_brl = m.sale_price_brl;
          if (m.listing_type_label != null) preview.listing_type_label = m.listing_type_label;
        }
      }
      out.push({ path: nextPath, keys: Object.keys(rec).slice(0, 12), preview });
    }
    varrerObjeto(rec[key], nextPath, needles, depth + 1, out);
  }
}

/**
 * @param {unknown[]} list
 */
function resumirScenariosListaCompleta(list) {
  return list
    .map((s, i) => {
      if (!s || typeof s !== "object") return null;
      const r = /** @type {Record<string, unknown>} */ (s);
      const nome =
        (r.promotion_name != null && String(r.promotion_name).trim() !== ""
          ? String(r.promotion_name).trim()
          : null) ||
        (r.label != null && String(r.label).trim() !== "" ? String(r.label).trim() : null) ||
        cardHeadingLabel(s) ||
        null;
      return {
        index: i,
        scenario_id: r.scenario_id ?? null,
        scenario_key: r.scenario_key ?? null,
        scenario_type: r.scenario_type ?? r.kind ?? r.scenario_kind ?? null,
        name: nome,
        is_baseline: r.is_baseline === true,
        listing_type_inferido: inferListingTypeFromScenario(s),
        fee_type_label:
          r.sale_xray_pricing != null && typeof r.sale_xray_pricing === "object"
            ? /** @type {Record<string, unknown>} */ (r.sale_xray_pricing).fee_type_label
            : r.marketplace != null && typeof r.marketplace === "object"
              ? /** @type {Record<string, unknown>} */ (r.marketplace).listing_type_label
              : null,
      };
    })
    .filter(Boolean);
}

/**
 * Log DEV: origem do cenário Clássico no payload da Precificação Inteligente.
 *
 * @param {{
 *   externalListingId?: string | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   payload?: unknown;
 *   baselineRow?: { scenario: unknown; group?: string } | null;
 *   resolveResult?: {
 *     cards?: { type: string; cenarioDisponivel?: boolean; papel?: string }[];
 *     currentListingType?: string;
 *     alternateType?: string;
 *   } | null;
 * }} ctx
 */
export function logDiagnosticoCenarioClassicoPrecificacao(ctx) {
  if (!import.meta.env.DEV) return;

  const payload = ctx.payload;
  const rec =
    payload != null && typeof payload === "object"
      ? /** @type {Record<string, unknown>} */ (payload)
      : null;
  const sx =
    rec?.sale_xray_modal != null && typeof rec.sale_xray_modal === "object"
      ? /** @type {Record<string, unknown>} */ (rec.sale_xray_modal)
      : null;

  const ocorrencias = [];
  if (rec) varrerObjeto(rec, "payload", CHAVES_CLASSICO, 0, ocorrencias);

  const scenarios = Array.isArray(rec?.scenarios) ? /** @type {unknown[]} */ (rec.scenarios) : [];
  const listingTypeAtual = inferListingTypeFromCatalogRow(ctx.catalogRow ?? null);
  const cardClassico = ctx.resolveResult?.cards?.find((c) => c.type === "classic");
  const cardPremium = ctx.resolveResult?.cards?.find((c) => c.type === "premium");

  const classicRes = resolverCenarioListingTypeComCaminho(payload, ctx.baselineRow ?? null, "classic");
  const premiumRes = resolverCenarioListingTypeComCaminho(payload, ctx.baselineRow ?? null, "premium");

  const hasClassicScenario = classicRes.scenario != null;
  const hasPremiumScenario = premiumRes.scenario != null;
  const cardClassicoMontado = cardClassico?.cenarioDisponivel === true;

  const resumoObjetivo = {
    external_listing_id: ctx.externalListingId ?? null,
    listing_type_atual: listingTypeAtual,
    listing_type_alternativo_esperado: ctx.resolveResult?.alternateType ?? null,
    hasClassicScenario,
    classicScenarioPathFound: classicRes.path,
    hasPremiumScenario,
    premiumScenarioPathFound: premiumRes.path,
    scenarios_total: scenarios.length,
    scenarios_disponiveis: resumirScenariosListaCompleta(scenarios),
    card_classico_montado: cardClassicoMontado,
    card_premium_montado: cardPremium?.cenarioDisponivel === true,
    sale_xray_modal_keys: sx ? Object.keys(sx) : [],
  };

  console.groupCollapsed(
    `[S7 PI][Clássico] listing=${String(ctx.externalListingId ?? "—")} tipo_atual=${listingTypeAtual}`,
  );
  console.log("[S7 PI][Clássico] RESUMO", resumoObjetivo);

  if (!hasClassicScenario) {
    console.warn("API não retornou cenário clássico para este anúncio.");
  } else if (!cardClassicoMontado) {
    console.warn(
      "[S7 PI][Clássico] Payload contém cenário clássico, mas o card não montou — revisar mapper.",
      { path: classicRes.path },
    );
  } else {
    console.info("[S7 PI][Clássico] Cenário clássico disponível no payload e montado no card.", {
      path: classicRes.path,
    });
  }

  console.info("Ocorrências no payload (classic / gold_special / listing_type_*)", ocorrencias);
  console.groupEnd();
}

/**
 * Log DEV quando payload/scenarios incompletos (estabilização por listing).
 *
 * @param {{
 *   externalListingId?: string | null;
 *   motivo: string;
 *   detalhe?: Record<string, unknown>;
 * }} ctx
 */
export function logDiagnosticoPayloadIncompletoPrecificacao(ctx) {
  if (!import.meta.env.DEV) return;
  console.warn("[S7 PI][Payload]", {
    external_listing_id: ctx.externalListingId ?? null,
    motivo: ctx.motivo,
    ...ctx.detalhe,
  });
}
