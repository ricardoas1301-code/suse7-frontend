import S7StatusBadge from "../../components/ui/S7StatusBadge.jsx";

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

export function resolveBillingStatusLabel(state, status) {
  const key = String(state || status || "none").toLowerCase();
  const meta = STATUS_MAP[key] ?? { label: key || "Status", tone: "muted" };
  return meta.label;
}

export default function BillingStatusBadge({ state, status }) {
  const key = String(state || status || "none").toLowerCase();
  const meta = STATUS_MAP[key] ?? { label: key || "Status", tone: "muted" };
  return <S7StatusBadge label={meta.label} tone={meta.tone} />;
}
