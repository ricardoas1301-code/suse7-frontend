// Tooltip — promoção aplicada nesta venda (dados do GET /api/sales/detail).

import { DASH, formatBrlApi, formatNegativeBrlApi, formatPercentDetailLabel } from "./saleRayxFormat";

/** @param {string | null | undefined} s */
function parseMoneyBrl(s) {
  if (s == null || String(s).trim() === "") return null;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Exibição: original_product_price_brl − valor de venda (2 casas).
 * @param {string | null | undefined} originalBrl
 * @param {string | null | undefined} saleBrl
 */
function computePromotionDiscountBrl(originalBrl, saleBrl) {
  const original = parseMoneyBrl(originalBrl);
  const sale = parseMoneyBrl(saleBrl);
  if (original == null || sale == null) return null;
  const diff = Math.round((original - sale) * 100) / 100;
  if (diff <= 0) return null;
  return diff.toFixed(2);
}

/**
 * @param {{
 *   originalProductPriceBrl: string | null;
 *   salePriceBrl: string | null;
 *   promotionName: string;
 *   promotionDiscountPercent: string | null;
 * }} props
 */
export default function SaleAppliedPromotionTooltipBody({
  originalProductPriceBrl,
  salePriceBrl,
  promotionName,
  promotionDiscountPercent,
}) {
  const originalDisplay = formatBrlApi(originalProductPriceBrl);
  const saleDisplay = formatBrlApi(salePriceBrl);
  const showOriginal = originalDisplay !== DASH;
  const showSale = saleDisplay !== DASH;

  const discountBrl = computePromotionDiscountBrl(originalProductPriceBrl, salePriceBrl);
  const discountDisplay =
    discountBrl != null ? formatNegativeBrlApi(discountBrl) : null;

  const pctLabel = formatPercentDetailLabel(promotionDiscountPercent);
  const discountDetail = pctLabel != null ? `${promotionName} ${pctLabel}` : promotionName;

  return (
    <div className="anuncios-raiox-promo-price-tip vendas-sale-rayx__sale-promo-tip">
      {showOriginal ? (
        <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
          <span className="anuncios-raiox-promo-price-tip__label">Valor do produto</span>
          <span className="anuncios-raiox-promo-price-tip__value">{originalDisplay}</span>
        </div>
      ) : null}

      {discountDisplay != null ? (
        <div className="vendas-sale-rayx__sale-promo-tip__discount-group">
          <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
            <span className="anuncios-raiox-promo-price-tip__label">Valor do desconto</span>
            <span className="anuncios-raiox-promo-price-tip__value vendas-sale-rayx__sale-promo-tip__discount-value">
              {discountDisplay}
            </span>
          </div>
          <span className="vendas-sale-rayx__sale-promo-tip__discount-detail">{discountDetail}</span>
        </div>
      ) : null}

      {showSale ? (
        <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
          <span className="anuncios-raiox-promo-price-tip__label">Valor de venda</span>
          <span className="anuncios-raiox-promo-price-tip__value vendas-sale-rayx__sale-promo-tip__sale-value">
            {saleDisplay}
          </span>
        </div>
      ) : null}
    </div>
  );
}
