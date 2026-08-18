import { buildApiUrl, apiFetch } from "../config/api.js";

/** @type {Promise<{ ok: boolean; code?: string; idempotent?: boolean }> | null} */
let completionInFlight = null;

/**
 * Conclusão idempotente do birth pós-confirmação (requer sessão autenticada).
 */
export async function completeSignupBirthOnce() {
  if (completionInFlight) return completionInFlight;

  completionInFlight = (async () => {
    const url = buildApiUrl("/api/signup/complete-birth");
    if (!url) {
      return { ok: false, code: "API_UNAVAILABLE", error: "API indisponível." };
    }

    const res = await apiFetch(url, { method: "POST" });
    if (!res.ok) {
      return {
        ok: false,
        code: res.data?.code ?? "COMPLETION_FAILED",
        error: res.error ?? "Não foi possível concluir o cadastro.",
        status: res.status,
      };
    }

    return {
      ok: true,
      code: res.data?.code ?? "COMPLETED",
      idempotent: res.data?.idempotent === true,
      data: res.data,
    };
  })().finally(() => {
    completionInFlight = null;
  });

  return completionInFlight;
}

/**
 * @param {{ code?: string; status?: number }} result
 */
export function isSignupBirthAlreadyComplete(result) {
  return result?.ok === true && (result.code === "COMPLETED" || result.code === "ALREADY_COMPLETED");
}

/**
 * @param {{ code?: string; status?: number }} result
 */
export function isSignupBirthPendingConfirmation(result) {
  return result?.code === "EMAIL_NOT_CONFIRMED" || result?.status === 403;
}
