// ======================================================================
// Gate Central de Controle — bootstrap.allowed (S_4.8.3 + correção hidratação S_5)
// Aguarda sessão Supabase antes de avaliar; só redireciona em deny explícito.
// ======================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { refreshAuthBootstrapSession } from "../../auth/authBootstrapService";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { devCenterBootstrap } from "../../services/devCenterApi";import { logDevCenterAuth } from "./devCenterAuthDevLog";
import {
  bindDevCenterGlobalDetailCacheUser,
  clearDevCenterGlobalDetailCache,
} from "./devCenterGlobalDetailCache.js";
import "./DevCenter.css";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export default function DevCenterRoute({ children }) {
  const { loading: authLoading, session } = useAuthBootstrap();
  const [phase, setPhase] = useState(    /** @type {"auth_loading" | "verifying" | "ok" | "deny" | "error"} */ ("auth_loading"),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const verifyGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  const applyBootstrapResult = useCallback((result, userId) => {
    if (!result.ok) {
      logDevCenterAuth("permission_evaluated", {
        result: "error",
        user_id: userId ?? null,
        status: result.status,
        error: result.error ?? null,
        loading: false,
      });
      setErrorMessage(result.error || "Não foi possível verificar o acesso ao Central de Controle.");
      setPhase("error");
      return;
    }

    const allowed = Boolean(result.data?.allowed);
    logDevCenterAuth("profile_loaded", {
      user_id: result.data?.user_id ?? userId ?? null,
      role: result.data?.is_admin ? "admin" : result.data?.allowlist_email ? "allowlist" : "none",
      is_admin: Boolean(result.data?.is_admin),
      allowlist_email: Boolean(result.data?.allowlist_email),
      allowed,
      loading: false,
    });

    if (!allowed) {
      logDevCenterAuth("permission_evaluated", {
        result: "deny",
        user_id: result.data?.user_id ?? userId ?? null,
        role: result.data?.is_admin ? "admin" : result.data?.allowlist_email ? "allowlist" : "none",
        loading: false,
        reason: "bootstrap_allowed_false",
      });
      logDevCenterAuth("redirect_triggered", {
        user_id: result.data?.user_id ?? userId ?? null,
        reason: "forbidden",
      });
      clearDevCenterGlobalDetailCache();
      bindDevCenterGlobalDetailCacheUser(null);
      setPhase("deny");
      return;
    }

    logDevCenterAuth("permission_evaluated", {
      result: "allow",
      user_id: result.data?.user_id ?? userId ?? null,
      role: result.data?.is_admin ? "admin" : result.data?.allowlist_email ? "allowlist" : "none",
      loading: false,
      reason: result.data?.is_admin ? "admin" : "allowlist",
    });

    bindDevCenterGlobalDetailCacheUser(result.data?.user_id ?? userId ?? null);
    setErrorMessage("");
    setPhase("ok");
  }, []);

  const verifyAccess = useCallback(
    async (session, source) => {
      const generation = ++verifyGenerationRef.current;
      const userId = session?.user?.id ?? null;
      const hasToken = Boolean(session?.access_token);

      logDevCenterAuth("session_loaded", {
        source,
        user_id: userId,
        hasSession: Boolean(session),
        hasToken,
      });

      if (!hasToken) {
        if (mountedRef.current && generation === verifyGenerationRef.current) {
          setPhase("auth_loading");
        }
        return;
      }

      if (mountedRef.current && generation === verifyGenerationRef.current) {
        setPhase("verifying");
      }

      const result = await devCenterBootstrap();
      if (!mountedRef.current || generation !== verifyGenerationRef.current) return;

      applyBootstrapResult(result, userId);
    },
    [applyBootstrapResult],
  );

  useEffect(() => {
    mountedRef.current = true;
    logDevCenterAuth("route_enter", { path: window.location.pathname });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      setPhase("auth_loading");
      return;
    }

    if (!session?.access_token) {
      clearDevCenterGlobalDetailCache();
      bindDevCenterGlobalDetailCacheUser(null);
      setPhase("deny");
      return;
    }

    verifyAccess(session, "auth_bootstrap");
  }, [authLoading, session, verifyAccess]);
  const retryVerify = useCallback(async () => {
    setPhase("verifying");
    setErrorMessage("");
    const refreshedSession = await refreshAuthBootstrapSession("dev_center_retry");
    verifyAccess(refreshedSession, "retry");
  }, [verifyAccess]);
  if (phase === "auth_loading" || phase === "verifying") {
    return (
      <div className="dev-center dev-center--loading dev-center--gate" role="status" aria-live="polite">
        <div className="dev-center__spinner" aria-hidden="true" />
        <p className="dev-center__muted">Verificando acesso ao Central de Controle…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="dev-center dev-center--gate dev-center--gate-error" role="alert">
        <p className="dev-center__muted">{errorMessage}</p>
        <button type="button" className="dev-center__retry-btn" onClick={retryVerify}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (phase === "deny") {
    return <Navigate to="/" replace />;
  }

  return children;
}
