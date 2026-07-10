import { S7_CUSTOS_OPERACIONAIS_SECTION_TITLE } from "../../utils/s7CustosOperacionaisLabel.js";
import { PricingScenarioMetricValue } from "./PricingScenarioMetricValue.jsx";

/**
 * @param {{
 *   lines: { label: string; subtitlePct?: string | null; amountBrl: string; ativo?: boolean }[];
 *   title?: string;
 *   financialScenarioPending?: boolean;
 * }} props
 */
export function PricingScenarioContingencySection({
  lines,
  title = S7_CUSTOS_OPERACIONAIS_SECTION_TITLE,
  sectionClassName = "",
  financialScenarioPending = false,
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const finPend = financialScenarioPending === true;

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
                <PricingScenarioMetricValue pending={finPend}>{line.amountBrl}</PricingScenarioMetricValue>
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
