import { supabase } from "../supabaseClient";
import { logAuthBootstrap } from "./authBootstrapDevLog";
import { completeSignupBirthOnce, isSignupBirthAlreadyComplete } from "../services/completeSignupBirth.js";
import { clearIntroSessionFlags, logIntroAuthDev } from "./introAuthSession";
import { hasAuthCallbackInUrl, limparAuthCallbackDaUrl } from "./authCallbackCleanup.js";

/** @type {Promise<import("@supabase/supabase-js").Session | null> | null} */
let bootPromise = null;

/** @type {import("@supabase/supabase-js").Session | null} */
let cachedSession = null;

let listenerInstalled = false;

/** @type {Promise<{ ok: boolean; code?: string }> | null} */
let birthCompletionBootstrapInFlight = null;

/** @type {"idle" | "running" | "done" | "failed" | "skipped"} */
let birthCompletionState = "idle";

/** @type {{ code: string; message: string } | null} */
let authCallbackError = null;

/** @type {Set<(state: typeof birthCompletionState) => void>} */
const birthCompletionListeners = new Set();

/** @type {Set<(error: typeof authCallbackError) => void>} */
const callbackErrorListeners = new Set();

const AUTH_CALLBACK_WAIT_MS = 12_000;

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

/**
 * @param {(error: typeof authCallbackError) => void} listener
 */
export function subscribeAuthCallbackError(listener) {
  callbackErrorListeners.add(listener);
  listener(authCallbackError);
  return () => callbackErrorListeners.delete(listener);
}

export function getAuthCallbackError() {
  return authCallbackError;
}

function setBirthCompletionState(next) {
  birthCompletionState = next;
  for (const listener of birthCompletionListeners) listener(birthCompletionState);
}

function setAuthCallbackError(next) {
  authCallbackError = next;
  for (const listener of callbackErrorListeners) listener(authCallbackError);
}

function scheduleBirthCompletion(session, source) {
  if (!session?.access_token || !session?.user?.id) {
    setBirthCompletionState("skipped");
    return;
  }
  void maybeCompleteSignupBirthOnSession(session, source);
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

function sessionsEquivalent(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    String(a.access_token ?? "") === String(b.access_token ?? "") &&
    String(a.user?.id ?? "") === String(b.user?.id ?? "")
  );
}

export function subscribeAuthBootstrapSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

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
 * Aguarda sessão quando a URL indica callback de confirmação/recovery.
 * @returns {Promise<import("@supabase/supabase-js").Session | null>}
 */
function waitForAuthCallbackSession() {
  return new Promise((resolve) => {
    let settled = false;
    /** @type {import("@supabase/supabase-js").Subscription | null} */
    let subscription = null;

    const finish = (session) => {
      if (settled) return;
      settled = true;
      subscription?.unsubscribe();
      resolve(session ?? null);
    };

    const timeoutId = window.setTimeout(() => finish(null), AUTH_CALLBACK_WAIT_MS);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session?.access_token) {
          window.clearTimeout(timeoutId);
          finish(session);
        }
      }
    });
    subscription = data.subscription;

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.access_token) {
        window.clearTimeout(timeoutId);
        finish(sessionData.session);
      }
    });
  });
}

async function resolveInitialAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logAuthBootstrap("session_ready", { hasSession: false, error: error.message });
    return { session: null, error: error.message };
  }

  let session = data.session ?? null;
  const callbackDetected = hasAuthCallbackInUrl();

  if (!session?.access_token && callbackDetected) {
    logAuthBootstrap("auth_callback_wait_start");
    session = await waitForAuthCallbackSession();
    logAuthBootstrap("auth_callback_wait_end", { hasSession: Boolean(session) });
  }

  if (callbackDetected && !session?.access_token) {
    setAuthCallbackError({
      code: "AUTH_CALLBACK_SESSION_MISSING",
      message: "Não conseguimos validar sua confirmação de e-mail. Tente entrar novamente.",
    });
  } else {
    setAuthCallbackError(null);
  }

  return { session, error: null };
}

export async function ensureAuthSessionBootstrapped() {
  if (bootPromise) return bootPromise;

  logAuthBootstrap("boot_start");

  bootPromise = (async () => {
    const { session, error } = await resolveInitialAuthSession();
    if (error) {
      setCachedSession(null);
      return null;
    }

    setCachedSession(session);
    logAuthBootstrap("session_ready", {
      hasSession: Boolean(session),
      userId: session?.user?.id ?? null,
      hasToken: Boolean(session?.access_token),
    });

    if (session?.access_token) {
      if (hasAuthCallbackInUrl()) {
        limparAuthCallbackDaUrl("/");
      }
      scheduleBirthCompletion(session, "boot");
    } else {
      setBirthCompletionState("skipped");
    }

    return session;
  })();

  return bootPromise;
}

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

export function installAuthBootstrapListener() {
  if (listenerInstalled) return () => {};

  listenerInstalled = true;
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const next = session ?? null;

    if (sessionsEquivalent(cachedSession, next)) {
      return;
    }

    setCachedSession(next);

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

      if (hasAuthCallbackInUrl()) {
        limparAuthCallbackDaUrl("/");
        setAuthCallbackError(null);
      }
      scheduleBirthCompletion(next, `event:${event}`);
    }

    if (event === "SIGNED_OUT") {
      clearIntroSessionFlags("signed_out");
      setAuthCallbackError(null);
    }

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

/** Apenas testes — reset de estado module-level. */
export function __resetAuthBootstrapForTests() {
  bootPromise = null;
  cachedSession = null;
  listenerInstalled = false;
  birthCompletionBootstrapInFlight = null;
  birthCompletionState = "idle";
  authCallbackError = null;
}
