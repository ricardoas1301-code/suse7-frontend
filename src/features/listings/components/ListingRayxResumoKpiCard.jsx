import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import "../../../components/sales/VendasExecutiveKpiCard.css";
import "./ListingRayxResumoKpiCard.css";

/**
 * KPI compacto do Resumo do Raio-X do Anúncio (paridade VendasExecutiveKpiCard).
 *
 * @param {{
 *   title: string;
 *   tone?: "quantity" | "revenue" | "profit" | "conversion";
 *   value?: string;
 *   subtitle?: string | null;
 *   footerText?: string | null;
 *   footerLinkHref?: string | null;
 *   footerLinkTooltip?: string;
 *   unavailable?: boolean;
 * }} props
 */
export default function ListingRayxResumoKpiCard({
  title,
  tone = "revenue",
  value = "—",
  subtitle = null,
  footerText = null,
  footerLinkHref = null,
  footerLinkTooltip = "Abrir anúncio no Mercado Livre para corrigir objetivos",
  unavailable = false,
}) {
  const safeTone = ["quantity", "revenue", "profit", "conversion"].includes(tone) ? tone : "revenue";
  const footerHref =
    footerLinkHref != null && String(footerLinkHref).trim() !== "" && /^https?:\/\//i.test(String(footerLinkHref).trim())
      ? String(footerLinkHref).trim()
      : null;

  return (
    <article className={`vendas-executive-kpi vendas-executive-kpi--tone-${safeTone} listing-rayx-resumo-kpi`}>
      <header className="vendas-executive-kpi__head">
        <div className="vendas-executive-kpi__title-wrap">
          <h3 className="vendas-executive-kpi__title" title={title}>
            {title}
          </h3>
        </div>
      </header>
      <div
        className={[
          "vendas-executive-kpi__body",
          subtitle ? "vendas-executive-kpi__body--with-subtitle" : "",
          unavailable ? "vendas-executive-kpi__body--unavailable" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="vendas-executive-kpi__value">{value}</p>
        {subtitle ? <p className="vendas-executive-kpi__subtitle">{subtitle}</p> : null}
        {footerText ? (
          <p className="listing-rayx-resumo-kpi__footer">
            {footerHref ? (
              <S7Tooltip content={footerLinkTooltip} placement="top" offset={6} wrap>
                <a
                  href={footerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="listing-rayx-resumo-kpi__footer-link"
                >
                  {footerText}
                </a>
              </S7Tooltip>
            ) : (
              footerText
            )}
          </p>
        ) : null}
      </div>
    </article>
  );
}
