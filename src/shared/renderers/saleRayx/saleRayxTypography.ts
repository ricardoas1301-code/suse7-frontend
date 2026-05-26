// =============================================================================
// Tipografia central — Raio-X exportado
// =============================================================================

const FONT_STACK = "Arial, Helvetica, sans-serif";

/** Escala proporcional do bloco financeiro (A4.5.3) */
export const SALE_RAYX_FINANCIAL_TYPE_SCALE = 1.16;

function scalePx(px: number, scale = 1): number {
  return Math.round(px * scale);
}

function font(weight: string, px: number, scale = 1): string {
  const w = weight ? `${weight} ` : "";
  return `${w}${scalePx(px, scale)}px ${FONT_STACK}`;
}

export const saleRayxTypography = {
  valuePrimary: font("bold", 17),
  valueSecondary: font("bold", 15),
  label: font("600", 10),
  sectionTitle: font("bold", 11),
  meta: font("", 14),
  metaBold: font("bold", 14),
  metaLabel: font("", 14),
  title: font("bold", 17),
  body: font("", 14),
  bodyBold: font("bold", 14),
  detail: font("", 11),
  footer: font("", 11),
} as const;

/** Tipografia do financial shell (+16%) */
export const saleRayxFinancialTypography = {
  valuePrimary: font("bold", 17, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  valueSecondary: font("bold", 15, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  label: font("600", 10, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  sectionTitle: font("bold", 11, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  body: font("", 14, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  bodyBold: font("bold", 14, SALE_RAYX_FINANCIAL_TYPE_SCALE),
  detail: font("", 11, SALE_RAYX_FINANCIAL_TYPE_SCALE),
} as const;

export const saleRayxTypographyLineHeight = {
  meta: 20,
  value: 22,
  section: 18,
  detail: 15,
  footer: 14,
} as const;

export const saleRayxFinancialLineHeight = {
  meta: Math.round(20 * SALE_RAYX_FINANCIAL_TYPE_SCALE),
  value: Math.round(22 * SALE_RAYX_FINANCIAL_TYPE_SCALE),
  section: Math.round(18 * SALE_RAYX_FINANCIAL_TYPE_SCALE),
  detail: Math.round(15 * SALE_RAYX_FINANCIAL_TYPE_SCALE),
} as const;
