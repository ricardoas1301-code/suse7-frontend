// ======================================================================
// PÁGINA: Anúncios — listagem operacional (Suse7), espelhando Produtos.
// Dados mock até API; KPIs e tabela prontos para evolução.
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import S7Button from "./ui/S7Button";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbar } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import {
  formatCatalogBRL,
  formatCatalogProfitPercentLabel,
  marketplaceChipLabel,
} from "../utils/productCatalogRow";
import "./Products.css";
import "./Anuncios.css";

const ADS_PAGE_SIZE = 25;

const ADS_COLUMN_TOOLTIPS = {
  adCount: "Quantidade de anúncios neste agrupamento (placeholder até agregação na API).",
  adTitle: "Título público do anúncio no marketplace.",
  product: "Produto interno vinculado ao anúncio.",
  marketplace: "Canal de venda onde o anúncio está publicado.",
  productCost: "Custo do produto usado na composição do anúncio.",
  price: "Preço de venda exibido no anúncio.",
  sales: "Unidades vendidas via este anúncio.",
  revenue: "Faturamento bruto associado ao anúncio.",
  profit: "Lucro estimado (faturamento − custos).",
  marginPct: "Margem percentual sobre o faturamento.",
  status: "Status operacional no marketplace.",
  adHealth: "Indicador de saúde do anúncio (performance e riscos).",
};

/**
 * @param {{ columnClass: string; tip?: string; tipWrap?: boolean; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function AdsCatalogHeadCell({ columnClass, tip, tipWrap = false, lines, children = null }) {
  const triggerClass = [
    "products-catalog__head-tooltip",
    lines && lines.length === 2 ? "products-catalog__head-tooltip--stacked" : "",
    tipWrap ? "products-catalog__head-tooltip--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label =
    lines && lines.length === 2 ? (
      <>
        <span className="products-catalog__col-head-line">{lines[0]}</span>
        <span className="products-catalog__col-head-line">{lines[1]}</span>
      </>
    ) : (
      children
    );

  return (
    <div className={`products-catalog__cell ${columnClass} products-catalog__col-head`} role="columnheader">
      {tip ? (
        <span className={triggerClass} data-tooltip={tip} tabIndex={0}>
          {label}
        </span>
      ) : (
        label
      )}
    </div>
  );
}

/**
 * @param {number} current
 * @param {number} total
 * @returns {(number | null)[]}
 */
function buildPaginationItems(current, total) {
  if (total <= 1) return [1];
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  }
  return out;
}

/** @param {number | null | undefined} pct */
function marginFinancialToneClass(pct) {
  if (pct == null || !Number.isFinite(pct)) return "products-catalog__cell--fin-none";
  if (pct < 0) return "products-catalog__cell--fin-loss";
  if (pct < 10) return "products-catalog__cell--fin-warn";
  return "products-catalog__cell--fin-healthy";
}

const HEALTH_BADGE_CLASS = {
  healthy: "products-catalog__health-badge--healthy",
  warn: "products-catalog__health-badge--warn",
  loss: "products-catalog__health-badge--loss",
  unknown: "products-catalog__health-badge--unknown",
};

/** Dados de demonstração — substituir por fetch quando a API existir. */
const MOCK_ADS_ROWS = [
  {
    id: "a1",
    adCount: 1,
    adTitle: "Furadeira 12V com bateria e maleta — entrega full",
    productName: "Furadeira Profissional 12V",
    marketplaceSlug: "mercadolivre",
    productCost: 189.9,
    price: 349.9,
    salesCount: 42,
    revenue: 14695.8,
    profit: 4120.5,
    marginPct: 28.0,
    statusKey: "active",
    statusLabel: "Ativo",
    healthBand: "healthy",
    healthLabel: "Saudável",
    healthPercent: 88,
    externalId: "MLB1234567890",
    visitCount: 1850,
    uiFlags: {},
  },
  {
    id: "a2",
    adCount: 1,
    adTitle: "Kit parafusadeira + 2 baterias — últimas unidades",
    productName: "Parafusadeira 18V Kit",
    marketplaceSlug: "mercadolivre",
    productCost: 312.0,
    price: 529.0,
    salesCount: 18,
    revenue: 9522.0,
    profit: 2106.0,
    marginPct: 7.5,
    statusKey: "active",
    statusLabel: "Ativo",
    healthBand: "warn",
    healthLabel: "Atenção",
    healthPercent: 62,
    externalId: "MLB9988776655",
    visitCount: 920,
    uiFlags: { needs_attention: true },
  },
  {
    id: "a3",
    adCount: 2,
    adTitle: "Luminária LED tubular 120cm industrial",
    productName: "Luminária LED 120cm",
    marketplaceSlug: "mercadolivre",
    productCost: 45.0,
    price: 89.9,
    salesCount: 120,
    revenue: 10788.0,
    profit: 5388.0,
    marginPct: 49.9,
    statusKey: "paused",
    statusLabel: "Pausado",
    healthBand: "unknown",
    healthLabel: "Sem histórico",
    healthPercent: null,
    externalId: "MLB4455667788",
    visitCount: 210,
    uiFlags: {},
  },
  {
    id: "a4",
    adCount: 1,
    adTitle: "Organizador modular 5 gavetas — frete grátis",
    productName: "Organizador modular",
    marketplaceSlug: "shopee",
    productCost: 78.5,
    price: 159.0,
    salesCount: 7,
    revenue: 1113.0,
    profit: -42.0,
    marginPct: -3.8,
    statusKey: "active",
    statusLabel: "Ativo",
    healthBand: "loss",
    healthLabel: "Crítico",
    healthPercent: 34,
    externalId: "SHP-882910",
    visitCount: 4100,
    uiFlags: { declining: true, needs_attention: true },
  },
  {
    id: "a5",
    adCount: 1,
    adTitle: "Caixa de ferramentas 40 peças com trava metálica",
    productName: "Kit ferramentas 40 peças",
    marketplaceSlug: "mercadolivre",
    productCost: 120.0,
    price: 199.9,
    salesCount: 55,
    revenue: 10994.5,
    profit: 2394.5,
    marginPct: 21.8,
    statusKey: "active",
    statusLabel: "Ativo",
    healthBand: "healthy",
    healthLabel: "Saudável",
    healthPercent: 91,
    externalId: "MLB3344556677",
    visitCount: 780,
    uiFlags: {},
  },
  {
    id: "a6",
    adCount: 1,
    adTitle: "Suporte articulado para TV 32–55 polegadas — novo",
    productName: "Suporte TV articulado",
    marketplaceSlug: "mercadolivre",
    productCost: 55.0,
    price: 119.9,
    salesCount: 0,
    revenue: 0,
    profit: 0,
    marginPct: 0,
    statusKey: "active",
    statusLabel: "Ativo",
    healthBand: "unknown",
    healthLabel: "Sem histórico",
    healthPercent: null,
    externalId: "MLB7788990011",
    visitCount: 120,
    uiFlags: {},
  },
];

function AdsCatalogRow({ row }) {
  const mktLabel = marketplaceChipLabel(row.marketplaceSlug);
  const finClass = marginFinancialToneClass(row.marginPct);
  const healthClass = HEALTH_BADGE_CLASS[row.healthBand] || HEALTH_BADGE_CLASS.unknown;

  return (
    <div className="anuncios-catalog__row" role="row">
      <div className="products-catalog__cell products-catalog__cell--num">{row.adCount}</div>
      <div className="products-catalog__cell anuncios-catalog__cell--title">
        <span className="anuncios-catalog__ad-title" title={row.adTitle}>
          {row.adTitle}
        </span>
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--product">
        <span className="anuncios-catalog__product-link" title={row.productName}>
          {row.productName}
        </span>
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--mkt">
        <span className="anuncios-catalog__mkt-chip" title={row.marketplaceSlug}>
          {mktLabel}
        </span>
      </div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatCatalogBRL(row.productCost)}</div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatCatalogBRL(row.price)}</div>
      <div className="products-catalog__cell products-catalog__cell--num">{row.salesCount}</div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatCatalogBRL(row.revenue)}</div>
      <div className={`products-catalog__cell products-catalog__cell--money products-catalog__cell--profit ${finClass}`}>
        {formatCatalogBRL(row.profit)}
      </div>
      <div className={`products-catalog__cell products-catalog__cell--pct products-catalog__cell--profit ${finClass}`}>
        {formatCatalogProfitPercentLabel(row.marginPct)}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--status">
        <span
          className={`anuncios-catalog__status-pill${row.statusKey === "paused" ? " anuncios-catalog__status-pill--paused" : ""}`}
        >
          {row.statusLabel}
        </span>
      </div>
      <div className="products-catalog__cell products-catalog__cell--health">
        <span className={`products-catalog__health-badge ${healthClass}`} data-health-band={row.healthBand}>
          {row.healthBand !== "unknown" ? <span className="products-catalog__health-badge-dot" aria-hidden /> : null}
          <span className="products-catalog__health-badge-text">
            {row.healthPercent != null ? `${row.healthLabel} · ${row.healthPercent}%` : row.healthLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function Anuncios() {
  const [adsFilterId, setAdsFilterId] = useState("all");
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsPage, setAdsPage] = useState(1);

  const filterChips = useMemo(() => getAdsFilterChipsForToolbar(), []);

  const rowsWithLabels = useMemo(
    () =>
      MOCK_ADS_ROWS.map((r) => ({
        ...r,
        marketplaceLabel: marketplaceChipLabel(r.marketplaceSlug),
      })),
    []
  );

  const searchFiltered = useMemo(
    () => filterAdsByCatalogSearch(rowsWithLabels, adsSearchQuery),
    [rowsWithLabels, adsSearchQuery]
  );

  const displayRows = useMemo(() => applyAdsCatalogFilter(searchFiltered, adsFilterId), [searchFiltered, adsFilterId]);

  const totalFiltered = displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ADS_PAGE_SIZE));

  useEffect(() => {
    setAdsPage(1);
  }, [adsFilterId, adsSearchQuery]);

  useEffect(() => {
    if (adsPage > totalPages) setAdsPage(totalPages);
  }, [adsPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (adsPage - 1) * ADS_PAGE_SIZE;
    return displayRows.slice(start, start + ADS_PAGE_SIZE);
  }, [displayRows, adsPage]);

  const paginationItems = useMemo(() => buildPaginationItems(adsPage, totalPages), [adsPage, totalPages]);
  const rangeStart = totalFiltered === 0 ? 0 : (adsPage - 1) * ADS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(adsPage * ADS_PAGE_SIZE, totalFiltered);

  return (
    <div className="anuncios-catalog">
      <h1 className="products-catalog__sr-title">Anúncios</h1>

      <section className="anuncios-catalog__kpis" aria-label="Resumo de anúncios">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Anúncios ativos</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value" aria-hidden>
              —
            </p>
            <p className="anuncios-catalog__kpi-hint">Total consolidado quando a integração estiver ativa.</p>
          </div>
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Faturamento dos anúncios</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value" aria-hidden>
              —
            </p>
            <p className="anuncios-catalog__kpi-hint">Soma de vendas por anúncio — dados em breve.</p>
          </div>
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          {[
            { key: "sales", label: "Vendas", variant: "sales" },
            { key: "profit", label: "Lucro", variant: "profit" },
            { key: "attention", label: "Precisam atenção", variant: "warn" },
            { key: "decline", label: "Em queda", variant: "decline" },
          ].map(({ key, label, variant }) => (
            <article
              key={key}
              className={`anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--${variant}`}
            >
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">{label}</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">—</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="products-catalog__controls">
        <div className="products-catalog__controls-top">
          <div className="products-catalog__search-wrap">
            <div className="products-catalog__search-field">
              <span className="products-catalog__search-icon" aria-hidden>
                <S7Icon name="search" size={18} strokeWidth={1.85} />
              </span>
              <S7Input
                label=""
                name="ads-catalog-search"
                value={adsSearchQuery}
                onChange={(e) => setAdsSearchQuery(e.target.value)}
                placeholder="Buscar por título do anúncio, produto ou marketplace"
                className="products-catalog__search-s7"
                inputClassName="products-catalog__search-input-field"
                autoComplete="off"
                aria-label="Buscar anúncios por título, produto ou marketplace"
                rightElement={
                  adsSearchQuery ? (
                    <button
                      type="button"
                      className="products-catalog__search-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setAdsSearchQuery("");
                      }}
                      aria-label="Limpar busca"
                    >
                      <S7Icon name="close" size={16} strokeWidth={2} />
                    </button>
                  ) : null
                }
              />
            </div>
          </div>
          <div className="products-catalog__controls-actions">
            <S7Button
              variant="primary"
              iconName="download"
              className="products-catalog__new-product-btn"
              disabled
              title="Em breve: sincronizar anúncios com os marketplaces."
            >
              Sincronizar anúncios
            </S7Button>
          </div>
        </div>
        <div className="products-catalog__controls-main">
          <div className="products-catalog__filter-row" role="toolbar" aria-label="Filtros rápidos de anúncios">
            {filterChips.map((def) => {
              const isActive = adsFilterId === def.id;
              return (
                <button
                  key={def.id}
                  type="button"
                  className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
                  aria-pressed={def.enabled ? isActive : undefined}
                  disabled={!def.enabled}
                  title={def.description}
                  onClick={() => {
                    if (!def.enabled) return;
                    setAdsFilterId(def.id);
                  }}
                >
                  <span
                    className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${def.iconTone}`}
                    aria-hidden
                  >
                    <S7Icon name={def.icon} size={15} strokeWidth={1.65} />
                  </span>
                  <span className="products-catalog__filter-chip-label">{def.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="products-catalog__filter-clear"
              disabled={adsFilterId === "all"}
              title="Remove filtros e volta à listagem padrão"
              onClick={() => setAdsFilterId("all")}
            >
              <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>
      </div>

      {displayRows.length === 0 ? (
        <div className="products-catalog__filter-empty-card" role="status">
          {(() => {
            const hasSearch = adsSearchQuery.trim().length > 0;
            let title = "Nenhum anúncio neste filtro";
            let description = "Ajuste os filtros ou limpe para ver a listagem completa.";
            if (hasSearch && searchFiltered.length === 0) {
              title = "Nenhum anúncio encontrado";
              description = "Nenhum item corresponde à busca. Tente outro termo ou limpe o campo.";
            } else if (hasSearch && searchFiltered.length > 0) {
              description = "Nenhum item corresponde à combinação de busca e filtros.";
            }
            return (
              <>
                <S7EmptyState title={title} description={description} />
                <button
                  type="button"
                  className="products-catalog__filter-empty-btn"
                  onClick={() => {
                    setAdsFilterId("all");
                    setAdsSearchQuery("");
                  }}
                >
                  Mostrar todos
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="products-catalog__table-block">
          <div className="products-catalog__table-card">
            <div className="products-catalog__table-hscroll">
              <div className="anuncios-catalog__grid anuncios-catalog__grid--head">
                <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.adCount}>
                  Nº de anúncios
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--title" tip={ADS_COLUMN_TOOLTIPS.adTitle}>
                  Anúncio
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--product" tip={ADS_COLUMN_TOOLTIPS.product}>
                  Produto
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--mkt" tip={ADS_COLUMN_TOOLTIPS.marketplace}>
                  Marketplace
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={ADS_COLUMN_TOOLTIPS.productCost}
                  tipWrap
                  lines={["Custo do", "produto"]}
                />
                <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.price}>
                  Preço
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.sales}>
                  Vendas
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={ADS_COLUMN_TOOLTIPS.revenue}
                  lines={["Fatura-", "mento"]}
                />
                <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.profit}>
                  Lucro
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--pct" tip={ADS_COLUMN_TOOLTIPS.marginPct}>
                  Margem %
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--status" tip={ADS_COLUMN_TOOLTIPS.status}>
                  Status
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--health" tip={ADS_COLUMN_TOOLTIPS.adHealth}>
                  Saúde do anúncio
                </AdsCatalogHeadCell>
              </div>

              <div className="products-catalog__body">
                {paginatedRows.map((row) => (
                  <AdsCatalogRow key={row.id} row={row} />
                ))}
              </div>
            </div>
          </div>

          <footer className="products-catalog__pagination" aria-label="Paginação de anúncios">
            <p className="products-catalog__pagination-meta">
              Mostrando <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> de <strong>{totalFiltered}</strong>{" "}
              {totalFiltered === 1 ? "anúncio" : "anúncios"}
            </p>
            {totalPages > 1 ? (
              <nav className="products-catalog__pagination-nav" aria-label="Páginas">
                <button
                  type="button"
                  className="products-catalog__pagination-btn"
                  disabled={adsPage <= 1}
                  onClick={() => setAdsPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="products-catalog__pagination-pages">
                  {paginationItems.map((item, idx) =>
                    item == null ? (
                      <span key={`e-${idx}`} className="products-catalog__pagination-ellipsis" aria-hidden>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`products-catalog__pagination-page${item === adsPage ? " products-catalog__pagination-page--current" : ""}`}
                        aria-current={item === adsPage ? "page" : undefined}
                        onClick={() => setAdsPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="products-catalog__pagination-btn products-catalog__pagination-btn--next"
                  disabled={adsPage >= totalPages}
                  onClick={() => setAdsPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próximo
                </button>
              </nav>
            ) : null}
          </footer>
        </div>
      )}
    </div>
  );
}
