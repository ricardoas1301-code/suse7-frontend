import { RefreshCw, AlertTriangle, CreditCard } from "lucide-react";
import { S7Button } from "../../../ui";
import PlanEditCard from "./PlanEditCard";
import { useAdminGlobalStore } from "./adminGlobalContext";

// Gestão Administrativa de Planos (S1_3). Lista + edição segura via backend.

export default function PlansPanel() {
  const { plans, carregando, erro, fonte, salvandoId, recarregar, salvarPlano } = useAdminGlobalStore();

  return (
    <div className="s7-admin-plans">
      <div className="s7-admin-plans__head">
        <div>
          <h3 className="s7-admin-plans__title">
            <CreditCard size={18} aria-hidden /> Gestão de Planos
            <span className={`s7-admin-plans__fonte s7-admin-plans__fonte--${fonte}`}>
              {carregando ? "carregando…" : fonte === "backend" ? "backend" : "indisponível"}
            </span>
          </h3>
          <p className="s7-admin-plans__subtitle">
            Catálogo de planos do Suse7. A diferenciação principal é o volume mensal de vendas
            permitido no ecossistema do seller. Edição persistida no backend (valores com precisão
            decimal).
          </p>
        </div>
        <S7Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={recarregar}
          disabled={carregando}
        >
          Recarregar
        </S7Button>
      </div>

      {erro ? (
        <div className="s7-admin-plans__erro" role="alert">
          <AlertTriangle size={16} aria-hidden />
          <span>{erro}</span>
          <S7Button type="button" variant="secondary" size="sm" onClick={recarregar}>
            Tentar novamente
          </S7Button>
        </div>
      ) : null}

      {carregando && plans.length === 0 ? (
        <div className="s7-admin-plans__loading">Carregando planos…</div>
      ) : !carregando && plans.length === 0 && !erro ? (
        <div className="s7-admin-plans__empty">Nenhum plano encontrado no catálogo.</div>
      ) : (
        <div className="s7-admin-plans__grid">
          {plans.map((plan) => (
            <PlanEditCard
              key={plan.id}
              plan={plan}
              salvando={salvandoId === plan.id}
              onSave={salvarPlano}
            />
          ))}
        </div>
      )}
    </div>
  );
}
