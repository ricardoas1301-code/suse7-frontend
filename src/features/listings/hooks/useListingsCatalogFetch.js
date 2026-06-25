import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl, apiFetch } from "../../../config/api";
import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
} from "../../../auth/authBootstrapService";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { mapGridApiToCatalogRow } from "../utils/mlListingsGridMapping.js";
import { debugLogMlListingsCoverFromApi } from "./listingCatalogDebug.js";

function logListingsCatalogDev(label, payload) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7][useListingsCatalogFetch] ${label}`, payload);
}

/**
 * Carrega GET /api/ml/listings (banco local SUS7) após auth bootstrap.
 * Não depende de API viva do ML para a leitura inicial.
 */
export function useListingsCatalogFetch({ onAfterLoad } = {}) {
  const authReady = useAuthBootstrapReady();
  const [catalogRows, setCatalogRows] = useState([]);
  /** Agregados da página Precificações (GET /api/ml/listings → pricing_page_summary). */
  const [pricingPageSummary, setPricingPageSummary] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  /** Aviso não bloqueante (ex.: timeout com dados anteriores preservados). */
  const [listSyncWarning, setListSyncWarning] = useState(/** @type {string | null} */ (null));
  const fetchGenerationRef = useRef(0);
  const catalogRowsRef = useRef(catalogRows);

  useEffect(() => {
    catalogRowsRef.current = catalogRows;
  }, [catalogRows]);

  const fetchListings = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    const url = buildApiUrl("/api/ml/listings?local_only=1");
    if (!url) {
      setListError("Defina VITE_API_BASE_URL apontando para o backend.");
      setCatalogRows([]);
      setPricingPageSummary(null);
      setListLoading(false);
      return false;
    }

    setListLoading(true);
    setListError(null);
    setListSyncWarning(null);

    await ensureAuthSessionBootstrapped();
    const token = getAuthBootstrapAccessToken();
    if (!token) {
      if (generation !== fetchGenerationRef.current) return false;
      setListLoading(false);
      setListError("Sessão indisponível. Aguarde o login ou recarregue a página.");
      setCatalogRows([]);
      setPricingPageSummary(null);
      logListingsCatalogDev("abort_no_token", { url });
      return false;
    }

    const startedAt = Date.now();
    logListingsCatalogDev("request_start", { url, hasToken: true });

    const res = await apiFetch(url, { method: "GET", timeoutMs: 120000 });
    const elapsedMs = Date.now() - startedAt;

    if (generation !== fetchGenerationRef.current) {
      logListingsCatalogDev("cancelled", { elapsedMs, status: res.status });
      return false;
    }

    setListLoading(false);

    logListingsCatalogDev("request_end", {
      elapsedMs,
      ok: res.ok,
      status: res.status,
      timedOut: Boolean(res.timedOut),
      connectionError: Boolean(res.connectionError),
      error: res.error ?? null,
    });

    if (!res.ok) {
      const hadLocalRows = catalogRowsRef.current.length > 0;
      if (res.timedOut && hadLocalRows) {
        setListSyncWarning(
          "Não foi possível atualizar agora. Exibindo dados salvos no SUS7.",
        );
        return false;
      }
      const msg =
        res.status === 401
          ? "Sessão expirada ou indisponível. Faça login novamente."
          : res.error || res.data?.error || "Não foi possível carregar os anúncios.";
      setListError(msg);
      if (!hadLocalRows) {
        setCatalogRows([]);
        setPricingPageSummary(null);
      }
      return false;
    }

    const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
    debugLogMlListingsCoverFromApi(listings);
    const mapped = listings.map(mapGridApiToCatalogRow);
    setCatalogRows(mapped);
    const ps = res.data?.pricing_page_summary;
    setPricingPageSummary(ps != null && typeof ps === "object" ? ps : null);

    logListingsCatalogDev("payload_parsed", {
      elapsedMs,
      total: res.data?.total ?? mapped.length,
      rows: mapped.length,
      source: "GET /api/ml/listings",
    });

    if (mapped.length === 0 && Array.isArray(res.data?.data_quality?.warnings) && res.data.data_quality.warnings.length > 0) {
      setListSyncWarning(
        "Não foi possível consolidar todos os dados agora. Verifique a conexão ou tente novamente.",
      );
    }

    onAfterLoad?.();
    return true;
  }, [onAfterLoad]);

  useEffect(() => {
    if (!authReady) {
      setListLoading(true);
      logListingsCatalogDev("waiting_auth_bootstrap", {});
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      const ok = await fetchListings();
      if (cancelled && import.meta.env.DEV) {
        logListingsCatalogDev("effect_cleanup", { ok });
      }
    })();

    return () => {
      cancelled = true;
      fetchGenerationRef.current += 1;
    };
  }, [authReady, fetchListings]);

  return {
    catalogRows,
    setCatalogRows,
    pricingPageSummary,
    listLoading,
    listError,
    setListError,
    listSyncWarning,
    authReady,
    authWaiting: !authReady,
    fetchListings,
  };
}
