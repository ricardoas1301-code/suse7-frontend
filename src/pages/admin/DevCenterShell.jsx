// ======================================================================
// Central de Controle — Admin Shell (Top Nav)
// Navegação superior — ganho de largura útil vs sidebar
// ======================================================================

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { fetchUserProfileSummary } from "../../services/userProfileApi.js";
import DevCenterTopNav from "../../components/devCenter/layout/DevCenterTopNav";
import { resolveDevCenterActiveNavItem } from "../../components/devCenter/layout/devCenterNavItems";
import "./DevCenterShell.css";
import "./DevCenterModules.css";

export default function DevCenterShell() {
  const location = useLocation();
  const { ready: authReady } = useAuthBootstrap();
  const [empresaNome, setEmpresaNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (!authReady) return;

    const loadProfile = async () => {
      try {
        const res = await fetchUserProfileSummary();
        if (res.ok) {
          setEmpresaNome(res.nome_loja || res.display_name || "");
          setLogoUrl(res.photo_url || "");
        }
      } catch {
        setEmpresaNome("");
        setLogoUrl("");
      }
    };

    void loadProfile();
  }, [authReady]);

  const activeItem = resolveDevCenterActiveNavItem(location.pathname);

  return (
    <div className="dc-shell dc-shell--topnav">
      <DevCenterTopNav empresaNome={empresaNome} logoUrl={logoUrl} />

      <div className="dc-shell__body">
        <header className="dc-shell__header">
          <div className="dc-shell__header-main">
            <nav className="dc-shell__breadcrumb" aria-label="Breadcrumb">
              <Link to="/admin/dev-center">Central de Controle</Link>
              <span className="dc-shell__breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="dc-shell__breadcrumb-current">{activeItem.label}</span>
            </nav>
            <h1 className="dc-shell__header-title">{activeItem.label}</h1>
          </div>
        </header>

        <main className="dc-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
