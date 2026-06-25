// ======================================================
// Precificação Inteligente (página) — workspace com produto à esquerda.
// PI.2.11C — abas na coluna direita (slot repassado aos painéis).
// ======================================================

/** @typedef {"simulator" | "promotions" | "competitors"} PricingWorkspaceTabId */

/**
 * @param {{
 *   activeTab: PricingWorkspaceTabId;
 *   simulatorPanel: import("react").ReactNode;
 *   promotionsPanel: import("react").ReactNode;
 *   competitorsPanel: import("react").ReactNode;
 *   promotionsCompareCards?: import("react").ReactNode;
 *   promotionsTabRailSlot?: import("react").ReactNode;
 *   competitorsCompareCards?: import("react").ReactNode;
 *   competitorsTabRailSlot?: import("react").ReactNode;
 *   railHeader?: import("react").ReactNode;
 * }} props
 */
export function PricingIntelligenceWorkspaceTabs({
  activeTab,
  simulatorPanel,
  promotionsPanel,
  competitorsPanel,
  promotionsCompareCards = null,
  promotionsTabRailSlot = null,
  competitorsCompareCards = null,
  competitorsTabRailSlot = null,
  railHeader = null,
}) {
  const simActive = activeTab === "simulator";
  const promoActive = activeTab === "promotions";
  const competitorsActive = activeTab === "competitors";
  const promotionsLayoutAtivo = promoActive && promotionsCompareCards != null;
  const competitorsLayoutAtivo = competitorsActive && competitorsCompareCards != null;

  const shellClass = [
    "pricing-intelligence-page__workspace-shell",
    "pricing-intelligence-page__workspace-shell--tabs-horizontal",
    "pricing-intelligence-page__workspace-shell--tabs-in-right-col",
    promotionsLayoutAtivo ? "pricing-intelligence-page__workspace-shell--promotions-tab" : "",
    competitorsLayoutAtivo ? "pricing-intelligence-page__workspace-shell--competitors-tab" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (promotionsLayoutAtivo) {
    return (
      <div className={shellClass}>
        {railHeader ? (
          <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div>
        ) : null}

        <div className="pricing-intelligence-page__workspace-dual-scenario-compare-col">
          <div
            className="pricing-listing-type-compare pricing-listing-type-compare--pi-dual"
            role="group"
            aria-label="Comparativo Anúncio Clássico e Anúncio Premium"
          >
            {promotionsCompareCards}
          </div>
        </div>

        <div className="pricing-intelligence-page__workspace-dual-scenario-right-col">
          {promotionsTabRailSlot ? (
            <div className="pricing-listing-type-right-stack__tab-rail">{promotionsTabRailSlot}</div>
          ) : null}

          <div className="pricing-intelligence-page__workspace-promotions-content-col">
            <div
              id="pricing-intelligence-page__workspace-panel-promotions"
              role="tabpanel"
              aria-labelledby="pricing-intelligence-page__workspace-tab-promotions"
              className="pricing-intelligence-page__workspace-panel pricing-intelligence-page__workspace-panel--promotions"
            >
              {promotionsPanel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (competitorsLayoutAtivo) {
    return (
      <div className={shellClass}>
        {railHeader ? (
          <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div>
        ) : null}

        <div className="pricing-intelligence-page__workspace-dual-scenario-compare-col">
          <div
            className="pricing-listing-type-compare pricing-listing-type-compare--pi-dual"
            role="group"
            aria-label="Comparativo Anúncio Clássico e Anúncio Premium"
          >
            {competitorsCompareCards}
          </div>
        </div>

        <div className="pricing-intelligence-page__workspace-dual-scenario-right-col">
          {competitorsTabRailSlot ? (
            <div className="pricing-listing-type-right-stack__tab-rail">{competitorsTabRailSlot}</div>
          ) : null}

          <div className="pricing-intelligence-page__workspace-competitors-grid-col">
            <div
              id="pricing-intelligence-page__workspace-panel-competitors"
              role="tabpanel"
              aria-labelledby="pricing-intelligence-page__workspace-tab-competitors"
              className="pricing-intelligence-page__workspace-panel pricing-intelligence-page__workspace-panel--competitors"
            >
              {competitorsPanel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {railHeader ? <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div> : null}

      <div className="pricing-intelligence-page__workspace-main-col">
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
          <div
            id="pricing-intelligence-page__workspace-panel-competitors"
            role="tabpanel"
            aria-labelledby="pricing-intelligence-page__workspace-tab-competitors"
            hidden={!competitorsActive}
            className="pricing-intelligence-page__workspace-panel"
          >
            {competitorsPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
