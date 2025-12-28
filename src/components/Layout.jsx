// src/components/Layout.jsx
// ======================================================================
// LAYOUT — SUSE7 (PADRÃO GLOBAL DO APP)
// Responsável apenas pela estrutura visual (Navbar + Conteúdo)
// ======================================================================

import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Layout.css";

// Asset da logo
import suse7Logo from "../assets/suse7-logo-redonda.png";

export default function Layout() {
  const [userName, setUserName] = useState("...");
  const location = useLocation();
  const navigate = useNavigate();

  // -----------------------------------------------------
  // Carregar usuário logado (nome amigável)
  // -----------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setUserName("Usuário");
        return;
      }

      const namePart = user.email.split("@")[0];
      const formatted = namePart
        .split(".")
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

      setUserName(formatted);
    };

    fetchUser();
  }, []);

  // -----------------------------------------------------
  // Logout
  // -----------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Painel" },
    { path: "/produtos", label: "Produtos" },
    { path: "/anuncios", label: "Anúncios" },
    { path: "/precificacoes", label: "Precificações" },
    { path: "/monitoramento", label: "Monitoramento" },
    { path: "/relatorios", label: "Relatórios" },
    { path: "/registros", label: "Registros" },
    { path: "/configuracoes", label: "Configurações" },
  ];

  return (
    <div className="app-container">

      {/* ===================== NAVBAR ===================== */}
      <nav className="navbar-premium">

        {/* Logo */}
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <img src={suse7Logo} alt="Suse7" className="nav-logo-img" />
          </Link>
        </div>

        {/* Menu */}
        <div className="nav-center">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Usuário */}
        <div className="nav-right">

          <span className="user-name">{userName}</span>

          <div
            className="s7-profile-area"
            onClick={() => navigate("/perfil")}
          >
            <div className="s7-profile-avatar">
              <span className="s7-profile-initials">
                {userName.charAt(0)}
              </span>
            </div>

            <div className="s7-profile-tooltip">
              Perfil
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Sair
          </button>

        </div>
      </nav>

      {/* ===================== CONTEÚDO ===================== */}
      <main className="page-content">
        <Outlet />
      </main>

    </div>
  );
}
