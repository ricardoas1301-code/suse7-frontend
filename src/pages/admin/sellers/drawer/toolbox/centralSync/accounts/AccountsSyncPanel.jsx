import { memo } from "react";
import AccountsSyncSearchForm from "./AccountsSyncSearchForm";
import AccountsSyncResultCard from "./AccountsSyncResultCard";
import AccountsSyncOperations from "./AccountsSyncOperations";
import { useAccountsSyncView } from "./useAccountsSyncView";
import "./AccountsSyncPanel.css";

function AccountsSyncPanelSkeleton() {
  return (
    <div className="accounts-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="accounts-sync-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ embedded?: boolean }} props
 */
function AccountsSyncPanel({ embedded = false }) {
  const { panelState, searchState, account, loading, error, empty } = useAccountsSyncView();

  const showInitialEmpty =
    searchState === "idle" || (searchState !== "loading" && !account && !empty && !error);

  const body = (
    <>
      {panelState === "loading" ? <AccountsSyncPanelSkeleton /> : null}

      {panelState === "empty" ? (
        <p className="accounts-sync-panel__message accounts-sync-panel__message--empty" role="status">
          Central Sync indisponível para este seller no momento.
        </p>
      ) : null}

      {panelState === "error" ? (
        <p className="accounts-sync-panel__message accounts-sync-panel__message--error" role="alert">
          Não foi possível exibir a Central Sync. Tente voltar e abrir novamente.
        </p>
      ) : null}

      {panelState === "loaded" ? (
        <>
          <AccountsSyncSearchForm />

          {loading ? (
            <div className="accounts-sync-panel__search-loading" role="status">
              <span className="accounts-sync-panel__search-loading-line" />
              <span className="accounts-sync-panel__search-loading-line accounts-sync-panel__search-loading-line--short" />
            </div>
          ) : null}

          {searchState === "error" ? (
            <p className="accounts-sync-panel__message accounts-sync-panel__message--error" role="alert">
              Não foi possível buscar a conta. Tente novamente.
            </p>
          ) : null}

          {account ? (
            <>
              <AccountsSyncResultCard account={account} />
              <AccountsSyncOperations />
            </>
          ) : null}

          {empty && !loading ? (
            <p className="accounts-sync-panel__inline-empty" role="status">
              Nenhuma conta encontrada.
            </p>
          ) : null}

          {showInitialEmpty && !loading && searchState !== "error" && !empty ? (
            <p className="accounts-sync-panel__inline-empty" role="status">
              Informe o nome da conta e clique em Buscar conta.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div
        className="accounts-sync-panel accounts-sync-panel--embedded"
        data-panel-state={panelState}
        data-search-state={searchState}
      >
        <div className="accounts-sync-panel__body">{body}</div>
      </div>
    );
  }

  return (
    <section
      className="accounts-sync-panel"
      data-panel-state={panelState}
      data-search-state={searchState}
      aria-labelledby="accounts-sync-panel-title"
    >
      <header className="accounts-sync-panel__head">
        <h4 id="accounts-sync-panel-title" className="accounts-sync-panel__title">
          Sync de Conta Marketplace
        </h4>
      </header>
      <div className="accounts-sync-panel__body">{body}</div>
    </section>
  );
}

export default memo(AccountsSyncPanel);
