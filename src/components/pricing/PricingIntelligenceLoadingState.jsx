// ======================================================
// PI — Loading centralizado da Precificação Inteligente (padrão Raio-X Suse7).
// Somente apresentação visual; sem lógica financeira.
// ======================================================

/**
 * @param {{
 *   title?: string;
 *   subtitle?: string;
 *   compact?: boolean;
 * }} [props]
 */
export function PricingIntelligenceLoadingState({
  title = "Carregando Precificação Inteligente",
  subtitle = "Estamos buscando os cenários oficiais do Mercado Livre para este anúncio.",
  compact = false,
}) {
  return (
    <div
      className={[
        "pricing-intelligence-page__loading-state",
        "anuncios-raiox-venda-loading",
        compact ? "pricing-intelligence-page__loading-state--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="anuncios-raiox-venda-loading__spinner-wrap" aria-hidden>
        <span className="anuncios-raiox-venda-loading__spinner" />
      </div>
      <p className="pricing-intelligence-page__loading-state-title">{title}</p>
      {subtitle ? <p className="pricing-intelligence-page__loading-state-subtitle">{subtitle}</p> : null}
    </div>
  );
}
