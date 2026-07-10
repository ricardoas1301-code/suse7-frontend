// ======================================================
// Precificação Inteligente (página) — workspace com produto à esquerda.
// PI.2.11C — abas na coluna direita (slot repassado aos painéis).
// Sessão: todos os layouts permanecem montados; abas inativas usam [hidden].
// ======================================================

import { PricingIntelligencePromotionsCompareProvider } from "./PricingIntelligencePromotionsCompareContext.jsx";
import { PricingIntelligencePromotionsCompactPicker } from "./PricingIntelligencePromotionsCompactPicker.jsx";
import { PricingIntelligencePromotionsDetailCompare } from "./PricingIntelligencePromotionsDetailCompare.jsx";

/** @typedef {"simulator" | "promotions" | "competitors"} PricingWorkspaceTabId */

/**
 * @param {{
 *   activeTab: PricingWorkspaceTabId;
 *   simulatorPanel: import("react").ReactNode;
 *   competitorsPanel: import("react").ReactNode;
 *   promotionsTabRailSlot?: import("react").ReactNode;
 *   promotionsRows?: { scenario: unknown; group: string }[];
 *   promotionsListingHint?: string;
 *   promotionsMlScenariosPayload?: unknown;
 *   promotionsBaselineRow?: { scenario: unknown; group: string } | null;
 *   promotionsCatalogRow?: Record<string, unknown> | null;
 *   promotionsConfiguracaoFinanceira?: Record<string, unknown>;
 *   competitorsCompareCards?: import("react").ReactNode;
 *   competitorsTabRailSlot?: import("react").ReactNode;
 *   railHeader?: import("react").ReactNode;
 *   mountPromotionsLayout?: boolean;
 *   mountCompetitorsLayout?: boolean;
 * }} props
 */
export function PricingIntelligenceWorkspaceTabs({
  activeTab,
  simulatorPanel,
  competitorsPanel,
  promotionsTabRailSlot = null,
  promotionsRows = [],
  promotionsListingHint = "",
  promotionsMlScenariosPayload = null,
  promotionsBaselineRow = null,
  promotionsCatalogRow = null,
  promotionsConfiguracaoFinanceira = {},
  competitorsCompareCards = null,
  competitorsTabRailSlot = null,
  railHeader = null,
  mountPromotionsLayout = false,
  mountCompetitorsLayout = false,
}) {
  const simActive = activeTab === "simulator";
  const promoActive = activeTab === "promotions";
  const competitorsActive = activeTab === "competitors";
  const temLayoutConcorrentes = competitorsCompareCards != null;

  const shellBaseClass = [
    "pricing-intelligence-page__workspace-shell",
    "pricing-intelligence-page__workspace-shell--tabs-horizontal",
    "pricing-intelligence-page__workspace-shell--tabs-in-right-col",
  ].join(" ");

  return (
    <>
      <div
        className={shellBaseClass}
        hidden={!simActive}
        aria-hidden={simActive ? undefined : true}
      >
        {railHeader ? (
          <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div>
        ) : null}

        <div className="pricing-intelligence-page__workspace-main-col">
          <div className="pricing-intelligence-page__workspace-panels">
            <div
              id="pricing-intelligence-page__workspace-panel-simulator"
              role="tabpanel"
              aria-labelledby="pricing-intelligence-page__workspace-tab-simulator"
              className="pricing-intelligence-page__workspace-panel"
            >
              {simulatorPanel}
            </div>
          </div>
        </div>
      </div>

      {mountPromotionsLayout ? (
        <PricingIntelligencePromotionsCompareProvider
          rows={promotionsRows}
          listingHintForAudit={promotionsListingHint}
          mlScenariosPayload={promotionsMlScenariosPayload}
          baselineRow={promotionsBaselineRow}
          catalogRow={promotionsCatalogRow}
          configuracaoFinanceira={promotionsConfiguracaoFinanceira}
        >
          <div
            className={`${shellBaseClass} pricing-intelligence-page__workspace-shell--promotions-tab`}
            hidden={!promoActive}
            aria-hidden={promoActive ? undefined : true}
          >
            {railHeader ? (
              <div className="pricing-intelligence-page__workspace-product-col">{railHeader}</div>
            ) : null}

            <div className="pricing-intelligence-page__workspace-dual-scenario-compare-col">
              <PricingIntelligencePromotionsDetailCompare />
            </div>

            <div className="pricing-intelligence-page__workspace-dual-scenario-right-col">
              {promotionsTabRailSlot ? (
                <div className="pricing-listing-type-right-stack__tab-rail">{promotionsTabRailSlot}</div>
              ) : null}

              <div
                id="pricing-intelligence-page__workspace-panel-promotions"
                role="tabpanel"
                aria-labelledby="pricing-intelligence-page__workspace-tab-promotions"
                className="pricing-intelligence-page__workspace-panel pricing-intelligence-page__workspace-panel--promotions pricing-intelligence-page__workspace-promotions-content-col"
              >
                <PricingIntelligencePromotionsCompactPicker />
              </div>
            </div>
          </div>
        </PricingIntelligencePromotionsCompareProvider>
      ) : null}

      {temLayoutConcorrentes && mountCompetitorsLayout ? (
        <div
          className={`${shellBaseClass} pricing-intelligence-page__workspace-shell--competitors-tab`}
          hidden={!competitorsActive}
          aria-hidden={competitorsActive ? undefined : true}
        >
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
      ) : null}
    </>
  );
}
