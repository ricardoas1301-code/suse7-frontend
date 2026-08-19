/**
 * Modos de página da listagem ML (S7) — identidade por rota sem acoplar regra de negócio ao JSX da página.
 *
 * - `ADS_PAGE_MODE` → `/anuncios` — catálogo, saúde do anúncio, status e integração.
 * - `PRICING_PAGE_MODE` → `/precificacoes` — leitura voltada a decisão de preço/repasse/risco (dados ainda do backend).
 *
 * Filtros: mesmas definições e `applyAdsCatalogFilter` em `adsFilterRegistry`; só diverge ordem/subconjunto exibido nos chips.
 */

/** @typedef {"anuncios" | "precificacoes"} ListingsWorkspaceMode */

/** @typedef {"openListingEditor" | "openPricingIntelligence" | "openListingRayX"} ListingsRowClickAction */

/** @typedef {"full_catalog" | "pricing_focus"} ListingsColumnLayout */

/**
 * @typedef {Object} ListingsPageSearchConfig
 * @property {string} placeholder
 * @property {string} ariaLabel
 */

/**
 * @typedef {Object} ListingsPageEmptyStateNouns
 * @property {string} noun
 * @property {string} nounPlural
 */

/**
 * Títulos de estado vazio (gênero / redação por página).
 * @typedef {Object} ListingsPageEmptyStateTitles
 * @property {string} noneInFilter
 * @property {string} noneFound
 * @property {string} noneImported
 */

/**
 * @typedef {Object} ListingsPageBulkBarLabels
 * @property {string} selectedOne — ex.: “anúncio selecionado” / “oferta selecionada”
 * @property {string} selectedMany
 */

/**
 * @typedef {Object} ListingsPageFilterToolbarConfig
 * @property {string[]} chipOrder — ids válidos de `ADS_FILTER_DEFINITIONS` (mesma ordem do toolbar).
 */

/**
 * @typedef {Object} ListingsPageModeConfig
 * @property {ListingsWorkspaceMode} modeKey
 * @property {string} pageTitle — título visível (complementa o h1 sr-only)
 * @property {string} pageSubtitle — intenção da página (visível)
 * @property {string} srTitle
 * @property {string} marketplaceScopeKey
 * @property {boolean} showPrecificaS7Column
 * @property {"minimal" | "full"} defaultViewMode
 * @property {boolean} [allowViewModeToggle] — exibe o botão de alternância Vista simples/completa. Default `true`. `false` fixa a visualização oficial (sem toggle).
 * @property {boolean} [filtersStartCollapsed] — card de busca e filtros abre recolhido por padrão (mesmo comportamento de Vendas). Default `false`.
 * @property {number} [pageSize] — itens por página na listagem (apenas fatiamento client-side; não altera backend/contratos). Default `25`.
 * @property {boolean} [showAccountFilter] — exibe o select de Conta no card de filtros (filtro client-side por `marketplaceAccountId`). Default `false`.
 * @property {boolean} [showReportsCentral] — exibe botão e Central de Relatórios (estrutura visual; sem geração nesta fase). Default `false`.
 * @property {ListingsRowClickAction} rowClickAction
 * @property {"listing_health" | "pricing_financial"} kpiPreset — qual bloco de top cards renderizar
 * @property {string} filtersToolbarKey — id estável (telemetria / futuro)
 * @property {string} columnsPresetKey
 * @property {ListingsColumnLayout} columnLayout — `pricing_focus` oculta colunas de catálogo/qualidade na grade completa
 * @property {ListingsPageSearchConfig} search
 * @property {ListingsPageEmptyStateNouns} emptyStateNouns
 * @property {ListingsPageEmptyStateTitles} emptyStateTitles
 * @property {ListingsPageBulkBarLabels} bulkBarLabels
 * @property {ListingsPageFilterToolbarConfig} filterToolbar
 * @property {"same_tab" | "new_tab" | "modal"} [pricingIntelligenceOpenTarget] — destino ao abrir PI a partir da grade. `modal` = modal 95vw (Precificações); `new_tab` = fallback legado; `same_tab` = navega na rota.
 */

/** Texto canônico — catálogo ainda sem anúncios importados/vinculados. */
export const LISTINGS_EMPTY_CATALOG_MESSAGE =
  "Importe ou vincule seus anúncios. Se já importou, aguarde a sincronização ou tente recarregar.";

/** Modo da rota `/anuncios`. */
export const ADS_PAGE_MODE = /** @type {const} */ ("anuncios");

/** Modo da rota `/precificacoes`. */
export const PRICING_PAGE_MODE = /** @type {const} */ ("precificacoes");

/**
 * Top cards hoje (implementação em `Anuncios.jsx` por `kpiPreset`):
 *
 * **ADS (`listing_health`)**
 * - Grandes: “Anúncios ativos”, “Faturamento dos anúncios”
 * - Minis: SKU pendente + placeholders Vendas / Lucro / Em queda
 *
 * **PRICING (`pricing_financial`)**
 * - Grandes: “Produtos precificados”, “Margem média” (payload `pricing_page_summary` em GET /api/ml/listings)
 * - Minis: “Preços saudáveis”, “Em risco”, “Prejuízo”, “Oportunidades”
 *
 * Colunas (grade completa):
 * - **ADS (`full_catalog`)**: todas as colunas atuais incl. qualidade, experiência, status, saúde.
 * - **PRICING (`pricing_focus`)**: mesma base até visitas; remove qualidade, experiência, status, saúde (foco comercial).
 *
 * Filtros:
 * - Mesmo motor `applyAdsCatalogFilter` / definições em `adsFilterRegistry.js`.
 * - **ADS**: ordem operacional (atenção, SKU, status, visitas, queda, mkt, …).
 * - **PRICING**: prioriza chips financeiros (margem, prejuízo, lucro, vendas) e reduz ênfase em exposição (sem “Qtd visitas” / “Em queda” nesta fase).
 */

/** @type {Record<ListingsWorkspaceMode, ListingsPageModeConfig>} */
export const listingsPageModes = {
  [ADS_PAGE_MODE]: {
    modeKey: ADS_PAGE_MODE,
    pageTitle: "Anúncios",
    pageSubtitle: "Saúde do anúncio, status no marketplace e gestão operacional do catálogo.",
    srTitle: "Anúncios",
    marketplaceScopeKey: "mercado_livre",
    showPrecificaS7Column: false,
    defaultViewMode: "minimal",
    allowViewModeToggle: true,
    filtersStartCollapsed: true,
    pageSize: 100,
    showAccountFilter: true,
    showReportsCentral: true,
    rowClickAction: "openListingRayX",
    kpiPreset: "listing_health",
    filtersToolbarKey: "anunciosFilters",
    columnsPresetKey: "anunciosColumns",
    columnLayout: "full_catalog",
    search: {
      placeholder: "Título, SKU ou número do anúncio",
      ariaLabel: "Buscar anúncios por título, SKU ou número do anúncio",
    },
    emptyStateNouns: { noun: "anúncio", nounPlural: "anúncios" },
    emptyStateTitles: {
      noneInFilter: "Nenhum anúncio neste filtro",
      noneFound: "Nenhum anúncio encontrado",
      noneImported: "Nenhum anúncio importado",
    },
    bulkBarLabels: { selectedOne: "anúncio selecionado", selectedMany: "anúncios selecionados" },
    pricingIntelligenceOpenTarget: "same_tab",
    filterToolbar: {
      chipOrder: [
        "top_sales",
        "top_profit",
        "needs_attention",
        "sku_pending_ml",
        "active",
        "paused",
        "visit_volume",
        "declining",
        "mercadolivre",
        "no_sales",
        "low_margin",
        "loss",
      ],
    },
  },
  [PRICING_PAGE_MODE]: {
    modeKey: PRICING_PAGE_MODE,
    pageTitle: "Precificações",
    pageSubtitle: "Repasse, margem, risco e oportunidades — apoio à decisão financeira (dados do servidor).",
    srTitle: "Precificações — inteligência comercial",
    marketplaceScopeKey: "mercado_livre",
    showPrecificaS7Column: false,
    // Vista Simples (minimal) é a visualização oficial — clique na linha abre a Precificação Inteligente S7.
    defaultViewMode: "minimal",
    allowViewModeToggle: false,
    filtersStartCollapsed: true,
    pageSize: 100,
    showAccountFilter: true,
    showReportsCentral: true,
    rowClickAction: "openPricingIntelligence",
    pricingIntelligenceOpenTarget: "modal",
    kpiPreset: "pricing_financial",
    filtersToolbarKey: "precificacoesFilters",
    columnsPresetKey: "precificacoesColumns",
    columnLayout: "pricing_focus",
    search: {
      placeholder: "Título, SKU ou número do anúncio",
      ariaLabel: "Buscar ofertas por título, SKU ou número do anúncio",
    },
    emptyStateNouns: { noun: "oferta", nounPlural: "ofertas" },
    emptyStateTitles: {
      noneInFilter: "Nenhuma oferta neste filtro",
      noneFound: "Nenhuma oferta encontrada",
      noneImported: "Nenhuma oferta importada",
    },
    bulkBarLabels: { selectedOne: "oferta selecionada", selectedMany: "ofertas selecionadas" },
    filterToolbar: {
      chipOrder: [
        "top_sales",
        "top_profit",
        "low_margin",
        "loss",
        "needs_attention",
        "sku_pending_ml",
        "active",
        "paused",
        "mercadolivre",
        "no_sales",
      ],
    },
  },
};

/** @param {string} mode */
export function isListingsWorkspaceMode(mode) {
  return mode === ADS_PAGE_MODE || mode === PRICING_PAGE_MODE;
}
