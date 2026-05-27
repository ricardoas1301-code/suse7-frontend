/**
 * Categorias placeholder da Seller Toolbox (S_5.2.1).
 * @typedef {{
 *   id: string;
 *   label: string;
 *   description: string;
 *   icon: "User" | "CreditCard" | "Plug" | "RefreshCw" | "Package" | "History" | "Flag" | "Database" | "ScanSearch" | "ScrollText";
 * }} SellerToolboxCategory
 */

/** @type {SellerToolboxCategory[]} */
export const SELLER_TOOLBOX_CATEGORIES = [
  {
    id: "account",
    label: "Conta",
    description: "Perfil, acesso e identidade do seller",
    icon: "User",
  },
  {
    id: "subscription",
    label: "Assinatura",
    description: "Plano, assinatura e gestão operacional comercial",
    icon: "CreditCard",
  },
  {
    id: "integrations",
    label: "Integrações",
    description: "Marketplaces e contas conectadas",
    icon: "Plug",
  },
  {
    id: "feature_flags",
    label: "Feature Flags",
    description: "Features habilitadas para o seller",
    icon: "Flag",
  },
  {
    id: "cache_refresh",
    label: "Cache / Refresh",
    description: "Atualização operacional dos dados do seller",
    icon: "Database",
  },
  {
    id: "central_sync",
    label: "Central Sync",
    description: "Sincronização operacional por entidade — começando por Venda",
    icon: "ScanSearch",
  },
  {
    id: "operational_timeline",
    label: "Timeline Operacional",
    description: "Feed cronológico de ações administrativas com auditoria operacional",
    icon: "ScrollText",
  },
  {
    id: "sync",
    label: "Sincronização",
    description: "Jobs e estado de sincronização",
    icon: "RefreshCw",
  },
  {
    id: "products",
    label: "Produtos / Anúncios",
    description: "Catálogo e anúncios publicados",
    icon: "Package",
  },
  {
    id: "history",
    label: "Histórico",
    description: "Eventos e linha do tempo operacional",
    icon: "History",
  },
];

/**
 * @param {string | null | undefined} categoryId
 * @returns {SellerToolboxCategory | null}
 */
export function findSellerToolboxCategory(categoryId) {
  if (!categoryId) return null;
  return SELLER_TOOLBOX_CATEGORIES.find((category) => category.id === categoryId) ?? null;
}
