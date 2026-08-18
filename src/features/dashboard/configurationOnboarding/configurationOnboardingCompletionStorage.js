const STORAGE_PREFIX = "s7_configuration_completion_dismissed:";

/**
 * @param {string | null | undefined} userId
 */
export function readConfigurationCompletionDismissed(userId) {
  const uid = String(userId ?? "").trim();
  if (!uid || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${uid}`) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string | null | undefined} userId
 */
export function writeConfigurationCompletionDismissed(userId) {
  const uid = String(userId ?? "").trim();
  if (!uid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${uid}`, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Sinal efêmero de retorno OAuth na sessão atual (não persiste entre reloads).
 * @param {string | null | undefined} userId
 */
export function markConfigurationOAuthReturnCelebration(userId) {
  const uid = String(userId ?? "").trim();
  if (!uid || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}oauth_return:${uid}`, "1");
  } catch {
    /* ignore */
  }
}

/**
 * @param {string | null | undefined} userId
 */
export function hasConfigurationOAuthReturnCelebration(userId) {
  const uid = String(userId ?? "").trim();
  if (!uid || typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(`${STORAGE_PREFIX}oauth_return:${uid}`) === "1";
  } catch {
    return false;
  }
}
