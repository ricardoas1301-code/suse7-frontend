// src/components/Navbar.jsx (VERSÃO FINAL COM LOGOUT)

import React from 'react';
import { Link } from 'react-router-dom';

// 1. O componente agora aceita a função 'onLogout' como propriedade
const Navbar = ({ onLogout }) => {
  return (
    <nav className="navbar navbar-base44">
      
      {/* 1. Logo e Título Lateral */}
      <div className="navbar-left">
        <Link to="/" className="app-logo">
          <span role="img" aria-label="Logo">📊</span>
          <div className="logo-text">
            <h3>Suse7</h3>
            <p>Gestão de Anúncios</p>
          </div>
        </Link>
      </div>
      
      {/* 2. Links Centrais (Menu Principal) */}
      <ul className="navbar-menu">
        <li><Link to="/">Painel</Link></li>
        <li><Link to="/produtos">Produtos</Link></li>
        <li><Link to="/anuncios">Anúncios</Link></li>
        <li><Link to="/monitoramento">Monitoramento</Link></li>
        <li><Link to="/relatorios">Relatórios</Link></li>
        <li><Link to="/registros">Registros</Link></li>
      </ul>
      
      {/* 3. Usuário e Configurações */}
      <div className="navbar-right">
        <Link to="/configuracoes" className="nav-icon">⚙️</Link>
        <div className="user-profile">
          <span className="user-icon">R</span>
          <span>Ricardo Alexandre</span>
        </div>

        {/* 4. BOTÃO DE SAIR (Logout) */}
        {/* Adicionamos a classe btn-logout para estilizarmos no App.css */}
        <button onClick={onLogout} className="btn-logout">
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Navbar;