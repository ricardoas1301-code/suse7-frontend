// =============================================================================
// Dev Center S1 — reload operacional granular (modelo)
// =============================================================================

/** @typedef {"lista_sellers" | "resumo_seller" | "assinatura" | "integracoes" | "feature_flags" | "toolbox" | "timeline"} DevCenterCategoriaReload */

export const DEV_CENTER_CATEGORIAS_RELOAD = Object.freeze({
  LISTA_SELLERS: "lista_sellers",
  RESUMO_SELLER: "resumo_seller",
  ASSINATURA: "assinatura",
  INTEGRACOES: "integracoes",
  FEATURE_FLAGS: "feature_flags",
  TOOLBOX: "toolbox",
  TIMELINE: "timeline",
});

/** @type {DevCenterCategoriaReload[]} */
export const DEV_CENTER_CATEGORIAS_RELOAD_ORDEM = Object.freeze([
  DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS,
  DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
  DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA,
  DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES,
  DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS,
  DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX,
  DEV_CENTER_CATEGORIAS_RELOAD.TIMELINE,
]);

/** @type {Record<string, string>} */
export const DEV_CENTER_CATEGORIA_RELOAD_LABELS = Object.freeze({
  lista_sellers: "Lista de sellers",
  resumo_seller: "Resumo do seller",
  assinatura: "Assinatura",
  integracoes: "Integrações",
  feature_flags: "Feature flags",
  toolbox: "Toolbox operacional",
  timeline: "Timeline operacional",
});

/**
 * Mapeia categoria da Seller Toolbox → categorias de reload do Dev Center.
 * @type {Record<string, DevCenterCategoriaReload[]>}
 */
export const MAPA_CATEGORIA_TOOLBOX_PARA_RELOAD = Object.freeze({
  account: [DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER],
  subscription: [
    DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA,
    DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
  ],
  integrations: [
    DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES,
    DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
  ],
  feature_flags: [
    DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS,
    DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX,
  ],
  cache_refresh: [
    DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
    DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX,
  ],
  central_sync: [DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES],
  operational_timeline: [DEV_CENTER_CATEGORIAS_RELOAD.TIMELINE],
  sync: [DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES],
  products: [DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER],
  history: [DEV_CENTER_CATEGORIAS_RELOAD.TIMELINE],
});

/**
 * Painéis recarregados pelo fluxo DEV reload_panel_data → categorias operacionais.
 * @type {Record<string, DevCenterCategoriaReload[]>}
 */
export const MAPA_PAINEL_RELOAD_PARA_CATEGORIAS = Object.freeze({
  seller_identity: [DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER],
  subscription: [DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA],
  marketplaces: [DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES],
  quick_metrics: [DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER],
  feature_flags: [DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS],
  cache_refresh: [DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX],
});

/**
 * @param {string | null | undefined} categoriaId
 * @returns {DevCenterCategoriaReload[]}
 */
export function resolverCategoriasReload(categoriaId) {
  const chave = String(categoriaId ?? "").trim();
  if (!chave) return [];

  const direto = MAPA_CATEGORIA_TOOLBOX_PARA_RELOAD[chave];
  if (direto?.length) return [...direto];

  if (DEV_CENTER_CATEGORIAS_RELOAD_ORDEM.includes(/** @type {DevCenterCategoriaReload} */ (chave))) {
    return [/** @type {DevCenterCategoriaReload} */ (chave)];
  }

  return [];
}

/**
 * @param {string[] | null | undefined} paineis
 * @returns {DevCenterCategoriaReload[]}
 */
export function resolverCategoriasReloadPorPaineis(paineis) {
  if (!Array.isArray(paineis) || paineis.length === 0) return [];

  const acumulado = new Set();
  for (const painel of paineis) {
    const categorias = MAPA_PAINEL_RELOAD_PARA_CATEGORIAS[String(painel)] ?? [];
    for (const categoria of categorias) acumulado.add(categoria);
  }

  return DEV_CENTER_CATEGORIAS_RELOAD_ORDEM.filter((categoria) => acumulado.has(categoria));
}

/**
 * @param {DevCenterCategoriaReload | string | null | undefined} categoriaId
 */
export function rotuloCategoriaReload(categoriaId) {
  const chave = String(categoriaId ?? "").trim();
  return DEV_CENTER_CATEGORIA_RELOAD_LABELS[chave] ?? (chave || "—");
}

/**
 * @param {DevCenterCategoriaReload[]} categorias
 */
export function normalizarCategoriasReload(categorias) {
  if (!Array.isArray(categorias) || categorias.length === 0) return [];

  const acumulado = new Set();
  for (const item of categorias) {
    for (const resolvida of resolverCategoriasReload(item)) {
      acumulado.add(resolvida);
    }
  }

  return DEV_CENTER_CATEGORIAS_RELOAD_ORDEM.filter((categoria) => acumulado.has(categoria));
}
