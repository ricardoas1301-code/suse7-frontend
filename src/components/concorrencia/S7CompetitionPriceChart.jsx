// ======================================================
// S7CompetitionPriceChart — barras simples (preço) — MVP
// ======================================================

/**
 * @param {{
 *   bars: { key: string; label: string; price: number | null; tone?: "self" | "competitor" }[];
 * }} props
 */
export default function S7CompetitionPriceChart({ bars }) {
  const values = bars.map((b) => (b.price != null && Number.isFinite(b.price) ? b.price : null));
  const max = Math.max(1, ...values.filter((v) => v != null));

  return (
    <div className="s7-competition-chart" aria-label="Comparativo de preços">
      <div className="s7-competition-chart__plot">
        {bars.map((b) => {
          const v = b.price != null && Number.isFinite(b.price) ? b.price : null;
          const pct = v == null ? 6 : Math.max(10, Math.round((v / max) * 100));
          const bg = b.tone === "self" ? "var(--s7-comp-chart-self, #2563eb)" : "var(--s7-comp-chart-peer, #64748b)";
          return (
            <div key={b.key} className="s7-competition-chart__col">
              <div className="s7-competition-chart__track">
                <div className="s7-competition-chart__bar" style={{ height: `${pct}%`, background: bg }} />
              </div>
              <div className="s7-competition-chart__label" title={b.label}>
                {b.label.length > 12 ? `${b.label.slice(0, 12)}…` : b.label}
              </div>
              <div className="s7-competition-chart__value">
                {v == null
                  ? "—"
                  : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
