// ======================================================================
// KPI executivo inferior — Vendas (mesma linguagem visual dos Top 10).
// Somente exibição; valores vêm do executive-summary (backend).
// ======================================================================

import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "./vendasExecutivePanelUx";
import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip";
import "./vendasExecutivePanelUx.css";
import "./VendasExecutiveKpiCard.css";

function VendasExecutiveKpiSkeleton() {
  return (
    <div
      className="vendas-executive-kpi__body vendas-executive-kpi__body--skeleton vendas-executive-state-fade-in"
      aria-hidden
    >
      <span className="vendas-executive-kpi__skeleton-value" />
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   tone: "quantity" | "revenue" | "profit" | "conversion";
 *   value: string;
 *   subtitle?: string | null;
 *   loading?: boolean;
 *   error?: string | null;
 *   empty?: boolean;
 *   unavailable?: boolean;
 *   valueClassName?: string;
 *   tituloExterno?: boolean;
 *   titleClassName?: string;
 *   titleIcon?: import("react").ReactNode;
 *   valueIcon?: import("react").ReactNode;
 *   titleDica?: string | null;
 *   periodLabel?: string | null;
 *   valueAside?: import("react").ReactNode;
 * }} props
 */
export default function VendasExecutiveKpiCard({
  title,
  tone,
  value,
  subtitle = null,
  loading = false,
  error = null,
  empty = false,
  unavailable = false,
  valueClassName = "",
  tituloExterno = false,
  titleClassName = "",
  titleIcon = null,
  valueIcon = null,
  titleDica = null,
  periodLabel = null,
  valueAside = null,
}) {
  const showLoading = Boolean(loading);
  const showError = Boolean(error) && !showLoading;
  const showEmpty = Boolean(empty) && !showLoading && !showError;
  const showUnavailable = unavailable && !showLoading && !showError && !showEmpty;
  const panelErrorMessage = error ? EXECUTIVE_PANEL_ERROR_MESSAGE : null;
  const displayValue = showEmpty ? EXECUTIVE_PANEL_EMPTY_KPI_VALUE : value;

  const hasSubtitle = Boolean(subtitle) && !showEmpty && !showError && !showLoading;

  const bodyClass = [
    "vendas-executive-kpi__body",
    hasSubtitle ? "vendas-executive-kpi__body--with-subtitle" : "",
    showUnavailable ? "vendas-executive-kpi__body--unavailable" : "",
    showEmpty ? "vendas-executive-kpi__body--empty" : "",
    showError ? "vendas-executive-kpi__body--error" : "",
    !showLoading && !showError ? "vendas-executive-state-fade-in" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headerNode = (
    <header
      className={[
        "vendas-executive-kpi__head",
        tituloExterno ? "vendas-executive-kpi__head--external" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="vendas-executive-kpi__title-wrap">
        {titleIcon ? (
          <span className="vendas-executive-kpi__title-icon" aria-hidden>
            {titleIcon}
          </span>
        ) : null}
        <h3
          className={["vendas-executive-kpi__title", titleClassName].filter(Boolean).join(" ")}
          title={title}
        >
          {title}
        </h3>
        {titleDica ? (
          <S7Tooltip content={titleDica} placement="top-start" offset={6} wrap>
            <button
              type="button"
              className="vendas-executive-kpi__title-info"
              aria-label={titleDica}
            >
              <S7Icon name="info" size={14} strokeWidth={1.75} />
            </button>
          </S7Tooltip>
        ) : null}
      </div>
      {periodLabel ? (
        <span className="vendas-executive-kpi__period-badge">{periodLabel}</span>
      ) : null}
    </header>
  );

  const cardShell = (
    <article className={`vendas-executive-kpi vendas-executive-kpi--tone-${tone}`}>
      {!tituloExterno ? headerNode : null}
      {showLoading ? (
        <VendasExecutiveKpiSkeleton />
      ) : (
        <div className={bodyClass}>
          {showError && panelErrorMessage ? (
            <>
              <p className="vendas-executive-kpi__state-message" role="alert">
                {panelErrorMessage}
              </p>
              <div className="vendas-executive-kpi__state-actions" aria-hidden="true" />
            </>
          ) : (
            <>
              <div className="vendas-executive-kpi__value-row">
                {valueIcon ? (
                  <span className="vendas-executive-kpi__value-icon" aria-hidden>
                    {valueIcon}
                  </span>
                ) : null}
                <p
                  className={["vendas-executive-kpi__value", valueClassName].filter(Boolean).join(" ")}
                  aria-live="polite"
                >
                  {displayValue}
                </p>
                {valueAside ? <div className="vendas-executive-kpi__value-aside">{valueAside}</div> : null}
              </div>
              {hasSubtitle ? (
                <p className="vendas-executive-kpi__subtitle">{subtitle}</p>
              ) : null}
            </>
          )}
        </div>
      )}
    </article>
  );

  if (tituloExterno) {
    return (
      <div className="vendas-executive-kpi-stack vendas-executive-kpi-stack--titulo-externo">
        {headerNode}
        {cardShell}
      </div>
    );
  }

  return cardShell;
}
