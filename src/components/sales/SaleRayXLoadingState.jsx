// ======================================================
// Loading premium do Raio-x da venda — logo SUSE7 animada + mensagem única.
// ======================================================

import suse7RaioxVendaLoading from "../../assets/sales/suse7-raiox-venda-loading.mp4";

/**
 * @param {{ message?: string }} props
 */
export default function SaleRayXLoadingState({
  message = "Carregando os dados financeiros desta venda",
}) {
  return (
    <div className="anuncios-raiox-venda-loading vendas-sale-rayx__loading-card" role="status" aria-live="polite">
      <div className="anuncios-raiox-venda-loading__logo-wrap" aria-hidden="true">
        <video
          className="anuncios-raiox-venda-loading__logo"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={suse7RaioxVendaLoading} type="video/mp4" />
        </video>
      </div>
      <p className="anuncios-sell-popover__muted anuncios-raiox-venda-loading__text">{message}</p>
    </div>
  );
}
