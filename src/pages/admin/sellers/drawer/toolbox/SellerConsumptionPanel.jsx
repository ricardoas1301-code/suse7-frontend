import { memo, useEffect, useRef } from "react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  formatConsumptionAmount,
  formatConsumptionPercentage,
  formatConsumptionRecalculatedAt,
  formatConsumptionSourceLabel,
  sellerConsumptionBarClassName,
  sellerConsumptionStatusClassName,
} from "./subscription/sellerToolboxConsumptionModel";
import { useSellerConsumptionView } from "./subscription/useSellerConsumptionView";
import SellerToolboxResetConsumptionAction from "./SellerToolboxResetConsumptionAction";
import SellerToolboxRecalculateConsumptionAction from "./SellerToolboxRecalculateConsumptionAction";
import "./SellerConsumptionPanel.css";

function SellerConsumptionPanelSkeleton() {
  return (
    <div className="seller-consumption-panel seller-consumption-panel--skeleton" aria-hidden>
      <div className="seller-consumption-panel__skeleton-head">
        <span className="seller-consumption-panel__skeleton-line seller-consumption-panel__skeleton-line--title" />
        <span className="seller-consumption-panel__skeleton-line seller-consumption-panel__skeleton-line--short" />
      </div>
      <span className="seller-consumption-panel__skeleton-bar" />
      <div className="seller-consumption-panel__skeleton-grid">
        <span className="seller-consumption-panel__skeleton-line" />
        <span className="seller-consumption-panel__skeleton-line" />
        <span className="seller-consumption-panel__skeleton-line" />
      </div>
    </div>
  );
}

function SellerConsumptionPanel() {
  const { sellerId } = useSellerToolbox();
  const { viewState, consumption } = useSellerConsumptionView();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  useEffect(() => {
    if (viewState !== "loaded" || loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("consumption_view_open", {
      sellerId,
      percentage: consumption?.percentage ?? null,
      status: consumption?.status ?? null,
    });
  }, [viewState, sellerId, consumption?.percentage, consumption?.status]);

  useEffect(() => {
    if (viewState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("consumption_view_empty", { sellerId });
  }, [viewState, sellerId]);

  if (viewState === "loading") {
    return <SellerConsumptionPanelSkeleton />;
  }

  if (viewState === "empty") {
    return (
      <div className="seller-consumption-panel seller-consumption-panel--empty" role="status">
        <p className="seller-consumption-panel__empty-message">
          Consumo operacional indisponível para este seller no momento.
        </p>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="seller-consumption-panel seller-consumption-panel--error" role="alert">
        <p className="seller-consumption-panel__error-message">
          Não foi possível exibir o consumo operacional. Tente voltar e abrir novamente.
        </p>
      </div>
    );
  }

  if (!consumption) return null;

  const barWidth = Math.min(Math.max(consumption.percentage, 0), 100);
  const recalculatedAtLabel = formatConsumptionRecalculatedAt(consumption.recalculatedAt);
  const hasSources = consumption.sources.length > 0;

  return (
    <article
      className="seller-consumption-panel"
      data-consumption-status={consumption.status}
      data-dev-only={import.meta.env.DEV ? "true" : undefined}
      aria-labelledby="seller-consumption-panel-title"
    >
      <header className="seller-consumption-panel__head">
        <div className="seller-consumption-panel__titles">
          <h5 id="seller-consumption-panel-title" className="seller-consumption-panel__title">
            Consumo atual
          </h5>
          <p className="seller-consumption-panel__hint">
            Consumo calculado sobre o ciclo atual.
          </p>
        </div>
        {import.meta.env.DEV ? (
          <span className="seller-consumption-panel__dev-badge">Visualização DEV</span>
        ) : null}
      </header>

      <div className="seller-consumption-panel__plan">
        <span className="seller-consumption-panel__plan-label">Plano</span>
        <strong className="seller-consumption-panel__plan-value">{consumption.planName}</strong>
      </div>

      <div className="seller-consumption-panel__progress">
        <div
          className="seller-consumption-panel__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={consumption.monthlyLimit}
          aria-valuenow={consumption.consumed}
          aria-label="Consumo mensal"
        >
          <span
            className={sellerConsumptionBarClassName(consumption.status)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="seller-consumption-panel__percentage">
          {formatConsumptionPercentage(consumption.percentage)}
        </span>
      </div>

      <dl className="seller-consumption-panel__metrics">
        <div className="seller-consumption-panel__metric">
          <dt>Consumo</dt>
          <dd>{formatConsumptionAmount(consumption.consumed)}</dd>
        </div>
        <div className="seller-consumption-panel__metric">
          <dt>Disponível</dt>
          <dd>{formatConsumptionAmount(consumption.remaining)}</dd>
        </div>
        <div className="seller-consumption-panel__metric">
          <dt>Limite</dt>
          <dd>{formatConsumptionAmount(consumption.monthlyLimit)}</dd>
        </div>
        <div className="seller-consumption-panel__metric seller-consumption-panel__metric--status">
          <dt>Status</dt>
          <dd>
            <span className={sellerConsumptionStatusClassName(consumption.status)}>
              {consumption.statusLabel}
            </span>
          </dd>
        </div>
      </dl>

      {recalculatedAtLabel ? (
        <p className="seller-consumption-panel__recalculated" role="status">
          Último recálculo: {recalculatedAtLabel}
        </p>
      ) : null}

      {hasSources ? (
        <div className="seller-consumption-panel__sources">
          <span className="seller-consumption-panel__sources-label">Fontes consideradas</span>
          <ul className="seller-consumption-panel__sources-list">
            {consumption.sources.map((source, index) => (
              <li key={`${source.marketplace ?? "source"}-${index}`}>
                {formatConsumptionSourceLabel(source)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {import.meta.env.DEV ? (
        <footer className="seller-consumption-panel__operations">
          <span className="seller-consumption-panel__operations-label">Operações</span>
          <div className="seller-consumption-panel__operations-buttons">
            <SellerToolboxResetConsumptionAction />
            <SellerToolboxRecalculateConsumptionAction />
          </div>
        </footer>
      ) : null}
    </article>
  );
}

export default memo(SellerConsumptionPanel);
