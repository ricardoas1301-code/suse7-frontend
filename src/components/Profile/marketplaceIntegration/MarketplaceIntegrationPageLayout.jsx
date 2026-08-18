import "./MarketplaceIntegrationPageLayout.css";

/**
 * Shell genérico de página de integração marketplace (conteúdo + identidade visual).
 * @param {{
 *   title: string;
 *   connectAction?: React.ReactNode;
 *   bannerError?: React.ReactNode;
 *   securityContent: React.ReactNode;
 *   integrationsContent: React.ReactNode;
 *   brandConnectionVisual: React.ReactNode;
 *   accountGridRows?: number;
 * }} props
 */
export default function MarketplaceIntegrationPageLayout({
  title,
  connectAction = null,
  bannerError = null,
  securityContent,
  integrationsContent,
  brandConnectionVisual,
  accountGridRows = 1,
}) {
  return (
    <div className="profile-card ml-card ml-card-wide s7-ml-integrations-hero">
      <div className="s7-ml-integrations-hero__content">
        {bannerError}

        <header className="s7-marketplace-integration-page-header">
          <h3 className="s7-marketplace-integration-page-header__title">{title}</h3>
          {connectAction ? (
            <div className="s7-marketplace-integration-page-header__actions">{connectAction}</div>
          ) : null}
        </header>

        <div
          className="s7-marketplace-integration-page-body"
          style={{ "--s7-mi-account-rows": String(Math.max(1, accountGridRows)) }}
        >
          <div className="s7-marketplace-integration-page-body__main-intro">{securityContent}</div>
          <aside className="s7-marketplace-integration-page-body__visual" aria-hidden="true">
            {brandConnectionVisual}
          </aside>
          <div className="s7-marketplace-integration-page-body__main-integrations">{integrationsContent}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Identidade SUSE7 ↔ marketplace — dimensões via CSS estrutural (sem transform: scale).
 * @param {{
 *   platformLogoSrc: string;
 *   platformLogoAlt?: string;
 *   marketplaceLogoSrc: string;
 *   marketplaceLogoAlt?: string;
 *   connectorSymbol?: string;
 * }} props
 */
export function MarketplaceConnectionVisual({
  platformLogoSrc,
  platformLogoAlt = "",
  marketplaceLogoSrc,
  marketplaceLogoAlt = "",
  connectorSymbol = "↔",
}) {
  return (
    <div className="s7-marketplace-connection-visual">
      <img
        src={platformLogoSrc}
        alt={platformLogoAlt}
        className="s7-marketplace-connection-visual__logo s7-marketplace-connection-visual__logo--platform"
        decoding="async"
      />
      <span className="s7-marketplace-connection-visual__connector" aria-hidden="true">
        {connectorSymbol}
      </span>
      <img
        src={marketplaceLogoSrc}
        alt={marketplaceLogoAlt}
        className="s7-marketplace-connection-visual__logo s7-marketplace-connection-visual__logo--marketplace"
        decoding="async"
      />
    </div>
  );
}
