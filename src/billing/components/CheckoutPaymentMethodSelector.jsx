import pagamentoIcon from "../../assets/billing/pagamento-icon.png";
import { CHECKOUT_PAYMENT_METHOD_OPTIONS, normalizeCheckoutPaymentMethod } from "../checkoutPaymentMethodUi";
import CheckoutPaymentMethodCard from "./CheckoutPaymentMethodCard";
import "./CheckoutPaymentMethodSelector.css";

/**
 * @param {{
 *   value: string;
 *   onChange: (method: string) => void;
 *   disabled?: boolean;
 *   planName?: string | null;
 *   title?: string;
 *   subtitle?: string;
 * }} props
 */
export default function CheckoutPaymentMethodSelector({
  value,
  onChange,
  disabled = false,
  planName,
  title = "Pagamento",
  subtitle,
}) {
  const selected = normalizeCheckoutPaymentMethod(value);
  const resolvedSubtitle =
    subtitle ||
    (planName
      ? `Escolha como pagar o plano ${planName}. O acesso será liberado após confirmação do pagamento.`
      : "Escolha como deseja pagar. O acesso será liberado após confirmação do pagamento.");

  return (
    <section className="s7-checkout-payment-selector" aria-label="Forma de pagamento">
      <header className="s7-checkout-payment-selector__header">
        <span className="s7-checkout-payment-selector__brand" aria-hidden="true">
          <img className="s7-checkout-payment-selector__brand-icon" src={pagamentoIcon} alt="" decoding="async" />
        </span>
        <div className="s7-checkout-payment-selector__titles">
          <h3 id="s7-checkout-payment-title" className="s7-checkout-payment-selector__title">
            {title}
          </h3>
          <p className="s7-checkout-payment-selector__subtitle">{resolvedSubtitle}</p>
        </div>
      </header>

      <div className="s7-checkout-payment-selector__grid" role="radiogroup" aria-label="Métodos de pagamento">
        {CHECKOUT_PAYMENT_METHOD_OPTIONS.map((option) => (
          <CheckoutPaymentMethodCard
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            enabled={option.enabled}
            badge={option.badge}
            selected={selected === option.id}
            disabled={disabled}
            onSelect={onChange}
          />
        ))}
      </div>
    </section>
  );
}
