// ======================================================
// Loading premium do Raio-x da venda — mesmo DNA do Raio-x da precificação.
// ======================================================

/**
 * @param {{
 *   listingTitle?: string | null;
 *   message?: string;
 * }} props
 */
export default function SaleRayXLoadingState({
  listingTitle,
  message = "Carregando os dados financeiros desta venda",
}) {
  const subtitle =
    listingTitle != null && String(listingTitle).trim() !== ""
      ? String(listingTitle).trim()
      : "Carregando venda...";

  return (
    <div className="anuncios-raiox-venda-loading vendas-sale-rayx__loading-card" role="status" aria-live="polite">
      <div className="anuncios-raiox-venda-loading__spinner-wrap" aria-hidden>
        <span className="anuncios-raiox-venda-loading__spinner" />
      </div>
      <p className="anuncios-sell-popover__muted anuncios-raiox-venda-loading__text">{message}</p>
      <p className="anuncios-sell-popover__muted vendas-sale-rayx__loading-card-subtitle">{subtitle}</p>
    </div>
  );
}
