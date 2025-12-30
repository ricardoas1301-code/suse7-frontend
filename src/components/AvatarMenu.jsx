// ======================================================================
// COMPONENTE: AvatarMenu
// Objetivo: Menu do usuário com LOGO DA EMPRESA
// ======================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ContactModal from "./ContactModal";
import "./AvatarMenu.css";

export default function AvatarMenu({ empresaNome, logoUrl }) {
  // ------------------------------------------------------------
  // States
  // ------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const navigate = useNavigate();

  // ------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Logo da empresa (clicável) */}
      <div className="logo-wrapper" onClick={() => setOpen(!open)}>
        <img
          src={logoUrl || "/logo-default.png"}
          alt="Logo da empresa"
          className="company-logo"
        />
      </div>

      {/* Menu */}
      {open && (
        <div className="avatar-menu">
          {/* Header */}
          <div className="avatar-menu-header">
            <img
              src={logoUrl || "/logo-default.png"}
              alt="Logo da empresa"
              className="avatar-menu-img"
            />
            <div className="avatar-menu-company">
              {empresaNome || "Minha Empresa"}
            </div>
          </div>

          <div className="avatar-menu-divider" />

          {/* Configurações */}
          <button
            className="avatar-menu-item"
            onClick={() => navigate("/profile")}
          >
            ⚙️ <span>Configurações</span>
          </button>

          {/* Suporte */}
          <button
            className="avatar-menu-item"
            onClick={() => setShowSupport(true)}
          >
            💬 <span>Suporte</span>
          </button>

          <div className="avatar-menu-divider" />

          {/* Logout */}
          <button
            className="avatar-menu-item logout"
            onClick={handleLogout}
          >
            🚪 <span>Sair da conta</span>
          </button>
        </div>
      )}

      {showSupport && (
        <ContactModal onClose={() => setShowSupport(false)} />
      )}
    </>
  );
}
