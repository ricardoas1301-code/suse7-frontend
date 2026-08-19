// ======================================================================
// DASHBOARD — SUSE7
// Central executiva do seller: KPIs de vendas + importação inteligente.
// Regras: sem lógica financeira aqui; modal de perfil / Supabase inalterados.
// Onboarding inicial: ConfigurationAppGate + card "Sua operação começa aqui"
// (CompleteProfileModal legado removido — não coexistir com o fluxo atual).
// ======================================================================

import "./Dashboard.css";
import "../styles/S7CoreKpis.css";
import "../styles/VendasPage.css";
import { useRef } from "react";
import S7Top10BlockSection from "./dashboard/S7Top10BlockSection";
import { DashboardBlockFiltersProvider } from "./dashboard/DashboardBlockFiltersContext.jsx";
import S7ImportIntelligencePanel from "./import/S7ImportIntelligencePanel";
import { VendasFiltersProvider } from "../features/vendas/filters/VendasFiltersContext.jsx";

function DashboardContent() {
  const dashboardNextSectionRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  return (
    <div className="vendas-page dashboard-page">
      <S7Top10BlockSection
        className="dashboard-page__top10-block"
        sectionJumpDownTargetRef={dashboardNextSectionRef}
        sectionJumpDownAriaLabel="Ver próxima seção"
      />

      <div ref={dashboardNextSectionRef} className="dashboard-page__import-panel">
        <S7ImportIntelligencePanel pollSeconds={45} layout="dashboard" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <VendasFiltersProvider scope="dashboard">
      <DashboardBlockFiltersProvider>
        <DashboardContent />
      </DashboardBlockFiltersProvider>
    </VendasFiltersProvider>
  );
}
