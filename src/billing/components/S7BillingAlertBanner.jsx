import { S7Button } from "../../components/ui";

/**
 * @param {{
 *   title: string;
 *   message: string;
 *   ctaLabel?: string | null;
 *   onCtaClick?: (() => void) | null;
 *   tone?: "warning" | "danger" | "info";
 *   className?: string;
 *   dismissible?: boolean;
 *   onDismiss?: (() => void) | null;
 * }} props
 */
export default function S7BillingAlertBanner({
  title,
  message,
  ctaLabel = null,
  onCtaClick = null,
  tone = "warning",
  className = "",
  dismissible = false,
  onDismiss = null,
}) {
  return (
    <section
      className={`s7-billing-alert-banner s7-billing-alert-banner--${tone} ${className}`.trim()}
      aria-live="polite"
    >
      <div className="s7-billing-alert-banner__content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <div className="s7-billing-alert-banner__actions">
        {ctaLabel && onCtaClick ? (
          <S7Button variant="primary" onClick={onCtaClick}>
            {ctaLabel}
          </S7Button>
        ) : null}
        {dismissible && onDismiss ? (
          <S7Button variant="secondary" onClick={onDismiss}>
            Fechar aviso
          </S7Button>
        ) : null}
      </div>
    </section>
  );
}
