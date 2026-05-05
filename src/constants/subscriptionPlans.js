// ======================================================================
// SUSE7 — Catálogo oficial de planos de assinatura
// Observação: valores monetários em centavos para evitar erro de arredondamento.
// ======================================================================

export const SUSE7_SUBSCRIPTION_PLANS = [
  {
    key: "baby",
    name: "Baby",
    priceCents: 0,
    monthlySalesLimit: 30,
    profile: "Iniciante",
    badge: "Grátis",
    isFree: true,
    trialDays: 0,
    description: "Para sellers que estão começando e querem organizar as primeiras vendas.",
  },
  {
    key: "start",
    name: "Start",
    priceCents: 3300,
    monthlySalesLimit: 100,
    profile: "Iniciante",
    trialDays: 15,
    description: "Para sellers iniciantes que querem vender com mais segurança.",
  },
  {
    key: "crescer",
    name: "Crescer",
    priceCents: 6500,
    monthlySalesLimit: 250,
    profile: "Validando",
    trialDays: 15,
    description: "Para quem já vende e quer validar a operação com controle.",
  },
  {
    key: "pro",
    name: "Pro",
    priceCents: 15500,
    monthlySalesLimit: 600,
    profile: "Escalando",
    trialDays: 15,
    recommended: true,
    description: "Para sellers em crescimento que precisam acompanhar margem, lucro e riscos.",
  },
  {
    key: "scale",
    name: "Scale",
    priceCents: 34900,
    monthlySalesLimit: 2000,
    profile: "Operação estruturada",
    trialDays: 15,
    description: "Para operações estruturadas com alto volume e múltiplos canais.",
  },
  {
    key: "elite",
    name: "Elite",
    priceCents: 64900,
    monthlySalesLimit: 5000,
    profile: "Seller forte",
    trialDays: 15,
    description: "Para sellers fortes que precisam de controle avançado da operação.",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    priceCents: 133300,
    monthlySalesLimit: null,
    minMonthlySales: 5001,
    profile: "Enterprise",
    trialDays: 15,
    description: "Para operações acima de 5.000 vendas/mês com necessidade de escala.",
  },
];

export function formatPlanPriceBRL(priceCents) {
  const value = Number(priceCents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

