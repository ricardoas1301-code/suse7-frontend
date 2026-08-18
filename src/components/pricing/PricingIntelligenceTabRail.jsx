// ======================================================
// PI.2.11C — Abas internas da Precificação Inteligente (coluna direita).
// Somente navegação visual; painéis preservam estado no pai.
// ======================================================

import { PROMOTION_BETA_TAB_HELPER } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";
import S7Tooltip from "../ui/S7Tooltip.jsx";

/** @typedef {"simulator" | "promotions" | "competitors"} PricingWorkspaceTabId */

const TAB_IDS = /** @type {const} */ ({
  simulator: "simulator",
  promotions: "promotions",
  competitors: "competitors",
});

/**
 * @param {{
 *   activeTab: PricingWorkspaceTabId;
 *   onTabChange: (tab: PricingWorkspaceTabId) => void;
 *   className?: string;
 * }} props
 */
export function PricingIntelligenceTabRail({ activeTab, onTabChange, className = "" }) {
  const simActive = activeTab === TAB_IDS.simulator;
  const promoActive = activeTab === TAB_IDS.promotions;
  const competitorsActive = activeTab === TAB_IDS.competitors;

  return (
    <div
      className={[
        "pricing-intelligence-page__workspace-tab-rail",
        "pricing-intelligence-page__workspace-tab-rail--premium",
        "pricing-intelligence-page__workspace-tab-rail--in-right-stack",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
      aria-label="Precificação inteligente"
    >
      <button
        type="button"
        id="pricing-intelligence-page__workspace-tab-simulator"
        role="tab"
        aria-selected={simActive}
        aria-controls="pricing-intelligence-page__workspace-panel-simulator"
        tabIndex={0}
        aria-label="Precificação"
        className={[
          "pricing-intelligence-page__workspace-tab",
          "pricing-intelligence-page__workspace-tab--horizontal",
          simActive ? "pricing-intelligence-page__workspace-tab--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onTabChange(TAB_IDS.simulator)}
      >
        <span>Precificação</span>
      </button>
      <S7Tooltip
        key={`promotions-tooltip-${activeTab}`}
        content={PROMOTION_BETA_TAB_HELPER}
        placement="top-start"
        offset={6}
        wrap
      >
        <button
          type="button"
          id="pricing-intelligence-page__workspace-tab-promotions"
          role="tab"
          aria-selected={promoActive}
          aria-controls="pricing-intelligence-page__workspace-panel-promotions"
          tabIndex={0}
          aria-label="Promoções Beta"
          className={[
            "pricing-intelligence-page__workspace-tab",
            "pricing-intelligence-page__workspace-tab--horizontal",
            "pricing-intelligence-page__workspace-tab--promotions",
            promoActive ? "pricing-intelligence-page__workspace-tab--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onTabChange(TAB_IDS.promotions)}
        >
          <span className="pricing-intelligence-page__workspace-tab-label-row">
            <span>Promoções</span>
            <span className="pricing-intelligence-page__workspace-tab-beta-badge">
              BETA
            </span>
          </span>
        </button>
      </S7Tooltip>
      <button
        type="button"
        id="pricing-intelligence-page__workspace-tab-competitors"
        role="tab"
        aria-selected={competitorsActive}
        aria-controls="pricing-intelligence-page__workspace-panel-competitors"
        tabIndex={0}
        aria-label="Concorrentes"
        className={[
          "pricing-intelligence-page__workspace-tab",
          "pricing-intelligence-page__workspace-tab--horizontal",
          competitorsActive ? "pricing-intelligence-page__workspace-tab--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onTabChange(TAB_IDS.competitors)}
      >
        <span>Concorrentes</span>
      </button>
    </div>
  );
}

export { TAB_IDS as PRICING_WORKSPACE_TAB_IDS };
