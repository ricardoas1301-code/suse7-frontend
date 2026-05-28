// Badge discreto para status agregado do evento (Fase 3).

const LABELS = {
  pending: "Pendente",
  processing: "Processando",
  delivered: "Entregue",
  sent: "Enviado",
  failed: "Falhou",
  partial: "Parcial",
  cancelled: "Cancelado",
};

export default function NotificationStatusBadge({ status }) {
  const s = status != null ? String(status).toLowerCase() : "";
  const label = LABELS[s] ?? (s || "—");
  return <span className={`s7-notif-status-badge s7-notif-status-badge--${s || "unknown"}`}>{label}</span>;
}
