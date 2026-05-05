// ======================================================
// Precificação Inteligente (página) — abas verticais Simulador / Promoções.
// Só organização visual; painéis preservam estado (ambos montados, um oculto).
// ======================================================

/** @typedef {"simulator" | "promotions"} PricingWorkspaceTabId */

const TAB_IDS = /** @type {const} */ ({
  simulator: "simulator",
  promotions: "promotions",
});

/**
 * @param {{
 *   activeTab: PricingWorkspaceTabId;
 *   onTabChange: (tab: PricingWorkspaceTabId) => void;
 *   simulatorPanel: import("react").ReactNode;
 *   promotionsPanel: import("react").ReactNode;
 *   railHeader?: import("react").ReactNode;
 * }} props
 */
export function PricingIntelligenceWorkspaceTabs({
  activeTab,
  onTabChange,
  simulatorPanel,
  promotionsPanel,
  railHeader = null,
}) {
  const simActive = activeTab === TAB_IDS.simulator;
  const promoActive = activeTab === TAB_IDS.promotions;

  return (
    <div className="pricing-intelligence-page__workspace-shell pricing-intelligence-page__workspace-shell--tabs-horizontal">
      {railHeader ? <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div> : null}

      <div className="pricing-intelligence-page__workspace-content-col">
        <div className="pricing-intelligence-page__workspace-tab-rail" role="tablist" aria-label="Precificação inteligente">
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
        </div>

        <div className="pricing-intelligence-page__workspace-panels">
          <div
            id="pricing-intelligence-page__workspace-panel-simulator"
            role="tabpanel"
            aria-labelledby="pricing-intelligence-page__workspace-tab-simulator"
            hidden={!simActive}
            className="pricing-intelligence-page__workspace-panel"
          >
            {simulatorPanel}
          </div>
          <div
            id="pricing-intelligence-page__workspace-panel-promotions"
            role="tabpanel"
            aria-labelledby="pricing-intelligence-page__workspace-tab-promotions"
            hidden={!promoActive}
            className="pricing-intelligence-page__workspace-panel"
          >
            {promotionsPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
