import { memo } from "react";
import { useSellerToolbox } from "./SellerToolboxContext";
import SellerToolboxNavigationProvider from "./SellerToolboxNavigation";
import SellerToolboxActionReason from "./SellerToolboxActionReason";
import SellerToolboxBody from "./SellerToolboxBody";
import SellerToolboxConfirmAction from "./SellerToolboxConfirmAction";
import SellerToolboxFeedback from "./SellerToolboxFeedback";
import SellerToolboxFooter from "./SellerToolboxFooter";
import SellerToolboxHeader from "./SellerToolboxHeader";
import { SellerToolboxTrialStatusProvider } from "./useSellerToolboxTrialStatus";
import { SellerConsumptionViewProvider } from "./subscription/useSellerConsumptionView";
import { SellerFeatureFlagsViewProvider } from "./featureFlags/useSellerFeatureFlagsView";
import { SellerCacheRefreshViewProvider } from "./cacheRefresh/useSellerCacheRefreshView";
import { SalesSyncViewProvider } from "./centralSync/sales/useSalesSyncView";
import { ListingsSyncViewProvider } from "./centralSync/listings/useListingsSyncView";
import { ProductsSyncViewProvider } from "./centralSync/products/useProductsSyncView";
import { CustomersSyncViewProvider } from "./centralSync/customers/useCustomersSyncView";
import { AccountsSyncViewProvider } from "./centralSync/accounts/useAccountsSyncView";
import { SellerToolboxActionReasonProvider } from "./useSellerToolboxActionReason";
import { SellerToolboxConfirmActionProvider } from "./useSellerToolboxConfirmAction";
import { SellerToolboxFeedbackProvider } from "./useSellerToolboxFeedback";
import "./SellerToolboxDrawer.css";

/**
 * Shell visual da toolbox — consome contexto via hook interno.
 * @param {{ onClose: () => void }} props
 */
function SellerToolboxDrawerShell({ onClose }) {
  const { drawerState, toolboxState } = useSellerToolbox();

  return (
    <SellerToolboxConfirmActionProvider>
      <SellerToolboxFeedbackProvider>
        <SellerToolboxTrialStatusProvider>
          <SellerConsumptionViewProvider>
            <SellerFeatureFlagsViewProvider>
            <SellerCacheRefreshViewProvider>
            <SalesSyncViewProvider>
            <ListingsSyncViewProvider>
            <ProductsSyncViewProvider>
            <CustomersSyncViewProvider>
            <AccountsSyncViewProvider>
            <SellerToolboxActionReasonProvider>
              <aside
                className="dc-drawer seller-toolbox-drawer"
                role="complementary"
                aria-labelledby="seller-toolbox-title"
                data-drawer-state={drawerState ?? undefined}
                data-toolbox-state={toolboxState}
              >
                <SellerToolboxHeader />

                <SellerToolboxNavigationProvider>
                  <div className="dc-sellers-drawer__main seller-toolbox-drawer__main">
                    <SellerToolboxFeedback />
                    <SellerToolboxBody />
                  </div>
                </SellerToolboxNavigationProvider>

                <SellerToolboxFooter onClose={onClose} />
                <SellerToolboxConfirmAction />
                <SellerToolboxActionReason />
              </aside>
            </SellerToolboxActionReasonProvider>
            </AccountsSyncViewProvider>
            </CustomersSyncViewProvider>
            </ProductsSyncViewProvider>
            </ListingsSyncViewProvider>
            </SalesSyncViewProvider>
            </SellerCacheRefreshViewProvider>
            </SellerFeatureFlagsViewProvider>
          </SellerConsumptionViewProvider>
        </SellerToolboxTrialStatusProvider>
      </SellerToolboxFeedbackProvider>
    </SellerToolboxConfirmActionProvider>
  );
}

export default memo(SellerToolboxDrawerShell);
