/**
 * Contrato declarativo para integrações marketplace (visão executiva + modal).
 * Mercado Livre é a primeira implementação; outros marketplaces reutilizam a mesma forma.
 */

/** @typedef {'ok' | 'warn' | 'error' | 'muted' | 'processing' | 'unknown'} MarketplacePresentationTone */

/**
 * @typedef {Object} MarketplaceIdentityPresentation
 * @property {string} marketplaceId
 * @property {string} displayName
 * @property {string} logoCardSrc
 * @property {string} [logoHeaderSrc]
 * @property {string} logoAlt
 * @property {"neutral" | "brand"} [logoFrameVariant]
 */

/**
 * @typedef {Object} MarketplaceIntegrationStatusBadge
 * @property {string} label
 * @property {MarketplacePresentationTone} tone
 */

/**
 * @typedef {Object} MarketplaceLinkedCompanyPresentation
 * @property {string | null} id
 * @property {string} name
 * @property {string | null} avatarUrl
 * @property {string} avatarAlt
 * @property {string} avatarInitial
 */

/**
 * @typedef {Object} MarketplaceIntegrationCardPresentation
 * @property {string} marketplaceId
 * @property {string} marketplaceLabel
 * @property {string} accountName
 * @property {string} companyName
 * @property {string | null} statusHeadline
 * @property {MarketplaceIntegrationStatusBadge | null} statusBadge
 * @property {MarketplaceLinkedCompanyPresentation} linkedCompany
 * @property {boolean} muted
 * @property {string} ariaLabel
 */

/**
 * @typedef {Object} MarketplaceIntegrationDetailRow
 * @property {string} label
 * @property {string} value
 * @property {MarketplacePresentationTone} [tone]
 */

/**
 * @typedef {Object} MarketplaceIntegrationModalPresentation
 * @property {string} marketplaceId
 * @property {string} modalTitle
 * @property {string} modalSubtitle
 * @property {string} accountName
 * @property {string} companyName
 * @property {string} linkedCompanyName
 * @property {string} linkedCompanyDocumentFormatted
 * @property {string} accountIdentifier
 * @property {MarketplaceIntegrationStatusBadge | null} statusBadge
 * @property {MarketplaceIntegrationDetailRow[]} integrationStateRows
 * @property {string[]} diagnosticLines
 * @property {string | null} operationalAlert
 * @property {boolean} showSyncViewLink
 * @property {boolean} syncViewEmphasis
 * @property {boolean} showReconnectAction
 * @property {boolean} showSyncDetailsAction
 * @property {boolean} isActive
 */

export const MARKETPLACE_INTEGRATION_IDS = {
  MERCADO_LIVRE: "mercado_livre",
};
