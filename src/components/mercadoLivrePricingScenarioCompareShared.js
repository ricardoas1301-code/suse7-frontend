// ======================================================
// Ordenação / rótulos do comparativo ML — puro (sem React).
// Multi-marketplace: hoje só ML; funções genéricas sobre `scenario`.
// ======================================================

/** @typedef {"baseline" | "participating" | "available"} ScenarioUxGroup */

/**
 * @param {unknown} scenario
 * @returns {ScenarioUxGroup}
 */
export function classifyScenarioUxGroup(scenario) {
  if (!scenario || typeof scenario !== "object") return "available";
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return "baseline";
  const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (kind === "base") return "baseline";
  const sid = String(r.scenario_id ?? "").toLowerCase();
  if (sid === "baseline") return "baseline";
  /** Mesma prioridade do badge: backend envia após GET /seller-promotions/items */
  const eff =
    r._raiox_listing_effective_api_state != null ? String(r._raiox_listing_effective_api_state).trim().toLowerCase() : "";
  if (eff === "active") return "participating";
  if (eff === "scheduled" || eff === "participate" || eff === "expired") return "available";

  if (r.seller_participates === true) return "participating";
  if (r.seller_participates === false) return "available";

  if (r.promotion_active === true) return "participating";
  const st = String(r.status ?? "").toLowerCase();
  if (st === "active") return "participating";
  if (st === "scheduled") return "available";
  return "available";
}

const GROUP_ORDER = /** @type {Record<ScenarioUxGroup, number>} */ ({
  baseline: 0,
  participating: 1,
  available: 2,
});

/**
 * @param {unknown} scenario
 * @returns {string}
 */
export function cardHeadingLabel(scenario) {
  if (!scenario || typeof scenario !== "object") return "";
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return "Preço normal";
  const sid0 = String(r.scenario_id ?? "").toLowerCase();
  if (sid0 === "baseline") return "Preço normal";
  const kind0 = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (kind0 === "base") return "Preço normal";

  const listingTitle =
    r._raiox_listing_display_name != null && String(r._raiox_listing_display_name).trim() !== ""
      ? String(r._raiox_listing_display_name).trim()
      : "";
  if (listingTitle !== "") return listingTitle;
  const name =
    (r.promotion_name != null && String(r.promotion_name).trim() !== ""
      ? String(r.promotion_name)
      : null) ||
    (r.label != null && String(r.label).trim() !== "" ? String(r.label) : null) ||
    (r.scenario_id != null ? String(r.scenario_id) : "");
  return name;
}

/**
 * Badge do card Raio-x: texto + grupo visual alinhados ao metadado enriquecido da listagem.
 * @param {unknown} scenario
 * @returns {{ label: string | null; uxGroup: ScenarioUxGroup }}
 */
export function resolveRaioxListingBadge(scenario) {
  if (!scenario || typeof scenario !== "object") return { label: null, uxGroup: "available" };
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return { label: null, uxGroup: "baseline" };
  if (String(r.scenario_id ?? "").toLowerCase() === "baseline") return { label: null, uxGroup: "baseline" };

  const eff =
    r._raiox_listing_effective_api_state != null ? String(r._raiox_listing_effective_api_state).trim().toLowerCase() : "";
  if (eff === "active") return { label: "Ativa", uxGroup: "participating" };
  if (eff === "scheduled") return { label: "Programada", uxGroup: "available" };
  if (eff === "participate") return { label: "Disponível", uxGroup: "available" };
  if (eff === "expired") return { label: null, uxGroup: "available" };

  const pst = String(r.status ?? "").toLowerCase();
  if (pst === "candidate" || pst === "eligible" || pst === "available") {
    return { label: "Disponível", uxGroup: "available" };
  }

  const g = classifyScenarioUxGroup(scenario);
  const st = String(r.status ?? "").toLowerCase();
  if (g === "participating") return { label: "Ativa", uxGroup: "participating" };
  if (g === "available") return { label: st === "scheduled" ? "Programada" : "Disponível", uxGroup: "available" };
  return { label: null, uxGroup: g };
}

/**
 * Status do anúncio (grid) para segunda linha do card baseline no Raio-x — só apresentação.
 *
 * @param {unknown} scenario
 * @returns {{ label: string; badgeClass: "participating" | "available" }}
 */
export function resolveRaioxBaselineListingStatusBadge(scenario) {
  const lr =
    scenario && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)._raiox_listing_row
      : null;
  if (lr && typeof lr === "object") {
    const L = /** @type {Record<string, unknown>} */ (lr);
    const key = L.statusKey != null ? String(L.statusKey).trim().toLowerCase() : "";
    const labelRaw = L.statusLabel != null ? String(L.statusLabel).trim() : "";
    if (labelRaw !== "" && labelRaw !== "—") {
      const badgeClass = key === "paused" ? "available" : "participating";
      return { label: labelRaw, badgeClass };
    }
    const rawSt = L.status != null ? String(L.status).trim().toLowerCase() : "";
    if (rawSt === "active") return { label: "Ativo", badgeClass: "participating" };
    if (rawSt === "paused") return { label: "Pausado", badgeClass: "available" };
    if (rawSt === "closed") return { label: "Encerrado", badgeClass: "available" };
    if (rawSt === "not_yet_active" || rawSt === "inactive") return { label: "Inativo", badgeClass: "available" };
  }
  return { label: "Ativo", badgeClass: "participating" };
}

/**
 * Linha de vigência para cards (DD/MM a DD/MM) — baseline não exibe.
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function formatScenarioVigenciaLine(scenario) {
  if (!scenario || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return null;
  const kind = String(r.kind ?? "").toLowerCase();
  if (kind === "base") return null;
  const startRaw = r.starts_at != null ? String(r.starts_at).trim() : "";
  const endRaw = r.ends_at != null ? String(r.ends_at).trim() : "";
  const ds = startRaw !== "" ? formatIsoDateToDdMm(startRaw) : null;
  const de = endRaw !== "" ? formatIsoDateToDdMm(endRaw) : null;
  if (ds && de) return `${ds} a ${de}`;
  if (ds && !de) return `desde ${ds}`;
  if (!ds && de) return `até ${de}`;
  return null;
}

const SALE_XRAY_NO_VIGENCIA = "Sem data informada";

/**
 * @param {string | null | undefined} iso
 * @returns {string | null}
 */
function formatIsoToRaioxVigenciaPtBr(iso) {
  if (!iso || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(t).replace(".", "");
}

/**
 * Intervalo curto pt-BR (ex.: "22 de abr a 11 de mai") — alinhado ao contrato do modal no backend.
 *
 * @param {string | null | undefined} startIso
 * @param {string | null | undefined} endIso
 * @returns {string | null}
 */
export function formatRaioxVigenciaPtBrRange(startIso, endIso) {
  const x = startIso ? formatIsoToRaioxVigenciaPtBr(String(startIso)) : null;
  const y = endIso ? formatIsoToRaioxVigenciaPtBr(String(endIso)) : null;
  if (x && y) return `${x} a ${y}`;
  if (x) return x;
  if (y) return y;
  return null;
}

/**
 * @param {Record<string, unknown>} r
 */
function pickRowVigenciaDateStrings(r) {
  const pick = (...vals) => {
    for (const v of vals) {
      if (v == null) continue;
      const s = String(v).trim();
      if (s !== "") return s;
    }
    return "";
  };
  const startRaw = pick(
    r.starts_at,
    r.promotion_start_date,
    r.promotionStartDate,
    r.start_date,
    r.date_from,
  );
  const endRaw = pick(r.ends_at, r.promotion_end_date, r.promotionEndDate, r.finish_date, r.end_date, r.date_to);
  return { startRaw, endRaw };
}

/**
 * Linha de vigência obrigatória nos cards de promoção (baseline sem linha).
 * Ordem: texto literal ML → contrato `_sale_xray_vigencia_text` → datas canônicas/aliases → fallback seguro.
 *
 * @param {unknown} scenario
 * @returns {{ line: string | null; audit: { promotion_id: string | null; starts_at_before: string | null; ends_at_before: string | null; fonte: string | null; fallback_aplicado: boolean } }}
 */
export function resolveRaioxCardVigenciaLine(scenario) {
  const emptyAudit = {
    promotion_id: null,
    starts_at_before: null,
    ends_at_before: null,
    fonte: null,
    fallback_aplicado: false,
  };
  if (!scenario || typeof scenario !== "object") return { line: null, audit: emptyAudit };
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return { line: null, audit: emptyAudit };
  const kind = String(r.kind ?? "").toLowerCase();
  if (kind === "base") return { line: null, audit: emptyAudit };

  const beforeS = r.starts_at != null && String(r.starts_at).trim() !== "" ? String(r.starts_at).trim() : null;
  const beforeE = r.ends_at != null && String(r.ends_at).trim() !== "" ? String(r.ends_at).trim() : null;
  const pid = r.promotion_id != null ? String(r.promotion_id).trim() : null;

  const litRow = r.promotion_vigencia_text;
  if (litRow != null && String(litRow).trim() !== "") {
    const t = String(litRow).trim();
    return {
      line: t,
      audit: {
        promotion_id: pid,
        starts_at_before: beforeS,
        ends_at_before: beforeE,
        fonte: "promotion_vigencia_text",
        fallback_aplicado: t === SALE_XRAY_NO_VIGENCIA,
      },
    };
  }
  const promNested =
    r.promotion != null && typeof r.promotion === "object" ? /** @type {Record<string, unknown>} */ (r.promotion) : null;
  const litNested = promNested?.promotion_vigencia_text;
  if (litNested != null && String(litNested).trim() !== "") {
    const t = String(litNested).trim();
    return {
      line: t,
      audit: {
        promotion_id: pid,
        starts_at_before: beforeS,
        ends_at_before: beforeE,
        fonte: "promotion.promotion_vigencia_text",
        fallback_aplicado: t === SALE_XRAY_NO_VIGENCIA,
      },
    };
  }
  const sx = r._sale_xray_vigencia_text;
  if (sx != null && String(sx).trim() !== "") {
    const t = String(sx).trim();
    return {
      line: t,
      audit: {
        promotion_id: pid,
        starts_at_before: beforeS,
        ends_at_before: beforeE,
        fonte: "_sale_xray_vigencia_text",
        fallback_aplicado: t === SALE_XRAY_NO_VIGENCIA,
      },
    };
  }
  const { startRaw, endRaw } = pickRowVigenciaDateStrings(r);
  const ranged = formatRaioxVigenciaPtBrRange(startRaw || null, endRaw || null);
  if (ranged) {
    return {
      line: ranged,
      audit: {
        promotion_id: pid,
        starts_at_before: beforeS,
        ends_at_before: beforeE,
        fonte: "starts_at_ends_at_aliases",
        fallback_aplicado: false,
      },
    };
  }
  return {
    line: SALE_XRAY_NO_VIGENCIA,
    audit: {
      promotion_id: pid,
      starts_at_before: beforeS,
      ends_at_before: beforeE,
      fonte: "fallback_sem_data",
      fallback_aplicado: true,
    },
  };
}

/**
 * `VITE_SALE_XRAY_VIGENCIA_AUDIT=1` ou listings de regressão Raio-x (vigência).
 *
 * @param {string} listingHint
 */
export function shouldSaleXrayVigenciaAuditTrace(listingHint) {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SALE_XRAY_VIGENCIA_AUDIT === "1") return true;
  const s = listingHint != null ? String(listingHint) : "";
  return ["6086562408", "4473597419", "4304663219", "4473596489"].some((id) => s.includes(id));
}

/**
 * @param {string} iso
 * @returns {string | null}
 */
function formatIsoDateToDdMm(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/**
 * @param {unknown[]} scenarios
 * @returns {string}
 */
export function saleXrayListingHintFromScenarios(scenarios) {
  const s0 = scenarios && scenarios[0];
  if (!s0 || typeof s0 !== "object") return "";
  const r = /** @type {Record<string, unknown>} */ (s0);
  const row = r._raiox_listing_row;
  if (row && typeof row === "object") {
    const L = /** @type {Record<string, unknown>} */ (row);
    if (L.externalId != null) return String(L.externalId);
    if (L.external_listing_id != null) return String(L.external_listing_id);
  }
  return "";
}

/**
 * Auditoria de frete Raio-x vs grid (ex.: MLB4304663219 / DCL24).
 * `VITE_SALE_XRAY_SHIPPING_AUDIT=1` liga para qualquer anúncio.
 */
export function shouldSaleXrayShippingAuditTrace(listingHint) {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SALE_XRAY_SHIPPING_AUDIT === "1") return true;
  const s = listingHint != null ? String(listingHint) : "";
  return s.includes("4304663219") || s.includes("4473596489") || s.includes("6046839404");
}

/** Debug: MLB6551978954 ou VITE_SALE_XRAY_DEBUG=1 */
export function shouldSaleXrayDebugTrace(payloadOrListingHint) {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SALE_XRAY_DEBUG === "1") return true;
  if (typeof payloadOrListingHint === "string" && payloadOrListingHint.includes("6551978954")) return true;
  if (payloadOrListingHint != null && typeof payloadOrListingHint === "object" && !Array.isArray(payloadOrListingHint)) {
    const rec = /** @type {Record<string, unknown>} */ (payloadOrListingHint);
    if (rec.listing_external_id != null && String(rec.listing_external_id).includes("6551978954")) return true;
  }
  if (Array.isArray(payloadOrListingHint)) {
    if (saleXrayListingHintFromScenarios(payloadOrListingHint).includes("6551978954")) return true;
  }
  return false;
}

/** @param {...unknown} vals */
export function firstNonEmptyBrlString(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return null;
}

/**
 * Contexto de frete no contrato / `sale_xray_pricing` / `marketplace` (um cenário por vez).
 * Prioridade: `ml_shipping_cost_context` (canônico ML) → `shipping_cost_context` → `shipping_context`.
 *
 * @param {Record<string, unknown> | null | undefined} pricing
 * @returns {"free_for_buyer" | "buyer_pays" | null}
 */
export function pickPricingShippingCostContext(pricing) {
  if (!pricing || typeof pricing !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (pricing);
  const candidates = [p.ml_shipping_cost_context, p.shipping_cost_context, p.shipping_context];
  for (const v of candidates) {
    if (v == null || String(v).trim() === "") continue;
    const s = String(v).trim().toLowerCase();
    if (s === "free_for_buyer" || s === "buyer_pays") return /** @type {"free_for_buyer" | "buyer_pays"} */ (s);
  }
  return null;
}

/**
 * Card comercial oficial (breakdown API ou SSR da página de promoções ML).
 *
 * @param {string} src
 * @returns {boolean}
 */
export function isMlCardContractPayoutSource(src) {
  const s = String(src ?? "").trim();
  return s === "ml_card_breakdown" || s === "ml_frontend_ssr_promotions";
}

/**
 * Prioridade UI “Você recebe” (Raio-x). Com `marketplace_payout_source === "ml_card_breakdown"`, só campos do card ML.
 *
 * @param {Record<string, unknown>} m — `scenario.marketplace`
 * @param {Record<string, unknown> | null} sx — `scenario.sale_xray_pricing`
 * @param {Record<string, unknown>} scenario — cenário completo (fallbacks)
 * @returns {{ raw: string | null; source: string }}
 */
export function pickSaleXrayYouReceiveRawString(m, sx, scenario) {
  const payoutSrc = String(m.marketplace_payout_source ?? sx?.marketplace_payout_source ?? "").trim();
  /** Motor isolado por card (Raio-x): não misturar com card ML / preview. */
  if (payoutSrc === "suse7_sale_xray_simple") {
    const mp = firstNonEmptyBrlString(m.marketplace_payout_amount_brl);
    if (mp != null) return { raw: mp, source: "marketplace_payout_amount_brl" };
    const netRec = firstNonEmptyBrlString(sx?.net_receivable_brl);
    if (netRec != null) return { raw: netRec, source: "net_receivable_brl" };
    const prFlat =
      scenario.pricing != null && typeof scenario.pricing === "object"
        ? /** @type {Record<string, unknown>} */ (scenario.pricing)
        : null;
    const fromPr = firstNonEmptyBrlString(prFlat?.net_receivable_brl);
    if (fromPr != null) return { raw: fromPr, source: "pricing.net_receivable_brl" };
  }
  const previewYou = firstNonEmptyBrlString(m.preview_you_receive_brl);
  if (previewYou != null && m.preview_is_estimated === true && !isMlCardContractPayoutSource(payoutSrc)) {
    return { raw: previewYou, source: "preview_you_receive_brl" };
  }
  if (payoutSrc === "ml_card_unavailable") {
    return { raw: null, source: "ml_card_unavailable" };
  }
  const cardAmt = firstNonEmptyBrlString(m.ml_card_payout_amount_brl, sx?.ml_card_payout_amount_brl);
  const cardLegacy = firstNonEmptyBrlString(m.ml_card_payout_brl, sx?.ml_card_payout_brl);
  if (isMlCardContractPayoutSource(payoutSrc)) {
    if (cardAmt != null) return { raw: cardAmt, source: "ml_card_payout_amount_brl" };
    if (cardLegacy != null) return { raw: cardLegacy, source: "ml_card_payout_brl" };
    return { raw: null, source: "ml_card_breakdown_no_card_payout" };
  }
  const mp = firstNonEmptyBrlString(m.marketplace_payout_amount_brl);
  if (cardAmt != null) return { raw: cardAmt, source: "ml_card_payout_amount_brl" };
  if (cardLegacy != null) return { raw: cardLegacy, source: "ml_card_payout_brl" };
  if (mp != null) return { raw: mp, source: "marketplace_payout_amount_brl" };
  const netRec = firstNonEmptyBrlString(sx?.net_receivable_brl);
  if (netRec != null) return { raw: netRec, source: "net_receivable_brl" };
  const prFlat =
    scenario.pricing != null && typeof scenario.pricing === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.pricing)
      : null;
  const fromPr = firstNonEmptyBrlString(prFlat?.net_receivable_brl);
  if (fromPr != null) return { raw: fromPr, source: "pricing.net_receivable_brl" };
  const res =
    scenario.result != null && typeof scenario.result === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.result)
      : null;
  const fromRes = firstNonEmptyBrlString(res?.net_receivable_brl, res?.marketplace_payout_amount_brl);
  if (fromRes != null) return { raw: fromRes, source: "result_fallback" };
  return { raw: null, source: "none" };
}

/**
 * Frete exibido no Raio-x — promoção: card ML antes de health/NP.
 *
 * @param {Record<string, unknown>} m
 * @param {Record<string, unknown> | null} sx
 * @param {Record<string, unknown>} scenario
 * @returns {{ raw: string | null; source: string }}
 */
export function pickSaleXrayShippingRawString(m, sx, scenario) {
  const payoutSrcEarly = String(m.marketplace_payout_source ?? sx?.marketplace_payout_source ?? "").trim();
  if (payoutSrcEarly === "suse7_sale_xray_simple") {
    const s = firstNonEmptyBrlString(m.shipping_cost_amount_brl, sx?.shipping_cost_amount_brl);
    return { raw: s, source: s != null ? "shipping_cost_amount_brl" : "none" };
  }
  if (scenario.is_baseline === true) {
    const s = firstNonEmptyBrlString(m.shipping_cost_amount_brl, sx?.shipping_cost_amount_brl);
    return { raw: s, source: s != null ? "shipping_cost_amount_brl" : "none" };
  }
  const payoutSrc = String(m.marketplace_payout_source ?? sx?.marketplace_payout_source ?? "").trim();
  if (payoutSrc === "ml_card_unavailable") {
    return { raw: null, source: "ml_card_unavailable" };
  }
  const a = firstNonEmptyBrlString(m.ml_card_shipping_amount_brl, sx?.ml_card_shipping_amount_brl);
  const b = firstNonEmptyBrlString(m.ml_card_shipping_brl, sx?.ml_card_shipping_brl);
  const c = firstNonEmptyBrlString(m.shipping_cost_amount_brl, sx?.shipping_cost_amount_brl);
  if (a != null) return { raw: a, source: "ml_card_shipping_amount_brl" };
  if (b != null) return { raw: b, source: "ml_card_shipping_brl" };
  if (c != null) return { raw: c, source: "shipping_cost_amount_brl" };
  return { raw: null, source: "none" };
}

/**
 * Log temporário quando o valor final ainda parece repasse health (ex. 68,26) ou trace explícito.
 *
 * @param {Record<string, unknown>} scenario
 * @param {Record<string, unknown>} m
 * @param {Record<string, unknown> | null} sx
 * @param {{ raw: string | null; source: string }} picked
 * @param {boolean} forceTrace
 */
export function logSaleXrayPayoutPickInRender(scenario, m, sx, picked, forceTrace) {
  const n = picked.raw != null ? Number(String(picked.raw).replace(",", ".")) : NaN;
  const suspicious =
    Number.isFinite(n) &&
    (Math.abs(n - 68.26) < 0.03 || Math.abs(n - 71.7) < 0.03 || Math.abs(n - 74.48) < 0.03);
  const cardRaw = firstNonEmptyBrlString(m.ml_card_payout_amount_brl, sx?.ml_card_payout_amount_brl);
  const diverge =
    cardRaw != null &&
    picked.raw != null &&
    String(cardRaw).trim() !== String(picked.raw).trim();
  if (!forceTrace && !suspicious && !diverge) return;
  const promotionName = scenario.promotion_name != null ? String(scenario.promotion_name) : null;
  console.warn("[SALE_XRAY_PAYOUT_PICK]", {
    promotion_name: promotionName,
    sale_price_brl: m.sale_price_brl ?? sx?.sale_price_brl ?? null,
    ml_card_payout_amount_brl: m.ml_card_payout_amount_brl ?? sx?.ml_card_payout_amount_brl ?? null,
    marketplace_payout_amount_brl: m.marketplace_payout_amount_brl ?? null,
    marketplace_payout_source: m.marketplace_payout_source ?? sx?.marketplace_payout_source ?? null,
    picked_source: picked.source,
    you_receive_final_raw: picked.raw,
  });
}

/**
 * Chave estável e única por card — evita colapso do React quando `scenario_id` / `promotion_id` repetem entre janelas.
 * @param {unknown} scenario
 * @param {number} index
 */
export function resolveSaleXrayArticleKey(scenario, index) {
  const r = scenario && typeof scenario === "object" ? /** @type {Record<string, unknown>} */ (scenario) : {};
  const id = r.scenario_id != null ? String(r.scenario_id).trim() : "";
  const pk = r.promotion_stable_key != null ? String(r.promotion_stable_key).trim() : "";
  const st = r.starts_at != null ? String(r.starts_at).trim() : "";
  const ed = r.ends_at != null ? String(r.ends_at).trim() : "";
  const base = id !== "" && id !== "undefined" ? id : pk !== "" ? pk : `row-${index}`;
  return `${base}::${st}::${ed}::i${index}`;
}

/**
 * @param {unknown[]} scenarios
 * @param {{ preserveInputOrder?: boolean } | undefined} options — quando `preserveInputOrder`, mantém a ordem do array (só UI / gráfico alinhado ao rail).
 * @returns {{ scenario: unknown; group: ScenarioUxGroup }[]}
 */
export function buildOrderedScenarioRows(scenarios, options = undefined) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return [];
  const copy = scenarios.filter((s) => s !== null && typeof s === "object");
  const head = copy[0];
  const preserveInputOrder = options != null && options.preserveInputOrder === true;
  const preserveOrder =
    preserveInputOrder ||
    (head &&
      typeof head === "object" &&
      /** @type {Record<string, unknown>} */ (head)._sale_xray_preserve_order === true);
  if (preserveOrder) {
    return copy.map((scenario) => ({
      scenario,
      group: classifyScenarioUxGroup(scenario),
    }));
  }
  copy.sort((a, b) => {
    const ga = classifyScenarioUxGroup(a);
    const gb = classifyScenarioUxGroup(b);
    const oa = GROUP_ORDER[ga] ?? 99;
    const ob = GROUP_ORDER[gb] ?? 99;
    if (oa !== ob) return oa - ob;
    const titleCmp = cardHeadingLabel(a).localeCompare(cardHeadingLabel(b), "pt-BR");
    if (titleCmp !== 0) return titleCmp;
    const ra = /** @type {Record<string, unknown>} */ (a);
    const rb = /** @type {Record<string, unknown>} */ (b);
    const sa = ra.starts_at != null ? String(ra.starts_at) : "";
    const sb = rb.starts_at != null ? String(rb.starts_at) : "";
    return sa.localeCompare(sb);
  });
  return copy.map((scenario) => ({
    scenario,
    group: classifyScenarioUxGroup(scenario),
  }));
}

/**
 * Raio-x da venda: baseline + cenários promocionais quando a API ainda é `pricing-scenarios`.
 * Com `sale-xray-modal` (`from_sale_xray_modal`), a lista vem do backend conforme `scenarioScope` do POST
 * (`current_active` = Raio-x; `pricing_opportunities` = página Precificação Inteligente).
 * Inclui `status` `candidate` / `eligible` (elegível, botão Participar na grid).
 *
 * @param {unknown[]} scenarios
 * @returns {unknown[]}
 */
export function filterScenariosForRaioxDisplay(scenarios) {
  if (!Array.isArray(scenarios)) return [];
  return scenarios.filter((s) => {
    if (!s || typeof s !== "object") return false;
    const r = /** @type {Record<string, unknown>} */ (s);
    if (r.is_baseline === true) return true;
    const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
    if (kind === "base") return true;
    const sid = String(r.scenario_id ?? "").toLowerCase();
    if (sid === "baseline") return true;
    const eff = String(r._raiox_listing_effective_api_state ?? "").toLowerCase();
    if (eff === "scheduled") return true;
    if (r.promotion_active === true) return true;
    const st = String(r.status ?? "").toLowerCase();
    if (st === "active" || st === "scheduled" || st === "candidate" || st === "eligible") return true;
    const stype = String(r.scenario_type ?? "").toLowerCase();
    const pid = r.promotion_id != null ? String(r.promotion_id).trim() : "";
    if (pid !== "" && (stype === "promotion" || kind === "promotion")) return true;
    return false;
  });
}

/**
 * @param {unknown[]} scenariosRaw
 * @param {string} scenarioKey
 * @returns {Record<string, unknown> | null}
 */
function findLegacyMlPromoByScenarioKey(scenariosRaw, scenarioKey) {
  if (!Array.isArray(scenariosRaw) || scenarioKey === "") return null;
  for (const s of scenariosRaw) {
    if (!s || typeof s !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (s);
    if (r.is_baseline === true) continue;
    const sid = r.scenario_id != null ? String(r.scenario_id) : "";
    const pk = r.promotion_stable_key != null ? String(r.promotion_stable_key) : "";
    if (sid === scenarioKey || pk === scenarioKey) return r;
  }
  return null;
}

/**
 * Monta as linhas do Raio-x a partir do contrato `sale_xray_modal` (ordem = backend).
 * Mescla com `baseline` / `scenarios` legados para manter `ui`, `data_quality`, etc.
 *
 * @param {unknown} payload
 * @returns {Record<string, unknown>[] | null}
 */
export function buildRaioxScenariosFromSaleXrayModalContract(payload) {
  if (!payload || typeof payload !== "object") return null;
  const rec = /** @type {Record<string, unknown>} */ (payload);
  if (rec.from_sale_xray_modal !== true) return null;
  const sx = rec.sale_xray_modal;
  if (!sx || typeof sx !== "object") return null;
  const normal = /** @type {Record<string, unknown>} */ (sx).normal_scenario;
  if (!normal || typeof normal !== "object") return null;

  const trace = shouldSaleXrayDebugTrace(rec);
  const promosArrEarly = /** @type {Record<string, unknown>} */ (sx).promotion_scenarios;
  const promosEarly = Array.isArray(promosArrEarly) ? /** @type {Record<string, unknown>[]} */ (promosArrEarly) : [];
  if (trace) {
    console.info("[SALE_XRAY_DEBUG][CONTRACT_IN]", {
      listing_external_id: rec.listing_external_id ?? null,
      from_sale_xray_modal: rec.from_sale_xray_modal === true,
      promotion_scenarios_length: promosEarly.length,
      promotion_scenarios: promosEarly.map((item) => {
        const it = item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {};
        const pr = it.promotion != null && typeof it.promotion === "object" ? /** @type {Record<string, unknown>} */ (it.promotion) : {};
        return {
          scenario_key: it.scenario_key ?? null,
          promotion_name: pr.promotion_name ?? null,
          status: pr.status ?? null,
        };
      }),
    });
  }

  const baselineLegacy =
    rec.baseline != null && typeof rec.baseline === "object"
      ? /** @type {Record<string, unknown>} */ (rec.baseline)
      : null;
  const scenariosRaw = Array.isArray(rec.scenarios) ? rec.scenarios : [];
  const sxRec = /** @type {Record<string, unknown>} */ (sx);
  const promosArr = sxRec.promotion_scenarios;
  const promos = Array.isArray(promosArr) ? /** @type {Record<string, unknown>[]} */ (promosArr) : [];

  const nPricing =
    normal.pricing != null && typeof normal.pricing === "object"
      ? /** @type {Record<string, unknown>} */ (normal.pricing)
      : {};

  const baselineRow =
    baselineLegacy != null
      ? { ...baselineLegacy }
      : {
          is_baseline: true,
          scenario_id: "baseline",
          kind: "base",
          scenario_type: "base",
        };

  const m0 =
    baselineRow.marketplace != null && typeof baselineRow.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ ({ ...baselineRow.marketplace })
      : {};
  if (nPricing.sale_price_brl != null) m0.sale_price_brl = nPricing.sale_price_brl;
  if (nPricing.fee_amount_brl != null) m0.sale_fee_amount_brl = nPricing.fee_amount_brl;
  if (nPricing.fee_percent != null) m0.sale_fee_percent = nPricing.fee_percent;
  if (nPricing.fee_type_label != null) m0.listing_type_label = nPricing.fee_type_label;
  if (nPricing.ml_card_payout_amount_brl != null && String(nPricing.ml_card_payout_amount_brl).trim() !== "")
    m0.ml_card_payout_amount_brl = nPricing.ml_card_payout_amount_brl;
  if (nPricing.ml_card_payout_brl != null && String(nPricing.ml_card_payout_brl).trim() !== "")
    m0.ml_card_payout_brl = nPricing.ml_card_payout_brl;
  if (nPricing.ml_card_shipping_amount_brl != null && String(nPricing.ml_card_shipping_amount_brl).trim() !== "")
    m0.ml_card_shipping_amount_brl = nPricing.ml_card_shipping_amount_brl;
  if (nPricing.ml_card_shipping_brl != null && String(nPricing.ml_card_shipping_brl).trim() !== "")
    m0.ml_card_shipping_brl = nPricing.ml_card_shipping_brl;
  if (nPricing.marketplace_payout_source != null) m0.marketplace_payout_source = nPricing.marketplace_payout_source;

  const shipMerge0 = firstNonEmptyBrlString(
    nPricing.ml_card_shipping_amount_brl,
    nPricing.ml_card_shipping_brl,
    nPricing.shipping_cost_amount_brl
  );
  if (shipMerge0 != null) m0.shipping_cost_amount_brl = shipMerge0;
  else if (nPricing.shipping_cost_amount_brl != null) m0.shipping_cost_amount_brl = nPricing.shipping_cost_amount_brl;
  {
    const shipCtx0 = pickPricingShippingCostContext(nPricing);
    if (shipCtx0 != null) m0.shipping_context = shipCtx0;
    else delete m0.shipping_context;
  }

  const src0 = nPricing.marketplace_payout_source != null ? String(nPricing.marketplace_payout_source).trim() : "";
  if (isMlCardContractPayoutSource(src0)) {
    const p0 = firstNonEmptyBrlString(nPricing.ml_card_payout_amount_brl, nPricing.ml_card_payout_brl);
    if (p0 != null) m0.marketplace_payout_amount_brl = p0;
  } else {
    const p0 = firstNonEmptyBrlString(
      nPricing.ml_card_payout_amount_brl,
      nPricing.ml_card_payout_brl,
      nPricing.net_receivable_brl
    );
    if (p0 != null) m0.marketplace_payout_amount_brl = p0;
  }
  if (nPricing.charged_fee_gross_brl != null) m0.charged_fee_gross_brl = nPricing.charged_fee_gross_brl;
  if (nPricing.charged_fee_net_brl != null) m0.charged_fee_net_brl = nPricing.charged_fee_net_brl;
  if (nPricing.charged_fee_reduction_brl != null) m0.charged_fee_reduction_brl = nPricing.charged_fee_reduction_brl;
  if (nPricing.charged_fee_rebate_brl != null) m0.charged_fee_rebate_brl = nPricing.charged_fee_rebate_brl;
  if (nPricing.charged_fee_discount_brl != null) m0.charged_fee_discount_brl = nPricing.charged_fee_discount_brl;
  if (nPricing.charged_fee_source != null) m0.charged_fee_source = nPricing.charged_fee_source;
  if (nPricing.charged_fee_is_estimated != null) m0.charged_fee_is_estimated = nPricing.charged_fee_is_estimated;
  if (nPricing.billing_tariff_applied != null) m0.billing_tariff_applied = nPricing.billing_tariff_applied;
  if (nPricing.sale_xray_simple_financials === true) {
    delete m0.ml_card_payout_amount_brl;
    delete m0.ml_card_payout_brl;
    delete m0.ml_card_shipping_amount_brl;
    delete m0.ml_card_shipping_brl;
  }
  baselineRow.marketplace = m0;
  baselineRow.sale_xray_pricing = nPricing;
  baselineRow.is_baseline = true;
  baselineRow._sale_xray_preserve_order = true;
  /** Gráfico comparativo lê `result.*` como as promos; mesclar `normal_scenario.result` sem apagar legado com `{}` vazio. */
  if (normal.result != null && typeof normal.result === "object") {
    const nr = /** @type {Record<string, unknown>} */ (normal.result);
    const prev =
      baselineRow.result != null && typeof baselineRow.result === "object"
        ? /** @type {Record<string, unknown>} */ (baselineRow.result)
        : {};
    baselineRow.result = { ...prev, ...nr };
  }

  /** @type {Record<string, unknown>[]} */
  const out = [baselineRow];

  for (let i = 0; i < promos.length; i += 1) {
    const pc = promos[i];
    if (!pc || typeof pc !== "object") continue;
    const contract = /** @type {Record<string, unknown>} */ (pc);
    const key = contract.scenario_key != null ? String(contract.scenario_key) : "";
    const legacy = findLegacyMlPromoByScenarioKey(scenariosRaw, key);
    const pricing =
      contract.pricing != null && typeof contract.pricing === "object"
        ? /** @type {Record<string, unknown>} */ (contract.pricing)
        : {};
    const prom =
      contract.promotion != null && typeof contract.promotion === "object"
        ? /** @type {Record<string, unknown>} */ (contract.promotion)
        : {};

    const row =
      legacy != null
        ? { ...legacy }
        : {
            is_baseline: false,
            scenario_id: key || "promotion",
            kind: "promotion",
            scenario_type: "promotion",
          };

    const m =
      row.marketplace != null && typeof row.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ ({ ...row.marketplace })
        : {};
    if (pricing.sale_price_brl != null) m.sale_price_brl = pricing.sale_price_brl;
    if (pricing.fee_amount_brl != null) m.sale_fee_amount_brl = pricing.fee_amount_brl;
    if (pricing.fee_amount_gross_brl != null) m.promotion_fee_gross_brl = pricing.fee_amount_gross_brl;
    if (pricing.fee_amount_net_display_brl != null) m.sale_fee_net_display_brl = pricing.fee_amount_net_display_brl;
    if (pricing.promotion_fee_net_brl != null) m.promotion_fee_net_brl = pricing.promotion_fee_net_brl;
    if (pricing.subsidy_ml_brl != null) m.subsidy_ml_brl = pricing.subsidy_ml_brl;
    if (pricing.has_fee_subsidy != null) m.has_fee_subsidy = pricing.has_fee_subsidy;
    if (pricing.show_fee_subsidy_breakdown != null) m.show_fee_subsidy_breakdown = pricing.show_fee_subsidy_breakdown;
    if (pricing.show_fee_updated_result != null) m.show_fee_updated_result = pricing.show_fee_updated_result;
    if (pricing.subsidy_ml_breakdown_brl != null) m.subsidy_ml_breakdown_brl = pricing.subsidy_ml_breakdown_brl;
    if (pricing.fee_percent != null) m.sale_fee_percent = pricing.fee_percent;
    if (pricing.fee_type_label != null) m.listing_type_label = pricing.fee_type_label;
    if (pricing.ml_card_payout_amount_brl != null && String(pricing.ml_card_payout_amount_brl).trim() !== "")
      m.ml_card_payout_amount_brl = pricing.ml_card_payout_amount_brl;
    if (pricing.ml_card_payout_brl != null && String(pricing.ml_card_payout_brl).trim() !== "")
      m.ml_card_payout_brl = pricing.ml_card_payout_brl;
    if (pricing.ml_card_shipping_amount_brl != null && String(pricing.ml_card_shipping_amount_brl).trim() !== "")
      m.ml_card_shipping_amount_brl = pricing.ml_card_shipping_amount_brl;
    if (pricing.ml_card_shipping_brl != null && String(pricing.ml_card_shipping_brl).trim() !== "")
      m.ml_card_shipping_brl = pricing.ml_card_shipping_brl;
    if (pricing.marketplace_payout_source != null) m.marketplace_payout_source = pricing.marketplace_payout_source;

    const shipMerge = firstNonEmptyBrlString(
      pricing.ml_card_shipping_amount_brl,
      pricing.ml_card_shipping_brl,
      pricing.shipping_cost_amount_brl
    );
    if (shipMerge != null) m.shipping_cost_amount_brl = shipMerge;
    else if (pricing.shipping_cost_amount_brl != null) m.shipping_cost_amount_brl = pricing.shipping_cost_amount_brl;
    {
      const shipCtxPromo = pickPricingShippingCostContext(pricing);
      if (shipCtxPromo != null) m.shipping_context = shipCtxPromo;
      else delete m.shipping_context;
    }

    const payoutSrcP = pricing.marketplace_payout_source != null ? String(pricing.marketplace_payout_source).trim() : "";
    if (isMlCardContractPayoutSource(payoutSrcP)) {
      const cardP = firstNonEmptyBrlString(pricing.ml_card_payout_amount_brl, pricing.ml_card_payout_brl);
      if (cardP != null) m.marketplace_payout_amount_brl = cardP;
    } else {
      const payM = firstNonEmptyBrlString(
        pricing.ml_card_payout_amount_brl,
        pricing.ml_card_payout_brl,
        pricing.net_receivable_brl
      );
      if (payM != null) m.marketplace_payout_amount_brl = payM;
    }
    if (pricing.charged_fee_gross_brl != null) m.charged_fee_gross_brl = pricing.charged_fee_gross_brl;
    if (pricing.charged_fee_net_brl != null) m.charged_fee_net_brl = pricing.charged_fee_net_brl;
    if (pricing.charged_fee_reduction_brl != null) m.charged_fee_reduction_brl = pricing.charged_fee_reduction_brl;
    if (pricing.charged_fee_rebate_brl != null) m.charged_fee_rebate_brl = pricing.charged_fee_rebate_brl;
    if (pricing.charged_fee_discount_brl != null) m.charged_fee_discount_brl = pricing.charged_fee_discount_brl;
    if (pricing.charged_fee_source != null) m.charged_fee_source = pricing.charged_fee_source;
    if (pricing.charged_fee_is_estimated != null) m.charged_fee_is_estimated = pricing.charged_fee_is_estimated;
    if (pricing.billing_tariff_applied != null) m.billing_tariff_applied = pricing.billing_tariff_applied;
    if (pricing.marketplace_benefit_amount_brl != null)
      m.marketplace_benefit_amount_brl = pricing.marketplace_benefit_amount_brl;
    if (pricing.marketplace_benefit_label != null) m.marketplace_benefit_label = pricing.marketplace_benefit_label;
    if (pricing.marketplace_benefit_type != null) m.marketplace_benefit_type = pricing.marketplace_benefit_type;
    if (pricing.marketplace_benefit_source != null) m.marketplace_benefit_source = pricing.marketplace_benefit_source;
    if (pricing.marketplace_participation_amount_brl != null)
      m.marketplace_participation_amount_brl = pricing.marketplace_participation_amount_brl;
    if (pricing.marketplace_participation_label != null)
      m.marketplace_participation_label = pricing.marketplace_participation_label;
    if (pricing.marketplace_participation_source != null)
      m.marketplace_participation_source = pricing.marketplace_participation_source;
    if (pricing.marketplace_participation_resolution != null)
      m.marketplace_participation_resolution = pricing.marketplace_participation_resolution;
    if (pricing.sale_xray_simple_financials === true) {
      delete m.ml_card_payout_amount_brl;
      delete m.ml_card_payout_brl;
      delete m.ml_card_shipping_amount_brl;
      delete m.ml_card_shipping_brl;
    }
    row.marketplace = m;
    row.sale_xray_pricing = pricing;
    row.scenario_id = key || row.scenario_id;
    row.promotion_stable_key = key || row.promotion_stable_key;
    if (key !== "") row.scenario_key = key;
    if (prom.promotion_id != null) row.promotion_id = prom.promotion_id;
    if (prom.promotion_name != null) row.promotion_name = prom.promotion_name;
    if (prom.status != null) row.status = prom.status;
    if (prom.promotion_start_date != null) row.starts_at = prom.promotion_start_date;
    if (prom.promotion_end_date != null) row.ends_at = prom.promotion_end_date;
    row.seller_participates = true;
    row._sale_xray_vigencia_text =
      prom.promotion_vigencia_text != null ? String(prom.promotion_vigencia_text) : null;
    row._sale_xray_discount_text = prom.discount_text != null ? String(prom.discount_text) : null;
    row._sale_xray_subsidy_text = pricing.subsidy_text != null ? String(pricing.subsidy_text) : null;
    row._sale_xray_preserve_order = true;
    if (contract.internal_costs != null && typeof contract.internal_costs === "object") {
      row.internal_costs = contract.internal_costs;
    }
    if (contract.result != null && typeof contract.result === "object") {
      row.result = contract.result;
    }
    out.push(row);
  }

  if (trace) {
    console.info("[SALE_XRAY_DEBUG][CONTRACT_OUT]", {
      total_rows: out.length,
      rows: out.map((row, i) => {
        const r = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
        const sxP = r.sale_xray_pricing != null && typeof r.sale_xray_pricing === "object" ? /** @type {Record<string, unknown>} */ (r.sale_xray_pricing) : null;
        const prc = r.pricing != null && typeof r.pricing === "object" ? /** @type {Record<string, unknown>} */ (r.pricing) : null;
        return {
          scenario_key: r.scenario_key ?? r.scenario_id ?? null,
          scenario_type: r.scenario_type ?? null,
          ux_group: r._sale_xray_ux_group != null ? String(r._sale_xray_ux_group) : null,
          promotion_name: r.promotion_name ?? null,
          subsidy_text: sxP?.subsidy_text ?? prc?.subsidy_text ?? r._sale_xray_subsidy_text ?? null,
          index: i,
        };
      }),
    });
  }

  return out;
}

/**
 * @param {unknown} payload
 * @returns {Record<string, unknown>[]}
 */
export function extractCanonicalMlScenarios(payload) {
  if (!payload || typeof payload !== "object") return [];
  const rec = /** @type {Record<string, unknown>} */ (payload);
  const all = Array.isArray(rec.scenarios) ? rec.scenarios : [];
  if (all.length === 0) {
    const b = rec.baseline;
    return b != null && typeof b === "object" ? [/** @type {Record<string, unknown>} */ (b)] : [];
  }
  return /** @type {Record<string, unknown>[]} */ (all.slice());
}

/**
 * Anexa referência à linha do grid (enriquecimento de UI); não altera valores de marketplace/cenário.
 *
 * @param {unknown[]} scenarios
 * @param {unknown} row
 * @returns {unknown[]}
 */
export function mergeListingGridRowIntoMlScenarios(scenarios, row) {
  if (!Array.isArray(scenarios) || scenarios.length === 0 || !row || typeof row !== "object") {
    return Array.isArray(scenarios) ? scenarios : [];
  }
  return scenarios.map((s) => {
    if (!s || typeof s !== "object") return s;
    const r = /** @type {Record<string, unknown>} */ (s);
    return { ...r, _raiox_listing_row: row };
  });
}

/**
 * Preenche só campos `_raiox_*` usados por rótulos/badges quando o backend já mandou `promotion_name` / flags.
 *
 * @param {unknown[]} scenarios
 * @param {unknown} _mlScenariosPayload
 * @param {unknown} _row
 * @returns {unknown[]}
 */
export function enrichRaioxScenariosWithListingPromotionMetadata(scenarios, _mlScenariosPayload, _row) {
  void _mlScenariosPayload;
  void _row;
  const list = Array.isArray(scenarios) ? scenarios : [];
  return list.map((s) => {
    if (!s || typeof s !== "object") return s;
    const r = /** @type {Record<string, unknown>} */ (s);
    const isBaseline =
      r.is_baseline === true ||
      String(r.scenario_id ?? "").toLowerCase() === "baseline" ||
      String(r.kind ?? r.scenario_kind ?? "").toLowerCase() === "base";

    const display =
      (r._raiox_listing_display_name != null && String(r._raiox_listing_display_name).trim() !== ""
        ? String(r._raiox_listing_display_name).trim()
        : "") ||
      (r.promotion_name != null && String(r.promotion_name).trim() !== "" ? String(r.promotion_name).trim() : "") ||
      (r.label != null && String(r.label).trim() !== "" ? String(r.label).trim() : "");

    let eff = r._raiox_listing_effective_api_state != null ? String(r._raiox_listing_effective_api_state).trim() : "";
    if (!eff && !isBaseline) {
      if (r.promotion_active === true) eff = "active";
      else {
        const st = String(r.status ?? "").toLowerCase();
        if (st === "scheduled") eff = "scheduled";
        else if (st === "active") eff = "active";
        else if (st === "candidate" || st === "eligible" || st === "available") eff = "participate";
      }
    }

    const out = { ...r };
    if (display !== "") {
      const prev = r._raiox_listing_display_name != null ? String(r._raiox_listing_display_name).trim() : "";
      if (prev === "") out._raiox_listing_display_name = display;
    }
    if (!isBaseline && eff !== "") out._raiox_listing_effective_api_state = eff;
    return out;
  });
}

/** Sufixos com `.anuncios-sell-popover__offer-sem--*` em `Anuncios.css` (backend + faixa “Regular” por margem). */
export const OFFER_STATUS_SEMANTIC_CLASS_SUFFIXES = new Set([
  "critical",
  "danger",
  "acceptable",
  "great",
  "excellent",
  "regular",
]);

/**
 * @param {unknown} suffix
 * @returns {string} classe completa ou string vazia
 */
export function offerSemanticSuffixToCssClass(suffix) {
  const s = suffix != null ? String(suffix).trim() : "";
  if (!OFFER_STATUS_SEMANTIC_CLASS_SUFFIXES.has(s)) return "";
  return `anuncios-sell-popover__offer-sem--${s}`;
}

/**
 * Parse de `result.margin_pct` da API (mesma ideia do gráfico comparativo — só leitura).
 * @param {unknown} marginPctRaw
 * @returns {number | null}
 */
function parseMarginPercentNumberFromScenario(marginPctRaw) {
  if (marginPctRaw == null || String(marginPctRaw).trim() === "") return null;
  const n = Number(String(marginPctRaw).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Status da oferta (rótulo + cor) a partir da margem % já calculada no cenário — sem alterar valores financeiros.
 *
 * @param {unknown} marginPctFromScenario — ex.: `scenario.result.margin_pct`
 * @returns {{ label: string; color: string; level?: string } | null} `null` se margem ausente/ inválida → usar texto/cor do backend.
 */
export function getOfferStatusFromMargin(marginPctFromScenario) {
  const m = parseMarginPercentNumberFromScenario(marginPctFromScenario);
  if (m == null) return null;

  if (m < 0) {
    return { label: "Crítico", color: "critical", level: "critical" };
  }
  if (m < 5) {
    return { label: "Regular", color: "regular", level: "regular" };
  }
  if (m < 10) {
    return { label: "Bom", color: "great", level: "good" };
  }
  if (m < 20) {
    return { label: "Ótimo", color: "great", level: "great" };
  }
  return { label: "Excelente", color: "excellent", level: "excellent" };
}
