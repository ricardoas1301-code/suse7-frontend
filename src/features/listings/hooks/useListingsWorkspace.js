import { useMemo } from "react";
import { listingsPageModes, isListingsWorkspaceMode } from "../config/listingsPageModes.js";

/**
 * Hook leve: resolve configuração do modo e valida chave.
 * Carregamento da listagem: hook `useListingsCatalogFetch` em `features/listings/hooks` (usado por `Anuncios`).
 *
 * @param {import("../config/listingsPageModes").ListingsWorkspaceMode | string} mode
 */
export function useListingsWorkspace(mode) {
  return useMemo(() => {
    const safe = isListingsWorkspaceMode(mode) ? mode : "anuncios";
    const config = listingsPageModes[safe];
    return {
      mode: safe,
      config,
      /** Mesmo preset de colunas hoje; chave permite trocar colunas por modo sem espalhar ifs. */
      columnsPresetKey: config.columnsPresetKey,
    };
  }, [mode]);
}
