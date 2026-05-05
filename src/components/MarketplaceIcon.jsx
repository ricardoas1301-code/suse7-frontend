import MarketplaceBadge from "./MarketplaceBadge";

/**
 * Ícone do marketplace para tabelas e listagens (Mercado Livre, Shopee, etc.).
 * Reutiliza `MarketplaceBadge` e assets em `/public/marketplaces/`.
 *
 * @param {{
 *   marketplace?: string | null;
 *   label?: string | null;
 *   size?: number;
 *   className?: string;
 * }} props
 */
export default function MarketplaceIcon({ marketplace, label, size = 22, className = "" }) {
  return <MarketplaceBadge marketplace={marketplace} label={label} size={size} className={className} />;
}
