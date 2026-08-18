// ======================================================================
// KPI adaptável — Pedidos e Faturamento (Resumo Diário).
// ======================================================================

import { useLayoutEffect, useRef } from "react";
import {
  S7_DAILY_SUMMARY_ADAPTIVE_PRESETS,
  calcularFonteQueCabe,
  lerLarguraUtilMetricRow,
  lerPxPorRem,
  lerRemMaximoAdaptavel,
} from "./s7DailySummaryAdaptiveValueUtils.js";

/**
 * @param {{
 *   value?: string | number | null;
 *   variant: "orders" | "revenue";
 * }} props
 */
export default function S7DailySummaryAdaptiveMetricValue({ value, variant }) {
  const preset = S7_DAILY_SUMMARY_ADAPTIVE_PRESETS[variant];
  const fitRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const textRef = useRef(/** @type {HTMLSpanElement | null} */ (null));

  const textoExibido = value != null && String(value).trim() !== "" ? String(value).trim() : "—";

  useLayoutEffect(() => {
    const container = fitRef.current;
    const texto = textRef.current;
    if (!container || !texto || !preset) return;

    const aplicar = () => {
      const pxPorRem = lerPxPorRem();
      const maxPx = lerRemMaximoAdaptavel(preset.maxRemDesktop, preset.maxRemMobile) * pxPorRem;
      const minPx = preset.minRem * pxPorRem;
      const largura = lerLarguraUtilMetricRow(container);
      const px = calcularFonteQueCabe(largura, texto, maxPx, minPx);
      texto.style.fontSize = `${px}px`;
    };

    aplicar();
    const id = window.requestAnimationFrame(() => aplicar());

    const observer = new ResizeObserver(() => aplicar());

    const row = container.closest(".s7-daily-summary__metric-value-row");
    if (row instanceof HTMLElement) {
      observer.observe(row);
    }

    const metricEl = container.closest(
      `.s7-daily-summary__metric[data-metric-id="${preset.metricId}"]`,
    );
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
  }, [textoExibido, preset]);

  return (
    <span ref={fitRef} className="s7-daily-summary__metric-value-fit">
      <span
        ref={textRef}
        className={[
          "s7-daily-summary__metric-value-main",
          "s7-daily-summary__metric-value-main--adaptive",
          preset?.mainClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {textoExibido}
      </span>
    </span>
  );
}
