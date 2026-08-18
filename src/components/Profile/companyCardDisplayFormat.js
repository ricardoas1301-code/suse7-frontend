// ======================================================================
// Formatação visual — cards resumidos de empresa (Perfil da Empresa)
// ======================================================================

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCompanyTaxRateDisplay(value) {
  if (value == null || value === "") return "—";

  const raw = String(value).trim();
  if (!raw) return "—";

  const numeric = Number(raw.replace(",", "."));
  if (Number.isNaN(numeric)) return "—";

  const formatted = Number.isInteger(numeric) ? String(numeric) : raw.replace(".", ",");
  return `${formatted}%`;
}
