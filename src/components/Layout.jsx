// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileOnboardingModal from './ProfileOnboardingModal';
import ThemeToggle from "./ThemeToggle";

const Layout = () => {
  const [showCompletarCadastro, setShowCompletarCadastro] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('...');
  const location = useLocation();

  // -----------------------------------------------------
  // Carregar perfil do usuário
  // -----------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Se for primeiro login → abre o modal
      if (profileData?.primeiro_login === true) {
        setShowCompletarCadastro(true);
      }
    }

    loadProfile();
  }, []);

  // -----------------------------------------------------
  // Capturar nome/e-mail do usuário
  // -----------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const namePart = user.email ? user.email.split('@')[0] : 'Usuário';
        const formattedName = namePart.split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        setUserEmail(formattedName);
      } else {
        setUserEmail('Convidado');
      }
    };

    fetchUser();
  }, []);

  // -----------------------------------------------------
  // Tema salvo (Dark / Light)
  // -----------------------------------------------------
  useEffect(() => {
    const savedTheme = localStorage.getItem("s7-theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // -----------------------------------------------------
  // Logout
  // -----------------------------------------------------
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
      alert('Não foi possível sair: ' + error.message);
    }
  };

  const navItems = [
  { path: '/', label: 'Painel' },
  { path: '/produtos', label: 'Produtos' },
  { path: '/anuncios', label: 'Anúncios' },
  { path: '/precificacoes', label: 'Precificações' }, // ✅ novo link
  { path: '/monitoramento', label: 'Monitoramento' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/registros', label: 'Registros' },
  { path: '/configuracoes', label: 'Configurações' },
];

  return (
    <div className="app-container">

      {/* Modal de completar cadastro */}
      {showCompletarCadastro && (
        <ProfileOnboardingModal
          profile={profile}
          onClose={() => setShowCompletarCadastro(false)}
        />
      )}

      {/* -------------------- Navbar -------------------- */}
      <nav className="navbar-premium">

        {/* Logo */}
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <div className="logo-circle">S7</div>
            <span className="logo-title">Suse7</span>
          </Link>
        </div>

        {/* Menu */}
        <div className="nav-center">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Usuário */}
        <div className="nav-right">
  <span className="user-name">Olá, {userEmail}!</span>
  <button className="logout-btn" onClick={handleLogout}>Sair</button>
</div>

      </nav>

      {/* -------------------- Conteúdo -------------------- */}
      <div className="page-container" style={{ flex: 1, width: "100%", overflowY: "auto" }}>
  <div className="page-content" style={{ padding: "20px" }}>
    <Outlet />
  </div>
</div>


    </div>
  );
};

export default Layout;
