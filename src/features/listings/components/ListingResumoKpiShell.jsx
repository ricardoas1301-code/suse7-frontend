import "./ListingResumoKpiShell.css";

/**
 * Moldura KPI do Resumo: barra de título branca + borda superior colorida.
 * O conteúdo interno (medidor/valor) permanece inalterado.
 *
 * @param {{
 *   title: string;
 *   accent?: "quantity" | "revenue" | "profit" | "conversion" | "neutral" | "orange";
 *   titleCompact?: boolean;
 *   children: import("react").ReactNode;
 * }} props
 */
export default function ListingResumoKpiShell({ title, accent = "revenue", titleCompact = false, children }) {
  const accentClass = ["quantity", "revenue", "profit", "conversion", "neutral", "orange"].includes(accent)
    ? accent
    : "revenue";

  return (
    <article className={`listing-resumo-kpi-shell listing-resumo-kpi-shell--accent-${accentClass}`}>
      <header className="listing-resumo-kpi-shell__head">
        <h4
          className={`listing-resumo-kpi-shell__title${titleCompact ? " listing-resumo-kpi-shell__title--compact" : ""}`}
        >
          {title}
        </h4>
      </header>
      <div className="listing-resumo-kpi-shell__body">{children}</div>
    </article>
  );
}
