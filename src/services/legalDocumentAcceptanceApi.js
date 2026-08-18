import { buildApiUrl, apiFetch } from "../config/api.js";

/**
 * @param {{
 *   document_type: string;
 *   document_version: string;
 *   document_hash: string;
 *   accepted_at: string;
 *   source: string;
 *   scrolled_to_end: boolean;
 * }} registro
 */
export async function persistirAceiteDocumentoLegal(registro) {
  const url = buildApiUrl("/api/legal/document-acceptances");
  if (!url) {
    return { ok: false, status: 0, error: "API indisponível para registrar aceite." };
  }

  return apiFetch(url, {
    method: "POST",
    body: {
      document_type: registro.document_type,
      document_version: registro.document_version,
      document_hash: registro.document_hash,
      accepted_at: registro.accepted_at,
      source: registro.source,
      scrolled_to_end: registro.scrolled_to_end,
    },
  });
}
