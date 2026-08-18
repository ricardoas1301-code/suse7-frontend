// =============================================================================
// Exportação Canvas → PNG/JPG — layout premium alinhado ao modal Raio-X
// =============================================================================

import suse7LogoUrl from "../../../assets/suse7-logo-redonda.png";
import { summaryToneToColor } from "../../../components/sales/saleRayxSummaryRender.js";
import { SALE_RAYX_BRAND_TITLE } from "../../../components/sales/saleRayxSummary.js";
import {
  SHARE_COLORS,
  SHARE_FIN_DETAIL_LINE_HEIGHT,
  SHARE_FIN_LINE_HEIGHT,
  SHARE_FIN_SECTION_LINE_HEIGHT,
  SHARE_FIN_VALUE_LINE_HEIGHT,
  SHARE_FINANCIAL_FONTS,
  SHARE_FONTS,
  SHARE_LAYOUT,
  SHARE_FOOTER_SIGNATURE_LINE_HEIGHT,
  SHARE_KPI_LABEL_LINE_HEIGHT,
  SHARE_KPI_LABEL_VALUE_GAP,
  SHARE_KPI_VALUE_LINE_HEIGHT,
  SHARE_LINE_HEIGHT,
} from "./SaleRayXShareStyles.js";
import {
  buildShareLayoutPlan,
  type SaleRayXSharePayload,
  type ShareMetaField,
} from "./SaleRayXShareLayout.js";
import type { SaleHealthVisualState } from "./saleRayxShareHealthVisual.js";

// Refino UX: respiro extra entre linhas/grupos de Receita e Custos Internos,
// igualando o conforto vertical do bloco Resultado (que usa a linha de valor maior).
// As linhas auxiliares (ex.: "Premium 16,5%", "Alíquota 6%") permanecem coladas à principal.
const FINANCIAL_ENTRY_BREATHING = SHARE_FIN_VALUE_LINE_HEIGHT - SHARE_FIN_LINE_HEIGHT;

function loadImage(src: string, useCors = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = resolveMaybeAbsoluteUrl(src);
  });
}

function logThumbnailDev(event: string, payload: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[S7 Raio-X Share] ${event}`, payload);
  }
}

async function loadProductImage(
  src: string,
  source: string | null | undefined,
): Promise<HTMLImageElement | null> {
  logThumbnailDev("thumbnail_source", {
    thumbnail_source: source ?? "payload",
    thumbnail_url: src,
  });
  try {
    const img = await loadImage(src, true);
    logThumbnailDev("thumbnail_loaded", { thumbnail_source: source, thumbnail_loaded: true });
    return img;
  } catch {
    try {
      const img = await loadImage(src, false);
      logThumbnailDev("thumbnail_loaded", {
        thumbnail_source: source,
        thumbnail_loaded: true,
        cors: false,
      });
      return img;
    } catch (err) {
      logThumbnailDev("thumbnail_failed", {
        thumbnail_source: source,
        thumbnail_loaded: false,
        error: err instanceof Error ? err.message : "IMAGE_LOAD_FAILED",
      });
      return null;
    }
  }
}

function metaFieldHasLabel(field: ShareMetaField): boolean {
  return field.label != null && String(field.label).trim() !== "";
}

function measureMetaFieldLines(
  ctx: CanvasRenderingContext2D,
  field: ShareMetaField,
  metaTextWidth: number,
): string[] {
  if (field.labelOnOwnLine && field.label) {
    ctx.font = SHARE_FONTS.metaBold;
    return wrapTextMaxLinesEllipsis(ctx, field.value, metaTextWidth, 2);
  }

  if (!metaFieldHasLabel(field)) {
    ctx.font = SHARE_FONTS.valueSecondary;
    if (field.truncateMode === "twoLineEllipsis") {
      return wrapTextMaxLinesEllipsis(ctx, field.value, metaTextWidth, 2);
    }
    return wrapText(ctx, field.value, metaTextWidth);
  }

  ctx.font = SHARE_FONTS.meta;
  const label = `${field.label}: `;
  const labelW = ctx.measureText(label).width;
  ctx.font = SHARE_FONTS.metaBold;
  const valueMaxWidth = Math.max(50, metaTextWidth - labelW);
  if (field.truncateMode === "twoLineEllipsis") {
    return wrapTextMaxLinesEllipsis(ctx, field.value, valueMaxWidth, 2);
  }
  return wrapText(ctx, field.value, valueMaxWidth);
}

function measureMetaFieldHeight(
  ctx: CanvasRenderingContext2D,
  field: ShareMetaField,
  metaTextWidth: number,
): number {
  if (field.labelOnOwnLine && field.label) {
    const valueLines = measureMetaFieldLines(ctx, field, metaTextWidth);
    return SHARE_LINE_HEIGHT + valueLines.length * SHARE_LINE_HEIGHT;
  }
  return measureMetaFieldLines(ctx, field, metaTextWidth).length * SHARE_LINE_HEIGHT;
}

function drawMetaField(
  ctx: CanvasRenderingContext2D,
  field: ShareMetaField,
  startY: number,
  innerX: number,
  innerWidth: number,
): number {
  if (field.labelOnOwnLine && field.label) {
    ctx.font = SHARE_FONTS.metaLabel;
    ctx.fillStyle = SHARE_COLORS.muted;
    ctx.fillText(`${field.label}:`, innerX, startY + 13);

    const valueStartY = startY + SHARE_LINE_HEIGHT;
    ctx.font = SHARE_FONTS.metaBold;
    ctx.fillStyle = SHARE_COLORS.text;
    const valueLines = wrapTextMaxLinesEllipsis(ctx, field.value, innerWidth, 2);
    for (let i = 0; i < valueLines.length; i += 1) {
      ctx.fillText(valueLines[i], innerX, valueStartY + 13 + i * SHARE_LINE_HEIGHT);
    }
    return (
      valueStartY +
      valueLines.length * SHARE_LINE_HEIGHT +
      SHARE_LAYOUT.metaFieldGap
    );
  }

  if (!metaFieldHasLabel(field)) {
    ctx.font = SHARE_FONTS.valueSecondary;
    ctx.fillStyle = SHARE_COLORS.text;
    const valueLines = measureMetaFieldLines(ctx, field, innerWidth);
    for (let i = 0; i < valueLines.length; i += 1) {
      ctx.fillText(valueLines[i], innerX, startY + 13 + i * SHARE_LINE_HEIGHT);
    }
    return startY + valueLines.length * SHARE_LINE_HEIGHT + SHARE_LAYOUT.metaFieldGap;
  }

  ctx.font = SHARE_FONTS.metaLabel;
  const label = `${field.label}: `;
  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = SHARE_COLORS.muted;
  ctx.fillText(label, innerX, startY + 13);

  ctx.font = SHARE_FONTS.metaBold;
  const valueColor =
    field.valueTone === "accent" && field.accentColor
      ? field.accentColor
      : SHARE_COLORS.text;
  ctx.fillStyle = valueColor;

  const valueMaxWidth = Math.max(50, innerWidth - labelW);
  const valueLines =
    field.truncateMode === "twoLineEllipsis"
      ? wrapTextMaxLinesEllipsis(ctx, field.value, valueMaxWidth, 2)
      : wrapText(ctx, field.value, valueMaxWidth);

  const valueX = innerX + labelW;
  for (let i = 0; i < valueLines.length; i += 1) {
    ctx.fillText(valueLines[i], valueX, startY + 13 + i * SHARE_LINE_HEIGHT);
  }

  return startY + valueLines.length * SHARE_LINE_HEIGHT + SHARE_LAYOUT.metaFieldGap;
}

function drawNeutralHeaderShell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radius = SHARE_LAYOUT.shellRadius;
  ctx.fillStyle = SHARE_COLORS.white;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = SHARE_COLORS.headerShellBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function drawHealthShell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  healthVisual: SaleHealthVisualState,
) {
  const radius = SHARE_LAYOUT.shellRadius;
  const borderWidth = healthVisual.tone === "critical" ? 2 : 1.5;

  ctx.fillStyle = healthVisual.backgroundColor;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();

  ctx.strokeStyle = healthVisual.borderColor;
  ctx.lineWidth = borderWidth;
  roundRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function drawHeaderProductImage(
  ctx: CanvasRenderingContext2D,
  productImg: HTMLImageElement | null,
  payload: SaleRayXSharePayload,
  shellX: number,
  shellY: number,
  shellW: number,
  shellH: number,
  metaContentH: number,
  productSize: number,
) {
  const padIn = SHARE_LAYOUT.headerShellPadding;
  const productX = shellX + shellW - padIn - productSize;
  const minY = shellY + padIn;
  const maxY = shellY + shellH - padIn - productSize;
  const topAlignY = shellY + padIn;
  const centeredY = topAlignY + Math.max(0, (metaContentH - productSize) / 2);
  // Sobe em relação ao centro; topo alinhado ao bloco Conta / Marketplace / MLB
  let productY = Math.min(topAlignY + 4, centeredY);
  productY = Math.min(Math.max(productY, minY), maxY);

  const productCenterX = productX + productSize / 2;
  const productCenterY = productY + productSize / 2;
  const r = productSize / 2;

  if (productImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(productCenterX, productCenterY, r, 0, Math.PI * 2);
    ctx.clip();
    // Refino UX: imagem de capa completa dentro do círculo (object-fit: contain),
    // centralizada e sem zoom/recorte das laterais. Fundo branco para o "respiro" do contain.
    ctx.fillStyle = SHARE_COLORS.white;
    ctx.fillRect(productX, productY, productSize, productSize);
    drawContainImage(ctx, productImg, productX, productY, productSize, productSize);
    ctx.restore();
    return;
  }

  logThumbnailDev("thumbnail_failed", {
    thumbnail_source: payload.productImageSource ?? "fallback",
    thumbnail_loaded: false,
  });
  ctx.fillStyle = SHARE_COLORS.cardBg;
  ctx.beginPath();
  ctx.arc(productCenterX, productCenterY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SHARE_COLORS.muted;
  ctx.font = SHARE_FONTS.detail;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Anúncio", productCenterX, productCenterY);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function drawHealthKpiShell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  healthVisual: SaleHealthVisualState,
  cards: { label: string; value: string; valueColor: string }[],
) {
  const h = SHARE_LAYOUT.kpiShellHeight;
  drawHealthShell(ctx, x, y, width, h, healthVisual);

  const innerPad = SHARE_LAYOUT.kpiShellPadding;
  const colGap = SHARE_LAYOUT.kpiColumnGap;
  const innerW = width - innerPad * 2;
  const colW = (innerW - colGap * 2) / 3;
  const stackH =
    SHARE_KPI_LABEL_LINE_HEIGHT + SHARE_KPI_LABEL_VALUE_GAP + SHARE_KPI_VALUE_LINE_HEIGHT;
  const blockMidY = y + h / 2;
  const labelCenterY = blockMidY - stackH / 2 + SHARE_KPI_LABEL_LINE_HEIGHT / 2;
  const valueCenterY =
    blockMidY + stackH / 2 - SHARE_KPI_VALUE_LINE_HEIGHT / 2;

  cards.forEach((card, idx) => {
    const colX = x + innerPad + idx * (colW + colGap);
    const centerX = colX + colW / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = SHARE_FONTS.kpiLabel;
    ctx.fillStyle = healthVisual.kpiLabelColor;
    ctx.fillText(card.label, centerX, labelCenterY);

    ctx.font = SHARE_FONTS.kpiValue;
    ctx.fillStyle = card.valueColor;
    const valLine = wrapText(ctx, card.value, colW)[0] ?? card.value;
    ctx.fillText(valLine, centerX, valueCenterY);
  });

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function resolveMaybeAbsoluteUrl(src: string): string {
  const raw = String(src ?? "").trim();
  if (!raw) return raw;
  try {
    // Se for path relativo (ex: /img/...), resolve pra URL absoluta.
    return typeof window !== "undefined" && window.location?.origin
      ? new URL(raw, window.location.origin).href
      : raw;
  } catch {
    return raw;
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Quebra em até `maxLines`. Se houver truncamento, adiciona "..." na última linha.
 */
function wrapTextMaxLinesEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const raw = String(text ?? "");
  const words = raw.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines: string[] = [];
  let current = "";
  let truncated = false;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;

    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }

    if (lines.length >= maxLines) {
      // atingiu o limite: trava e marca truncamento
      truncated = i < words.length - 1 || Boolean(current);
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (truncated && lines.length === maxLines) {
    const last = lines[maxLines - 1] ?? "";
    let trimmed = String(last);
    const ellipsis = "...";
    while (trimmed.length > 0 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[maxLines - 1] = `${trimmed.trim()}${ellipsis}`;
  }

  return lines;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.max(0, (iw - sw) / 2);
  const sy = Math.max(0, (ih - sh) / 2);

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * object-fit: contain — imagem inteira visível, centralizada, sem recorte/zoom.
 */
function drawContainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 */
function drawDottedLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save();
  ctx.strokeStyle = SHARE_COLORS.border;
  ctx.setLineDash(SHARE_LAYOUT.dottedDash);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function estimateFinancialHeight(
  ctx: CanvasRenderingContext2D,
  payload: SaleRayXSharePayload,
  innerWidth: number,
) {
  const plan = buildShareLayoutPlan(payload, (tone, margin) =>
    summaryToneToColor(tone as "neutral", margin),
  );
  let h = SHARE_LAYOUT.financialCardPadding * 2;
  for (const row of plan.financialLines) {
    if (row.kind === "blank") h += 6;
    else if (row.kind === "dotted") h += 10;
    else if (row.kind === "section") h += SHARE_FIN_SECTION_LINE_HEIGHT + 4;
    else if (row.kind === "health") h += SHARE_FIN_VALUE_LINE_HEIGHT;
    else if (row.kind === "money") {
      h += row.variant === "resultado" ? SHARE_FIN_VALUE_LINE_HEIGHT : SHARE_FIN_LINE_HEIGHT;
      if (row.detail) h += SHARE_FIN_DETAIL_LINE_HEIGHT;
      if (row.variant !== "resultado") h += FINANCIAL_ENTRY_BREATHING;
    } else if (row.kind === "text") {
      ctx.font = SHARE_FINANCIAL_FONTS.body;
      h += wrapText(ctx, row.text, innerWidth).length * SHARE_FIN_LINE_HEIGHT;
    }
  }
  return h;
}

function measureFooterSignatureContentHeight(
  ctx: CanvasRenderingContext2D,
  footerLines: string[],
  innerWidth: number,
) {
  if (!footerLines.length) return 0;
  ctx.font = SHARE_FONTS.footerSignature;
  let h = 0;
  footerLines.forEach((line, idx) => {
    h += wrapText(ctx, line, innerWidth).length * SHARE_FOOTER_SIGNATURE_LINE_HEIGHT;
    if (idx < footerLines.length - 1) h += SHARE_LAYOUT.footerSignatureLineGap;
  });
  return h;
}

function estimateFooterHeight(
  ctx: CanvasRenderingContext2D,
  payload: SaleRayXSharePayload,
  innerWidth: number,
) {
  const plan = buildShareLayoutPlan(payload, (tone, margin) =>
    summaryToneToColor(tone as "neutral", margin),
  );
  return measureFooterSignatureContentHeight(ctx, plan.footerLines, innerWidth);
}

export type ShareImageFormat = "png" | "jpeg";

export type ExportShareImageOptions = {
  payload: SaleRayXSharePayload;
  format?: ShareImageFormat;
  quality?: number;
};

/**
 * Gera blob PNG/JPEG do Raio-X compartilhável.
 */
export async function exportSaleRayxShareImage(opts: ExportShareImageOptions): Promise<Blob> {
  const payload = opts.payload;
  const format = opts.format ?? "png";
  const quality = opts.quality ?? 0.92;

  const width = SHARE_LAYOUT.canvasWidth;
  const pad = SHARE_LAYOUT.padding;
  const productSize = SHARE_LAYOUT.productImageSize;
  const contentW = width - pad * 2;
  const headerInnerW = contentW - SHARE_LAYOUT.headerShellPadding * 2;
  const headerTextInnerW =
    headerInnerW - productSize - SHARE_LAYOUT.headerImageGap;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas não suportado.");

  const plan = buildShareLayoutPlan(payload, (tone, margin) =>
    summaryToneToColor(tone as "neutral", margin),
  );

  let metaContentH = 0;
  for (const field of plan.metaFields) {
    metaContentH +=
      measureMetaFieldHeight(measureCtx, field, headerTextInnerW) + SHARE_LAYOUT.metaFieldGap;
  }
  const headerShellH = Math.max(
    metaContentH + SHARE_LAYOUT.headerShellPadding * 2,
    productSize + SHARE_LAYOUT.headerShellPadding * 2,
  );
  const logoRowH = SHARE_LAYOUT.logoSize + 14;
  const headerBlockH = logoRowH + headerShellH + SHARE_LAYOUT.headerToKpiGap;

  const kpiBlockHeight = SHARE_LAYOUT.kpiShellHeight + SHARE_LAYOUT.sectionGap;
  const financialInnerWidth = contentW - SHARE_LAYOUT.financialCardPadding * 2;
  const financialHeight = estimateFinancialHeight(measureCtx, payload, financialInnerWidth);
  const footerHeight = estimateFooterHeight(measureCtx, payload, contentW);
  const footerBlockH =
    plan.footerLines.length > 0
      ? SHARE_LAYOUT.footerMarginTop + footerHeight + SHARE_LAYOUT.footerMarginBottom
      : 0;
  const height = pad + headerBlockH + kpiBlockHeight + financialHeight + footerBlockH + pad;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado.");

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  ctx.scale(dpr, dpr);

  ctx.fillStyle = SHARE_COLORS.white;
  ctx.fillRect(0, 0, width, height);

  const [logo, productImg] = await Promise.all([
    loadImage(String(suse7LogoUrl)),
    payload.productImage
      ? loadProductImage(String(payload.productImage), payload.productImageSource)
      : Promise.resolve(null),
  ]);

  let y = pad;

  ctx.drawImage(logo, pad, y, SHARE_LAYOUT.logoSize, SHARE_LAYOUT.logoSize);
  ctx.fillStyle = SHARE_COLORS.text;
  ctx.font = SHARE_FONTS.title;
  ctx.textAlign = "left";
  ctx.fillText(SALE_RAYX_BRAND_TITLE, pad + SHARE_LAYOUT.logoSize + 10, y + 24);

  y += logoRowH;

  const headerShellY = y;
  drawNeutralHeaderShell(ctx, pad, headerShellY, contentW, headerShellH);

  drawHeaderProductImage(
    ctx,
    productImg,
    payload,
    pad,
    headerShellY,
    contentW,
    headerShellH,
    metaContentH,
    productSize,
  );

  const headerInnerX = pad + SHARE_LAYOUT.headerShellPadding;
  let innerY = headerShellY + SHARE_LAYOUT.headerShellPadding;
  for (const field of plan.metaFields) {
    innerY = drawMetaField(ctx, field, innerY, headerInnerX, headerTextInnerW);
  }

  y = headerShellY + headerShellH + SHARE_LAYOUT.headerToKpiGap;

  const kpiY = y;
  drawHealthKpiShell(ctx, pad, kpiY, contentW, plan.healthVisual, plan.kpiCards);

  y = kpiY + SHARE_LAYOUT.kpiShellHeight + SHARE_LAYOUT.sectionGap;

  const cardX = pad;
  const cardW = contentW;
  const cardInnerX = cardX + SHARE_LAYOUT.financialCardPadding;
  const cardInnerW = cardW - SHARE_LAYOUT.financialCardPadding * 2;
  const cardH = financialHeight;
  drawHealthShell(ctx, cardX, y, cardW, cardH, plan.healthVisual);

  let fy = y + SHARE_LAYOUT.financialCardPadding;
  const valueColumnX = cardInnerX + cardInnerW - SHARE_LAYOUT.financialValueRightInset;

  for (const row of plan.financialLines) {
    if (row.kind === "blank") {
      fy += 6;
      continue;
    }
    if (row.kind === "dotted") {
      drawDottedLine(ctx, cardInnerX, fy + 4, cardInnerW);
      fy += 10;
      continue;
    }
    if (row.kind === "section") {
      ctx.font = SHARE_FINANCIAL_FONTS.section;
      ctx.fillStyle = SHARE_COLORS.text;
      ctx.fillText(row.text.toUpperCase(), cardInnerX, fy + 13);
      fy += SHARE_FIN_SECTION_LINE_HEIGHT + 4;
      continue;
    }
    if (row.kind === "health") {
      ctx.textAlign = "left";
      ctx.font = SHARE_FINANCIAL_FONTS.body;
      ctx.fillStyle = SHARE_COLORS.text;
      ctx.fillText("Saúde da venda", cardInnerX, fy + 15);
      ctx.textAlign = "right";
      ctx.font = SHARE_FINANCIAL_FONTS.valuePrimary;
      ctx.fillStyle = plan.healthVisual.valueColor;
      ctx.fillText(row.value, valueColumnX, fy + 15);
      ctx.textAlign = "left";
      fy += SHARE_FIN_VALUE_LINE_HEIGHT;
      continue;
    }
    if (row.kind === "money") {
      const isResultado = row.variant === "resultado";
      ctx.textAlign = "left";
      ctx.font = SHARE_FINANCIAL_FONTS.body;
      ctx.fillStyle = SHARE_COLORS.text;
      ctx.fillText(row.label, cardInnerX, fy + (isResultado ? 15 : 14));
      ctx.textAlign = "right";
      ctx.font = SHARE_FINANCIAL_FONTS.valuePrimary;
      ctx.fillStyle = row.color;
      ctx.fillText(row.value, valueColumnX, fy + (isResultado ? 15 : 14));
      ctx.textAlign = "left";
      fy += isResultado ? SHARE_FIN_VALUE_LINE_HEIGHT : SHARE_FIN_LINE_HEIGHT;
      if (row.detail) {
        ctx.font = SHARE_FINANCIAL_FONTS.detail;
        ctx.fillStyle = SHARE_COLORS.detail;
        ctx.fillText(row.detail, cardInnerX, fy + 12);
        fy += SHARE_FIN_DETAIL_LINE_HEIGHT;
      }
      // Respiro entre grupos financeiros (Receita/Custos); auxiliar fica colada acima.
      if (!isResultado) fy += FINANCIAL_ENTRY_BREATHING;
      continue;
    }
    if (row.kind === "text") {
      ctx.font = SHARE_FINANCIAL_FONTS.body;
      ctx.fillStyle = row.color ?? SHARE_COLORS.text;
      for (const part of wrapText(ctx, row.text, cardInnerW)) {
        ctx.fillText(part, cardInnerX, fy + 14);
        fy += SHARE_FIN_LINE_HEIGHT;
      }
    }
  }

  if (plan.footerLines.length) {
    const footerBlockStart = y + cardH;
    const footerContentH = measureFooterSignatureContentHeight(
      ctx,
      plan.footerLines,
      contentW,
    );
    const footerBlockH =
      SHARE_LAYOUT.footerMarginTop + footerContentH + SHARE_LAYOUT.footerMarginBottom;
    let cy =
      footerBlockStart +
      (footerBlockH - footerContentH) / 2 +
      SHARE_FOOTER_SIGNATURE_LINE_HEIGHT / 2;

    ctx.font = SHARE_FONTS.footerSignature;
    ctx.fillStyle = SHARE_COLORS.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    plan.footerLines.forEach((line, idx) => {
      for (const part of wrapText(ctx, line, contentW)) {
        ctx.fillText(part, width / 2, cy);
        cy += SHARE_FOOTER_SIGNATURE_LINE_HEIGHT;
      }
      if (idx < plan.footerLines.length - 1) {
        cy += SHARE_LAYOUT.footerSignatureLineGap;
      }
    });

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }

  return new Promise((resolve, reject) => {
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem do Raio-X."))),
      mime,
      quality,
    );
  });
}
