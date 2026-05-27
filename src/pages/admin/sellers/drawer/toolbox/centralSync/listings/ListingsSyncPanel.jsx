import { memo } from "react";
import ListingsSyncSearchForm from "./ListingsSyncSearchForm";
import ListingsSyncResultCard from "./ListingsSyncResultCard";
import ListingsSyncOperations from "./ListingsSyncOperations";
import { useListingsSyncView } from "./useListingsSyncView";
import "./ListingsSyncPanel.css";

function ListingsSyncPanelSkeleton() {
  return (
    <div className="listings-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="listings-sync-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ embedded?: boolean }} props
 */
function ListingsSyncPanel({ embedded = false }) {
  const { panelState, searchState, listing, loading, error, empty } = useListingsSyncView();

  const showInitialEmpty =
    searchState === "idle" || (searchState !== "loading" && !listing && !empty && !error);

  const body = (
    <>
      {panelState === "loading" ? <ListingsSyncPanelSkeleton /> : null}

      {panelState === "empty" ? (
        <p className="listings-sync-panel__message listings-sync-panel__message--empty" role="status">
          Central Sync indisponível para este seller no momento.
        </p>
      ) : null}

      {panelState === "error" ? (
        <p className="listings-sync-panel__message listings-sync-panel__message--error" role="alert">
          Não foi possível exibir a Central Sync. Tente voltar e abrir novamente.
        </p>
      ) : null}

      {panelState === "loaded" ? (
        <>
          <ListingsSyncSearchForm />

          {loading ? (
            <div className="listings-sync-panel__search-loading" role="status">
              <span className="listings-sync-panel__search-loading-line" />
              <span className="listings-sync-panel__search-loading-line listings-sync-panel__search-loading-line--short" />
            </div>
          ) : null}

          {searchState === "error" ? (
            <p className="listings-sync-panel__message listings-sync-panel__message--error" role="alert">
              Não foi possível buscar o anúncio. Tente novamente.
            </p>
          ) : null}

          {listing ? (
            <>
              <ListingsSyncResultCard listing={listing} />
              <ListingsSyncOperations />
            </>
          ) : null}

          {empty && !loading ? (
            <p className="listings-sync-panel__inline-empty" role="status">
              Nenhum anúncio encontrado.
            </p>
          ) : null}

          {showInitialEmpty && !loading && searchState !== "error" && !empty ? (
            <p className="listings-sync-panel__inline-empty" role="status">
              Informe um MLB ou SKU e clique em Buscar anúncio.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="listings-sync-panel listings-sync-panel--embedded"
        data-panel-state={panelState}
        data-search-state={searchState}
      >
        <div className="listings-sync-panel__body">{body}</div>
      </div>
    );
  }

  return (
    <section
      className="listings-sync-panel"
      data-panel-state={panelState}
      data-search-state={searchState}
      aria-labelledby="listings-sync-panel-title"
    >
      <header className="listings-sync-panel__head">
        <h4 id="listings-sync-panel-title" className="listings-sync-panel__title">
          Sync de Anúncio
        </h4>
      </header>
      <div className="listings-sync-panel__body">{body}</div>
    </section>
  );
}

export default memo(ListingsSyncPanel);
