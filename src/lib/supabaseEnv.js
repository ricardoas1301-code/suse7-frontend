// ======================================================
// Validação de env Supabase (DEV) — URL + anon key alinhados
// ======================================================

const OFFICIAL_DEV_PROJECT_REF = "ujznkyvgqhxagemdgmor";

/**
 * @param {string | undefined} raw
 */
export function normalizeSupabaseUrl(raw) {
  const trimmed = String(raw ?? "").trim().replace(/\/+$/, "");
  return trimmed || null;
}

/**
 * @param {string | undefined} url
 */
export function extractSupabaseProjectRef(url) {
  const normalized = normalizeSupabaseUrl(url);
  if (!normalized) return null;
  try {
    const host = new URL(normalized).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} anonKey
 */
export function extractProjectRefFromAnonKey(anonKey) {
  const key = String(anonKey ?? "").trim();
  if (!key) return null;
  try {
    const payloadPart = key.split(".")[1];
    if (!payloadPart) return null;
    const json = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
    const ref = json?.ref;
    return ref != null ? String(ref).toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Bloqueia proxy/local acidental (causa HTML/522 no login).
 * @param {string | null | undefined} url
 */
export function assertSupabaseUrlIsRemote(url) {
  const normalized = normalizeSupabaseUrl(url);
  if (!normalized) return;
  let host = "";
  try {
    host = new URL(normalized).hostname.toLowerCase();
  } catch {
    throw new Error("[Suse7][Supabase] VITE_SUPABASE_URL inválida.");
  }
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    !host.endsWith(".supabase.co")
  ) {
    throw new Error(
      `[Suse7][Supabase] VITE_SUPABASE_URL deve ser https://<ref>.supabase.co (não ${host}). Remova proxy DEV e reinicie o Vite.`
    );
  }
}

/**
 * @param {{ url?: string; anonKey?: string }} params
 */
export function validateSupabaseEnvPair({ url, anonKey }) {
  const normalizedUrl = normalizeSupabaseUrl(url);
  const key = String(anonKey ?? "").trim();
  if (!normalizedUrl || !key) {
    return {
      ok: false,
      code: "MISSING_ENV",
      message:
        "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (.env.development ou .env.development.local) e reinicie o Vite.",
    };
  }

  try {
    assertSupabaseUrlIsRemote(normalizedUrl);
  } catch (err) {
    return {
      ok: false,
      code: "LOCALHOST_FORBIDDEN",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const urlRef = extractSupabaseProjectRef(normalizedUrl);
  const keyRef = extractProjectRefFromAnonKey(key);
  if (!urlRef) {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "VITE_SUPABASE_URL inválida. Use https://<project-ref>.supabase.co",
    };
  }
  if (!keyRef) {
    return {
      ok: false,
      code: "INVALID_KEY",
      message: "VITE_SUPABASE_ANON_KEY inválida (JWT anon do mesmo projeto).",
    };
  }
  if (urlRef !== keyRef) {
    return {
      ok: false,
      code: "REF_MISMATCH",
      message: `Supabase URL (${urlRef}) e anon key (${keyRef}) são de projetos diferentes.`,
      urlRef,
      keyRef,
    };
  }

  return {
    ok: true,
    projectRef: urlRef,
    url: normalizedUrl,
    isOfficialDev: urlRef === OFFICIAL_DEV_PROJECT_REF,
  };
}

/**
 * Snapshot de env/runtime para diagnóstico de login DEV.
 * @param {{ clientUrl?: string | null; projectRef?: string | null }} [runtime]
 */
export function buildSupabaseLoginDebug(runtime = {}) {
  const viteUrl = import.meta.env.VITE_SUPABASE_URL;
  const viteKeyPresent = Boolean(String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim());
  const envCheck = validateSupabaseEnvPair({
    url: viteUrl,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
  const resolvedUrl = runtime.clientUrl || (envCheck.ok ? envCheck.url : normalizeSupabaseUrl(viteUrl));
  let authTokenUrl = null;
  let authHost = null;
  if (resolvedUrl) {
    try {
      authTokenUrl = `${resolvedUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=password`;
      authHost = new URL(resolvedUrl).hostname;
    } catch {
      authTokenUrl = null;
    }
  }

  return {
    viteSupabaseUrl: viteUrl ?? null,
    viteAnonKeyPresent: viteKeyPresent,
    envValid: envCheck.ok,
    envError: envCheck.ok ? null : envCheck.message,
    projectRef: runtime.projectRef ?? (envCheck.ok ? envCheck.projectRef : null),
    clientUrl: runtime.clientUrl ?? null,
    resolvedUrl,
    authHost,
    authTokenUrl,
    direct: true,
    usesLocalhost:
      Boolean(authHost && (authHost === "localhost" || authHost === "127.0.0.1")),
    officialDevProject: envCheck.ok ? envCheck.isOfficialDev : false,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
  };
}

/**
 * @param {unknown} error
 */
export function isSupabaseNetworkError(error) {
  const msg = String(error?.message ?? error ?? "").toLowerCase();
  const name = String(error?.name ?? "").toLowerCase();
  return (
    name === "typeerror" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cors") ||
    msg.includes("unexpected token")
  );
}

/**
 * @param {unknown} error
 * @param {{ projectRef?: string | null }} [ctx]
 */
export function mapSupabaseAuthErrorMessage(error, ctx = {}) {
  if (!error) return "Não foi possível entrar. Tente novamente.";
  if (isSupabaseNetworkError(error)) {
    const ref = ctx.projectRef ? ` (projeto ${ctx.projectRef})` : "";
    return `Falha de conexão com autenticação${ref}. Confira no Network se a URL é *.supabase.co (não localhost). Reinicie o Vite e limpe cache (.vite / hard refresh).`;
  }
  const msg = String(error.message ?? "");
  if (/invalid login credentials|invalid email or password/i.test(msg)) {
    return "E-mail ou senha inválidos.";
  }
  if (/email not confirmed|confirm your email|email address has not been confirmed/i.test(msg)) {
    return "Confirme seu e-mail para continuar.";
  }
  return msg || "Não foi possível entrar. Tente novamente.";
}
