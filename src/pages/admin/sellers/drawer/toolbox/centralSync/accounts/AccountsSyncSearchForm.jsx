import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { ACCOUNTS_SYNC_DEFAULT_MOCK_QUERY } from "./accountsSyncModel";
import { useAccountsSyncView } from "./useAccountsSyncView";
import "./AccountsSyncSearchForm.css";

function AccountsSyncSearchForm() {
  const { query, loading, error, setQuery, searchAccount } = useAccountsSyncView();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void searchAccount();
    },
    [searchAccount],
  );

  return (
    <form className="accounts-sync-search-form" onSubmit={handleSubmit}>
      <label className="accounts-sync-search-form__field">
        <span className="accounts-sync-search-form__label">Conta marketplace</span>
        <div className="accounts-sync-search-form__input-wrap">
          <Search className="accounts-sync-search-form__icon" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Ex: ${ACCOUNTS_SYNC_DEFAULT_MOCK_QUERY}`}
            aria-label="Nome da conta marketplace"
            className="accounts-sync-search-form__input"
            disabled={loading}
          />
        </div>
      </label>

      {error && !loading ? (
        <p className="accounts-sync-search-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="accounts-sync-search-form__submit" disabled={loading}>
        {loading ? "Buscando..." : "Buscar conta"}
      </button>
    </form>
  );
}

export default memo(AccountsSyncSearchForm);
