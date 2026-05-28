import { computeTicketStats } from "./sellerTicketsUtils";

/**
 * @param {{ stats: ReturnType<typeof computeTicketStats> }} props
 */
export default function SellerTicketStats({ stats }) {
  const items = [
    { label: "Tickets abertos", value: stats.abertos },
    { label: "Em atendimento", value: stats.emAtendimento },
    { label: "Críticos", value: stats.criticos },
    { label: "Aguardando seller", value: stats.aguardandoSeller },
    { label: "Resolvidos hoje", value: stats.resolvidosHoje },
  ];

  return (
    <div className="dc-tickets-stats">
      {items.map((item) => (
        <article key={item.label} className="dc-card dc-tickets-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
