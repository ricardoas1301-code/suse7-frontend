// ======================================================================
// Gate: autorização = GET /api/dev-center/bootstrap → data.allowed (backend é fonte de verdade)
// ======================================================================

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { devCenterBootstrap } from "../../services/devCenterApi";
import "./DevCenter.css";

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export default function DevCenterRoute({ children }) {
  const [phase, setPhase] = useState(/** @type {"loading" | "ok" | "deny"} */ ("loading"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await devCenterBootstrap();
      if (cancelled) return;
      if (!r.ok || !r.data?.allowed) {
        setPhase("deny");
        return;
      }
      setPhase("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <div className="dev-center dev-center--loading">
        <div className="dev-center__spinner" />
        <p className="dev-center__muted">Verificando acesso ao Dev Center…</p>
      </div>
    );
  }

  if (phase === "deny") {
    return <Navigate to="/" replace />;
  }

  return children;
}
