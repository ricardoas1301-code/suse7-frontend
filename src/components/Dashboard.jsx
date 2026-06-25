// ======================================================================
// DASHBOARD — SUSE7
// Central executiva do seller: KPIs de vendas + importação inteligente.
// Regras: sem lógica financeira aqui; modal de perfil / Supabase inalterados.
// ======================================================================

import "./Dashboard.css";
import "../styles/S7CoreKpis.css";
import "../styles/VendasPage.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import CompleteProfileModal from "./CompleteProfileModal";
import S7DailySummarySection from "./dashboard/S7DailySummarySection";
import { DashboardBlockFiltersProvider } from "./dashboard/DashboardBlockFiltersContext.jsx";
import S7ImportIntelligencePanel from "./import/S7ImportIntelligencePanel";
import S7Top10BlockSection from "./dashboard/S7Top10BlockSection";
import { VendasFiltersProvider } from "../features/vendas/filters/VendasFiltersContext.jsx";

function DashboardContent() {
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        setUserId(user.id);

        let { data: profile } = await supabase
          .from("profiles")
          .select("id, primeiro_login")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const { data: newProfile, error } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              primeiro_login: true,
              created_at: new Date(),
              last_login: new Date(),
            })
            .select()
            .single();

          if (error) throw error;
          profile = newProfile;
        }

        if (profile.primeiro_login === true) {
          setPerfilIncompleto(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Erro ao carregar Dashboard:", msg);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="vendas-page dashboard-page">
      {perfilIncompleto && (
        <CompleteProfileModal
          show={true}
          profileId={userId}
          onClose={() => setPerfilIncompleto(false)}
        />
      )}

      <S7DailySummarySection className="dashboard-page__daily-summary" />

      <S7Top10BlockSection className="dashboard-page__top10-block" />

      <div className="dashboard-page__import-panel">
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
