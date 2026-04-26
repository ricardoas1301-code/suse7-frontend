// ======================================================
// Item compacto do rail / sidebar de cenários (página Precificação Inteligente).
// ======================================================

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cardHeadingLabel, resolveRaioxListingBadge } from "../mercadoLivrePricingScenarioCompareShared.js";
import { resolveMlScenarioTabId } from "../MercadoLivrePricingScenarioRaiox.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import { formatCatalogBRL } from "../../utils/productCatalogRow";
import { getScenarioHealthStatus, parseScenarioProfitBrlNumber } from "./pricingScenarioDecisionUi.js";

/** @param {string | null | undefined} s */
function formatBrlCompact(s) {
  if (s == null || String(s).trim() === "") return "—";
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return formatCatalogBRL(n);
}

/** @param {"active" | "scheduled" | "available" | "baseline" | "neutral"} kind */
function sidebarStatusBadgeClass(kind) {
  const base = "s7-ml-scenario-compare__badge";
  if (kind === "active") return `${base} s7-ml-scenario-compare__badge--participating`;
  if (kind === "scheduled" || kind === "available") return `${base} s7-ml-scenario-compare__badge--available`;
  return `${base} s7-ml-scenario-compare__badge--neutral`;
}

/** @param {string | null} statusLabel @param {string} group */
function resolveCardStatusKind(statusLabel, group) {
  const st = statusLabel != null ? statusLabel.toLowerCase() : "";
  if (group === "baseline") return "baseline";
  if (st.includes("program")) return "scheduled";
  if (st.includes("dispon")) return "available";
  if (st.includes("ativa")) return "active";
  if (group === "participating") return "active";
  if (group === "available") return "available";
  return "neutral";
}

/**
 * @param {{
 *   scenario: unknown;
 *   group: string;
 *   baselineHeadingOverride?: string | null;
 *   selected: boolean;
 *   onSelect: (tabId: string) => void;
 *   bestScenarioTabId?: string | null;
 *   workspaceSidebar?: boolean;
 * }} props
 */
export function PricingScenarioRailItem({
  scenario,
  group,
  baselineHeadingOverride = null,
  selected,
  onSelect,
  bestScenarioTabId = null,
  workspaceSidebar = false,
}) {
  const tabId = resolveMlScenarioTabId(scenario) || "baseline";
  const title =
    group === "baseline" &&
    baselineHeadingOverride != null &&
    String(baselineHeadingOverride).trim() !== ""
      ? String(baselineHeadingOverride).trim()
      : cardHeadingLabel(scenario);
  const badge = resolveRaioxListingBadge(scenario);
  let statusLabel = badge.label != null && String(badge.label).trim() !== "" ? String(badge.label).trim() : null;
  if (statusLabel == null) {
    if (group === "participating") statusLabel = "Ativa";
    else if (group === "available") statusLabel = "Disponível";
  }

  const r = scenario && typeof scenario === "object" ? /** @type {Record<string, unknown>} */ (scenario) : {};
  const res = r.result != null && typeof r.result === "object" ? /** @type {Record<string, unknown>} */ (r.result) : null;
  const profitRaw = res?.profit_brl != null ? String(res.profit_brl).trim() : "";
  const marginRaw = res?.margin_pct != null && String(res.margin_pct).trim() !== "" ? String(res.margin_pct).trim() : "";

  const profitN = parseScenarioProfitBrlNumber(scenario);
  const isLossProfit = profitN != null && profitN < 0;
  const isBest =
    bestScenarioTabId != null &&
    String(bestScenarioTabId).trim() !== "" &&
    tabId === String(bestScenarioTabId).trim();

  const health = getScenarioHealthStatus(scenario);
  const statusKind = resolveCardStatusKind(statusLabel, group);
  const showTitleTooltip = title.length > 20;

  const titleRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const [titleTruncated, setTitleTruncated] = useState(false);

  const syncTitleTruncation = useCallback(() => {
    if (!workspaceSidebar) return;
    const el = titleRef.current;
    if (!el) return;
    setTitleTruncated(el.scrollWidth > el.clientWidth + 0.5);
  }, [workspaceSidebar]);

  useLayoutEffect(() => {
    if (!workspaceSidebar) return;
    syncTitleTruncation();
    const el = titleRef.current;
    if (el == null || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncTitleTruncation());
    ro.observe(el);
    return () => ro.disconnect();
  }, [workspaceSidebar, syncTitleTruncation, title]);

  const profitMetricClass = [
    "pricing-scenario-sidebar-card__profit",
    isLossProfit ? "pricing-scenario-sidebar-card__profit--loss" : "",
    !isLossProfit && health === "healthy" ? "pricing-scenario-sidebar-card__profit--healthy" : "",
    !isLossProfit && health === "low_margin" ? "pricing-scenario-sidebar-card__profit--low" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const itemClass = [
    "pricing-scenario-rail__item",
    "pricing-scenario-sidebar-card",
    selected ? "pricing-scenario-sidebar-card--selected" : "",
    isBest ? "pricing-scenario-sidebar-card--best" : "",
    isLossProfit ? "pricing-scenario-sidebar-card--loss" : "",
    `pricing-scenario-sidebar-card--status-${statusKind}`,
  ]
    .filter(Boolean)
    .join(" ");

  const titleSpan = (
    <span ref={titleRef} className="pricing-scenario-sidebar-card__title-text">
      {title}
    </span>
  );

  const metricsSummaryForAria =
    marginRaw !== ""
      ? `${formatBrlCompact(profitRaw || null)}, margem ${String(marginRaw).replace(".", ",")} por cento`
      : formatBrlCompact(profitRaw || null);

  const titleBlock = workspaceSidebar ? (
    titleTruncated ? (
      <S7Tooltip
        richContent={<div className="pricing-scenario-sidebar-card__tooltip-rich-inner">{title}</div>}
        placement="bottom-start"
        offset={6}
        className="pricing-scenario-sidebar-card__title-tip-rich"
      >
        {titleSpan}
      </S7Tooltip>
    ) : (
      titleSpan
    )
  ) : showTitleTooltip ? (
    <S7Tooltip
      content={title}
      placement="top-start"
      offset={6}
      wrap
      className="pricing-scenario-sidebar-card__title-tip"
    >
      {titleSpan}
    </S7Tooltip>
  ) : (
    titleSpan
  );

  const ariaLabelBase = `Cenário: ${title}`;
  const ariaLabel = workspaceSidebar
    ? [
        ariaLabelBase,
        metricsSummaryForAria !== "—" ? metricsSummaryForAria : null,
        statusLabel != null && statusLabel !== "" ? statusLabel : null,
        isBest ? "Mais lucrativo" : null,
        isLossProfit ? "Prejuízo" : null,
      ]
        .filter(Boolean)
        .join(". ")
    : `${ariaLabelBase}${statusLabel ? `, ${statusLabel}` : ""}`;

  if (workspaceSidebar) {
    return (
      <button
        type="button"
        className={itemClass}
        onClick={() => onSelect(tabId)}
        aria-pressed={selected}
        aria-label={ariaLabel}
      >
        <span className="pricing-scenario-sidebar-card__inner pricing-scenario-sidebar-card__inner--stack-v2">
          <span className="pricing-scenario-sidebar-card__title-row">{titleBlock}</span>
          <span className="pricing-scenario-sidebar-card__metrics-line">
            <span className={profitMetricClass}>{formatBrlCompact(profitRaw || null)}</span>
            {marginRaw !== "" ? (
              <>
                <span className="pricing-scenario-sidebar-card__metrics-sep">·</span>
                <span className="pricing-scenario-sidebar-card__margin">
                  {String(marginRaw).replace(".", ",")}%
                </span>
              </>
            ) : null}
          </span>
          <span className="pricing-scenario-sidebar-card__badges-row">
            {isLossProfit ? (
              <span className="pricing-scenario-sidebar-card__chip pricing-scenario-sidebar-card__chip--loss">
                <span aria-hidden>❌</span> Prejuízo
              </span>
            ) : null}
            {statusLabel != null && statusLabel !== "" ? (
              <span className={sidebarStatusBadgeClass(statusKind)}>{statusLabel}</span>
            ) : null}
            {isBest ? (
              <span className="pricing-scenario-sidebar-card__chip pricing-scenario-sidebar-card__chip--best">
                <span aria-hidden>🔥</span> Mais lucrativo
              </span>
            ) : null}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={itemClass}
      onClick={() => onSelect(tabId)}
      aria-pressed={selected}
      aria-label={ariaLabel}
    >
      <span className="pricing-scenario-sidebar-card__inner">
        <span className="pricing-scenario-sidebar-card__chips">
          {isBest ? (
            <span className="pricing-scenario-sidebar-card__chip pricing-scenario-sidebar-card__chip--best">
              <span aria-hidden>🔥</span> Mais lucrativo
            </span>
          ) : null}
          {isLossProfit ? (
            <span className="pricing-scenario-sidebar-card__chip pricing-scenario-sidebar-card__chip--loss">
              <span aria-hidden>❌</span> Prejuízo
            </span>
          ) : null}
        </span>
        {titleBlock}
        <span className="pricing-scenario-sidebar-card__status-metrics-row">
          {statusLabel != null && statusLabel !== "" ? (
            <span className={sidebarStatusBadgeClass(statusKind)}>{statusLabel}</span>
          ) : null}
          <span className="pricing-scenario-sidebar-card__status-metrics-row__metrics">
            <span className={profitMetricClass}>{formatBrlCompact(profitRaw || null)}</span>
            {marginRaw !== "" ? (
              <>
                <span className="pricing-scenario-sidebar-card__metrics-sep">·</span>
                <span className="pricing-scenario-sidebar-card__margin">
                  {String(marginRaw).replace(".", ",")}%
                </span>
              </>
            ) : null}
          </span>
        </span>
      </span>
    </button>
  );
}
