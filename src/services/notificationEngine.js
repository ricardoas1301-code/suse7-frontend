// ======================================================================
// SUSE7 — Notification Engine (frontend mock, backend-ready)
// Fluxo: Evento -> Regra -> Notificação -> Canal
// Foco inicial: canal in-app.
// ======================================================================

import {
  NOTIFICATION_CATALOG_LOOKUP,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
} from "../constants/notificationPreferences";
import {
  createNotification,
  sendNotificationEmail,
  sendNotificationWhatsapp,
} from "./notificationsApi";

const DEFAULT_CHANNEL_FLAGS = {
  [NOTIFICATION_CHANNELS.app]: true,
  [NOTIFICATION_CHANNELS.email]: true,
  [NOTIFICATION_CHANNELS.whatsapp]: true,
};

const channelDispatchers = {
  [NOTIFICATION_CHANNELS.app]: dispatchInAppNotification,
  [NOTIFICATION_CHANNELS.email]: dispatchMockChannel,
  [NOTIFICATION_CHANNELS.whatsapp]: dispatchMockChannel,
};

const mockDeliveredNotifications = [];
const processedEventSnapshots = [];
const deliveredDedupeKeys = new Map();

const NOTIFICATION_RULES = [
  {
    id: "default-rule-by-notification-type",
    match: (event) => Boolean(event?.notification_type ?? event?.type),
    build: (event) => {
      const notificationType = String(event.notification_type ?? event.type ?? "").trim().toUpperCase();
      const meta = NOTIFICATION_CATALOG_LOOKUP[notificationType] ?? {};
      return {
        id: buildEventId(event),
        notification_type: notificationType,
        title: event.title ?? meta.label ?? "Alerta do sistema",
        message: event.message ?? event.description ?? meta.description ?? "Novo evento de notificação.",
        priority: event.priority ?? meta.priority ?? "info",
        category: event.category ?? meta.category ?? "general",
        user_id: event.user_id ?? null,
        marketplace_id: event.marketplace_id ?? null,
        entity_type: event.entity_type ?? null,
        entity_id: event.entity_id ?? null,
        data: event.data ?? {},
        created_at: event.created_at ?? new Date().toISOString(),
      };
    },
  },
];

/**
 * Dispara evento de notificação.
 * @param {object} event
 * @param {object} [ctx]
 */
export function triggerNotificationEvent(event, ctx = {}) {
  return processNotificationRules(event, ctx);
}

/**
 * Processa regras para transformar evento em notificação.
 * @param {object} event
 * @param {object} [ctx]
 */
export async function processNotificationRules(event, ctx = {}) {
  if (!event || typeof event !== "object") return [];

  const matches = NOTIFICATION_RULES.filter((rule) => {
    try {
      return rule.match(event);
    } catch {
      return false;
    }
  });

  if (matches.length === 0) return [];

  const notifications = matches
    .map((rule) => {
      try {
        return rule.build(event);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const delivered = [];
  for (const notification of notifications) {
    const persisted = await persistNotification(notification, event);
    const resolvedNotification = persisted.notification ?? notification;
    const skipByBackendDedupe = persisted.ok && persisted.deduped === true;
    const shouldSkipByPersistenceFailure = persisted.ok === false && import.meta.env.PROD;
    const dedupeInfo = shouldSkipByDedupe(notification, event);
    const channelResult =
      skipByBackendDedupe || shouldSkipByPersistenceFailure
        ? {
            deliveredChannels: [],
            ignoredChannels: Object.values(NOTIFICATION_CHANNELS).map((channel) => ({
              channel,
              reason: skipByBackendDedupe ? "dedupe_backend" : "notification_persist_failed",
            })),
          }
        : dedupeInfo.skip
      ? {
          deliveredChannels: [],
          ignoredChannels: Object.values(NOTIFICATION_CHANNELS).map((channel) => ({
            channel,
            reason: dedupeInfo.reason,
          })),
        }
      : await deliverNotificationByChannels(resolvedNotification, event, {
          ...ctx,
          persistedNotification: resolvedNotification,
          backendCreateStatus: persisted,
        });

    processedEventSnapshots.unshift({
      event,
      notification: resolvedNotification,
      deliveredChannels: channelResult.deliveredChannels,
      ignoredChannels: channelResult.ignoredChannels ?? [],
      dedupe: dedupeInfo,
      backend: persisted,
      created_at: new Date().toISOString(),
    });
    if (processedEventSnapshots.length > 120) processedEventSnapshots.length = 120;

    if (channelResult.deliveredChannels.length > 0) {
      delivered.push({ notification: resolvedNotification, ...channelResult, backend: persisted });
    }
  }
  return delivered;
}

/**
 * Permite injetar dispatcher por canal (ex.: ligar no NotificationContext).
 * @param {"app"|"email"|"whatsapp"} channel
 * @param {(notification: object, context: object) => Promise<boolean>|boolean} dispatcher
 */
export function setNotificationChannelDispatcher(channel, dispatcher) {
  if (!channel || typeof dispatcher !== "function") return;
  channelDispatchers[channel] = dispatcher;
}

/**
 * Snapshot do mock de entrega (útil em testes locais).
 */
export function getDeliveredNotificationsSnapshot() {
  return [...mockDeliveredNotifications];
}

export function getProcessedNotificationEventsSnapshot() {
  return [...processedEventSnapshots];
}

/**
 * Limpa mock de entregas.
 */
export function clearDeliveredNotificationsSnapshot() {
  mockDeliveredNotifications.length = 0;
  processedEventSnapshots.length = 0;
  deliveredDedupeKeys.clear();
}

/**
 * Simulador temporário para DEV (in-app first).
 * @param {string} notificationType
 * @param {object} [ctx]
 */
export function simulateNotification(notificationType, ctx = {}) {
  const now = new Date().toISOString();
  const normalizedType = String(notificationType ?? "").trim().toUpperCase();
  const eventFactory = SIMULATED_EVENT_FACTORIES[normalizedType];
  if (!eventFactory) return [];
  const event = eventFactory(now);
  return triggerNotificationEvent(event, ctx);
}

function buildEventId(event) {
  if (event?.id) return event.id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `notif_evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function deliverNotificationByChannels(notification, event, ctx) {
  const preferences = resolveChannelPreferences(notification, event, ctx);
  const deliveredChannels = [];
  const ignoredChannels = [];

  for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
    if (!preferences[channel]) {
      ignoredChannels.push({ channel, reason: "channel_disabled_by_preference" });
      continue;
    }
    const dispatcher = channelDispatchers[channel];
    if (typeof dispatcher !== "function") {
      ignoredChannels.push({ channel, reason: "dispatcher_not_registered" });
      continue;
    }
    const delivered = await dispatcher(notification, { channel, event, ...ctx });
    if (delivered) deliveredChannels.push(channel);
    else ignoredChannels.push({ channel, reason: "dispatcher_returned_false" });
  }

  return { deliveredChannels, ignoredChannels };
}

function resolveChannelPreferences(notification, event, ctx) {
  const prefsByType = ctx?.preferencesByType ?? {};
  const key = String(notification.notification_type ?? event?.notification_type ?? "").trim();
  const pref = prefsByType[key] ?? prefsByType[`notify.${key}`] ?? {};
  const channels = pref.channels ?? {};

  return {
    app: toBooleanWithDefault(
      pref.channel_app_enabled ?? channels?.app?.enabled,
      DEFAULT_CHANNEL_FLAGS.app
    ),
    email: toBooleanWithDefault(
      pref.channel_email_enabled ?? channels?.email?.enabled,
      DEFAULT_CHANNEL_FLAGS.email
    ),
    whatsapp: toBooleanWithDefault(
      pref.channel_whatsapp_enabled ?? channels?.whatsapp?.enabled,
      DEFAULT_CHANNEL_FLAGS.whatsapp
    ),
  };
}

function toBooleanWithDefault(value, defaultValue) {
  if (typeof value === "boolean") return value;
  return defaultValue;
}

function shouldSkipByDedupe(notification, event) {
  const dedupeKey = String(event?.dedupeKey ?? notification?.dedupeKey ?? "").trim();
  if (!dedupeKey) return { skip: false, reason: null };
  const dayBucket = new Date().toISOString().slice(0, 10);
  const key = `${dedupeKey}|${dayBucket}`;
  if (deliveredDedupeKeys.has(key)) {
    return { skip: true, reason: "dedupe_already_delivered_today", key };
  }
  deliveredDedupeKeys.set(key, Date.now());
  return { skip: false, reason: null, key };
}

async function dispatchInAppNotification(notification, context = {}) {
  const bridge = context?.inAppBridge;
  if (typeof bridge === "function") {
    bridge({
      event_type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      severity: notification.priority,
      entity_type: notification.entity_type,
      entity_id: notification.entity_id,
      dedupeKey: `${notification.notification_type}|${notification.entity_id ?? "global"}|${notification.created_at?.slice(0, 10) ?? "today"}`,
    });
    return true;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("suse7:notification-engine:in-app", {
        detail: { notification, context },
      })
    );
    return true;
  }

  return false;
}

async function dispatchMockChannel(notification, context = {}) {
  if (context?.channel === "email" && notification?.id) {
    const emailResult = await sendNotificationEmail(notification.id);
    if (!emailResult.ok) return false;
  }
  if (context?.channel === "whatsapp" && notification?.id) {
    const waResult = await sendNotificationWhatsapp(notification.id);
    if (!waResult.ok) return false;
  }
  mockDeliveredNotifications.push({
    notification,
    channel: context?.channel ?? "unknown",
    delivered_at: new Date().toISOString(),
  });
  return true;
}

async function persistNotification(notification, event) {
  const payload = {
    notification_type: notification.notification_type,
    category: notification.category,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    entity_type: notification.entity_type,
    entity_id: notification.entity_id,
    marketplace_id: notification.marketplace_id,
    dedupe_key: event?.dedupeKey ?? notification?.dedupeKey ?? null,
    metadata: {
      source: event?.data?.source ?? "notification-engine",
      event_data: event?.data ?? {},
    },
  };

  const result = await createNotification(payload);
  if (!result.ok) {
    if (import.meta.env.DEV) {
      console.error("[notificationEngine] persist failed; fallback local", result.error);
    }
    return { ok: false, error: result.error, deduped: false, notification };
  }
  return {
    ok: true,
    deduped: Boolean(result.deduped),
    notification: result.notification ?? notification,
  };
}

const SIMULATED_EVENT_FACTORIES = {
  [NOTIFICATION_TYPES.NEGATIVE_SALE]: (createdAt) => ({
    id: `sim_negative_sale_${Date.now()}`,
    notification_type: NOTIFICATION_TYPES.NEGATIVE_SALE,
    title: "Venda com prejuízo detectada",
    message: "Venda simulada com lucro líquido abaixo de R$ 0,00.",
    priority: "critical",
    category: "sales_profit",
    entity_type: "sale",
    entity_id: "sim-sale-001",
    marketplace_id: "MLB",
    created_at: createdAt,
    data: { source: "simulation" },
  }),
  [NOTIFICATION_TYPES.LOW_MARGIN_SALE]: (createdAt) => ({
    id: `sim_low_margin_sale_${Date.now()}`,
    notification_type: NOTIFICATION_TYPES.LOW_MARGIN_SALE,
    title: "Venda com margem baixa detectada",
    message: "Venda simulada com margem líquida abaixo de 5%.",
    priority: "important",
    category: "sales_profit",
    entity_type: "sale",
    entity_id: "sim-sale-002",
    marketplace_id: "MLB",
    created_at: createdAt,
    data: { source: "simulation" },
  }),
  [NOTIFICATION_TYPES.OUT_OF_STOCK]: (createdAt) => ({
    id: `sim_out_of_stock_${Date.now()}`,
    notification_type: NOTIFICATION_TYPES.OUT_OF_STOCK,
    title: "Estoque zerado",
    message: "Produto simulado está com estoque zerado.",
    priority: "critical",
    category: "products_stock",
    entity_type: "product",
    entity_id: "sim-product-001",
    marketplace_id: "MLB",
    created_at: createdAt,
    data: { source: "simulation" },
  }),
  [NOTIFICATION_TYPES.PAUSED_PRODUCT_WITH_RECENT_SALES]: (createdAt) => ({
    id: `sim_paused_recent_sales_${Date.now()}`,
    notification_type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITH_RECENT_SALES,
    title: "Produto pausado com vendas recentes",
    message: "Produto simulado foi pausado apesar de ter vendas recentes.",
    priority: "critical",
    category: "products_stock",
    entity_type: "listing",
    entity_id: "sim-listing-001",
    marketplace_id: "MLB",
    created_at: createdAt,
    data: { source: "simulation" },
  }),
};

