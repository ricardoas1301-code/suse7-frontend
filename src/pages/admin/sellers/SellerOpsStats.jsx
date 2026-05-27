/**
 * @param {{ stats: { total: number; active: number; noIntegration: number; critical: number; grace: number } }} props
 */
export default function SellerOpsStats({ stats }) {
  const items = [
    { label: "Total sellers", value: stats.total },
    { label: "Com integração", value: stats.active },
    { label: "Sem integração", value: stats.noIntegration },
    { label: "Health crítico", value: stats.critical },
    { label: "Grace / inadimplência", value: stats.grace },
  ];

  return (
    <div className="dc-sellers-stats">
      {items.map((item) => (
        <article key={item.label} className="dc-card dc-sellers-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
