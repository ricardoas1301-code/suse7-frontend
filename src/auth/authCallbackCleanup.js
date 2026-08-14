/**
 * Detecção e limpeza segura de parâmetros de callback Supabase Auth na URL.
 * Nunca logar tokens.
 */

const AUTH_HASH_KEYS = new Set([
  "access_token",
  "refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "provider_token",
  "provider_refresh_token",
]);

const AUTH_QUERY_KEYS = new Set(["code", "error", "error_code", "error_description"]);

/**
 * @returns {boolean}
 */
export function hasAuthCallbackInUrl(locationLike = window.location) {
  const hash = String(locationLike.hash ?? "").replace(/^#/, "");
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    if (hashParams.has("access_token") || hashParams.has("refresh_token")) return true;
    if (hashParams.get("type") === "signup" || hashParams.get("type") === "recovery") return true;
  }

  const search = String(locationLike.search ?? "").replace(/^\?/, "");
  if (!search) return false;
  const queryParams = new URLSearchParams(search);
  return queryParams.has("code") || queryParams.has("error");
}

/**
 * Remove tokens/códigos consumidos da barra de endereço.
 * @param {string} [targetPath="/"]
 */
export function limparAuthCallbackDaUrl(targetPath = "/") {
  if (typeof window === "undefined") return;

  const { pathname, search, hash } = window.location;
  const hashParams = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  const queryParams = new URLSearchParams(String(search ?? "").replace(/^\?/, ""));

  let hashChanged = false;
  for (const key of [...hashParams.keys()]) {
    if (AUTH_HASH_KEYS.has(key) || key === "type") {
      hashParams.delete(key);
      hashChanged = true;
    }
  }

  let queryChanged = false;
  for (const key of [...queryParams.keys()]) {
    if (AUTH_QUERY_KEYS.has(key)) {
      queryParams.delete(key);
      queryChanged = true;
    }
  }

  const nextHash = hashChanged
    ? hashParams.toString()
      ? `#${hashParams.toString()}`
      : ""
    : hash;
  const nextSearch = queryChanged
    ? queryParams.toString()
      ? `?${queryParams.toString()}`
      : ""
    : search;

  const safePath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  const nextUrl = `${safePath}${nextSearch}${nextHash}`;

  if (`${pathname}${search}${hash}` !== nextUrl) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}
