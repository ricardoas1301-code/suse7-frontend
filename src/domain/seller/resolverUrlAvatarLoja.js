// ======================================================================
// URL canônica — avatar/logo da loja no shell autenticado
// SSOT: seller_companies.logo_url → profiles.photo_url (espelho operacional)
// ======================================================================

/**
 * @param {{
 *   logo_url?: string | null;
 *   photo_url?: string | null;
 *   company_logo_url?: string | null;
 * }} input
 * @returns {string | null}
 */
export function resolverUrlAvatarLojaHeader(input = {}) {
  const candidates = [
    input.logo_url,
    input.company_logo_url,
    input.photo_url,
  ];
  for (const raw of candidates) {
    const value = raw != null ? String(raw).trim() : "";
    if (value) return value;
  }
  return null;
}

/**
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function resolverInicialAvatarLojaHeader(name) {
  const trimmed = name != null ? String(name).trim() : "";
  if (!trimmed) return "E";
  return trimmed.charAt(0).toUpperCase();
}
