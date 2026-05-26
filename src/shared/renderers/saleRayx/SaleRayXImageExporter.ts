// =============================================================================
// Exportação Canvas → PNG/JPG — layout premium alinhado ao modal Raio-X
// =============================================================================

import suse7LogoUrl from "../../../assets/suse7-logo-redonda.png";
import {
  computeMoneyColumnLayout,
  summaryToneToColor,
} from "../../../components/sales/saleRayxSummaryRender.js";
import { SALE_RAYX_BRAND_TITLE } from "../../../components/sales/saleRayxSummary.js";
import {
  SHARE_COLORS,
  SHARE_DETAIL_LINE_HEIGHT,
  SHARE_FONTS,
  SHARE_LAYOUT,
  SHARE_LINE_HEIGHT,
} from "./SaleRayXShareStyles.js";
import {
  buildShareLayoutPlan,
  type SaleRayXSharePayload,
  type ShareMetaField,
} from "./SaleRayXShareLayout.js";
import type { SaleHealthVisualState } from "./saleRayxShareHealthVisual.js";

function loadImage(src: string, useCors = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = resolveMaybeAbsoluteUrl(src);
  });
}

async function loadProductImage(src: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(src, true);
  } catch {
    try {
      return await loadImage(src, false);
    } catch {
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
  if (!metaFieldHasLabel(field)) {
    ctx.font = SHARE_FONTS.metaBold;
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
  return measureMetaFieldLines(ctx, field, metaTextWidth).length * SHARE_LINE_HEIGHT;
}

function drawMetaField(
  ctx: CanvasRenderingContext2D,
  field: ShareMetaField,
  startY: number,
  pad: number,
  metaTextWidth: number,
): number {
  if (!metaFieldHasLabel(field)) {
    ctx.font = SHARE_FONTS.metaBold;
    ctx.fillStyle = SHARE_COLORS.text;
    const valueLines = measureMetaFieldLines(ctx, field, metaTextWidth);
    for (let i = 0; i < valueLines.length; i += 1) {
      ctx.fillText(valueLines[i], pad, startY + 13 + i * SHARE_LINE_HEIGHT);
    }
    return startY + valueLines.length * SHARE_LINE_HEIGHT + SHARE_LAYOUT.metaFieldGap;
  }

  ctx.font = SHARE_FONTS.meta;
  const label = `${field.label}: `;
  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = SHARE_COLORS.muted;
  ctx.fillText(label, pad, startY + 13);

  ctx.font = SHARE_FONTS.metaBold;
  const valueColor =
    field.valueTone === "accent" && field.accentColor ? field.accentColor : SHARE_COLORS.text;
  ctx.fillStyle = valueColor;

  const valueMaxWidth = Math.max(50, metaTextWidth - labelW);
  const valueLines =
    field.truncateMode === "twoLineEllipsis"
      ? wrapTextMaxLinesEllipsis(ctx, field.value, valueMaxWidth, 2)
      : wrapText(ctx, field.value, valueMaxWidth);

  const valueX = pad + labelW;
  for (let i = 0; i < valueLines.length; i += 1) {
    ctx.fillText(valueLines[i], valueX, startY + 13 + i * SHARE_LINE_HEIGHT);
  }

  return startY + valueLines.length * SHARE_LINE_HEIGHT + SHARE_LAYOUT.metaFieldGap;
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
  const radius = 10;
  const borderWidth = healthVisual.tone === "critical" ? 2 : 1.5;

  ctx.fillStyle = healthVisual.backgroundColor;
  roundRect(ctx, x, y, width, h, radius);
  ctx.fill();

  ctx.strokeStyle = healthVisual.borderColor;
  ctx.lineWidth = borderWidth;
  roundRect(ctx, x, y, width, h, radius);
  ctx.stroke();

  const innerPad = SHARE_LAYOUT.kpiShellPadding;
  const colGap = SHARE_LAYOUT.kpiColumnGap;
  const innerW = width - innerPad * 2;
  const colW = (innerW - colGap * 2) / 3;

  cards.forEach((card, idx) => {
    const colX = x + innerPad + idx * (colW + colGap);
    const labelY = y + innerPad + 12;
    const valueY = y + h - innerPad - 6;

    ctx.textAlign = "left";
    ctx.font = SHARE_FONTS.kpiLabel;
    ctx.fillStyle = healthVisual.kpiLabelColor;
    ctx.fillText(card.label, colX, labelY);

    ctx.font = SHARE_FONTS.kpiValue;
    ctx.fillStyle = card.valueColor;
    const valLine = wrapText(ctx, card.value, colW)[0] ?? card.value;
    ctx.fillText(valLine, colX, valueY);
  });

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
    else if (row.kind === "section") h += SHARE_LINE_HEIGHT + 4;
    else if (row.kind === "money") {
      h += SHARE_LINE_HEIGHT;
      if (row.detail) h += SHARE_DETAIL_LINE_HEIGHT;
    } else if (row.kind === "text") {
      ctx.font = SHARE_FONTS.body;
      h += wrapText(ctx, row.text, innerWidth).length * SHARE_LINE_HEIGHT;
    }
  }
  for (const line of plan.footerLines) {
    ctx.font = SHARE_FONTS.footer;
    h += wrapText(ctx, line, innerWidth).length * 14 + 2;
  }
  return h;
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
  const productX = width - pad - productSize - SHARE_LAYOUT.productInsetFromRight;
  const metaTextWidth = productX - pad - SHARE_LAYOUT.headerGap;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas não suportado.");

  const plan = buildShareLayoutPlan(payload, (tone, margin) =>
    summaryToneToColor(tone as "neutral", margin),
  );

  let metaHeight = pad + SHARE_LAYOUT.logoSize + 14;
  for (const field of plan.metaFields) {
    metaHeight += measureMetaFieldHeight(measureCtx, field, metaTextWidth) + SHARE_LAYOUT.metaFieldGap;
  }

  const headerHeight = Math.max(metaHeight, pad + productSize + 8);
  const kpiBlockHeight = SHARE_LAYOUT.kpiShellHeight + SHARE_LAYOUT.sectionGap;
  const financialInnerWidth = width - pad * 2 - SHARE_LAYOUT.financialCardPadding * 2;
  const financialHeight = estimateFinancialHeight(measureCtx, payload, financialInnerWidth);
  const height =
    headerHeight + kpiBlockHeight + financialHeight + SHARE_LAYOUT.financialCardPadding + pad;

  const moneyLayout = computeMoneyColumnLayout(measureCtx, payload.renderModel);

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
    payload.productImage ? loadProductImage(String(payload.productImage)) : Promise.resolve(null),
  ]);

  let y = pad;
  const productY = pad + 2;
  const productCenterX = productX + productSize / 2;
  const productCenterY = productY + productSize / 2;

  ctx.drawImage(logo, pad, y, SHARE_LAYOUT.logoSize, SHARE_LAYOUT.logoSize);
  ctx.fillStyle = SHARE_COLORS.text;
  ctx.font = SHARE_FONTS.title;
  ctx.textAlign = "left";
  ctx.fillText(SALE_RAYX_BRAND_TITLE, pad + SHARE_LAYOUT.logoSize + 10, y + 24);

  if (productImg) {
    const r = productSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(productCenterX, productCenterY, r, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImage(ctx, productImg, productX, productY, productSize, productSize);
    ctx.restore();
  } else {
    const r = productSize / 2;
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

  y += SHARE_LAYOUT.logoSize + 14;

  for (const field of plan.metaFields) {
    y = drawMetaField(ctx, field, y, pad, metaTextWidth);
  }

  y = Math.max(y, pad + productSize + SHARE_LAYOUT.sectionGap);

  const kpiY = y;
  drawHealthKpiShell(ctx, pad, kpiY, contentW, plan.healthVisual, plan.kpiCards);

  y = kpiY + SHARE_LAYOUT.kpiShellHeight + SHARE_LAYOUT.sectionGap;

  const cardX = pad;
  const cardW = contentW;
  const cardInnerX = cardX + SHARE_LAYOUT.financialCardPadding;
  const cardInnerW = cardW - SHARE_LAYOUT.financialCardPadding * 2;
  const cardH = financialHeight;
  ctx.fillStyle = SHARE_COLORS.white;
  roundRect(ctx, cardX, y, cardW, cardH, SHARE_LAYOUT.financialCardRadius);
  ctx.fill();
  ctx.strokeStyle = SHARE_COLORS.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  let fy = y + SHARE_LAYOUT.financialCardPadding;
  const valueColumnX = cardInnerX + moneyLayout.valueRightX;

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
      ctx.font = SHARE_FONTS.section;
      ctx.fillStyle = SHARE_COLORS.text;
      ctx.fillText(row.text.toUpperCase(), cardInnerX, fy + 12);
      fy += SHARE_LINE_HEIGHT + 4;
      continue;
    }
    if (row.kind === "money") {
      ctx.textAlign = "left";
      ctx.font = SHARE_FONTS.body;
      ctx.fillStyle = SHARE_COLORS.text;
      ctx.fillText(row.label, cardInnerX, fy + 13);
      ctx.textAlign = "right";
      ctx.font = SHARE_FONTS.bodyBold;
      ctx.fillStyle = row.color;
      ctx.fillText(row.value, valueColumnX, fy + 13);
      ctx.textAlign = "left";
      fy += SHARE_LINE_HEIGHT;
      if (row.detail) {
        ctx.font = SHARE_FONTS.detail;
        ctx.fillStyle = SHARE_COLORS.detail;
        ctx.fillText(row.detail, cardInnerX, fy + 11);
        fy += SHARE_DETAIL_LINE_HEIGHT;
      }
      continue;
    }
    if (row.kind === "text") {
      ctx.font = SHARE_FONTS.body;
      ctx.fillStyle = row.color ?? SHARE_COLORS.text;
      for (const part of wrapText(ctx, row.text, cardInnerW)) {
        ctx.fillText(part, cardInnerX, fy + 13);
        fy += SHARE_LINE_HEIGHT;
      }
    }
  }

  if (plan.footerLines.length) {
    fy += 6;
    drawDottedLine(ctx, cardInnerX, fy, cardInnerW);
    fy += 12;
    ctx.font = SHARE_FONTS.footer;
    ctx.fillStyle = SHARE_COLORS.muted;
    for (const line of plan.footerLines) {
      for (const part of wrapText(ctx, line, cardInnerW)) {
        ctx.fillText(part, cardInnerX, fy + 10);
        fy += 14;
      }
    }
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
