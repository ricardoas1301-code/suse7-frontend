export const S7_INTRO_PENDING_KEY = "s7_login_intro_pending";
export const S7_INTRO_PLAYED_THIS_SESSION_KEY = "s7_intro_played_this_browser_session";

function canUseBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function getSharedStore() {
  if (!canUseBrowserStorage()) return null;
  return window.localStorage;
}

/** @type {Map<string, number>} */
const introAuthLogCounts = new Map();

export function logIntroAuthDev(label, payload = {}) {
  if (!import.meta.env.DEV) return;
  const count = (introAuthLogCounts.get(label) ?? 0) + 1;
  introAuthLogCounts.set(label, count);
  if (count <= 2) {
    console.info(`[S7_INTRO_AUTH] ${label}`, { ...payload, occurrence: count });
  } else if (count === 3) {
    console.info(`[S7_INTRO_AUTH] ${label}`, {
      ...payload,
      occurrence: count,
      aggregated: true,
      note: "Próximos eventos iguais suprimidos.",
    });
  }
}

export function markIntroPendingForNextLogin(source = "unknown") {
  const store = getSharedStore();
  if (!store) return;
  store.setItem(S7_INTRO_PENDING_KEY, "1");
  // Novo login real deve disparar abertura novamente.
  store.removeItem(S7_INTRO_PLAYED_THIS_SESSION_KEY);
  logIntroAuthDev("intro_should_play", { source });
}

export function markIntroPlayedForCurrentSession(source = "unknown") {
  const store = getSharedStore();
  if (!store) return;
  store.setItem(S7_INTRO_PLAYED_THIS_SESSION_KEY, "1");
  store.removeItem(S7_INTRO_PENDING_KEY);
  logIntroAuthDev("intro_video_finished", { source });
}

export function clearIntroSessionFlags(reason = "unknown") {
  const store = getSharedStore();
  if (!store) return;
  store.removeItem(S7_INTRO_PENDING_KEY);
  store.removeItem(S7_INTRO_PLAYED_THIS_SESSION_KEY);
  logIntroAuthDev("intro_skipped_reason", { reason });
}

export function getIntroPlaybackDecision() {
  const store = getSharedStore();
  if (!store) {
    return { shouldPlay: false, reason: "shared_storage_unavailable" };
  }

  const pending = store.getItem(S7_INTRO_PENDING_KEY) === "1";
  const played = store.getItem(S7_INTRO_PLAYED_THIS_SESSION_KEY) === "1";

  if (!pending) return { shouldPlay: false, reason: "pending_flag_missing" };
  if (played) return { shouldPlay: false, reason: "already_played_this_session" };
  return { shouldPlay: true, reason: "pending_login_intro" };
}
