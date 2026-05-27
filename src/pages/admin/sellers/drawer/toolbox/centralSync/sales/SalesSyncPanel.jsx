import { memo, useEffect, useRef } from "react";
import { ScanSearch } from "lucide-react";
import { logSellerToolbox } from "../../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../../SellerToolboxContext";
import SalesSyncSearchForm from "./SalesSyncSearchForm";
import SalesSyncResultCard from "./SalesSyncResultCard";
import SalesSyncOperations from "./SalesSyncOperations";
import { useSalesSyncView } from "./useSalesSyncView";
import "./SalesSyncPanel.css";

function SalesSyncPanelSkeleton() {
  return (
    <div className="sales-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="sales-sync-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("../../sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SalesSyncPanel({ category }) {
  const { sellerId } = useSellerToolbox();
  const { panelState, searchState, sale } = useSalesSyncView();
  const loggedOpenRef = useRef(false);

  useEffect(() => {
    if (panelState !== "loaded" || loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("central_sync_sales_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [panelState, sellerId, category.id]);

  const showEmpty =
    searchState === "loaded" && !sale
      ? false
      : searchState === "idle" || (searchState !== "loading" && !sale);

  return (
    <section
      className="sales-sync-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-search-state={searchState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="sales-sync-panel-title"
    >
      <header className="sales-sync-panel__head">
        <div className="sales-sync-panel__icon-wrap" aria-hidden>
          <ScanSearch className="sales-sync-panel__icon" strokeWidth={2} />
        </div>
        <div className="sales-sync-panel__titles">
          <div className="sales-sync-panel__title-row">
            <h4 id="sales-sync-panel-title" className="sales-sync-panel__title">
              Central Sync
            </h4>
            <span className="sales-sync-panel__domain-badge">Venda</span>
            {import.meta.env.DEV ? (
              <span className="sales-sync-panel__dev-badge">DEV</span>
            ) : null}
          </div>
          <p className="sales-sync-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="sales-sync-panel__body">
        {panelState === "loading" ? <SalesSyncPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p className="sales-sync-panel__message sales-sync-panel__message--empty" role="status">
            Central Sync indisponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p className="sales-sync-panel__message sales-sync-panel__message--error" role="alert">
            Não foi possível exibir a Central Sync. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <>
            <SalesSyncSearchForm />

            {searchState === "loading" ? (
              <div className="sales-sync-panel__search-loading" role="status">
                <span className="sales-sync-panel__search-loading-line" />
                <span className="sales-sync-panel__search-loading-line sales-sync-panel__search-loading-line--short" />
              </div>
            ) : null}

            {searchState === "error" ? (
              <p className="sales-sync-panel__message sales-sync-panel__message--error" role="alert">
                Não foi possível buscar a venda. Tente novamente.
              </p>
            ) : null}

            {sale ? (
              <>
                <SalesSyncResultCard sale={sale} />
                <SalesSyncOperations />
              </>
            ) : null}

            {showEmpty && searchState !== "loading" && searchState !== "error" ? (
              <p className="sales-sync-panel__inline-empty" role="status">
                Nenhuma venda encontrada. Informe um ID e clique em Buscar venda.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <footer className="sales-sync-panel__foot">
        <span className="sales-sync-panel__seal">
          {import.meta.env.DEV
            ? "Simulação local — Central Sync sem backend"
            : "Somente leitura"}
        </span>
      </footer>
    </section>
  );
}

export default memo(SalesSyncPanel);
