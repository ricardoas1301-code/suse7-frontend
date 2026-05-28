// ======================================================================
// Máscaras compartilhadas — CompleteProfileModal / SellerCompanyModal
// ======================================================================

/** @param {string} value */
export function formatPhoneBr(value) {
  const v = String(value ?? "").replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

/** @param {string} value — apenas dígitos, até 14 */
export function formatCpfCnpjBr(value) {
  const v = String(value ?? "").replace(/\D/g, "").slice(0, 14);
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** @param {string} value */
export function formatCepBr(value) {
  const only = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  return only.replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Imposto / percentuais no padrão do Complete seu cadastro (0–99,99).
 * @param {string} value input cru
 * @returns {string | null} null = ignorar atualização
 */
export function sanitizeTaxPercentCommaInput(value) {
  let v = String(value ?? "").replace(/[^0-9,]/g, "");
  if ((v.match(/,/g) || []).length > 1) return null;
  if (v.includes(",")) {
    const [inteiro, decimal] = v.split(",");
    if (inteiro.length > 2) return null;
    if (decimal.length > 2) return null;
    v = `${inteiro},${decimal}`;
  } else if (v.length > 2) {
    return null;
  }
  return v;
}
