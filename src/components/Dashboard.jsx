// ======================================================================
// DASHBOARD — SUSE7
// Layout e placeholders de métricas (dados reais virão em etapas futuras).
// Regras: sem lógica financeira aqui; modal de perfil / Supabase inalterados.
// ======================================================================

import "./Dashboard.css";
import "./Anuncios.css";
import "../styles/S7CoreKpis.css";
import "../styles/VendasPage.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import CompleteProfileModal from "./CompleteProfileModal";
import S7ImportIntelligencePanel from "./import/S7ImportIntelligencePanel";

// ---------------------------------------------------------------------
// Blocos placeholder (rótulos alinhados às futuras métricas do produto)
// ---------------------------------------------------------------------
// Ordem de cores alinhada à página Vendas: azul → laranja → verde → vermelho (grade 2×2).
const PLACEHOLDER_SMALL = [
  { key: "margem", title: "Margem", accent: "green" },
  { key: "faturamento", title: "Faturamento", accent: "orange" },
  { key: "alertas", title: "Alertas", accent: "red" },
  { key: "vendas", title: "Vendas", accent: "blue" },
];

export default function Dashboard() {
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [userId, setUserId] = useState(null);

  // -------------------------------------------------------------------
  // EFFECT — auth + profile (primeiro login / modal completar cadastro)
  // -------------------------------------------------------------------
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
      {/* ----------------------------------------------------------------
          Modal de perfil (fluxo existente — primeiro login social etc.)
         ---------------------------------------------------------------- */}
      {perfilIncompleto && (
        <CompleteProfileModal
          show={true}
          profileId={userId}
          onClose={() => setPerfilIncompleto(false)}
        />
      )}

      <S7ImportIntelligencePanel pollSeconds={45} layout="dashboard" />

      {/* ----------------------------------------------------------------
          Faixa superior: 2 cards grandes lado a lado + grade 2×2 (dir.)
          Cores: grandes = laranja + azul (igual referência Vendas).
         ---------------------------------------------------------------- */}
      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Principais indicadores">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Conta</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Catálogo</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>
        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          {PLACEHOLDER_SMALL.map((item) => (
            <article key={item.key} className={`anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--${item.accent}`}>
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">{item.title}</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
