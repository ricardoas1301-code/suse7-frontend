// =============================================================================
// Estilos visuais — Raio-X compartilhável (template congelado v2.2-final)
// =============================================================================

import {
  saleRayxFinancialLineHeight,
  saleRayxFinancialTypography,
  saleRayxFooterSignatureLineHeight,
  saleRayxFooterSignatureTypography,
  saleRayxKpiLineHeight,
  saleRayxKpiTypography,
  saleRayxTypography,
  saleRayxTypographyLineHeight,
} from "./saleRayxTypography.js";

/** Template oficial congelado — A4.5.2.A */
export const SALE_RAYX_SHARE_TEMPLATE_VERSION = "s7-rayx-share-v2.2-final.1";

const PRODUCT_IMAGE_BASE_PX = 72;
const PRODUCT_IMAGE_SCALE = 1.26;

export const SHARE_COLORS = {
  text: "#111827",
  muted: "#64748b",
  detail: "#6b7280",
  border: "#e2e8f0",
  headerShellBorder: "#e2e8f0",
  cardBg: "#f8fafc",
  positive: "#16a34a",
  negative: "#dc2626",
  key: "#ff8533",
  white: "#ffffff",
} as const;

export const SHARE_LAYOUT = {
  canvasWidth: 620,
  padding: 20,
  logoSize: 36,
  productImageSize: Math.round(PRODUCT_IMAGE_BASE_PX * PRODUCT_IMAGE_SCALE),
  headerImageGap: 12,
  headerShellPadding: 17,
  headerToKpiGap: 22,
  kpiShellHeight: 76,
  kpiShellPadding: 10,
  kpiColumnGap: 10,
  footerSignatureLineGap: 6,
  shellRadius: 10,
  financialCardRadius: 10,
  financialCardPadding: 14,
  financialValueRightInset: 2,
  sectionGap: 10,
  metaFieldGap: 8,
  footerMarginTop: 24,
  footerMarginBottom: 24,
  dottedDash: [4, 4] as number[],
} as const;

export const SHARE_FONTS = {
  title: saleRayxTypography.title,
  meta: saleRayxTypography.meta,
  metaBold: saleRayxTypography.metaBold,
  metaLabel: saleRayxTypography.metaLabel,
  body: saleRayxTypography.body,
  bodyBold: saleRayxTypography.bodyBold,
  detail: saleRayxTypography.detail,
  kpiLabel: saleRayxKpiTypography.label,
  kpiValue: saleRayxKpiTypography.valuePrimary,
  valuePrimary: saleRayxTypography.valuePrimary,
  valueSecondary: saleRayxTypography.valueSecondary,
  section: saleRayxTypography.sectionTitle,
  footer: saleRayxTypography.footer,
  footerSignature: saleRayxFooterSignatureTypography.meta,
} as const;

export const SHARE_FINANCIAL_FONTS = {
  body: saleRayxFinancialTypography.body,
  bodyBold: saleRayxFinancialTypography.bodyBold,
  valuePrimary: saleRayxFinancialTypography.valuePrimary,
  valueSecondary: saleRayxFinancialTypography.valueSecondary,
  section: saleRayxFinancialTypography.sectionTitle,
  detail: saleRayxFinancialTypography.detail,
} as const;

export const SHARE_LINE_HEIGHT = saleRayxTypographyLineHeight.meta;
export const SHARE_VALUE_LINE_HEIGHT = saleRayxTypographyLineHeight.value;
export const SHARE_DETAIL_LINE_HEIGHT = saleRayxTypographyLineHeight.detail;
export const SHARE_SECTION_LINE_HEIGHT = saleRayxTypographyLineHeight.section;
export const SHARE_FOOTER_SIGNATURE_LINE_HEIGHT = saleRayxFooterSignatureLineHeight;
export const SHARE_KPI_LABEL_LINE_HEIGHT = saleRayxKpiLineHeight.label;
export const SHARE_KPI_VALUE_LINE_HEIGHT = saleRayxKpiLineHeight.value;
export const SHARE_KPI_LABEL_VALUE_GAP = saleRayxKpiLineHeight.gap;

export const SHARE_FIN_LINE_HEIGHT = saleRayxFinancialLineHeight.meta;
export const SHARE_FIN_VALUE_LINE_HEIGHT = saleRayxFinancialLineHeight.value;
export const SHARE_FIN_DETAIL_LINE_HEIGHT = saleRayxFinancialLineHeight.detail;
export const SHARE_FIN_SECTION_LINE_HEIGHT = saleRayxFinancialLineHeight.section;

export const WHATSAPP_SHARE_CAPTION = `💰 Suse7 — Raio-X da venda`;

export { saleRayxTypography, saleRayxTypographyLineHeight, saleRayxFinancialTypography };
