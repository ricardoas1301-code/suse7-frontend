import formasPagamentoIllustration from "../../assets/profile/formas-de-pagamento-illustration.png";

/**
 * Anatomia permanente: avatar institucional à esquerda, conteúdo financeiro à direita.
 *
 * @param {{ children: import("react").ReactNode; className?: string }} props
 */
export default function PaymentMethodsBodyLayout({ children, className = "" }) {
  return (
    <section
      className={`s7-billing-payment-shell ${className}`.trim()}
      aria-label="Área de formas de pagamento"
    >
      <aside className="s7-billing-payment-shell__avatar" aria-hidden="true">
        <img
          className="s7-billing-payment-shell__avatar-img"
          src={formasPagamentoIllustration}
          alt="Ilustração institucional de formas de pagamento"
          decoding="async"
        />
      </aside>
      <div className="s7-billing-payment-shell__panel">
        <div className="s7-billing-payment-shell__content">{children}</div>
      </div>
    </section>
  );
}
