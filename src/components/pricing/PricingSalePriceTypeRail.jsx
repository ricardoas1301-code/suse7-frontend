// ======================================================
// Mini cards Clássico / Premium — bloco "Preço de venda" na página (mesmo padrão visual dos cards de promoção).
// Seleção só afeta o simulador baseline; não altera dados nem promoções.
// ======================================================

/** @typedef {"classic" | "premium"} SalePriceListingType */

const OPTIONS = /** @type {const} */ ([
  { id: /** @type {SalePriceListingType} */ ("classic"), badge: "Clássico" },
  { id: /** @type {SalePriceListingType} */ ("premium"), badge: "Premium" },
]);

const TITLE = "Preço de venda";

/**
 * @param {{
 *   selected: SalePriceListingType;
 *   onSelect: (id: SalePriceListingType) => void;
 * }} props
 */
export function PricingSalePriceTypeRail({ selected, onSelect }) {
  return (
    <div
      className="pricing-scenario-rail pricing-scenario-sidebar"
      data-pricing-sale-price-type-rail="true"
      role="radiogroup"
      aria-label="Tipo de anúncio do preço de venda"
    >
      <div className="pricing-scenario-rail__viewport pricing-scenario-sidebar__viewport">
        <div className="pricing-scenario-rail__track pricing-scenario-sidebar__list">
          {OPTIONS.map(({ id, badge }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                name="sale-price-listing-type"
                className={[
                  "pricing-scenario-rail__item",
                  "pricing-scenario-sidebar-card",
                  "pricing-scenario-sidebar-card--status-available",
                  isSelected ? "pricing-scenario-sidebar-card--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-checked={isSelected}
                role="radio"
                aria-label={`${TITLE} ${badge}. Lucro e margem por tipo ainda não disponíveis na API.`}
                onClick={() => onSelect(id)}
              >
                <span className="pricing-scenario-sidebar-card__inner pricing-scenario-sidebar-card__inner--stack-v2">
                  <span className="pricing-scenario-sidebar-card__title-row">
                    <span className="pricing-scenario-sidebar-card__title-text" title={TITLE}>
                      {TITLE}
                    </span>
                  </span>
                  {/*
                   * VISUAL_PLACEHOLDER: layout alinhado às promoções até o backend expor lucro/margem por tipo.
                   * Não representa cálculo nem dado financeiro real.
                   */}
                  <span className="pricing-scenario-sidebar-card__metrics-line pricing-scenario-sidebar-card__metrics-line--listing-type-visual-placeholder">
                    <span className="pricing-scenario-sidebar-card__profit">R$ --</span>
                    <span className="pricing-scenario-sidebar-card__metrics-sep">·</span>
                    <span className="pricing-scenario-sidebar-card__margin">--%</span>
                  </span>
                  <span className="pricing-scenario-sidebar-card__badges-row">
                    <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
                      {badge}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
