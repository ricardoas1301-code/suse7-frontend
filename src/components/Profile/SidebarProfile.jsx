// ======================================================================
// SIDEBAR DO PERFIL
// ======================================================================

import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./SidebarProfile.css";
import {
  NOTIFICATION_CATEGORY_TABS,
  POPUP_ALERTS_CATEGORY_TABS,
} from "../../constants/notificationPreferences";

export default function SidebarProfile() {
  const location = useLocation();
  const notificationsOpen = location.pathname.startsWith("/perfil/preferencias/notificacoes");
  const popupAlertsOpen = location.pathname.startsWith("/perfil/preferencias/alertas-pop-up");
  const [expandedSections, setExpandedSections] = useState({
    notifications: notificationsOpen,
    popupAlerts: popupAlertsOpen,
  });

  useEffect(() => {
    if (notificationsOpen) {
      setExpandedSections((prev) => ({ ...prev, notifications: true }));
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (popupAlertsOpen) {
      setExpandedSections((prev) => ({ ...prev, popupAlerts: true }));
    }
  }, [popupAlertsOpen]);

  const toggleSection = (sectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  return (
    <aside className="sidebar-profile">
      <h3 className="sidebar-title">Minha Conta</h3>

      <NavLink to="/perfil/dados-empresa">
        Perfil da Empresa
      </NavLink>

      <NavLink to="/perfil/alterar-senha">
        Alterar Senha
      </NavLink>

      <h3 className="sidebar-title">Integrações</h3>

      <NavLink to="/perfil/integracoes/mercado-livre">
        Mercado Livre
      </NavLink>

      <h3 className="sidebar-title">Assinatura</h3>

      <NavLink to="/perfil/assinatura/minha-assinatura">
        Minha assinatura
      </NavLink>

      <NavLink to="/perfil/assinatura/planos">
        Planos
      </NavLink>

      <NavLink to="/perfil/assinatura/formas-de-pagamento">
        Formas de pagamento
      </NavLink>

      <NavLink to="/perfil/assinatura/historico">
        Histórico de pagamentos
      </NavLink>

      <h3 className="sidebar-title">Preferências</h3>

      <button
        type="button"
        className={`sidebar-group-toggle ${notificationsOpen ? "active" : ""}`}
        onClick={() => toggleSection("notifications")}
        aria-expanded={expandedSections.notifications}
      >
        Notificações
      </button>
      <div className={`sidebar-submenu ${expandedSections.notifications ? "is-open" : ""}`}>
        <NavLink
          to="/perfil/preferencias/notificacoes"
          end
          className={({ isActive }) => `sidebar-submenu__link${isActive ? " active" : ""}`}
        >
          Central de notificações
        </NavLink>
        <NavLink
          to="/perfil/preferencias/notificacoes?tab=recipients"
          className={({ isActive }) => `sidebar-submenu__link${isActive ? " active" : ""}`}
        >
          Destinatários de notificações
        </NavLink>
        <NavLink
          to="/perfil/preferencias/notificacoes/historico"
          className={({ isActive }) => `sidebar-submenu__link${isActive ? " active" : ""}`}
        >
          Histórico de notificações
        </NavLink>
        {NOTIFICATION_CATEGORY_TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={`/perfil/preferencias/notificacoes?focus=${tab.key}`}
            className={({ isActive }) =>
              `sidebar-submenu__link${isActive ? " active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <button
        type="button"
        className={`sidebar-group-toggle ${popupAlertsOpen ? "active" : ""}`}
        onClick={() => toggleSection("popupAlerts")}
        aria-expanded={expandedSections.popupAlerts}
      >
        Alertas pop-up
      </button>
      <div className={`sidebar-submenu ${expandedSections.popupAlerts ? "is-open" : ""}`}>
        {POPUP_ALERTS_CATEGORY_TABS.map((tab) => (
          <NavLink
            key={`popup-${tab.key}`}
            to={`/perfil/preferencias/alertas-pop-up/${tab.key}`}
            className={({ isActive }) =>
              `sidebar-submenu__link${isActive ? " active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
