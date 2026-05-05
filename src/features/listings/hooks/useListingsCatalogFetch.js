import { useCallback, useEffect, useState } from "react";
import { buildApiUrl, apiFetch, getSessionToken } from "../../../config/api";
import { mapGridApiToCatalogRow } from "../utils/mlListingsGridMapping.js";
import { debugLogMlListingsCoverFromApi } from "./listingCatalogDebug.js";

/**
 * Carrega GET /api/ml/listings e normaliza com `mapGridApiToCatalogRow`.
 * `onAfterLoad` permite ao agregador (ex.: limpar seleção) sem acoplar estado extra aqui.
 */
export function useListingsCatalogFetch({ onAfterLoad } = {}) {
  const [catalogRows, setCatalogRows] = useState([]);
  /** Agregados da página Precificações (GET /api/ml/listings → pricing_page_summary). */
  const [pricingPageSummary, setPricingPageSummary] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const fetchListings = useCallback(async () => {
    const url = buildApiUrl("/api/ml/listings");
    if (!url) {
      setListError("Defina VITE_API_BASE_URL apontando para o backend.");
      setCatalogRows([]);
      setPricingPageSummary(null);
      setListLoading(false);
      return false;
    }
    setListLoading(true);
    setListError(null);

    let token = await getSessionToken();
    if (!token) {
      await new Promise((r) => setTimeout(r, 150));
      token = await getSessionToken();
    }
    if (!token) {
      setListLoading(false);
      setListError("Sessão ainda não disponível para o token. Atualize a página ou entre novamente.");
      setCatalogRows([]);
      setPricingPageSummary(null);
      return false;
    }

    if (import.meta.env.DEV) {
      console.info("[Suse7][API listings URL]", url);
    }
    const res = await apiFetch(url);
    setListLoading(false);
    if (!res.ok) {
      const msg = res.error || res.data?.error || "Não foi possível carregar os anúncios.";
      setListError(msg);
      setCatalogRows([]);
      setPricingPageSummary(null);
      return false;
    }
    const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
    debugLogMlListingsCoverFromApi(listings);
    setCatalogRows(listings.map(mapGridApiToCatalogRow));
    const ps = res.data?.pricing_page_summary;
    setPricingPageSummary(ps != null && typeof ps === "object" ? ps : null);
    onAfterLoad?.();
    return true;
  }, [onAfterLoad]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  return {
    catalogRows,
    setCatalogRows,
    pricingPageSummary,
    listLoading,
    listError,
    setListError,
    fetchListings,
  };
}
