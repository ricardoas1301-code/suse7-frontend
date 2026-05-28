/**
 * @param {{ observability: Record<string, unknown> | null | undefined }} props
 */
export default function FinanceOpsObservability({ observability }) {
  if (!observability) return null;

  const topPlan = observability.top_plan_by_mrr ?? {};

  const items = [
    { label: "Pagamentos falhando (30d)", value: observability.failed_payments_30d ?? 0 },
    { label: "Sellers críticos", value: observability.critical_sellers ?? 0 },
    { label: "Inadimplentes", value: observability.sellers_inadimplentes ?? 0 },
    { label: "Taxa aprovação (30d)", value: observability.payment_approval_rate_30d ?? "—" },
    { label: "Tendência MRR", value: observability.mrr_trend_label ?? "—" },
    {
      label: "Concentração receita",
      value: topPlan.plan ? `${topPlan.plan} (${topPlan.share_percent ?? 0}%)` : "—",
    },
  ];

  return (
    <section className="dc-fin-observability">
      <h3>Observabilidade financeira</h3>
      <div className="dc-fin-observability__grid">
        {items.map((item) => (
          <article key={item.label} className="dc-card dc-fin-observability__card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
