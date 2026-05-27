import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { PRODUCTS_SYNC_DEFAULT_MOCK_SKU } from "./productsSyncModel";
import { useProductsSyncView } from "./useProductsSyncView";
import "./ProductsSyncSearchForm.css";

function ProductsSyncSearchForm() {
  const { query, loading, error, setQuery, searchProduct } = useProductsSyncView();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void searchProduct();
    },
    [searchProduct],
  );

  return (
    <form className="products-sync-search-form" onSubmit={handleSubmit}>
      <label className="products-sync-search-form__field">
        <span className="products-sync-search-form__label">SKU</span>
        <div className="products-sync-search-form__input-wrap">
          <Search className="products-sync-search-form__icon" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Ex: ${PRODUCTS_SYNC_DEFAULT_MOCK_SKU}`}
            aria-label="SKU do produto"
            className="products-sync-search-form__input"
            disabled={loading}
          />
        </div>
      </label>

      {error && !loading ? (
        <p className="products-sync-search-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="products-sync-search-form__submit" disabled={loading}>
        {loading ? "Buscando..." : "Buscar produto"}
      </button>
    </form>
  );
}

export default memo(ProductsSyncSearchForm);
