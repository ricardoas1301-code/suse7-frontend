// ======================================================================
// Grupos estáticos da navegação do Perfil
// ======================================================================

/** @typedef {import("./profileNavigationActive.js").ProfileNavItem} ProfileNavItem */
/** @typedef {import("./profileNavigationActive.js").ProfileNavGroup} ProfileNavGroup */

/** @type {ProfileNavGroup[]} */
export const STATIC_PROFILE_NAVIGATION_GROUPS = [
  {
    id: "account",
    label: "MINHA CONTA",
    items: [
      {
        id: "company-profile",
        label: "Perfil da Empresa",
        route: "/perfil/dados-empresa",
        isActive: ({ pathname }) =>
          pathname === "/perfil" || pathname === "/perfil/dados-empresa",
      },
      {
        id: "change-password",
        label: "Alterar Senha",
        route: "/perfil/alterar-senha",
        isActive: ({ pathname }) => pathname === "/perfil/alterar-senha",
      },
    ],
  },
  {
    id: "integrations",
    label: "INTEGRAÇÕES",
    items: [
      {
        id: "mercado-livre",
        label: "Mercado Livre",
        route: "/perfil/integracoes/mercado-livre",
        isActive: ({ pathname }) => pathname.startsWith("/perfil/integracoes/mercado-livre"),
      },
    ],
  },
  {
    id: "subscription",
    label: "ASSINATURA",
    items: [
      {
        id: "my-subscription",
        label: "Minha assinatura",
        route: "/perfil/assinatura/minha-assinatura",
        isActive: ({ pathname }) => pathname.startsWith("/perfil/assinatura/minha-assinatura"),
      },
      {
        id: "payment-methods",
        label: "Formas de pagamento",
        route: "/perfil/assinatura/formas-de-pagamento",
        isActive: ({ pathname }) =>
          pathname.startsWith("/perfil/assinatura/formas-de-pagamento") ||
          pathname.startsWith("/perfil/assinatura/formas-pagamento"),
      },
      {
        id: "payment-history",
        label: "Histórico de pagamentos",
        route: "/perfil/assinatura/historico",
        isActive: ({ pathname }) =>
          pathname.startsWith("/perfil/assinatura/historico") ||
          pathname.startsWith("/perfil/pagamentos/extrato"),
      },
      {
        id: "plans",
        label: "Planos",
        route: "/perfil/assinatura/planos",
        isActive: ({ pathname }) => pathname.startsWith("/perfil/assinatura/planos"),
      },
    ],
  },
];
