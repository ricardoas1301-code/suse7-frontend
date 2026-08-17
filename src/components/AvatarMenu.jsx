// ======================================================================
// COMPONENTE: AvatarMenu
// Objetivo: Menu do usuário com LOGO DA EMPRESA + navegação do Perfil
// Padrão visual: ícones monocromáticos (lucide-react)
// ======================================================================

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext.jsx";
import ContactModal from "./ContactModal";
import AvatarProfileNavigation from "./Profile/AvatarProfileNavigation.jsx";
import AvatarMenuAuthEmail from "./AvatarMenuAuthEmail.jsx";
import { computeAvatarMenuAnchorPosition } from "./avatarMenuAnchor.js";
import "./AvatarMenu.css";
import { createPortal } from "react-dom";
import "./Avatar/Avatar.css";

import { MessageCircle, LogOut, Ticket } from "lucide-react";
import { PROFILE_TICKETS_COMING_SOON, PROFILE_TICKETS_MENU_ITEM } from "./Profile/profileNavigationTickets.js";
import SellerCompanyHeaderAvatar from "./Avatar/SellerCompanyHeaderAvatar.jsx";

export default function AvatarMenu({ empresaNome, logoUrl, interactionLocked = false }) {
  const [open, setOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(/** @type {{ top: number; right: number; maxHeight: number } | null} */ (null));
  const { user } = useAuthBootstrap();
  const authEmail = String(user?.email ?? "").trim();

  const menuRef = useRef(null);
  const portaledMenuRef = useRef(null);
  const triggerRef = useRef(null);
  const scrollRef = useRef(null);

  const navigate = useNavigate();

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const updateMenuAnchor = useCallback(() => {
    setMenuAnchor(computeAvatarMenuAnchorPosition(triggerRef.current));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuAnchor(null);
      return undefined;
    }
    updateMenuAnchor();
    window.addEventListener("resize", updateMenuAnchor);
    window.addEventListener("scroll", updateMenuAnchor, true);
    return () => {
      window.removeEventListener("resize", updateMenuAnchor);
      window.removeEventListener("scroll", updateMenuAnchor, true);
    };
  }, [open, updateMenuAnchor]);

  const keepMenuItemVisible = useCallback((event) => {
    const scrollEl = scrollRef.current;
    const target = event.currentTarget;
    if (!scrollEl || !(target instanceof HTMLElement)) return;

    const scrollRect = scrollEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (targetRect.top < scrollRect.top) {
      scrollEl.scrollTop -= scrollRect.top - targetRect.top + 8;
    } else if (targetRect.bottom > scrollRect.bottom) {
      scrollEl.scrollTop += targetRect.bottom - scrollRect.bottom + 8;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const root = menuRef.current;
      const menu = portaledMenuRef.current;
      const target = event.target;
      if (root?.contains(target) || menu?.contains(target)) return;
      closeMenu();
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeMenu]);

  const handleLogout = async () => {
    closeMenu();
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleProfileNavigate = useCallback(
    (route) => {
      closeMenu();
      navigate(route);
    },
    [closeMenu, navigate]
  );

  const menuPanel =
    open && menuAnchor
      ? createPortal(
          <div
            ref={portaledMenuRef}
            className="avatar-menu avatar-menu--open avatar-menu--anchored"
            role="menu"
            aria-label="Menu do perfil"
            style={{
              top: `${menuAnchor.top}px`,
              right: `${menuAnchor.right}px`,
              maxHeight: `${menuAnchor.maxHeight}px`,
            }}
          >
            <div className="avatar-menu-header">
              <SellerCompanyHeaderAvatar logoUrl={logoUrl} companyName={empresaNome} size="sm" />
              <div className="avatar-menu-identity">
                <div className="avatar-menu-company">{empresaNome || "Minha Empresa"}</div>
                <AvatarMenuAuthEmail email={authEmail} />
              </div>
            </div>

            <div className="avatar-menu-divider" />

            <div ref={scrollRef} className="avatar-menu-scroll">
              <AvatarProfileNavigation onNavigate={handleProfileNavigate} />

              <div className="avatar-menu-divider" role="separator" />

              <button
                type="button"
                className="avatar-menu-item avatar-menu-item--soon"
                role="menuitem"
                aria-disabled="true"
                disabled
                onFocus={keepMenuItemVisible}
              >
                <Ticket className="avatar-menu-icon" aria-hidden />
                <span>{PROFILE_TICKETS_MENU_ITEM.label}</span>
                {PROFILE_TICKETS_COMING_SOON ? (
                  <small className="avatar-menu-item__soon">Em breve</small>
                ) : null}
              </button>

              <button
                type="button"
                className="avatar-menu-item"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  setShowSupport(true);
                }}
                onFocus={keepMenuItemVisible}
              >
                <MessageCircle className="avatar-menu-icon" aria-hidden />
                <span>Suporte</span>
              </button>

              <div className="avatar-menu-divider" role="separator" />

              <button
                type="button"
                className="avatar-menu-item logout"
                role="menuitem"
                onClick={handleLogout}
                onFocus={keepMenuItemVisible}
              >
                <LogOut className="avatar-menu-icon" aria-hidden />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  useEffect(() => {
    if (interactionLocked && open) closeMenu();
  }, [interactionLocked, open, closeMenu]);

  const handleTriggerClick = () => {
    if (interactionLocked) return;
    setOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (event) => {
    if (!interactionLocked) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <>
      <div ref={menuRef} className={["avatar-menu-root", interactionLocked ? "avatar-menu-root--locked" : ""].filter(Boolean).join(" ")}>
        <button
          ref={triggerRef}
          type="button"
          className="logo-wrapper avatar-menu-trigger"
          data-tooltip="Perfil"
          aria-label="Abrir menu do perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={interactionLocked}
          tabIndex={interactionLocked ? -1 : undefined}
          aria-disabled={interactionLocked || undefined}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
        >
          <SellerCompanyHeaderAvatar logoUrl={logoUrl} companyName={empresaNome} size="sm" />
        </button>
      </div>

      {menuPanel}

      {showSupport &&
        createPortal(<ContactModal onClose={() => setShowSupport(false)} />, document.body)}
    </>
  );
}
