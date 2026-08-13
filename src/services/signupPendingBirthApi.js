import { buildApiUrl, apiFetch } from "../config/api.js";

/**
 * @param {Record<string, unknown>} form
 * @param {{
 *   document_type: string;
 *   document_version: string;
 *   document_hash: string;
 *   accepted_at: string;
 *   source: string;
 *   scrolled_to_end: boolean;
 * }} termosAceite
 */
export async function criarSignupPendingBirth(form, termosAceite) {
  const url = buildApiUrl("/api/signup/pending-birth");
  if (!url) {
    return { ok: false, status: 0, error: "API indisponível." };
  }

  return apiFetch(url, {
    method: "POST",
    body: {
      email: String(form.email ?? "").trim(),
      nome: form.nome,
      nome_loja: form.nome_loja,
      whatsapp: form.whatsapp,
      telefone: form.telefone,
      cpf_cnpj: form.cpf_cnpj,
      terms: {
        document_type: termosAceite.document_type,
        document_version: termosAceite.document_version,
        document_hash: termosAceite.document_hash,
        accepted_at: termosAceite.accepted_at,
        source: termosAceite.source,
        scrolled_to_end: termosAceite.scrolled_to_end,
      },
    },
  });
}

/**
 * @param {string} bindToken
 * @param {string} authUserId
 * @param {string} authEmail
 */
export async function vincularSignupPendingBirth(bindToken, authUserId, authEmail) {
  const url = buildApiUrl("/api/signup/pending-birth/bind");
  if (!url) {
    return { ok: false, status: 0, error: "API indisponível." };
  }

  return apiFetch(url, {
    method: "POST",
    body: {
      bind_token: bindToken,
      auth_user_id: authUserId,
      auth_email: authEmail,
    },
  });
}

/**
 * @param {string} bindToken
 * @param {string} [reason]
 */
export async function abortarSignupPendingBirth(bindToken, reason = "SIGNUP_FAILED") {
  const url = buildApiUrl("/api/signup/pending-birth/abort");
  if (!url) {
    return { ok: false, status: 0, error: "API indisponível." };
  }

  return apiFetch(url, {
    method: "POST",
    body: { bind_token: bindToken, reason },
  });
}
