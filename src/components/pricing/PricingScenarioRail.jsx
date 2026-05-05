// ======================================================
// Lista de cenários ML — página Precificação Inteligente (rail horizontal ou sidebar no workspace).
// ======================================================

import { memo } from "react";
import { resolveMlScenarioTabId } from "../MercadoLivrePricingScenarioRaiox.jsx";
import { resolveSaleXrayArticleKey } from "../mercadoLivrePricingScenarioCompareShared.js";
import { PricingScenarioRailItem } from "./PricingScenarioRailItem.jsx";

/**
 * @param {{
 *   rows: { scenario: unknown; group: string }[];
 *   selectedTabId: string;
 *   onSelectTabId: (tabId: string) => void;
 *   baselineHeadingOverride?: string | null;
 *   bestScenarioTabId?: string | null;
 *   workspaceSidebar?: boolean;
 * }} props
 */
function PricingScenarioRailInner({
  rows,
  selectedTabId,
  onSelectTabId,
  baselineHeadingOverride = null,
  bestScenarioTabId = null,
  workspaceSidebar = false,
}) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const rootClass = ["pricing-scenario-rail", workspaceSidebar ? "pricing-scenario-sidebar" : ""]
    .filter(Boolean)
    .join(" ");
  const viewportClass = ["pricing-scenario-rail__viewport", workspaceSidebar ? "pricing-scenario-sidebar__viewport" : ""]
    .filter(Boolean)
    .join(" ");
  const trackClass = ["pricing-scenario-rail__track", workspaceSidebar ? "pricing-scenario-sidebar__list" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="tablist" aria-label="Cenários de precificação">
      <div className={viewportClass}>
        <div className={trackClass}>
          {rows.map(({ scenario, group }, idx) => {
            const tabId = resolveMlScenarioTabId(scenario) || "baseline";
            const reactKey = resolveSaleXrayArticleKey(scenario, idx);
            return (
              <PricingScenarioRailItem
                key={reactKey}
                scenario={scenario}
                group={group}
                baselineHeadingOverride={baselineHeadingOverride}
                selected={tabId === selectedTabId}
                onSelect={onSelectTabId}
                bestScenarioTabId={bestScenarioTabId}
                workspaceSidebar={workspaceSidebar}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const PricingScenarioRail = memo(PricingScenarioRailInner);
PricingScenarioRail.displayName = "PricingScenarioRail";
