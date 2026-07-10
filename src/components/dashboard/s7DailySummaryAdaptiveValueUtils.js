// ======================================================================
// Utilitários — fonte adaptável nos KPIs Pedidos e Faturamento (Resumo Diário).
// ======================================================================

/** @param {number} maxRemDesktop @param {number} maxRemMobile */
export function lerRemMaximoAdaptavel(maxRemDesktop, maxRemMobile) {
  if (typeof window === "undefined") return maxRemDesktop;
  return window.matchMedia("(max-width: 640px)").matches ? maxRemMobile : maxRemDesktop;
}

/** @returns {number} */
export function lerPxPorRem() {
  if (typeof document === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * Largura útil dentro da linha valor + ícone.
 * @param {HTMLElement} el
 */
export function lerLarguraUtilMetricRow(el) {
  const row = el.closest(".s7-daily-summary__metric-value-row");
  if (!(row instanceof HTMLElement)) {
    return Math.max(0, el.clientWidth);
  }

  const estiloRow = getComputedStyle(row);
  const gap = parseFloat(estiloRow.columnGap || estiloRow.gap) || 8;
  const iconWrap = row.querySelector(".s7-daily-summary__metric-value-icon-wrap");
  const iconW =
    iconWrap instanceof HTMLElement ? iconWrap.getBoundingClientRect().width : 0;

  const fit = row.querySelector(".s7-daily-summary__metric-value-fit");
  const alvo = fit instanceof HTMLElement ? fit : el;
  const estilo = getComputedStyle(alvo);
  const pad =
    (parseFloat(estilo.paddingLeft) || 0) + (parseFloat(estilo.paddingRight) || 0);

  return Math.max(0, row.clientWidth - iconW - (iconW > 0 ? gap : 0) - pad);
}

/**
 * @param {number} larguraDisponivel
 * @param {HTMLElement} textoEl
 * @param {number} maxPx
 * @param {number} minPx
 */
export function calcularFonteQueCabe(larguraDisponivel, textoEl, maxPx, minPx) {
  if (larguraDisponivel <= 0) return maxPx;

  textoEl.style.display = "inline-block";
  textoEl.style.whiteSpace = "nowrap";
  textoEl.style.maxWidth = "none";
  textoEl.style.width = "auto";

  const medirTexto = (px) => {
    textoEl.style.fontSize = `${px}px`;
    return textoEl.getBoundingClientRect().width;
  };

  if (medirTexto(maxPx) <= larguraDisponivel) {
    return maxPx;
  }

  if (medirTexto(minPx) > larguraDisponivel) {
    return minPx;
  }

  let min = minPx;
  let max = maxPx;
  let melhor = minPx;

  for (let i = 0; i < 32 && max - min > 0.35; i += 1) {
    const meio = (min + max) / 2;
    if (medirTexto(meio) <= larguraDisponivel) {
      melhor = meio;
      min = meio;
    } else {
      max = meio;
    }
  }

  return melhor;
}

/** @type {Record<string, { maxRemDesktop: number; maxRemMobile: number; minRem: number; metricId: string; mainClass: string }>} */
export const S7_DAILY_SUMMARY_ADAPTIVE_PRESETS = {
  orders: {
    metricId: "orders",
    maxRemDesktop: 3.04,
    maxRemMobile: 2.775,
    minRem: 0.95,
    mainClass: "s7-daily-summary__metric-value-main--adaptive-orders",
  },
  revenue: {
    metricId: "revenue",
    maxRemDesktop: 4.17,
    maxRemMobile: 3.44,
    minRem: 1.15,
    mainClass: "s7-daily-summary__metric-value-main--adaptive-revenue",
  },
};
