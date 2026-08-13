import { supabase } from "../supabaseClient";
import { logAuthBootstrap } from "./authBootstrapDevLog";
import { completeSignupBirthOnce, isSignupBirthAlreadyComplete } from "../services/completeSignupBirth.js";
import { clearIntroSessionFlags, logIntroAuthDev } from "./introAuthSession";

/** @type {Promise<import("@supabase/supabase-js").Session | null> | null} */
let bootPromise = null;

/** @type {import("@supabase/supabase-js").Session | null} */
let cachedSession = null;

let listenerInstalled = false;

/** @type {Promise<{ ok: boolean; code?: string }> | null} */
let birthCompletionBootstrapInFlight = null;

/** @type {"idle" | "running" | "done" | "failed" | "skipped"} */
let birthCompletionState = "idle";

/** @type {Set<(state: typeof birthCompletionState) => void>} */
const birthCompletionListeners = new Set();

/**
 * @param {(state: typeof birthCompletionState) => void} listener
 */
export function subscribeBirthCompletionState(listener) {
  birthCompletionListeners.add(listener);
  listener(birthCompletionState);
  return () => birthCompletionListeners.delete(listener);
}

export function getBirthCompletionState() {
  return birthCompletionState;
}

function setBirthCompletionState(next) {
  birthCompletionState = next;
  for (const listener of birthCompletionListeners) listener(birthCompletionState);
}

async function maybeCompleteSignupBirthOnSession(session, source = "auth_bootstrap") {
  if (!session?.access_token || !session?.user?.id) {
    setBirthCompletionState("skipped");
    return { ok: true, code: "NO_SESSION" };
  }

  if (birthCompletionState === "done") {
    return { ok: true, code: "ALREADY_DONE" };
  }

  if (birthCompletionBootstrapInFlight) {
    return birthCompletionBootstrapInFlight;
  }

  setBirthCompletionState("running");
  birthCompletionBootstrapInFlight = (async () => {
    try {
      const result = await completeSignupBirthOnce();
      if (isSignupBirthAlreadyComplete(result)) {
        setBirthCompletionState("done");
        logAuthBootstrap("signup_birth_complete", { source, code: result.code });
        return result;
      }
      if (result.code === "PENDING_NOT_FOUND") {
        setBirthCompletionState("skipped");
        logAuthBootstrap("signup_birth_skipped_no_pending", { source });
        return { ok: true, code: "NO_PENDING" };
      }
      setBirthCompletionState("failed");
      logAuthBootstrap("signup_birth_failed", { source, code: result.code, error: result.error });
      return result;
    } catch (err) {
      setBirthCompletionState("failed");
      logAuthBootstrap("signup_birth_failed", {
        source,
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, code: "COMPLETION_EXCEPTION" };
    } finally {
      birthCompletionBootstrapInFlight = null;
    }
  })();

  return birthCompletionBootstrapInFlight;
}

/** @type {Set<(session: import("@supabase/supabase-js").Session | null) => void>} */
const sessionListeners = new Set();

/**
 * @param {import("@supabase/supabase-js").Session | null | undefined} a
 * @param {import("@supabase/supabase-js").Session | null | undefined} b
 */
function sessionsEquivalent(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    String(a.access_token ?? "") === String(b.access_token ?? "") &&
    String(a.user?.id ?? "") === String(b.user?.id ?? "")
  );
}

/**
 * @param {(session: import("@supabase/supabase-js").Session | null) => void} listener
 */
export function subscribeAuthBootstrapSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

/**
 * @param {import("@supabase/supabase-js").Session | null} session
 */
function setCachedSession(session) {
  cachedSession = session ?? null;
  for (const listener of sessionListeners) {
    listener(cachedSession);
  }
}

export function getAuthBootstrapSession() {
  return cachedSession;
}

export function getAuthBootstrapAccessToken() {
  return cachedSession?.access_token ?? null;
}

export function getAuthBootstrapUser() {
  return cachedSession?.user ?? null;
}

/**
 * Single-flight: uma única leitura inicial de sessão para todo o app.
 */
export async function ensureAuthSessionBootstrapped() {
  if (bootPromise) return bootPromise;

  logAuthBootstrap("boot_start");

  bootPromise = (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logAuthBootstrap("session_ready", { hasSession: false, error: error.message });
      setCachedSession(null);
      return null;
    }

    const session = data.session ?? null;
    setCachedSession(session);
    logAuthBootstrap("session_ready", {
      hasSession: Boolean(session),
      userId: session?.user?.id ?? null,
      hasToken: Boolean(session?.access_token),
    });
    if (session?.access_token) {
      await maybeCompleteSignupBirthOnSession(session, "boot");
    } else {
      setBirthCompletionState("skipped");
    }
    return session;
  })();

  return bootPromise;
}

/**
 * Atualiza sessão em cache sem disputar lock com getUser paralelo.
 */
export async function refreshAuthBootstrapSession(source = "refresh") {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setCachedSession(null);
    return null;
  }

  const session = data.session ?? null;
  if (sessionsEquivalent(cachedSession, session)) {
    return cachedSession;
  }
  setCachedSession(session);
  logAuthBootstrap("session_updated", {
    source,
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
  });
  return session;
}

/**
 * Listener global único — evita múltiplos onAuthStateChange competindo.
 */
export function installAuthBootstrapListener() {
  if (listenerInstalled) return () => {};

  listenerInstalled = true;
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const next = session ?? null;

    if (event === "SIGNED_IN") {
      const provider = String(next?.user?.app_metadata?.provider ?? "").trim() || "password";
      if (provider === "google" || provider === "github" || provider === "apple") {
        logIntroAuthDev("auth_social_callback_success", {
          provider,
          user_id: next?.user?.id ?? null,
        });
      } else {
        logIntroAuthDev("auth_login_success", {
          provider,
          user_id: next?.user?.id ?? null,
        });
      }
      void maybeCompleteSignupBirthOnSession(next, `event:${event}`);
    }
    if (event === "SIGNED_OUT") {
      clearIntroSessionFlags("signed_out");
    }

    if (sessionsEquivalent(cachedSession, next)) {
      return;
    }
    setCachedSession(next);
    logAuthBootstrap("session_updated", {
      event,
      hasSession: Boolean(next),
      userId: next?.user?.id ?? null,
    });
  });

  return () => {
    subscription.unsubscribe();
    listenerInstalled = false;
  };
}

export function markAuthBootstrapCompleted() {
  logAuthBootstrap("boot_completed", {
    hasSession: Boolean(cachedSession),
    userId: cachedSession?.user?.id ?? null,
  });
}
