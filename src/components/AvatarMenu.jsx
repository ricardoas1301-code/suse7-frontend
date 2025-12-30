// ======================================================================
// COMPONENTE: AvatarMenu
// Objetivo: Menu do usuário com LOGO DA EMPRESA
// Padrão visual: ícones monocromáticos (lucide-react)
// ======================================================================

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ContactModal from "./ContactModal";
import "./AvatarMenu.css";

// Ícones monocromáticos (mesmo padrão do menu superior)
import { Settings, MessageCircle, LogOut } from "lucide-react";

export default function AvatarMenu({ empresaNome, logoUrl }) {
  // ------------------------------------------------------------
  // States
  // ------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Referência do container (logo + dropdown)
  const menuRef = useRef(null);

  const navigate = useNavigate();

  // ------------------------------------------------------------
  // Fechar menu ao clicar fora do componente
  // ------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Container geral (logo + menu) */}
      <div ref={menuRef}>
        {/* Logo da empresa (clicável) */}
        <div
          className="logo-wrapper"
          onClick={() => setOpen((prev) => !prev)}
        >
          <img
            src={logoUrl || "/logo-default.png"}
            alt="Logo da empresa"
            className="company-logo"
          />
        </div>

        {/* Menu dropdown */}
        {open && (
          <div className="avatar-menu">
            {/* Cabeçalho do menu */}
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
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              <Settings className="avatar-menu-icon" />
              <span>Configurações</span>
            </button>

            {/* Suporte */}
            <button
              className="avatar-menu-item"
              onClick={() => {
                setOpen(false);
                setShowSupport(true);
              }}
            >
              <MessageCircle className="avatar-menu-icon" />
              <span>Suporte</span>
            </button>

            <div className="avatar-menu-divider" />

            {/* Logout */}
            <button
              className="avatar-menu-item logout"
              onClick={handleLogout}
            >
              <LogOut className="avatar-menu-icon" />
              <span>Sair da conta</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de suporte */}
      {showSupport && (
        <ContactModal onClose={() => setShowSupport(false)} />
      )}
    </>
  );
}
