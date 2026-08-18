// ======================================================
// S4.3.6.24/25/27 — Lane divergente: título + métricas ancorados no eixo.
// Somente a barra muda de comprimento; métricas sobrepostas com contraste.
// ======================================================

import { useEffect, useRef, useState } from "react";
import {
  calcularLarguraMeiaBarraDivergentePct,
  classificarDisponibilidadeFinanceiraLane,
  montarAriaLabelLaneDivergente,
  OFFER_COMPARE_METRICS_INNER_PADDING_PX,
  resolveOfferComparisonMetricsContrastMode,
  resolverLadoLucroDivergente,
  stripLeadingMoneySign,
} from "./offerComparisonDivergingChartUi.js";
import OfferComparisonMetricsOverlay from "./OfferComparisonMetricsOverlay.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";

/** Padding horizontal do overlay em relação ao eixo (px). */
const LANE_METRICS_AXIS_PADDING_PX = 6;

/**
 * @param {{
 *   lane: {
 *     key: string;
 *     shortLabel: string;
 *     saleLabelText: string;
 *     labelText: string;
 *     marginCompactText: string;
 *     summaryText: string;
 *     marginHealthClass: string;
 *     statusLabel: string;
 *     profitDec: import("decimal.js").default | null;
 *     isBaseline?: boolean;
 *     pending?: boolean;
 *     error?: boolean;
 *     financialAvailability?: "RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED";
 *     canonicalSource?: string | null;
 *     scenarioStatus?: string | null;
 *   };
 *   maxAbs: import("decimal.js").default;
 *   selected?: boolean;
 * }} props
 */
export default function OfferComparisonDivergingLane({ lane, maxAbs, selected = false }) {
  const availability = classificarDisponibilidadeFinanceiraLane(lane);
  const side =
    availability === "NO_FINANCIAL_DATA" || availability === "ERROR_FAIL_CLOSED"
      ? "zero"
      : lane.pending || availability === "PENDING"
        ? "pending"
        : lane.profitDec == null && lane.error
          ? "pending"
          : resolverLadoLucroDivergente(lane.profitDec);

  const widthPct =
    availability === "NO_FINANCIAL_DATA" || availability === "ERROR_FAIL_CLOSED"
      ? 0
      : calcularLarguraMeiaBarraDivergentePct(lane.profitDec, maxAbs);

  const titleNeedsTooltip = String(lane.shortLabel || "").length > 28;

  const toneClass =
    availability === "NO_FINANCIAL_DATA"
      ? "anuncios-sell-popover__offer-sem--regular"
      : side === "negative"
        ? "anuncios-sell-popover__offer-sem--critical"
        : lane.marginHealthClass || "";

  const ariaLabel = montarAriaLabelLaneDivergente({
    name: lane.shortLabel,
    saleLabel: lane.saleLabelText,
    profitLabel: lane.labelText,
    marginLabel: lane.marginCompactText,
    statusLabel: lane.statusLabel,
    side,
    profitAbsLabel: stripLeadingMoneySign(lane.labelText),
    marginAbsLabel: stripLeadingMoneySign(lane.marginCompactText).replace(/%$/, ""),
    financialAvailability: availability,
  });

  const halfRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const fillRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const metricsRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const contrastRef = useRef(/** @type {"inside" | "outside"} */ ("outside"));
  const [contrastMode, setContrastMode] = useState(/** @type {"inside" | "outside"} */ ("outside"));

  useEffect(() => {
    const halfEl = halfRef.current;
    const metricsEl = metricsRef.current;
    if (halfEl == null || metricsEl == null) {
      contrastRef.current = "outside";
      setContrastMode("outside");
      return;
    }

    const measure = () => {
      const metricsWidthPx = metricsEl.getBoundingClientRect().width;
      const halfWidthPx = halfEl.getBoundingClientRect().width;
      const fillEl = fillRef.current;
      const barWidthPx =
        fillEl != null
          ? fillEl.getBoundingClientRect().width
          : side === "positive" || side === "negative"
            ? (halfWidthPx * Math.max(0, Math.min(100, widthPct))) / 100
            : 0;

      const next = resolveOfferComparisonMetricsContrastMode({
        side,
        barWidthPx,
        metricsWidthPx,
        innerPaddingPx: OFFER_COMPARE_METRICS_INNER_PADDING_PX,
        previousMode: contrastRef.current,
      });
      if (next !== contrastRef.current) {
        contrastRef.current = next;
        setContrastMode(next);
      }
    };

    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro != null) {
      ro.observe(halfEl);
      ro.observe(metricsEl);
      if (fillRef.current != null) ro.observe(fillRef.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [side, widthPct, lane.saleLabelText, lane.labelText, lane.marginCompactText, availability]);

  const rowClass = [
    "s7-offer-diverging-lane",
    `s7-offer-diverging-lane--${side}`,
    selected ? "s7-offer-diverging-lane--selected" : "",
    lane.pending ? "s7-offer-diverging-lane--pending" : "",
    lane.error ? "s7-offer-diverging-lane--error" : "",
    availability === "NO_FINANCIAL_DATA" ? "s7-offer-diverging-lane--no-data" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const titleNode = (
    <span className="s7-offer-diverging-lane__title">{lane.shortLabel}</span>
  );

  const titleWrapped = titleNeedsTooltip ? (
    <S7Tooltip content={lane.shortLabel} placement="bottom-start" offset={6} wrap>
      {titleNode}
    </S7Tooltip>
  ) : (
    titleNode
  );

  const fillClass = [
    "s7-offer-diverging-lane__fill",
    toneClass || "s7-offer-diverging-lane__fill--neutral",
  ]
    .filter(Boolean)
    .join(" ");

  const showTitleNeg = side === "negative";
  const showTitlePos = side === "positive" || side === "zero" || side === "pending";
  const showMetricsNeg = side === "negative";
  const showMetricsPos = side === "positive" || side === "zero" || side === "pending";

  const metricsOverlay = (
    <div
      ref={metricsRef}
      className={[
        "s7-offer-diverging-lane__metrics-overlay",
        showMetricsNeg
          ? "s7-offer-diverging-lane__metrics-overlay--neg"
          : "s7-offer-diverging-lane__metrics-overlay--pos",
      ].join(" ")}
      style={{
        [showMetricsNeg ? "right" : "left"]: `${LANE_METRICS_AXIS_PADDING_PX}px`,
      }}
    >
      <OfferComparisonMetricsOverlay
        saleLabel={lane.saleLabelText}
        profitLabel={lane.labelText}
        marginLabel={lane.marginCompactText}
        side={side}
        contrastMode={contrastMode}
        toneClass={toneClass}
        financialAvailability={availability}
      />
    </div>
  );

  return (
    <div className={rowClass} role="listitem" aria-label={ariaLabel}>
      <div className="s7-offer-diverging-lane__title-row">
        <div className="s7-offer-diverging-lane__title-slot s7-offer-diverging-lane__title-slot--neg">
          {showTitleNeg ? titleWrapped : null}
        </div>
        <div className="s7-offer-diverging-lane__axis-gap" aria-hidden />
        <div className="s7-offer-diverging-lane__title-slot s7-offer-diverging-lane__title-slot--pos">
          {showTitlePos ? titleWrapped : null}
        </div>
      </div>

      <div className="s7-offer-diverging-lane__bar-row s7-offer-diverging-lane__metrics-row">
        <div
          ref={showMetricsNeg ? halfRef : undefined}
          className="s7-offer-diverging-lane__half s7-offer-diverging-lane__half--neg"
        >
          {side === "negative" ? (
            <div ref={fillRef} className={fillClass} style={{ width: `${widthPct}%` }} />
          ) : null}
          {showMetricsNeg ? metricsOverlay : null}
        </div>

        <div className="s7-offer-diverging-lane__axis" aria-hidden>
          {side === "zero" ? <span className="s7-offer-diverging-lane__zero-marker" /> : null}
        </div>

        <div
          ref={showMetricsPos ? halfRef : undefined}
          className="s7-offer-diverging-lane__half s7-offer-diverging-lane__half--pos"
        >
          {side === "positive" ? (
            <div ref={fillRef} className={fillClass} style={{ width: `${widthPct}%` }} />
          ) : null}

          {showMetricsPos && !lane.pending ? metricsOverlay : null}

          {side === "pending" ? (
            <>
              <span className="s7-offer-diverging-lane__skeleton" aria-hidden />
              <div
                ref={metricsRef}
                className="s7-offer-diverging-lane__metrics-overlay s7-offer-diverging-lane__metrics-overlay--pos s7-offer-diverging-lane__metrics-overlay--pending"
                style={{ left: `${LANE_METRICS_AXIS_PADDING_PX}px` }}
                aria-hidden
              >
                <OfferComparisonMetricsOverlay
                  saleLabel={lane.saleLabelText}
                  profitLabel="—"
                  marginLabel="—"
                  side="pending"
                  contrastMode="outside"
                  toneClass=""
                  financialAvailability="PENDING"
                />
              </div>
            </>
          ) : null}

          {lane.error && !lane.pending ? (
            <span className="s7-offer-diverging-lane__error-hint">Indisponível</span>
          ) : null}
        </div>
      </div>

      <span className="s7-offer-diverging-lane__sr-only">
        {lane.shortLabel}.{" "}
        {availability === "NO_FINANCIAL_DATA" || availability === "ERROR_FAIL_CLOSED"
          ? "Oferta sem valor financeiro confirmado."
          : null}{" "}
        Valor de venda {lane.saleLabelText}.{" "}
        {side === "negative" ? "Prejuízo" : "Lucro"} {lane.labelText}. Margem {lane.marginCompactText}.{" "}
        {lane.statusLabel}.
      </span>
    </div>
  );
}
