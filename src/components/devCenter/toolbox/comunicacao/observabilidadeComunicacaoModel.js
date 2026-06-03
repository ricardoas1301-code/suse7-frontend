// ======================================================
// OBSERVABILIDADE — MODEL (S5.10)
// Governança read-only — sem dashboard/gráficos/CRUD.
// ======================================================

export const OBSERVABILIDADE_MOTOR_STATUS = Object.freeze({
  fase: "S5.10",
  sistemaLogsParalelo: false,
  fonteUnica: true,
  uxSellerPreservada: true,
});

export const OBSERVABILIDADE_TABELAS = Object.freeze([
  { nome: "s7_notification_events", papel: "Eventos publicados" },
  { nome: "s7_notification_dispatches", papel: "Dispatches por canal" },
  { nome: "s7_notification_delivery_logs", papel: "Auditoria de entrega (oficial)" },
  { nome: "s7_notification_email_outbox", papel: "Fila e-mail" },
  { nome: "s7_notification_whatsapp_outbox", papel: "Fila WhatsApp" },
]);

export const OBSERVABILIDADE_COMPONENTES = Object.freeze([
  { id: "contract", label: "Contrato Global", log: "[S7_NOTIFICATION]" },
  { id: "dispatcher", label: "Dispatcher Central", log: "[S7_NOTIFICATION]" },
  { id: "actions", label: "Actions Engine", log: "[S7_ACTIONS]" },
  { id: "email", label: "Canal E-mail", log: "[S7_EMAIL]" },
  { id: "whatsapp", label: "Canal WhatsApp", log: "[S7_WHATSAPP]" },
  { id: "sininho", label: "Central Sininho", log: "[S7_IN_APP] / [S7_SININHO]" },
  { id: "popup", label: "Canal Pop-up", log: "[S7_POPUP]" },
  { id: "prefs", label: "Preferências", log: "[S7_COMMS_PREF]" },
]);

export const OBSERVABILIDADE_PIPELINE = Object.freeze([
  "Evento (s7_notification_events)",
  "Dispatcher (runCentralDispatcher)",
  "Preferências + Canais",
  "Template + Destinatários",
  "Dispatch + delivery_logs",
  "Outbox / Providers (e-mail, WhatsApp)",
]);

export const OBSERVABILIDADE_WORKERS = Object.freeze([
  "/api/internal/notifications/email/process",
  "/api/internal/notifications/whatsapp/process",
]);

export const OBSERVABILIDADE_FUTURO = Object.freeze([
  "Dashboard operacional Dev Center",
  "Timeline visual por event_id",
  "Alertas automáticos de saúde",
  "Métricas em tempo real",
]);
