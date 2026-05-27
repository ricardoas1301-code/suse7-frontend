import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ScanSearch } from "lucide-react";
import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../SellerToolboxContext";
import SalesSyncPanel from "./sales/SalesSyncPanel";
import ListingsSyncPanel from "./listings/ListingsSyncPanel";
import ProductsSyncPanel from "./products/ProductsSyncPanel";
import CustomersSyncPanel from "./customers/CustomersSyncPanel";
import AccountsSyncPanel from "./accounts/AccountsSyncPanel";
import "./CentralSyncPanel.css";

/** @typedef {"sale" | "listing" | "product" | "customer" | "account"} CentralSyncDomainTab */

/**
 * @param {{ category: import("../sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function CentralSyncPanel({ category }) {
  const { sellerId } = useSellerToolbox();
  const [activeTab, setActiveTab] = useState(/** @type {CentralSyncDomainTab} */ ("sale"));
  const loggedOpenRef = useRef(false);
  const loggedListingOpenRef = useRef(false);
  const loggedProductOpenRef = useRef(false);
  const loggedCustomerOpenRef = useRef(false);
  const loggedAccountOpenRef = useRef(false);

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("central_sync_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (activeTab !== "listing" || loggedListingOpenRef.current) return;
    loggedListingOpenRef.current = true;
    logSellerToolbox("central_sync_listings_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [activeTab, sellerId, category.id]);

  useEffect(() => {
    if (activeTab !== "product" || loggedProductOpenRef.current) return;
    loggedProductOpenRef.current = true;
    logSellerToolbox("central_sync_products_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [activeTab, sellerId, category.id]);

  useEffect(() => {
    if (activeTab !== "customer" || loggedCustomerOpenRef.current) return;
    loggedCustomerOpenRef.current = true;
    logSellerToolbox("central_sync_customers_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [activeTab, sellerId, category.id]);

  useEffect(() => {
    if (activeTab !== "account" || loggedAccountOpenRef.current) return;
    loggedAccountOpenRef.current = true;
    logSellerToolbox("central_sync_accounts_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [activeTab, sellerId, category.id]);

  const handleSelectSale = useCallback(() => setActiveTab("sale"), []);
  const handleSelectListing = useCallback(() => setActiveTab("listing"), []);
  const handleSelectProduct = useCallback(() => setActiveTab("product"), []);
  const handleSelectCustomer = useCallback(() => setActiveTab("customer"), []);
  const handleSelectAccount = useCallback(() => setActiveTab("account"), []);

  return (
    <section
      className="central-sync-panel"
      data-category-id={category.id}
      data-active-domain={activeTab}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="central-sync-panel-title"
    >
      <header className="central-sync-panel__head">
        <div className="central-sync-panel__icon-wrap" aria-hidden>
          <ScanSearch className="central-sync-panel__icon" strokeWidth={2} />
        </div>
        <div className="central-sync-panel__titles">
          <div className="central-sync-panel__title-row">
            <h4 id="central-sync-panel-title" className="central-sync-panel__title">
              Central Sync
            </h4>
            {import.meta.env.DEV ? (
              <span className="central-sync-panel__dev-badge">DEV</span>
            ) : null}
          </div>
          <p className="central-sync-panel__desc">{category.description}</p>
        </div>
      </header>

      <nav className="central-sync-panel__tabs" aria-label="Domínios da Central Sync">
        <button
          type="button"
          className={`central-sync-panel__tab${activeTab === "sale" ? " central-sync-panel__tab--active" : ""}`}
          aria-pressed={activeTab === "sale"}
          onClick={handleSelectSale}
        >
          Venda
        </button>
        <button
          type="button"
          className={`central-sync-panel__tab${activeTab === "listing" ? " central-sync-panel__tab--active" : ""}`}
          aria-pressed={activeTab === "listing"}
          onClick={handleSelectListing}
        >
          Anúncio
        </button>
        <button
          type="button"
          className={`central-sync-panel__tab${activeTab === "product" ? " central-sync-panel__tab--active" : ""}`}
          aria-pressed={activeTab === "product"}
          onClick={handleSelectProduct}
        >
          Produto
        </button>
        <button
          type="button"
          className={`central-sync-panel__tab${activeTab === "customer" ? " central-sync-panel__tab--active" : ""}`}
          aria-pressed={activeTab === "customer"}
          onClick={handleSelectCustomer}
        >
          Cliente
        </button>
        <button
          type="button"
          className={`central-sync-panel__tab${activeTab === "account" ? " central-sync-panel__tab--active" : ""}`}
          aria-pressed={activeTab === "account"}
          onClick={handleSelectAccount}
        >
          Conta
        </button>
      </nav>

      <div className="central-sync-panel__body">
        <div className="central-sync-panel__domain" hidden={activeTab !== "sale"}>
          <SalesSyncPanel category={category} embedded />
        </div>
        <div className="central-sync-panel__domain" hidden={activeTab !== "listing"}>
          <ListingsSyncPanel embedded />
        </div>
        <div className="central-sync-panel__domain" hidden={activeTab !== "product"}>
          <ProductsSyncPanel embedded />
        </div>
        <div className="central-sync-panel__domain" hidden={activeTab !== "customer"}>
          <CustomersSyncPanel embedded />
        </div>
        <div className="central-sync-panel__domain" hidden={activeTab !== "account"}>
          <AccountsSyncPanel embedded />
        </div>
      </div>

      <footer className="central-sync-panel__foot">
        <span className="central-sync-panel__seal">
          {import.meta.env.DEV
            ? "Simulação local — Central Sync sem backend"
            : "Somente leitura"}
        </span>
      </footer>
    </section>
  );
}

export default memo(CentralSyncPanel);
