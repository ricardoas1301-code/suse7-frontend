// ======================================================================
// Persistência leve — preferência expandido/recolhido por usuário
// ======================================================================

const STORAGE_KEY_PREFIX = "suse7:dashboard:operational-tasks:collapsed:";

/**
 * @param {string | null | undefined} userId
 */
function buildStorageKey(userId) {
  const id = userId != null ? String(userId).trim() : "";
  return `${STORAGE_KEY_PREFIX}${id || "anonymous"}`;
}

/**
 * @param {string | null | undefined} userId
 * @returns {boolean}
 */
export function readOperationalTasksCollapsedPreference(userId) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(buildStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string | null | undefined} userId
 * @param {boolean} collapsed
 */
export function writeOperationalTasksCollapsedPreference(userId, collapsed) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(buildStorageKey(userId), collapsed ? "1" : "0");
  } catch {
    /* preferência visual — falha silenciosa */
  }
}
