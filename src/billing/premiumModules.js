// ======================================================================
// Copy visual por módulo premium (sem decisão de acesso)
// ======================================================================

/** @type {Record<string, { title: string; description: string; preview?: boolean }>} */
export const PREMIUM_MODULE_COPY = {
  produtos: {
    title: "Catálogo e estoque com escala",
    description: "Organize produtos, variações e vínculos com anúncios com limites claros do seu plano.",
    showUsageNotice: false,
  },
  anuncios: {
    title: "Anúncios e publicações",
    description: "Publique, sincronize e acompanhe performance dos anúncios nos marketplaces conectados.",
    showUsageNotice: false,
  },
  vendas: {
    title: "Vendas e operação",
    description: "Acompanhe pedidos, margens e histórico com visão consolidada para o seller.",
    showUsageNotice: false,
  },
  precificacoes: {
    title: "Precificação inteligente",
    description: "Simule margens, regras e ajustes com apoio dos limites do seu plano.",
    // Card "Consumo do ecossistema" pertence ao contexto de assinatura/plano (ver Assinatura),
    // não à experiência principal de Precificações — mesmo padrão já adotado em Vendas.
    showUsageNotice: false,
  },
  concorrencia: {
    title: "Monitoramento de concorrência",
    description: "Compare posicionamento e sinais de mercado para decidir com mais contexto.",
    showUsageNotice: false,
  },
  relatorios: {
    title: "Relatórios avançados",
    description: "Exporte indicadores e acompanhe evolução com dados consolidados do Suse7.",
  },
  marketplace: {
    title: "Integrações marketplace",
    description: "Conecte contas e marketplaces respeitando limites por CNPJ, conta e canal.",
  },
  default: {
    title: "Recurso premium",
    description: "Ative um plano para usar este módulo com segurança e escala.",
  },
};

/**
 * @param {string} moduleKey
 */
export function getPremiumModuleCopy(moduleKey) {
  return PREMIUM_MODULE_COPY[moduleKey] ?? PREMIUM_MODULE_COPY.default;
}
