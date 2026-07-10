// ======================================================================
// Página /concorrencia — Anúncios monitorados (Suse7)
// Cada linha = 1 anúncio escolhido pelo seller × concorrentes.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listMonitoredListings, removeMonitoredListing } from "../services/competitionApi";
import S7Button from "../components/ui/S7Button";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../components/ui/S7CopyButton";
import S7Icon from "../components/ui/S7Icon";
import S7Tooltip from "../components/ui/S7Tooltip";
import { useNotifications } from "../contexts/NotificationContext";
import S7EmptyState from "../components/ui/S7EmptyState";
import S7Pagination from "../components/ui/S7Pagination";
import { useProductMainImageSrc } from "../utils/productImageDisplayUrl";
import S7CatalogAccountCell, {
  pickCatalogAccountFields,
  S7CatalogChannelCell,
} from "../components/catalog/S7CatalogAccountCell.jsx";
import S7CatalogListingHeadline from "../components/catalog/S7CatalogListingHeadline.jsx";
import "../components/catalog/S7CatalogAccountCell.css";
import ConcorrenciaProdutoModal from "../components/concorrencia/ConcorrenciaProdutoModal";
import ConcorrenciaIncluirAnuncioModal from "../components/concorrencia/ConcorrenciaIncluirAnuncioModal";
import SkuInputModal from "../components/SkuInputModal";
import {
  countProductPendingSlots,
  enqueueCadastroConcorrente,
} from "../components/concorrencia/concorrenciaCompetitorSave";
import {
  mensagemToastCadastroConcorrente,
  notificarConcorrenciaAviso,
  notificarConcorrenciaSucesso,
} from "../components/concorrencia/concorrenciaToast";
import ConcorrenciaFiltersCard from "../features/concorrencia/filters/ConcorrenciaFiltersCard";
import { bindCatalogListHorizontalScroll } from "../features/listings/layout/catalogListHorizontalScroll.js";
import { CONCORRENCIA_FILTER_CHIPS } from "../features/concorrencia/filters/concorrenciaFilterChips.js";
import {
  S7_OPERATIONAL_DEFAULT_SORT_ID,
  sortOperationalCatalogRows,
  getConcorrenciaMonitoredRowSalesCount,
} from "../utils/s7OperationalListSort.js";
import ConcorrenciaGerarRelatorioModal from "../features/concorrencia/reports/ConcorrenciaGerarRelatorioModal.jsx";
import {
  buildConcorrenciaReportContext,
  canOfferConcorrenciaReport,
  rotuloContaConcorrenciaRelatorio,
} from "../features/concorrencia/reports/buildConcorrenciaReportContext.js";
import { buildConcorrenciaAggregatedReport } from "../features/concorrencia/reports/buildConcorrenciaAggregatedReport.js";
import { useConcorrenciaListSelection } from "../features/concorrencia/selection/useConcorrenciaListSelection.js";
import { pickConcorrenciaProductRowId } from "../features/concorrencia/selection/pickConcorrenciaProductRowId.js";
import VendasRowSelectCheckbox from "../features/vendas/selection/VendasRowSelectCheckbox.jsx";
import ConcorrenteDetalheModal from "../components/concorrencia/ConcorrenteDetalheModal";
import { fetchMercadoLivreMarketplaceAccounts } from "../services/marketplaceAccountsApi";
import { rotuloContaMercadoLivre } from "../features/concorrencia/filters/concorrenciaFiltersConstants";
import {
  displayCompetitorTitle,
  extrairIdAnuncioProprio,
  extrairContaAnuncioProprio,
  formatarIdAnuncioMlbParaCopia,
  formatPrice,
  formatSalesCountProprio,
  pickCompetitorThumbnail,
  logSalesFrontTrace,
  resolverLinkAnuncioProprio,
  isConcorrenteAnuncioAtivo,
  rotuloBadgeAnuncioInativo,
} from "../components/concorrencia/concorrenciaCompetitorDisplay";
import { montarComparativoConcorrentePreco } from "../components/pricing/competitivePriceCompare.js";
import "../components/Products.css";
import "../components/Anuncios.css";
import "./ConcorrenciaPage.css";
import CompetitionHealthCenter from "../features/dashboard/components/CompetitionHealthCenter.jsx";
import S7OperationalExecutiveBlock from "../components/dashboard/S7OperationalExecutiveBlock.jsx";

const CONCORRENCIA_PAGE_SIZE = 100;

/** Escala discreta da fonte do nome da conta para caber na coluna sem quebra. */
function tierRotuloConta(label) {
  const len = String(label ?? "").trim().length;
  if (len <= 11) return "short";
  if (len <= 15) return "medium";
  if (len <= 20) return "long";
  return "xlong";
}

function mapMonitoredRowToProduct(row) {
  return {
    id: row?.product_id ?? null,
    product_name: row?.product_name ?? null,
    sku: row?.sku ?? null,
    monitored_listing_id: row?.monitored_listing_id ?? null,
    marketplace_listing_id: row?.marketplace_listing_id ?? null,
    marketplace_account_id: row?.marketplace_account_id ?? null,
    account_label: row?.account_label ?? null,
    listing_thumbnail: row?.listing_thumbnail ?? null,
    product_image_links: [],
  };
}

function anuncioAtendeContaFiltro(row, accountId) {
  const selectedId = String(accountId ?? "").trim();
  if (!selectedId) return true;
  const rowAccountId =
    row?.marketplace_account_id != null ? String(row.marketplace_account_id).trim() : "";
  return rowAccountId === selectedId;
}

function produtoAtendeMarketplaceFiltro(ownListing, marketplaceId) {
  const mkp = String(marketplaceId ?? "").trim();
  if (!mkp) return true;
  if (mkp === "mercado_livre") {
    return Boolean(extrairIdAnuncioProprio(ownListing));
  }
  return false;
}

function normalizeSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const COMPETITOR_COLUMNS = 6;

const MARKETPLACE_CHANNELS = {
  mercado_livre: { id: "mercado_livre", label: "Mercado Livre" },
  mercadolivre: { id: "mercado_livre", label: "Mercado Livre" },
  shopee: { id: "shopee", label: "Shopee" },
  amazon: { id: "amazon", label: "Amazon" },
  shein: { id: "shein", label: "Shein" },
};

function getMarketplaceChannelDisplay(channelId) {
  const key = String(channelId ?? "").trim().toLowerCase();
  return MARKETPLACE_CHANNELS[key] ?? { id: key || "mercado_livre", label: "Mercado Livre" };
}

function CompetitorCompactCell({ competitor, indiceColuna, precoNosso, onOpenDetail }) {
  if (!competitor) {
    return (
      <span className="concorrencia-catalog__comp-empty" aria-hidden>
        —
      </span>
    );
  }

  const title = displayCompetitorTitle(competitor.competitor_title || competitor.competitor_store_name);
  const thumbUrl = pickCompetitorThumbnail(competitor);
  const moeda = competitor.last_seen_currency ?? "BRL";
  const priceTxt = formatPrice(competitor.last_seen_price, moeda);
  const anuncioInativo = !isConcorrenteAnuncioAtivo(competitor);
  const badgeInativo = rotuloBadgeAnuncioInativo(competitor);
  const comparativo = anuncioInativo
    ? null
    : montarComparativoConcorrentePreco(precoNosso, competitor.last_seen_price, moeda, {
        classePrefixo: "concorrencia-catalog__comp-compare",
      });

  return (
    <button
      type="button"
      className={[
        "concorrencia-catalog__comp",
        "concorrencia-catalog__comp--btn",
        anuncioInativo ? "concorrencia-catalog__comp--inativo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        onOpenDetail(competitor, indiceColuna);
      }}
    >
      <div className="concorrencia-catalog__comp-main">
        <div className="concorrencia-catalog__comp-head">
          {thumbUrl ? (
            <span
              className="concorrencia-catalog__comp-thumb s7-operational-thumb-frame s7-operational-thumb-frame--circle"
              aria-hidden
            >
              <img
                className="s7-operational-thumb"
                src={thumbUrl}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </span>
          ) : (
            <span className="concorrencia-catalog__comp-thumb-slot" aria-hidden />
          )}
          <S7Tooltip
            content={title}
            placement="top-start"
            offset={6}
            wrap
            className="concorrencia-catalog__comp-name-tip"
          >
            <span className="concorrencia-catalog__comp-name">{title}</span>
          </S7Tooltip>
        </div>
        <span className="concorrencia-catalog__comp-metrics">
          <span className="concorrencia-catalog__comp-price">{priceTxt}</span>
          {badgeInativo ? (
            <span className="concorrencia-catalog__comp-badge-inativo">{badgeInativo}</span>
          ) : comparativo?.texto ? (
            <span className="concorrencia-catalog__comp-compare-line">
              <span
                className={["concorrencia-catalog__comp-compare-arrow", comparativo.classe]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden
              >
                {comparativo.seta}
              </span>
              <span
                className={["concorrencia-catalog__comp-compare", comparativo.classe]
                  .filter(Boolean)
                  .join(" ")}
              >
                {comparativo.texto}
              </span>
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function ConcorrenciaCatalogRow({
  product,
  competitors,
  ownListing,
  accountLabel,
  marketplaceAccountId,
  accountLogoUrl,
  listingThumbnail,
  onManage,
  onOpenCompetitorDetail,
  rowSelected = false,
  onToggleSelect,
  onRequestRemoveMonitored,
  removingMonitored = false,
  onRequestLinkSku,
  linkingSku = false,
}) {
  const id = product?.monitored_listing_id ?? product?.id;
  const name = String(product?.product_name || "Sem nome").trim() || "Sem nome";
  const sku = String(product?.sku || "").trim();
  const productImgUrl = useProductMainImageSrc(product);
  const imgUrl = listingThumbnail || productImgUrl;
  const mlbCopiar = formatarIdAnuncioMlbParaCopia(extrairIdAnuncioProprio(ownListing));
  const precoProprio = ownListing?.price ?? null;
  const moedaPropria = ownListing?.currency ?? "BRL";
  const precoProprioTxt = formatPrice(precoProprio, moedaPropria);
  const vendasProprias = ownListing?.sales ?? null;
  const vendasPropriasNumero = (() => {
    const n = Number(vendasProprias);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
  })();
  const vendasPropriasTxt = formatSalesCountProprio(vendasProprias);
  const exibirMetaProprio = precoProprioTxt !== "—" || ownListing != null;
  const productAdHref = resolverLinkAnuncioProprio(ownListing);
  const listingInternalId = String(
    product?.marketplace_listing_id ?? ownListing?.marketplace_listing_id ?? ownListing?.id ?? ""
  ).trim();
  const podeVincularSku = !sku && Boolean(listingInternalId) && typeof onRequestLinkSku === "function";

  return (
    <div className="concorrencia-catalog__row" data-monitored-listing-id={id ?? ""}>
      <div className="products-catalog__cell products-catalog__cell--select">
        <VendasRowSelectCheckbox
          checked={rowSelected}
          ariaLabel={`Selecionar ${name}`}
          onChange={() => onToggleSelect?.(id)}
        />
      </div>
      <div className="products-catalog__cell products-catalog__cell--thumb">
        {imgUrl ? (
          <span
            className="concorrencia-catalog__thumb s7-operational-thumb-frame s7-operational-thumb-frame--circle"
            aria-hidden
          >
            <img
              className="s7-operational-thumb"
              src={imgUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </span>
        ) : (
          <span className="concorrencia-catalog__thumb-slot" aria-hidden />
        )}
      </div>

      <div className="products-catalog__cell products-catalog__cell--product">
        <S7CatalogListingHeadline
          layout="stacked"
          className="concorrencia-catalog__listing-headline"
          title={name}
          titleHref={productAdHref}
          titleTooltip={name}
          listingId={mlbCopiar || ""}
          listingIdCopyValue={mlbCopiar || ""}
          sku={sku}
          stopTitlePropagation
          copyListingFlashKey={`concorrencia-mlb-${id}-${mlbCopiar}`}
          copySkuFlashKey={`concorrencia-sku-${id}`}
          skuEntityType="product"
          footer={
            exibirMetaProprio ? (
              <p className="concorrencia-catalog__own-meta">
                {precoProprioTxt !== "—" ? (
                  <span className="concorrencia-catalog__own-price">{precoProprioTxt}</span>
                ) : null}
                {precoProprioTxt !== "—" ? (
                  <span className="concorrencia-catalog__own-meta-sep" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span
                  className={[
                    "concorrencia-catalog__own-sales",
                    vendasPropriasNumero === 0 ? "concorrencia-catalog__own-sales--zero" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {vendasPropriasTxt}
                </span>
              </p>
            ) : null
          }
          actions={
            podeVincularSku ? (
              <div
                role="presentation"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <S7Button
                  type="button"
                  variant="warning"
                  size="sm"
                  className="anuncios-ad-line-action-btn concorrencia-catalog__link-sku-btn"
                  disabled={linkingSku}
                  onClick={() => onRequestLinkSku?.(product, ownListing, name)}
                >
                  Vincular SKU
                </S7Button>
              </div>
            ) : null
          }
        />
      </div>

      <div
        className="concorrencia-catalog__cell concorrencia-catalog__cell--account"
        data-account-fit={accountLabel ? tierRotuloConta(accountLabel) : "short"}
      >
        <S7CatalogAccountCell
          compact
          variant="inline"
          marketplaceAccountId={marketplaceAccountId}
          accountAlias={accountLabel}
          accountLogoUrl={accountLogoUrl}
        />
      </div>

      <div className="concorrencia-catalog__cell concorrencia-catalog__cell--channel">
        {(() => {
          const channel = getMarketplaceChannelDisplay("mercado_livre");
          return (
            <S7CatalogChannelCell marketplace={channel.id} marketplaceLabel={channel.label} />
          );
        })()}
      </div>

      {Array.from({ length: COMPETITOR_COLUMNS }).map((_, idx) => {
        const c = competitors[idx] ?? null;
        return (
          <div key={`comp-${idx}`} className="concorrencia-catalog__cell concorrencia-catalog__cell--competitor">
            <CompetitorCompactCell
              competitor={c}
              indiceColuna={idx + 1}
              precoNosso={precoProprio}
              onOpenDetail={onOpenCompetitorDetail}
            />
          </div>
        );
      })}

      <div className="concorrencia-catalog__cell concorrencia-catalog__cell--action">
        <S7Tooltip content="Excluir anúncio monitorado" placement="top-start" offset={6}>
          <button
            type="button"
            className="concorrencia-catalog__remove-btn concorrencia-catalog__remove-btn--icon"
            aria-label={`Excluir anúncio monitorado ${name}`}
            onClick={() => onRequestRemoveMonitored?.(product)}
            disabled={removingMonitored}
          >
            <S7Icon name="trash" size={14} strokeWidth={1.9} />
          </button>
        </S7Tooltip>
        <S7Tooltip content="Gerenciar concorrentes" placement="top-start" offset={6}>
          <button
            type="button"
            className="concorrencia-catalog__manage-btn concorrencia-catalog__manage-btn--icon"
            aria-label={`Gerenciar concorrentes de ${name}`}
            onClick={() => onManage(product)}
          >
            <S7Icon name="monitoring" size={16} strokeWidth={1.85} />
          </button>
        </S7Tooltip>
      </div>
    </div>
  );
}

export default function ConcorrenciaPage() {
  const [monitoredListings, setMonitoredListings] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterId, setFilterId] = useState("all");
  const [listSortId, setListSortId] = useState(S7_OPERATIONAL_DEFAULT_SORT_ID);
  const [accountFilterId, setAccountFilterId] = useState("");
  const [marketplaceFilterId, setMarketplaceFilterId] = useState("");
  const [mlAccounts, setMlAccounts] = useState([]);
  const [mlAccountsReady, setMlAccountsReady] = useState(false);
  const [page, setPage] = useState(1);
  const [manageProduct, setManageProduct] = useState(null);
  const [removeMonitoredTarget, setRemoveMonitoredTarget] = useState(null);
  const [removingMonitoredId, setRemovingMonitoredId] = useState(null);
  const [removeMonitoredCode, setRemoveMonitoredCode] = useState("");
  const [removeMonitoredCodeInput, setRemoveMonitoredCodeInput] = useState("");
  const [detailState, setDetailState] = useState(null);
  const [incluirModalOpen, setIncluirModalOpen] = useState(false);
  const [skuModalListing, setSkuModalListing] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalMode, setReportModalMode] = useState(/** @type {"filters" | "selected"} */ ("filters"));

  const [competitionByMonitored, setCompetitionByMonitored] = useState({});
  const manageProductRef = useRef(null);
  const concorrenciaExecutiveRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const concorrenciaFiltersRef = useRef(/** @type {HTMLElement | null} */ (null));
  const selectAllPageRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const catalogTableBlockRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const { addNotification } = useNotifications();

  useEffect(() => {
    manageProductRef.current = manageProduct;
  }, [manageProduct]);

  const loadCompetition = useCallback(async () => {
    const res = await listMonitoredListings();
    if (!res.ok) return;
    const rows = res.monitoredListings || [];
    setMonitoredListings(rows);
    const map = {};
    for (const row of rows) {
      map[String(row.monitored_listing_id)] = {
        count: row.competitors_count ?? (row.competitors?.length ?? 0),
        competitors: Array.isArray(row.competitors) ? row.competitors : [],
        ownListing: row.own_listing ?? null,
        accountLabel: row.account_label ?? null,
        accountLogoUrl: row.account_logo_url ?? null,
        listingThumbnail: row.listing_thumbnail ?? null,
      };
    }
    setCompetitionByMonitored(map);
    for (const row of rows) {
      for (const c of (row.competitors || []).slice(0, 6)) {
        logSalesFrontTrace("lista_principal_load", c, { monitored_listing_id: row.monitored_listing_id });
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      await loadCompetition();
      if (!cancelled) setListLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCompetition]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsReady(true);
      const list =
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getCompetitorCount = useCallback(
    (monitoredListingId) => competitionByMonitored[String(monitoredListingId)]?.count ?? 0,
    [competitionByMonitored]
  );

  const displayRows = useMemo(
    () => monitoredListings.map((row) => ({ ...row, product: mapMonitoredRowToProduct(row) })),
    [monitoredListings]
  );

  const getCompetitors = (row) =>
    competitionByMonitored[String(row?.monitored_listing_id)]?.competitors ?? row?.competitors ?? [];
  const getOwnListing = (row) =>
    competitionByMonitored[String(row?.monitored_listing_id)]?.ownListing ?? row?.own_listing ?? null;
  const getAccountLabel = useCallback(
    (row) => {
      const monitoredId = String(row?.monitored_listing_id ?? "");
      const fromMap = competitionByMonitored[monitoredId]?.accountLabel;
      if (fromMap) return fromMap;
      if (row?.account_label) return String(row.account_label).trim();

      const accountId =
        row?.marketplace_account_id != null ? String(row.marketplace_account_id).trim() : "";
      if (accountId && mlAccounts.length) {
        const account = mlAccounts.find((a) => String(a?.id ?? "").trim() === accountId);
        if (account) return rotuloContaMercadoLivre(account);
      }

      const ownListing =
        competitionByMonitored[monitoredId]?.ownListing ?? row?.own_listing ?? null;
      return extrairContaAnuncioProprio(ownListing) || null;
    },
    [competitionByMonitored, mlAccounts]
  );
  const getAccountLogoUrl = useCallback(
    (row) => {
      const monitoredId = String(row?.monitored_listing_id ?? "");
      const fromMap = competitionByMonitored[monitoredId]?.accountLogoUrl;
      const accountId =
        row?.marketplace_account_id != null ? String(row.marketplace_account_id).trim() : "";
      let mlAccountLogo = null;
      if (accountId && mlAccounts.length) {
        const account = mlAccounts.find((a) => String(a?.id ?? "").trim() === accountId);
        mlAccountLogo =
          account?.account_logo_url ??
          account?.logo_url ??
          account?.avatar_url ??
          account?.company_logo_url ??
          account?.ml_picture_url ??
          null;
      }
      return pickCatalogAccountFields({
        ...row,
        account_alias: row?.account_label ?? row?.account_alias ?? null,
        account_logo_url: fromMap ?? row?.account_logo_url ?? mlAccountLogo ?? null,
      }).accountLogoUrl;
    },
    [competitionByMonitored, mlAccounts]
  );

  const getMarketplaceAccountId = useCallback(
    (row) => {
      const monitoredId = String(row?.monitored_listing_id ?? "");
      const fromOwn = competitionByMonitored[monitoredId]?.ownListing?.marketplace_account_id;
      if (fromOwn != null && String(fromOwn).trim() !== "") return String(fromOwn).trim();
      if (row?.marketplace_account_id != null && String(row.marketplace_account_id).trim() !== "") {
        return String(row.marketplace_account_id).trim();
      }
      return null;
    },
    [competitionByMonitored]
  );

  const getListingThumbnail = (row) =>
    competitionByMonitored[String(row?.monitored_listing_id)]?.listingThumbnail ?? row?.listing_thumbnail ?? null;

  const searchFiltered = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return displayRows;
    return displayRows.filter((row) => {
      const name = normalizeSearch(row.product_name);
      const sku = normalizeSearch(row.sku);
      const listingId = normalizeSearch(row.external_listing_id);
      return name.includes(q) || sku.includes(q) || listingId.includes(q);
    });
  }, [displayRows, searchQuery]);

  const contextFiltered = useMemo(() => {
    return searchFiltered.filter((row) => {
      if (!anuncioAtendeContaFiltro(row, accountFilterId)) return false;
      if (!produtoAtendeMarketplaceFiltro(getOwnListing(row), marketplaceFilterId)) return false;
      return true;
    });
  }, [searchFiltered, accountFilterId, marketplaceFilterId, getOwnListing]);

  const filteredRows = useMemo(() => {
    const chip = CONCORRENCIA_FILTER_CHIPS.find((c) => c.id === filterId);
    const base =
      !chip || chip.id === "all"
        ? contextFiltered
        : contextFiltered.filter((row) => {
            const competitors = getCompetitors(row);
            const count = getCompetitorCount(row?.monitored_listing_id);
            if (typeof chip.matchProduct === "function") {
              return chip.matchProduct({ product: row.product, competitors, count });
            }
            return chip.match(count);
          });

    return sortOperationalCatalogRows(base, listSortId, (row) =>
      getConcorrenciaMonitoredRowSalesCount(row, getOwnListing),
    );
  }, [contextFiltered, filterId, listSortId, getCompetitorCount, getCompetitors, getOwnListing]);

  const hasActiveFilters =
    filterId !== "all" ||
    Boolean(String(searchQuery ?? "").trim()) ||
    Boolean(String(accountFilterId ?? "").trim()) ||
    Boolean(String(marketplaceFilterId ?? "").trim());

  const limparFiltros = useCallback(() => {
    setFilterId("all");
    setSearchQuery("");
    setAccountFilterId("");
    setMarketplaceFilterId("");
    setListSortId(S7_OPERATIONAL_DEFAULT_SORT_ID);
  }, []);

  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / CONCORRENCIA_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filterId, listSortId, searchQuery, accountFilterId, marketplaceFilterId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * CONCORRENCIA_PAGE_SIZE;
    return filteredRows.slice(start, start + CONCORRENCIA_PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    const pageContent = catalogTableBlockRef.current?.closest(".page-content");
    if (!pageContent || !catalogTableBlockRef.current) {
      return undefined;
    }
    return bindCatalogListHorizontalScroll(pageContent, catalogTableBlockRef.current);
  }, [filteredRows.length, listLoading, page]);

  const listSelection = useConcorrenciaListSelection(paginatedRows, filteredRows);
  const {
    selectedCount,
    selectedProducts,
    isSelected,
    toggle: toggleRowSelection,
    toggleAllOnPage,
    allPageSelected,
    somePageSelected,
  } = listSelection;

  useEffect(() => {
    const el = selectAllPageRef.current;
    if (el) el.indeterminate = somePageSelected;
  }, [somePageSelected]);

  const getCompetitorsForProduct = useCallback(
    (product) => {
      const monitoredId = product?.monitored_listing_id;
      if (monitoredId != null) {
        return competitionByMonitored[String(monitoredId)]?.competitors ?? [];
      }
      return [];
    },
    [competitionByMonitored]
  );

  const getOwnListingForProduct = useCallback(
    (product) => {
      const monitoredId = product?.monitored_listing_id;
      if (monitoredId != null) {
        return competitionByMonitored[String(monitoredId)]?.ownListing ?? null;
      }
      return null;
    },
    [competitionByMonitored]
  );

  const reportScopeProducts = useMemo(() => {
    if (reportModalMode === "selected") {
      return selectedProducts.map((row) => row.product ?? mapMonitoredRowToProduct(row));
    }
    return filteredRows.map((row) => row.product);
  }, [filteredRows, reportModalMode, selectedProducts]);

  const selectedReportAccountLabel = useMemo(() => {
    if (reportModalMode !== "selected" || selectedProducts.length === 0) return "—";
    const labels = new Set();
    for (const row of selectedProducts) {
      const label = getAccountLabel(row);
      if (label) labels.add(String(label).trim());
    }
    if (labels.size === 0) return "—";
    if (labels.size === 1) return [...labels][0];
    return `${labels.size} contas`;
  }, [getAccountLabel, reportModalMode, selectedProducts]);

  const reportContext = useMemo(
    () =>
      buildConcorrenciaReportContext({
        accountId: accountFilterId,
        accountLabel: rotuloContaConcorrenciaRelatorio(accountFilterId, mlAccounts),
        listFilterId: filterId,
        searchQuery,
        scopeProductsCount: reportScopeProducts.length,
        pageRows: paginatedRows,
        selectedProductIds: selectedProducts
          .map((row) => pickConcorrenciaProductRowId(row))
          .filter(Boolean),
        reportScope: reportModalMode,
        selectedProducts,
        selectedAccountLabel: selectedReportAccountLabel,
      }),
    [
      accountFilterId,
      filterId,
      mlAccounts,
      paginatedRows,
      reportModalMode,
      reportScopeProducts.length,
      searchQuery,
      selectedProducts,
      selectedReportAccountLabel,
    ]
  );

  const aggregatedReport = useMemo(
    () =>
      buildConcorrenciaAggregatedReport(reportContext, {
        products: reportScopeProducts,
        getCompetitors: getCompetitorsForProduct,
        getOwnListing: getOwnListingForProduct,
      }),
    [getCompetitorsForProduct, getOwnListingForProduct, reportContext, reportScopeProducts]
  );

  const canShowRelatorios = canOfferConcorrenciaReport(filteredRows.length);
  const relatoriosDisabled = listLoading || !canShowRelatorios;

  const openReportModal = useCallback(() => {
    setReportModalMode(selectedCount > 0 ? "selected" : "filters");
    setReportModalOpen(true);
  }, [selectedCount]);

  const handleOpenCompetitorDetail = (row, competitor, numeroConcorrente) => {
    if (!competitor) return;
    setDetailState({ product: row.product, competitor, numeroConcorrente });
  };

  const handleRequestLinkSku = useCallback((product, ownListing, fallbackTitle = "") => {
    const listingId = String(
      product?.marketplace_listing_id ??
        ownListing?.marketplace_listing_id ??
        ownListing?.id ??
        ""
    ).trim();
    if (!listingId) {
      notificarConcorrenciaAviso(
        addNotification,
        "Não foi possível abrir vínculo de SKU",
        "ID interno do anúncio indisponível para este item."
      );
      return;
    }
    const listingTitle = String(
      ownListing?.title ||
        ownListing?.listing_title ||
        ownListing?.name ||
        product?.product_name ||
        fallbackTitle ||
        ""
    ).trim();
    setSkuModalListing({
      listingId,
      listingTitle,
      knownSku: product?.sku != null && String(product.sku).trim() !== "" ? String(product.sku).trim() : null,
      monitoredListingId:
        product?.monitored_listing_id != null ? String(product.monitored_listing_id).trim() : null,
    });
  }, [addNotification]);

  const handleSkuModalClose = useCallback(() => {
    setSkuModalListing(null);
  }, []);

  const handleSkuSaved = useCallback(async () => {
    await loadCompetition();
  }, [loadCompetition]);

  const handleRequestRemoveMonitored = useCallback(
    (product) => {
      if (!product?.monitored_listing_id || removingMonitoredId) return;
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setRemoveMonitoredCode(code);
      setRemoveMonitoredCodeInput("");
      setRemoveMonitoredTarget(product);
    },
    [removingMonitoredId]
  );

  const handleCancelRemoveMonitored = useCallback(() => {
    if (removingMonitoredId) return;
    setRemoveMonitoredTarget(null);
    setRemoveMonitoredCode("");
    setRemoveMonitoredCodeInput("");
  }, [removingMonitoredId]);

  const handleConfirmRemoveMonitored = useCallback(async () => {
    const monitoredListingId = removeMonitoredTarget?.monitored_listing_id;
    if (!monitoredListingId || removingMonitoredId) return;

    setRemovingMonitoredId(monitoredListingId);
    const res = await removeMonitoredListing(monitoredListingId);
    setRemovingMonitoredId(null);
    setRemoveMonitoredTarget(null);
    setRemoveMonitoredCode("");
    setRemoveMonitoredCodeInput("");

    if (res.ok) {
      if (String(manageProductRef.current?.monitored_listing_id ?? "") === String(monitoredListingId)) {
        setManageProduct(null);
      }
      if (String(detailState?.product?.monitored_listing_id ?? "") === String(monitoredListingId)) {
        setDetailState(null);
      }
      await loadCompetition();
      notificarConcorrenciaSucesso(addNotification, "Anúncio removido do monitoramento.");
      return;
    }

    notificarConcorrenciaAviso(
      addNotification,
      "Não foi possível excluir o anúncio monitorado",
      res.error || "Tente novamente."
    );
  }, [addNotification, detailState, loadCompetition, removeMonitoredTarget, removingMonitoredId]);

  const removeMonitoredCodeTyped = String(removeMonitoredCodeInput || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  const canConfirmRemoveMonitored =
    Boolean(removeMonitoredTarget?.monitored_listing_id) &&
    !removingMonitoredId &&
    removeMonitoredCodeTyped.length === 4 &&
    removeMonitoredCodeTyped === removeMonitoredCode;

  /** Enfileira cadastro — processa em segundo plano (modal pode fechar). */
  const handleSaveCompetitor = useCallback(
    ({ product, candidate, linkUrl = null }) => {
      const monitoredListingId = product?.monitored_listing_id;
      const productId = product?.id;
      const registered = competitionByMonitored[String(monitoredListingId)]?.count ?? 0;
      const pending = countProductPendingSlots(monitoredListingId || productId);

      if (registered + pending >= 6) {
        return {
          ok: false,
          code: "LIMIT_REACHED",
          error: "Limite de 6 concorrentes atingido.",
        };
      }

      return enqueueCadastroConcorrente({
        product,
        monitoredListingId,
        candidate,
        linkUrl,
        onComplete: async (res) => {
          if (res.ok) {
            await loadCompetition();
            notificarConcorrenciaSucesso(addNotification, mensagemToastCadastroConcorrente(res));
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("s7:concorrencia:competitors-saved", {
                  detail: {
                    productId,
                    monitoredListingId,
                    listingId: candidate?.competitor_listing_id ?? null,
                  },
                })
              );
            }
          } else if (res.code === "ACTIVE_LIMIT_REACHED") {
            notificarConcorrenciaAviso(addNotification, "Limite de 6 concorrentes atingido.");
            await loadCompetition();
          } else {
            notificarConcorrenciaAviso(
              addNotification,
              "Não foi possível cadastrar",
              res.error || "Tente novamente."
            );
          }
        },
      });
    },
    [addNotification, competitionByMonitored, loadCompetition]
  );

  return (
    <div className="products-catalog concorrencia-catalog">
      <h1 className="products-catalog__sr-title">Concorrência — anúncios monitorados</h1>

      <S7OperationalExecutiveBlock ref={concorrenciaExecutiveRef}>
        <CompetitionHealthCenter
          className="dashboard-page__competition-health"
          sectionJumpDownTargetRef={concorrenciaFiltersRef}
          sectionJumpDownAriaLabel="Ir para busca e filtros"
        />
      </S7OperationalExecutiveBlock>

      <div ref={catalogTableBlockRef} className="products-catalog__table-block">
        <div className="products-catalog__list-sticky-chrome" aria-label="Busca, filtros e cabeçalho da lista">
          <div className="products-catalog__sticky-top-spacer" aria-hidden="true" />

          <ConcorrenciaFiltersCard
            ref={concorrenciaFiltersRef}
            accounts={mlAccounts}
            accountsReady={mlAccountsReady}
            accountId={accountFilterId}
            onAccountIdChange={setAccountFilterId}
            marketplaceId={marketplaceFilterId}
            onMarketplaceIdChange={setMarketplaceFilterId}
            filterChips={CONCORRENCIA_FILTER_CHIPS}
            listFilter={filterId}
            onListFilterChange={setFilterId}
            listSortId={listSortId}
            onListSortChange={setListSortId}
            searchInput={searchQuery}
            onSearchInputChange={setSearchQuery}
            hasActiveFilters={hasActiveFilters}
            onClearAll={limparFiltros}
            showRelatorios={canShowRelatorios}
            relatoriosDisabled={relatoriosDisabled}
            onRelatoriosClick={openReportModal}
            onIncluirAnuncioClick={listLoading ? undefined : () => setIncluirModalOpen(true)}
            selectedCount={selectedCount}
            sectionJumpUpTargetRef={concorrenciaExecutiveRef}
            sectionJumpUpAriaLabel="Voltar para a Central de Saúde da Concorrência"
          />

          <div className="products-catalog__list-header-slot">
            <div className="products-catalog__table-hscroll products-catalog__table-hscroll--head">
              <div className="concorrencia-catalog__grid concorrencia-catalog__grid--head">
                <div className="products-catalog__cell products-catalog__cell--select">
                  <label
                    className="vendas-page__row-select vendas-page__row-select--head"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={selectAllPageRef}
                      type="checkbox"
                      className="anuncios-catalog__select-checkbox vendas-page__row-select-checkbox"
                      checked={allPageSelected}
                      disabled={paginatedRows.length === 0}
                      aria-label="Selecionar todos os anúncios da página"
                      onChange={toggleAllOnPage}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </div>
                <div className="products-catalog__cell products-catalog__cell--thumb" aria-hidden />
                <div className="concorrencia-catalog__col-head concorrencia-catalog__col-head--product">Anúncio</div>
                <div className="concorrencia-catalog__col-head concorrencia-catalog__col-head--account">Conta</div>
                <div className="concorrencia-catalog__col-head concorrencia-catalog__col-head--channel">Canal</div>
                {Array.from({ length: COMPETITOR_COLUMNS }).map((_, idx) => (
                  <div
                    key={`comp-head-${idx}`}
                    className="concorrencia-catalog__col-head concorrencia-catalog__col-head--competitor"
                    title={`Concorrente ${idx + 1}`}
                  >
                    Conc. {idx + 1}
                  </div>
                ))}
                <div className="concorrencia-catalog__col-head concorrencia-catalog__col-head--action">
                  <span className="products-catalog__sr-only">Ações</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="products-catalog__list-operational">
          {listLoading ? (
            <p className="products-catalog__loading">Carregando anúncios monitorados...</p>
          ) : monitoredListings.length === 0 ? (
            <div className="products-catalog__empty-card">
              <S7EmptyState
                title="Você ainda não possui anúncios monitorados."
                description="Escolha exatamente quais anúncios deseja acompanhar na concorrência."
                action={
                  <S7Button type="button" variant="primary" onClick={() => setIncluirModalOpen(true)}>
                    Incluir anúncio para monitoramento
                  </S7Button>
                }
              />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="products-catalog__filter-empty-card" role="status">
              <S7EmptyState
                title="Nenhum anúncio encontrado"
                description="Nenhum item corresponde à busca e aos filtros atuais. Ajuste os filtros ou limpe o campo."
              />
              <button
                type="button"
                className="products-catalog__filter-empty-btn"
                onClick={limparFiltros}
              >
                Mostrar todos
              </button>
            </div>
          ) : (
            <div className="products-catalog__table-card products-catalog__table-card--scroll-viewport">
              <div className="products-catalog__table-hscroll products-catalog__table-hscroll--body">
                <div className="concorrencia-catalog__body">
                  {paginatedRows.map((row) => (
                    <ConcorrenciaCatalogRow
                      key={row.monitored_listing_id}
                      product={row.product}
                      competitors={getCompetitors(row)}
                      ownListing={getOwnListing(row)}
                      accountLabel={getAccountLabel(row)}
                      marketplaceAccountId={getMarketplaceAccountId(row)}
                      accountLogoUrl={getAccountLogoUrl(row)}
                      listingThumbnail={getListingThumbnail(row)}
                      onManage={setManageProduct}
                      rowSelected={isSelected(pickConcorrenciaProductRowId(row))}
                      onToggleSelect={toggleRowSelection}
                      onRequestRemoveMonitored={handleRequestRemoveMonitored}
                      removingMonitored={
                        String(removingMonitoredId ?? "") === String(row.product?.monitored_listing_id ?? "")
                      }
                      onRequestLinkSku={handleRequestLinkSku}
                      linkingSku={
                        String(skuModalListing?.monitoredListingId ?? "") ===
                        String(row.product?.monitored_listing_id ?? "")
                      }
                      onOpenCompetitorDetail={(competitor, numeroConcorrente) =>
                        handleOpenCompetitorDetail(row, competitor, numeroConcorrente)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredRows.length > 0 ? (
          <S7Pagination
            page={page}
            totalPages={totalPages}
            total={totalFiltered}
            noun="anúncios"
            ariaLabel="Paginação do catálogo"
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        ) : null}
      </div>

      <ConcorrenciaIncluirAnuncioModal
        open={incluirModalOpen}
        onClose={() => setIncluirModalOpen(false)}
        onIncluded={loadCompetition}
      />

      <SkuInputModal
        open={Boolean(skuModalListing?.listingId)}
        listingId={skuModalListing?.listingId ?? null}
        listingTitle={skuModalListing?.listingTitle ?? ""}
        knownSku={skuModalListing?.knownSku ?? null}
        requireExistingProductConfirm
        onClose={handleSkuModalClose}
        onSaved={handleSkuSaved}
      />

      <ConcorrenciaProdutoModal
        open={manageProduct != null}
        product={manageProduct}
        monitoredListingId={manageProduct?.monitored_listing_id ?? null}
        ownListing={
          manageProduct?.monitored_listing_id
            ? competitionByMonitored[String(manageProduct.monitored_listing_id)]?.ownListing ?? null
            : null
        }
        onClose={() => setManageProduct(null)}
        onChanged={loadCompetition}
        onSaveCompetitor={handleSaveCompetitor}
      />

      <ConcorrenteDetalheModal
        open={detailState != null}
        competitor={detailState?.competitor ?? null}
        numeroConcorrente={detailState?.numeroConcorrente ?? null}
        precoNosso={
          detailState?.product?.monitored_listing_id
            ? (competitionByMonitored[String(detailState.product.monitored_listing_id)]?.ownListing?.price ?? null)
            : null
        }
        onClose={() => setDetailState(null)}
      />

      <ConcorrenciaGerarRelatorioModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportContext={reportContext}
        aggregatedReport={aggregatedReport}
      />

      {removeMonitoredTarget ? (
        <div
          className="concorrencia-catalog__confirm-backdrop"
          role="presentation"
          onMouseDown={handleCancelRemoveMonitored}
        >
          <div
            className="concorrencia-produto-modal__confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="concorrencia-remove-monitored-title"
            aria-describedby="concorrencia-remove-monitored-desc"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 id="concorrencia-remove-monitored-title" className="concorrencia-produto-modal__confirm-title">
              Excluir anúncio monitorado?
            </h3>
            <p id="concorrencia-remove-monitored-desc" className="concorrencia-produto-modal__confirm-text">
              Deseja realmente excluir este anúncio do monitoramento da Concorrência?
            </p>
            <div className="concorrencia-catalog__confirm-code-block">
              <p className="concorrencia-catalog__confirm-code-text">
                Digite o código de confirmação para habilitar a exclusão:
              </p>
              <div className="concorrencia-catalog__confirm-code-row">
                <span className="concorrencia-catalog__confirm-code-value" aria-label="Código de confirmação">
                  {removeMonitoredCode || "----"}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  className="concorrencia-catalog__confirm-code-input"
                  value={removeMonitoredCodeInput}
                  onChange={(e) => {
                    const next = String(e.target.value || "")
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    setRemoveMonitoredCodeInput(next);
                  }}
                  placeholder="Digite o código"
                  aria-label="Digite o código de confirmação"
                  autoFocus
                />
              </div>
            </div>
            <div className="concorrencia-produto-modal__confirm-actions">
              <button
                type="button"
                className="concorrencia-produto-modal__confirm-btn concorrencia-produto-modal__confirm-btn--cancel"
                onClick={handleCancelRemoveMonitored}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="concorrencia-produto-modal__confirm-btn concorrencia-produto-modal__confirm-btn--danger"
                disabled={!canConfirmRemoveMonitored}
                onClick={() => void handleConfirmRemoveMonitored()}
              >
                {removingMonitoredId ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
