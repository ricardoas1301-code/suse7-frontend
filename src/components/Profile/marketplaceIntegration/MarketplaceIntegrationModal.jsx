import { useRef } from "react";

import "./MarketplaceIntegrationCard.css";

import "./MarketplaceIntegrationModal.css";

import MarketplaceModalShell from "./MarketplaceModalShell.jsx";
import MarketplaceSyncDetailsOpeningIndicator from "./MarketplaceSyncDetailsOpeningIndicator.jsx";



/**

 * Modal genérico de gestão/diagnóstico de integração marketplace.

 * @param {{

 *   open: boolean;

 *   onClose: () => void;

 *   title: string;

 *   subtitle: string;

 *   logoSrc: string;

 *   logoAlt?: string;

 *   accountName: string;

 *   linkedCompanyName: string;

 *   linkedCompanyDocument?: string;

 *   statusBadge?: { label: string; tone?: string } | null;

 *   integrationStateRows?: Array<{ label: string; value: string; tone?: string }>;

 *   diagnosticLines?: string[];

 *   syncViewAction?: {

 *     label: string;

 *     emphasis?: boolean;

 *     disabled?: boolean;

 *     loading?: boolean;

 *     onClick: () => void;

 *     buttonRef?: import("react").RefObject<HTMLButtonElement | null>;

 *   } | null;

 *   advancedActions?: React.ReactNode;

 *   advancedOptionsResetKey?: string;

 *   isCovered?: boolean;

 *   stackLayer?: "base" | "top";

 * }} props

 */

export default function MarketplaceIntegrationModal({

  open,

  onClose,

  title,

  subtitle,

  logoSrc,

  logoAlt = "",

  accountName,

  linkedCompanyName,

  linkedCompanyDocument = "—",

  statusBadge,

  integrationStateRows = [],

  diagnosticLines = [],

  syncViewAction = null,

  advancedActions = null,

  advancedOptionsResetKey = "default",

  isCovered = false,

  stackLayer = "top",

}) {

  const dialogRef = useRef(null);

  const badgeTone = statusBadge?.tone || "ok";



  return (

    <MarketplaceModalShell

      open={open}

      onClose={onClose}

      isCovered={isCovered}

      stackLayer={stackLayer}

      variant="integration-management"

      dialogClassName="s7-marketplace-integration-modal"

      dialogRef={dialogRef}

      ariaLabelledBy="s7-marketplace-integration-modal-title"

    >

      <div className="s7-marketplace-integration-modal__scroll-viewport">
      <div className="profile-modal-header s7-marketplace-integration-modal__header">

        <h2 id="s7-marketplace-integration-modal-title">{title}</h2>

        <p>{subtitle}</p>

      </div>



      <div className="s7-marketplace-integration-modal__identity">

        <img src={logoSrc} alt={logoAlt} className="s7-marketplace-integration-modal__logo" />

        <div className="s7-marketplace-integration-modal__identity-text">

          <div className="s7-marketplace-integration-modal__identity-top">

            <strong>{accountName}</strong>

            {statusBadge ? (

              <span

                className={`s7-badge s7-marketplace-integration-badge s7-marketplace-integration-badge--${badgeTone}`}

              >

                {statusBadge.label}

              </span>

            ) : null}

          </div>

          <div className="s7-marketplace-integration-modal__identity-details">

            <p className="s7-marketplace-integration-modal__identity-line">

              <span className="s7-marketplace-integration-modal__identity-label">Loja:</span>{" "}

              <span className="s7-marketplace-integration-modal__identity-value">{linkedCompanyName}</span>

            </p>

            <p className="s7-marketplace-integration-modal__identity-line">

              <span className="s7-marketplace-integration-modal__identity-label">CNPJ:</span>{" "}

              <span className="s7-marketplace-integration-modal__identity-value">{linkedCompanyDocument}</span>

            </p>

          </div>

        </div>

      </div>



      <div className="s7-marketplace-integration-modal__body">

        <section className="s7-marketplace-integration-modal__panel" aria-labelledby="s7-mi-state-title">

          <h3 id="s7-mi-state-title" className="s7-marketplace-integration-modal__panel-title">

            Situação da integração

          </h3>

          <dl className="s7-marketplace-integration-modal__rows">

            {integrationStateRows.map((row) => (

              <div key={row.label} className="s7-marketplace-integration-modal__row">

                <dt>{row.label}</dt>

                <dd className={row.tone ? `is-tone-${row.tone}` : undefined}>{row.value}</dd>

              </div>

            ))}

          </dl>

        </section>



        <section className="s7-marketplace-integration-modal__panel" aria-labelledby="s7-mi-diagnostic-title">

          <h3 id="s7-mi-diagnostic-title" className="s7-marketplace-integration-modal__panel-title">

            Sincronização e diagnóstico

          </h3>

          {diagnosticLines.length ? (

            <ul className="s7-marketplace-integration-modal__diagnostic-list">

              {diagnosticLines.map((line) => (

                <li key={line}>{line}</li>

              ))}

            </ul>

          ) : (

            <p className="s7-marketplace-integration-modal__empty-hint">

              Nenhum alerta operacional adicional no momento.

            </p>

          )}

          {syncViewAction ? (

            <button

              ref={syncViewAction.buttonRef}

              type="button"

              className={`s7-marketplace-integration-modal__sync-link ${

                syncViewAction.emphasis ? "is-emphasis" : ""

              }${syncViewAction.loading ? " is-loading" : ""}`}

              disabled={syncViewAction.disabled || syncViewAction.loading}

              aria-busy={syncViewAction.loading ? "true" : undefined}

              onClick={syncViewAction.onClick}

            >

              {syncViewAction.loading ? (
                <>
                  <MarketplaceSyncDetailsOpeningIndicator />
                  <span>{syncViewAction.label}</span>
                </>
              ) : (
                syncViewAction.label
              )}

            </button>

          ) : null}

        </section>

      </div>



      {advancedActions ? (

        <details

          key={advancedOptionsResetKey}

          className="s7-marketplace-integration-modal__advanced"

          defaultOpen={false}

        >

          <summary className="s7-marketplace-integration-modal__advanced-summary">
            <span>Opções avançadas</span>
            <span className="s7-marketplace-integration-modal__advanced-chevron" aria-hidden="true" />
          </summary>

          <div className="s7-marketplace-integration-modal__advanced-body">{advancedActions}</div>

        </details>

      ) : null}

      </div>

    </MarketplaceModalShell>

  );

}


