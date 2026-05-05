// ======================================================================
// DASHBOARD — SUSE7
// Layout e placeholders de métricas (dados reais virão em etapas futuras).
// Regras: sem lógica financeira aqui; modal de perfil / Supabase inalterados.
// ======================================================================

import "./Dashboard.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import CompleteProfileModal from "./CompleteProfileModal";

// ---------------------------------------------------------------------
// Blocos placeholder (rótulos alinhados às futuras métricas do produto)
// ---------------------------------------------------------------------
// Ordem de cores alinhada à página Vendas: azul → laranja → verde → vermelho (grade 2×2).
const PLACEHOLDER_SMALL = [
  { key: "vendas", title: "Vendas", hint: "Volume e evolução", accent: "blue" },
  { key: "faturamento", title: "Faturamento", hint: "Receita consolidada", accent: "orange" },
  { key: "margem", title: "Margem", hint: "Rentabilidade estimada", accent: "green" },
  { key: "alertas", title: "Alertas", hint: "Riscos e oportunidades", accent: "red" },
];

const PLACEHOLDER_COMPACT = [
  { key: "resumo", title: "Resumo operacional", hint: "Visão rápida da semana" },
  { key: "metas", title: "Metas", hint: "Acompanhamento de objetivos" },
  { key: "equipe", title: "Equipe", hint: "Atividade no workspace" },
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
    <div className="dashboard-wrapper">
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

      {/* ----------------------------------------------------------------
          Faixa superior: 2 cards grandes lado a lado + grade 2×2 (dir.)
          Cores: grandes = laranja + azul (igual referência Vendas).
         ---------------------------------------------------------------- */}
      <section className="s7-dash-top" aria-label="Principais indicadores">
        <div className="s7-dash-top-left">
          <article className="s7-dash-card s7-dash-card--large s7-dash-card--accent-orange">
            <div className="s7-dash-card__cap">Conta</div>
            <div className="s7-dash-card__body">
              <h2 className="s7-dash-card__title">Saúde da conta</h2>
              <p className="s7-dash-card__hint">Placeholder — score e checklist de integração.</p>
              <div className="s7-dash-card__placeholder-value" aria-hidden="true">
                —
              </div>
            </div>
          </article>
          <article className="s7-dash-card s7-dash-card--large s7-dash-card--accent-blue">
            <div className="s7-dash-card__cap">Catálogo</div>
            <div className="s7-dash-card__body">
              <h2 className="s7-dash-card__title">Saúde dos anúncios</h2>
              <p className="s7-dash-card__hint">Placeholder — qualidade, preço e visibilidade.</p>
              <div className="s7-dash-card__placeholder-value" aria-hidden="true">
                —
              </div>
            </div>
          </article>
        </div>

        <div className="s7-dash-top-right" role="list">
          {PLACEHOLDER_SMALL.map((item) => (
            <article
              key={item.key}
              className={`s7-dash-card s7-dash-card--small s7-dash-card--accent-${item.accent}`}
              role="listitem"
            >
              <div className="s7-dash-card__cap s7-dash-card__cap--sm">{item.title}</div>
              <div className="s7-dash-card__body s7-dash-card__body--sm">
                <p className="s7-dash-card__hint">{item.hint}</p>
                <div className="s7-dash-card__placeholder-pill" aria-hidden="true">
                  Em breve
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------
          Faixa média: 2 cards grandes (lado a lado em desktop)
         ---------------------------------------------------------------- */}
      <section className="s7-dash-mid" aria-label="Acompanhamento contínuo">
        <article className="s7-dash-card s7-dash-card--large">
          <span className="s7-dash-card__eyebrow">Central</span>
          <h2 className="s7-dash-card__title">Notificações</h2>
          <p className="s7-dash-card__hint">Placeholder — fila de avisos e pendências.</p>
          <div className="s7-dash-card__placeholder-value" aria-hidden="true">
            —
          </div>
        </article>
        <article className="s7-dash-card s7-dash-card--large">
          <span className="s7-dash-card__eyebrow">Canais</span>
          <h2 className="s7-dash-card__title">Performance por marketplace</h2>
          <p className="s7-dash-card__hint">Placeholder — comparativo ML e futuros canais.</p>
          <div className="s7-dash-card__placeholder-value" aria-hidden="true">
            —
          </div>
        </article>
      </section>

      {/* ----------------------------------------------------------------
          Faixa inferior: cards compactos complementares
         ---------------------------------------------------------------- */}
      <section className="s7-dash-bottom" aria-label="Resumos complementares">
        {PLACEHOLDER_COMPACT.map((item) => (
          <article key={item.key} className="s7-dash-card s7-dash-card--compact">
            <h2 className="s7-dash-card__title s7-dash-card__title--sm">{item.title}</h2>
            <p className="s7-dash-card__hint">{item.hint}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
