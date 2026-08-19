/**
 * Catálogo ML — linha da grade + coluna “Você vende por” com Raio-x S7 (extraído de Anuncios.jsx).
 * Comportamento preservado byte-a-byte na extração; imports relativos ao diretório `src`.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHref, useNavigate } from "react-router-dom";
import Decimal from "decimal.js";
import precificaS7Icon from "../../../assets/precifica-s7-icon.png";
import raioxTriggerIcon from "../../../assets/raiox-trigger-icon.png";
import comparativoOfertasS7Icon from "../../../assets/comparativo-ofertas-s7-icon.png";
import { buildApiUrl, apiFetch } from "../../../config/api";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../../../theme/marketplaceTheme.js";
import S7Button from "../../../components/ui/S7Button";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../../../components/ui/S7CopyButton.jsx";
import S7CatalogListingHeadline from "../../../components/catalog/S7CatalogListingHeadline.jsx";
import S7Icon from "../../../components/ui/S7Icon";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7CatalogAccountCell, {
  S7CatalogChannelCell,
  pickCatalogAccountFields,
} from "../../../components/catalog/S7CatalogAccountCell.jsx";
import { MercadoLivrePricingScenarioComparePanel } from "../../../components/MercadoLivrePricingScenarioComparePanel.jsx";
import RaioxOfferComparisonChartModal from "../../../components/rayx/RaioxOfferComparisonChartModal.jsx";
import { RaioxVendaTesteModal } from "../../../components/RaioxVendaTesteModal.jsx";
import {
  buildRaioxScenariosFromSaleXrayModalContract,
  shouldSaleXrayShippingAuditTrace,
  enrichRaioxScenariosWithListingPromotionMetadata,
  mergeListingGridRowIntoMlScenarios,
  shouldSaleXrayDebugTrace,
  wrapPricingScenariosApiAsSaleXrayModalPayload,
} from "../../../components/mercadoLivrePricingScenarioCompareShared.js";
import { getVendasTableFinancialHealthToneClass } from "../../../utils/saleHealthUi.js";
import {
  CatalogMetricCell,
  CatalogMetricMissing,
  CatalogMetricNumSingle,
  CatalogProfitHealthHint,
  catalogVendasFinValueClass,
  formatCatalogPctVendasStyle,
  renderCatalogMoneyDisplay,
} from "../../../components/catalog/CatalogFinancialMetricUi.jsx";
import { salvarLinhaPrecificacaoInteligenteCache } from "../pricing-intelligence/pricingIntelligenceRowCache.js";
import {
  DASH,
  SEM_DADO,
  HEALTH_BADGE_CLASS,
  formatBrlFromApiString,
  formatMoneyOrDash,
  formatPercentFromApiString,
  buildListingTypeAndTariffSubtitle,
  pickModalSaleFeeFromBackend,
  pickModalMercadoLivreShippingLine,
  formatListingUnitNetBrl,
  qualityBadgeClass,
  experienceBadgeClass,
} from "../utils/catalogFormatters.js";
import { ADS_PAGE_MODE, PRICING_PAGE_MODE, listingsPageModes } from "../config/listingsPageModes.js";
import { ANUNCIOS_COL } from "../layout/anunciosCatalogColumns.js";
import { PRECIFICACOES_COL } from "../layout/precificacoesCatalogColumns.js";
import { formatarQuantidadeVendasListaPrecificacoesDaLinha } from "../layout/formatPrecificacoesListSalesCount.js";
import {
  resolvePrecificacoesListCurrentState,
} from "../utils/resolvePrecificacoesListCellMetrics.js";
import { getListingProductLinkActions, isAnunciosCatalogRowPending, shouldShowCadastrarCustosListaRow } from "../utils/mlListingsGridMapping.js";
import { resolveCanonicalListingQualityScore } from "../domain/health/resolveCanonicalListingQualityScore.js";
import ListingQualityGauge from "./ListingQualityGauge.jsx";
import { montarClassesLinhaOperationalRowCard } from "../../../components/s7OperationalRowCardClasses.js";
import {
  ADS_RAIOX_POPOVER_WIDTH_PX,
  ADS_RAIOX_POPOVER_MAX_H_PX,
  ADS_RAIOX_STATUS_EXPLAIN_W_PX,
  ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX,
  ADS_RAIOX_ML_COMPARE_VIEWPORT_BOTTOM_GUTTER_PX,
  ADS_RAIOX_ML_COMPARE_MAX_SHELL_W_VW,
  ADS_RAIOX_STATUS_EXPLAIN_Z,
  ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE,
  RAIOX_VENDA_ML_CENARIOS_COPY,
  computeIdealRaioxMlCompareShellWidthPx,
  getRaioxPopoverViewportInsets,
  RAIOX_PORTAL_SHELL_CLASS,
  buildRayxPortalShellPlacementStyle,
  measureRayxPortalShellMetrics,
  resolveRaioxPortalShellLayoutPx,
} from "../utils/raioxCatalogLayout.js";
import QuickProductCostsModal from "./QuickProductCostsModal.jsx";


function ListingCoverThumbInner({ trimmed }) {
  const [broken, setBroken] = useState(false);
  const showImg = trimmed !== "" && !broken;

  return (
    <div className="anuncios-ad-thumb">
      {showImg ? (
        <img
          src={trimmed}
          alt=""
          className="anuncios-ad-thumb__img"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="anuncios-ad-thumb__fallback" aria-hidden>
          <S7Icon name="image" size={22} strokeWidth={1.65} className="anuncios-ad-thumb__fallback-icon" />
        </span>
      )}
    </div>
  );
}

/** Troca de URL remonta o inner — evita `setState` síncrono em effect (lint) e reseta fallback de imagem. */
export function ListingCoverThumb({ url }) {
  const trimmed = url != null && String(url).trim() !== "" ? String(url).trim() : "";
  return <ListingCoverThumbInner key={trimmed || "__empty__"} trimmed={trimmed} />;
}

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseApiDecimal(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  try {
    const dec = new Decimal(text.replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} raw
 */
function parseNonNegativeInt(raw) {
  if (raw == null) return 0;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const COMPLETE_PRODUCT_COSTS_LABEL = "Cadastrar Custos";
const COMPLETE_PRODUCT_TOOLTIP = "Cadastrar custos do produto para calcular lucro e margem.";

function classeBadgeTipoAnuncioLista(tipoLabel) {
  const text = tipoLabel != null ? String(tipoLabel).trim().toLowerCase() : "";
  if (text === "premium") return "premium";
  if (text === "clássico" || text === "classico") return "classic";
  if (text === "grátis" || text === "gratis") return "free";
  return "neutral";
}

function normalizarTipoAnuncioLista(tipoLabel) {
  const text = tipoLabel != null ? String(tipoLabel).trim() : "";
  if (!text || text === DASH) return null;
  return text;
}

/**
 * Coluna “Você vende por” (vista minimal): preço de tabela, promoção, atacado, “você recebe” + Raio-x ao lado do preço principal.
 * @param {{
 *   row: ReturnType<typeof mapGridApiToCatalogRow>;
 *   onInformSku?: (r: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 *   onOpenPricing?: (anchorEl?: HTMLElement | null) => void;
 * }} props
 */
function AdsMinimalSellColumn({ row, onInformSku, onOpenPricing }) {
  const raioxTriggerRef = useRef(null);
  const raioxShellRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const raioxPanelRef = useRef(null);
  const raioxPricingRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  /** Gatilho do mini popover “Sobre este status” (linha Resultado). */
  const statusExplainTriggerRef = useRef(null);
  const statusExplainPopoverRef = useRef(null);
  const statusExplainPopoverId = useId();
  /** Evita stale closure em listeners de scroll/resize enquanto o painel está aberto. */
  const raioxOpenRef = useRef(false);
  const raioxMlCompareWideRef = useRef(false);
  const raioxMlScenarioCountRef = useRef(0);

  const [raioxOpen, setRaioxOpen] = useState(false);
  /** Mini modal só com o gráfico comparativo (Raio-x ML). */
  const [raioxChartOpen, setRaioxChartOpen] = useState(false);
  /** Modal experimental: lista bruta GET /seller-promotions/items (mesma fonte da grid ML). */
  const [raioxTesteOpen, setRaioxTesteOpen] = useState(false);
  const raioxChartMiniRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const raioxChartMiniPricingRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  /** Posição do shell Raio-x (fixed): centralizado na viewport. */
  const [raioxPanelGeom, setRaioxPanelGeom] = useState(() => {
    if (typeof window === "undefined") {
      return {
        maxW: ADS_RAIOX_POPOVER_WIDTH_PX,
        maxH: ADS_RAIOX_POPOVER_MAX_H_PX,
        arrowTopPx: 24,
        fitScale: 1,
      };
    }
    const layout = resolveRaioxPortalShellLayoutPx(window.innerHeight);
    return {
      maxW: ADS_RAIOX_POPOVER_WIDTH_PX,
      maxH: layout.height,
      arrowTopPx: 24,
      fitScale: 1,
    };
  });
  /** Explicação do status: mini card por hover/foco (payload: título / subtítulo / mensagem do backend). */
  const [statusExplainOpen, setStatusExplainOpen] = useState(false);
  const [statusExplainGeom, setStatusExplainGeom] = useState({
    left: 0,
    top: 0,
    width: ADS_RAIOX_STATUS_EXPLAIN_W_PX,
  });
  const [statusExplainBridge, setStatusExplainBridge] = useState(
    /** @type {{ left: number; top: number; width: number; height: number } | null} */ (null),
  );
  const statusExplainCloseTimerRef = useRef(null);

  const [mlScenariosPayload, setMlScenariosPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [mlScenariosLoading, setMlScenariosLoading] = useState(false);
  const [mlScenariosError, setMlScenariosError] = useState(/** @type {string | null} */ (null));

  const clearStatusExplainCloseTimer = useCallback(() => {
    if (statusExplainCloseTimerRef.current != null) {
      window.clearTimeout(statusExplainCloseTimerRef.current);
      statusExplainCloseTimerRef.current = null;
    }
  }, []);

  const openStatusExplain = useCallback(() => {
    clearStatusExplainCloseTimer();
    setStatusExplainOpen(true);
  }, [clearStatusExplainCloseTimer]);

  const scheduleCloseStatusExplain = useCallback(() => {
    clearStatusExplainCloseTimer();
    statusExplainCloseTimerRef.current = window.setTimeout(() => {
      statusExplainCloseTimerRef.current = null;
      setStatusExplainOpen(false);
      setStatusExplainBridge(null);
    }, 150);
  }, [clearStatusExplainCloseTimer]);

  useEffect(() => {
    raioxOpenRef.current = raioxOpen;
  }, [raioxOpen]);

  useEffect(() => {
    if (!raioxOpen) {
      clearStatusExplainCloseTimer();
      setStatusExplainOpen(false);
      setStatusExplainBridge(null);
    }
  }, [raioxOpen, clearStatusExplainCloseTimer]);

  useEffect(() => {
    clearStatusExplainCloseTimer();
    setStatusExplainOpen(false);
    setStatusExplainBridge(null);
  }, [row.externalId, row.listingNumber, clearStatusExplainCloseTimer]);

  useEffect(() => {
    if (!raioxOpen) {
      setMlScenariosPayload(null);
      setMlScenariosError(null);
      setMlScenariosLoading(false);
    }
  }, [raioxOpen]);

  useEffect(() => {
    if (!raioxOpen) return;
    // Evita renderizar cenários de outro anúncio enquanto o fetch atual ainda não chegou.
    setMlScenariosPayload(null);
    setMlScenariosError(null);
    if (row.marketplaceRaw !== "mercado_livre" || !row.externalId || String(row.externalId).trim() === "") {
      return;
    }
    let cancelled = false;
    (async () => {
      setMlScenariosLoading(true);
      setMlScenariosError(null);
      try {
        const url = buildApiUrl("/api/ml/listings/pricing-scenarios");
        if (shouldSaleXrayDebugTrace(row.externalId)) {
          console.log("[SALE_XRAY] calling pricing-scenarios (Raio-x ML)", {
            listingExternalId: row.externalId,
            url: url ?? null,
          });
        }
        if (!url) {
          if (!cancelled) {
            setMlScenariosError("API não configurada (VITE_API_BASE_URL).");
            setMlScenariosPayload(null);
          }
          return;
        }
        const result = await apiFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingExternalId: row.externalId }),
        });
        const data = /** @type {Record<string, unknown> | undefined} */ (result.data);
        if (!result.ok) {
          if (!cancelled) {
            setMlScenariosError(
              result.error != null ? String(result.error) : "Não foi possível carregar os cenários de precificação.",
            );
            setMlScenariosPayload(null);
          }
          return;
        }
        if (!data || data.ok !== true) {
          if (!cancelled) {
            setMlScenariosError(
              data?.error != null ? String(data.error) : "Não foi possível carregar os cenários de precificação.",
            );
            setMlScenariosPayload(null);
          }
          return;
        }
        const normalized = wrapPricingScenariosApiAsSaleXrayModalPayload(data);
        if (
          normalized == null ||
          normalized.from_sale_xray_modal !== true ||
          normalized.sale_xray_modal == null ||
          typeof normalized.sale_xray_modal !== "object"
        ) {
          if (!cancelled) {
            setMlScenariosError(
              "Não foi possível montar o Raio-x a partir dos cenários deste anúncio. Sincronize o anúncio e tente de novo.",
            );
            setMlScenariosPayload(null);
          }
          return;
        }
        if (shouldSaleXrayDebugTrace(normalized)) {
          console.log("[SALE_XRAY] response", normalized);
        }
        if (!cancelled) {
          setMlScenariosPayload(normalized);
        }
      } catch {
        if (!cancelled) {
          setMlScenariosError("Não foi possível carregar os cenários de precificação.");
          setMlScenariosPayload(null);
        }
      } finally {
        if (!cancelled) setMlScenariosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [raioxOpen, row.externalId, row.marketplaceRaw]);

  const scenarioMode =
    row.marketplaceRaw === "mercado_livre" &&
    mlScenariosPayload != null &&
    mlScenariosError == null &&
    !mlScenariosLoading;

  const mlScenariosForCompare = useMemo(() => {
    if (!scenarioMode || !mlScenariosPayload || typeof mlScenariosPayload !== "object") return [];
    if (mlScenariosPayload.from_sale_xray_modal !== true) return [];
    const fromContract = buildRaioxScenariosFromSaleXrayModalContract(mlScenariosPayload);
    if (fromContract == null || fromContract.length === 0) return [];
    const merged = mergeListingGridRowIntoMlScenarios(fromContract, row);
    return enrichRaioxScenariosWithListingPromotionMetadata(merged, mlScenariosPayload, row);
  }, [scenarioMode, mlScenariosPayload, row]);

  const hasMlScenarioCompare = mlScenariosForCompare.length > 0;

  /** Cenários do Raio-x ML: payload normalizado (`from_sale_xray_modal`) após `pricing-scenarios`. */
  const mlScenariosForRaioxDisplay = useMemo(() => {
    if (!scenarioMode || !mlScenariosPayload || typeof mlScenariosPayload !== "object") return [];
    return mlScenariosForCompare;
  }, [scenarioMode, mlScenariosPayload, mlScenariosForCompare]);

  useEffect(() => {
    if (!raioxOpen || !shouldSaleXrayShippingAuditTrace(row.externalId) || !mlScenariosPayload) return;
    const sx = /** @type {Record<string, unknown>} */ (mlScenariosPayload).sale_xray_modal;
    if (!sx || typeof sx !== "object") return;
    const norm = /** @type {Record<string, unknown>} */ (sx).normal_scenario;
    const normP =
      norm?.pricing != null && typeof norm.pricing === "object"
        ? /** @type {Record<string, unknown>} */ (norm.pricing)
        : {};
    const promosArr = /** @type {unknown[]} */ (Array.isArray(sx.promotion_scenarios) ? sx.promotion_scenarios : []);
    console.info("[SALE_XRAY_SHIPPING_AUDIT] grid_row", {
      listing_external_id: row.externalId,
      shippingCostContext: row.shippingCostContext ?? null,
      shippingCostSource: row.shippingCostSource ?? null,
      shippingCostAmountBrl: row.shippingCostAmountBrl ?? null,
      shippingCostBrl: row.shippingCostBrl ?? null,
    });
    console.info("[SALE_XRAY_SHIPPING_AUDIT] contract_raw sale_xray_modal", {
      listing_external_id: mlScenariosPayload.listing_external_id ?? row.externalId,
      normal_pricing: {
        shipping_cost_amount_brl: normP.shipping_cost_amount_brl ?? null,
        shipping_cost_context: normP.shipping_cost_context ?? null,
        ml_shipping_cost_context: normP.ml_shipping_cost_context ?? null,
        shipping_cost_source: normP.shipping_cost_source ?? null,
        ml_card_shipping_amount_brl: normP.ml_card_shipping_amount_brl ?? null,
        ml_card_shipping_brl: normP.ml_card_shipping_brl ?? null,
      },
      promotion_scenarios: promosArr.map((ps, i) => {
        const p = ps && typeof ps === "object" ? /** @type {Record<string, unknown>} */ (ps) : {};
        const pr =
          p.pricing != null && typeof p.pricing === "object"
            ? /** @type {Record<string, unknown>} */ (p.pricing)
            : {};
        return {
          index: i,
          scenario_key: p.scenario_key ?? null,
          pricing: {
            shipping_cost_amount_brl: pr.shipping_cost_amount_brl ?? null,
            shipping_cost_context: pr.shipping_cost_context ?? null,
            ml_shipping_cost_context: pr.ml_shipping_cost_context ?? null,
            shipping_cost_source: pr.shipping_cost_source ?? null,
            ml_card_shipping_amount_brl: pr.ml_card_shipping_amount_brl ?? null,
            ml_card_shipping_brl: pr.ml_card_shipping_brl ?? null,
          },
        };
      }),
    });
    const built = buildRaioxScenariosFromSaleXrayModalContract(mlScenariosPayload);
    if (built != null && built.length > 0) {
      console.info(
        "[SALE_XRAY_SHIPPING_AUDIT] after_buildRaioxScenariosFromSaleXrayModalContract",
        built.map((sc) => {
          const r = sc && typeof sc === "object" ? /** @type {Record<string, unknown>} */ (sc) : {};
          const m =
            r.marketplace != null && typeof r.marketplace === "object"
              ? /** @type {Record<string, unknown>} */ (r.marketplace)
              : {};
          const sxP =
            r.sale_xray_pricing != null && typeof r.sale_xray_pricing === "object"
              ? /** @type {Record<string, unknown>} */ (r.sale_xray_pricing)
              : {};
          return {
            scenario_key: r.scenario_key ?? r.scenario_id ?? null,
            is_baseline: r.is_baseline === true,
            marketplace: {
              shipping_context: m.shipping_context ?? null,
              shipping_cost_context: m.shipping_cost_context ?? null,
              ml_shipping_cost_context: m.ml_shipping_cost_context ?? null,
              shipping_cost_amount_brl: m.shipping_cost_amount_brl ?? null,
              ml_card_shipping_amount_brl: m.ml_card_shipping_amount_brl ?? null,
            },
            sale_xray_pricing: {
              shipping_cost_context: sxP.shipping_cost_context ?? null,
              ml_shipping_cost_context: sxP.ml_shipping_cost_context ?? null,
              shipping_cost_amount_brl: sxP.shipping_cost_amount_brl ?? null,
            },
          };
        }),
      );
    }
  }, [
    raioxOpen,
    row.externalId,
    row.shippingCostContext,
    row.shippingCostSource,
    row.shippingCostAmountBrl,
    row.shippingCostBrl,
    mlScenariosPayload,
  ]);

  /** Só um bloco (ex.: só “Preço normal”) — mais respiro abaixo da pílula ML no shell. */
  const raioxMlBaselineOnlyLayout = hasMlScenarioCompare && mlScenariosForRaioxDisplay.length === 1;

  raioxMlCompareWideRef.current = hasMlScenarioCompare;
  raioxMlScenarioCountRef.current = hasMlScenarioCompare ? mlScenariosForRaioxDisplay.length : 0;

  useEffect(() => {
    return () => {
      if (statusExplainCloseTimerRef.current != null) {
        window.clearTimeout(statusExplainCloseTimerRef.current);
        statusExplainCloseTimerRef.current = null;
      }
    };
  }, []);

  const commitRaioxPanelPosition = useCallback(() => {
    if (!raioxOpenRef.current) return;
    const marginTight = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const isMlWide = raioxMlCompareWideRef.current;
    const bottomPad = bottomInset + (isMlWide ? ADS_RAIOX_ML_COMPARE_VIEWPORT_BOTTOM_GUTTER_PX : ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX);

    if (isMlWide) {
      const n = raioxMlScenarioCountRef.current;
      const idealW = computeIdealRaioxMlCompareShellWidthPx(n);
      const capW = vw * ADS_RAIOX_ML_COMPARE_MAX_SHELL_W_VW;
      const maxW = Math.min(idealW, capW);
      const layout = resolveRaioxPortalShellLayoutPx(vh);
      setRaioxPanelGeom({
        maxW,
        maxH: layout.height,
        arrowTopPx: 24,
        fitScale: 1,
      });
      return;
    }

    const capW = ADS_RAIOX_POPOVER_WIDTH_PX;
    const maxW = Math.min(capW, vw - 2 * marginTight);
    const panelEl = raioxPanelRef.current;
    const estW =
      panelEl && panelEl.getBoundingClientRect().width > 40 ? panelEl.getBoundingClientRect().width : maxW;

    const layout = resolveRaioxPortalShellLayoutPx(vh);
    const maxH = layout.height;
    const availW = vw - 2 * marginTight;
    const availH = vh - topInset - bottomPad;

    let natW = estW;
    let natH = 120;
    if (panelEl) {
      natW = Math.max(panelEl.offsetWidth, panelEl.scrollWidth, 40);
      natH = Math.max(panelEl.offsetHeight, panelEl.scrollHeight, 40);
    }

    /** Popover estreito: escala só o necessário para caber (sem comparativo ML). */
    const rawScale = Math.min(1, (availW / natW) * 0.94, (availH / natH) * 0.94);
    const fitScale = Math.min(1, rawScale);

    const arrowTopPx = 24;
    setRaioxPanelGeom({ maxW, maxH, arrowTopPx, fitScale });
  }, []);

  const scheduleRaioxPanelPosition = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(commitRaioxPanelPosition);
    });
  }, [commitRaioxPanelPosition]);

  /** Fecha ao clicar fora do painel ou do gatilho; não usa hover (comportamento estável). */
  useEffect(() => {
    if (!raioxOpen) return;
    const onDocMouseDown = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (raioxChartOpen) {
        if (raioxChartMiniRef.current?.contains(t)) return;
        setRaioxChartOpen(false);
        return;
      }
      if (raioxShellRef.current?.contains(t)) return;
      if (raioxTriggerRef.current?.contains(t)) return;
      setRaioxOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [raioxOpen, raioxChartOpen]);

  useEffect(() => {
    if (!raioxOpen) setRaioxChartOpen(false);
  }, [raioxOpen]);

  useEffect(() => {
    if (!raioxOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (raioxChartOpen) setRaioxChartOpen(false);
      else setRaioxOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [raioxOpen, raioxChartOpen]);

  useEffect(() => {
    if (!raioxOpen) return;
    scheduleRaioxPanelPosition();
  }, [raioxOpen, row.externalId, row.listingNumber, mlScenariosPayload, mlScenariosForRaioxDisplay.length, scheduleRaioxPanelPosition]);

  useEffect(() => {
    const onWinChange = () => commitRaioxPanelPosition();
    window.addEventListener("resize", onWinChange);
    window.addEventListener("scroll", onWinChange, true);
    return () => {
      window.removeEventListener("resize", onWinChange);
      window.removeEventListener("scroll", onWinChange, true);
    };
  }, [commitRaioxPanelPosition]);

  useEffect(() => {
    if (!raioxOpen) return;
    const el = raioxPanelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => scheduleRaioxPanelPosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [raioxOpen, scheduleRaioxPanelPosition]);

  const commitStatusExplainPosition = useCallback(() => {
    const trig = statusExplainTriggerRef.current;
    const pop = statusExplainPopoverRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const margin = 12;
    /** Respiro entre o card Raio-x (região do ícone) e o mini popover — evita sensação de “grudado”. */
    const gap = 18;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const popW = Math.min(ADS_RAIOX_STATUS_EXPLAIN_W_PX, vw - 2 * margin);
    /** Altura inicial maior que o toast antigo: card com 3 blocos de texto. */
    const popH = pop && pop.getBoundingClientRect().height > 8 ? pop.getBoundingClientRect().height : 180;

    let placementRight = true;
    let left = r.right + gap;
    if (left + popW > vw - margin) {
      left = r.left - gap - popW;
      placementRight = false;
    }
    left = Math.max(margin, Math.min(left, vw - margin - popW));

    let top = r.top + r.height / 2 - popH / 2;
    top = Math.max(topInset, Math.min(top, vh - bottomInset - popH));

    const bridgeTop = Math.min(r.top, top);
    const bridgeBottom = Math.max(r.bottom, top + popH);
    const bridgeHeight = Math.max(8, bridgeBottom - bridgeTop);
    /** Ponte hover: ícone ↔ popover, sem flicker no espaçamento. */
    let bridge = null;
    if (placementRight) {
      const w = left - r.right;
      if (w >= 2) bridge = { left: r.right, top: bridgeTop, width: w, height: bridgeHeight };
    } else {
      const w = r.left - (left + popW);
      if (w >= 2) bridge = { left: left + popW, top: bridgeTop, width: w, height: bridgeHeight };
    }
    setStatusExplainGeom({ left, top, width: popW });
    setStatusExplainBridge(bridge);
  }, []);

  useEffect(() => {
    if (!statusExplainOpen) return;
    const run = () => commitStatusExplainPosition();
    run();
    const raf1 = requestAnimationFrame(run);
    let ro = null;
    const raf2 = requestAnimationFrame(() => {
      run();
      const pop = statusExplainPopoverRef.current;
      if (pop && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(run);
        ro.observe(pop);
      }
    });
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, true);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro?.disconnect();
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run, true);
    };
  }, [statusExplainOpen, commitStatusExplainPosition]);

  useEffect(() => {
    if (!statusExplainOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        clearStatusExplainCloseTimer();
        setStatusExplainOpen(false);
        setStatusExplainBridge(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [statusExplainOpen, clearStatusExplainCloseTimer]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const digits = String(row.listingNumberDisplay ?? row.listingNumber ?? "").replace(/\D/g, "");
    if (digits !== "4473596489") return;
    console.info("[Suse7][repasse-debug] MLB4473596489", {
      listingNumber: row.listingNumber,
      listingNumberDisplay: row.listingNumberDisplay,
      listingPriceBrl: row.listingPriceBrl,
      effectiveSalePriceBrl: row.effectiveSalePriceBrl,
      promotionActive: row.promotionActive,
      netReceiveBrl_alias: row.netReceiveBrl,
      marketplacePayoutSource: row.marketplacePayoutSource,
      unitNet_displayed: formatListingUnitNetBrl(row),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- log DEV pontual; deps estreitas de propósito
  }, [row.listingNumber, row.listingNumberDisplay, row.netReceiveBrl]);

  /** Theme do canal — Raio-x aplica variáveis CSS + moldura sem if (marketplace) no JSX. */
  const raioxMarketplaceTheme = useMemo(
    () => getMarketplaceTheme(row.marketplaceRaw || row.marketplaceSlug),
    [row.marketplaceRaw, row.marketplaceSlug],
  );

  const promoN =
    row.promotionPriceBrl != null && String(row.promotionPriceBrl).trim() !== ""
      ? Number(row.promotionPriceBrl)
      : null;
  const listOrigN =
    row.listingPriceBrl != null && String(row.listingPriceBrl).trim() !== ""
      ? Number(row.listingPriceBrl)
      : row.listOrOriginalPriceBrl != null && String(row.listOrOriginalPriceBrl).trim() !== ""
        ? Number(row.listOrOriginalPriceBrl)
        : null;
  const hasValidPromo =
    row.promotionActive === true && promoN != null && Number.isFinite(promoN) && promoN > 0;
  const mainPriceNum =
    hasValidPromo && listOrigN != null && Number.isFinite(listOrigN) && listOrigN > 0
      ? listOrigN
      : row.price != null && Number.isFinite(row.price)
        ? row.price
        : null;

  const promoDifferent =
    row.promotionActive === true &&
    promoN != null &&
    Number.isFinite(promoN) &&
    mainPriceNum != null &&
    Number.isFinite(mainPriceNum) &&
    Math.abs(mainPriceNum - promoN) > 0.004;

  const showWholesale =
    row.wholesaleMinQuantity != null &&
    row.wholesaleMinQuantity > 1 &&
    row.wholesalePriceBrl != null &&
    String(row.wholesalePriceBrl).trim() !== "";

  /** ML com external id: flash só até o POST /sale-xray-modal concluir. */
  const useMlScenarioRaiox =
    row.marketplaceRaw === "mercado_livre" &&
    row.externalId != null &&
    String(row.externalId).trim() !== "";
  const mlScenarioContractUnavailable =
    useMlScenarioRaiox && !mlScenariosLoading && !hasMlScenarioCompare;

  /** Subtítulo da tarifa: tipo de anúncio + % (campos consolidados da grid / health — só formatação). */
  const feeSubTitle = buildListingTypeAndTariffSubtitle(row);
  const receiveDisplay = formatListingUnitNetBrl(row);

  const modalSaleFeeDisplay = pickModalSaleFeeFromBackend(row);
  const modalMlShippingLine = pickModalMercadoLivreShippingLine(row);
  const modalNetReceiveDisplay = formatListingUnitNetBrl(row);

  const pc = row.pricingContext;
  const ui =
    pc != null && typeof pc === "object" && pc.ui != null && typeof pc.ui === "object"
      ? /** @type {Record<string, unknown>} */ (pc.ui)
      : null;
  const ic =
    pc != null &&
    typeof pc === "object" &&
    pc.internal_costs != null &&
    typeof pc.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (pc.internal_costs)
      : null;
  const res =
    pc != null && typeof pc === "object" && pc.result != null && typeof pc.result === "object"
      ? /** @type {Record<string, unknown>} */ (pc.result)
      : null;
  const block2Mode = ui?.block2_mode != null ? String(ui.block2_mode) : "no_product";
  const block3Mode = ui?.block3_mode != null ? String(ui.block3_mode) : "blocked";

  const offerSemRaw =
    res != null && res.offer_status_semantic != null ? String(res.offer_status_semantic).trim() : "";
  const OFFER_SEM_ALLOWED = new Set(["critical", "danger", "acceptable", "great", "excellent"]);
  const offerSemClass =
    block3Mode === "ok" && res != null && OFFER_SEM_ALLOWED.has(offerSemRaw)
      ? `anuncios-sell-popover__offer-sem--${offerSemRaw}`
      : "";
  /** Tom visual do mini popover (borda/fundo) alinhado ao mesmo semantic do status. */
  const statusExplainToneClass =
    block3Mode === "ok" && res != null && OFFER_SEM_ALLOWED.has(offerSemRaw)
      ? `anuncios-raiox-status-explain--${offerSemRaw}`
      : "";
  /** Textos do status: backend é fonte de verdade (título / subtítulo / mensagem). */
  const offerStatusTitle =
    res != null && res.offer_status_title != null && String(res.offer_status_title).trim() !== ""
      ? String(res.offer_status_title).trim()
      : "";
  const offerStatusSubtitle =
    res != null && res.offer_status_subtitle != null && String(res.offer_status_subtitle).trim() !== ""
      ? String(res.offer_status_subtitle).trim()
      : "";
  const offerStatusMessage =
    res != null && res.offer_status_message != null && String(res.offer_status_message).trim() !== ""
      ? String(res.offer_status_message).trim()
      : "";
  const offerStatusTooltipLegacy =
    res != null && res.offer_status_tooltip != null && String(res.offer_status_tooltip).trim() !== ""
      ? String(res.offer_status_tooltip).trim()
      : "";
  const offerStatusBody = offerStatusMessage !== "" ? offerStatusMessage : offerStatusTooltipLegacy;
  const hasStatusExplain =
    block3Mode === "ok" &&
    res != null &&
    (offerStatusTitle !== "" || offerStatusSubtitle !== "" || offerStatusBody !== "");
  const statusExplainTitleId = `${statusExplainPopoverId}-title`;
  const taxPercentLabel =
    ic != null && ic.tax_percent_label != null && String(ic.tax_percent_label).trim() !== ""
      ? String(ic.tax_percent_label)
      : null;

  const showModalProductValue =
    (row.listOrOriginalPriceBrl != null && String(row.listOrOriginalPriceBrl).trim() !== "") ||
    (!row.promotionActive && row.price != null && Number.isFinite(row.price));
  const showModalPromoPrice =
    row.promotionActive === true &&
    row.promotionPriceBrl != null &&
    String(row.promotionPriceBrl).trim() !== "";

  /** Destaque visual: base da comissão = preço efetivo (promo quando ativa). Ordem no card segue ML (promo primeiro). */
  const modalBaseCommissionHighlightKey = showModalPromoPrice
    ? "promo"
    : showModalProductValue
      ? "product"
      : null;

  const raioxPriceLinesPromoFirst =
    row.promotionActive === true && showModalPromoPrice && showModalProductValue;

  /* FASE 2 — subsídio de tarifa ML (aguardar backend estável; não renderizar ainda)
  const costReductionRaw =
    row.netProceeds?.marketplaceCostReductionAmount ?? row.netProceeds?.marketplaceCostReductionAmountBrl;
  const hasSubsidy =
    costReductionRaw != null &&
    costReductionRaw !== "" &&
    Number(String(costReductionRaw).replace(",", ".")) > 0;
  {hasSubsidy && (
    <>
      <span>**</span>
      <div className="anuncios-sell-popover__muted anuncios-sell-popover__muted--tariff-footnote">
        ** R$ … Reduzidos das suas tarifas por cada venda
      </div>
    </>
  )}
  */

  const raioxListingIdCopyText =
    row.externalId != null && String(row.externalId).trim() !== ""
      ? String(row.externalId).trim().replace(/^#/, "")
      : "";
  const raioxListingIdDisplay = raioxListingIdCopyText !== "" ? raioxListingIdCopyText : DASH;

  /** Título do anúncio na listagem (`title` → `adTitle`). `productName` no grid ainda não é preenchido pela API. */
  const raioxChartMiniListingTitle = useMemo(() => {
    const fromAd = row.adTitle != null ? String(row.adTitle).trim() : "";
    if (fromAd !== "" && fromAd !== DASH) return fromAd;
    const fromProduct = row.productName != null ? String(row.productName).trim() : "";
    if (fromProduct !== "" && fromProduct !== DASH) return fromProduct;
    return "";
  }, [row.adTitle, row.productName]);

  const raioxSkuCopyText = row.sku != null ? String(row.sku).trim() : "";

  const raioxMainColumn = (
    <>
            {hasMlScenarioCompare ? (
              <div
                className={[
                  "anuncios-raiox-compare--spacious",
                  raioxMlBaselineOnlyLayout ? "anuncios-raiox-compare--single-card" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {mlScenariosForRaioxDisplay.length > 0 ? (
                  <div className="anuncios-raiox-compare__stack">
                    <div className="anuncios-raiox-compare__toolbar">
                      <button
                        ref={raioxPricingRef}
                        type="button"
                        className="anuncios-raiox-compare__pricing-btn s7-tip s7-tip-bottom s7-tip-left"
                        data-tip="Precificação inteligente"
                        aria-label="Abrir precificação inteligente"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRaioxChartOpen(false);
                          setRaioxOpen(false);
                          onOpenPricing?.();
                        }}
                      >
                        <img
                          src={PRECIFICA_S7_ICON_SRC}
                          alt=""
                          className="anuncios-raiox-compare__pricing-btn-icon"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                      <button
                        type="button"
                        className="anuncios-raiox-compare__chart-btn anuncios-raiox-compare__chart-btn--icon-only s7-tip s7-tip-bottom s7-tip-left"
                        data-tip="Comparativo de ofertas S7"
                        aria-label="Abrir Comparativo de ofertas S7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRaioxChartOpen(true);
                        }}
                      >
                        <img
                          src={comparativoOfertasS7Icon}
                          alt=""
                          className="anuncios-raiox-compare__chart-btn-icon"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                      <div
                        className="anuncios-raiox-compare__toolbar-meta anuncios-raiox-compare__toolbar-meta--with-copy"
                        role="group"
                        aria-label="Identificadores do anúncio"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="anuncios-raiox-compare__toolbar-meta-block anuncios-raiox-compare__copy-target">
                          <span className="anuncios-raiox-compare__toolbar-meta-text">{raioxListingIdDisplay}</span>
                          {raioxListingIdCopyText !== "" ? (
                            <S7CopyButton
                              value={raioxListingIdCopyText}
                              ariaLabel="Copiar ID do anúncio"
                              tooltipText="Copiar ID do anúncio"
                              toastLabel="ID do anúncio"
                              showToast={true}
                              iconMode="unicode"
                              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                              flashKey="raiox-ext"
                              toastEventType="LISTING_ID_COPIED"
                              toastFailEventType="LISTING_ID_COPY_FAILED"
                              toastEntityType="marketplace_listing"
                              className="anuncios-raiox-compare__toolbar-copy"
                            />
                          ) : null}
                        </span>
                        <span className="anuncios-raiox-compare__toolbar-meta-sep" aria-hidden="true">
                          |
                        </span>
                        <span className="anuncios-raiox-compare__toolbar-meta-block anuncios-raiox-compare__toolbar-meta-block--sku anuncios-raiox-compare__copy-target">
                          <span className="anuncios-ad-sku-label">SKU</span>
                          <span className="anuncios-raiox-compare__toolbar-meta-text">
                            {row.sku && String(row.sku).trim() !== "" ? String(row.sku).trim() : DASH}
                          </span>
                          {raioxSkuCopyText !== "" ? (
                            <S7CopyButton
                              value={raioxSkuCopyText}
                              ariaLabel="Copiar SKU"
                              tooltipText="Copiar SKU"
                              toastLabel="SKU"
                              showToast={true}
                              iconMode="unicode"
                              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                              flashKey="raiox-sku"
                              toastEventType="LISTING_SKU_COPIED"
                              toastFailEventType="LISTING_SKU_COPY_FAILED"
                              toastEntityType="marketplace_listing"
                              className="anuncios-raiox-compare__toolbar-copy"
                            />
                          ) : null}
                        </span>
                      </div>
                    </div>
                    <div className="anuncios-raiox-compare__compare-scroll">
                      <div className="anuncios-raiox-compare__compare-scroll-inner">
                        <MercadoLivrePricingScenarioComparePanel
                          layout="raiox"
                          showInlineChart={false}
                          debugTag="raiox_venda"
                          scenarios={mlScenariosForRaioxDisplay}
                          raioxVendaPresentation
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="anuncios-sell-popover__muted" role="status">
                    Nenhum cenário disponível no momento. Preço normal e promoções ativas/programadas aparecem
                    aqui quando aplicável.
                  </p>
                )}
              </div>
            ) : useMlScenarioRaiox ? (
              mlScenariosLoading ? null : (
                <p className="anuncios-sell-popover__muted" role="status">
                  {RAIOX_VENDA_ML_CENARIOS_COPY}
                </p>
              )
            ) : (
              <div className="anuncios-sell-popover__section">
                <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
                {showModalProductValue || showModalPromoPrice ? (
                  <div className="anuncios-sell-popover__block">
                    {raioxPriceLinesPromoFirst ? (
                      <>
                        {showModalPromoPrice ? (
                          <div
                            className={
                              modalBaseCommissionHighlightKey === "promo"
                                ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                                : "anuncios-sell-popover__line"
                            }
                          >
                            <span>Você vende na promoção</span>
                            <strong>{formatBrlFromApiString(row.promotionPriceBrl)}</strong>
                          </div>
                        ) : null}
                        {showModalProductValue ? (
                          <div
                            className={
                              modalBaseCommissionHighlightKey === "product"
                                ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                                : "anuncios-sell-popover__line"
                            }
                          >
                            <span>Valor de venda</span>
                            <strong>
                              {formatBrlFromApiString(
                                row.promotionActive && row.listingPriceBrl != null
                                  ? row.listingPriceBrl
                                  : row.effectiveSalePriceBrl ??
                                      row.listingPriceBrl ??
                                      row.listOrOriginalPriceBrl ??
                                      (row.price != null ? String(row.price) : null),
                              )}
                            </strong>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {showModalProductValue ? (
                          <div
                            className={
                              modalBaseCommissionHighlightKey === "product"
                                ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                                : "anuncios-sell-popover__line"
                            }
                          >
                            <span>Valor de venda</span>
                            <strong>
                              {formatBrlFromApiString(
                                row.promotionActive && row.listingPriceBrl != null
                                  ? row.listingPriceBrl
                                  : row.effectiveSalePriceBrl ??
                                      row.listingPriceBrl ??
                                      row.listOrOriginalPriceBrl ??
                                      (row.price != null ? String(row.price) : null),
                              )}
                            </strong>
                          </div>
                        ) : null}
                        {showModalPromoPrice ? (
                          <div
                            className={
                              modalBaseCommissionHighlightKey === "promo"
                                ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                                : "anuncios-sell-popover__line"
                            }
                          >
                            <span>Você vende na promoção</span>
                            <strong>{formatBrlFromApiString(row.promotionPriceBrl)}</strong>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Tarifa de venda</span>
                    <strong>{modalSaleFeeDisplay}</strong>
                  </div>
                  {feeSubTitle != null ? (
                    <div className="anuncios-sell-popover__muted">{feeSubTitle}</div>
                  ) : null}
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>{modalMlShippingLine.title}</span>
                    <strong>{modalMlShippingLine.value}</strong>
                  </div>
                  {modalMlShippingLine.sub != null && String(modalMlShippingLine.sub).trim() !== "" ? (
                    <div className="anuncios-sell-popover__muted">{modalMlShippingLine.sub}</div>
                  ) : null}
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line anuncios-sell-popover__line--total anuncios-sell-popover__line--key">
                    <span>Você recebe</span>
                    <strong>{modalNetReceiveDisplay}</strong>
                  </div>
                </div>
              </div>
            )}

            {!hasMlScenarioCompare && !useMlScenarioRaiox ? (
            <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future">
              <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>
              {block2Mode === "no_product" ? (
                <>
                  <p className="anuncios-sell-popover__raiox-alert">
                    Este anúncio não está vinculado a um produto.
                  </p>
                  {typeof onInformSku === "function" ? (
                    <S7Button
                      type="button"
                      variant="warning"
                      size="sm"
                      className="anuncios-sell-popover__link-product-btn anuncios-ad-line-action-btn"
                      onClick={() => onInformSku(row)}
                    >
                      Vincular produto
                    </S7Button>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Custo do produto</span>
                      <strong
                        className={
                          ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.product_cost_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Impostos</span>
                      <strong
                        className={
                          ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.tax_amount_brl)
                          : DASH}
                      </strong>
                    </div>
                    {taxPercentLabel != null ? (
                      <div className="anuncios-sell-popover__muted">{taxPercentLabel}</div>
                    ) : null}
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Operação + Embalagem</span>
                      <strong
                        className={
                          ic?.operational_packaging_total_brl != null &&
                          String(ic.operational_packaging_total_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.operational_packaging_total_brl != null &&
                        String(ic.operational_packaging_total_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.operational_packaging_total_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  {block2Mode === "incomplete" && ui?.block2_message != null ? (
                    <p className="anuncios-sell-popover__raiox-warn">⚠ {String(ui.block2_message)}</p>
                  ) : null}
                </>
              )}
            </div>
            ) : null}

            {!hasMlScenarioCompare && !useMlScenarioRaiox ? (
            <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future">
              <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
              {block3Mode === "ok" && res != null ? (
                <>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Lucro líquido</span>
                      <strong className={offerSemClass || undefined}>{formatBrlFromApiString(res.profit_brl)}</strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Margem</span>
                      <strong className={offerSemClass || undefined}>
                        {res.margin_pct != null && String(res.margin_pct).trim() !== ""
                          ? `${String(res.margin_pct).replace(".", ",")} %`
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Preço mínimo saudável</span>
                      <strong>
                        {res.break_even_price_brl != null && String(res.break_even_price_brl).trim() !== ""
                          ? formatBrlFromApiString(res.break_even_price_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line anuncios-sell-popover__line--status-offer">
                      <span className="anuncios-sell-popover__status-line-head">
                        <span className="anuncios-sell-popover__status-line-label">Status da oferta</span>
                        {hasStatusExplain ? (
                          <button
                            ref={statusExplainTriggerRef}
                            type="button"
                            className="anuncios-sell-popover__status-tip"
                            aria-label="Detalhes do status da oferta. Passe o mouse ou foque para ler a explicação."
                            aria-expanded={statusExplainOpen}
                            aria-controls={statusExplainPopoverId}
                            aria-haspopup="dialog"
                            onMouseEnter={openStatusExplain}
                            onMouseLeave={scheduleCloseStatusExplain}
                            onFocus={openStatusExplain}
                            onBlur={scheduleCloseStatusExplain}
                          >
                            <S7Icon name="info" size={13} strokeWidth={1.65} />
                          </button>
                        ) : null}
                      </span>
                      <strong className={offerSemClass || undefined}>
                        {res.offer_status_label != null
                          ? String(res.offer_status_label)
                          : res.offer_status != null
                            ? String(res.offer_status)
                            : DASH}
                      </strong>
                    </div>
                    {hasStatusExplain && statusExplainOpen && typeof document !== "undefined"
                      ? createPortal(
                          <>
                            {statusExplainBridge ? (
                              <div
                                className="anuncios-raiox-status-explain-bridge"
                                aria-hidden
                                style={{
                                  position: "fixed",
                                  left: statusExplainBridge.left,
                                  top: statusExplainBridge.top,
                                  width: statusExplainBridge.width,
                                  height: statusExplainBridge.height,
                                  zIndex: ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE,
                                }}
                                onMouseEnter={openStatusExplain}
                                onMouseLeave={scheduleCloseStatusExplain}
                              />
                            ) : null}
                            <div
                              ref={statusExplainPopoverRef}
                              id={statusExplainPopoverId}
                              className={["anuncios-raiox-status-explain", statusExplainToneClass]
                                .filter(Boolean)
                                .join(" ")}
                              role="dialog"
                              aria-labelledby={offerStatusTitle ? statusExplainTitleId : undefined}
                              aria-label={offerStatusTitle ? undefined : "Explicação do status da oferta"}
                              style={{
                                position: "fixed",
                                left: statusExplainGeom.left,
                                top: statusExplainGeom.top,
                                width: statusExplainGeom.width,
                                zIndex: ADS_RAIOX_STATUS_EXPLAIN_Z,
                              }}
                              onMouseEnter={openStatusExplain}
                              onMouseLeave={scheduleCloseStatusExplain}
                            >
                              {offerStatusTitle ? (
                                <h3 id={statusExplainTitleId} className="anuncios-raiox-status-explain__title">
                                  {offerStatusTitle}
                                </h3>
                              ) : null}
                              {offerStatusSubtitle ? (
                                <p className="anuncios-raiox-status-explain__subtitle">{offerStatusSubtitle}</p>
                              ) : null}
                              {offerStatusBody ? (
                                <p className="anuncios-raiox-status-explain__message">{offerStatusBody}</p>
                              ) : null}
                            </div>
                          </>,
                          document.body,
                        )
                      : null}
                  </div>
                </>
              ) : (
                <p className="anuncios-sell-popover__result-placeholder">
                  {ui?.block3_message != null
                    ? `⚠ ${String(ui.block3_message)}`
                    : "Complete os dados do produto para visualizar o resultado."}
                </p>
              )}
            </div>
            ) : null}
    </>
  );

  const raioxCardBody = (
    <>
      <div className="anuncios-raiox-compare__title-stack">
        <h2 className="anuncios-sell-popover__title">Raio-x da precificação</h2>
        <h3 className="anuncios-sell-popover__title">
          {row.adTitle && String(row.adTitle).trim() !== "" ? row.adTitle : "Raio-x da venda"}
        </h3>
      </div>
      {mlScenariosLoading ? (
        <div className="anuncios-raiox-venda-loading" role="status" aria-live="polite">
          <div className="anuncios-raiox-venda-loading__spinner-wrap" aria-hidden>
            <span className="anuncios-raiox-venda-loading__spinner" />
          </div>
          <p className="anuncios-sell-popover__muted anuncios-raiox-venda-loading__text">
            {RAIOX_VENDA_ML_CENARIOS_COPY}
          </p>
        </div>
      ) : null}
      {mlScenariosError != null && String(mlScenariosError).trim() !== "" ? (
        <p className="anuncios-sell-popover__raiox-warn" role="alert">
          {String(mlScenariosError)}
        </p>
      ) : null}
      {mlScenarioContractUnavailable ? (
        <p className="anuncios-sell-popover__raiox-warn" role="status">
          Contrato canônico de cenários ausente. O Raio-x ML não exibe fallback local.
        </p>
      ) : null}
      {hasMlScenarioCompare ? (
        <div className="anuncios-compare-modal__body-scroll">{raioxMainColumn}</div>
      ) : (
        raioxMainColumn
      )}
    </>
  );

  const raioxPortalShellMetrics =
    typeof window !== "undefined" ? measureRayxPortalShellMetrics(window.innerHeight) : null;

  return (
    <div className="anuncios-sell-minimal">
      <div className="anuncios-sell-minimal__main-row">
        {promoDifferent && promoN != null ? (
          <div className="anuncios-sell-minimal__primary-stack">
            <span className="anuncios-sell-minimal__primary-caption">Você vende na promoção</span>
            <span className="anuncios-sell-minimal__main">{formatMoneyOrDash(promoN)}</span>
          </div>
        ) : (
          <span className="anuncios-sell-minimal__main">{formatMoneyOrDash(mainPriceNum)}</span>
        )}
        <span className="anuncios-sell-popover anuncios-sell-popover--inline">
          <button
            ref={raioxTriggerRef}
            type="button"
            className="anuncios-sell-popover__trigger"
            aria-label="Ver raio-x da venda no marketplace"
            aria-expanded={raioxOpen}
            aria-haspopup="dialog"
            onClick={(e) => {
              e.stopPropagation();
              setRaioxOpen((v) => !v);
            }}
          >
            <img
              src={raioxTriggerIcon}
              alt=""
              aria-hidden
              className="anuncios-sell-popover__trigger-icon-image"
              loading="lazy"
              decoding="async"
            />
          </button>
          {row.marketplaceRaw === "mercado_livre" && row.externalId != null && String(row.externalId).trim() !== "" ? (
            <button
              type="button"
              className="anuncios-raiox-teste-trigger"
              aria-label="Abrir Raio-x teste (lista seller-promotions/items, mesma fonte da grid ML)"
              onClick={(e) => {
                e.stopPropagation();
                setRaioxTesteOpen(true);
              }}
            >
              Raio-x teste
            </button>
          ) : null}
        </span>
        <RaioxVendaTesteModal
          open={raioxTesteOpen}
          onClose={() => setRaioxTesteOpen(false)}
          listingExternalId={row.externalId}
          marketplaceRaw={row.marketplaceRaw}
          productTitle={row.adTitle}
        />
        {raioxOpen && typeof document !== "undefined"
          ? createPortal(
              <>
                {hasMlScenarioCompare ? (
                  <div
                    className="anuncios-pricing-modal__backdrop anuncios-raiox-compare-backdrop"
                    style={{ zIndex: 200099 }}
                    aria-hidden
                    onClick={() => setRaioxOpen(false)}
                  />
                ) : null}
                <div
                  ref={raioxShellRef}
                  className={[
                    RAIOX_PORTAL_SHELL_CLASS,
                    "anuncios-raiox-shell",
                    "anuncios-raiox-shell--portal",
                    "anuncios-raiox-shell--open",
                    hasMlScenarioCompare ? "anuncios-raiox-shell--ml-compare-fill" : "",
                    raioxMarketplaceTheme.shellModifierClass,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    ...(raioxPortalShellMetrics
                      ? buildRayxPortalShellPlacementStyle({
                          width: raioxPanelGeom.maxW,
                          height: raioxPanelGeom.maxH,
                          centerYOffset: raioxPortalShellMetrics.centerYOffset,
                          fitScale: hasMlScenarioCompare ? 1 : raioxPanelGeom.fitScale,
                          fixedHeight: hasMlScenarioCompare,
                        })
                      : {}),
                    ...getMarketplaceThemeCssVars(raioxMarketplaceTheme),
                  }}
                >
                  <div className="anuncios-raiox-shell__frame" aria-hidden />
                  {/** Logo vem do theme; fallback sem imagem só moldura neutra. */}
                  {raioxMarketplaceTheme.logoSrc ? (
                    <div className="anuncios-raiox-shell__badge">
                      <img
                        src={raioxMarketplaceTheme.logoSrc}
                        alt={raioxMarketplaceTheme.logoAlt ?? ""}
                        loading="lazy"
                        decoding="async"
                        className="anuncios-raiox-shell__badge-img"
                      />
                    </div>
                  ) : (
                    <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text">
                      <span className="anuncios-raiox-shell__badge-fallback">{raioxMarketplaceTheme.displayName}</span>
                    </div>
                  )}
                  <div
                    ref={raioxPanelRef}
                    className={[
                      "anuncios-sell-popover__panel",
                      "anuncios-sell-popover__panel--in-shell",
                      "anuncios-sell-popover__panel--raiox-centered",
                      hasMlScenarioCompare ? "anuncios-sell-popover__panel--ml-scenario-compare" : "",
                      hasMlScenarioCompare ? "anuncios-sell-popover__panel--compare-near-full" : "",
                      raioxMlBaselineOnlyLayout ? "anuncios-sell-popover__panel--raiox-ml-baseline-only" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    role="dialog"
                    aria-label="Raio-x da venda"
                    style={{
                      ["--raiox-caret-top"]: `${raioxPanelGeom.arrowTopPx}px`,
                    }}
                  >
                    {raioxCardBody}
                  </div>
                </div>
              </>,
              document.body,
            )
          : null}
        <RaioxOfferComparisonChartModal
          open={
            raioxOpen &&
            raioxChartOpen &&
            hasMlScenarioCompare &&
            mlScenariosForRaioxDisplay.length > 0
          }
          onClose={() => setRaioxChartOpen(false)}
          layerRef={raioxChartMiniRef}
          scenarios={mlScenariosForRaioxDisplay}
          listingTitle={raioxChartMiniListingTitle}
          thumbnailUrl={row.coverThumbnailUrl != null ? String(row.coverThumbnailUrl).trim() : null}
          listingIdDisplay={raioxListingIdDisplay}
          listingIdCopyText={raioxListingIdCopyText}
          skuLabel={row.sku && String(row.sku).trim() !== "" ? String(row.sku).trim() : null}
          skuCopyText={raioxSkuCopyText}
          onOpenPricing={() => {
            setRaioxChartOpen(false);
            setRaioxOpen(false);
            onOpenPricing?.(raioxChartMiniPricingRef.current);
          }}
        />
      </div>
      {promoDifferent && promoN != null && mainPriceNum != null ? (
        <p className="anuncios-sell-minimal__promo">
          Valor de venda <em>{formatCatalogBRL(mainPriceNum)}</em>
        </p>
      ) : null}
      {showWholesale ? (
        <div className="anuncios-sell-minimal__wholesale">
          <S7Icon name="info" size={14} strokeWidth={1.75} className="anuncios-sell-minimal__wholesale-icon" />
          <span>
            Você oferece preço de atacado: a partir de {row.wholesaleMinQuantity} un. por{" "}
            {formatBrlFromApiString(row.wholesalePriceBrl)}
          </span>
        </div>
      ) : null}
      <div className="anuncios-sell-minimal__net">
        <span className="anuncios-sell-minimal__net-label">Você recebe (marketplace)</span>
        <span className="anuncios-sell-minimal__net-value">{receiveDisplay}</span>
      </div>
    </div>
  );
}

const PRECIFICA_S7_ICON_SRC = precificaS7Icon;

/** Célula numérica compacta — valor + detalhe (paridade Vendas / tokens vendas-page__num-stack). */
function CatalogTableNumStack({ primary, secondary, primaryClassName = "", secondaryClassName = "" }) {
  const hasSecondary =
    secondary != null && (typeof secondary !== "string" || String(secondary).trim() !== "");
  const primaryNode =
    primaryClassName && typeof primary === "string" ? (
      <span className={primaryClassName}>{primary}</span>
    ) : (
      primary
    );
  const secondaryNode =
    typeof secondary === "string" ? (
      <span className={["vendas-page__num-stack-secondary", secondaryClassName].filter(Boolean).join(" ")}>
        {secondary}
      </span>
    ) : (
      secondary
    );
  return (
    <div className="vendas-page__num-stack">
      <span className="vendas-page__num-stack-primary">{primaryNode}</span>
      <span className="vendas-page__num-stack-secondary-slot" aria-hidden={hasSecondary ? undefined : true}>
        {hasSecondary ? secondaryNode : null}
      </span>
    </div>
  );
}

/**
 * @param {{
 *   row: ReturnType<typeof mapGridApiToCatalogRow>;
 *   onInformSku?: (r: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 *   onListingsRefresh?: () => void | Promise<void>;
 *   onOpenPricingIntelligence?: (row: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 *   onOpenListingRayX?: (row: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 *   minimal?: boolean;
 *   selected?: boolean;
 *   onToggleSelected?: (listingId: string) => void;
 *   selectionDisabled?: boolean;
 *   listingsWorkspaceMode?: import("../config/listingsPageModes.js").ListingsWorkspaceMode;
 *   rowClickAction?: import("../config/listingsPageModes.js").ListingsRowClickAction;
 *   catalogColumnLayout?: import("../config/listingsPageModes.js").ListingsColumnLayout;
 *   showPrecificaS7Column?: boolean;
 * }} props
 */
export function AdsCatalogRow({
  row,
  onInformSku,
  onListingsRefresh,
  onOpenPricingIntelligence,
  onOpenListingRayX,
  minimal = false,
  selected = false,
  onToggleSelected,
  selectionDisabled = false,
  listingsWorkspaceMode = "anuncios",
  rowClickAction: rowClickActionProp,
  catalogColumnLayout: catalogColumnLayoutProp,
  showPrecificaS7Column = true,
}) {
  const rowClickAction =
    rowClickActionProp ??
    (listingsWorkspaceMode === "precificacoes" ? "openPricingIntelligence" : "openListingRayX");
  const catalogColumnLayout =
    catalogColumnLayoutProp ?? (listingsWorkspaceMode === "precificacoes" ? "pricing_focus" : "full_catalog");
  const navigate = useNavigate();
  const pageModeConfig =
    listingsPageModes[listingsWorkspaceMode] ?? listingsPageModes[ADS_PAGE_MODE];
  const pricingIntelligenceOpenTarget = pageModeConfig.pricingIntelligenceOpenTarget ?? "same_tab";
  const pricingIntelligenceHref = useHref(
    `/precificacoes/inteligente/${encodeURIComponent(String(row.id))}`,
  );
  const precificaRef = useRef(null);
  const [quickCostsModalOpen, setQuickCostsModalOpen] = useState(false);

  const goToPricingIntelligencePage = useCallback(() => {
    if (pricingIntelligenceOpenTarget === "modal") {
      salvarLinhaPrecificacaoInteligenteCache(String(row.id), row);
      onOpenPricingIntelligence?.(row);
      return;
    }
    if (pricingIntelligenceOpenTarget === "new_tab") {
      salvarLinhaPrecificacaoInteligenteCache(String(row.id), row);
      const absUrl = new URL(pricingIntelligenceHref, window.location.href).toString();
      window.open(absUrl, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(pricingIntelligenceHref);
  }, [
    navigate,
    onOpenPricingIntelligence,
    pricingIntelligenceHref,
    pricingIntelligenceOpenTarget,
    row,
  ]);

  /** Clique no corpo da linha: `openPricingIntelligence` → página S7; caso contrário → gestão (produto / SKU / ML). */
  const handleRowShellClick = useCallback(() => {
    if (rowClickAction === "openPricingIntelligence") {
      goToPricingIntelligencePage();
      return;
    }
    if (rowClickAction === "openListingRayX") {
      onOpenListingRayX?.(row);
      return;
    }
    const linkAct = getListingProductLinkActions(row, onInformSku);
    if (shouldShowCadastrarCustosListaRow(row)) {
      setQuickCostsModalOpen(true);
      return;
    }
    if (row.productId && !linkAct.showVincular && !linkAct.showInformSkuMl) {
      navigate(`/produtos/${row.productId}/editar`);
      return;
    }
    if (linkAct.showInformSkuMl || linkAct.showVincular) {
      onInformSku?.(row);
      return;
    }
    if (row.listingPermalink) {
      window.open(row.listingPermalink, "_blank", "noopener,noreferrer");
    }
  }, [rowClickAction, navigate, onInformSku, onOpenListingRayX, goToPricingIntelligencePage, row]);

  const listingIdCopyText =
    row.listingNumber !== DASH ? String(row.listingNumber).trim() : "";
  const skuCopyText = row.sku != null ? String(row.sku).trim() : "";

  const rowPending = isAnunciosCatalogRowPending(row);
  const healthClass = HEALTH_BADGE_CLASS[row.healthBand] || HEALTH_BADGE_CLASS.unknown;

  const freightTitle = [
    row.shippingCostBrl ? formatBrlFromApiString(row.shippingCostBrl) : null,
    row.shippingLogisticType ? String(row.shippingLogisticType) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasQualityData =
    (row.listingQualityStatus != null && row.listingQualityStatus !== "") ||
    (row.listingQualityScore != null && Number.isFinite(Number(row.listingQualityScore)));
  const hasExperienceData = row.experienceStatus != null && String(row.experienceStatus).trim() !== "";

  const qualityLabel =
    row.listingQualityStatus ||
    (row.listingQualityScore != null && Number.isFinite(Number(row.listingQualityScore))
      ? `${Math.round(Number(row.listingQualityScore) <= 1 ? Number(row.listingQualityScore) * 100 : Number(row.listingQualityScore))}%`
      : null);

  const metaParts = [row.variationsCount != null ? `${row.variationsCount} var.` : null].filter(Boolean);

  const visitsCell =
    row.visitsAbsent ? DASH : row.visitsText == null ? SEM_DADO : row.visitsText;

  /** Unidades vendidas consolidadas no Suse7 (coluna Vendas na grade completa). */
  const soldUnits = Math.trunc(Number(row.salesCount)) || 0;

  const revenueCell = row.grossRevenueMissing ? DASH : formatBrlFromApiString(row.grossRevenueBrl);

  const linkAct = getListingProductLinkActions(row, onInformSku);
  const isAnunciosMainList = listingsWorkspaceMode === "anuncios";
  const grossSalesDec = parseApiDecimal(row.grossSalesBrl ?? row.grossRevenueBrl);
  const contributionProfitDec = parseApiDecimal(row.contributionProfitBrl ?? row.netProfitBrl);
  const contributionMarginDec = parseApiDecimal(row.contributionMarginPercent);
  const ticketFromApiDec = parseApiDecimal(row.averageTicketBrl);
  const repasseDec = parseApiDecimal(row.youReceiveBrl ?? row.netReceiveBrl);
  const soldUnitsInt = parseNonNegativeInt(row.salesCount);
  const soldUnitsText = row.salesCount != null ? String(row.salesCount) : DASH;
  const lucroBrlText =
    contributionProfitDec != null
      ? formatBrlFromApiString(contributionProfitDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2))
      : DASH;
  const marginPctNum =
    contributionMarginDec != null
      ? contributionMarginDec.toNumber()
      : contributionProfitDec != null && grossSalesDec != null && !grossSalesDec.isZero()
        ? contributionProfitDec.div(grossSalesDec).times(100).toNumber()
        : null;
  const hasListingSalesHistory =
    soldUnitsInt > 0 && grossSalesDec != null && !grossSalesDec.isZero() && !row.grossRevenueMissing;
  const listingFinancialToneClass = hasListingSalesHistory
    ? getVendasTableFinancialHealthToneClass(marginPctNum)
    : "vendas-page__fin--empty";
  const listingFinancialValueClass = catalogVendasFinValueClass(listingFinancialToneClass);
  const lucroPercentDisplay = formatCatalogPctVendasStyle(marginPctNum);
  const ticketMedioText =
    ticketFromApiDec != null
      ? formatBrlFromApiString(ticketFromApiDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2))
      : grossSalesDec != null && soldUnitsInt > 0
        ? formatBrlFromApiString(grossSalesDec.div(soldUnitsInt).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2))
        : DASH;
  const repasseText =
    repasseDec != null
      ? formatBrlFromApiString(repasseDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2))
      : DASH;
  const canonicalQualityScore = resolveCanonicalListingQualityScore(row);
  const precoAtualText =
    row.promotionActive && row.promotionSalePriceBrl
      ? formatBrlFromApiString(row.promotionSalePriceBrl)
      : row.effectiveSalePriceBrl
        ? formatBrlFromApiString(row.effectiveSalePriceBrl)
        : row.listingPriceBrl
          ? formatBrlFromApiString(row.listingPriceBrl)
          : DASH;
  const precoOriginalText =
    row.promotionActive && row.listingSalePriceBrl && row.promotionSalePriceBrl
      ? formatBrlFromApiString(row.listingSalePriceBrl)
      : null;
  const tipoAnuncioListaLabel = normalizarTipoAnuncioLista(row.listingTypeLabel);
  const tipoAnuncioListaTone = classeBadgeTipoAnuncioLista(tipoAnuncioListaLabel);
  const tipoAnuncioListaBadge = tipoAnuncioListaLabel ? (
    <span
      className={`anuncios-catalog__listing-type-badge anuncios-catalog__listing-type-badge--${tipoAnuncioListaTone}`}
      title={row.listingTypeTooltip || `Tipo do anúncio: ${tipoAnuncioListaLabel}`}
    >
      {tipoAnuncioListaLabel}
    </span>
  ) : null;

  const accountFields = pickCatalogAccountFields(row);

  if (minimal && listingsWorkspaceMode === PRICING_PAGE_MODE) {
    const state = resolvePrecificacoesListCurrentState(row);
    const { price } = state;

    return (
      <>
        <div
          className={montarClassesLinhaOperationalRowCard(
            [
              "anuncios-catalog__row",
              "anuncios-catalog__row--minimal",
              "anuncios-catalog__row--precificacoes-minimal",
              "anuncios-catalog--dense",
              rowPending && "anuncios-catalog__row--pending-product",
              "anuncios-catalog__row--no-precifica-col",
              "anuncios-catalog__row--interactive",
            ],
            { selected, critical: rowPending },
          )}
          role="row"
          onClick={handleRowShellClick}
        >
          <div
            className="products-catalog__cell anuncios-catalog__cell--select"
            data-col={PRECIFICACOES_COL.select}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <input
              type="checkbox"
              className="anuncios-catalog__select-checkbox"
              checked={selected}
              disabled={selectionDisabled}
              onChange={() => onToggleSelected?.(row.id)}
              aria-label={`Selecionar oferta ${row.listingNumberDisplay !== DASH ? row.listingNumberDisplay : row.id}`}
            />
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--thumb"
            data-col={PRECIFICACOES_COL.cover}
            title={row.adTitle}
          >
            <ListingCoverThumb url={row.coverThumbnailUrl} />
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--minimal-listing anuncios-catalog__cell--anuncio"
            data-col={PRECIFICACOES_COL.listing}
          >
            <div className="anuncios-ad-main">
              <S7CatalogListingHeadline
                className="anuncios-catalog__headline-vendas-parity"
                title={row.adTitle && row.adTitle !== DASH ? row.adTitle : "Sem título"}
                titleTooltip={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : ""}
                titleHref={row.listingPermalink}
                listingId={row.listingNumber === DASH ? "" : String(row.listingNumberDisplay || "")}
                listingIdCopyValue={listingIdCopyText}
                sku={row.sku ? String(row.sku) : ""}
                skuCopyValue={skuCopyText}
                showSkuWhenEmpty
                skuEmptyLabel="não informado"
                stopTitlePropagation
                copyListingFlashKey="ad-id"
                copySkuFlashKey="ad-sku"
              />
              <div
                className="anuncios-catalog__minimal-title-actions"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                {linkAct.showInformSkuMl ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Cadastrar SKU
                  </S7Button>
                ) : null}
                {linkAct.showVincular ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Vincular produto
                  </S7Button>
                ) : null}
                {shouldShowCadastrarCustosListaRow(row) ? (
                  <span className="anuncios-completar-inline">
                    <S7Tooltip content={COMPLETE_PRODUCT_TOOLTIP} placement="bottom-start" offset={6} wrap>
                      <span className="anuncios-completar-tooltip-anchor">
                        <S7Button
                          type="button"
                          variant="warning"
                          size="sm"
                          className="anuncios-ad-line-action-btn"
                          onClick={() => setQuickCostsModalOpen(true)}
                        >
                          {COMPLETE_PRODUCT_COSTS_LABEL}
                        </S7Button>
                      </span>
                    </S7Tooltip>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--listing-type"
            data-col={PRECIFICACOES_COL.listingType}
          >
            {tipoAnuncioListaBadge ?? <span className="anuncios-catalog__listing-type-empty">—</span>}
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--account" data-col={PRECIFICACOES_COL.account}>
            <S7CatalogAccountCell
              marketplaceAccountId={accountFields.marketplaceAccountId}
              accountAlias={accountFields.accountAlias}
              accountLogoUrl={accountFields.accountLogoUrl}
              compact
            />
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--channel" data-col={PRECIFICACOES_COL.channel}>
            <S7CatalogChannelCell
              marketplace={row.marketplaceRaw || row.marketplaceSlug}
              marketplaceLabel={row.marketplaceLabelDisplay}
            />
          </div>
          <CatalogMetricCell columnClass="products-catalog__cell--num" dataCol={PRECIFICACOES_COL.sales} variant="num">
            <CatalogMetricNumSingle>
              <span className="precificacoes-catalog__sales-cell">
                {formatarQuantidadeVendasListaPrecificacoesDaLinha(row)}
              </span>
            </CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--money"
            dataCol={PRECIFICACOES_COL.currentPrice}
            variant="money"
          >
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(price.currentPriceBrl)}
              secondary={price.regularPriceBrl ? price.regularPriceBrl : null}
              secondaryClassName="precificacoes-catalog__price-secondary"
            />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.commission} variant="money">
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(state.commissionBrlText)}
              secondary={state.commissionSecondary}
            />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.shipping} variant="money">
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(state.shippingBrlText)}
              secondary={state.shippingSecondary}
            />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.payout} variant="money">
            <CatalogTableNumStack primary={renderCatalogMoneyDisplay(state.payoutBrlText)} />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.cost} variant="money">
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(state.costBrlText)}
              secondary={state.costSecondary}
            />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.tax} variant="money">
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(state.taxBrlText)}
              secondary={state.taxSecondary}
            />
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--money anuncios-catalog__cell--precificacoes-result"
            dataCol={PRECIFICACOES_COL.profitBrl}
            variant="profit"
            toneClass={state.toneClass}
          >
            <CatalogMetricNumSingle>
              <span className="vendas-page__fin-value-row">
                <span className={`vendas-page__fin-value ${state.valueClass}`}>
                  {renderCatalogMoneyDisplay(state.lucroBrlText)}
                </span>
                {state.hasProjectedFinancials && state.toneClass !== "vendas-page__fin--empty" ? (
                  <CatalogProfitHealthHint toneClass={state.toneClass} />
                ) : null}
              </span>
            </CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--pct"
            dataCol={PRECIFICACOES_COL.profitPercent}
            variant="margin"
            toneClass={state.toneClass}
          >
            <CatalogMetricNumSingle>
              <span className="vendas-page__fin-value-row">
                <span className={`vendas-page__fin-value ${state.valueClass}`}>
                  {state.lucroPercentDisplay != null ? (
                    state.lucroPercentDisplay
                  ) : (
                    <CatalogMetricMissing />
                  )}
                </span>
                {state.hasProjectedFinancials && state.toneClass !== "vendas-page__fin--empty" ? (
                  <CatalogProfitHealthHint toneClass={state.toneClass} />
                ) : null}
              </span>
            </CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--num" dataCol={PRECIFICACOES_COL.competitors}>
            <S7Tooltip content={state.competitorsTooltip} placement="bottom" offset={6} wrap>
              <CatalogTableNumStack
                primary={
                  <span
                    className={`precificacoes-catalog__competitors-total${
                      state.competitorsCount > 0 ? " precificacoes-catalog__competitors-total--active" : ""
                    }`}
                  >
                    {state.competitorsCount}
                  </span>
                }
                secondary={
                  state.competitorsAbove > 0 || state.competitorsBelow > 0 ? (
                    <span className="precificacoes-catalog__competitors-secondary">
                      {state.competitorsAbove > 0 ? (
                        <span className="precificacoes-catalog__competitors-detail precificacoes-catalog__competitors-detail--above">
                          ↑ {state.competitorsAbove} acima
                        </span>
                      ) : null}
                      {state.competitorsBelow > 0 ? (
                        <span className="precificacoes-catalog__competitors-detail precificacoes-catalog__competitors-detail--below">
                          ↓ {state.competitorsBelow} abaixo
                        </span>
                      ) : null}
                    </span>
                  ) : null
                }
              />
            </S7Tooltip>
          </CatalogMetricCell>
        </div>
        <QuickProductCostsModal
          open={quickCostsModalOpen}
          productId={row.productId ? String(row.productId) : null}
          sku={row.sku}
          productTitle={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "Produto"}
          productImageUrl={row.coverThumbnailUrl ? String(row.coverThumbnailUrl) : null}
          onClose={() => setQuickCostsModalOpen(false)}
          onSaved={async () => {
            await onListingsRefresh?.();
          }}
        />
      </>
    );
  }

  if (minimal && isAnunciosMainList) {
    return (
      <>
        <div
          className={montarClassesLinhaOperationalRowCard(
            [
              "anuncios-catalog__row",
              "anuncios-catalog__row--minimal",
              "anuncios-catalog__row--anuncios-analytic",
              "anuncios-catalog--dense",
              rowPending && "anuncios-catalog__row--pending-product",
              !showPrecificaS7Column && "anuncios-catalog__row--no-precifica-col",
              "anuncios-catalog__row--interactive",
            ],
            { selected, critical: rowPending },
          )}
          role="row"
          onClick={handleRowShellClick}
        >
          <div
            className="products-catalog__cell anuncios-catalog__cell--select"
            data-col={ANUNCIOS_COL.select}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <input
              type="checkbox"
              className="anuncios-catalog__select-checkbox"
              checked={selected}
              disabled={selectionDisabled}
              onChange={() => onToggleSelected?.(row.id)}
              aria-label={`Selecionar anúncio ${row.listingNumberDisplay !== DASH ? row.listingNumberDisplay : row.id}`}
            />
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--thumb"
            data-col={ANUNCIOS_COL.cover}
            title={row.adTitle}
          >
            <ListingCoverThumb url={row.coverThumbnailUrl} />
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--minimal-listing anuncios-catalog__cell--anuncio"
            data-col={ANUNCIOS_COL.listing}
          >
            <div className="anuncios-ad-main">
              <S7CatalogListingHeadline
                className="anuncios-catalog__headline-vendas-parity"
                title={row.adTitle && row.adTitle !== DASH ? row.adTitle : "Sem título"}
                titleTooltip={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : ""}
                titleHref={row.listingPermalink}
                listingId={row.listingNumber === DASH ? "" : String(row.listingNumberDisplay || "")}
                listingIdCopyValue={listingIdCopyText}
                sku={row.sku ? String(row.sku) : ""}
                skuCopyValue={skuCopyText}
                showSkuWhenEmpty
                skuEmptyLabel="não informado"
                stopTitlePropagation
                copyListingFlashKey="ad-id"
                copySkuFlashKey="ad-sku"
              />
              <div
                className="anuncios-catalog__minimal-title-actions"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                {linkAct.showInformSkuMl ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Cadastrar SKU
                  </S7Button>
                ) : null}
                {linkAct.showVincular ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Vincular produto
                  </S7Button>
                ) : null}
                {linkAct.showCompletar && row.productId ? (
                  <span className="anuncios-completar-inline">
                    <S7Tooltip content={COMPLETE_PRODUCT_TOOLTIP} placement="bottom-start" offset={6} wrap>
                      <span className="anuncios-completar-tooltip-anchor">
                        <S7Button
                          type="button"
                          variant="warning"
                          size="sm"
                          className="anuncios-ad-line-action-btn"
                          onClick={() => setQuickCostsModalOpen(true)}
                        >
                          {COMPLETE_PRODUCT_COSTS_LABEL}
                        </S7Button>
                      </span>
                    </S7Tooltip>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div
            className="products-catalog__cell anuncios-catalog__cell--listing-type"
            data-col={ANUNCIOS_COL.listingType}
          >
            {tipoAnuncioListaBadge ?? <span className="anuncios-catalog__listing-type-empty">—</span>}
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--account" data-col={ANUNCIOS_COL.account}>
            <S7CatalogAccountCell
              marketplaceAccountId={accountFields.marketplaceAccountId}
              accountAlias={accountFields.accountAlias}
              accountLogoUrl={accountFields.accountLogoUrl}
              compact
            />
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--channel" data-col={ANUNCIOS_COL.channel}>
            <S7CatalogChannelCell
              marketplace={row.marketplaceRaw || row.marketplaceSlug}
              marketplaceLabel={row.marketplaceLabelDisplay}
            />
          </div>
          <CatalogMetricCell columnClass="products-catalog__cell--num" dataCol={ANUNCIOS_COL.sales}>
            <CatalogTableNumStack primary={soldUnitsText} />
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--money"
            dataCol={ANUNCIOS_COL.salePrice}
            variant="money"
          >
            <CatalogTableNumStack
              primary={renderCatalogMoneyDisplay(precoAtualText)}
              secondary={precoOriginalText ? precoOriginalText : null}
              secondaryClassName="precificacoes-catalog__price-secondary"
            />
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={ANUNCIOS_COL.revenue} variant="money">
            <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(revenueCell)}</CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={ANUNCIOS_COL.payout} variant="money">
            <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(repasseText)}</CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell columnClass="products-catalog__cell--money" dataCol={ANUNCIOS_COL.avgTicket} variant="money">
            <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(ticketMedioText)}</CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--money"
            dataCol={ANUNCIOS_COL.profitBrl}
            variant="profit"
            toneClass={listingFinancialToneClass}
          >
            <CatalogMetricNumSingle>
              <span className="vendas-page__fin-value-row">
                <span className={`vendas-page__fin-value ${listingFinancialValueClass}`}>
                  {renderCatalogMoneyDisplay(lucroBrlText)}
                </span>
                {hasListingSalesHistory && listingFinancialToneClass !== "vendas-page__fin--empty" ? (
                  <CatalogProfitHealthHint toneClass={listingFinancialToneClass} />
                ) : null}
              </span>
            </CatalogMetricNumSingle>
          </CatalogMetricCell>
          <CatalogMetricCell
            columnClass="products-catalog__cell--pct"
            dataCol={ANUNCIOS_COL.profitPercent}
            variant="margin"
            toneClass={listingFinancialToneClass}
          >
            <CatalogMetricNumSingle>
              <span className="vendas-page__fin-value-row">
                <span className={`vendas-page__fin-value ${listingFinancialValueClass}`}>
                  {lucroPercentDisplay != null ? lucroPercentDisplay : <CatalogMetricMissing />}
                </span>
                {hasListingSalesHistory && listingFinancialToneClass !== "vendas-page__fin--empty" ? (
                  <CatalogProfitHealthHint toneClass={listingFinancialToneClass} />
                ) : null}
              </span>
            </CatalogMetricNumSingle>
          </CatalogMetricCell>
          <div
            className="products-catalog__cell anuncios-catalog__cell--quality"
            data-col={ANUNCIOS_COL.quality}
          >
            <ListingQualityGauge scorePercent={canonicalQualityScore} variant="tableCompact" />
          </div>
        </div>
        <QuickProductCostsModal
          open={quickCostsModalOpen}
          productId={row.productId ? String(row.productId) : null}
          sku={row.sku}
          productTitle={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "Produto"}
          productImageUrl={row.coverThumbnailUrl ? String(row.coverThumbnailUrl) : null}
          onClose={() => setQuickCostsModalOpen(false)}
          onSaved={async () => {
            await onListingsRefresh?.();
          }}
        />
      </>
    );
  }

  if (minimal) {
    const isPrecificacoesMinimal = showPrecificaS7Column;
    return (
      <>
        <div
          className={montarClassesLinhaOperationalRowCard(
            [
              "anuncios-catalog__row",
              "anuncios-catalog__row--minimal",
              "anuncios-catalog--dense",
              rowPending && "anuncios-catalog__row--pending-product",
              !showPrecificaS7Column && "anuncios-catalog__row--no-precifica-col",
              isPrecificacoesMinimal && "anuncios-catalog__row--precificacoes-minimal",
              "anuncios-catalog__row--interactive",
            ],
            { selected, critical: rowPending },
          )}
          role="row"
          onClick={handleRowShellClick}
        >
          <div
            className="products-catalog__cell anuncios-catalog__cell--select"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <input
              type="checkbox"
              className="anuncios-catalog__select-checkbox"
              checked={selected}
              disabled={selectionDisabled}
              onChange={() => onToggleSelected?.(row.id)}
              aria-label={`Selecionar anúncio ${row.listingNumberDisplay !== DASH ? row.listingNumberDisplay : row.id}`}
            />
          </div>
          {showPrecificaS7Column ? (
            <div className="products-catalog__cell anuncios-catalog__cell--precifica-s7">
              <button
                ref={precificaRef}
                type="button"
                className="anuncios-precifica-s7-btn s7-tip s7-tip-bottom"
                data-tip="Precificação inteligente"
                aria-label="Abrir precificação inteligente"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPricingIntelligencePage();
                }}
              >
                <img
                  src={PRECIFICA_S7_ICON_SRC}
                  alt=""
                  className="anuncios-precifica-s7-btn__icon"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </div>
          ) : null}
          <div className="products-catalog__cell anuncios-catalog__cell--thumb" title={row.adTitle}>
            <ListingCoverThumb url={row.coverThumbnailUrl} />
          </div>
        <div className="products-catalog__cell anuncios-catalog__cell--minimal-listing">
          <div className="anuncios-ad-main">
            <S7CatalogListingHeadline
              className="anuncios-catalog__headline-vendas-parity"
              title={row.adTitle && row.adTitle !== DASH ? row.adTitle : "Sem título"}
              titleHref={row.listingPermalink}
              listingId={row.listingNumber === DASH ? "" : String(row.listingNumberDisplay || "")}
              listingIdCopyValue={listingIdCopyText}
              sku={row.sku ? String(row.sku) : ""}
              skuCopyValue={skuCopyText}
              showSkuWhenEmpty
              skuEmptyLabel="não informado"
              stopTitlePropagation
              copyListingFlashKey="ad-id"
              copySkuFlashKey="ad-sku"
            />
            <div className="anuncios-catalog__minimal-title-toolbar">
              <div className="anuncios-catalog__minimal-title-grow" aria-hidden />
              <div
                className="anuncios-catalog__minimal-title-actions"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                {linkAct.showInformSkuMl ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Cadastrar SKU
                  </S7Button>
                ) : null}
                {linkAct.showVincular ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Vincular produto
                  </S7Button>
                ) : null}
                {linkAct.showCompletar && row.productId ? (
                  <span className="anuncios-completar-inline">
                    <S7Tooltip
                      content={COMPLETE_PRODUCT_TOOLTIP}
                      placement="bottom-start"
                      offset={6}
                      wrap
                    >
                      <span className="anuncios-completar-tooltip-anchor">
                        <S7Button
                          type="button"
                          variant="warning"
                          size="sm"
                          className="anuncios-ad-line-action-btn"
                          onClick={() => setQuickCostsModalOpen(true)}
                        >
                          {COMPLETE_PRODUCT_COSTS_LABEL}
                        </S7Button>
                      </span>
                    </S7Tooltip>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="anuncios-ad-sku-row">
              {row.picturesCount != null ? (
                <>
                  <span className="anuncios-ad-meta-inline">
                    {row.picturesCount} {row.picturesCount === 1 ? "foto" : "fotos"}
                  </span>
                  <span className="anuncios-ad-sku-sep" aria-hidden>
                    ·
                  </span>
                </>
              ) : null}
              <span
                className="anuncios-ad-meta-inline"
                title="Visitas ao anúncio no Mercado Livre, quando a API expõe o dado."
              >
                {visitsCell === DASH ? "Sem dado visitas" : `${visitsCell} visitas`}
              </span>
              <span className="anuncios-ad-sku-sep" aria-hidden>
                ·
              </span>
              <span
                className="anuncios-ad-meta-inline"
                title="Unidades vendidas consolidadas nos pedidos importados no Suse7 (mesma base da coluna Vendas na vista completa)."
              >
                {soldUnits} {soldUnits === 1 ? "vendida" : "vendidas"}
              </span>
            </div>
          </div>
        </div>
          {isPrecificacoesMinimal ? (
            <>
              <div className="products-catalog__cell anuncios-catalog__cell--account">
                <S7CatalogAccountCell
                  marketplaceAccountId={row.marketplaceAccountId}
                  accountAlias={row.accountAlias}
                  accountLogoUrl={row.accountLogoUrl}
                  compact
                />
              </div>
              <div className="products-catalog__cell anuncios-catalog__cell--channel">
                <S7CatalogChannelCell
                  marketplace={row.marketplaceRaw || row.marketplaceSlug}
                  marketplaceLabel={row.marketplaceLabelDisplay}
                />
              </div>
              <div className="products-catalog__cell anuncios-catalog__cell--listing-type">
                {tipoAnuncioListaBadge ?? <span className="anuncios-catalog__listing-type-empty">—</span>}
              </div>
            </>
          ) : null}
        <div className="products-catalog__cell anuncios-catalog__cell--minimal-sell">
          <AdsMinimalSellColumn row={row} onInformSku={onInformSku} onOpenPricing={goToPricingIntelligencePage} />
        </div>
      </div>
      <QuickProductCostsModal
        open={quickCostsModalOpen}
        productId={row.productId ? String(row.productId) : null}
        sku={row.sku}
        productTitle={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "Produto"}
        productImageUrl={row.coverThumbnailUrl ? String(row.coverThumbnailUrl) : null}
        onClose={() => setQuickCostsModalOpen(false)}
        onSaved={async () => {
          await onListingsRefresh?.();
        }}
      />
      </>
    );
  }

  return (
    <>
    <div
      className={montarClassesLinhaOperationalRowCard(
        [
          "anuncios-catalog__row",
          "anuncios-catalog--dense",
          rowPending && "anuncios-catalog__row--pending-product",
          !showPrecificaS7Column && "anuncios-catalog__row--no-precifica-col",
          catalogColumnLayout === "pricing_focus" && "anuncios-catalog__row--pricing-columns",
          "anuncios-catalog__row--interactive",
        ],
        { selected, critical: rowPending },
      )}
      role="row"
      onClick={handleRowShellClick}
    >
      <div
        className="products-catalog__cell anuncios-catalog__cell--select"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <input
          type="checkbox"
          className="anuncios-catalog__select-checkbox"
          checked={selected}
          disabled={selectionDisabled}
          onChange={() => onToggleSelected?.(row.id)}
          aria-label={`Selecionar anúncio ${row.listingNumberDisplay !== DASH ? row.listingNumberDisplay : row.id}`}
        />
      </div>
      {showPrecificaS7Column ? (
        <div className="products-catalog__cell anuncios-catalog__cell--precifica-s7">
          <button
            ref={precificaRef}
            type="button"
            className="anuncios-precifica-s7-btn s7-tip s7-tip-bottom"
            data-tip="Precificação inteligente"
            aria-label="Abrir precificação inteligente"
            onClick={(e) => {
              e.stopPropagation();
              goToPricingIntelligencePage();
            }}
          >
            <img
              src={PRECIFICA_S7_ICON_SRC}
              alt=""
              className="anuncios-precifica-s7-btn__icon"
              loading="lazy"
              decoding="async"
            />
          </button>
        </div>
      ) : null}
      <div className="products-catalog__cell anuncios-catalog__cell--thumb" title={row.adTitle}>
        <ListingCoverThumb url={row.coverThumbnailUrl} />
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--listing-no s7-catalog-headline">
        {row.listingNumber === DASH ? (
          row.listingNumber
        ) : (
          <span className="s7-copy-group s7-catalog-headline__meta-ad">
            <span className="s7-catalog-headline__meta-value anuncios-ad-id-text">{row.listingNumberDisplay}</span>
            <S7CopyButton
              value={listingIdCopyText}
              ariaLabel={`Copiar ID do anúncio ${row.listingNumberDisplay}`}
              tooltipText="Copiar ID do anúncio"
              toastLabel="ID do anúncio"
              showToast={true}
              iconMode="unicode"
              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
              flashKey="ad-id-full"
              toastEventType="LISTING_ID_COPIED"
              toastFailEventType="LISTING_ID_COPY_FAILED"
              toastEntityType="marketplace_listing"
            />
          </span>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--title s7-catalog-headline">
        <div className="anuncios-catalog__title-heading-row">
          {row.adTitle && row.adTitle !== DASH && row.listingPermalink ? (
            <a
              href={row.listingPermalink}
              className="anuncios-catalog__ad-title anuncios-catalog__ad-title--inline anuncios-ad-title-link s7-catalog-headline__title-link s7-catalog-headline__title"
              target="_blank"
              rel="noreferrer noopener"
              title={`Abrir no Mercado Livre — ${row.adTitle}`}
              onClick={(e) => e.stopPropagation()}
            >
              {row.adTitle}
            </a>
          ) : (
            <span className="anuncios-catalog__ad-title anuncios-catalog__ad-title--inline s7-catalog-headline__title" title={row.adTitle}>
              {row.adTitle}
            </span>
          )}
          <div
            className="anuncios-catalog__title-heading-actions"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {linkAct.showInformSkuMl ? (
              <S7Button
                type="button"
                variant="warning"
                size="sm"
                className="anuncios-ad-line-action-btn"
                onClick={() => onInformSku?.(row)}
              >
                Cadastrar SKU
              </S7Button>
            ) : null}
            {linkAct.showVincular ? (
              <S7Button
                type="button"
                variant="warning"
                size="sm"
                className="anuncios-ad-line-action-btn"
                onClick={() => onInformSku?.(row)}
              >
                Vincular produto
              </S7Button>
            ) : null}
            {linkAct.showCompletar && row.productId ? (
              <span className="anuncios-completar-inline">
                <S7Tooltip
                  content={COMPLETE_PRODUCT_TOOLTIP}
                  placement="bottom-start"
                  offset={6}
                  wrap
                >
                  <span className="anuncios-completar-tooltip-anchor">
                    <S7Button
                      type="button"
                      variant="warning"
                      size="sm"
                      className="anuncios-ad-line-action-btn"
                      onClick={() => setQuickCostsModalOpen(true)}
                    >
                      {COMPLETE_PRODUCT_COSTS_LABEL}
                    </S7Button>
                  </span>
                </S7Tooltip>
              </span>
            ) : null}
          </div>
        </div>
        {row.sku ? (
          <div className="s7-catalog-headline__meta s7-catalog-headline__meta--stacked">
            <span
              className="s7-copy-group s7-catalog-headline__meta-sku"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span className="anuncios-ad-sku-label">SKU</span>
              <span className="anuncios-ad-sku-value s7-catalog-headline__meta-value">{row.sku}</span>
              {skuCopyText ? (
                <S7CopyButton
                  value={skuCopyText}
                  ariaLabel="Copiar SKU"
                  tooltipText="Copiar SKU"
                  toastLabel="SKU"
                  showToast={true}
                  iconMode="unicode"
                  flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                  flashKey="ad-sku-full"
                  toastEventType="LISTING_SKU_COPIED"
                  toastFailEventType="LISTING_SKU_COPY_FAILED"
                  toastEntityType="marketplace_listing"
                />
              ) : null}
            </span>
          </div>
        ) : null}
        {metaParts.length > 0 ? <span className="anuncios-catalog__ad-meta">{metaParts.join(" · ")}</span> : null}
        {row.financialAnalysisHint ? (
          <span className="anuncios-catalog__financial-hint" role="note">
            {row.financialAnalysisHint}
          </span>
        ) : null}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--product">
        {linkAct.showInformSkuMl || linkAct.showVincular || linkAct.showCompletar ? (
          <span className="anuncios-catalog__product-cell-muted" title="Use a ação na coluna do título.">
            —
          </span>
        ) : (
          <span className="anuncios-catalog__product-link" title={row.productName}>
            {row.productName}
          </span>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--account">
        <S7CatalogAccountCell
          marketplaceAccountId={row.marketplaceAccountId}
          accountAlias={row.accountAlias}
          accountLogoUrl={row.accountLogoUrl}
        />
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--channel">
        <S7CatalogChannelCell
          marketplace={row.marketplaceRaw || row.marketplaceSlug}
          marketplaceLabel={row.marketplaceLabelDisplay}
        />
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money"
        title="Preço de catálogo (listing_price_brl). Preço efetivo de venda: effective_sale_price_brl na API."
      >
        {row.listingPriceBrl != null && String(row.listingPriceBrl).trim() !== ""
          ? formatBrlFromApiString(row.listingPriceBrl)
          : row.price != null && Number.isFinite(row.price)
            ? formatCatalogBRL(row.price)
            : DASH}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--num"
        title={
          row.soldQuantityMlListing != null && row.soldQuantityMlListing !== row.salesCount
            ? `No ML o anúncio acumula ${row.soldQuantityMlListing} vendas; aqui mostra-se ${row.salesCount} unidade(s) já consolidada(s) nos pedidos importados (Suse7).`
            : undefined
        }
      >
        {row.salesCount != null ? row.salesCount : DASH}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money"
        title={row.grossRevenueMissing ? "Faturamento ainda não consolidado nas vendas importadas para este anúncio." : undefined}
      >
        {revenueCell}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatListingUnitNetBrl(row)}</div>
      <div className="products-catalog__cell products-catalog__cell--pct anuncios-catalog__cell--compact-num">
        {row.commissionPercent != null && row.commissionPercent !== "" ? (
          <span
            className={row.listingTypeTooltip ? "anuncios-catalog__cell-tooltip" : undefined}
            data-tooltip={row.listingTypeTooltip || undefined}
            tabIndex={row.listingTypeTooltip ? 0 : undefined}
          >
            {formatPercentFromApiString(row.commissionPercent)}
          </span>
        ) : (
          DASH
        )}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--compact-num">
        {formatBrlFromApiString(row.commissionAmountBrl)}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--compact-num"
        title={freightTitle || undefined}
      >
        {formatBrlFromApiString(row.shippingCostBrl)}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--promo">
        {formatBrlFromApiString(row.promotionPriceBrl)}
      </div>
      <div className="products-catalog__cell products-catalog__cell--num anuncios-catalog__cell--compact-num">
        {visitsCell}
      </div>
      {catalogColumnLayout !== "pricing_focus" ? (
        <>
          <div className="products-catalog__cell anuncios-catalog__cell--metric">
            {hasQualityData ? (
              <span
                className={`anuncios-catalog__metric-badge ${qualityBadgeClass(row.listingQualityStatus, row.listingQualityScore)}`}
              >
                {qualityLabel}
              </span>
            ) : (
              <span className="anuncios-catalog__metric-muted">Sem dado</span>
            )}
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--metric">
            {hasExperienceData ? (
              <span className={`anuncios-catalog__metric-badge ${experienceBadgeClass(row.experienceStatus)}`}>
                {row.experienceStatus}
              </span>
            ) : (
              <span className="anuncios-catalog__metric-muted">Sem dado</span>
            )}
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
        </>
      ) : null}
    </div>
    <QuickProductCostsModal
      open={quickCostsModalOpen}
      productId={row.productId ? String(row.productId) : null}
      sku={row.sku}
      productTitle={row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "Produto"}
      productImageUrl={row.coverThumbnailUrl ? String(row.coverThumbnailUrl) : null}
      onClose={() => setQuickCostsModalOpen(false)}
      onSaved={async () => {
        await onListingsRefresh?.();
      }}
    />
    </>
  );
}
