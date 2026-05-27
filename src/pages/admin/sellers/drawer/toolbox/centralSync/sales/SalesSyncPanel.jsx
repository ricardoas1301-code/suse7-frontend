import { memo } from "react";
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
 * @param {{
 *   category?: import("../../sellerToolboxCategoriesModel").SellerToolboxCategory;
 *   embedded?: boolean;
 * }} props
 */
function SalesSyncPanel({ category, embedded = false }) {
  const { panelState, searchState, sale } = useSalesSyncView();

  const showEmpty =
    searchState === "loaded" && !sale
      ? false
      : searchState === "idle" || (searchState !== "loading" && !sale);

  const body = (
    <>
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
    </>
  );

  if (embedded) {
    return (
      <div
        className="sales-sync-panel sales-sync-panel--embedded"
        data-category-id={category?.id}
        data-panel-state={panelState}
        data-search-state={searchState}
      >
        <div className="sales-sync-panel__body">{body}</div>
      </div>
    );
  }

  return (
    <section
      className="sales-sync-panel"
      data-category-id={category?.id}
      data-panel-state={panelState}
      data-search-state={searchState}
      aria-labelledby="sales-sync-panel-title"
    >
      <header className="sales-sync-panel__head">
        <div className="sales-sync-panel__titles">
          <div className="sales-sync-panel__title-row">
            <h4 id="sales-sync-panel-title" className="sales-sync-panel__title">
              Central Sync
            </h4>
            <span className="sales-sync-panel__domain-badge">Venda</span>
          </div>
          {category ? <p className="sales-sync-panel__desc">{category.description}</p> : null}
        </div>
      </header>
      <div className="sales-sync-panel__body">{body}</div>
    </section>
  );
}

export default memo(SalesSyncPanel);
