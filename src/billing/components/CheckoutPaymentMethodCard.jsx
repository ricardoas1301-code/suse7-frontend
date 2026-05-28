import pixLogo from "../../assets/billing/pix-logo.png";
import { normalizeCheckoutPaymentMethod } from "../checkoutPaymentMethodUi";
import "./CheckoutPaymentMethodSelector.css";

/**
 * @param {{
 *   id: string;
 *   label: string;
 *   description: string;
 *   enabled?: boolean;
 *   badge?: string;
 *   selected?: boolean;
 *   disabled?: boolean;
 *   onSelect?: (id: string) => void;
 * }} props
 */
export default function CheckoutPaymentMethodCard({
  id,
  label,
  description,
  enabled = true,
  badge,
  selected = false,
  disabled = false,
  onSelect,
}) {
  const isDisabled = disabled || !enabled;
  const methodId = normalizeCheckoutPaymentMethod(id);

  function handleClick() {
    if (isDisabled || !onSelect) return;
    onSelect(methodId);
  }

  function handleKeyDown(event) {
    if (isDisabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(methodId);
    }
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className={[
        "s7-checkout-payment-card",
        selected ? "s7-checkout-payment-card--selected" : "",
        isDisabled ? "s7-checkout-payment-card--disabled" : "",
        `s7-checkout-payment-card--${methodId.toLowerCase()}`,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="s7-checkout-payment-card__icon" aria-hidden="true">
        <CheckoutPaymentMethodIcon methodId={methodId} />
      </span>
      <span className="s7-checkout-payment-card__copy">
        <span className="s7-checkout-payment-card__title-row">
          <strong className="s7-checkout-payment-card__title">{label}</strong>
          {badge ? <span className="s7-checkout-payment-card__badge">{badge}</span> : null}
        </span>
        <span className="s7-checkout-payment-card__description">{description}</span>
      </span>
      <span className="s7-checkout-payment-card__check" aria-hidden="true">
        {selected ? <CheckIcon /> : null}
      </span>
    </button>
  );
}

/**
 * @param {{ methodId: string }} props
 */
function CheckoutPaymentMethodIcon({ methodId }) {
  if (methodId === "PIX") return <PixIcon />;
  if (methodId === "BOLETO") return <BoletoIcon />;
  return <CardIcon />;
}

function PixIcon() {
  return <img className="s7-checkout-payment-card__pix-logo" src={pixLogo} alt="" width={44} height={44} decoding="async" />;
}

function BoletoIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="24" height="20" rx="4" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
      <rect x="11" y="14" width="1.5" height="12" fill="#2563eb" />
      <rect x="14" y="14" width="3" height="12" fill="#2563eb" />
      <rect x="19" y="14" width="1.5" height="12" fill="#2563eb" />
      <rect x="22" y="14" width="2" height="12" fill="#2563eb" />
      <rect x="26" y="14" width="4" height="12" fill="#2563eb" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="11" width="26" height="18" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="7" y="16" width="26" height="5" fill="#2563eb" opacity="0.85" />
      <rect x="10" y="25" width="10" height="2" rx="1" fill="#94a3b8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#2563eb" />
      <path d="M6 10.2L8.6 12.8L14.2 7.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
