// ======================================================================
// Itens dinâmicos — Preferências (notificações e alertas pop-up)
// ======================================================================

import {
  NOTIFICATION_CATEGORY_TABS,
  POPUP_ALERTS_CATEGORY_TABS,
} from "../../constants/notificationPreferences.js";

/** @typedef {import("./profileNavigationActive.js").ProfileNavItem} ProfileNavItem */

/** @param {string} search @param {string} key */
function searchParamEquals(search, key, value) {
  return new URLSearchParams(search).get(key) === value;
}

/** @param {string} search @param {string} key */
function searchParamHas(search, key) {
  return new URLSearchParams(search).has(key);
}

/** @returns {ProfileNavItem[]} */
export function buildProfilePreferenciasNavItems() {
  /** @type {ProfileNavItem[]} */
  const items = [
    {
      id: "notifications-hub",
      label: "Central de notificações",
      route: "/perfil/preferencias/notificacoes",
      isActive: ({ pathname, search }) =>
        pathname === "/perfil/preferencias/notificacoes" &&
        !searchParamHas(search, "tab") &&
        !searchParamHas(search, "focus"),
    },
    {
      id: "notifications-recipients",
      label: "Destinatários de notificações",
      route: "/perfil/preferencias/notificacoes?tab=recipients",
      nested: true,
      isActive: ({ pathname, search }) =>
        pathname === "/perfil/preferencias/notificacoes" &&
        searchParamEquals(search, "tab", "recipients"),
    },
    {
      id: "notifications-history",
      label: "Histórico de notificações",
      route: "/perfil/preferencias/notificacoes/historico",
      nested: true,
      isActive: ({ pathname }) => pathname === "/perfil/preferencias/notificacoes/historico",
    },
  ];

  for (const tab of NOTIFICATION_CATEGORY_TABS) {
    items.push({
      id: `notifications-focus-${tab.key}`,
      label: tab.label,
      route: `/perfil/preferencias/notificacoes?focus=${tab.key}`,
      nested: true,
      isActive: ({ pathname, search }) =>
        pathname === "/perfil/preferencias/notificacoes" &&
        searchParamEquals(search, "focus", tab.key),
    });
  }

  for (const tab of POPUP_ALERTS_CATEGORY_TABS) {
    items.push({
      id: `popup-alerts-${tab.key}`,
      label: tab.label,
      route: `/perfil/preferencias/alertas-pop-up/${tab.key}`,
      nested: true,
      isActive: ({ pathname }) =>
        pathname === `/perfil/preferencias/alertas-pop-up/${tab.key}` ||
        pathname.startsWith(`/perfil/preferencias/alertas-pop-up/${tab.key}/`),
    });
  }

  return items;
}
