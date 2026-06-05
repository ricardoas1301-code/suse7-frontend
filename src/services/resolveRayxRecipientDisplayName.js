// =============================================================================
// Nome amigável do destinatário — Raio-X manual (e-mail / notificações).
// =============================================================================

const TECHNICAL_LABEL_PATTERN =
  /^(manual[_\s-]?sale[_\s-]?rayx|manual_sale_rayx|MANUAL_SALE_RAYX)$/i;

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function sanitizeName(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (TECHNICAL_LABEL_PATTERN.test(value)) return null;
  return value;
}

/**
 * @param {Record<string, unknown> | null | undefined} group
 * @param {Record<string, unknown> | null | undefined} channel
 * @returns {string | null}
 */
export function resolveRayxRecipientDisplayName(group, channel) {
  const candidates = [
    group?.label,
    group?.contact_name,
    group?.recipient_name,
    channel?.label,
    channel?.contact_name,
    channel?.recipient_name,
  ];

  for (const candidate of candidates) {
    const name = sanitizeName(candidate);
    if (name) return name;
  }

  return null;
}
