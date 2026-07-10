import "../../../components/dashboard/S7DailySummaryCard.css";
import "../../../components/products/ProductFinancialRayXPanel.css";
import "./ListingRayxCostsStockPanel.css";

/**
 * @param {{
 *   costsFields: Array<{ id: string; label: string; value: string }>;
 *   readonlyStockFields: Array<{ id: string; label: string; value: string }>;
 *   marketplaceStock?: {
 *     label: string;
 *     readonlyValue: string;
 *     virtualStock: {
 *       enabled: boolean;
 *       value: string;
 *       tooltipText?: string;
 *       inheritedLabel?: string;
 *       helperText?: string;
 *       error?: string;
 *       onEnabledChange: (checked: boolean) => void;
 *       onValueChange: (value: string) => void;
 *     };
 *   };
 * }} props
 */
export default function ListingRayxCostsStockPanel({ costsFields, readonlyStockFields, marketplaceStock }) {
  const virtualStock = marketplaceStock?.virtualStock;

  return (
    <div className="pf-container pf-container--pricing-stock listing-rayx-costs-stock">
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
            <dl className="listing-rayx-readonly-fields">
              {costsFields.map((campo) => (
                <div key={campo.id} className="listing-rayx-readonly-fields__row">
                  <dt className="listing-rayx-readonly-fields__label">{campo.label}</dt>
                  <dd className="listing-rayx-readonly-fields__value">{campo.value}</dd>
                </div>
              ))}
            </dl>
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
            <dl className="listing-rayx-readonly-fields">
              {readonlyStockFields.map((campo) => (
                <div key={campo.id} className="listing-rayx-readonly-fields__row">
                  <dt className="listing-rayx-readonly-fields__label">{campo.label}</dt>
                  <dd className="listing-rayx-readonly-fields__value">{campo.value}</dd>
                </div>
              ))}

              {marketplaceStock && virtualStock ? (
                <div className="listing-rayx-readonly-fields__row listing-rayx-ml-stock-row">
                  <dt className="listing-rayx-ml-stock-row__label-row">
                    <span className="listing-rayx-readonly-fields__label listing-rayx-ml-stock-row__main-label">
                      {marketplaceStock.label}
                    </span>
                    <label className="listing-rayx-ml-stock-row__toggle">
                      <input
                        type="checkbox"
                        checked={virtualStock.enabled}
                        onChange={(event) => virtualStock.onEnabledChange(event.target.checked)}
                        aria-label="Ativar estoque virtual neste anúncio"
                      />
                      <span className="listing-rayx-ml-stock-row__toggle-label">Estoque virtual</span>
                    </label>
                    {virtualStock.tooltipText ? (
                      <button
                        type="button"
                        className="pf-info-btn s7-tip s7-tip-bottom s7-tip-wrap listing-rayx-ml-stock-row__info"
                        data-tip={virtualStock.tooltipText}
                        aria-label="Informações sobre estoque virtual"
                      >
                        i
                      </button>
                    ) : null}
                  </dt>
                  <dd className="listing-rayx-ml-stock-row__value">
                    {virtualStock.enabled ? (
                      <input
                        className="listing-rayx-ml-stock-row__input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={virtualStock.value}
                        onChange={(event) => virtualStock.onValueChange(event.target.value)}
                        placeholder="Ex: 200"
                        aria-label="Estoque no Mercado Livre com estoque virtual ativo"
                      />
                    ) : (
                      <span className="listing-rayx-readonly-fields__value">{marketplaceStock.readonlyValue}</span>
                    )}
                    {!virtualStock.enabled && virtualStock.inheritedLabel ? (
                      <p className="listing-rayx-ml-stock-row__helper">{virtualStock.inheritedLabel}</p>
                    ) : null}
                    {virtualStock.enabled && virtualStock.helperText ? (
                      <p className="listing-rayx-ml-stock-row__helper">{virtualStock.helperText}</p>
                    ) : null}
                    {virtualStock.error ? <p className="listing-rayx-ml-stock-row__error">{virtualStock.error}</p> : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
