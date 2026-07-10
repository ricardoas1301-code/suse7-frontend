// ======================================================================

// Raio-X do Produto — aba unificada Custos e estoque (somente layout).

// ======================================================================



import "../dashboard/S7DailySummaryCard.css";

import "./ProductFinancialRayXPanel.css";



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

        <section

          className="s7-daily-summary pf-product-rayx__daily-card pf-product-rayx__daily-card--form pf-product-rayx__daily-card--custos"

          aria-label="Custos"

        >

          <header className="s7-daily-summary__head s7-dashboard-block-head">

            <div className="s7-dashboard-block-head__title-row">

              <h2 className="s7-daily-summary__title">Custos</h2>

            </div>

          </header>

          <div className="s7-daily-summary__body">

            <div

              ref={onCostsMount}

              className="pf-pricing-stock-col__body pf-pricing-stock-col__body--costs"

            />

          </div>

        </section>



        <section

          className="s7-daily-summary pf-product-rayx__daily-card pf-product-rayx__daily-card--form"

          aria-label="Estoque"

        >

          <header className="s7-daily-summary__head s7-dashboard-block-head">

            <div className="s7-dashboard-block-head__title-row">

              <h2 className="s7-daily-summary__title">Estoque</h2>

            </div>

          </header>

          <div className="s7-daily-summary__body">

            <div

              ref={onStockMount}

              className="pf-pricing-stock-col__body pf-pricing-stock-col__body--stock"

            />

          </div>

        </section>

      </div>

    </div>

  );

}

