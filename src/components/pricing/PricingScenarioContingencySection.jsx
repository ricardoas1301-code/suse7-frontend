import { S7_CUSTOS_OPERACIONAIS_SECTION_TITLE } from "../../utils/s7CustosOperacionaisLabel.js";

/**
 * @param {{
 *   lines: { label: string; subtitlePct?: string | null; amountBrl: string; ativo?: boolean }[];
 *   title?: string;
 *   sectionClassName?: string;
 * }} props
 */
export function PricingScenarioContingencySection({
  lines,
  title = S7_CUSTOS_OPERACIONAIS_SECTION_TITLE,
  sectionClassName = "",
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  return (
    <div
      className={[
        "anuncios-sell-popover__section",
        "anuncios-pricing-modal__raiox-block",
        "anuncios-sell-popover__section--contingency",
        sectionClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h4 className="anuncios-sell-popover__section-title">{title}</h4>
      <div className="anuncios-sell-popover__block anuncios-sell-popover__block--contingency">
        {lines.map((line) => {
          const linhaAtiva = line.ativo === true;
          return (
            <div
              key={`${line.label}-${line.subtitlePct ?? ""}`}
              className={[
                "anuncios-sell-popover__contingency-entry",
                linhaAtiva ? "" : "anuncios-sell-popover__contingency-entry--inativo",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="anuncios-sell-popover__line">
                <span>{line.label}</span>
                <strong>{line.amountBrl}</strong>
              </div>
              {line.subtitlePct != null && String(line.subtitlePct).trim() !== "" ? (
                <div
                  className={[
                    "anuncios-sell-popover__muted",
                    "anuncios-sell-popover__contingency-pct",
                    linhaAtiva ? "" : "anuncios-sell-popover__contingency-pct--inativo",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {line.subtitlePct}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
