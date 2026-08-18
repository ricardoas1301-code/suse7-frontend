// ======================================================
// Bloco DESEMPENHO ACUMULADO — card esquerdo do Raio-x da venda.
// ======================================================

import AccumulatedPerformanceBlock from "../shared/AccumulatedPerformanceBlock.jsx";

/**
 * @param {{ metrics?: Record<string, unknown> | null }} props
 */
export default function SaleRayXAccumulatedPerformance({ metrics }) {
  const m = metrics && typeof metrics === "object" ? metrics : {};
  const accumulated =
    m.accumulated_performance != null && typeof m.accumulated_performance === "object"
      ? /** @type {Record<string, unknown>} */ (m.accumulated_performance)
      : null;

  const listingScope =
    accumulated?.listing != null && typeof accumulated.listing === "object"
      ? /** @type {Record<string, unknown>} */ (accumulated.listing)
      : {
          sales_quantity: m.listing_sales_quantity ?? null,
          sales_amount_brl: m.listing_sales_amount_brl ?? null,
          sales_profit_brl: m.listing_sales_profit_brl ?? null,
          sales_profit_percent: m.listing_sales_profit_percent ?? null,
        };

  const productScope =
    accumulated?.product != null && typeof accumulated.product === "object"
      ? /** @type {Record<string, unknown>} */ (accumulated.product)
      : {
          sales_quantity: m.product_sales_quantity ?? null,
          sales_amount_brl: m.product_sales_amount_brl ?? null,
          sales_profit_brl: m.product_sales_profit_brl ?? null,
          sales_profit_percent: m.product_sales_profit_percent ?? null,
        };

  return (
    <AccumulatedPerformanceBlock
      listingScope={listingScope}
      productScope={productScope}
    />
  );
}
