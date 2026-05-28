/**
 * @param {{ summary: import('./financeOpsTypes').FinanceSummary }} props
 */
export default function FinanceOpsStats({ summary }) {
  const items = [
    { label: "MRR", value: summary.mrr_brl },
    { label: "ARR", value: summary.arr_brl },
    { label: "Receita mês atual", value: summary.receita_mes_atual_brl },
    { label: "Receita recebida", value: summary.receita_recebida_brl },
    { label: "Receita pendente", value: summary.receita_pendente_brl },
    { label: "Receita em grace", value: summary.receita_grace_brl },
    { label: "Receita em risco", value: summary.receita_risco_brl },
    { label: "Inadimplência", value: summary.inadimplencia },
    { label: "Churn risco", value: summary.churn_risco },
    { label: "Sellers pagantes", value: summary.sellers_pagantes },
    { label: "Trials ativos", value: summary.trials_ativos },
    { label: "Renovações 7d", value: summary.renovacoes_proximas },
    { label: "Ticket médio", value: summary.ticket_medio_brl },
    { label: "Assinaturas ativas", value: summary.assinaturas_ativas },
  ];

  return (
    <div className="dc-fin-stats">
      {items.map((item) => (
        <article key={item.label} className="dc-card dc-fin-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
