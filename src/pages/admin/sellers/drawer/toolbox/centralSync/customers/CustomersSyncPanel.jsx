import { memo } from "react";
import CustomersSyncSearchForm from "./CustomersSyncSearchForm";
import CustomersSyncResultCard from "./CustomersSyncResultCard";
import CustomersSyncRecentSales from "./CustomersSyncRecentSales";
import CustomersSyncOperations from "./CustomersSyncOperations";
import { useCustomersSyncView } from "./useCustomersSyncView";
import "./CustomersSyncPanel.css";

function CustomersSyncPanelSkeleton() {
  return (
    <div className="customers-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="customers-sync-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ embedded?: boolean }} props
 */
function CustomersSyncPanel({ embedded = false }) {
  const { panelState, searchState, customer, loading, error, empty } = useCustomersSyncView();

  const showInitialEmpty =
    searchState === "idle" || (searchState !== "loading" && !customer && !empty && !error);

  const body = (
    <>
      {panelState === "loading" ? <CustomersSyncPanelSkeleton /> : null}

      {panelState === "empty" ? (
        <p className="customers-sync-panel__message customers-sync-panel__message--empty" role="status">
          Central Sync indisponível para este seller no momento.
        </p>
      ) : null}

      {panelState === "error" ? (
        <p className="customers-sync-panel__message customers-sync-panel__message--error" role="alert">
          Não foi possível exibir a Central Sync. Tente voltar e abrir novamente.
        </p>
      ) : null}

      {panelState === "loaded" ? (
        <>
          <CustomersSyncSearchForm />

          {loading ? (
            <div className="customers-sync-panel__search-loading" role="status">
              <span className="customers-sync-panel__search-loading-line" />
              <span className="customers-sync-panel__search-loading-line customers-sync-panel__search-loading-line--short" />
            </div>
          ) : null}

          {searchState === "error" ? (
            <p className="customers-sync-panel__message customers-sync-panel__message--error" role="alert">
              Não foi possível buscar o cliente. Tente novamente.
            </p>
          ) : null}

          {customer ? (
            <>
              <CustomersSyncResultCard customer={customer} />
              <CustomersSyncRecentSales recentSales={customer.recentSales} />
              <CustomersSyncOperations />
            </>
          ) : null}

          {empty && !loading ? (
            <p className="customers-sync-panel__inline-empty" role="status">
              Nenhum cliente encontrado.
            </p>
          ) : null}

          {showInitialEmpty && !loading && searchState !== "error" && !empty ? (
            <p className="customers-sync-panel__inline-empty" role="status">
              Informe e-mail, telefone ou documento e clique em Buscar cliente.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="customers-sync-panel customers-sync-panel--embedded"
        data-panel-state={panelState}
        data-search-state={searchState}
      >
        <div className="customers-sync-panel__body">{body}</div>
      </div>
    );
  }

  return (
    <section
      className="customers-sync-panel"
      data-panel-state={panelState}
      data-search-state={searchState}
      aria-labelledby="customers-sync-panel-title"
    >
      <header className="customers-sync-panel__head">
        <h4 id="customers-sync-panel-title" className="customers-sync-panel__title">
          Sync de Cliente
        </h4>
      </header>
      <div className="customers-sync-panel__body">{body}</div>
    </section>
  );
}

export default memo(CustomersSyncPanel);
