import { useState } from "react";
import { Link } from "react-router-dom";
import ContactModal from "../ContactModal";
import PublicBackLink from "./PublicBackLink.jsx";
import "./publicLegalPage.css";

export default function PublicLegalHeader() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function openContact() {
    closeMenu();
    setShowContactModal(true);
  }

  return (
    <>
      <header className="public-legal-header">
        <div className="public-legal-header__inner">
          <PublicBackLink to="/login" onClick={closeMenu} />

          <div className="public-legal-header__actions">
            <button
              type="button"
              className="public-legal-header__menu-btn"
              aria-expanded={menuOpen}
              aria-controls="public-legal-header-nav"
              aria-label={menuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="public-legal-header__menu-icon" aria-hidden="true" />
            </button>

            <nav
              id="public-legal-header-nav"
              className={`public-legal-header__nav${menuOpen ? " is-open" : ""}`}
              aria-label="Navegação pública"
            >
              <button type="button" className="public-legal-header__link public-legal-header__link--button" onClick={openContact}>
                Contato
              </button>
              <Link to="/login" className="public-legal-header__link" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/signup" className="public-legal-header__cta" onClick={closeMenu}>
                Teste grátis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {showContactModal ? <ContactModal onClose={() => setShowContactModal(false)} /> : null}
    </>
  );
}
