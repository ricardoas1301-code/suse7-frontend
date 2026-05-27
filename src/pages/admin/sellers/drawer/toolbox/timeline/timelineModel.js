/** @typedef {"normal" | "warning" | "critical"} TimelineEventSeverity */

/** @typedef {"sale" | "listing" | "product" | "customer" | "marketplace_account"} TimelineEntityType */

/**
 * @typedef {{
 *   eventId: string;
 *   eventType: string;
 *   eventLabel: string;
 *   entityType: TimelineEntityType;
 *   entityId: string;
 *   adminName: string;
 *   adminEmail: string;
 *   createdAt: string;
 *   reason: string;
 *   severity: TimelineEventSeverity;
 * }} TimelineEventViewModel
 */

/**
 * @typedef {{
 *   totalEvents: number;
 *   adminsInvolved: number;
 *   lastEventLabel: string;
 *   lastEventAt: string | null;
 * }} TimelineSummaryViewModel
 */

/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} TimelinePanelState */

/**
 * @param {TimelineEventSeverity | string | null | undefined} severity
 */
export function resolveTimelineSeverityLabel(severity) {
  switch (severity) {
    case "warning":
      return "Atenção";
    case "critical":
      return "Crítico";
    case "normal":
    default:
      return "Normal";
  }
}

/**
 * @param {TimelineEventSeverity | string | null | undefined} severity
 * @returns {"normal" | "warning" | "critical"}
 */
export function resolveTimelineSeverityVariant(severity) {
  switch (severity) {
    case "warning":
      return "warning";
    case "critical":
      return "critical";
    default:
      return "normal";
  }
}

/**
 * @param {TimelineEntityType | string | null | undefined} entityType
 */
export function resolveTimelineEntityLabel(entityType) {
  switch (entityType) {
    case "sale":
      return "Venda";
    case "listing":
      return "Anúncio";
    case "product":
      return "Produto";
    case "customer":
      return "Cliente";
    case "marketplace_account":
      return "Conta marketplace";
    default:
      return "Entidade";
  }
}

/**
 * @param {string | null | undefined} iso
 */
export function formatTimelineDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {string | null | undefined} iso
 * @param {number} [nowMs]
 */
export function formatRelativeTime(iso, nowMs = Date.now()) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = nowMs - date.getTime();
  if (diffMs < 0) return formatTimelineDate(iso);

  if (diffMs < 60_000) return "Agora";

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 min atrás" : `${diffMinutes} min atrás`;
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) {
    return diffHours === 1 ? "1 h atrás" : `${diffHours} h atrás`;
  }

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfYesterday && date < startOfToday) {
    const timeLabel = date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Ontem às ${timeLabel}`;
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return diffDays === 1 ? "1 dia atrás" : `${diffDays} dias atrás`;
  }

  return formatTimelineDate(iso);
}

/**
 * @param {TimelineEventSeverity | string} severity
 */
export function timelineSeverityClassName(severity) {
  const variant = resolveTimelineSeverityVariant(severity);
  return `timeline-event-card__severity timeline-event-card__severity--${variant}`;
}

/**
 * @param {TimelineEventViewModel[]} events
 * @returns {TimelineEventViewModel[]}
 */
export function sortTimelineEventsDesc(events) {
  return [...events].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

/**
 * @param {TimelineEventViewModel[]} events
 * @returns {TimelineSummaryViewModel}
 */
export function buildTimelineSummary(events) {
  const sorted = sortTimelineEventsDesc(events);
  const adminNames = new Set(sorted.map((event) => event.adminName).filter(Boolean));
  const latest = sorted[0] ?? null;

  return {
    totalEvents: sorted.length,
    adminsInvolved: adminNames.size,
    lastEventLabel: latest?.eventLabel ?? "—",
    lastEventAt: latest?.createdAt ?? null,
  };
}

/**
 * @param {number} [nowMs]
 * @returns {TimelineEventViewModel[]}
 */
export function buildTimelineMockEvents(nowMs = Date.now()) {
  const minutesAgo = (minutes) => new Date(nowMs - minutes * 60_000).toISOString();
  const hoursAgo = (hours) => new Date(nowMs - hours * 60 * 60 * 1000).toISOString();
  const daysAgoAt = (days, hour, minute) => {
    const date = new Date(nowMs);
    date.setDate(date.getDate() - days);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  return sortTimelineEventsDesc([
    {
      eventId: "evt_001",
      eventType: "reimport_sale",
      eventLabel: "Reimportação de venda",
      entityType: "sale",
      entityId: "2000016503467162",
      adminName: "Rico",
      adminEmail: "ricardo@suse7.com.br",
      createdAt: minutesAgo(0.5),
      reason: "Reimportação manual para conferência operacional.",
      severity: "normal",
    },
    {
      eventId: "evt_002",
      eventType: "recalculate_sale_financial",
      eventLabel: "Recálculo financeiro da venda",
      entityType: "sale",
      entityId: "2000016503467162",
      adminName: "João",
      adminEmail: "joao@suse7.com.br",
      createdAt: minutesAgo(5),
      reason: "Ajuste operacional após divergência de margem reportada pelo seller.",
      severity: "normal",
    },
    {
      eventId: "evt_003",
      eventType: "reprocess_customer_360",
      eventLabel: "Reprocessamento Cliente360",
      entityType: "customer",
      entityId: "cust_001",
      adminName: "Rico",
      adminEmail: "ricardo@suse7.com.br",
      createdAt: minutesAgo(20),
      reason: "Rebuild Cliente360: cliente incompleto após sync de vendas.",
      severity: "warning",
    },
    {
      eventId: "evt_004",
      eventType: "reimport_listing",
      eventLabel: "Reimportação de anúncio",
      entityType: "listing",
      entityId: "MLB6086959274",
      adminName: "Marina",
      adminEmail: "marina@suse7.com.br",
      createdAt: hoursAgo(2),
      reason: "Reimportação manual para validar vínculo SKU ↔ anúncio.",
      severity: "normal",
    },
    {
      eventId: "evt_005",
      eventType: "validate_marketplace_token",
      eventLabel: "Validação de token marketplace",
      entityType: "marketplace_account",
      entityId: "acc_ml_001",
      adminName: "João",
      adminEmail: "joao@suse7.com.br",
      createdAt: daysAgoAt(1, 14, 22),
      reason: "Token suspeito: conferência operacional pós-login do seller.",
      severity: "warning",
    },
    {
      eventId: "evt_006",
      eventType: "force_marketplace_sync",
      eventLabel: "Sync forçado de conta marketplace",
      entityType: "marketplace_account",
      entityId: "acc_ml_001",
      adminName: "Rico",
      adminEmail: "ricardo@suse7.com.br",
      createdAt: daysAgoAt(1, 9, 15),
      reason: "Sync desatualizado: reprocessamento manual solicitado pelo suporte.",
      severity: "normal",
    },
    {
      eventId: "evt_007",
      eventType: "reimport_sale",
      eventLabel: "Reimportação de venda",
      entityType: "sale",
      entityId: "2000016503467163",
      adminName: "Marina",
      adminEmail: "marina@suse7.com.br",
      createdAt: daysAgoAt(2, 16, 40),
      reason: "Investigação crítica de divergência financeira em pedido de alto valor.",
      severity: "critical",
    },
    {
      eventId: "evt_008",
      eventType: "recalculate_sale_financial",
      eventLabel: "Recálculo financeiro da venda",
      entityType: "sale",
      entityId: "2000016503467163",
      adminName: "João",
      adminEmail: "joao@suse7.com.br",
      createdAt: daysAgoAt(3, 11, 5),
      reason: "Conferência interna de margem após ajuste de custo do produto.",
      severity: "normal",
    },
  ]);
}

/**
 * @param {TimelineEventViewModel[]} events
 * @param {number} [nowMs]
 * @returns {{ key: string; label: string; events: TimelineEventViewModel[] }[]}
 */
export function groupTimelineEventsByDay(events, nowMs = Date.now()) {
  const sorted = sortTimelineEventsDesc(events);
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  /** @type {Map<string, TimelineEventViewModel[]>} */
  const groups = new Map();

  for (const event of sorted) {
    const date = new Date(event.createdAt);
    let groupKey = "older";
    let groupLabel = "Anterior";

    if (!Number.isNaN(date.getTime())) {
      if (date >= startOfToday) {
        groupKey = "today";
        groupLabel = "Hoje";
      } else if (date >= startOfYesterday) {
        groupKey = "yesterday";
        groupLabel = "Ontem";
      } else {
        groupKey = date.toISOString().slice(0, 10);
        groupLabel = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    }

    const bucket = groups.get(groupKey) ?? [];
    bucket.push(event);
    groups.set(groupKey, bucket);
  }

  const order = ["today", "yesterday"];
  const result = [];

  for (const key of order) {
    const bucket = groups.get(key);
    if (bucket?.length) {
      result.push({
        key,
        label: key === "today" ? "Hoje" : "Ontem",
        events: bucket,
      });
      groups.delete(key);
    }
  }

  for (const [key, bucket] of groups.entries()) {
    const sampleDate = new Date(bucket[0]?.createdAt ?? "");
    result.push({
      key,
      label: Number.isNaN(sampleDate.getTime())
        ? "Anterior"
        : sampleDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
      events: bucket,
    });
  }

  return result;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 *   forceEmpty?: boolean;
 * }} input
 */
export function resolveTimelinePanelState({
  sellerId = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
  forceEmpty = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";
  if (forceEmpty) return "empty";
  return "loaded";
}
