// ======================================================================
// UI helpers — renewal_notice (backend-driven)
// ======================================================================

/**
 * @param {string | null | undefined} level
 */
export function renewalNoticeBannerClass(level) {
  const normalized = String(level || "").toUpperCase();
  if (normalized === "SUSPENDED") return "s7-billing-renewal-notice--suspended";
  if (normalized === "CRITICAL_FINAL" || normalized === "CRITICAL") {
    return "s7-billing-renewal-notice--critical";
  }
  if (normalized === "DANGER") return "s7-billing-renewal-notice--danger";
  if (normalized === "WARNING") return "s7-billing-renewal-notice--warning";
  return "s7-billing-renewal-notice--info";
}

/**
 * @param {string} pathname
 * @param {Record<string, unknown> | null | undefined} restrictions
 */
export function isRenewalOperationalPathBlocked(pathname, restrictions) {
  if (!restrictions?.operational_blocked) return false;
  const path = String(pathname || "").toLowerCase();
  const allowed = Array.isArray(restrictions.allowed_path_prefixes)
    ? restrictions.allowed_path_prefixes.map((p) => String(p).toLowerCase())
    : [];
  if (allowed.some((prefix) => path.startsWith(prefix))) return false;

  const blocked = Array.isArray(restrictions.blocked_path_prefixes)
    ? restrictions.blocked_path_prefixes.map((p) => String(p).toLowerCase())
    : [
        "/vendas",
        "/precific",
        "/anuncios",
        "/anúncios",
        "/produtos",
        "/concorrencia",
        "/concorrência",
        "/relatorios",
        "/relatórios",
        "/registros",
        "/dashboard",
        "/raiox",
        "/rayx",
      ];

  if (blocked.some((prefix) => path.startsWith(prefix))) return true;
  if (path === "/" || path === "") return true;
  return false;
}
