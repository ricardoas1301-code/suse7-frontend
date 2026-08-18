// ======================================================================
// Itens dinâmicos — Central de Notificações (menu do Perfil)
// ======================================================================

import {
  listNotificationCenterNavSections,
  notificationCenterSectionRoute,
  NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES,
  notificationCenterCanonicalSlug,
} from "../../constants/notificationCenterSections.js";

/** @typedef {import("./profileNavigationActive.js").ProfileNavItem} ProfileNavItem */

/** @returns {ProfileNavItem[]} */
export function buildProfileNotificationCenterNavItems() {
  return listNotificationCenterNavSections().map((section) => ({
    id: `notification-center-${section.key}`,
    label: section.label,
    route: notificationCenterSectionRoute(section),
    nested: true,
    isActive: ({ pathname }) => {
      const route = notificationCenterSectionRoute(section);
      const canonical = notificationCenterCanonicalSlug(section);
      const legacyRoutes = Object.entries(NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES)
        .filter(([, target]) => target === canonical)
        .map(([legacy]) => `/perfil/preferencias/notificacoes/${legacy}`);
      const candidates = [route, ...legacyRoutes];
      return candidates.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    },
  }));
}
