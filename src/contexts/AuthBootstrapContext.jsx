import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
  installAuthBootstrapListener,
  markAuthBootstrapCompleted,
  subscribeAuthBootstrapSession,
} from "../auth/authBootstrapService";

/** @type {import("react").Context<{
 *   session: import("@supabase/supabase-js").Session | null;
 *   user: import("@supabase/supabase-js").User | null;
 *   accessToken: string | null;
 *   loading: boolean;
 *   ready: boolean;
 *   signedOut: boolean;
 * } | null>} */
const AuthBootstrapContext = createContext(null);

export function AuthBootstrapProvider({ children }) {
  const [session, setSession] = useState(/** @type {import("@supabase/supabase-js").Session | null} */ (null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const uninstallListener = installAuthBootstrapListener();

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
      uninstallListener();
    };
  }, []);

  const value = useMemo(() => {
    const accessToken = session?.access_token ?? getAuthBootstrapAccessToken();
    const ready = !loading && Boolean(accessToken);
    const signedOut = !loading && !accessToken;

    return {
      session,
      user: session?.user ?? null,
      accessToken,
      loading,
      ready,
      signedOut,
    };
  }, [session, loading]);

  return <AuthBootstrapContext.Provider value={value}>{children}</AuthBootstrapContext.Provider>;
}

export function useAuthBootstrap() {
  const ctx = useContext(AuthBootstrapContext);
  if (!ctx) {
    throw new Error("useAuthBootstrap must be used within AuthBootstrapProvider");
  }
  return ctx;
}
