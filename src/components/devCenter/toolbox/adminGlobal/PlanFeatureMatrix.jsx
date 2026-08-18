import { useState } from "react";
import { Link2 } from "lucide-react";

// Matriz Plano × Feature (S1_4.2). Features nas linhas, planos nas colunas.
// Cada célula liga/desliga o vínculo da feature no plano (config, não billing).

/**
 * @param {{
 *   plans: object[];
 *   features: object[];
 *   vinculoIndex: Map<string, Map<string, boolean>>;
 *   onToggle: (featureId: string, planId: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>;
 * }} props
 */
export default function PlanFeatureMatrix({ plans, features, vinculoIndex, onToggle }) {
  const [pendente, setPendente] = useState(null);

  if (!plans.length || !features.length) {
    return (
      <div className="s7-admin-matrix__empty">
        {plans.length === 0
          ? "Carregue os planos para configurar os vínculos."
          : "Nenhuma feature no catálogo ainda."}
      </div>
    );
  }

  const handleToggle = async (featureId, planId, atual) => {
    const chave = `${featureId}:${planId}`;
    setPendente(chave);
    await onToggle(featureId, planId, !atual);
    setPendente((p) => (p === chave ? null : p));
  };

  return (
    <div className="s7-admin-matrix__wrap">
      <table className="s7-admin-matrix">
        <thead>
          <tr>
            <th className="s7-admin-matrix__corner">
              <Link2 size={14} aria-hidden /> Feature × Plano
            </th>
            {plans.map((plan) => (
              <th key={plan.id} className="s7-admin-matrix__plan">
                {plan.name || plan.plan_key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => {
            const porPlano = vinculoIndex.get(feature.id) ?? new Map();
            return (
              <tr key={feature.id}>
                <th scope="row" className="s7-admin-matrix__feature">
                  {feature.label}
                  {feature.status !== "ativa" ? (
                    <span className="s7-admin-matrix__off">global off</span>
                  ) : null}
                </th>
                {plans.map((plan) => {
                  const ativo = porPlano.get(String(plan.id)) === true;
                  const chave = `${feature.id}:${plan.id}`;
                  return (
                    <td key={plan.id} className="s7-admin-matrix__cell">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={ativo}
                        aria-label={`${feature.label} no plano ${plan.name}`}
                        className={`s7-admin-matrix__toggle ${ativo ? "s7-admin-matrix__toggle--on" : ""}`}
                        disabled={pendente === chave}
                        onClick={() => handleToggle(feature.id, String(plan.id), ativo)}
                      >
                        <span className="s7-admin-matrix__knob" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
