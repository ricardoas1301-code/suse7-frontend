import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Globe,
  Flag,
  Ticket,
  Wrench,
} from "lucide-react";

/** @typedef {{ to: string; end?: boolean; label: string; icon: import("react").ComponentType<{ className?: string; "aria-hidden"?: boolean }> }} DevCenterNavItem */

/** Menu superior oficial — ordem fixa UX refino top nav */
export const DEV_CENTER_NAV_ITEMS = Object.freeze([
  { to: "/admin/dev-center", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/dev-center/sellers", label: "Sellers", icon: Users },
  { to: "/admin/dev-center/subscriptions", label: "Assinaturas", icon: CreditCard },
  { to: "/admin/dev-center/finance", label: "Financeiro", icon: Wallet },
  { to: "/admin/dev-center/customers-global", label: "Clientes Globais", icon: Globe },
  { to: "/admin/dev-center/feature-flags", label: "Feature Flags", icon: Flag },
  { to: "/admin/dev-center/tickets", label: "Tickets do Seller", icon: Ticket },
  { to: "/admin/dev-center/toolbox", label: "Caixa de Ferramentas", icon: Wrench },
]);

/**
 * @param {string} pathname
 * @returns {typeof DEV_CENTER_NAV_ITEMS[number]}
 */
export function resolveDevCenterActiveNavItem(pathname) {
  return (
    DEV_CENTER_NAV_ITEMS.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    ) ?? DEV_CENTER_NAV_ITEMS[0]
  );
}
