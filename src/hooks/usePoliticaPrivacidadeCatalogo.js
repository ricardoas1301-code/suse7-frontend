import { useEffect, useState } from "react";
import { buscarCatalogoPoliticaPrivacidade } from "../services/legalDocumentCatalogApi.js";

/**
 * Hook para consumir o catálogo canônico de Política de Privacidade (SSOT backend).
 * Fail controlled — não usa versão local silenciosa.
 */
export function usePoliticaPrivacidadeCatalogo() {
  const [catalog, setCatalog] = useState(
    /** @type {import("../services/legalDocumentCatalogApi.js").CatalogoDocumentoLegal | null} */ (null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await buscarCatalogoPoliticaPrivacidade();
      if (!mounted) return;
      if (!result.ok || !result.catalog) {
        setError(result.error ?? "Não foi possível carregar a Política de Privacidade.");
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
