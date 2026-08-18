// ======================================================
// S4.3.6.24 — Lista divergente (eixo zero + lanes ordenadas).
// ======================================================

import { useMemo } from "react";
import OfferComparisonDivergingLane from "./OfferComparisonDivergingLane.jsx";
import {
  calcularMaxAbsLucroDivergente,
  classificarDisponibilidadeFinanceiraLane,
  ordenarSeriesDivergentePorLucroDesc,
} from "./offerComparisonDivergingChartUi.js";

/**
 * @param {{
 *   series: {
 *     key: string;
 *     tabId: string;
 *     shortLabel: string;
 *     saleLabelText: string;
 *     labelText: string;
 *     marginCompactText: string;
 *     summaryText: string;
 *     marginHealthClass: string;
 *     statusLabel: string;
 *     profitDec: import("decimal.js").default | null;
 *     isBaseline?: boolean;
 *     originIndex?: number;
 *     pending?: boolean;
 *     error?: boolean;
 *     financialAvailability?: "RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED";
 *     canonicalSource?: string | null;
 *     scenarioStatus?: string | null;
 *   }[];
 *   selectedTabId?: string | null;
 * }} props
 */
export default function OfferComparisonDivergingChart({ series, selectedTabId = null }) {
  const ranked = useMemo(() => ordenarSeriesDivergentePorLucroDesc(series), [series]);
  const maxAbs = useMemo(
    () =>
      calcularMaxAbsLucroDivergente(
        ranked
          .filter((s) => classificarDisponibilidadeFinanceiraLane(s) === "RESOLVED_NUMERIC")
          .map((s) => s.profitDec),
      ),
    [ranked],
  );

  return (
    <div className="s7-offer-diverging-chart" role="list">
      <div className="s7-offer-diverging-chart__zero-line" aria-hidden />
      <div className="s7-offer-diverging-chart__lanes">
        {ranked.map((lane) => {
          const isSelected =
            selectedTabId != null &&
            String(selectedTabId).trim() !== "" &&
            lane.tabId != null &&
            String(lane.tabId) === String(selectedTabId).trim();
          return (
            <OfferComparisonDivergingLane
              key={lane.key}
              lane={lane}
              maxAbs={maxAbs}
              selected={isSelected}
            />
          );
        })}
      </div>
      <div className="s7-offer-diverging-chart__zero-foot" aria-hidden>
        <span className="s7-offer-diverging-chart__zero-label">0</span>
      </div>
    </div>
  );
}
