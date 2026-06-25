// ======================================================================
// Faturamento — Resumo Diário: fonte adaptável à largura da célula + dígitos.
// ======================================================================

import { useLayoutEffect, useRef } from "react";

const FATURAMENTO_MAX_REM_DESKTOP = 4.17;
const FATURAMENTO_MAX_REM_MOBILE = 3.44;
const FATURAMENTO_MIN_REM = 1.15;

/** @returns {number} */
function lerRemMaximoFaturamento() {
  if (typeof window === "undefined") return FATURAMENTO_MAX_REM_DESKTOP;
  return window.matchMedia("(max-width: 640px)").matches
    ? FATURAMENTO_MAX_REM_MOBILE
    : FATURAMENTO_MAX_REM_DESKTOP;
}

/** @returns {number} */
function lerPxPorRem() {
  if (typeof document === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * Largura útil da célula do faturamento (coluna do bloco Vendas).
 * @param {HTMLElement} el
 */
function lerLarguraCelulaFaturamento(el) {
  const metric = el.closest('.s7-daily-summary__metric[data-metric-id="revenue"]');
  const valueCell = el.closest(".s7-daily-summary__metric-value");
  const alvo = valueCell instanceof HTMLElement ? valueCell : metric instanceof HTMLElement ? metric : el;
  const estilo = getComputedStyle(alvo);
  const pad =
    (parseFloat(estilo.paddingLeft) || 0) + (parseFloat(estilo.paddingRight) || 0);
  return Math.max(0, alvo.clientWidth - pad);
}

/**
 * Maior fonte (px) em que o texto cabe na largura disponível.
 * @param {number} larguraDisponivel
 * @param {HTMLElement} textoEl
 * @param {number} maxPx
 * @param {number} minPx
 */
function calcularFonteQueCabe(larguraDisponivel, textoEl, maxPx, minPx) {
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

/**
 * @param {{ value?: string | number | null }} props
 */
export default function S7DailySummaryAdaptiveRevenueValue({ value }) {
  const fitRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const textRef = useRef(/** @type {HTMLSpanElement | null} */ (null));

  const textoExibido = value != null && String(value).trim() !== "" ? String(value).trim() : "—";

  useLayoutEffect(() => {
    const container = fitRef.current;
    const texto = textRef.current;
    if (!container || !texto) return;

    const aplicar = () => {
      const pxPorRem = lerPxPorRem();
      const maxPx = lerRemMaximoFaturamento() * pxPorRem;
      const minPx = FATURAMENTO_MIN_REM * pxPorRem;
      const largura = lerLarguraCelulaFaturamento(container);
      const px = calcularFonteQueCabe(largura, texto, maxPx, minPx);
      texto.style.fontSize = `${px}px`;
    };

    aplicar();
    const id = window.requestAnimationFrame(() => aplicar());

    const observer = new ResizeObserver(() => aplicar());

    const valueCell = container.closest(".s7-daily-summary__metric-value");
    if (valueCell instanceof HTMLElement) {
      observer.observe(valueCell);
    }

    const metricEl = container.closest('.s7-daily-summary__metric[data-metric-id="revenue"]');
    if (metricEl instanceof HTMLElement) {
      observer.observe(metricEl);
    }

    const salesBlock = container.closest('.s7-daily-summary__block[data-block-id="sales"]');
    if (salesBlock instanceof HTMLElement) {
      observer.observe(salesBlock);
    }

    const mq = window.matchMedia("(max-width: 640px)");
    mq.addEventListener("change", aplicar);

    return () => {
      window.cancelAnimationFrame(id);
      observer.disconnect();
      mq.removeEventListener("change", aplicar);
    };
  }, [textoExibido]);

  return (
    <span ref={fitRef} className="s7-daily-summary__metric-value-fit">
      <span ref={textRef} className="s7-daily-summary__metric-value-main s7-daily-summary__metric-value-main--adaptive">
        {textoExibido}
      </span>
    </span>
  );
}
