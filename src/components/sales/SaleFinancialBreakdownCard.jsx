// ======================================================

// Card direito — breakdown financeiro da venda (somente leitura).

// ======================================================



import { getSaleRayxHealthShellClasses, resolveSaleRayxHealthState } from "./saleRayxHealthState";

import { getSaleRayxMarginSemantic } from "./saleRayxMarginSemantic";

import { collectSaleRayxContingencyMargin } from "./saleRayxPricingVariables";

import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip";
import SaleAppliedPromotionTooltipBody from "./SaleAppliedPromotionTooltipBody";
import SaleRayXFinancialLine from "./SaleRayXFinancialLine";

import {

  DASH,

  formatBrlApi,

  formatNegativeBrlApi,

  formatPositiveBrlApi,

  formatPercentApi,

  formatPercentDetailLabel,

} from "./saleRayxFormat";

/** @param {unknown} v */
function isTruthyAppliedPromotionFlag(v) {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1";
  }
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 */
function pickAppliedSalePromotion(fin) {
  const mr =
    fin?.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : null;
  const raw =
    (mr?.applied_sale_promotion && typeof mr.applied_sale_promotion === "object"
      ? mr.applied_sale_promotion
      : fin?.applied_sale_promotion && typeof fin.applied_sale_promotion === "object"
        ? fin.applied_sale_promotion
        : null) ?? null;
  if (!raw) return null;

  if (!isTruthyAppliedPromotionFlag(raw.has_applied_promotion)) return null;

  const original =
    raw.original_product_price_brl != null ? String(raw.original_product_price_brl).trim() : "";
  if (!original) return null;

  const name = raw.promotion_name != null ? String(raw.promotion_name).trim() : "";
  const percent =
    raw.promotion_discount_percent != null ? String(raw.promotion_discount_percent).trim() : "";

  if (!name && !percent) return null;

  return /** @type {Record<string, unknown>} */ ({
    ...raw,
    original_product_price_brl: original,
    promotion_name: name || "Promoção",
    promotion_discount_percent: percent || null,
  });
}

/**

 * @param {Record<string, unknown>} fin

 * @param {unknown} feePercent

 */

function buildMarketplaceFeePercentDetail(fin, feePercent) {

  const tier =

    fin.marketplace_fee_tier_label != null && String(fin.marketplace_fee_tier_label).trim() !== ""

      ? String(fin.marketplace_fee_tier_label).trim()

      : fin.listing_type_label != null && String(fin.listing_type_label).trim() !== ""

        ? String(fin.listing_type_label).trim()

        : null;

  const pct = formatPercentDetailLabel(feePercent != null ? String(feePercent) : null);

  if (tier && pct) {

    const pctNum = pct.replace("%", "").trim();

    return `${tier} ${pctNum}%`;

  }

  return pct;

}



/**

 * @param {{

 *   financial: Record<string, unknown> | null | undefined;

 *   profitMargin: Record<string, unknown> | null | undefined;

 * }} props

 */

export default function SaleFinancialBreakdownCard({ financial, profitMargin, detail = null }) {

  const fin = financial && typeof financial === "object" ? financial : {};

  const pm = profitMargin && typeof profitMargin === "object" ? profitMargin : {};

  const profitValue = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;

  const marginValue = pm.margin_percent ?? fin.margin_percent;

  const finResult = fin.result && typeof fin.result === "object" ? /** @type {Record<string, unknown>} */ (fin.result) : null;
  const healthLabelFromApi =
    pm.health_label ?? fin.health_label ?? finResult?.health_label ?? null;
  const { offerSemClass, healthLabel: healthLabelFallback } = getSaleRayxMarginSemantic(marginValue);
  const resultHealthLabel =
    healthLabelFromApi != null && String(healthLabelFromApi).trim() !== ""
      ? String(healthLabelFromApi).trim()
      : healthLabelFallback != null && String(healthLabelFallback).trim() !== ""
        ? String(healthLabelFallback).trim()
        : DASH;

  const healthState = resolveSaleRayxHealthState(fin, pm, marginValue);

  const cardShellClass = getSaleRayxHealthShellClasses(healthState, { pulse: false });



  const mr =
    fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : {};

  const salePrice = mr.gross_sale_amount_brl ?? fin.sale_price ?? fin.gross_amount;

  const appliedSalePromotion = pickAppliedSalePromotion(fin);

  if (import.meta.env.DEV) {
    console.debug("[S7 Raio-X][detail usado no modal]", detail);
    console.debug("[S7 Raio-X][marketplace revenue usado]", mr);
    console.debug("[S7 Raio-X][applied promotion picked]", appliedSalePromotion);
  }

  const salePricePromoTooltip =
    appliedSalePromotion != null ? (
      <S7Tooltip
        placement="bottom-start"
        offset={6}
        richContent={
          <SaleAppliedPromotionTooltipBody
            originalProductPriceBrl={
              appliedSalePromotion.original_product_price_brl != null
                ? String(appliedSalePromotion.original_product_price_brl)
                : null
            }
            salePriceBrl={salePrice != null ? String(salePrice) : null}
            promotionName={String(appliedSalePromotion.promotion_name).trim()}
            promotionDiscountPercent={
              appliedSalePromotion.promotion_discount_percent != null &&
              String(appliedSalePromotion.promotion_discount_percent).trim() !== ""
                ? String(appliedSalePromotion.promotion_discount_percent)
                : null
            }
          />
        }
      >
        <button
          type="button"
          className="anuncios-sell-popover__promo-price-tip-btn vendas-sale-rayx__sale-promo-tip-btn"
          aria-label="Detalhes do desconto aplicado nesta venda"
        >
          <S7Icon name="info" size={13} strokeWidth={2} />
        </button>
      </S7Tooltip>
    ) : null;

  const marketplaceFee =
    (mr.marketplace_fee && typeof mr.marketplace_fee === "object"
      ? mr.marketplace_fee
      : fin.marketplace_fee && typeof fin.marketplace_fee === "object"
        ? fin.marketplace_fee
        : null) ?? null;

  const commissionRaw =
    (marketplaceFee?.amount_brl != null ? String(marketplaceFee.amount_brl) : null) ??
    mr.marketplace_fee_amount_brl ??
    fin.commission ??
    fin.marketplace_fee_amount;

  const shippingRaw = mr.shipping_amount_brl ?? fin.shipping_cost ?? fin.shipping_cost_amount;
  const shippingBonusRaw = mr.shipping_bonus_brl ?? fin.shipping_bonus_brl;

  const parsePositiveMoney = (raw) => {
    if (raw == null || String(raw).trim() === "") return 0;
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const showShippingLine = parsePositiveMoney(shippingRaw) > 0;
  const showShippingBonusLine = parsePositiveMoney(shippingBonusRaw) > 0;

  const rebateObj =
    mr.marketplace_rebate && typeof mr.marketplace_rebate === "object"
      ? /** @type {Record<string, unknown>} */ (mr.marketplace_rebate)
      : fin.marketplace_rebate && typeof fin.marketplace_rebate === "object"
        ? /** @type {Record<string, unknown>} */ (fin.marketplace_rebate)
        : financial?.marketplace_rebate && typeof financial.marketplace_rebate === "object"
          ? /** @type {Record<string, unknown>} */ (financial.marketplace_rebate)
          : null;

  const rebateIsExplicit = rebateObj?.confidence === "explicit";

  const positiveAdjustments =
    rebateIsExplicit && rebateObj?.amount_brl != null ? String(rebateObj.amount_brl) : null;

  const positiveAdjustmentsNum = (() => {
    if (positiveAdjustments == null || String(positiveAdjustments).trim() === "") return 0;
    const n = Number(String(positiveAdjustments).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  })();

  const showDiscountsAndBonuses = rebateIsExplicit && positiveAdjustmentsNum > 0;

  const netReceived = mr.net_received_amount_brl ?? fin.net_received ?? fin.net_received_amount;

  const feePercent =
    (marketplaceFee?.percentage != null ? String(marketplaceFee.percentage) : null) ??
    mr.marketplace_fee_percent ??
    fin.marketplace_fee_percent;

  const feeTierLabel =
    (marketplaceFee?.listing_type_label != null ? String(marketplaceFee.listing_type_label) : null) ??
    mr.listing_type_label ??
    fin.listing_type_label ??
    fin.marketplace_fee_tier_label;

  const feePercentDetail = buildMarketplaceFeePercentDetail(
    {
      ...fin,
      listing_type_label: feeTierLabel,
      marketplace_fee_tier_label: feeTierLabel,
    },
    feePercent,
  );

  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;

  const productCost =
    internalCosts?.product_cost_brl ?? fin.product_cost_only_brl ?? fin.product_cost_amount;

  const internalTaxes = internalCosts?.internal_tax_brl ?? fin.internal_taxes ?? fin.internal_tax_amount;

  const operationPackaging =
    internalCosts?.operation_packaging_cost_brl ?? fin.operation_packaging_cost;

  const internalTaxPercent =
    internalCosts?.tax_percent_applied != null ? String(internalCosts.tax_percent_applied) : null;
  const internalTaxPercentLabel = formatPercentDetailLabel(internalTaxPercent);
  const internalTaxPercentDetail = internalTaxPercentLabel
    ? `Alíquota ${internalTaxPercentLabel}`
    : null;

  const contingencyMarginLines = collectSaleRayxContingencyMargin(fin);



  return (
    <article
      className={`s7-ml-scenario-compare__card s7-ml-scenario-compare__card--baseline vendas-sale-rayx__financial-card vendas-sale-rayx__financial-card--no-head ${cardShellClass}`}
      data-sale-rayx-card="financial"
    >
      <div className="s7-ml-scenario-compare__card-body vendas-sale-rayx__financial-card-body">
        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section vendas-sale-rayx__financial-section--marketplace-revenue">

          <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>

          <div className="anuncios-sell-popover__block vendas-sale-rayx__fin-block--sale-value">

            <SaleRayXFinancialLine

              label="Valor da venda"

              labelAddon={salePricePromoTooltip}

              value={formatBrlApi(salePrice != null ? String(salePrice) : null)}

              lineClass="anuncios-sell-popover__line--key"

              valueTone="key"

            />

          </div>

          <div className="anuncios-sell-popover__block vendas-sale-rayx__fin-lines-group">

            <SaleRayXFinancialLine

              label="Tarifa / comissão"

              value={formatNegativeBrlApi(commissionRaw != null ? String(commissionRaw) : null) ?? DASH}

              percentDetail={feePercentDetail}

              valueTone="negative"

            />

            {showShippingLine ? (
              <SaleRayXFinancialLine
                label="Envios"
                value={formatNegativeBrlApi(shippingRaw != null ? String(shippingRaw) : null) ?? DASH}
                valueTone="negative"
              />
            ) : null}

            {showShippingBonusLine ? (
              <SaleRayXFinancialLine
                label="Bônus por envio"
                value={formatBrlApi(shippingBonusRaw != null ? String(shippingBonusRaw) : null)}
                valueTone="positive"
              />
            ) : null}

            {showDiscountsAndBonuses ? (
              <SaleRayXFinancialLine
                label="Descontos e bônus"
                value={formatPositiveBrlApi(String(positiveAdjustments)) ?? DASH}
                valueTone="positive"
              />
            ) : null}

            <SaleRayXFinancialLine

              label="Valor recebido"

              value={formatBrlApi(netReceived != null ? String(netReceived) : null)}

              lineClass="anuncios-sell-popover__line--total anuncios-sell-popover__line--key"

              valueTone="key"

            />

          </div>

        </div>

        {contingencyMarginLines.length > 0 ? (

          <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section vendas-sale-rayx__financial-section--contingency-margin">

            <h4 className="anuncios-sell-popover__section-title">Margem de contingência</h4>

            <div className="anuncios-sell-popover__block vendas-sale-rayx__fin-lines-group">

              {contingencyMarginLines.map((row) => (

                <SaleRayXFinancialLine

                  key={row.label}

                  label={row.label}

                  value={row.value}

                  percentDetail={row.percentDetail}

                  valueTone="negative"

                />

              ))}

            </div>

          </div>

        ) : null}



        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section vendas-sale-rayx__financial-section--internal-costs">

          <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>

          <div className="anuncios-sell-popover__block vendas-sale-rayx__fin-lines-group">

            <SaleRayXFinancialLine
              label="Custo do produto"
              value={
                productCost != null
                  ? formatNegativeBrlApi(String(productCost)) ?? DASH
                  : DASH
              }
              valueTone="negative"
            />

            <SaleRayXFinancialLine
              label="Impostos internos"
              value={
                internalTaxes != null
                  ? formatNegativeBrlApi(String(internalTaxes)) ?? DASH
                  : DASH
              }
              percentDetail={internalTaxPercentDetail}
              valueTone="negative"
            />

            <SaleRayXFinancialLine
              label="Operação + embalagem"
              value={
                operationPackaging != null
                  ? formatNegativeBrlApi(String(operationPackaging)) ?? DASH
                  : DASH
              }
              valueTone="negative"
            />

          </div>

        </div>



        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block anuncios-sell-popover__section--raiox-resultado vendas-sale-rayx__financial-section">

          <h4 className="anuncios-sell-popover__section-title">Resultado</h4>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine

              label="Lucro (R$)"

              value={formatBrlApi(profitValue != null ? String(profitValue) : null)}

              lineClass="anuncios-sell-popover__line--raiox-result-metric"

              labelClass={offerSemClass || undefined}

              strongClass={offerSemClass}

            />

          </div>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine

              label="Margem (%)"

              value={formatPercentApi(marginValue != null ? String(marginValue) : null)}

              lineClass="anuncios-sell-popover__line--raiox-result-metric"

              labelClass={offerSemClass || undefined}

              strongClass={offerSemClass}

            />

          </div>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine

              label="Saúde da venda"

              value={resultHealthLabel}

              lineClass="anuncios-sell-popover__line--status-offer anuncios-sell-popover__line--raiox-result-metric"

              labelClass={offerSemClass || undefined}

              strongClass={offerSemClass}

            />

          </div>

        </div>
      </div>
    </article>
  );

}

