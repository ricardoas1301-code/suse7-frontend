// ======================================================
// PI.2.11C — Abas internas da Precificação Inteligente (coluna direita).
// Somente navegação visual; painéis preservam estado no pai.
// ======================================================

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
      <button
        type="button"
        id="pricing-intelligence-page__workspace-tab-promotions"
        role="tab"
        aria-selected={promoActive}
        aria-controls="pricing-intelligence-page__workspace-panel-promotions"
        tabIndex={0}
        aria-label="Promoções"
        className={[
          "pricing-intelligence-page__workspace-tab",
          "pricing-intelligence-page__workspace-tab--horizontal",
          promoActive ? "pricing-intelligence-page__workspace-tab--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onTabChange(TAB_IDS.promotions)}
      >
        <span>Promoções</span>
      </button>
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
