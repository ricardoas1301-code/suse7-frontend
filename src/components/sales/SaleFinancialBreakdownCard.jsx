// ======================================================

// Card direito — breakdown financeiro da venda (somente leitura).

// ======================================================



import { getSaleRayxHealthState, getSaleRayxHealthShellClasses } from "./saleRayxHealthState";

import { getSaleRayxMarginSemantic } from "./saleRayxMarginSemantic";

import { collectSaleRayxCommercialAdjustments } from "./saleRayxPricingVariables";

import SaleRayXFinancialLine from "./SaleRayXFinancialLine";

import {

  DASH,

  formatBrlApi,

  formatNegativeBrlApi,

  formatPositiveBrlApi,

  formatPercentApi,

  formatPercentDetailLabel,

} from "./saleRayxFormat";



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

export default function SaleFinancialBreakdownCard({ financial, profitMargin }) {

  const fin = financial && typeof financial === "object" ? financial : {};

  const pm = profitMargin && typeof profitMargin === "object" ? profitMargin : {};

  const profitValue = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;

  const marginValue = pm.margin_percent ?? fin.margin_percent;

  const { offerSemClass, healthLabel } = getSaleRayxMarginSemantic(marginValue);

  const resultHealthLabel = healthLabel != null && String(healthLabel).trim() !== "" ? String(healthLabel).trim() : DASH;

  const healthState = getSaleRayxHealthState(marginValue);

  const cardShellClass = getSaleRayxHealthShellClasses(healthState, { pulse: false });



  const mr =
    fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : {};

  const salePrice = mr.gross_sale_amount_brl ?? fin.sale_price ?? fin.gross_amount;

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

  const productCost = fin.product_cost_only_brl ?? fin.product_cost_amount;

  const internalTaxes = fin.internal_taxes ?? fin.internal_tax_amount;

  const operationPackaging = fin.operation_packaging_cost;

  const commercialAdjustments = collectSaleRayxCommercialAdjustments(fin);



  return (

    <article

      className={`s7-ml-scenario-compare__card s7-ml-scenario-compare__card--baseline vendas-sale-rayx__financial-card vendas-sale-rayx__financial-card--no-head ${cardShellClass}`}

      data-sale-rayx-card="financial"

    >

      <div className="s7-ml-scenario-compare__card-body vendas-sale-rayx__financial-card-body">

        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section">

          <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine

              label="Valor da venda"

              value={formatBrlApi(salePrice != null ? String(salePrice) : null)}

              lineClass="anuncios-sell-popover__line--key"

            />

          </div>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine

              label="Tarifa / comissão"

              value={formatNegativeBrlApi(commissionRaw != null ? String(commissionRaw) : null) ?? DASH}

              percentDetail={feePercentDetail}

            />

            <SaleRayXFinancialLine

              label="Envios"

              value={formatNegativeBrlApi(shippingRaw != null ? String(shippingRaw) : null) ?? DASH}

            />

            {showDiscountsAndBonuses ? (
              <SaleRayXFinancialLine
                label="Descontos e bônus"
                value={formatPositiveBrlApi(String(positiveAdjustments)) ?? DASH}
              />
            ) : null}

            <SaleRayXFinancialLine

              label="Valor recebido"

              value={formatBrlApi(netReceived != null ? String(netReceived) : null)}

              lineClass="anuncios-sell-popover__line--total anuncios-sell-popover__line--key"

            />

          </div>

        </div>



        {commercialAdjustments.length > 0 ? (

          <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section">

            <h4 className="anuncios-sell-popover__section-title">Ajustes comerciais</h4>

            <div className="anuncios-sell-popover__block">

              {commercialAdjustments.map((row) => (

                <SaleRayXFinancialLine

                  key={row.label}

                  label={row.label}

                  value={row.value}

                  percentDetail={row.percentDetail}

                />

              ))}

            </div>

          </div>

        ) : null}



        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block vendas-sale-rayx__financial-section">

          <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine label="Custo do produto" value={formatBrlApi(productCost != null ? String(productCost) : null)} />

          </div>

          <div className="anuncios-sell-popover__block">

            <SaleRayXFinancialLine label="Impostos internos" value={formatBrlApi(internalTaxes != null ? String(internalTaxes) : null)} />

            <SaleRayXFinancialLine

              label="Operação + embalagem"

              value={formatBrlApi(operationPackaging != null ? String(operationPackaging) : null)}

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

