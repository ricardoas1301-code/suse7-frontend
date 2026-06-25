// ======================================================================
// Raio-X do Produto — aba unificada Custos e estoque (somente layout).
// ======================================================================

/**
 * @param {{
 *   onCostsMount?: (node: HTMLDivElement | null) => void;
 *   onStockMount?: (node: HTMLDivElement | null) => void;
 * }} props
 */
export default function ProductFormRayxCostsStockLayout({ onCostsMount, onStockMount }) {
  return (
    <div className="pf-container pf-container--pricing-stock">
      <h2 className="pf-tab-title">Custos e estoque</h2>
      <div className="pf-pricing-stock-grid">
        <h3 className="pf-pricing-stock-col__subtitle pf-pricing-stock-col__subtitle--costs">Custos</h3>
        <h3 className="pf-pricing-stock-col__subtitle pf-pricing-stock-col__subtitle--stock">Estoque</h3>
        <div
          ref={onCostsMount}
          className="pf-pricing-stock-col__body pf-pricing-stock-col__body--costs"
        />
        <div
          ref={onStockMount}
          className="pf-pricing-stock-col__body pf-pricing-stock-col__body--stock"
        />
      </div>
    </div>
  );
}
