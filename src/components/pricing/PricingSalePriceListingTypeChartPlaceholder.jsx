// ======================================================
// Comparativo Clássico × Premium — 3 KPIs, barras bidirecionais, altura do card.
// ======================================================

import {
  METRICAS_GRAFICO_LISTING_TYPE,
  escalaSimetricaListingType,
  geometriaBarraListingType,
  geometriaBarraListingTypeBaseInferior,
} from "./pricingListingTypeChartMetrics.js";

const COLUNAS = [
  { id: "classic", tick: "Clássico", fillClass: "s7-ml-scenario-chart__bar-fill-inner--listing-type-classic" },
  { id: "premium", tick: "Premium", fillClass: "s7-ml-scenario-chart__bar-fill-inner--listing-type-premium" },
];

/**
 * @param {{
 *   metrica: (typeof METRICAS_GRAFICO_LISTING_TYPE)[number];
 *   cenarios: { classic: unknown; premium: unknown };
 * }} props
 */
function CelulaMetricaGrafico({ metrica, cenarios }) {
  const valores = COLUNAS.map((col) => metrica.ler(cenarios[col.id]));
  const nums = valores.map((v) => v.valor);
  const escala = escalaSimetricaListingType(nums);
  const temPositivo = nums.some((n) => n != null && Number.isFinite(n) && n > 0);
  const temNegativo = nums.some((n) => n != null && Number.isFinite(n) && n < 0);
  const soPositivo = temPositivo && !temNegativo;
  const eixoMisto = temPositivo && temNegativo;
  const calcularGeometria = soPositivo ? geometriaBarraListingTypeBaseInferior : geometriaBarraListingType;
  const linhaZeroPct = soPositivo ? 0 : escala.zeroFromBottomPct;

  return (
    <div
      className={[
        "s7-ml-scenario-chart--listing-type-kpi__cell",
        soPositivo ? "s7-ml-scenario-chart--listing-type-kpi__cell--so-positivo" : "",
        eixoMisto || (temNegativo && !temPositivo)
          ? "s7-ml-scenario-chart--listing-type-kpi__cell--eixo-misto"
          : "",
        soPositivo ? "s7-ml-scenario-chart--listing-type-kpi__cell--base-inferior" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="s7-ml-scenario-chart--listing-type-kpi__plot">
        <div
          className="s7-ml-scenario-chart--listing-type-kpi__bars-plot-area"
          style={{ ["--s7-ml-bar-zero-pct"]: `${linhaZeroPct}%` }}
        >
          <div className="s7-ml-scenario-chart__bar-zero-line-global" aria-hidden />
          <div className="s7-ml-scenario-chart--listing-type-kpi__bars-columns">
            {COLUNAS.map((col, idx) => {
              const hit = valores[idx];
              const geom = calcularGeometria(hit.valor, escala);
              const negativoBaseInferior = soPositivo && geom.isNegative;
              return (
                <div
                  key={`${metrica.id}-${col.id}`}
                  className={[
                    "s7-ml-scenario-chart__column-hit",
                    "s7-ml-scenario-chart__column-hit--listing-type-kpi",
                    geom.isNegative ? "s7-ml-scenario-chart__column-hit--listing-type-kpi-neg" : "",
                    negativoBaseInferior ? "s7-ml-scenario-chart__column-hit--listing-type-kpi-neg-base" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="s7-ml-scenario-chart__bar-track s7-ml-scenario-chart__bar-track--listing-type-kpi">
                    <div
                      className="s7-ml-scenario-chart__bar-magnet s7-ml-scenario-chart__bar-magnet--listing-type-kpi"
                      style={{
                        bottom: `${geom.magnetBottomPct}%`,
                        height: `${geom.magnetHeightPct}%`,
                      }}
                    >
                      <div
                        className={[
                          "s7-ml-scenario-chart__bar-fill-inner",
                          "s7-ml-scenario-chart__bar-fill-inner--listing-type-kpi",
                          geom.isNegative
                            ? "s7-ml-scenario-chart__bar-fill-inner--listing-type-negativo"
                            : col.fillClass,
                          geom.growClass,
                        ].join(" ")}
                        aria-hidden
                      />
                      <span className="s7-ml-scenario-chart--listing-type-kpi__bar-out-value">
                        {hit.texto}
                      </span>
                      <span className="s7-ml-scenario-chart--listing-type-kpi__bar-in-tick">{col.tick}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="s7-ml-scenario-chart--listing-type-kpi__metric-title">{metrica.titulo}</p>
    </div>
  );
}

/**
 * @param {{
 *   classicScenario?: unknown;
 *   premiumScenario?: unknown;
 * }} props
 */
export function PricingSalePriceListingTypeChartPlaceholder({
  classicScenario = null,
  premiumScenario = null,
}) {
  const cenarios = {
    classic: classicScenario,
    premium: premiumScenario,
  };

  return (
    <div
      className="s7-ml-scenario-chart s7-ml-scenario-chart--listing-type-kpi"
      role="img"
      aria-label="Comparativo Clássico e Premium: lucro, margem percentual e valor que você recebe"
    >
      <div className="s7-ml-scenario-chart--listing-type-kpi__row-trio">
        {METRICAS_GRAFICO_LISTING_TYPE.map((metrica) => (
          <CelulaMetricaGrafico key={metrica.id} metrica={metrica} cenarios={cenarios} />
        ))}
      </div>
    </div>
  );
}
