import { buildApiUrl, apiFetch } from "../config/api.js";

/** @typedef {import("../domain/legal/termosUsoDocumento.js").TermosBloco} DocumentoLegalBloco */

/**
 * @typedef {{
 *   document_type: string;
 *   document_version: string;
 *   document_hash: string;
 *   published_at_label: string;
 *   title_page: string;
 *   title_modal?: string;
 *   blocks: readonly DocumentoLegalBloco[];
 * }} CatalogoDocumentoLegal
 */

/** @type {Record<string, string>} */
const ROTAS_CATALOGO_POR_TIPO = {
  TERMS_OF_USE: "/api/legal/documents/terms-of-use",
  PRIVACY_POLICY: "/api/legal/documents/privacy-policy",
};

/** @type {Record<string, string>} */
const MENSAGENS_ERRO_CATALOGO = {
  TERMS_OF_USE: "Não foi possível carregar os Termos de Uso. Tente novamente em instantes.",
  PRIVACY_POLICY: "Não foi possível carregar a Política de Privacidade. Tente novamente em instantes.",
};

/** @type {Map<string, CatalogoDocumentoLegal>} */
const cachePorTipo = new Map();

/** @type {Map<string, Promise<{ ok: boolean; catalog?: CatalogoDocumentoLegal; error?: string }>>} */
const fetchInFlightPorTipo = new Map();

function mensagemErroCatalogo(documentType) {
  const tipo = String(documentType || "").trim();
  return (
    MENSAGENS_ERRO_CATALOGO[tipo] ??
    "Não foi possível carregar o documento legal. Tente novamente em instantes."
  );
}

function rotaCatalogo(documentType) {
  return (
    ROTAS_CATALOGO_POR_TIPO[documentType] ??
    `/api/legal/documents/${String(documentType || "").trim().toLowerCase().replace(/_/g, "-")}`
  );
}

/**
 * Busca catálogo canônico de documento legal (SSOT backend).
 * @param {string} documentType
 * @param {{ force?: boolean }} [options]
 */
export async function buscarCatalogoDocumentoLegal(documentType, options = {}) {
  const tipo = String(documentType || "").trim();
  if (!tipo) {
    return {
      ok: false,
      error: "Tipo de documento legal inválido.",
    };
  }

  const cacheAtual = cachePorTipo.get(tipo);
  if (cacheAtual && !options.force) {
    return { ok: true, catalog: cacheAtual };
  }

  const inFlight = fetchInFlightPorTipo.get(tipo);
  if (inFlight && !options.force) {
    return inFlight;
  }

  const url = buildApiUrl(rotaCatalogo(tipo));
  if (!url) {
    return {
      ok: false,
      error: mensagemErroCatalogo(tipo),
    };
  }

  const promessa = (async () => {
    const res = await apiFetch(url, {
      method: "GET",
      cache: "default",
    });

    if (!res.ok || !res.data?.catalog) {
      return {
        ok: false,
        error: mensagemErroCatalogo(tipo),
      };
    }

    const catalog = /** @type {CatalogoDocumentoLegal} */ (res.data.catalog);
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

    cachePorTipo.set(tipo, catalog);
    return { ok: true, catalog };
  })();

  fetchInFlightPorTipo.set(tipo, promessa);
  try {
    return await promessa;
  } finally {
    fetchInFlightPorTipo.delete(tipo);
  }
}

/** Compat — Termos de Uso */
export async function buscarCatalogoTermosUso(options = {}) {
  return buscarCatalogoDocumentoLegal("TERMS_OF_USE", options);
}

/** Política de Privacidade */
export async function buscarCatalogoPoliticaPrivacidade(options = {}) {
  return buscarCatalogoDocumentoLegal("PRIVACY_POLICY", options);
}

/** Apenas testes — limpa cache module-level. */
export function __resetCatalogosDocumentosLegaisParaTestes() {
  cachePorTipo.clear();
  fetchInFlightPorTipo.clear();
}

/** @deprecated use __resetCatalogosDocumentosLegaisParaTestes */
export function __resetCatalogoTermosUsoParaTestes() {
  __resetCatalogosDocumentosLegaisParaTestes();
}

/** @typedef {CatalogoDocumentoLegal} CatalogoTermosUso */
