// ======================================================================
// Formatação visual (sem regra de acesso)
// ======================================================================

export function formatPlanPriceBRL(priceMonthly) {
  const value = Number(priceMonthly ?? 0);
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {string | null | undefined} value
 */
export function formatPaymentDueDatePt(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("pt-BR");
}

export function formatBillingDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatSalesLimit(limit) {
  if (limit == null || limit === "") return "Sob consulta";
  const n = Number(limit);
  if (!Number.isFinite(n)) return "Sob consulta";
  if (n <= 0) return "Sem limite mensal informado";
  return `Até ${n.toLocaleString("pt-BR")} vendas/mês`;
}

/** @type {Record<string, string>} */
const PLAN_KEY_DISPLAY_NAMES = {
  baby: "Baby",
  start: "Start",
  crescer: "Crescer",
  pro: "Pro",
  scale: "Scale",
  elite: "Elite",
  enterprise: "Enterprise",
};

/**
 * Nome do plano para exibição (checkout, histórico, modais).
 * Corrige slugs/keys em minúsculas (ex.: elite → Elite).
 * @param {string | null | undefined} value
 */
export function formatPlanDisplayName(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "Plano";

  const key = raw.toLowerCase();
  if (PLAN_KEY_DISPLAY_NAMES[key]) return PLAN_KEY_DISPLAY_NAMES[key];

  if (/[A-ZÀ-ÖØ-Þ]/.test(raw.slice(1))) return raw;

  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function resolvePlanDisplayName(plan) {
  if (!plan) return "—";
  const raw = plan.marketing_name ?? plan.display_name ?? plan.plan_name ?? plan.name ?? plan.plan_key ?? "—";
  if (!raw || raw === "—") return "—";
  return formatPlanDisplayName(String(raw));
}
