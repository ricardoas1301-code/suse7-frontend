/**
 * @param {Record<string, unknown>[]} marketplaces
 */
export function summarizeMarketplaceGroups(marketplaces) {
  /** @type {Map<string, { marketplace: string; count: number; statusLabel: string; items: Record<string, unknown>[] }>} */
  const groups = new Map();

  for (const row of marketplaces) {
    const key = String(row.marketplace ?? "marketplace");
    const current = groups.get(key) ?? {
      marketplace: key,
      count: 0,
      statusLabel: "—",
      items: [],
    };
    current.count += 1;
    current.items.push(row);
    groups.set(key, current);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    statusLabel: pickGroupStatusLabel(group.items),
  }));
}

/**
 * @param {Record<string, unknown>[]} items
 */
function pickGroupStatusLabel(items) {
  const labels = items
    .map((item) => item.connection_badge_label ?? item.status)
    .filter(Boolean)
    .map((value) => String(value));

  if (labels.length === 0) return "—";
  const connected = labels.find((label) => /ativ|connect|ok/i.test(label));
  return connected ?? labels[0];
}

/**
 * @param {Record<string, unknown>[]} marketplaces
 * @param {number} [visible=2]
 */
export function sliceMarketplaceSummary(groups, visible = 2) {
  const list = Array.isArray(groups) ? groups : [];
  const shown = list.slice(0, visible);
  const hidden = Math.max(0, list.length - shown.length);
  return { shown, hidden };
}

/**
 * @param {Record<string, unknown>[]} marketplaces
 */
export function resolveLastMarketplaceSync(marketplaces) {
  let latest = null;
  for (const row of marketplaces) {
    const raw = row.last_sync_at;
    if (!raw) continue;
    const time = new Date(String(raw)).getTime();
    if (Number.isNaN(time)) continue;
    if (!latest || time > latest.time) {
      latest = { raw: String(raw), time };
    }
  }
  return latest?.raw ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 */
export function formatSubscriptionCycleLabel(subscription) {
  if (!subscription) return "—";
  if (subscription.in_trial) return "Trial";
  if (subscription.in_grace) return "Grace period";
  if (subscription.is_past_due) return "Inadimplente";
  if (subscription.is_suspended) return "Suspensa";
  const status = String(subscription.status ?? "").toLowerCase();
  if (status === "active" || status === "internal_free") return "Ciclo ativo";
  if (status) return status.charAt(0).toUpperCase() + status.slice(1);
  return "—";
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 */
export function formatSubscriptionStatusLabel(subscription) {
  if (!subscription) return "Sem assinatura";
  const status = String(subscription.status ?? "").trim();
  if (!status) return "—";
  const map = {
    active: "Ativa",
    internal_free: "Cortesia interna",
    past_due: "Inadimplente",
    pending: "Pendente",
    canceled: "Cancelada",
  };
  return map[status.toLowerCase()] ?? status;
}
