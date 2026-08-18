/**
 * Classe compacta para valores monetários na coluna Lucro/Margem (sem truncar).
 * @param {unknown} displayValue
 */
export function vendasFinValueCompactClass(displayValue) {
  const raw = displayValue != null ? String(displayValue).trim() : "";
  if (raw === "" || raw === "—") return "";
  const len = raw.length;
  if (len >= 14) return "vendas-page__fin-value--compact-xl";
  if (len >= 11) return "vendas-page__fin-value--compact-lg";
  if (len >= 9) return "vendas-page__fin-value--compact";
  return "";
}
