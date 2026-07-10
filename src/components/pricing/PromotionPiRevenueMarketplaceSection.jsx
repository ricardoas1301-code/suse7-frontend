// ======================================================
// PI — Receita do Marketplace (BASE, sem subsídio) — modal principal.
// S1.PROMO-BASE-FINANCIAL-PARITY-NO-SUBSIDY.
//
// - Valores do cenário simulado DO PRÓPRIO listing_type (isolado Clássico/Premium).
// - "Você recebe" = preço final − tarifa (cheia) − envio, sempre fechando com as linhas.
// - NÃO exibe "Reduzimos sua tarifa"; NÃO aplica subsidy_brl.
// - official_amount_to_receive_brl do ML só entra em log/auditoria (nunca no render).
// ======================================================

import { useMemo } from "react";
import Decimal from "decimal.js";

import {
  logPromoBaseNoSubsidyParity,
  resolvePromotionCardBaseFinancials,
  toDecBase,
} from "../../features/pricing/promotions/resolvePromotionCardBaseFinancials.js";

import { PricingScenarioMetricValue } from "./PricingScenarioMetricValue.jsx";

const COMPONENT_NAME = "PromotionPiRevenueMarketplaceSection";
const RENDER_VERSION = "promo-base-financial-parity-no-subsidy";
const ROUND = Decimal.ROUND_HALF_UP;

/** @param {Decimal | null | undefined} d @returns {string} */
function fmtBrl(d) {
  if (d == null || !d.isFinite()) return "—";
  const n = Number(d.toDecimalPlaces(2, ROUND).toFixed(2));
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {Decimal | null | undefined} d @returns {string} */
function fmtBrlNeg(d) {
  if (d == null || !d.isFinite() || d.isZero()) return "—";
  const n = Number(d.abs().toDecimalPlaces(2, ROUND).toFixed(2));
  return `-R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {string | null | undefined} pct @returns {string | null} */
function fmtPct(pct) {
  const d = toDecBase(pct);
  if (d == null) return null;
  const n = Number(d.toDecimalPlaces(2, ROUND).toFixed(2));
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {{
 *   scenario: Record<string, unknown>;
 *   financialScenarioPending?: boolean;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 *   promotionSelectedKey?: string | null;
 *   officialRowContract?: Record<string, unknown> | null;
 *   comparisonModel?: "classic" | "premium" | null;
 *   isCurrentListingType?: boolean;
 *   selectedPromotionRequestId?: string | number | null;
 *   listingTypeCard?: string | null;
 *   listingExternalId?: string | null;
 *   sku?: string | null;
 *   promotionName?: string | null;
 * }} props
 */
export function PromotionPiRevenueMarketplaceSection({
  scenario,
  financialScenarioPending = false,
  promocaoPrecoVendaExibicaoOverride = null,
  promotionSelectedKey = null,
  officialRowContract = null,
  comparisonModel = null,
  isCurrentListingType = false,
  selectedPromotionRequestId = null,
  listingTypeCard = null,
  listingExternalId = null,
  sku = null,
  promotionName = null,
}) {
  const model =
    comparisonModel === "classic" || comparisonModel === "premium"
      ? comparisonModel
      : listingTypeCard === "premium"
        ? "premium"
        : "classic";

  const listingTypeId = model === "premium" ? "gold_pro" : "gold_special";
  const listingTypeLabel = model === "premium" ? "Premium" : "Clássico";

  const officialRef = officialRowContract ?? {};
  // official_amount_to_receive_brl é usado APENAS para log/auditoria (nunca no render).
  const officialAmountToReceiveBrl =
    isCurrentListingType === true ? officialRef.official_amount_to_receive_brl ?? null : null;

  const view = useMemo(
    () =>
      resolvePromotionCardBaseFinancials({
        scenario,
        salePriceOverrideBrl: promocaoPrecoVendaExibicaoOverride,
        officialAmountToReceiveBrl,
        listingTypeId,
      }),
    [scenario, promocaoPrecoVendaExibicaoOverride, officialAmountToReceiveBrl, listingTypeId],
  );

  const dec = view._dec;
  const pending = financialScenarioPending === true && view.has_core !== true;

  const commissionDisplay = fmtPct(view.commission_percent);

  if (typeof import.meta !== "undefined" && !import.meta.env.PROD) {
    logPromoBaseNoSubsidyParity({
      listing_id: listingExternalId,
      sku,
      promotion_name: promotionName,
      card_model: model,
      listing_type_id: listingTypeId,
      final_price_brl: view.final_price_brl,
      marketplace_fee_brl: view.marketplace_fee_brl,
      shipping_brl: view.shipping_brl,
      rendered_receive_brl: view.rendered_receive_brl,
      calculated_receive_brl: view.calculated_receive_brl,
      official_ml_receive_brl: view.official_ml_receive_brl,
      official_ml_receive_ignored_reason: view.official_ml_receive_ignored_reason,
      has_ml_subsidy_hint: view.has_ml_subsidy_hint,
      parity_status: view.parity_status,
      warnings: view.warnings,
    });
  }

  return (
    <div
      className="anuncios-sell-popover__section anuncios-sell-popover__section--receita-pi-promo"
      data-s7-render-version={RENDER_VERSION}
      data-s7-comparison-model={model}
      data-s7-listing-type-id={listingTypeId}
      data-s7-promotion-selected-key={promotionSelectedKey ?? undefined}
      data-s7-promotion-request-id={selectedPromotionRequestId ?? undefined}
    >
      <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>

      <div className="anuncios-sell-popover__block">
        <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key anuncios-sell-popover__line--promo-sale">
          <span>Valor de venda na promoção</span>
          <PricingScenarioMetricValue pending={pending}>
            {pending ? null : fmtBrl(dec.saleDec)}
          </PricingScenarioMetricValue>
        </div>
      </div>

      <div className="anuncios-sell-popover__block">
        <div className="anuncios-sell-popover__line">
          <span>Tarifa de venda</span>
          <PricingScenarioMetricValue pending={pending}>
            {pending ? null : fmtBrlNeg(dec.cardFeeDec)}
          </PricingScenarioMetricValue>
        </div>
        {!pending && commissionDisplay != null ? (
          <div className="anuncios-sell-popover__muted" data-s7-revenue-row-subtitle="fee">
            {`${listingTypeLabel} ${commissionDisplay}`}
          </div>
        ) : null}
      </div>

      <div className="anuncios-sell-popover__block">
        <div className="anuncios-sell-popover__line">
          <span>Custo de envio</span>
          <PricingScenarioMetricValue pending={pending}>
            {pending ? null : fmtBrlNeg(dec.shipDec)}
          </PricingScenarioMetricValue>
        </div>
      </div>

      <div className="anuncios-sell-popover__block">
        <div className="anuncios-sell-popover__line anuncios-sell-popover__line--total anuncios-sell-popover__line--key">
          <span>Você recebe</span>
          <PricingScenarioMetricValue pending={pending}>
            {pending ? null : <strong>{fmtBrl(dec.receiveDec)}</strong>}
          </PricingScenarioMetricValue>
        </div>
      </div>
    </div>
  );
}

export { RENDER_VERSION as PROMOTION_PI_REVENUE_RENDER_VERSION, COMPONENT_NAME as PROMOTION_PI_REVENUE_COMPONENT_NAME };
