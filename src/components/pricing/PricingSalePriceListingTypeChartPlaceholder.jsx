// ======================================================
// Mini gráfico Premium vs Clássico — placeholder até a API expor séries separadas.
// Mesma pele visual do gráfico de promoções; sem valores inventados no frontend.
// ======================================================

/** Ordem: Clássico (esquerda) → Premium (direita), alinhado aos mini cards. */
const LABELS = [
  { id: "classic", tick: "Clássico" },
  { id: "premium", tick: "Premium" },
];

/**
 * @param {{ selectedListingType?: "classic" | "premium" }} props
 */
export function PricingSalePriceListingTypeChartPlaceholder({ selectedListingType = "classic" }) {
  return (
    <div
      className="s7-ml-scenario-chart s7-ml-scenario-chart--listing-type-stub"
      role="presentation"
      aria-label="Comparativo Premium e Clássico (dados por tipo quando disponíveis na API)"
    >
      <div className="s7-ml-scenario-chart__block">
        <div className="s7-ml-scenario-chart__bars-wrap">
          <div className="s7-ml-scenario-chart__chart-container">
            <div className="s7-ml-scenario-chart__bars-plot-area" style={{ "--s7-ml-bar-zero-pct": "0%" }}>
              <div className="s7-ml-scenario-chart__bar-zero-line-global" aria-hidden />
              <div className="s7-ml-scenario-chart__bars-columns s7-ml-scenario-chart__bars-columns--listing-type-stub">
                {LABELS.map(({ id, tick }) => {
                  const selected = selectedListingType === id;
                  return (
                    <div
                      key={id}
                      className={[
                        "s7-ml-scenario-chart__column-hit",
                        "s7-ml-scenario-chart__column-hit--listing-type-stub",
                        selected ? "s7-ml-scenario-chart__column-hit--listing-type-stub-selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="s7-ml-scenario-chart__bar-track">
                        <div className="s7-ml-scenario-chart__bar-value-float" style={{ bottom: "0%" }}>
                          <span className="s7-ml-scenario-chart__bar-value-float__text">—</span>
                        </div>
                      </div>
                      <span className="s7-ml-scenario-chart__tick">{tick}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="s7-ml-scenario-chart--listing-type-stub__hint">
        Lucro e margem por tipo de anúncio quando o backend expuser os dois cenários. Sem simulação local nesta fase.
      </p>
    </div>
  );
}
