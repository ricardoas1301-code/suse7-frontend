// ======================================================
// Painel S7 (MVP) — status + placeholder de ação na página Precificação Inteligente.
// Bloco "Resumo do cenário" temporariamente omitido (lucro/margem já na sidebar e no card detalhado).
// ======================================================

import S7Button from "../ui/S7Button.jsx";
import { getScenarioHealthStatus } from "./pricingScenarioDecisionUi.js";

/**
 * @param {{ scenario: unknown }} props
 */
export function PricingScenarioDecisionPanel({ scenario }) {
  const health = getScenarioHealthStatus(scenario);

  let statusClass = "pricing-intelligence-page__decision-panel__status--healthy";
  let statusText = "Oferta saudável";
  if (health === "loss") {
    statusClass = "pricing-intelligence-page__decision-panel__status--loss";
    statusText = "Prejuízo";
  } else if (health === "low_margin") {
    statusClass = "pricing-intelligence-page__decision-panel__status--warn";
    statusText = "Atenção: margem baixa";
  }

  return (
    <aside className="pricing-intelligence-page__decision-panel" aria-label="Status do cenário">
      <div className="pricing-intelligence-page__decision-panel__block">
        <h3 className="pricing-intelligence-page__decision-panel__heading">Status</h3>
        <p className={`pricing-intelligence-page__decision-panel__status ${statusClass}`} role="status">
          {statusText}
        </p>
      </div>

      <div className="pricing-intelligence-page__decision-panel__block pricing-intelligence-page__decision-panel__block--action">
        <h3 className="pricing-intelligence-page__decision-panel__heading">Próxima ação</h3>
        <S7Button type="button" variant="primary" size="md" disabled className="pricing-intelligence-page__decision-panel__cta">
          Aplicar preço
        </S7Button>
      </div>
    </aside>
  );
}
