import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
  installAuthBootstrapListener,
  markAuthBootstrapCompleted,
  subscribeAuthBootstrapSession,
} from "../auth/authBootstrapService";
import { logAuthBootstrap } from "../auth/authBootstrapDevLog";
import { logPlanPermissionsLoadingGuard } from "../billing/dev/planPermissionsLoadingGuardDevLog";

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

    /** @type {ReturnType<typeof setTimeout> | null} */
    let authBootstrapTimeout = null;

    (async () => {
      authBootstrapTimeout = setTimeout(() => {
        if (!mounted) return;
        setLoading((current) => {
          if (!current) return current;
          logAuthBootstrap("boot_timeout", {
            timeout_ms: import.meta.env.DEV ? 8_000 : 15_000,
          });
          logPlanPermissionsLoadingGuard({
            status: null,
            duration_ms: import.meta.env.DEV ? 8_000 : 15_000,
            error_message: "auth_bootstrap_timeout",
            fallback_applied: import.meta.env.DEV && Boolean(getAuthBootstrapAccessToken()),
            user_session: getAuthBootstrapAccessToken() ? "present" : "absent",
            trigger: "auth_bootstrap_timeout",
          });
          return false;
        });
      }, import.meta.env.DEV ? 8_000 : 15_000);

      const bootSession = await ensureAuthSessionBootstrapped();
      if (!mounted) return;
      if (authBootstrapTimeout != null) clearTimeout(authBootstrapTimeout);
      setSession(bootSession);
      setLoading(false);
      markAuthBootstrapCompleted();
    })();

    return () => {
      mounted = false;
      if (authBootstrapTimeout != null) clearTimeout(authBootstrapTimeout);
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
