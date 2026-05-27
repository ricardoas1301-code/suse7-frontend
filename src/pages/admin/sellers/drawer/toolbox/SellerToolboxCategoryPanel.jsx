import { memo, useMemo } from "react";
import {
  CreditCard,
  Database,
  Flag,
  History,
  Package,
  Plug,
  RefreshCw,
  ScanSearch,
  User,
} from "lucide-react";
import CentralSyncPanel from "./centralSync/CentralSyncPanel";
import SellerCacheRefreshPanel from "./cacheRefresh/SellerCacheRefreshPanel";
import SellerFeatureFlagsPanel from "./featureFlags/SellerFeatureFlagsPanel";
import { buildSellerDrawerHeaderModel } from "../sellerDrawerHeaderModel";
import { useSellerToolbox } from "./SellerToolboxContext";
import SellerToolboxAccountPanel from "./SellerToolboxAccountPanel";
import SellerToolboxIntegrationsPanel from "./SellerToolboxIntegrationsPanel";
import SellerToolboxSubscriptionPanel from "./SellerToolboxSubscriptionPanel";
import SellerToolboxHistoryPanel from "./SellerToolboxHistoryPanel";
import SellerToolboxProductsPanel from "./SellerToolboxProductsPanel";
import SellerToolboxSyncPanel from "./SellerToolboxSyncPanel";

/** @type {Record<string, import("react").ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>>} */
const ICONS = {
  User,
  CreditCard,
  Plug,
  Flag,
  Database,
  ScanSearch,
  RefreshCw,
  Package,
  History,
};

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxCategoryPanel({ category }) {
  if (category.id === "account") {
    return <SellerToolboxAccountPanel category={category} />;
  }

  if (category.id === "subscription") {
    return <SellerToolboxSubscriptionPanel category={category} />;
  }

  if (category.id === "integrations") {
    return <SellerToolboxIntegrationsPanel category={category} />;
  }

  if (category.id === "feature_flags") {
    return <SellerFeatureFlagsPanel category={category} />;
  }

  if (category.id === "cache_refresh") {
    return <SellerCacheRefreshPanel category={category} />;
  }

  if (category.id === "central_sync") {
    return <CentralSyncPanel category={category} />;
  }

  if (category.id === "sync") {
    return <SellerToolboxSyncPanel category={category} />;
  }

  if (category.id === "products") {
    return <SellerToolboxProductsPanel category={category} />;
  }

  if (category.id === "history") {
    return <SellerToolboxHistoryPanel category={category} />;
  }

  return <SellerToolboxCategoryPlaceholder category={category} />;
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxCategoryPlaceholder({ category }) {
  const { sellerId, listPreview, detail, isReady } = useSellerToolbox();

  const sellerLabel = useMemo(() => {
    if (!sellerId) return "Seller";
    return buildSellerDrawerHeaderModel({ sellerId, listPreview, detail }).nome;
  }, [sellerId, listPreview, detail]);

  const Icon = ICONS[category.icon] ?? User;

  return (
    <section
      className="seller-toolbox-category-panel"
      data-category-id={category.id}
      data-seller-id={sellerId ?? undefined}
      data-context-ready={isReady || undefined}
      aria-labelledby={`seller-toolbox-panel-${category.id}`}
    >
      <header className="seller-toolbox-category-panel__head">
        <div className="seller-toolbox-category-panel__icon-wrap" aria-hidden>
          <Icon className="seller-toolbox-category-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-category-panel__titles">
          <h4 id={`seller-toolbox-panel-${category.id}`} className="seller-toolbox-category-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-category-panel__desc">{category.description}</p>
        </div>
        <span className="seller-toolbox-category-panel__status">Em breve</span>
      </header>

      <div className="seller-toolbox-category-panel__body">
        <p className="seller-toolbox-category-panel__seller">
          Seller vinculado: <strong>{sellerLabel}</strong>
        </p>
        <p className="seller-toolbox-category-panel__placeholder">
          Esta ferramenta será habilitada nas próximas fases da Seller Toolbox. Nenhuma operação é
          executada nesta versão.
        </p>
      </div>
    </section>
  );
}

export default memo(SellerToolboxCategoryPanel);
