import "./MarketplaceIntegrationModal.css";

/**
 * Spinner discreto para abertura dos detalhes da sincronização (CTA local).
 * @param {{ compact?: boolean; ariaLabel?: string }} props
 */
export default function MarketplaceSyncDetailsOpeningIndicator({
  compact = false,
  ariaLabel = "Carregando detalhes da sincronização",
}) {
  return (
    <span
      className={`s7-marketplace-integration-modal__sync-opening-indicator${
        compact ? " is-compact" : ""
      }`}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="s7-marketplace-integration-modal__sync-opening-spinner" aria-hidden="true" />
    </span>
  );
}
