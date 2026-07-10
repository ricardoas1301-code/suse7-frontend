import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import ProductHealthProgress from "../../../components/ProductHealthProgress.jsx";
import "./ListingResumoSemiMeter.css";

/**
 * KPI do Resumo (Qualidade / Experiência) — termômetro padronizado + labels/rodapé.
 *
 * @param {{
 *   displayValue?: string;
 *   scorePercent?: number | null;
 *   levelLabel?: string;
 *   title?: string;
 *   footerText?: string;
 *   footerLinkHref?: string | null;
 *   footerLinkTooltip?: string;
 *   tone?: string;
 *   compact?: boolean;
 *   inShell?: boolean;
 * }} props
 */
export default function ListingResumoSemiMeter({
  displayValue = "—",
  scorePercent = null,
  levelLabel = "",
  title = "",
  footerText = "",
  footerLinkHref = null,
  footerLinkTooltip = "Abrir anúncio no Mercado Livre para corrigir objetivos",
  tone = "neutral",
  compact = false,
  inShell = false,
}) {
  const hasScore = scorePercent != null && Number.isFinite(Number(scorePercent));
  const clamped = hasScore ? Math.max(0, Math.min(100, Number(scorePercent))) : 0;
  const toneClass = ["success", "info", "warning", "danger", "neutral"].includes(tone) ? tone : "neutral";
  const compactClass = compact ? " listing-resumo-semi-meter--compact" : "";
  const shellClass = inShell ? " listing-resumo-semi-meter--in-shell" : "";
  const footerHref =
    footerLinkHref != null && String(footerLinkHref).trim() !== "" && /^https?:\/\//i.test(String(footerLinkHref).trim())
      ? String(footerLinkHref).trim()
      : null;

  const footerContent =
    footerText && footerHref ? (
      <S7Tooltip content={footerLinkTooltip} placement="top" offset={6} wrap>
        <a
          href={footerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="listing-resumo-semi-meter__footer-link"
        >
          {footerText}
        </a>
      </S7Tooltip>
    ) : (
      footerText
    );

  const percentText = hasScore ? null : displayValue;

  return (
    <article className={`listing-resumo-semi-meter listing-resumo-semi-meter--${toneClass}${compactClass}${shellClass}`}>
      <div className="listing-resumo-semi-meter__gauge pf-right-progress-semi">
        <ProductHealthProgress
          percent={clamped}
          percentText={percentText}
          showLabel={false}
          variant="semi"
          accent="primary"
        />
      </div>
      {levelLabel ? <p className="listing-resumo-semi-meter__level">{levelLabel}</p> : null}
      {!inShell && title ? <p className="listing-resumo-semi-meter__title">{title}</p> : null}
      {footerText ? <p className="listing-resumo-semi-meter__footer">{footerContent}</p> : null}
    </article>
  );
}
