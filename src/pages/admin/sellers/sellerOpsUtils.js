import { marketplaceLabel } from "./sellerOpsConstants";

/**
 * @param {import('./sellerOpsTypes').SellerListRow[]} rows
 * @param {import('./sellerOpsTypes').SellerFilters} filters
 */
export function filterSellers(rows, filters) {
  const q = filters.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const blob = [r.nome, r.email, r.id, r.cnpj, r.plano].filter(Boolean).join(" ").toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (filters.status && r.status !== filters.status) return false;
    if (filters.plan && !(r.plano ?? "").toLowerCase().includes(filters.plan.toLowerCase())) return false;
    if (filters.integration && r.integration_status !== filters.integration) return false;
    if (filters.health && r.operational_health !== filters.health) return false;
    if (filters.billing) {
      if (filters.billing === "trial" && !r.in_trial) return false;
      if (filters.billing === "grace" && !r.in_grace) return false;
      if (filters.billing === "past_due" && !r.is_past_due) return false;
      if (filters.billing === "active" && String(r.subscription_status ?? "").toLowerCase() !== "active") return false;
    }
    return true;
  });
}

/**
 * @param {import('./sellerOpsTypes').SellerListRow[]} rows
 */
export function computeSellerStats(rows) {
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "ativo").length,
    noIntegration: rows.filter((r) => r.integration_status === "sem_integracao").length,
    critical: rows.filter((r) => r.operational_health === "critico").length,
    grace: rows.filter((r) => r.in_grace || r.is_past_due).length,
  };
}

/**
 * @param {string | null | undefined} iso
 */
export function formatSellerWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatSellerDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/**
 * @param {import('./sellerOpsTypes').OperationalHealth | string | null | undefined} health
 */
export function healthClass(health) {
  const base = "dc-seller-pill";
  if (health === "saudavel") return `${base} dc-seller-pill--health-ok`;
  if (health === "critico") return `${base} dc-seller-pill--health-critical`;
  return `${base} dc-seller-pill--health-warn`;
}

/**
 * @param {import('./sellerOpsTypes').OperationalHealth | string | null | undefined} health
 */
export function healthLabel(health) {
  if (health === "saudavel") return "Saudável";
  if (health === "critico") return "Crítico";
  if (health === "atencao") return "Atenção";
  return "—";
}

/**
 * @param {string | null | undefined} status
 */
export function statusClass(status) {
  const base = "dc-seller-pill";
  if (status === "ativo") return `${base} dc-seller-pill--status-active`;
  return `${base} dc-seller-pill--status-muted`;
}

/**
 * @param {string[] | null | undefined} marketplaces
 */
export function formatMarketplacesSummary(marketplaces) {
  if (!Array.isArray(marketplaces) || marketplaces.length === 0) return "—";
  return marketplaces.map((m) => marketplaceLabel(m)).join(", ");
}

/**
 * @param {string | null | undefined} planKey
 * @param {string | null | undefined} planLabel
 */
export function formatPlanDisplay(planKey, planLabel) {
  if (planLabel && planLabel !== "—") return planLabel;
  if (planKey) return planKey.replace(/[_-]+/g, " ");
  return "—";
}
