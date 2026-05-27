import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { SALES_SYNC_DEFAULT_MOCK_SALE_ID } from "./salesSyncModel";
import { useSalesSyncView } from "./useSalesSyncView";
import "./SalesSyncSearchForm.css";

function SalesSyncSearchForm() {
  const { searchQuery, searchState, searchError, setSearchQuery, searchSale } = useSalesSyncView();
  const isSearching = searchState === "loading";

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void searchSale();
    },
    [searchSale],
  );

  return (
    <form className="sales-sync-search-form" onSubmit={handleSubmit}>
      <label className="sales-sync-search-form__field">
        <span className="sales-sync-search-form__label">ID da venda</span>
        <div className="sales-sync-search-form__input-wrap">
          <Search className="sales-sync-search-form__icon" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Ex: ${SALES_SYNC_DEFAULT_MOCK_SALE_ID}`}
            aria-label="ID da venda"
            className="sales-sync-search-form__input"
            disabled={isSearching}
          />
        </div>
      </label>

      {searchError ? (
        <p className="sales-sync-search-form__error" role="alert">
          {searchError}
        </p>
      ) : null}

      <button
        type="submit"
        className="sales-sync-search-form__submit"
        disabled={isSearching}
      >
        {isSearching ? "Buscando..." : "Buscar venda"}
      </button>
    </form>
  );
}

export default memo(SalesSyncSearchForm);
