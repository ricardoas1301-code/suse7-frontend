const STATUS_MAP = {
  active: { label: "Ativa", tone: "success" },
  trialing: { label: "Período de teste", tone: "info" },
  pending: { label: "Aguardando pagamento", tone: "warning" },
  pending_payment: { label: "Aguardando pagamento", tone: "warning" },
  past_due: { label: "Pagamento em atraso", tone: "danger" },
  canceled: { label: "Cancelada", tone: "muted" },
  refunded: { label: "Reembolsada", tone: "muted" },
  internal_free: { label: "Plano gratuito", tone: "info" },
  none: { label: "Sem assinatura", tone: "muted" },
  incomplete: { label: "Incompleta", tone: "warning" },
  inactive: { label: "Inativa", tone: "muted" },
};

export default function BillingStatusBadge({ state, status }) {
  const key = String(state || status || "none").toLowerCase();
  const meta = STATUS_MAP[key] ?? { label: key || "Status", tone: "muted" };
  return <span className={`s7-billing-status-badge s7-billing-status-badge--${meta.tone}`}>{meta.label}</span>;
}
