import { useRef } from "react";
import ListingsWorkspace from "../features/listings/components/ListingsWorkspace";
import PricingHealthCenter from "../features/dashboard/components/PricingHealthCenter.jsx";
import S7OperationalExecutiveBlock from "../components/dashboard/S7OperationalExecutiveBlock.jsx";
import { S7OperationalListsGate } from "../billing/components/S7EntitlementGates.jsx";
import "./PrecificacoesPage.css";

/** Rota dedicada à inteligência de precificação (clique na linha / S7 → `/precificacoes/inteligente/:id`, em nova aba). */
export default function PrecificacoesPage() {
  const precificacoesExecutiveRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const precificacoesFiltersRef = useRef(/** @type {HTMLElement | null} */ (null));

  return (
    <div className="precificacoes-page">
      <S7OperationalExecutiveBlock ref={precificacoesExecutiveRef}>
        <PricingHealthCenter
          className="dashboard-page__pricing-health"
          sectionJumpDownTargetRef={precificacoesFiltersRef}
          sectionJumpDownAriaLabel="Ir para busca e filtros"
        />
      </S7OperationalExecutiveBlock>
      <S7OperationalListsGate>
        <ListingsWorkspace
          mode="precificacoes"
          filtersSectionRef={precificacoesFiltersRef}
          sectionJumpUpTargetRef={precificacoesExecutiveRef}
          sectionJumpUpAriaLabel="Voltar para a Central de Saúde da Precificação"
        />
      </S7OperationalListsGate>
    </div>
  );
}
