// src/components/Layout.jsx
// ======================================================================
// LAYOUT — SUSE7 (PADRÃO GLOBAL DO APP)
// Responsável apenas pela estrutura visual (Navbar + Conteúdo)
// ======================================================================

import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Layout.css";

// ---------------- Ícones do menu central ----------------
import {
  LayoutDashboard,
  Box,
  Tag,
  Calculator,
  Activity,
  BarChart3,
  FileText,
} from "lucide-react";

// ---------------- Assets ----------------
import suse7Logo from "../assets/suse7-logo-redonda.png";

// ---------------- Componentes ----------------
import NotificationBell from "./NotificationBell";
import AvatarMenu from "./AvatarMenu";

export default function Layout() {
  // -----------------------------------------------------
  // States de dados da empresa (vindos do profiles)
  // -----------------------------------------------------
  const [empresaNome, setEmpresaNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const location = useLocation();

  // -----------------------------------------------------
// Buscar dados da empresa logada (profiles)
// -----------------------------------------------------
useEffect(() => {
  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("nome_loja, photo_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setEmpresaNome(data.nome_loja || "");
      setLogoUrl(data.photo_url || "");
    }
  };

  loadProfile();

  const handleLogoUpdate = () => loadProfile();
  window.addEventListener("logoUpdated", handleLogoUpdate);

  return () => {
    window.removeEventListener("logoUpdated", handleLogoUpdate);
  };
}, []);

  // -----------------------------------------------------
  // Itens do menu central
  // -----------------------------------------------------
  const navItems = [
    { path: "/", label: "Painel", icon: LayoutDashboard },
    { path: "/produtos", label: "Produtos", icon: Box },
    { path: "/anuncios", label: "Anúncios", icon: Tag },
    { path: "/precificacoes", label: "Precificações", icon: Calculator },
    { path: "/monitoramento", label: "Monitoramento", icon: Activity },
    { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { path: "/registros", label: "Registros", icon: FileText },
  ];

  // -----------------------------------------------------
  // Flag: telas de cadastro/edição de produto (full-bleed)
  // -----------------------------------------------------
  const isProductForm =
    location.pathname.startsWith("/produtos/novo") ||
    /^\/produtos\/[^/]+$/.test(location.pathname);

  return (
    <div className={`app-container ${isProductForm ? "app-container--pf-bleed" : ""}`}>
      {/* ===================== NAVBAR ===================== */}
      <nav className="navbar-premium">
        {/* Logo Suse7 */}
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <img src={suse7Logo} alt="Suse7" className="nav-logo-img" />
          </Link>
        </div>

        {/* Menu central */}
        <div className="nav-center">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
className={`nav-item ${
  item.path === "/produtos"
    ? location.pathname.startsWith("/produtos")
      ? "active"
      : ""
    : location.pathname === item.path
      ? "active"
      : ""
}`}

              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Menu da empresa (sino + logo + dropdown) */}
        <div className="nav-right">
          <NotificationBell />
          <AvatarMenu
            empresaNome={empresaNome}
            logoUrl={logoUrl}
          />
        </div>
      </nav>

      {/* ===================== CONTEÚDO ===================== */}
      <main className={`page-content ${isProductForm ? "page-content--pf-bleed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
