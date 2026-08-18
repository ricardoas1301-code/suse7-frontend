import suse7Logo from "../../../assets/suse7-logo-redonda.png";
import mercadoLivreLogoOval from "../../../assets/marketplaces/mercadolivre-logo-oval.png";
import { MERCADO_LIVRE_MARKETPLACE_ID } from "./mercadoLivreIntegrationAdapter.js";

/**
 * Identidade visual Mercado Livre — consumida pela página e pelos cards.
 * Componentes genéricos recebem estes valores via props (sem acoplamento interno).
 */
export const mercadoLivrePresentation = {
  marketplaceId: MERCADO_LIVRE_MARKETPLACE_ID,
  displayName: "Mercado Livre",
  logoCardSrc: mercadoLivreLogoOval,
  logoHeaderSrc: mercadoLivreLogoOval,
  logoAlt: "Mercado Livre",
  logoFrameVariant: "neutral",
  connectionVisual: {
    platformLogoSrc: suse7Logo,
    platformLogoAlt: "Suse7",
    marketplaceLogoSrc: mercadoLivreLogoOval,
    marketplaceLogoAlt: "Mercado Livre",
    connectorSymbol: "↔",
  },
};
