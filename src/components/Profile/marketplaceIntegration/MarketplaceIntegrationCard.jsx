import "./MarketplaceIntegrationCard.css";

/**
 * Card compacto reutilizável — visão executiva de integração marketplace.
 * @param {{
 *   marketplaceLabel: string;
 *   logoSrc: string;
 *   logoAlt?: string;
 *   logoFrameVariant?: "neutral" | "brand";
 *   accountName: string;
 *   companyName: string;
 *   statusHeadline?: string | null;
 *   statusBadge?: { label: string; tone?: string } | null;
 *   linkedCompanyAvatarUrl?: string | null;
 *   linkedCompanyAvatarAlt?: string;
 *   linkedCompanyAvatarInitial?: string;
 *   muted?: boolean;
 *   ariaLabel: string;
 *   onActivate: () => void;
 * }} props
 */
export default function MarketplaceIntegrationCard({
  marketplaceLabel,
  logoSrc,
  logoAlt = "",
  logoFrameVariant = "neutral",
  accountName,
  companyName,
  statusHeadline,
  statusBadge,
  linkedCompanyAvatarUrl = null,
  linkedCompanyAvatarAlt = "",
  linkedCompanyAvatarInitial = "E",
  muted = false,
  ariaLabel,
  onActivate,
}) {
  const badgeTone = statusBadge?.tone || "ok";
  const avatarAlt =
    linkedCompanyAvatarAlt?.trim() ||
    (companyName && companyName !== "—" ? `Logo da empresa ${companyName}` : "Logo da empresa vinculada");

  return (
    <button
      type="button"
      className={`s7-marketplace-integration-card ${muted ? "is-inactive" : ""}`}
      onClick={onActivate}
      aria-label={ariaLabel}
    >
      <div
        className={`s7-marketplace-integration-card__logo-wrap s7-marketplace-integration-card__logo-wrap--${logoFrameVariant}`}
      >
        <img src={logoSrc} alt={logoAlt} className="s7-marketplace-integration-card__logo" />
      </div>
      <div className="s7-marketplace-integration-card__body">
        <span className="s7-marketplace-integration-card__market">{marketplaceLabel}</span>
        <span className="s7-marketplace-integration-card__account">{accountName}</span>
        <p className="s7-marketplace-integration-card__company-line">
          <span className="s7-marketplace-integration-card__company-label">Empresa:</span>{" "}
          <span className="s7-marketplace-integration-card__company-value">{companyName}</span>
        </p>
        {statusHeadline ? (
          <p className="s7-marketplace-integration-card__monitoring">{statusHeadline}</p>
        ) : null}
      </div>
      <div className="s7-marketplace-integration-card__meta">
        {statusBadge ? (
          <span
            className={`s7-badge s7-marketplace-integration-badge s7-marketplace-integration-badge--${badgeTone}`}
          >
            {statusBadge.label}
          </span>
        ) : null}
        <div className="s7-marketplace-integration-card__company-avatar">
          {linkedCompanyAvatarUrl ? (
            <img src={linkedCompanyAvatarUrl} alt="" className="s7-marketplace-integration-card__company-avatar-img" />
          ) : (
            <span className="s7-marketplace-integration-card__company-avatar-fallback">{linkedCompanyAvatarInitial}</span>
          )}
        </div>
        <span className="s7-marketplace-integration-card__company-avatar-sr">{avatarAlt}</span>
      </div>
    </button>
  );
}
