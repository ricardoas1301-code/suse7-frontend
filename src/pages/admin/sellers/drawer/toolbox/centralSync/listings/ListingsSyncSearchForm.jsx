import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { LISTINGS_SYNC_DEFAULT_MOCK_QUERY } from "./listingsSyncModel";
import { useListingsSyncView } from "./useListingsSyncView";
import "./ListingsSyncSearchForm.css";

function ListingsSyncSearchForm() {
  const { query, loading, error, setQuery, searchListing } = useListingsSyncView();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void searchListing();
    },
    [searchListing],
  );

  return (
    <form className="listings-sync-search-form" onSubmit={handleSubmit}>
      <label className="listings-sync-search-form__field">
        <span className="listings-sync-search-form__label">MLB ou SKU</span>
        <div className="listings-sync-search-form__input-wrap">
          <Search className="listings-sync-search-form__icon" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Ex: ${LISTINGS_SYNC_DEFAULT_MOCK_QUERY} ou SKU-ABC-123`}
            aria-label="MLB ou SKU do anúncio"
            className="listings-sync-search-form__input"
            disabled={loading}
          />
        </div>
      </label>

      {error && !loading ? (
        <p className="listings-sync-search-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="listings-sync-search-form__submit" disabled={loading}>
        {loading ? "Buscando..." : "Buscar anúncio"}
      </button>
    </form>
  );
}

export default memo(ListingsSyncSearchForm);
