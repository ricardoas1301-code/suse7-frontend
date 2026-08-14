import { useEffect, useState } from "react";
import { buscarCatalogoTermosUso } from "../services/legalDocumentCatalogApi.js";

/**
 * Hook para consumir o catálogo canônico de Termos de Uso (SSOT backend).
 * Fail controlled — não usa versão local silenciosa.
 */
export function useTermosUsoCatalogo() {
  const [catalog, setCatalog] = useState(/** @type {import("../services/legalDocumentCatalogApi.js").CatalogoTermosUso | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await buscarCatalogoTermosUso();
      if (!mounted) return;
      if (!result.ok || !result.catalog) {
        setError(result.error ?? "Não foi possível carregar os Termos de Uso.");
        setCatalog(null);
      } else {
        setCatalog(result.catalog);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { catalog, loading, error };
}
