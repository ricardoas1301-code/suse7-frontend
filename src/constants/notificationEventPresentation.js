// Camada declarativa de apresentação — Central de Notificações (UI seller).
// Não altera event keys, motor, templates ou catálogo do backend.

/** @type {Readonly<Record<string, { title: string, description: string }>>} */
export const NOTIFICATION_EVENT_PRESENTATION = Object.freeze({
  ORDER_CANCELLED: {
    title: "Venda cancelada",
    description: "Pedido cancelado.",
  },
  NEGATIVE_MARGIN: {
    title: "Margem negativa",
    description: "Venda com margem negativa.",
  },
  DAILY_SALES_SUMMARY: {
    title: "Resumo de vendas do dia",
    description: "Resumo automático de vendas.",
  },
  MANUAL_SALE_RAYX: {
    title: "Raio-X da venda",
    description: "Resumo detalhado da venda.",
  },
  MANUAL_SALES_REPORT: {
    title: "Relatório de vendas",
    description: "Relatório completo ou filtrado das vendas da operação.",
  },
  MARKETPLACE_DISCONNECTED: {
    title: "Conta desconectada",
    description: "Conta marketplace desconectada.",
  },
});

/**
 * Aplica overrides de título/descrição por type_key, preservando demais campos.
 * @param {Record<string, unknown> | null | undefined} type
 */
export function applyNotificationEventPresentation(type) {
  if (!type || typeof type !== "object") return type;
  const typeKey = String(type.type_key ?? "").trim();
  if (!typeKey) return type;

  const override = NOTIFICATION_EVENT_PRESENTATION[typeKey];
  if (!override) return type;

  return {
    ...type,
    label: override.title,
    description: override.description,
  };
}
