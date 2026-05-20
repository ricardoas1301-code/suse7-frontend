// ======================================================
// Bloco DESEMPENHO ACUMULADO — card esquerdo do Raio-x da venda.
// ======================================================

import { DASH, formatBrlApi } from "./saleRayxFormat";

/**
 * @param {unknown} raw
 */
function formatQtyApi(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return Math.trunc(n).toLocaleString("pt-BR");
}

/**
 * @param {{ label: string; value: string }} props
 */
function PerformanceMetricLine({ label, value }) {
  const empty = value === DASH;
  return (
    <div className="vendas-sale-rayx__accumulated-line">
      <span className="vendas-sale-rayx__accumulated-metric-kind">{label}</span>
      <span
        className={[
          "vendas-sale-rayx__accumulated-value",
          empty ? "anuncios-sell-popover__value--empty" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   qty: string;
 *   amount: string;
 * }} props
 */
function PerformanceScopeSection({ title, qty, amount }) {
  return (
    <div className="vendas-sale-rayx__accumulated-scope-block">
      <span className="vendas-sale-rayx__accumulated-scope">{title}</span>
      <div className="vendas-sale-rayx__accumulated-metrics-row">
        <PerformanceMetricLine label="Quantidade vendida" value={qty} />
        <PerformanceMetricLine label="Valor vendido" value={amount} />
      </div>
    </div>
  );
}

/**
 * @param {{ metrics?: Record<string, unknown> | null }} props
 */
export default function SaleRayXAccumulatedPerformance({ metrics }) {
  const m = metrics && typeof metrics === "object" ? metrics : {};

  const listingQty = formatQtyApi(m.listing_sales_quantity);
  const listingAmount = formatBrlApi(
    m.listing_sales_amount_brl != null ? String(m.listing_sales_amount_brl) : null,
  );
  const productQty = formatQtyApi(m.product_sales_quantity);
  const productAmount = formatBrlApi(
    m.product_sales_amount_brl != null ? String(m.product_sales_amount_brl) : null,
  );

  return (
    <section className="vendas-sale-rayx__accumulated-performance" aria-label="Desempenho acumulado">
      <h4 className="vendas-sale-rayx__accumulated-performance-title">Desempenho acumulado</h4>
      <div className="vendas-sale-rayx__accumulated-performance-stack">
        <PerformanceScopeSection title="Anúncio" qty={listingQty} amount={listingAmount} />
        <hr className="vendas-sale-rayx__accumulated-scope-divider" aria-hidden />
        <PerformanceScopeSection title="Produto" qty={productQty} amount={productAmount} />
      </div>
    </section>
  );
}
