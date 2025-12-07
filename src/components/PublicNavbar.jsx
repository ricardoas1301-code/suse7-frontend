// ======================================================================
// PUBLIC NAVBAR — Cabeçalho das páginas públicas
// Inclui: Logo, Contato (abre modal), Login e Teste grátis
// ======================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import ContactModal from "../components/ContactModal";
import SuseLogo from "../assets/suse7-logo-redonda.png";

export default function PublicNavbar() {

  // --------------------------------------------------------------
  // CONTROLE DO MODAL DE CONTATO (ABRE / FECHA)
  // --------------------------------------------------------------
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      {/* ==========================================================
          NAVBAR
      ========================================================== */}
      <div
        className="public-navbar"
          
      > 
        {/* LOGO ESQUERDA */}
        <img src={SuseLogo} alt="Suse7" className="public-navbar-logo" />

        {/* MENU DIREITA */}
        <nav className="public-navbar-menu">

          {/* LINK CONTATO — abre modal */}
          <span
          className="public-navbar-link"
          onClick={(e) => {
          e.preventDefault();         // impede navegação
          e.stopPropagation();        // impede propagação
          setShowContactModal(true);  // abre modal
  }}
>
       Contato 
</span>


          {/* LOGIN */}
          <Link to="/login" className="public-navbar-link">
            Login
          </Link>

          {/* TESTE GRÁTIS */}
          <Link to="/signup" className="public-navbar-btn">
            Teste grátis
          </Link>
        </nav>
      </div>

      {/* ==========================================================
          MODAL DE CONTATO
          Só aparece se showContactModal === true
      ========================================================== */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  );
}
