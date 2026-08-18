// ======================================================================
// Tickets — item preparatório do menu do Perfil (S1.PERFIL-NOTIFICACOES.16)
// ======================================================================
//
// Auditoria forense (2026-07-21):
// - /admin/dev-center/tickets → SellerTicketsPage (Dev Center, admin-only)
// - Não existe rota seller-facing funcional de Tickets no Perfil
//
// Decisão: item visual "Em breve", sem navegação ativa.

/** @typedef {import("./profileNavigationActive.js").ProfileNavItem} ProfileNavItem */

/** Rota seller-facing de Tickets — null até missão dedicada pós-lançamento. */
export const PROFILE_TICKETS_SELLER_ROUTE = null;

/** Indica ausência de página funcional para o seller no Perfil. */
export const PROFILE_TICKETS_COMING_SOON = true;

/** @type {ProfileNavItem & { comingSoon: boolean; disabled: boolean }} */
export const PROFILE_TICKETS_MENU_ITEM = {
  id: "support-tickets",
  label: "Tickets",
  route: "",
  comingSoon: true,
  disabled: true,
  isActive: () => false,
};
