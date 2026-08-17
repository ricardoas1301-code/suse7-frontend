import { buildApiUrl, apiFetch } from "../config/api.js";

/** @type {Promise<{ ok: boolean; code?: string; idempotent?: boolean }> | null} */
let bootstrapInFlight = null;

/**
 * Bootstrap mínimo pós-login social (e-mail apenas; sem dados comerciais).
 */
export async function bootstrapSocialSessionOnce() {
  if (bootstrapInFlight) return bootstrapInFlight;

  bootstrapInFlight = (async () => {
    const url = buildApiUrl("/api/signup/bootstrap-social-session");
    if (!url) {
      return { ok: false, code: "API_UNAVAILABLE", error: "API indisponível." };
    }

    const res = await apiFetch(url, { method: "POST" });
    if (!res.ok) {
      return {
        ok: false,
        code: res.data?.code ?? "BOOTSTRAP_FAILED",
        error: res.error ?? "Não foi possível iniciar a sessão social.",
        status: res.status,
      };
    }

    return {
      ok: true,
      code: res.data?.code ?? "BOOTSTRAPPED",
      idempotent: res.data?.idempotent === true,
      data: res.data,
    };
  })().finally(() => {
    bootstrapInFlight = null;
  });

  return bootstrapInFlight;
}

/**
 * @param {{ code?: string }} result
 */
export function isSocialBootstrapComplete(result) {
  return (
    result?.ok === true &&
    (result.code === "BOOTSTRAPPED" || result.code === "ALREADY_BOOTSTRAPPED")
  );
}

/**
 * @param {import("@supabase/supabase-js").Session | null | undefined} session
 */
export function isSocialAuthSession(session) {
  const provider = String(session?.user?.app_metadata?.provider ?? "").trim().toLowerCase();
  return Boolean(provider && provider !== "email");
}
