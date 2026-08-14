import { buildApiUrl, apiFetch } from "../config/api.js";

/** @typedef {import("../domain/legal/termosUsoDocumento.js").TermosBloco} TermosBloco */

/**
 * @typedef {{
 *   document_type: string;
 *   document_version: string;
 *   document_hash: string;
 *   published_at_label: string;
 *   title_page: string;
 *   title_modal: string;
 *   blocks: readonly TermosBloco[];
 * }} CatalogoTermosUso
 */

/** @type {CatalogoTermosUso | null} */
let cacheCatalogo = null;

/** @type {Promise<{ ok: boolean; catalog?: CatalogoTermosUso; error?: string }> | null} */
let fetchInFlight = null;

/**
 * Busca catálogo canônico de Termos de Uso (SSOT backend).
 * @param {{ force?: boolean }} [options]
 */
export async function buscarCatalogoTermosUso(options = {}) {
  if (cacheCatalogo && !options.force) {
    return { ok: true, catalog: cacheCatalogo };
  }

  if (fetchInFlight && !options.force) {
    return fetchInFlight;
  }

  const url = buildApiUrl("/api/legal/documents/terms-of-use");
  if (!url) {
    return {
      ok: false,
      error: "Não foi possível carregar os Termos de Uso. Tente novamente em instantes.",
    };
  }

  fetchInFlight = (async () => {
    const res = await apiFetch(url, {
      method: "GET",
      cache: "default",
    });

    if (!res.ok || !res.data?.catalog) {
      return {
        ok: false,
        error: "Não foi possível carregar os Termos de Uso. Tente novamente em instantes.",
      };
    }

    const catalog = /** @type {CatalogoTermosUso} */ (res.data.catalog);
    if (
      !catalog.document_type ||
      !catalog.document_version ||
      !catalog.document_hash ||
      !Array.isArray(catalog.blocks)
    ) {
      return {
        ok: false,
        error: "Catálogo jurídico inválido. Tente novamente em instantes.",
      };
    }

    cacheCatalogo = catalog;
    return { ok: true, catalog };
  })();

  try {
    return await fetchInFlight;
  } finally {
    fetchInFlight = null;
  }
}

/** Apenas testes — limpa cache module-level. */
export function __resetCatalogoTermosUsoParaTestes() {
  cacheCatalogo = null;
  fetchInFlight = null;
}
