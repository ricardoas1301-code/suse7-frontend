// ======================================================================
// SUSE7 — MODELO CONCEITUAL DE NOTIFICAÇÃO
// Estrutura reutilizável para múltiplos módulos (Estoque, Precificação,
// Anúncios, Saúde da Conta). Preparada para backend event-based.
// ======================================================================

/**
 * Estrutura de evento de notificação (frontend + backend-ready)
 * @typedef {Object} NotificationEvent
 * @property {string} id
 * @property {string|null} user_id
 * @property {NotificationEventType} event_type
 * @property {string} entity_type - Ex: "product_variant", "product", "listing"
 * @property {string|null} entity_id
 * @property {string} title
 * @property {string} message
 * @property {NotificationSeverity} severity
 * @property {string} created_at - ISO string
 * @property {boolean} read
 * @property {string} [dedupeKey] - Chave para deduplicação (event_type|entity_id|YYYY-MM-DD)
 */

/**
 * Tipos de evento (extensível)
 * @type {Record<string, string>}
 */
export const NOTIFICATION_EVENT_TYPES = {
  STOCK_LOW: "STOCK_LOW",
  STOCK_BELOW_MIN: "STOCK_BELOW_MIN",
  STOCK_REAL_ZERO: "STOCK_REAL_ZERO",
  PRICE_BELOW_HEALTHY_MARGIN: "PRICE_BELOW_HEALTHY_MARGIN",
  TAX_CHANGE: "TAX_CHANGE",
  // Futuros: LISTING_PAUSED, ACCOUNT_HEALTH, etc.
};

/** @type {"info" | "warning" | "critical"} */
export const NOTIFICATION_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

/**
 * Cria um evento de notificação (factory)
 * @param {Partial<NotificationEvent> & { event_type: string; title: string; message: string; severity: string }} options
 * @returns {NotificationEvent}
 */
export function createNotificationEvent(options) {
  const {
    id = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user_id = null,
    event_type = "GENERIC",
    entity_type = "product_variant",
    entity_id = null,
    title,
    message,
    severity: severityIn,
    created_at = new Date().toISOString(),
    read = false,
    dedupeKey = null,
    /** @deprecated Preferir `severity`; usado se `severity` não for enviado */
    type,
  } = options;

  const resolvedSeverity =
    severityIn != null
      ? severityIn
      : type === "error" || type === "critical"
        ? NOTIFICATION_SEVERITY.CRITICAL
        : NOTIFICATION_SEVERITY.INFO;

  return {
    id,
    user_id,
    event_type,
    entity_type,
    entity_id,
    title,
    message,
    severity: resolvedSeverity,
    created_at,
    read,
    dedupeKey,
  };
}

// ======================================================================
// NOTIFICATION_PREFERENCES (Fase 2 — não implementar persistência)
// Estrutura esperada para futuro backend:
// ======================================================================
/*
  notification_preferences: {
    user_id: string,
    in_app_enabled: boolean,
    email_enabled: boolean,
    email: string | null,
    whatsapp_enabled: boolean,
    whatsapp_number: string | null,
    // Outros canais futuros
  }
  Uso: antes de disparar notificação, verificar se canal está habilitado.
  Ex: if (prefs.in_app_enabled) addNotification(...)
*/
