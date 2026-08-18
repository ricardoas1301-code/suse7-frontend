// =============================================================================
// UI helpers — inbox in-app (tempo relativo, agrupamento, severidade)
// =============================================================================

/**
 * @param {string | null | undefined} iso
 */
export function formatRelativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * @param {string | null | undefined} severity
 */
export function severityTone(severity) {
  const s = String(severity ?? "info").toLowerCase();
  if (s === "critical") return "critical";
  if (s === "warning" || s === "high") return "warning";
  return "info";
}

/**
 * @param {string | null | undefined} category
 */
export function categoryLabel(category) {
  const map = {
    BILLING: "Assinatura e pagamentos",
    SALES: "Vendas",
    PROFIT: "Lucro",
    PRODUCTS: "Produtos",
    INVENTORY: "Estoque",
    MARKETPLACE: "Marketplace",
    ACCOUNT_HEALTH: "Conta",
    SYSTEM: "Sistema",
  };
  const key = String(category ?? "").toUpperCase();
  return map[key] ?? (key || "Suse7");
}

/**
 * @param {Array<Record<string, unknown>>} items
 */
export function groupInboxByTime(items) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 7);

  /** @type {Record<string, Array<Record<string, unknown>>>} */
  const groups = {
    unread: [],
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const item of items ?? []) {
    if (!item.is_read) {
      groups.unread.push(item);
      continue;
    }
    const created = item.created_at ? new Date(String(item.created_at)) : null;
    if (!created || Number.isNaN(created.getTime())) {
      groups.older.push(item);
      continue;
    }
    if (created >= startToday) groups.today.push(item);
    else if (created >= startYesterday) groups.yesterday.push(item);
    else if (created >= startWeek) groups.week.push(item);
    else groups.older.push(item);
  }

  return groups;
}
