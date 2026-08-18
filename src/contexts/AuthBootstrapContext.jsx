import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
  installAuthBootstrapListener,
  markAuthBootstrapCompleted,
  subscribeAuthBootstrapSession,
  subscribeAuthCallbackError,
  subscribeBirthCompletionState,
  getBirthCompletionState,
  getAuthCallbackError,
} from "../auth/authBootstrapService";

/** @type {import("react").Context<{
 *   session: import("@supabase/supabase-js").Session | null;
 *   user: import("@supabase/supabase-js").User | null;
 *   accessToken: string | null;
 *   loading: boolean;
 *   ready: boolean;
 *   signedOut: boolean;
 *   birthCompletionState: string;
 *   callbackError: { code: string; message: string } | null;
 * } | null>} */
const AuthBootstrapContext = createContext(null);

export function AuthBootstrapProvider({ children }) {
  const [session, setSession] = useState(/** @type {import("@supabase/supabase-js").Session | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [birthCompletionState, setBirthCompletionState] = useState(getBirthCompletionState());
  const [callbackError, setCallbackError] = useState(getAuthCallbackError());

  useEffect(() => {
    let mounted = true;
    const uninstallListener = installAuthBootstrapListener();
    const unsubscribeBirth = subscribeBirthCompletionState((state) => {
      if (!mounted) return;
      setBirthCompletionState(state);
    });
    const unsubscribeCallbackError = subscribeAuthCallbackError((error) => {
      if (!mounted) return;
      setCallbackError(error);
    });

    const unsubscribe = subscribeAuthBootstrapSession((nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    (async () => {
      const bootSession = await ensureAuthSessionBootstrapped();
      if (!mounted) return;
      setSession(bootSession);
      setLoading(false);
      markAuthBootstrapCompleted();
    })();

    return () => {
      mounted = false;
      unsubscribe();
      unsubscribeBirth();
      unsubscribeCallbackError();
      uninstallListener();
    };
  }, []);

  const value = useMemo(() => {
    const accessToken = session?.access_token ?? getAuthBootstrapAccessToken();
    const ready = !loading && Boolean(accessToken) && birthCompletionState !== "running";
    const signedOut = !loading && !accessToken;

    return {
      session,
      user: session?.user ?? null,
      accessToken,
      loading,
      ready,
      signedOut,
      birthCompletionState,
      callbackError,
    };
  }, [session, loading, birthCompletionState, callbackError]);

  return <AuthBootstrapContext.Provider value={value}>{children}</AuthBootstrapContext.Provider>;
}

export function useAuthBootstrap() {
  const ctx = useContext(AuthBootstrapContext);
  if (!ctx) {
    throw new Error("useAuthBootstrap must be used within AuthBootstrapProvider");
  }
  return ctx;
}
