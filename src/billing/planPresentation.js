// ======================================================================
// Camada visual de planos (marketing). Limites/preço vêm do backend.
// ======================================================================

/** @type {Record<string, { tier?: string; highlights: string[]; marketplaces: string; support: string; recommended?: boolean }>} */
export const PLAN_PRESENTATION = {
  baby: {
    tier: "Starter",
    highlights: ["Organização inicial", "Primeiras vendas com clareza", "Base para crescer com segurança"],
    marketplaces: "Mercado Livre",
    support: "Comunidade",
  },
  start: {
    tier: "Starter",
    highlights: ["Controle de vendas", "Visão de margem inicial", "Suporte para operação enxuta"],
    marketplaces: "Mercado Livre",
    support: "E-mail",
    recommended: false,
  },
  crescer: {
    tier: "Starter",
    highlights: ["Validação da operação", "Mais volume com controle", "Preparação para escala"],
    marketplaces: "Mercado Livre",
    support: "E-mail prioritário",
  },
  pro: {
    tier: "Pro",
    highlights: ["Margem e lucro em foco", "Alertas e inteligência operacional", "Fluxo premium para sellers em crescimento"],
    marketplaces: "Mercado Livre + expansão multi-canal",
    support: "Prioritário",
    recommended: true,
  },
  scale: {
    tier: "Pro",
    highlights: ["Alto volume", "Múltiplos canais", "Governança da operação"],
    marketplaces: "Multi-marketplace",
    support: "Prioritário",
  },
  elite: {
    tier: "Ultra",
    highlights: ["Controle avançado", "Operação robusta", "Escala com previsibilidade"],
    marketplaces: "Multi-marketplace",
    support: "VIP",
  },
  enterprise: {
    tier: "Ultra",
    highlights: ["Escala enterprise", "Múltiplos CNPJs", "Acompanhamento dedicado"],
    marketplaces: "Multi-marketplace + CNPJs",
    support: "Dedicado",
  },
};

export function getPlanPresentation(planKey) {
  const key = String(planKey || "").toLowerCase();
  return (
    PLAN_PRESENTATION[key] ?? {
      tier: "Plano",
      highlights: ["Benefícios do plano conforme catálogo Suse7"],
      marketplaces: "Mercado Livre",
      support: "Padrão",
    }
  );
}
