import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { useCustomersSyncView } from "./useCustomersSyncView";
import "./CustomersSyncSearchForm.css";

function CustomersSyncSearchForm() {
  const { query, loading, error, setQuery, searchCustomer } = useCustomersSyncView();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void searchCustomer();
    },
    [searchCustomer],
  );

  return (
    <form className="customers-sync-search-form" onSubmit={handleSubmit}>
      <label className="customers-sync-search-form__field">
        <span className="customers-sync-search-form__label">Buscar cliente</span>
        <div className="customers-sync-search-form__input-wrap">
          <Search className="customers-sync-search-form__icon" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex: cliente@email.com, 11999999999, 12345678900"
            aria-label="E-mail, telefone ou documento do cliente"
            className="customers-sync-search-form__input"
            disabled={loading}
          />
        </div>
      </label>

      {error && !loading ? (
        <p className="customers-sync-search-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="customers-sync-search-form__submit" disabled={loading}>
        {loading ? "Buscando..." : "Buscar cliente"}
      </button>
    </form>
  );
}

export default memo(CustomersSyncSearchForm);
