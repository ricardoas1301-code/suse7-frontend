import { memo } from "react";
import ProductsSyncSearchForm from "./ProductsSyncSearchForm";
import ProductsSyncResultCard from "./ProductsSyncResultCard";
import ProductsSyncLinkedListings from "./ProductsSyncLinkedListings";
import ProductsSyncOperations from "./ProductsSyncOperations";
import { useProductsSyncView } from "./useProductsSyncView";
import "./ProductsSyncPanel.css";

function ProductsSyncPanelSkeleton() {
  return (
    <div className="products-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="products-sync-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ embedded?: boolean }} props
 */
function ProductsSyncPanel({ embedded = false }) {
  const { panelState, searchState, product, loading, error, empty } = useProductsSyncView();

  const showInitialEmpty =
    searchState === "idle" || (searchState !== "loading" && !product && !empty && !error);

  const body = (
    <>
      {panelState === "loading" ? <ProductsSyncPanelSkeleton /> : null}

      {panelState === "empty" ? (
        <p className="products-sync-panel__message products-sync-panel__message--empty" role="status">
          Central Sync indisponível para este seller no momento.
        </p>
      ) : null}

      {panelState === "error" ? (
        <p className="products-sync-panel__message products-sync-panel__message--error" role="alert">
          Não foi possível exibir a Central Sync. Tente voltar e abrir novamente.
        </p>
      ) : null}

      {panelState === "loaded" ? (
        <>
          <ProductsSyncSearchForm />

          {loading ? (
            <div className="products-sync-panel__search-loading" role="status">
              <span className="products-sync-panel__search-loading-line" />
              <span className="products-sync-panel__search-loading-line products-sync-panel__search-loading-line--short" />
            </div>
          ) : null}

          {searchState === "error" ? (
            <p className="products-sync-panel__message products-sync-panel__message--error" role="alert">
              Não foi possível buscar o produto. Tente novamente.
            </p>
          ) : null}

          {product ? (
            <>
              <ProductsSyncResultCard product={product} />
              <ProductsSyncLinkedListings linkedListings={product.linkedListings} />
              <ProductsSyncOperations />
            </>
          ) : null}

          {empty && !loading ? (
            <p className="products-sync-panel__inline-empty" role="status">
              Nenhum produto encontrado.
            </p>
          ) : null}

          {showInitialEmpty && !loading && searchState !== "error" && !empty ? (
            <p className="products-sync-panel__inline-empty" role="status">
              Informe um SKU e clique em Buscar produto.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="products-sync-panel products-sync-panel--embedded"
        data-panel-state={panelState}
        data-search-state={searchState}
      >
        <div className="products-sync-panel__body">{body}</div>
      </div>
    );
  }

  return (
    <section
      className="products-sync-panel"
      data-panel-state={panelState}
      data-search-state={searchState}
      aria-labelledby="products-sync-panel-title"
    >
      <header className="products-sync-panel__head">
        <h4 id="products-sync-panel-title" className="products-sync-panel__title">
          Sync de Produto
        </h4>
      </header>
      <div className="products-sync-panel__body">{body}</div>
    </section>
  );
}

export default memo(ProductsSyncPanel);
