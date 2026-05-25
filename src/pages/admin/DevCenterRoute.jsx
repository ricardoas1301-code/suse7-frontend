// ======================================================================
// Gate S_4.8.3: bootstrap.allowed — sem render de dados antes da autorização
// ======================================================================

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { devCenterBootstrap } from "../../services/devCenterApi";
import {
  bindDevCenterGlobalDetailCacheUser,
  clearDevCenterGlobalDetailCache,
} from "./devCenterGlobalDetailCache.js";
import "./DevCenter.css";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export default function DevCenterRoute({ children }) {
  const [phase, setPhase] = useState(/** @type {"loading" | "ok" | "deny"} */ ("loading"));

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setPhase("loading");
      const r = await devCenterBootstrap();
      if (cancelled) return;

      if (!r.ok || !r.data?.allowed) {
        clearDevCenterGlobalDetailCache();
        bindDevCenterGlobalDetailCacheUser(null);
        setPhase("deny");
        return;
      }

      bindDevCenterGlobalDetailCacheUser(r.data?.user_id);
      setPhase("ok");
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <div className="dev-center dev-center--loading dev-center--gate" role="status" aria-live="polite">
        <div className="dev-center__spinner" aria-hidden="true" />
        <p className="dev-center__muted">Verificando acesso ao Dev Center…</p>
      </div>
    );
  }

  if (phase === "deny") {
    return <Navigate to="/" replace />;
  }

  return children;
}
