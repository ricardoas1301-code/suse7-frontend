import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";
import NotificationBell from "../../NotificationBell";
import AvatarMenu from "../../AvatarMenu";
import { DEV_CENTER_NAV_ITEMS } from "./devCenterNavItems";
import "./DevCenterTopNav.css";

/**
 * @param {{
 *   empresaNome: string;
 *   logoUrl: string;
 * }} props
 */
export default function DevCenterTopNav({ empresaNome, logoUrl }) {
  const location = useLocation();
  const drawerId = useId();
  const menuBtnRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  /** @param {{ isActive: boolean }} state */
  function topNavLinkClass({ isActive }) {
    return ["dc-topnav__link", isActive ? "dc-topnav__link--active" : ""].filter(Boolean).join(" ");
  }

  return (
    <header className="dc-topnav" data-mobile-open={mobileOpen ? "true" : "false"}>
      <div className="dc-topnav__bar">
        <div className="dc-topnav__brand">
          <Link to="/admin/dev-center" className="dc-topnav__brand-link">
            Dev Center
          </Link>
        </div>

        <button
          ref={menuBtnRef}
          type="button"
          className="dc-topnav__menu-btn"
          aria-expanded={mobileOpen}
          aria-controls={drawerId}
          aria-label={mobileOpen ? "Fechar menu Dev Center" : "Abrir menu Dev Center"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>

        <nav className="dc-topnav__menu" aria-label="Módulos Dev Center">
          {DEV_CENTER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={topNavLinkClass}
                aria-current={undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="dc-topnav__link-icon" aria-hidden />
                    <span aria-current={isActive ? "page" : undefined}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="dc-topnav__spacer" aria-hidden />

        <div className="dc-topnav__actions">
          <NotificationBell />
          <AvatarMenu empresaNome={empresaNome} logoUrl={logoUrl} />
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="dc-topnav__backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id={drawerId}
        className="dc-topnav__drawer"
        aria-label="Menu mobile Dev Center"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <nav className="dc-topnav__drawer-nav">
          {DEV_CENTER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  ["dc-topnav__drawer-link", isActive ? "dc-topnav__drawer-link--active" : ""]
                    .filter(Boolean)
                    .join(" ")
                }
                onClick={() => setMobileOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="dc-topnav__link-icon" aria-hidden />
                    <span aria-current={isActive ? "page" : undefined}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <Link to="/" className="dc-topnav__back-link" onClick={() => setMobileOpen(false)}>
          <ArrowLeft className="dc-topnav__back-icon" aria-hidden />
          <span>Voltar ao Suse7</span>
        </Link>
      </aside>
    </header>
  );
}
