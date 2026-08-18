import { useMemo } from "react";
import { ShieldCheck, Library, CheckCircle2, Lock, Clock } from "lucide-react";
import { AdminGlobalProvider } from "./adminGlobalStore";
import { useAdminGlobalStore } from "./adminGlobalContext";
import { ADMIN_GLOBAL_SECOES } from "./adminGlobalModel";
import PlansPanel from "./PlansPanel";
import FeaturesPanel from "./FeaturesPanel";
import SecurityPanel from "./SecurityPanel";
import { AdminFeaturesProvider } from "./adminFeaturesStore";
import { AdminConfirmProvider } from "./security/AdminConfirmProvider";
import { PLAN_STATUS } from "./adminPlansModel";
import "./adminGlobal.css";

// Área administrativa global (Toolbox Sistema) — S1_2.
// Sub-navegação interna: Visão Geral, Planos, Features futuras, Segurança futura.

function VisaoGeral() {
  const { plans, carregando } = useAdminGlobalStore();

  const metricas = useMemo(() => {
    const base = { total: plans.length, ativos: 0, internos: 0, futuros: 0 };
    for (const p of plans) {
      if (p.status === PLAN_STATUS.ATIVO) base.ativos += 1;
      if (p.status === PLAN_STATUS.INTERNO || p.is_internal) base.internos += 1;
      if (p.status === PLAN_STATUS.FUTURO) base.futuros += 1;
    }
    return base;
  }, [plans]);

  const cards = [
    { id: "total", label: "Planos", valor: metricas.total, icon: Library, tone: "info" },
    { id: "ativos", label: "Ativos", valor: metricas.ativos, icon: CheckCircle2, tone: "sucesso" },
    { id: "internos", label: "Internos", valor: metricas.internos, icon: Lock, tone: "alerta" },
    { id: "futuros", label: "Futuros", valor: metricas.futuros, icon: Clock, tone: "neutro" },
  ];

  return (
    <div className="s7-admin-overview">
      <p className="s7-admin-overview__intro">
        Centro administrativo global do Suse7 (Toolbox Sistema). Operações internas do sistema —
        separadas das ferramentas por seller. Nesta fase, a gestão de planos está ativa; features e
        segurança chegam nas próximas missões.
      </p>
      <div className="s7-admin-overview__cards" role="group" aria-label="Indicadores administrativos">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className={`s7-admin-overview__card s7-admin-overview__card--${card.tone}`}>
              <span className="s7-admin-overview__icon" aria-hidden>
                <Icon size={16} />
              </span>
              <span className="s7-admin-overview__valor">{carregando ? "…" : card.valor}</span>
              <span className="s7-admin-overview__label">{card.label}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PlaceholderSecao({ label }) {
  return (
    <div className="s7-admin-global__placeholder">
      <h3>{label}</h3>
      <p>Área prevista na estrutura administrativa global. Será habilitada em uma próxima fase.</p>
    </div>
  );
}

function AdminGlobalConteudo() {
  const { abaAtiva, definirAba } = useAdminGlobalStore();
  const secaoAtiva = ADMIN_GLOBAL_SECOES.find((s) => s.id === abaAtiva) ?? ADMIN_GLOBAL_SECOES[0];

  return (
    <div className="s7-admin-global">
      <header className="s7-admin-global__header">
        <h2 className="s7-admin-global__title">
          <ShieldCheck size={18} aria-hidden /> Administração Global
        </h2>
        <p className="s7-admin-global__subtitle">
          Configurações globais do Suse7 — planos, features e segurança administrativa.
        </p>
      </header>

      <nav className="s7-admin-global__nav" role="tablist" aria-label="Seções administrativas globais">
        {ADMIN_GLOBAL_SECOES.map((secao) => {
          const Icon = secao.icon;
          const ativa = secao.id === abaAtiva;
          return (
            <button
              key={secao.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              disabled={!secao.enabled}
              className={`s7-admin-global__nav-btn ${ativa ? "s7-admin-global__nav-btn--active" : ""}`}
              onClick={() => secao.enabled && definirAba(secao.id)}
            >
              <Icon size={15} aria-hidden /> {secao.label}
              {!secao.enabled ? <span className="s7-admin-global__nav-soon">em breve</span> : null}
            </button>
          );
        })}
      </nav>

      {abaAtiva === "visao_geral" ? (
        <VisaoGeral />
      ) : abaAtiva === "planos" ? (
        <PlansPanel />
      ) : abaAtiva === "features" ? (
        <AdminConfirmProvider>
          <AdminFeaturesProvider>
            <FeaturesPanel />
          </AdminFeaturesProvider>
        </AdminConfirmProvider>
      ) : abaAtiva === "seguranca" ? (
        <SecurityPanel />
      ) : (
        <PlaceholderSecao label={secaoAtiva.label} />
      )}
    </div>
  );
}

export default function AdminGlobalPanel() {
  return (
    <AdminGlobalProvider>
      <AdminGlobalConteudo />
    </AdminGlobalProvider>
  );
}
