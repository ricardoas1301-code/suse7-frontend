// src/components/Layout.jsx
// ======================================================================
// LAYOUT — SUSE7 (PADRÃO GLOBAL DO APP)
// Responsável apenas pela estrutura visual (Navbar + Conteúdo)
// ======================================================================

import { useEffect, useState, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Layout.css";


// IMPORTAR ICONES DO MENU SUPERIOR
import {
  LayoutDashboard,
  Box,
  Tag,
  Calculator,
  Activity,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";


// Asset da logo
import suse7Logo from "../assets/suse7-logo-redonda.png";

export default function Layout() {
  const [userName, setUserName] = useState("...");
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // -----------------------------------------------------
  // Carregar usuário logado (nome amigável)
  // -----------------------------------------------------

   // -----------------------------------------------------
// Fechar menu do usuário ao clicar fora
// -----------------------------------------------------
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(event.target)
    ) {
      setUserMenuOpen(false);
    }
  };

  if (userMenuOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [userMenuOpen]);



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
{ path: "/", label: "Painel", icon: LayoutDashboard },
  { path: "/produtos", label: "Produtos", icon: Box },
  { path: "/anuncios", label: "Anúncios", icon: Tag },
  { path: "/precificacoes", label: "Precificações", icon: Calculator },
  { path: "/monitoramento", label: "Monitoramento", icon: Activity },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/registros", label: "Registros", icon: FileText },
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
          {navItems.map(item => {
          const Icon = item.icon;

            return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${
          location.pathname === item.path ? "active" : ""
          }`}
          >
          <Icon className="nav-icon" />
          <span>{item.label}</span>
         </Link>
          );
          })}
        </div>

        {/* Usuário */}
        <div className="nav-right">
           <span className="user-name">{userName}</span>
          <div
            className="s7-profile-area"
            ref={userMenuRef}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
          <div className="s7-profile-avatar">
            <span className="s7-profile-initials">
              {userName.charAt(0)}
          </span>
          </div>

          {userMenuOpen && (
          <div className="s7-user-menu">
          <button onClick={() => navigate("/perfil")}>
            Configurações
          </button>
          <button className="danger" onClick={handleLogout}>
          Sair da conta
          </button>
        </div>
    )}
  </div>

</div>

      </nav>

      {/* ===================== CONTEÚDO ===================== */}
      <main className="page-content">
        <Outlet />
      </main>

    </div>
  );
}
