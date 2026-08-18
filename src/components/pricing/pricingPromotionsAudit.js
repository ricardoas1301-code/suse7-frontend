// ======================================================
// PI — Promoções: logs de auditoria (somente DEV).
// ======================================================

import {
  buildPromotionContractIdentityKey,
  buildPromotionScenarioIdentityFromRow,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import { resolvePromotionSelectionId } from "./pricingPromotionCarouselUi.js";

/**
 * @param {unknown} payload
 */
export function contarPromocoesBrutasPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      modal_promotion_scenarios: 0,
      top_promotion_scenarios: 0,
      top_scenarios_nao_baseline: 0,
      top_scenarios_promo_filtradas: 0,
      merged_union_estimate: 0,
    };
  }
  const rec = /** @type {Record<string, unknown>} */ (payload);
  const sx =
    rec.sale_xray_modal != null && typeof rec.sale_xray_modal === "object"
      ? /** @type {Record<string, unknown>} */ (rec.sale_xray_modal)
      : null;
  const modalArr = sx != null && Array.isArray(sx.promotion_scenarios) ? sx.promotion_scenarios : [];
  const topPromoArr = Array.isArray(rec.promotion_scenarios) ? rec.promotion_scenarios : [];
  const scenariosTop = Array.isArray(rec.scenarios) ? rec.scenarios : [];
  const baselineTop =
    rec.baseline != null && typeof rec.baseline === "object"
      ? rec.baseline
      : scenariosTop.find((s) => s && typeof s === "object" && s.is_baseline === true) ?? null;
  let naoBaseline = 0;
  let promoFiltradas = 0;
  for (const s of scenariosTop) {
    if (!s || typeof s !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (s);
    if (row === baselineTop || row.is_baseline === true) continue;
    naoBaseline += 1;
    const st = String(row.scenario_type ?? row.kind ?? "").toLowerCase();
    const sid = String(row.scenario_id ?? row.scenario_key ?? "").toLowerCase();
    if (st.includes("listing") && st.includes("type")) continue;
    if (sid === "gold_special" || sid === "gold_pro" || sid.includes("listing_type")) continue;
    promoFiltradas += 1;
  }
  const mergedUnionEstimate = Math.max(modalArr.length, topPromoArr.length, promoFiltradas);
  return {
    modal_promotion_scenarios: modalArr.length,
    top_promotion_scenarios: topPromoArr.length,
    top_scenarios_nao_baseline: naoBaseline,
    top_scenarios_promo_filtradas: promoFiltradas,
    merged_union_estimate: mergedUnionEstimate,
  };
}

/**
 * @param {unknown} payload
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRaw(payload, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const counts = contarPromocoesBrutasPayload(payload);
  const sx =
    payload != null && typeof payload === "object"
      ? /** @type {Record<string, unknown>} */ (payload).sale_xray_modal
      : null;
  const modalAfterWrap =
    sx != null && typeof sx === "object" && Array.isArray(/** @type {Record<string, unknown>} */ (sx).promotion_scenarios)
      ? /** @type {Record<string, unknown>[]} */ (/** @type {Record<string, unknown>} */ (sx).promotion_scenarios).length
      : counts.merged_union_estimate;
  const rawTotal = Math.max(
    counts.modal_promotion_scenarios,
    counts.top_promotion_scenarios,
    counts.top_scenarios_promo_filtradas,
    modalAfterWrap,
  );
  console.info("[S7_PI_PROMOS_AUDIT] raw_total", {
    listingExternalId: listingExternalId ?? null,
    raw_total: rawTotal,
    after_wrap_modal_total: modalAfterWrap,
    ...counts,
  });
}

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   afterBuildRaiox?: number;
 *   afterOrdered?: number;
 *   afterSplit?: number;
 * }} stats
 */
export function logPiPromosAuditPipeline(stats) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] pipeline", stats);
}

/**
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRows(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  console.info("[S7_PI_PROMOS_AUDIT] rows_total", {
    listingExternalId: listingExternalId ?? null,
    rows_total: list.length,
  });
  console.info("[S7_PI_PROMOS_AUDIT] identity_sample", {
    listingExternalId: listingExternalId ?? null,
    sample: list.slice(0, 20).map(({ scenario, group }, index) => ({
      group,
      ...buildPromotionScenarioIdentityFromRow(
        scenario,
        index,
        resolvePromotionSelectionId({ scenario, group }, index),
      ),
    })),
  });
  console.info("[S7_PI_PROMOS_AUDIT] status_sample", {
    listingExternalId: listingExternalId ?? null,
    sample: list.slice(0, 12).map(({ scenario, group }, index) => {
      const identity = buildPromotionScenarioIdentityFromRow(scenario, index);
      return {
        group,
        title: identity.title,
        status: identity.status,
        effective_api_state: identity.effective_api_state,
        dedupeKey: identity.dedupeKey,
      };
    }),
  });
}

/**
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditPanel(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] panel_total", {
    listingExternalId: listingExternalId ?? null,
    panel_total: Array.isArray(rows) ? rows.length : 0,
  });
}

/**
 * @param {number} renderedTotal
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRendered(renderedTotal, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] rendered_total", {
    listingExternalId: listingExternalId ?? null,
    rendered_total: renderedTotal,
  });
}

/**
 * Dump DEV do payload final usado pelos mini cards (objeto visual, não helper isolado).
 *
 * @param {{
 *   rows: { scenario: unknown; group: string }[];
 *   listingExternalId?: string | null;
 *   promocaoAtivaId?: string | null;
 *   resolveMeta?: (row: { scenario: unknown; group: string }, index: number) => Record<string, unknown>;
 *   expectedByPromotionName?: Record<string, { percent?: string | number; final_price?: string | number }>;
 * }} ctx
 */
export function logPiPromoMiniCardContractAudit(ctx) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(ctx.rows) ? ctx.rows : [];
  const resolveMeta = ctx.resolveMeta ?? (() => ({}));
  const expectedMap = ctx.expectedByPromotionName ?? {};

  for (let index = 0; index < list.length; index += 1) {
    const { scenario, group } = list[index];
    if (!scenario || typeof scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const meta = resolveMeta(list[index], index);
    const contract =
      r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
        : /** @type {Record<string, unknown>} */ ({});
    const rawFields =
      contract.raw_source_fields != null && typeof contract.raw_source_fields === "object"
        ? /** @type {Record<string, unknown>} */ (contract.raw_source_fields)
        : /** @type {Record<string, unknown>} */ ({});
    const audit =
      r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
        ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
        : /** @type {Record<string, unknown>} */ ({});

    const promotionName =
      contract.promotion_name != null
        ? String(contract.promotion_name)
        : r.promotion_name != null
          ? String(r.promotion_name)
          : r.label != null
            ? String(r.label)
            : "";
    const expected = expectedMap[promotionName] ?? null;
    const miniCardDiscountDisplay = meta.descontoResumo ?? null;
    const contractDisplay = contract.discount_percent_display ?? null;
    const divergente =
      expected?.percent != null &&
      contractDisplay != null &&
      String(expected.percent) !== String(contractDisplay);

    console.info("[S7_PI_PROMO_MINI_CARD_CONTRACT_AUDIT]", {
      listing_id: ctx.listingExternalId ?? contract.listing_id ?? r.external_listing_id ?? null,
      promotion_id: contract.promotion_id ?? r.promotion_id ?? null,
      promotion_name: promotionName || null,
      promotion_type: contract.promotion_type ?? r.promotion_type ?? null,
      status: contract.participation_status ?? group ?? null,
      action_label: meta.acaoRotulo ?? contract.action_kind ?? null,
      raw: {
        original_price: rawFields.original_price ?? audit.original_price ?? null,
        price: rawFields.promotion_price ?? audit.promotion_price ?? null,
        boosted_offer: contract.boosted_offer ?? audit.boosted_offer ?? null,
        total_price_for_boosted_offer:
          contract.total_price_for_boosted_offer_raw ?? audit.total_price_for_boosted_offer ?? null,
        suggested_discounted_price: null,
        min_discounted_price: null,
        max_discounted_price: null,
        seller_percentage: contract.seller_percentage_raw ?? audit.seller_percentage ?? null,
        meli_percentage: contract.meli_percentage_raw ?? audit.meli_percentage ?? null,
      },
      promotion_offer_contract: {
        original_price_brl: contract.original_price_brl ?? null,
        final_price_brl: contract.final_price_brl ?? null,
        final_price_source: contract.final_price_source ?? null,
        discount_amount_brl: contract.discount_amount_brl ?? null,
        discount_percent_decimal: contract.discount_percent_decimal ?? null,
        discount_percent_display: contractDisplay,
        discount_source: contract.discount_source ?? null,
        source_confidence: contract.source_confidence ?? null,
        source_warnings: contract.source_warnings ?? null,
      },
      ui: {
        mini_card_discount_display: miniCardDiscountDisplay,
        field_used_by_mini_card: "promotion_offer_contract.discount_percent_display",
        selected_promotion_id: ctx.promocaoAtivaId ?? null,
        is_selected: ctx.promocaoAtivaId != null && meta.selectionId === ctx.promocaoAtivaId,
      },
      comparison: expected
        ? {
            expected_ml_percent: expected.percent ?? null,
            expected_ml_final_price: expected.final_price ?? null,
            result: divergente ? "DIVERGENTE" : "OK",
          }
        : null,
    });
  }
}

/**
 * Log único por promoção selecionada — contrato fonte vs cards Clássico/Premium.
 *
 * @param {{
 *   listingExternalId?: string | null;
 *   promocaoScenario?: unknown;
 *   selectedFrom?: string | null;
 *   classicScenario?: unknown;
 *   premiumScenario?: unknown;
 * }} ctx
 */
export function logPromotionSelectedContractAudit(ctx) {
  if (!import.meta.env.DEV) return;
  const fonte =
    ctx.promocaoScenario != null && typeof ctx.promocaoScenario === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.promocaoScenario)
      : null;
  const contract =
    fonte?.promotion_offer_contract != null && typeof fonte.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (fonte.promotion_offer_contract)
      : null;

  function snapshotScenario(scenario) {
    if (scenario == null || typeof scenario !== "object") return null;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const c =
      r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
        : null;
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    return {
      base_price_brl: c?.original_price_brl ?? m.original_price_brl ?? null,
      final_price_brl: c?.final_price_brl ?? m.sale_price_brl ?? null,
      discount_amount_brl: c?.discount_amount_brl ?? m.seller_discount_amount_brl ?? null,
      discount_percent_display: c?.discount_percent_display ?? null,
      seller_receives_brl:
        c?.seller_receives_brl ?? m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? null,
      fee: m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
      freight: m.shipping_cost_amount_brl ?? null,
    };
  }

  console.info("[S7_PROMOTION_SELECTED_CONTRACT_AUDIT]", {
    listing_id: ctx.listingExternalId ?? contract?.listing_id ?? null,
    marketplace_account_id: contract?.marketplace_account_id ?? null,
    promotion_id: contract?.promotion_id ?? fonte?.promotion_id ?? null,
    promotion_name: contract?.promotion_name ?? fonte?.promotion_name ?? null,
    selected_from: ctx.selectedFrom ?? "promotion_mini_card",
    base_price_brl: contract?.original_price_brl ?? null,
    base_price_source: contract?.base_price_source ?? null,
    final_price_brl: contract?.final_price_brl ?? null,
    final_price_source: contract?.final_price_source ?? null,
    discount_amount_brl: contract?.discount_amount_brl ?? null,
    discount_percent: contract?.discount_percent_decimal ?? null,
    discount_percent_display: contract?.discount_percent_display ?? null,
    classic_contract: snapshotScenario(ctx.classicScenario),
    premium_contract: snapshotScenario(ctx.premiumScenario),
    source_fields: contract?.raw_source_fields ?? null,
  });
}

/**
 * Audit DEV — cards Clássico/Premium da promoção selecionada (mesmo contrato SSOT).
 *
 * @param {{
 *   cards: { type: string; scenario: unknown; promocaoPrecoVendaExibicao?: string | null }[];
 *   promocaoScenario?: unknown;
 *   listingExternalId?: string | null;
 *   promocaoNome?: string | null;
 *   descontoSellerPromocaoExibicao?: string | null;
 * }} ctx
 */
export function logPiPromoClassicPremiumContractAudit(ctx) {
  if (!import.meta.env.DEV) return;
  const fonte =
    ctx.promocaoScenario != null && typeof ctx.promocaoScenario === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.promocaoScenario)
      : null;
  const fonteContract =
    fonte?.promotion_offer_contract != null && typeof fonte.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (fonte.promotion_offer_contract)
      : null;

  for (const card of ctx.cards ?? []) {
    if (!card.scenario || typeof card.scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (card.scenario);
    const contract =
      r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
        : null;
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    const res =
      r.result != null && typeof r.result === "object"
        ? /** @type {Record<string, unknown>} */ (r.result)
        : /** @type {Record<string, unknown>} */ ({});

    const fontePct = fonteContract?.discount_percent_display ?? null;
    const cardPct = contract?.discount_percent_display ?? null;
    const divergenteDesconto =
      fontePct != null && cardPct != null && String(fontePct) !== String(cardPct);

    console.info("[S7_PI_PROMO_CLASSIC_PREMIUM_SSOT_AUDIT]", {
      listing_id: ctx.listingExternalId ?? contract?.listing_id ?? null,
      promotion_name: ctx.promocaoNome ?? contract?.promotion_name ?? null,
      promotion_id: contract?.promotion_id ?? fonteContract?.promotion_id ?? null,
      listing_type: card.type,
      base_price: contract?.original_price_brl ?? m.original_price_brl ?? null,
      promotion_price: contract?.final_price_brl ?? m.sale_price_brl ?? null,
      discount_percent: cardPct,
      discount_amount_brl: contract?.discount_amount_brl ?? m.seller_discount_amount_brl ?? null,
      fee: m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
      freight: m.shipping_cost_amount_brl ?? null,
      seller_receives: m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? null,
      profit: res.profit_brl ?? m.margin_amount_brl ?? null,
      margin: res.margin_pct ?? m.margin_percent ?? null,
      promotion_price_source: contract?.final_price_source ?? null,
      base_price_source: contract?.base_price_source ?? null,
      ui: {
        promocao_preco_venda_exibicao: card.promocaoPrecoVendaExibicao ?? null,
        desconto_seller_exibicao: ctx.descontoSellerPromocaoExibicao ?? null,
      },
      same_promotion_discount_as_source: divergenteDesconto ? "DIVERGENTE" : "OK",
      source_contract_discount_percent: fontePct,
    });
  }
}

/**
 * Auditoria financeira por promoção — compara campos oficiais ML (audit) vs cenário Suse7.
 *
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromoFinAudit(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  for (const { scenario } of list) {
    if (!scenario || typeof scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    const audit =
      r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
        ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
        : /** @type {Record<string, unknown>} */ ({});
    const mlDisc = audit.ml_discount_brl != null ? String(audit.ml_discount_brl) : null;
    const suse7Disc = m.seller_discount_amount_brl != null ? String(m.seller_discount_amount_brl) : null;
    const mlPct = audit.ml_discount_pct != null ? String(audit.ml_discount_pct) : null;
    const suse7Pct = m.seller_discount_percent != null ? String(m.seller_discount_percent) : null;
    console.info("[S7_PI_PROMO_FIN_AUDIT]", {
      listingExternalId: listingExternalId ?? null,
      promotion_name: r.promotion_name ?? r.label ?? null,
      promotion_id: r.promotion_id ?? null,
      type: r.promotion_type ?? null,
      ref_id: r.offer_id ?? null,
      raw_status: r.ml_promotion_raw_status ?? null,
      original_price: audit.original_price ?? m.original_price_brl ?? null,
      promotion_price: audit.promotion_price ?? m.sale_price_brl ?? null,
      ml_discount_brl: mlDisc,
      ml_discount_pct: mlPct,
      suse7_discount_brl: suse7Disc,
      suse7_discount_pct: suse7Pct,
      ml_fee_brl: null,
      suse7_fee_brl: m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
      ml_shipping_brl: null,
      suse7_shipping_brl: m.shipping_cost_amount_brl ?? null,
      ml_payout_brl: null,
      suse7_payout_brl: m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? null,
      diff_discount_brl: mlDisc && suse7Disc ? `${Number(suse7Disc) - Number(mlDisc)}` : null,
      diff_discount_pct: mlPct && suse7Pct ? `${Number(suse7Pct) - Number(mlPct)}` : null,
      diff_payout_brl: null,
      discount_source: audit.discount_source ?? null,
    });
  }
}

/**
 * Auditoria financeira profunda por promoção (DEV).
 *
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromoFinAuditDeep(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  for (const { scenario } of list) {
    if (!scenario || typeof scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    const audit =
      r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
        ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
        : /** @type {Record<string, unknown>} */ ({});
    console.info("[S7_PI_PROMO_FIN_AUDIT_DEEP]", {
      listingExternalId: listingExternalId ?? null,
      promotion_id: r.promotion_id ?? audit.promotion_id ?? null,
      type: r.promotion_type ?? audit.type ?? null,
      original_price: audit.original_price ?? m.original_price_brl ?? null,
      promotion_price: audit.promotion_price ?? m.sale_price_brl ?? null,
      seller_percentage: audit.seller_percentage ?? null,
      meli_percentage: audit.meli_percentage ?? null,
      discount_seller_brl: audit.discount_seller_brl ?? m.seller_discount_amount_brl ?? null,
      discount_meli_brl: audit.discount_meli_brl ?? m.promotion_subsidy_amount_brl ?? null,
      discount_total_brl: audit.discount_total_brl ?? null,
      boosted_offer: audit.boosted_offer ?? null,
      discount_meli_boost_amount: audit.discount_meli_boost_amount ?? null,
      total_price_for_boosted_offer: audit.total_price_for_boosted_offer ?? null,
      fee_before_subsidy: m.fee_amount_before_promo_subsidy_brl ?? m.sale_fee_amount_brl ?? null,
      fee_after_subsidy: m.fee_amount_after_promo_subsidy_brl ?? null,
      payout_before_subsidy: m.payout_before_promo_subsidy_brl ?? null,
      payout_after_subsidy:
        m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? m.payout_after_promo_subsidy_brl ?? null,
      meli_subsidy_source: audit.meli_subsidy_source ?? null,
      discount_source: audit.discount_source ?? null,
    });
  }
}

/**
 * UX cards centrais Clássico/Premium — preço original no cabeçalho; desconto só no card lateral.
 *
 * @param {{
 *   listingExternalId?: string | null;
 *   promocaoScenario?: unknown;
 *   promocaoNome?: string | null;
 *   originalHit?: { valor: number; source: string } | null;
 *   selectedFinalPrice?: number | null;
 * }} ctx
 */
export function logPromotionCalcCardUxOriginalPrice(ctx) {
  if (!import.meta.env.DEV) return;
  const fonte =
    ctx.promocaoScenario != null && typeof ctx.promocaoScenario === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.promocaoScenario)
      : null;
  const contract =
    fonte?.promotion_card_contract != null && typeof fonte.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (fonte.promotion_card_contract)
      : fonte?.promotion_offer_contract != null && typeof fonte.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (fonte.promotion_offer_contract)
        : null;

  console.info("[S7_PROMOTION_CALC_CARD_UX_ORIGINAL_PRICE]", {
    listing_id: ctx.listingExternalId ?? contract?.listing_id ?? null,
    promotion_id: contract?.promotion_id ?? fonte?.promotion_id ?? null,
    promotion_name: ctx.promocaoNome ?? contract?.promotion_name ?? fonte?.promotion_name ?? null,
    original_price: ctx.originalHit?.valor ?? null,
    selected_final_price: ctx.selectedFinalPrice ?? null,
    discount_amount_hidden_from_calc_card: true,
    discount_kept_on_promotion_card: true,
    source_trace: ctx.originalHit?.source ?? null,
  });
}

/**
 * Estado de loading dos valores financeiros derivados ao trocar promoção (aba Promoções).
 *
 * @param {{
 *   listingExternalId?: string | null;
 *   promocaoScenario?: unknown;
 *   classicCard?: { cenarioFinanceiroPendente?: boolean; selectedFinancialKey?: string | null; renderedFinancialKey?: string | null } | null;
 *   premiumCard?: { cenarioFinanceiroPendente?: boolean; selectedFinancialKey?: string | null; renderedFinancialKey?: string | null } | null;
 * }} ctx
 */
export function logPromotionCardFinancialLoadingState(ctx) {
  if (!import.meta.env.DEV) return;
  const fonte =
    ctx.promocaoScenario != null && typeof ctx.promocaoScenario === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.promocaoScenario)
      : null;
  const contract =
    fonte?.promotion_card_contract != null && typeof fonte.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (fonte.promotion_card_contract)
      : fonte?.promotion_offer_contract != null && typeof fonte.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (fonte.promotion_offer_contract)
        : null;

  for (const card of [ctx.classicCard, ctx.premiumCard]) {
    if (card == null) continue;
    console.info("[S7_PROMOTION_CARD_FINANCIAL_LOADING_STATE]", {
      listing_id: ctx.listingExternalId ?? contract?.listing_id ?? null,
      previous_promotion_id: card.renderedFinancialKey ?? null,
      selected_promotion_id: contract?.promotion_id ?? fonte?.promotion_id ?? null,
      loadingPromotionScenarioKey: card.selectedFinancialKey ?? null,
      renderedFinancialScenarioKey: card.renderedFinancialKey ?? null,
      is_pending: card.cenarioFinanceiroPendente === true,
      stale_values_hidden: card.cenarioFinanceiroPendente === true,
      listing_type: card === ctx.classicCard ? "classic" : "premium",
    });
  }
}
