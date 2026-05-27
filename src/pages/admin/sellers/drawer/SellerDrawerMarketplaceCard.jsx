import { memo, useMemo } from "react";
import { marketplaceLabel } from "../sellerOpsConstants";
import SellerDrawerSection from "./SellerDrawerSection";
import { sliceMarketplaceSummary, summarizeMarketplaceGroups } from "./sellerDrawerSectionModel";

/**
 * @param {{
 *   marketplaces?: Record<string, unknown>[];
 *   state?: "loading" | "loaded" | "empty" | "error";
 * }} props
 */
function SellerDrawerMarketplaceCard({ marketplaces = [], state = "loaded" }) {
  const groups = useMemo(() => summarizeMarketplaceGroups(marketplaces), [marketplaces]);
  const { shown, hidden } = useMemo(() => sliceMarketplaceSummary(groups, 2), [groups]);
  const totalAccounts = marketplaces.length;

  return (
    <SellerDrawerSection
      title="Marketplaces conectados"
      subtitle="Visão operacional"
      state={state === "loaded" && totalAccounts === 0 ? "empty" : state}
      emptyMessage="Sem integração marketplace."
    >
      {totalAccounts > 0 ? (
        <div className="seller-drawer-marketplaces">
          <ul className="seller-drawer-marketplaces__list">
            {shown.map((group) => (
              <li key={group.marketplace}>
                <div className="seller-drawer-marketplaces__main">
                  <strong>{marketplaceLabel(group.marketplace)}</strong>
                  <span className="dc-seller-pill dc-seller-pill--neutral">{group.statusLabel}</span>
                </div>
                <span className="seller-drawer-marketplaces__meta">
                  {group.count === 1 ? "1 conta" : `${group.count} contas`}
                </span>
              </li>
            ))}
          </ul>

          {hidden > 0 ? (
            <p className="seller-drawer-marketplaces__overflow">+{hidden} marketplace(s)</p>
          ) : null}

          <p className="seller-drawer-marketplaces__total">
            {totalAccounts === 1 ? "1 conta conectada" : `${totalAccounts} contas conectadas`}
          </p>
        </div>
      ) : null}
    </SellerDrawerSection>
  );
}

export default memo(SellerDrawerMarketplaceCard);
