// ======================================================================
// Dev Center — Admin Shell (Top Nav)
// Navegação superior — ganho de largura útil vs sidebar
// ======================================================================

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import DevCenterTopNav from "../../components/devCenter/layout/DevCenterTopNav";
import { resolveDevCenterActiveNavItem } from "../../components/devCenter/layout/devCenterNavItems";
import "./DevCenterShell.css";
import "./DevCenterModules.css";

export default function DevCenterShell() {
  const location = useLocation();
  const [empresaNome, setEmpresaNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("profiles").select("nome_loja, photo_url").eq("id", user.id).single();

      if (data) {
        setEmpresaNome(data.nome_loja || "");
        setLogoUrl(data.photo_url || "");
      }
    };

    loadProfile();
  }, []);

  const activeItem = resolveDevCenterActiveNavItem(location.pathname);

  return (
    <div className="dc-shell dc-shell--topnav">
      <DevCenterTopNav empresaNome={empresaNome} logoUrl={logoUrl} />

      <div className="dc-shell__body">
        <header className="dc-shell__header">
          <div className="dc-shell__header-main">
            <nav className="dc-shell__breadcrumb" aria-label="Breadcrumb">
              <Link to="/admin/dev-center">Dev Center</Link>
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
