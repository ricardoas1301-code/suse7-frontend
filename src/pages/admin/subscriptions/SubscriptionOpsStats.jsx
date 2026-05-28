/**
 * @param {{ summary: import('./subscriptionOpsTypes').SubscriptionSummary }} props
 */
export default function SubscriptionOpsStats({ summary }) {
  const items = [
    { label: "Assinaturas ativas", value: summary.active_subscriptions },
    { label: "Grace period", value: summary.grace_period },
    { label: "Past due", value: summary.past_due },
    { label: "Trials ativos", value: summary.trials_active },
    { label: "MRR", value: summary.mrr_brl },
    { label: "ARR estimado", value: summary.arr_brl },
    { label: "Risco churn", value: summary.churn_risk },
    { label: "Renovações 7d", value: summary.renewals_upcoming },
  ];

  return (
    <div className="dc-sub-stats">
      {items.map((item) => (
        <article key={item.label} className="dc-card dc-sub-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
