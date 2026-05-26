// =============================================================================
// Estilos visuais — Raio-X compartilhável (template congelado v2.2)
// =============================================================================

import { saleRayxTypography, saleRayxTypographyLineHeight } from "./saleRayxTypography.js";

export const SALE_RAYX_SHARE_TEMPLATE_VERSION = "s7-rayx-share-v2.2";

/** Base 72px + 26% — foto do anúncio no export */
const PRODUCT_IMAGE_BASE_PX = 72;
const PRODUCT_IMAGE_SCALE = 1.26;

export const SHARE_COLORS = {
  text: "#111827",
  muted: "#64748b",
  detail: "#6b7280",
  border: "#e2e8f0",
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
  productInsetFromRight: 36,
  headerGap: 16,
  headerToKpiGap: 22,
  kpiShellHeight: 64,
  kpiShellPadding: 9,
  kpiColumnGap: 10,
  shellRadius: 10,
  financialCardRadius: 10,
  financialCardPadding: 14,
  sectionGap: 10,
  metaFieldGap: 8,
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
  kpiLabel: saleRayxTypography.label,
  kpiValue: saleRayxTypography.valuePrimary,
  valuePrimary: saleRayxTypography.valuePrimary,
  valueSecondary: saleRayxTypography.valueSecondary,
  section: saleRayxTypography.sectionTitle,
  footer: saleRayxTypography.footer,
} as const;

export const SHARE_LINE_HEIGHT = saleRayxTypographyLineHeight.meta;
export const SHARE_VALUE_LINE_HEIGHT = saleRayxTypographyLineHeight.value;
export const SHARE_DETAIL_LINE_HEIGHT = saleRayxTypographyLineHeight.detail;
export const SHARE_SECTION_LINE_HEIGHT = saleRayxTypographyLineHeight.section;

export const WHATSAPP_SHARE_CAPTION = `💰 Suse7 — Raio-X da venda`;

export { saleRayxTypography, saleRayxTypographyLineHeight };
