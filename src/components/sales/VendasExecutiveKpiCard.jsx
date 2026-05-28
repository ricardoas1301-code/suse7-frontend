// ======================================================================
// KPI executivo inferior — Vendas (mesma linguagem visual dos Top 10).
// Somente exibição; valores vêm do executive-summary (backend).
// ======================================================================

import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "./vendasExecutivePanelUx";
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
}) {
  const showLoading = Boolean(loading);
  const showError = Boolean(error) && !showLoading;
  const showEmpty = Boolean(empty) && !showLoading && !showError;
  const showUnavailable = unavailable && !showLoading && !showError && !showEmpty;
  const panelErrorMessage = error ? EXECUTIVE_PANEL_ERROR_MESSAGE : null;
  const displayValue = showEmpty ? EXECUTIVE_PANEL_EMPTY_KPI_VALUE : value;

  const bodyClass = [
    "vendas-executive-kpi__body",
    showUnavailable ? "vendas-executive-kpi__body--unavailable" : "",
    showEmpty ? "vendas-executive-kpi__body--empty" : "",
    showError ? "vendas-executive-kpi__body--error" : "",
    !showLoading && !showError ? "vendas-executive-state-fade-in" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={`vendas-executive-kpi vendas-executive-kpi--tone-${tone}`}>
      <header className="vendas-executive-kpi__head">
        <h3 className="vendas-executive-kpi__title">{title}</h3>
      </header>
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
              <p className="vendas-executive-kpi__value" aria-live="polite">
                {displayValue}
              </p>
              {subtitle && !showEmpty ? (
                <p className="vendas-executive-kpi__subtitle">{subtitle}</p>
              ) : null}
            </>
          )}
        </div>
      )}
    </article>
  );
}
