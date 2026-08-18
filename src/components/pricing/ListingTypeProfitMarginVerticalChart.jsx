// ======================================================
// S4.3.7.2 — Gráfico vertical Clássico × Premium da aba Precificação.
// Apresenta snapshots já resolvidos pelos cards; sem recalcular finanças.
// ======================================================

import {
  getOfferStatusFromMargin,
  offerSemanticSuffixToCssClass,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import {
  calcularLarguraLucroListingTypePct,
  calcularMaxAbsLucroListingType,
  parseLucroOuMargemDecimal,
  resolverLadoLucroListingType,
} from "./listingTypeProfitMarginDivergingChartUi.js";
import pricingIntelligenceAvatar from "../../assets/pricing-intelligence-avatar.png";

const LISTING_TYPES = [
  { id: "classic", label: "Clássico" },
  { id: "premium", label: "Premium" },
];

/** @param {import("decimal.js").default | null} value */
function formatarBrl(value) {
  if (value == null) return "—";
  return value.abs().toDecimalPlaces(2).toNumber().toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** @param {import("decimal.js").default | null} value */
function formatarMargem(value) {
  if (value == null) return "—";
  return `${value.abs().toDecimalPlaces(2).toNumber().toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * @param {unknown} scenario
 * @param {"classic" | "premium"} id
 */
function montarBarra(scenario, id) {
  const record = scenario != null && typeof scenario === "object" ? /** @type {Record<string, unknown>} */ (scenario) : null;
  const result =
    record?.result != null && typeof record.result === "object"
      ? /** @type {Record<string, unknown>} */ (record.result)
      : null;
  const profit = parseLucroOuMargemDecimal(result?.profit_brl);
  const margin = parseLucroOuMargemDecimal(result?.margin_pct);
  const resolved = profit != null && margin != null;
  const pending = record == null;
  const side = resolved ? resolverLadoLucroListingType(profit) : "pending";
  const status = resolved ? getOfferStatusFromMargin(margin.toString()) : null;

  return {
    id,
    label: id === "classic" ? "Clássico" : "Premium",
    profit,
    margin,
    resolved,
    pending,
    unavailable: !pending && !resolved,
    side,
    toneClass: status != null ? offerSemanticSuffixToCssClass(status.color) : "",
    statusLabel: status?.label ?? "Indisponível",
  };
}

/**
 * @param {{
 *   bar: ReturnType<typeof montarBarra>;
 *   maxAbsProfit: import("decimal.js").default;
 * }} props
 */
function ListingTypeVerticalBar({ bar, maxAbsProfit }) {
  const heightPct = calcularLarguraLucroListingTypePct(bar.profit, maxAbsProfit);
  const profitPrefix = bar.side === "negative" ? "−" : "";
  const marginPrefix = bar.margin != null && bar.margin.isNeg() ? "−" : "";
  const ariaLabel = bar.pending
    ? `Anúncio ${bar.label}. Resultado financeiro pendente.`
    : bar.unavailable
      ? `Anúncio ${bar.label}. Resultado financeiro indisponível.`
      : bar.side === "negative"
        ? `Anúncio ${bar.label}. Prejuízo de ${formatarBrl(bar.profit)}. Margem negativa de ${formatarMargem(bar.margin)}. Resultado ${bar.statusLabel}.`
        : `Anúncio ${bar.label}. Lucro de ${formatarBrl(bar.profit)}. Margem de ${formatarMargem(bar.margin)}. Resultado ${bar.statusLabel}.`;

  return (
    <div
      className={[
        "s7-pricing-vertical-chart__column",
        `s7-pricing-vertical-chart__column--${bar.id}`,
        `s7-pricing-vertical-chart__column--${bar.side}`,
        bar.toneClass,
      ]
        .filter(Boolean)
        .join(" ")}
      role="listitem"
      aria-label={ariaLabel}
    >
      <div className="s7-pricing-vertical-chart__metrics s7-pricing-vertical-chart__metrics--positive">
        <FinancialMetrics bar={bar} profitPrefix={profitPrefix} marginPrefix={marginPrefix} />
      </div>
      <div className="s7-pricing-vertical-chart__positive-half">
        {bar.side === "positive" ? (
          <div
            className="s7-pricing-vertical-chart__bar s7-pricing-vertical-chart__bar--positive"
            style={{ height: `${heightPct}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="s7-pricing-vertical-chart__zero-row">
        {bar.side === "zero" ? <span className="s7-pricing-vertical-chart__zero-dot" aria-hidden /> : null}
        <span className="s7-pricing-vertical-chart__badge">{bar.label}</span>
      </div>
      <div className="s7-pricing-vertical-chart__negative-half">
        {bar.side === "negative" ? (
          <div
            className="s7-pricing-vertical-chart__bar s7-pricing-vertical-chart__bar--negative"
            style={{ height: `${heightPct}%` }}
            aria-hidden
          />
        ) : bar.pending || bar.unavailable ? (
          <div className="s7-pricing-vertical-chart__state" role="status">
            {bar.pending ? "Calculando…" : "Dados indisponíveis"}
          </div>
        ) : null}
      </div>
      {bar.side === "negative" ? (
        <div className="s7-pricing-vertical-chart__metrics s7-pricing-vertical-chart__metrics--negative">
          <FinancialMetrics bar={bar} profitPrefix={profitPrefix} marginPrefix={marginPrefix} />
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ bar: ReturnType<typeof montarBarra>; profitPrefix: string; marginPrefix: string }} props */
function FinancialMetrics({ bar, profitPrefix, marginPrefix }) {
  const isNegative = bar.side === "negative";
  return (
    <>
      <strong className={bar.toneClass}>
        {bar.resolved ? `${profitPrefix}${formatarBrl(bar.profit)}` : "—"}
      </strong>
      <span className="s7-pricing-vertical-chart__metric-label">{isNegative ? "Prejuízo" : "Lucro"}</span>
      <strong className={bar.toneClass}>
        {bar.resolved ? `${marginPrefix}${formatarMargem(bar.margin)}` : "—"}
      </strong>
      <span className="s7-pricing-vertical-chart__metric-label">Margem</span>
    </>
  );
}

function AvatarPlaceholder() {
  return (
    <aside className="s7-pricing-vertical-chart__avatar" aria-label="Avatar da Precificação">
      <img src={pricingIntelligenceAvatar} alt="" />
    </aside>
  );
}

/**
 * @param {{ classicScenario?: unknown; premiumScenario?: unknown }} props
 */
export function ListingTypeProfitMarginVerticalChart({
  classicScenario = null,
  premiumScenario = null,
}) {
  const scenarios = { classic: classicScenario, premium: premiumScenario };
  const bars = LISTING_TYPES.map(({ id }) => montarBarra(scenarios[id], id));
  const maxAbsProfit = calcularMaxAbsLucroListingType(bars.map((bar) => bar.profit));

  return (
    <section className="s7-pricing-vertical-chart" aria-labelledby="s7-pricing-vertical-chart-title">
      <h3 id="s7-pricing-vertical-chart-title">Lucro e margem por tipo de anúncio</h3>
      <div className="s7-pricing-vertical-chart__body">
        <section className="s7-pricing-vertical-chart__graph-card" aria-label="Gráfico de lucro e margem">
          <div className="s7-pricing-vertical-chart__plot" role="list">
            <div className="s7-pricing-vertical-chart__zero-line" aria-hidden />
            {bars.map((bar) => (
              <ListingTypeVerticalBar key={bar.id} bar={bar} maxAbsProfit={maxAbsProfit} />
            ))}
            <span className="s7-pricing-vertical-chart__zero-label" aria-hidden>
              0
            </span>
          </div>
        </section>
        <AvatarPlaceholder />
      </div>
    </section>
  );
}
