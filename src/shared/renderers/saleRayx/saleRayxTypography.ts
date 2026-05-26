// =============================================================================
// Tipografia central — Raio-X exportado (v2.2+)
// =============================================================================

const FONT_STACK = "Arial, Helvetica, sans-serif";

/**
 * Tokens de fonte para cabeçalho, KPIs, valores financeiros e resultado.
 * Escala única — evitar ajustes manuais fora deste arquivo.
 */
export const saleRayxTypography = {
  valuePrimary: `bold 17px ${FONT_STACK}`,
  valueSecondary: `bold 15px ${FONT_STACK}`,
  label: `600 10px ${FONT_STACK}`,
  sectionTitle: `bold 11px ${FONT_STACK}`,
  meta: `14px ${FONT_STACK}`,
  metaBold: `bold 14px ${FONT_STACK}`,
  metaLabel: `14px ${FONT_STACK}`,
  title: `bold 17px ${FONT_STACK}`,
  body: `14px ${FONT_STACK}`,
  bodyBold: `bold 14px ${FONT_STACK}`,
  detail: `11px ${FONT_STACK}`,
  footer: `11px ${FONT_STACK}`,
} as const;

export const saleRayxTypographyLineHeight = {
  meta: 20,
  value: 22,
  section: 18,
  detail: 15,
  footer: 14,
} as const;
