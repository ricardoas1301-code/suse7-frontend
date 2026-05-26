// =============================================================================
// Raio-X compartilhável — exports públicos
// =============================================================================

export {
  buildSaleRayxSharePayload,
  buildShareCacheKey,
  generateSaleRayxShareImage,
  blobToBase64DataUri,
  clearSaleRayxShareCache,
  WHATSAPP_SHARE_CAPTION,
  SALE_RAYX_SHARE_TEMPLATE_VERSION,
} from "./SaleRayXShareRenderer.js";

export { exportSaleRayxShareImage } from "./SaleRayXImageExporter.js";
export { buildShareLayoutPlan, SaleRayXShareLayout } from "./SaleRayXShareLayout.js";
export { copySaleRayxShare } from "./SaleRayXCopyAdapter.js";
export { printSaleRayxShare } from "./SaleRayXPrintAdapter.js";
export { sendSaleRayxWhatsAppShare } from "./SaleRayXWhatsappAdapter.js";

export type { SaleRayXShareInput } from "./SaleRayXShareRenderer.js";
export type { SaleRayXShareOutputMode, SaleRayXSharePayload } from "./SaleRayXShareLayout.js";
export {
  getSaleHealthVisualState,
  type SaleHealthVisualState,
  type SaleHealthVisualTone,
} from "./saleRayxShareHealthVisual.js";
export {
  saleRayxTypography,
  saleRayxTypographyLineHeight,
  saleRayxFinancialTypography,
  SALE_RAYX_FINANCIAL_TYPE_SCALE,
  SALE_RAYX_KPI_VALUE_SCALE,
  SALE_RAYX_FOOTER_SIGNATURE_SCALE,
} from "./saleRayxTypography.js";
export { resolveShareProductThumbnail } from "./resolveShareProductThumbnail.js";
