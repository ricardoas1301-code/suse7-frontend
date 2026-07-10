import { supabase } from "../supabaseClient";
import { logAuthBootstrap } from "./authBootstrapDevLog";
import { clearIntroSessionFlags, logIntroAuthDev } from "./introAuthSession";

/** @type {Promise<import("@supabase/supabase-js").Session | null> | null} */
let bootPromise = null;

/** @type {import("@supabase/supabase-js").Session | null} */
let cachedSession = null;

let listenerInstalled = false;

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
