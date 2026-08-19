// ======================================================================
// S7DailySummaryCard — Resumo Diário (Dashboard executivo)
// DASH.1: estrutura visual + mock. Integração de dados em fase futura.
// ======================================================================

import "./S7DailySummaryCard.css";
import S7DashboardSectionPanel from "./S7DashboardSectionPanel.jsx";
import { S7_DAILY_SUMMARY_MOCK } from "./s7DailySummaryMock.js";
import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip";
import S7SectionJumpButton from "../ui/S7SectionJumpButton.jsx";
import S7DailySummaryAdaptiveMetricValue from "./S7DailySummaryAdaptiveMetricValue.jsx";
import { renderExecutiveRayxKpiMetricIcon } from "../../features/sales/executiveRayxKpiMetricIcons.jsx";
import EasterEggTitleTrigger from "../../features/easter-eggs/components/EasterEggTitleTrigger.jsx";

/**
 * @param {{
 *   title?: string;
 *   lastUpdatedLabel?: string;
 *   lastUpdatedAt?: string;
 *   blocks?: import("./s7DailySummaryMock.js").S7DailySummaryBlock[];
 *   periodLabel?: string;
 *   periodDateLabel?: string;
 *   periodChipLabel?: string | null;
 *   filtersExpanded?: boolean;
 *   filtersActive?: boolean;
 *   onToggleFilters?: () => void;
 *   filtersLayout?: "collapsible" | "inline";
 *   filterPanel?: import("react").ReactNode;
 *   titleEasterEggId?: string | null;
 *   sectionJumpDownTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpDownAriaLabel?: string;
 *   slots?: {
 *     salesFooter?: import("react").ReactNode;
 *   };
 *   className?: string;
 * }} props
 */
export default function S7DailySummaryCard({
  title = S7_DAILY_SUMMARY_MOCK.title,
  lastUpdatedLabel = S7_DAILY_SUMMARY_MOCK.lastUpdatedLabel,
  lastUpdatedAt = S7_DAILY_SUMMARY_MOCK.lastUpdatedAt,
  blocks = S7_DAILY_SUMMARY_MOCK.blocks,
  periodLabel = "Hoje",
  periodDateLabel = "",
  periodChipLabel = null,
  filtersExpanded = false,
  filtersActive = false,
  onToggleFilters,
  filtersLayout = "collapsible",
  filterPanel = null,
  titleEasterEggId = null,
  sectionJumpDownTargetRef = null,
  sectionJumpDownAriaLabel = "Ir para busca e filtros",
  slots = {},
  className = "",
}) {
  const rootClass = ["s7-daily-summary", className].filter(Boolean).join(" ");
  const inlineFilters = filtersLayout === "inline";
  const hasHeaderToggle = !inlineFilters && typeof onToggleFilters === "function";

  const handleHeaderToggle = () => {
    if (!hasHeaderToggle) return;
    onToggleFilters();
  };

  /** @param {import("react").KeyboardEvent<HTMLElement>} event */
  const handleHeaderKeyDown = (event) => {
    if (!hasHeaderToggle) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleFilters();
    }
  };

  return (
    <section className={rootClass} aria-label={title}>
      <S7DashboardSectionPanel>
      <header
        className={[
          "s7-daily-summary__head",
          "s7-dashboard-block-head",
          inlineFilters ? "s7-dashboard-block-head--inline-filters" : "",
          hasHeaderToggle ? "s7-dashboard-block-head--clickable" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={hasHeaderToggle ? handleHeaderToggle : undefined}
        onKeyDown={hasHeaderToggle ? handleHeaderKeyDown : undefined}
        role={hasHeaderToggle ? "button" : undefined}
        tabIndex={hasHeaderToggle ? 0 : undefined}
        aria-expanded={hasHeaderToggle ? filtersExpanded : undefined}
        aria-controls={hasHeaderToggle ? "s7-daily-summary-filters-panel" : undefined}
      >
        <div
          className={[
            "s7-dashboard-block-head__title-row",
            inlineFilters ? "s7-dashboard-block-head__title-row--with-filters" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!inlineFilters && hasHeaderToggle ? (
            <button
              type="button"
              className={[
                "s7-block-filter-toggle",
                filtersExpanded || filtersActive ? "s7-block-filter-toggle--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-expanded={filtersExpanded}
              aria-controls="s7-daily-summary-filters-panel"
              aria-label={filtersExpanded ? "Recolher filtros do Resumo Diário" : "Expandir filtros do Resumo Diário"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFilters?.();
              }}
            >
              <S7Icon name="search" size={18} strokeWidth={1.85} />
            </button>
          ) : null}
          {inlineFilters && filterPanel ? (
            <div className="s7-dashboard-block-head__inline-filters">{filterPanel}</div>
          ) : null}
        </div>
        <div className="s7-daily-summary__live-title">
          {titleEasterEggId ? (
            <EasterEggTitleTrigger eggId={titleEasterEggId} className="s7-daily-summary__title">
              {title}
            </EasterEggTitleTrigger>
          ) : (
            <h2 className="s7-daily-summary__title">{title}</h2>
          )}
        </div>
        {(periodChipLabel || periodLabel || periodDateLabel || sectionJumpDownTargetRef) ? (
          <div
            className={[
              "s7-dashboard-block-head__period-aside",
              sectionJumpDownTargetRef ? "s7-dashboard-block-head__period-aside--with-jump" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Período do resumo"
          >
            {periodChipLabel || periodLabel || periodDateLabel ? (
              <div className="s7-dashboard-block-head__period-aside-copy">
                {periodChipLabel ? (
                  <span className="s7-daily-summary__period-chip">{periodChipLabel}</span>
                ) : periodLabel ? (
                  <span className="s7-daily-summary__period-label">{periodLabel}</span>
                ) : null}
                {periodDateLabel ? (
                  <span className="s7-daily-summary__period-range">{periodDateLabel}</span>
                ) : null}
              </div>
            ) : null}
            {sectionJumpDownTargetRef ? (
              <S7SectionJumpButton
                direction="down"
                targetRef={sectionJumpDownTargetRef}
                ariaLabel={sectionJumpDownAriaLabel}
              />
            ) : null}
          </div>
        ) : null}
      </header>

      {filterPanel && !inlineFilters ? (
        <div className="s7-daily-summary__filters-wrap">{filterPanel}</div>
      ) : null}

      <div className="s7-daily-summary__body">
        {blocks.map((block) => (
          <article
            key={block.id}
            className="s7-daily-summary__block"
            data-block-id={block.id}
            data-block-columns={block.columns ?? (block.metrics.length > 2 ? 2 : 1)}
            aria-labelledby={`s7-daily-summary-block-${block.id}`}
          >
            <h3 className="s7-daily-summary__block-title" id={`s7-daily-summary-block-${block.id}`}>
              {block.title}
            </h3>
            <dl className="s7-daily-summary__metrics">
              {block.metrics.map((metric) => {
                const metricIcon = renderExecutiveRayxKpiMetricIcon(metric.id);
                return (
                <div key={metric.id} className="s7-daily-summary__metric" data-metric-id={metric.id}>
                  <dt className="s7-daily-summary__metric-label">
                    <span className="s7-daily-summary__metric-label-wrap">
                      <span>{metric.label}</span>
                      {metric.labelTip ? (
                        <S7Tooltip content={metric.labelTip} placement="top-start" offset={6} wrap>
                          <button
                            type="button"
                            className="s7-daily-summary__metric-label-info"
                            aria-label={metric.labelTip}
                          >
                            <S7Icon name="info" size={12} strokeWidth={1.75} />
                          </button>
                        </S7Tooltip>
                      ) : null}
                    </span>
                  </dt>
                  <dd
                    className={[
                      "s7-daily-summary__metric-value",
                      metric.tone ? `s7-daily-summary__metric-value--${metric.tone}` : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="s7-daily-summary__metric-value-row">
                      {metricIcon ? (
                        <span className="s7-daily-summary__metric-value-icon-wrap" aria-hidden>
                          {metricIcon}
                        </span>
                      ) : null}
                      {metric.id === "revenue" ? (
                        <S7DailySummaryAdaptiveMetricValue value={metric.value} variant="revenue" />
                      ) : metric.id === "orders" ? (
                        <S7DailySummaryAdaptiveMetricValue value={metric.value} variant="orders" />
                      ) : metric.valueDica ? (
                        <S7Tooltip content={metric.valueDica} placement="top-start" offset={6} wrap>
                          <span
                            className="s7-daily-summary__metric-value-main s7-daily-summary__metric-value-main--tooltip"
                            tabIndex={0}
                          >
                            {metric.value}
                          </span>
                        </S7Tooltip>
                      ) : (
                        <span className="s7-daily-summary__metric-value-main">{metric.value}</span>
                      )}
                    </div>
                    {metric.sharePercent ? (
                      <span className="s7-daily-summary__metric-share">{metric.sharePercent}</span>
                    ) : null}
                  </dd>
                </div>
              );
              })}
            </dl>
            {block.id === "resultado" ? (
              <div className="s7-daily-summary__resultado-accent" aria-hidden="true">
                <img
                  className="s7-daily-summary__resultado-accent-img"
                  src="/dashboard/s7-resultado-crescimento.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
            {block.id === "sales" && slots?.salesFooter ? (
              <div className="s7-daily-summary__block-slot s7-daily-summary__block-slot--sales-footer">
                {slots.salesFooter}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      </S7DashboardSectionPanel>
    </section>
  );
}
