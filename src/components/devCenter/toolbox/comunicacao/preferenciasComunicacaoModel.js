// ======================================================
// PREFERÊNCIAS DE COMUNICAÇÃO — MODEL (S5.9)
// Somente leitura / governança — sem CRUD administrativo.
// ======================================================

/** Status do motor para exibição no Dev Center. */
export const PREFERENCIAS_MOTOR_STATUS = Object.freeze({
  fase: "S5.9",
  fonteUnica: true,
  motorParalelo: false,
  uxPreservada: true,
});

/** Tabelas oficiais (backend). */
export const PREFERENCIAS_TABELAS = Object.freeze([
  { id: "preferences", nome: "s7_notification_preferences", papel: "Preferências por canal" },
  { id: "recipients", nome: "s7_notification_recipients", papel: "Destinatários e-mail/WhatsApp" },
  { id: "scopes", nome: "s7_notification_recipient_scopes", papel: "Escopo por categoria/tipo" },
  { id: "rules", nome: "s7_notification_event_delivery_rules", papel: "Regras por evento" },
  { id: "types", nome: "s7_notification_event_types", papel: "Catálogo e obrigatoriedade" },
]);

/** Pipeline oficial Dispatcher → Preferências → Destinatários → Canais. */
export const PREFERENCIAS_PIPELINE = Object.freeze([
  { ordem: 1, camada: "Dispatcher", detalhe: "runCentralDispatcher" },
  { ordem: 2, camada: "Preferências", detalhe: "resolveNotificationPreferences" },
  { ordem: 3, camada: "Canais", detalhe: "resolveNotificationChannels + Registro S5.3" },
  { ordem: 4, camada: "Destinatários", detalhe: "resolveCentralRecipients" },
  { ordem: 5, camada: "Entrega", detalhe: "Providers / outbox por canal" },
]);

/** APIs seller preservadas. */
export const PREFERENCIAS_APIS = Object.freeze([
  "/api/notifications/categories",
  "/api/notifications/preferences",
  "/api/notifications/recipients",
  "/api/notifications/event-delivery-rules",
  "/api/notifications/inbox",
]);

/** Preparado para fases futuras (sem implementação). */
export const PREFERENCIAS_FUTURO = Object.freeze([
  "Horários permitidos e janela operacional",
  "Frequência (imediata, agrupada, diária, semanal)",
  "Silenciamento temporário",
  "Comunicação obrigatória expandida",
  "Administração Dev Center (CRUD)",
]);
