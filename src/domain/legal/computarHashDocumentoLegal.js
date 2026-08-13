// ======================================================================
// Hash canônico de documentos legais (SHA-256)
// ======================================================================

/**
 * @param {string} texto
 * @returns {Promise<string>}
 */
export async function computarHashSha256Hex(texto) {
  const encoded = new TextEncoder().encode(String(texto ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<string>}
 */
export async function computarHashPayloadCanonico(payload) {
  return computarHashSha256Hex(JSON.stringify(payload));
}
