import { useRef } from "react";
import MarketplaceModalShell from "./MarketplaceModalShell.jsx";
import MarketplaceSyncStepStatusIcon from "./MarketplaceSyncStepStatusIcon.jsx";
import "./MarketplaceIntegrationModal.css";
import "./MarketplaceSyncDetailsModal.css";

/**
 * Modal genérico — detalhes da sincronização marketplace.
 */
export default function MarketplaceSyncDetailsModal({
  open,
  onClose,
  stackLayer = "top",
  marketplaceLogoSrc,
  marketplaceLogoAlt = "",
  contextMarketplaceAccountId = null,
  presentation,
  stepsLoading = false,
  loadErrorMessage = null,
  footer = null,
}) {
  const dialogRef = useRef(null);
  const { header, connectedAccount, steps, connectStepLine, executionSummary } = presentation;
  const errorCountNumeric = Number(executionSummary.errorCount);
  const hasErrorCount = Number.isFinite(errorCountNumeric) && errorCountNumeric > 0;

  return (
    <MarketplaceModalShell
      open={open}
      onClose={onClose}
      stackLayer={stackLayer}
      variant="sync-details"
      dialogClassName="s7-marketplace-sync-details-modal"
      dialogRef={dialogRef}
      ariaLabelledBy="s7-marketplace-sync-details-title"
    >
      <div className="s7-marketplace-sync-details-modal__content">
        <div className="s7-marketplace-sync-details-modal__heading">
          <h2 id="s7-marketplace-sync-details-title" className="s7-marketplace-sync-details-modal__title">
            {header.title}
          </h2>
          <p className="s7-marketplace-sync-details-modal__status" role="status">
            <span
              className={`s7-badge s7-marketplace-integration-badge s7-marketplace-integration-badge--${
                header.statusTone || "unknown"
              }`}
            >
              {header.statusLabel}
            </span>
          </p>
        </div>

        <div
          className="s7-marketplace-sync-details-modal__context-row"
          data-context-account-id={contextMarketplaceAccountId || undefined}
        >
          <section
            className="s7-marketplace-sync-details-modal__context-block s7-marketplace-sync-details-modal__context-block--account"
            aria-label="Conta da sincronização"
          >
            <div className="s7-marketplace-sync-details-modal__account">
              <img
                src={marketplaceLogoSrc}
                alt={marketplaceLogoAlt}
                className="s7-marketplace-sync-details-modal__account-logo"
              />
              <div className="s7-marketplace-sync-details-modal__account-column">
                <div className="s7-marketplace-sync-details-modal__account-name-row">
                  <strong title={connectedAccount.accountName}>{connectedAccount.accountName}</strong>
                  <span
                    className={`s7-badge s7-marketplace-integration-badge s7-marketplace-integration-badge--${
                      connectedAccount.statusBadge.tone || "unknown"
                    }`}
                  >
                    {connectedAccount.statusBadge.label}
                  </span>
                </div>
                <p className="s7-marketplace-sync-details-modal__account-meta">
                  <span className="s7-marketplace-sync-details-modal__account-meta-label">Loja:</span>{" "}
                  <span className="s7-marketplace-sync-details-modal__account-meta-value">
                    {connectedAccount.linkedCompanyName}
                  </span>
                </p>
                <p className="s7-marketplace-sync-details-modal__account-meta">
                  <span className="s7-marketplace-sync-details-modal__account-meta-label">CNPJ:</span>{" "}
                  <span className="s7-marketplace-sync-details-modal__account-meta-value">
                    {connectedAccount.linkedCompanyDocumentFormatted}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <div className="s7-marketplace-sync-details-modal__context-divider" aria-hidden="true" />

          <section
            className="s7-marketplace-sync-details-modal__context-block s7-marketplace-sync-details-modal__context-block--situation"
            aria-labelledby="s7-marketplace-sync-situation-title"
          >
            <h3 id="s7-marketplace-sync-situation-title" className="s7-marketplace-sync-details-modal__context-title">
              Situação da sincronização
            </h3>
            <dl className="s7-marketplace-sync-details-modal__situation-rows">
              <div className="s7-marketplace-sync-details-modal__situation-row">
                <dt>Concluídas</dt>
                <dd>{executionSummary.completedCount}</dd>
              </div>
              <div className="s7-marketplace-sync-details-modal__situation-row">
                <dt>Pendentes</dt>
                <dd>{executionSummary.pendingCount}</dd>
              </div>
              <div
                className={`s7-marketplace-sync-details-modal__situation-row${
                  hasErrorCount ? " s7-marketplace-sync-details-modal__situation-row--error" : ""
                }`}
              >
                <dt>Com erro</dt>
                <dd>{executionSummary.errorCount}</dd>
              </div>
              <div className="s7-marketplace-sync-details-modal__situation-row">
                <dt>Em execução</dt>
                <dd>{executionSummary.runningStepLabel}</dd>
              </div>
              <div className="s7-marketplace-sync-details-modal__situation-row s7-marketplace-sync-details-modal__situation-row--full">
                <dt>Última atualização</dt>
                <dd>{executionSummary.lastUpdated}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section
          className="s7-marketplace-sync-details-modal__steps-section"
          aria-labelledby="s7-marketplace-sync-steps-title"
        >
          <div className="s7-marketplace-sync-details-modal__steps-heading">
            <h3 id="s7-marketplace-sync-steps-title" className="s7-marketplace-sync-details-modal__section-title">
              Etapas da sincronização
            </h3>

            {connectStepLine ? (
              <p className="s7-marketplace-sync-details-modal__connect-line" role="status">
                <span
                  className={`s7-badge s7-marketplace-integration-badge s7-marketplace-integration-badge--${connectStepLine.badgeTone}`}
                >
                  {connectStepLine.label}
                  {connectStepLine.progressHint}
                  {connectStepLine.statusLabel ? ` — ${connectStepLine.statusLabel}` : ""}
                </span>
              </p>
            ) : null}
          </div>

          {loadErrorMessage ? (
            <p className="s7-marketplace-sync-details-modal__empty" role="alert">
              {loadErrorMessage}
            </p>
          ) : stepsLoading ? (
            <div className="s7-marketplace-sync-details-modal__loading" role="status" aria-live="polite">
              <div className="s7-marketplace-sync-details-modal__skeleton" />
              <div className="s7-marketplace-sync-details-modal__skeleton" />
              <div className="s7-marketplace-sync-details-modal__skeleton" />
              <div className="s7-marketplace-sync-details-modal__skeleton" />
            </div>
          ) : steps.length === 0 ? (
            <p className="s7-marketplace-sync-details-modal__empty" role="status">
              Nenhuma execução registrada para esta conta.
            </p>
          ) : (
            <ol className="s7-marketplace-sync-details-modal__steps-grid">
              {steps.map((step) => (
                <li
                  key={step.key}
                  data-step-key={step.key}
                  className={`s7-marketplace-sync-details-modal__step s7-marketplace-sync-details-modal__step--${step.status}`}
                >
                  <span className="s7-marketplace-sync-details-modal__step-icon" aria-hidden="true">
                    <MarketplaceSyncStepStatusIcon status={step.status} />
                  </span>
                  <div className="s7-marketplace-sync-details-modal__step-body">
                    <span className="s7-marketplace-sync-details-modal__step-title">
                      {step.label}
                      {step.progressHint}
                    </span>
                    {step.showProgressBar ? (
                      <div
                        className="s7-marketplace-sync-details-modal__step-progress"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={step.progressPercent ?? undefined}
                        aria-label={
                          step.progressPercent != null
                            ? `${step.label}: ${step.progressPercent}%`
                            : `${step.label}: em andamento`
                        }
                      >
                        <div
                          className={`s7-marketplace-sync-details-modal__step-progress-fill${
                            step.progressPercent == null
                              ? " s7-marketplace-sync-details-modal__step-progress-fill--indeterminate"
                              : ""
                          }`}
                          style={
                            step.progressPercent != null ? { width: `${step.progressPercent}%` } : undefined
                          }
                        />
                      </div>
                    ) : (
                      <span className="s7-marketplace-sync-details-modal__step-status">
                        <span className="s7-marketplace-sync-details-modal__step-status-label">Status:</span>{" "}
                        {step.statusLabel}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

        </section>
      </div>

      {footer ? <footer className="s7-marketplace-sync-details-modal__footer">{footer}</footer> : null}
    </MarketplaceModalShell>
  );
}
