// ======================================================
// Conteúdo “Precificação inteligente” — UI + estado compartilhado (modal e página).
// Simulação e aplicação: somente via POST /api/pricing/* (sem lógica de dinheiro no JSX).
// ======================================================

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, buildApiUrl } from "../config/api";
import {
  applyPricingSimulationConfigToState,
  buildPricingSimulationConfigPayload,
  fetchListingPricingSimulationConfig,
  savePricingFinancialSettings,
} from "../utils/listingPricingSimulationConfig";
import { S7_CUSTOS_OPERACIONAIS_LABEL } from "../utils/s7CustosOperacionaisLabel.js";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../theme/marketplaceTheme.js";
import MarketplaceBadge from "./MarketplaceBadge.jsx";
import S7Button from "./ui/S7Button";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import { MercadoLivrePricingScenarioCompareChart } from "./MercadoLivrePricingScenarioCompareChart.jsx";
import { MercadoLivrePricingScenarioCompareGrid } from "./MercadoLivrePricingScenarioCompareGrid.jsx";
import { resolveMlScenarioTabId } from "./MercadoLivrePricingScenarioRaiox.jsx";
import {
  buildOrderedScenarioRows,
  buildRaioxScenariosFromSaleXrayModalContract,
  enrichRaioxScenariosWithListingPromotionMetadata,
  extractCanonicalMlScenarios,
  mergeListingGridRowIntoMlScenarios,
  saleXrayListingHintFromScenarios,
  shouldSaleXrayDebugTrace,
  wrapPricingScenariosApiAsSaleXrayModalPayload,
} from "./mercadoLivrePricingScenarioCompareShared.js";
import { PricingPageProductHeader } from "./pricing/PricingPageProductHeader.jsx";
import { PricingScenarioBestSummary } from "./pricing/PricingScenarioBestSummary.jsx";
import { pickDefaultPricingScenarioTabId } from "./pricing/pickDefaultPricingScenarioTabId.js";
import { ROTULO_LUCRO_RESULTADO } from "./pricing/pricingLucroMargemContribuicaoUi.js";
import { PricingIntelligenceWorkspaceTabs } from "./pricing/PricingIntelligenceWorkspaceTabs.jsx";
import { PricingIntelligenceTabRail } from "./pricing/PricingIntelligenceTabRail.jsx";
import { listMonitoredListingCompetitors } from "../services/competitionApi.js";
import { PricingIntelligenceCompetitorsPanel } from "./pricing/PricingIntelligenceCompetitorsPanel.jsx";
import {
  limparIndiceMonitoredListingsPrecificacao,
  resolverMonitoredListingIdPrecificacao,
} from "./pricing/resolverMonitoredListingIdPrecificacao.js";
import { PricingIntelligenceCompetitorsCompareCards } from "./pricing/PricingIntelligenceCompetitorsCompareCards.jsx";
import { PricingIntelligenceLoadingState } from "./pricing/PricingIntelligenceLoadingState.jsx";
import { PricingIntelligenceSectionErrorBoundary } from "./pricing/PricingIntelligenceSectionErrorBoundary.jsx";
import { resolverPrecoRealAnuncioPrecificacao } from "./pricing/precoInicialAnuncioPrecificacao.js";
import { PricingPageSalePriceSimulator } from "./pricing/PricingPageSalePriceSimulator.jsx";
import { PricingPageSimulationInputs } from "./pricing/PricingPageSimulationInputs.jsx";
import { logDiagnosticoPayloadIncompletoPrecificacao } from "./pricing/diagnosticoCenarioClassicoPrecificacao.js";
import { PricingScenarioDetail } from "./pricing/PricingScenarioDetail.jsx";
import S7ModalShareActionsToolbar from "../shared/modalActions/S7ModalShareActionsToolbar.jsx";
import { S7_PRICING_MODAL_SHARE_ACTION_LABELS } from "../shared/modalActions/s7ModalShareActions.js";
import { splitPricingPageScenarioRows } from "./pricing/pricingPageScenarioSplit.js";
import {
  logPiPromosAuditRaw,
  logPiPromosAuditRows,
  logPiPromosAuditPipeline,
} from "./pricing/pricingPromotionsAudit.js";
import { buildPiPromoFlowAuditFromScenario, logPiPromoFlowAudit } from "./pricing/piPromoFlowAudit.js";
import { normalizarErroPrecificacaoInteligente } from "../features/listings/pricing-intelligence/precificacaoInteligenteErros.js";
import {
  getBestScenarioId,
  scenarioHeadingForUi,
  sortPricingScenariosForUi,
} from "./pricing/pricingScenarioDecisionUi.js";

function PricingCoverThumbInner({ trimmed }) {
  const [broken, setBroken] = useState(false);
  const showImg = trimmed !== "" && !broken;
  return (
    <div className="anuncios-ad-thumb anuncios-pricing-modal__thumb">
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

/** Evita import circular com Anuncios.jsx (export de ListingCoverThumb). */
function PricingCoverThumb({ url }) {
  const trimmed = url != null && String(url).trim() !== "" ? String(url).trim() : "";
  return <PricingCoverThumbInner key={trimmed || "__empty__"} trimmed={trimmed} />;
}

const ADS_PRICING_DEBOUNCE_MS = 420;
/** KPI “Melhor cenário” na página: render desligado temporariamente (`mlBestKpiPayload` segue calculado). */
const SHOW_PRICING_PAGE_BEST_SCENARIO_KPI = false;
const DASH = "—";

function formatBrlLoose(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH;
  return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Decimal serializado pela API — só formatação (mesmo critério do Raio-x). */
function formatBrlFromApiString(s) {
  if (s == null || s === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return formatBrlLoose(n);
}

function formatNegativeBrlFromApiString(s) {
  if (s == null || s === "") return null;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return null;
  return `-${formatBrlLoose(Math.abs(n))}`;
}

/** @param {string | null | undefined} pct */
function formatCommissionPctForModal(pct) {
  if (pct == null || pct === "") return null;
  const n = Number(String(pct).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Subtítulo da tarifa: `sale_fee_label` do repasse simulado, senão tipo do anúncio + % (grid / np).
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown> | null} np
 */
function buildFeeSubtitleForPricing(row, np) {
  if (np?.sale_fee_label != null && String(np.sale_fee_label).trim() !== "") {
    return String(np.sale_fee_label).trim();
  }
  const label =
    row?.listingTypeLabel != null && String(row.listingTypeLabel).trim() !== ""
      ? String(row.listingTypeLabel).trim()
      : null;
  const pctRaw = np?.sale_fee_percent ?? row?.commissionPercent ?? null;
  const pct = formatCommissionPctForModal(pctRaw);
  if (label && pct) return `${label} ${pct}`;
  if (label) return `${label} ${DASH}`;
  if (pct) return pct;
  return null;
}

/** @param {Record<string, unknown> | null} np — `simulated.net_proceeds` */
function pickModalSaleFeeFromNp(np) {
  if (!np || typeof np !== "object") return DASH;
  if (np.sale_fee_amount != null && String(np.sale_fee_amount).trim() !== "") {
    return formatNegativeBrlFromApiString(np.sale_fee_amount) ?? DASH;
  }
  return DASH;
}

/** @param {Record<string, unknown> | null} np @param {Record<string, unknown> | null} row */
function pickSimulatedShippingLine(np, row) {
  const defaultTitle = "Custo de envio";
  const src =
    row != null &&
    row.shippingCostSource != null &&
    String(row.shippingCostSource).trim() !== ""
      ? String(row.shippingCostSource).trim().toLowerCase()
      : "";
  if (src === "unresolved") {
    const ctx =
      row.shippingCostContext === "free_for_buyer" || row.shippingCostContext === "buyer_pays"
        ? row.shippingCostContext
        : null;
    const sub =
      ctx === "free_for_buyer"
        ? "Grátis para o comprador"
        : ctx === "buyer_pays"
          ? "Por conta do comprador"
          : null;
    return { title: defaultTitle, value: DASH, sub };
  }
  if (!np || typeof np !== "object") {
    return { title: defaultTitle, value: DASH, sub: null };
  }
  const ctx = np.shipping_cost_context ?? np.ml_shipping_cost_context ?? null;
  const sub =
    ctx === "free_for_buyer"
      ? "Grátis para o comprador"
      : ctx === "buyer_pays"
        ? "Por conta do comprador"
        : null;
  const rawAmt = np.shipping_cost_amount_brl ?? np.shipping_cost_amount ?? np.ml_shipping_cost_amount_brl;
  let value = DASH;
  if (rawAmt != null && String(rawAmt).trim() !== "") {
    value = formatNegativeBrlFromApiString(rawAmt) ?? DASH;
  }
  const title =
    np.shipping_cost_label != null && String(np.shipping_cost_label).trim() !== ""
      ? String(np.shipping_cost_label).trim()
      : np.ml_shipping_cost_label != null && String(np.ml_shipping_cost_label).trim() !== ""
        ? String(np.ml_shipping_cost_label).trim()
        : defaultTitle;
  return { title, value, sub };
}

/** @param {Record<string, unknown> | null} np */
function formatSimulatedNetReceive(np) {
  if (!np || typeof np !== "object") return DASH;
  /** Canônicos primeiro; não priorizar `marketplace_payout` (legado / pode divergir do repasse oficial). */
  const raw =
    np.marketplace_payout_amount_brl ?? np.marketplace_payout_amount ?? np.net_proceeds_amount ?? null;
  if (raw != null && String(raw).trim() !== "") return formatBrlFromApiString(String(raw));
  return DASH;
}

/** Normaliza string pt-BR / en para envio à API (ex.: "1.234,56" → "1234.56"). */
function toApiDecimalString(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const noThousands = s.replace(/\./g, "").replace(",", ".");
  const n = Number(noThousands);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

// ======================================================
// Formatação de moeda BRL durante digitação (UI only).
// Entrada do usuário vira string pt-BR sem símbolo, ex.: 2199 -> 21,99.
// ======================================================
function formatBrlTypingInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   active: boolean;
 *   onClose: () => void;
 *   onApplied?: () => void | Promise<void>;
 *   variant?: "modal" | "page";
 *   panelStyle?: import("react").CSSProperties | null;
 *   caretTrailing?: boolean;
 *   onMlCompareWideChange?: (wide: boolean) => void;
 *   catalogRefreshing?: boolean;
 *   embeddedInModalShell?: boolean;
 * }} props
 */
export const PricingIntelligenceContent = forwardRef(function PricingIntelligenceContent(
  {
    row,
    active,
    onClose,
    onApplied,
    variant = "modal",
    panelStyle = null,
    caretTrailing = false,
    onMlCompareWideChange,
    catalogRefreshing = false,
    embeddedInModalShell = false,
  },
  ref,
) {
  const { addNotification } = useNotifications();
  const debounceRef = useRef(null);

  const [saleInput, setSaleInput] = useState("");
  const [minMarginInput, setMinMarginInput] = useState("7");
  const [minProfitInput, setMinProfitInput] = useState("");
  /** Parâmetros de simulação futuros (não enviados ao `/api/pricing/simulate` nesta etapa). */
  const [pageSimPlannedPromoPct, setPageSimPlannedPromoPct] = useState("");
  const [pageSimMlAdsPct, setPageSimMlAdsPct] = useState("");
  const [pageSimAffiliatesPct, setPageSimAffiliatesPct] = useState("");
  const [pageSimSafetyReservePct, setPageSimSafetyReservePct] = useState("");
  // ======================================================
  // Toggles dos campos opcionais da simulação (UI only).
  // Iniciam desativados e só habilitam input quando ligados.
  // ======================================================
  const [pageSimPlannedPromoEnabled, setPageSimPlannedPromoEnabled] = useState(false);
  const [pageSimMlAdsEnabled, setPageSimMlAdsEnabled] = useState(false);
  const [pageSimAffiliatesEnabled, setPageSimAffiliatesEnabled] = useState(false);
  const [pageSimSafetyReserveEnabled, setPageSimSafetyReserveEnabled] = useState(false);
  const [pricingSimConfigHydrated, setPricingSimConfigHydrated] = useState(false);
  const [financialSettingsSaving, setFinancialSettingsSaving] = useState(false);

  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [sim, setSim] = useState(null);
  const [simError, setSimError] = useState(null);

  const theme = getMarketplaceTheme(row.marketplaceRaw || row.marketplaceSlug);
  const isPage = variant === "page";

  useEffect(() => {
    if (!active || variant !== "page") return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, variant, onClose]);

  const [mlScenariosPayload, setMlScenariosPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [mlScenariosLoading, setMlScenariosLoading] = useState(false);
  const [mlScenariosError, setMlScenariosError] = useState(/** @type {string | null} */ (null));
  const [cardsIniciaisProntos, setCardsIniciaisProntos] = useState(false);
  const [concorrentesCenariosProntos, setConcorrentesCenariosProntos] = useState(false);
  const CONCORRENTES_SESSAO_CACHE_INICIAL = useMemo(
    () => ({
      listingKey: /** @type {string | null} */ (null),
      status: /** @type {"idle" | "loading" | "success" | "error"} */ ("idle"),
      competitors: /** @type {Record<string, unknown>[]} */ ([]),
      error: /** @type {string | null} */ (null),
      semMonitoredListing: false,
    }),
    [],
  );
  const [concorrentesSessionCache, setConcorrentesSessionCache] = useState(
    CONCORRENTES_SESSAO_CACHE_INICIAL,
  );
  const PI_TABS_SESSAO_INICIAL = useMemo(
    () => ({
      listingKey: /** @type {string | null} */ (null),
      precificacaoPronta: false,
      promocoesPronta: false,
      concorrentesPronta: false,
    }),
    [],
  );
  const [piTabsSessao, setPiTabsSessao] = useState(PI_TABS_SESSAO_INICIAL);
  const [piTabsMontadas, setPiTabsMontadas] = useState({
    promocoes: false,
    concorrentes: false,
  });
  const [precoVendendoComparacao, setPrecoVendendoComparacao] = useState(
    /** @type {number | null} */ (null),
  );
  const [selectedScenarioTabId, setSelectedScenarioTabId] = useState(/** @type {string | null} */ (null));
  const [pricingWorkspaceTab, setPricingWorkspaceTab] = useState(
    /** @type {"simulator" | "promotions" | "competitors"} */ ("simulator"),
  );

  const handleSaleInputChange = useCallback((nextRaw) => {
    setSaleInput(formatBrlTypingInput(nextRaw));
  }, []);

  useEffect(() => {
    if (!active) return;
    const p = row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null;
    setSaleInput(
      p != null
        ? Number(p).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "",
    );
    setSim(null);
    setSimError(null);
    setPageSimPlannedPromoPct("");
    setPageSimMlAdsPct("");
    setPageSimAffiliatesPct("");
    setPageSimSafetyReservePct("");
    setPageSimPlannedPromoEnabled(false);
    setPageSimMlAdsEnabled(false);
    setPageSimAffiliatesEnabled(false);
    setPageSimSafetyReserveEnabled(false);
  }, [active, row.id, row.price]);

  // ======================================================
  // Handlers de toggle: ao desligar, limpa o valor para
  // evitar envio acidental em integrações futuras.
  // ======================================================
  const handleTogglePlannedPromo = useCallback((enabled) => {
    setPageSimPlannedPromoEnabled(enabled);
    if (!enabled) setPageSimPlannedPromoPct("");
  }, []);

  const handleToggleMlAds = useCallback((enabled) => {
    setPageSimMlAdsEnabled(enabled);
    if (!enabled) setPageSimMlAdsPct("");
  }, []);

  const handleToggleAffiliates = useCallback((enabled) => {
    setPageSimAffiliatesEnabled(enabled);
    if (!enabled) setPageSimAffiliatesPct("");
  }, []);

  const handleToggleSafetyReserve = useCallback((enabled) => {
    setPageSimSafetyReserveEnabled(enabled);
    if (!enabled) setPageSimSafetyReservePct("");
  }, []);

  useEffect(() => {
    if (!active || !row.id) {
      setPricingSimConfigHydrated(false);
      return;
    }
    let cancelled = false;
    setPricingSimConfigHydrated(false);
    (async () => {
      const { ok, config } = await fetchListingPricingSimulationConfig(String(row.id));
      if (cancelled) return;
      if (ok) {
        applyPricingSimulationConfigToState(config, {
          setPlannedPromoEnabled: setPageSimPlannedPromoEnabled,
          setPlannedPromoPct: setPageSimPlannedPromoPct,
          setMlAdsEnabled: setPageSimMlAdsEnabled,
          setMlAdsPct: setPageSimMlAdsPct,
          setAffiliatesEnabled: setPageSimAffiliatesEnabled,
          setAffiliatesPct: setPageSimAffiliatesPct,
          setSafetyReserveEnabled: setPageSimSafetyReserveEnabled,
          setSafetyReservePct: setPageSimSafetyReservePct,
        });
      }
      setPricingSimConfigHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, row.id]);

  const resetarPiTabsSessao = useCallback(
    (/** @type {{ manterLayoutsMontados?: boolean } | undefined} */ opts) => {
      setPiTabsSessao(PI_TABS_SESSAO_INICIAL);
      if (!opts?.manterLayoutsMontados) {
        setPiTabsMontadas({ promocoes: false, concorrentes: false });
      }
    },
    [PI_TABS_SESSAO_INICIAL],
  );

  const handleSaveFinancialSettings = useCallback(async () => {
    if (!row.id) return;
    setFinancialSettingsSaving(true);
    const result = await savePricingFinancialSettings(String(row.id), {
      plannedPromoEnabled: pageSimPlannedPromoEnabled,
      plannedPromoPct: pageSimPlannedPromoPct,
      mlAdsEnabled: pageSimMlAdsEnabled,
      mlAdsPct: pageSimMlAdsPct,
      affiliatesEnabled: pageSimAffiliatesEnabled,
      affiliatesPct: pageSimAffiliatesPct,
      safetyReserveEnabled: pageSimSafetyReserveEnabled,
      safetyReservePct: pageSimSafetyReservePct,
    });
    setFinancialSettingsSaving(false);
    if (result.ok) {
      limparIndiceMonitoredListingsPrecificacao();
      setConcorrentesSessionCache(CONCORRENTES_SESSAO_CACHE_INICIAL);
      resetarPiTabsSessao({ manterLayoutsMontados: true });
      addNotification({
        severity: NOTIFICATION_SEVERITY.SUCCESS,
        title: "Configurações salvas",
        message: "Desconto, ML Ads, afiliados e reserva foram gravados para este anúncio.",
      });
      return;
    }
    addNotification({
      severity: NOTIFICATION_SEVERITY.ERROR,
      title: "Não foi possível salvar",
      message: result.error ?? "Tente novamente em instantes.",
    });
  }, [
    row.id,
    pageSimPlannedPromoEnabled,
    pageSimPlannedPromoPct,
    pageSimMlAdsEnabled,
    pageSimMlAdsPct,
    pageSimAffiliatesEnabled,
    pageSimAffiliatesPct,
    pageSimSafetyReserveEnabled,
    pageSimSafetyReservePct,
    addNotification,
    CONCORRENTES_SESSAO_CACHE_INICIAL,
    resetarPiTabsSessao,
  ]);

  useEffect(() => {
    setSelectedScenarioTabId(null);
  }, [row.id]);

  useEffect(() => {
    if (!active) {
      setMlScenariosPayload(null);
      setMlScenariosError(null);
      setMlScenariosLoading(false);
    }
  }, [active]);

  const carregarCenariosMl = useCallback(async () => {
    if (!active) return;
    if (row.marketplaceRaw !== "mercado_livre" || !row.externalId || String(row.externalId).trim() === "") {
      setMlScenariosError("Anúncio sem código MLB — sincronize a conta do Mercado Livre e tente novamente.");
      setMlScenariosPayload(null);
      setMlScenariosLoading(false);
      return;
    }
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
        setMlScenariosError("API não configurada (VITE_API_BASE_URL).");
        setMlScenariosPayload(null);
        return;
      }
      // Página PI: escopo completo de oportunidades (fluxo homologado antes do redesenho da aba).
      const saleXrayBody = isPage
        ? { listingExternalId: row.externalId, scenarioScope: "pricing_opportunities" }
        : { listingExternalId: row.externalId };
      const result = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleXrayBody),
      });
      const data = /** @type {Record<string, unknown> | undefined} */ (result.data);
      if (!result.ok) {
        const msg = normalizarErroPrecificacaoInteligente(
          result.error != null ? String(result.error) : "Não foi possível carregar os cenários.",
        );
        setMlScenariosError(msg);
        setMlScenariosPayload(null);
        if (import.meta.env.DEV) {
          console.warn("[S7 Precificação Inteligente] POST /api/ml/listings/pricing-scenarios falhou", {
            status: result.status,
            error: result.error,
            listingExternalId: row.externalId,
          });
        }
        return;
      }
      if (!data || data.ok !== true) {
        const msg = normalizarErroPrecificacaoInteligente(
          data?.error != null ? String(data.error) : "Não foi possível carregar os cenários.",
        );
        setMlScenariosError(msg);
        setMlScenariosPayload(null);
        if (import.meta.env.DEV) {
          console.warn("[S7 Precificação Inteligente] pricing-scenarios respondeu ok=false", {
            error: data?.error,
            listingExternalId: row.externalId,
          });
        }
        return;
      }
      const normalized = wrapPricingScenariosApiAsSaleXrayModalPayload(data);
      if (import.meta.env.DEV && data && typeof data === "object") {
        const promosApi = Array.isArray(data.promotion_scenarios) ? data.promotion_scenarios : [];
        for (const promo of promosApi) {
          if (!promo || typeof promo !== "object") continue;
          const r = /** @type {Record<string, unknown>} */ (promo);
          const name = r.promotion_name != null ? String(r.promotion_name) : "";
          if (!name.toLowerCase().includes("aumente") || !name.toLowerCase().includes("vendas")) continue;
          logPiPromoFlowAudit("frontend_after_pricing_scenarios_api", buildPiPromoFlowAuditFromScenario(r));
        }
      }
      if (import.meta.env.DEV && normalized && typeof normalized === "object") {
        const promosWrapped = Array.isArray(normalized.promotion_scenarios)
          ? normalized.promotion_scenarios
          : [];
        for (const promo of promosWrapped) {
          if (!promo || typeof promo !== "object") continue;
          const r = /** @type {Record<string, unknown>} */ (promo);
          const prom =
            r.promotion != null && typeof r.promotion === "object"
              ? /** @type {Record<string, unknown>} */ (r.promotion)
              : r;
          const name = prom.promotion_name != null ? String(prom.promotion_name) : "";
          if (!name.toLowerCase().includes("aumente") || !name.toLowerCase().includes("vendas")) continue;
          logPiPromoFlowAudit("frontend_after_wrapPricingScenariosApiAsSaleXrayModalPayload", {
            promotion_name: name,
            promotion_id: prom.promotion_id ?? null,
            type: prom.type ?? null,
            ref_id: prom.offer_id ?? null,
            promotion_price:
              r.pricing != null &&
              typeof r.pricing === "object" &&
              /** @type {Record<string, unknown>} */ (r.pricing).sale_price_brl != null
                ? /** @type {Record<string, unknown>} */ (r.pricing).sale_price_brl
                : null,
            payout:
              r.pricing != null &&
              typeof r.pricing === "object" &&
              /** @type {Record<string, unknown>} */ (r.pricing).net_receivable_brl != null
                ? /** @type {Record<string, unknown>} */ (r.pricing).net_receivable_brl
                : null,
            source_field_used: "sale_xray_modal_contract",
          });
        }
      }
      if (
        normalized == null ||
        normalized.from_sale_xray_modal !== true ||
        normalized.sale_xray_modal == null ||
        typeof normalized.sale_xray_modal !== "object"
      ) {
        setMlScenariosError(
          "Não foi possível montar o Raio-x a partir dos cenários deste anúncio. Sincronize o anúncio e tente de novo.",
        );
        setMlScenariosPayload(null);
        return;
      }
      if (shouldSaleXrayDebugTrace(normalized)) {
        console.log("[SALE_XRAY] response", normalized);
      }
      setMlScenariosPayload(normalized);
    } catch {
      setMlScenariosError(
        normalizarErroPrecificacaoInteligente("Não foi possível carregar os cenários."),
      );
      setMlScenariosPayload(null);
    } finally {
      setMlScenariosLoading(false);
    }
  }, [active, row.externalId, row.marketplaceRaw, isPage]);

  useEffect(() => {
    if (!active) return;
    setMlScenariosPayload(null);
    setMlScenariosError(null);
    setCardsIniciaisProntos(false);
    setConcorrentesCenariosProntos(false);
    limparIndiceMonitoredListingsPrecificacao();
    setConcorrentesSessionCache(CONCORRENTES_SESSAO_CACHE_INICIAL);
    resetarPiTabsSessao();
    setPrecoVendendoComparacao(null);
    void carregarCenariosMl();
  }, [
    active,
    row.id,
    carregarCenariosMl,
    CONCORRENTES_SESSAO_CACHE_INICIAL,
    resetarPiTabsSessao,
  ]);

  const handleCardsIniciaisProntosChange = useCallback((pronto) => {
    setCardsIniciaisProntos(pronto === true);
  }, []);

  const handleConcorrentesCenariosProntosChange = useCallback((pronto) => {
    setConcorrentesCenariosProntos(pronto === true);
  }, []);

  const handlePrecoVendendoComparacaoChange = useCallback((preco) => {
    setPrecoVendendoComparacao(
      preco != null && Number.isFinite(preco) && preco > 0 ? preco : null,
    );
  }, []);

  useEffect(() => {
    setPrecoVendendoComparacao(null);
  }, [row.id]);

  const runSimulate = useCallback(async () => {
    // Página cheia usa cenários ML (pricing-scenarios) como fonte do raio-x — simulate não é necessário
    // e evita alerta global quando o endpoint retorna erro interno sem impactar o layout carregado.
    if (isPage) return;

    const url = buildApiUrl("/api/pricing/simulate");
    if (!url) {
      setSimError("API não configurada.");
      return;
    }
    const candidate = toApiDecimalString(saleInput);
    if (!candidate) {
      setSimError("Informe um preço de venda.");
      setSim(null);
      return;
    }
    setLoading(true);
    setSimError(null);
    const minM = minMarginInput.trim() !== "" ? Number(String(minMarginInput).replace(",", ".")) : null;
    const minP = minProfitInput.trim() !== "" ? Number(String(minProfitInput).replace(",", ".")) : null;
    const res = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        marketplace: row.marketplaceRaw || "mercado_livre",
        listing_id: row.id,
        sale_price_candidate: candidate,
        min_margin_pct: Number.isFinite(minM) ? minM : null,
        min_profit_brl: Number.isFinite(minP) ? minP : null,
      },
    });
    setLoading(false);
    if (!res.ok) {
      setSim(null);
      const msg = normalizarErroPrecificacaoInteligente(res.error ?? "Falha na simulação");
      setSimError(msg);
      if (import.meta.env.DEV) {
        console.warn("[S7 Precificação Inteligente] POST /api/pricing/simulate falhou", {
          status: res.status,
          error: res.error,
          listingId: row.id,
        });
      }
      return;
    }
    setSim(res.data);
  }, [isPage, row.id, row.marketplaceRaw, saleInput, minMarginInput, minProfitInput]);

  useEffect(() => {
    if (!active) return;
    if (isPage) {
      setSimError(null);
      setSim(null);
      setLoading(false);
      return undefined;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      runSimulate();
    }, ADS_PRICING_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [active, isPage, saleInput, minMarginInput, minProfitInput, runSimulate]);

  const handleSuggestHealthy = () => {
    const s = sim?.suggested_price_brl ?? sim?.current?.pricing_context?.result?.break_even_price_brl;
    if (s == null || String(s).trim() === "") return;
    const n = Number(String(s).replace(",", "."));
    if (!Number.isFinite(n)) return;
    setSaleInput(
      n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  };

  const handleResetCurrent = () => {
    const p = row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null;
    if (p != null) {
      setSaleInput(
        Number(p).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    }
  };

  const handleApply = async () => {
    const url = buildApiUrl("/api/pricing/apply");
    if (!url) return;
    const candidate = toApiDecimalString(saleInput);
    if (!candidate) return;
    if (sim && !sim.can_apply_price) {
      setSimError("Preço bloqueado pela simulação — ajuste antes de aplicar.");
      return;
    }
    setApplyLoading(true);
    setSimError(null);
    const res = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        marketplace: row.marketplaceRaw || "mercado_livre",
        listing_id: row.id,
        new_sale_price: candidate,
      },
    });
    setApplyLoading(false);
    if (!res.ok) {
      const msg = normalizarErroPrecificacaoInteligente(res.error ?? "Não foi possível atualizar o preço.");
      setSimError(msg);
      addNotification({
        event_type: "LISTING_PRICE_APPLY_FAILED",
        entity_type: "marketplace_listing",
        title: "Falha ao atualizar preço",
        message: msg,
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }
    addNotification({
      event_type: "LISTING_PRICE_APPLIED",
      entity_type: "marketplace_listing",
      title: "Preço atualizado no Mercado Livre",
      message:
        res.data?.price_applied != null
          ? `Novo preço publicado: ${formatBrlLoose(res.data.price_applied)}.`
          : "O anúncio foi atualizado no marketplace.",
      severity: NOTIFICATION_SEVERITY.INFO,
    });
    if (typeof onApplied === "function") await onApplied();
    onClose();
  };

  const scenarioMode =
    row.marketplaceRaw === "mercado_livre" &&
    mlScenariosPayload != null &&
    mlScenariosError == null &&
    !mlScenariosLoading;

  /** Lista exibida no comparativo: `scenarios` da API ou só `baseline` quando não houver array. */
  const mlScenariosForCompare = useMemo(() => {
    if (!scenarioMode || !mlScenariosPayload || typeof mlScenariosPayload !== "object") return [];
    if (mlScenariosPayload.from_sale_xray_modal !== true) return [];
    try {
      const fromContract = buildRaioxScenariosFromSaleXrayModalContract(mlScenariosPayload);
      if (fromContract == null || fromContract.length === 0) {
        if (import.meta.env.DEV) {
          logDiagnosticoPayloadIncompletoPrecificacao({
            externalListingId: row.externalId != null ? String(row.externalId) : null,
            motivo: "buildRaioxScenariosFromSaleXrayModalContract retornou vazio",
            detalhe: {
              from_sale_xray_modal: mlScenariosPayload.from_sale_xray_modal === true,
              scenarios_count: Array.isArray(mlScenariosPayload.scenarios)
                ? mlScenariosPayload.scenarios.length
                : 0,
            },
          });
        }
        return [];
      }
      const merged = mergeListingGridRowIntoMlScenarios(fromContract, row);
      return enrichRaioxScenariosWithListingPromotionMetadata(merged, mlScenariosPayload, row);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[S7 PI][Payload] falha ao montar cenários para compare", err);
        logDiagnosticoPayloadIncompletoPrecificacao({
          externalListingId: row.externalId != null ? String(row.externalId) : null,
          motivo: "excecao_em_buildRaioxScenariosFromSaleXrayModalContract",
          detalhe: { message: err instanceof Error ? err.message : String(err) },
        });
      }
      return [];
    }
  }, [scenarioMode, mlScenariosPayload, row]);

  /** Cenários ML já trazem “Receita do marketplace”; não duplicar com o raio-x da simulação (`sim`). */
  const hideSimulatedMarketplaceRevenue = scenarioMode && mlScenariosForCompare.length > 0;

  const hasMlScenarioCompare = mlScenariosForCompare.length > 0;
  const requireMlScenarioContract =
    row.marketplaceRaw === "mercado_livre" &&
    row.externalId != null &&
    String(row.externalId).trim() !== "";

  const baseOrderedMlScenarioRows = useMemo(() => {
    if (!hasMlScenarioCompare || mlScenariosForCompare.length === 0) return [];
    return buildOrderedScenarioRows(mlScenariosForCompare);
  }, [hasMlScenarioCompare, mlScenariosForCompare]);

  const mlCompareDisplayRows = useMemo(() => {
    if (!hasMlScenarioCompare || baseOrderedMlScenarioRows.length === 0) return [];
    return isPage ? sortPricingScenariosForUi(baseOrderedMlScenarioRows) : baseOrderedMlScenarioRows;
  }, [hasMlScenarioCompare, isPage, baseOrderedMlScenarioRows]);

  /** Página: baseline (simulador) vs promoções ML — ver `pricingPageScenarioSplit.js`. */
  const { pricingPageBaselineRow, pricingPagePromotionRows: pricingPagePromotionRowsFromCompare } = useMemo(
    () => (isPage ? splitPricingPageScenarioRows(mlCompareDisplayRows) : { pricingPageBaselineRow: null, pricingPagePromotionRows: [] }),
    [isPage, mlCompareDisplayRows],
  );

  /** Aba Promoções: cenários completos do backend (`promotion_scenarios` / `scenarios`), sem rebuild sale-xray. */
  const pricingPagePromotionRows = useMemo(() => {
    if (!isPage || !mlScenariosPayload || typeof mlScenariosPayload !== "object") return [];
    const rec = /** @type {Record<string, unknown>} */ (mlScenariosPayload);
    /** @type {unknown[]} */
    let promos = [];
    if (Array.isArray(rec.promotion_scenarios) && rec.promotion_scenarios.length > 0) {
      promos = rec.promotion_scenarios;
    } else {
      promos = extractCanonicalMlScenarios(rec).filter((s) => {
        if (!s || typeof s !== "object") return false;
        const r = /** @type {Record<string, unknown>} */ (s);
        return r.is_baseline !== true && String(r.scenario_id ?? "").toLowerCase() !== "baseline";
      });
    }
    if (promos.length === 0) return pricingPagePromotionRowsFromCompare;
    return sortPricingScenariosForUi(buildOrderedScenarioRows(promos));
  }, [isPage, mlScenariosPayload, pricingPagePromotionRowsFromCompare]);

  useEffect(() => {
    if (!isPage || !scenarioMode) return;
    const listingId = row.externalId != null ? String(row.externalId) : null;
    logPiPromosAuditRaw(mlScenariosPayload, listingId);
    logPiPromosAuditPipeline({
      listingExternalId: listingId,
      afterBuildRaiox: mlScenariosForCompare.filter((s) => {
        if (!s || typeof s !== "object") return false;
        const r = /** @type {Record<string, unknown>} */ (s);
        return r.is_baseline !== true && String(r.scenario_id ?? "").toLowerCase() !== "baseline";
      }).length,
      afterOrdered: baseOrderedMlScenarioRows.filter((r) => r.group !== "baseline").length,
      afterSplit: pricingPagePromotionRows.length,
    });
    logPiPromosAuditRows(pricingPagePromotionRows, listingId);
  }, [
    isPage,
    scenarioMode,
    mlScenariosPayload,
    mlScenariosForCompare,
    baseOrderedMlScenarioRows,
    pricingPagePromotionRows,
    row.externalId,
  ]);

  const configuracaoFinanceiraSimulacao = useMemo(
    () => ({
      mlAdsEnabled: pageSimMlAdsEnabled,
      mlAdsPct: pageSimMlAdsPct,
      mlAdsLabel: "ML Ads",
      reserveEnabled: pageSimSafetyReserveEnabled,
      reservePct: pageSimSafetyReservePct,
      reserveLabel: S7_CUSTOS_OPERACIONAIS_LABEL,
      plannedPromoEnabled: pageSimPlannedPromoEnabled,
      plannedPromoPct: pageSimPlannedPromoPct,
      plannedPromoLabel: "Promoção",
      affiliatesEnabled: pageSimAffiliatesEnabled,
      affiliatesPct: pageSimAffiliatesPct,
      affiliatesLabel: "Afiliados",
    }),
    [
      pageSimMlAdsEnabled,
      pageSimMlAdsPct,
      pageSimSafetyReserveEnabled,
      pageSimSafetyReservePct,
      pageSimPlannedPromoEnabled,
      pageSimPlannedPromoPct,
      pageSimAffiliatesEnabled,
      pageSimAffiliatesPct,
    ],
  );

  /** Inputs de % — sem useMemo: evita remount a cada keystroke (valor sumia visualmente). */
  const renderPricingPageSimulationInputs = (/** @type {"simulator" | "promotions"} */ mode) => {
    if (!isPage) return null;
    return (
      <PricingPageSimulationInputs
        plannedPromoPct={pageSimPlannedPromoPct}
        onPlannedPromoPctChange={setPageSimPlannedPromoPct}
        plannedPromoEnabled={pageSimPlannedPromoEnabled}
        onPlannedPromoEnabledChange={handleTogglePlannedPromo}
        mlAdsPct={pageSimMlAdsPct}
        onMlAdsPctChange={setPageSimMlAdsPct}
        mlAdsEnabled={pageSimMlAdsEnabled}
        onMlAdsEnabledChange={handleToggleMlAds}
        affiliatesPct={pageSimAffiliatesPct}
        onAffiliatesPctChange={setPageSimAffiliatesPct}
        affiliatesEnabled={pageSimAffiliatesEnabled}
        onAffiliatesEnabledChange={handleToggleAffiliates}
        safetyReservePct={pageSimSafetyReservePct}
        onSafetyReservePctChange={setPageSimSafetyReservePct}
        safetyReserveEnabled={pageSimSafetyReserveEnabled}
        onSafetyReserveEnabledChange={handleToggleSafetyReserve}
        onSaveFinancialSettings={mode === "simulator" ? handleSaveFinancialSettings : undefined}
        saveFinancialSettingsLoading={financialSettingsSaving}
        mode={mode}
      />
    );
  };

  const mlScenarioRowsForTabsAndSelection = useMemo(
    () => (isPage ? pricingPagePromotionRows : mlCompareDisplayRows),
    [isPage, pricingPagePromotionRows, mlCompareDisplayRows],
  );

  const mlBestScenarioTabId = useMemo(() => {
    if (!isPage || !hasMlScenarioCompare) return null;
    const scenarios = isPage
      ? pricingPagePromotionRows.map((r) => r.scenario)
      : mlScenariosForCompare;
    if (scenarios.length === 0) return null;
    return getBestScenarioId(scenarios);
  }, [isPage, hasMlScenarioCompare, pricingPagePromotionRows, mlScenariosForCompare]);

  const mlChartScenarios = useMemo(() => {
    if (!hasMlScenarioCompare) return [];
    if (isPage) return pricingPagePromotionRows.map((r) => r.scenario);
    return mlScenariosForCompare;
  }, [hasMlScenarioCompare, isPage, pricingPagePromotionRows, mlScenariosForCompare]);

  const mlBestKpiPayload = useMemo(() => {
    if (!isPage || mlBestScenarioTabId == null || String(mlBestScenarioTabId).trim() === "") return null;
    const s = mlScenariosForCompare.find(
      (x) => (resolveMlScenarioTabId(x) || "baseline") === String(mlBestScenarioTabId).trim(),
    );
    if (!s || typeof s !== "object") return null;
    const rec = /** @type {Record<string, unknown>} */ (s);
    const res = rec.result != null && typeof rec.result === "object" ? /** @type {Record<string, unknown>} */ (rec.result) : null;
    const profitRaw = res?.profit_brl != null ? String(res.profit_brl).trim() : "";
    const marginRaw = res?.margin_pct != null ? String(res.margin_pct).trim() : "";
    if (profitRaw === "") return null;
    const profitN = Number(String(profitRaw).replace(",", "."));
    if (!Number.isFinite(profitN) || profitN <= 0) return null;
    return {
      title: scenarioHeadingForUi(s, "Preço de venda"),
      profitLabel: formatBrlFromApiString(profitRaw),
      marginLabel:
        marginRaw !== "" ? `${String(marginRaw).replace(".", ",")}%` : null,
    };
  }, [isPage, mlBestScenarioTabId, mlScenariosForCompare]);

  if (!SHOW_PRICING_PAGE_BEST_SCENARIO_KPI) {
    void mlBestKpiPayload;
  }

  const mlListingHintForAudit = useMemo(
    () => (hasMlScenarioCompare ? saleXrayListingHintFromScenarios(mlScenariosForCompare) : ""),
    [hasMlScenarioCompare, mlScenariosForCompare],
  );

  const mlScenarioTabIdsKey = useMemo(
    () =>
      mlScenarioRowsForTabsAndSelection
        .map(({ scenario }) => resolveMlScenarioTabId(scenario) || "baseline")
        .join("\0"),
    [mlScenarioRowsForTabsAndSelection],
  );

  const tabIdSet = useMemo(() => {
    const s = new Set();
    for (const { scenario } of mlScenarioRowsForTabsAndSelection) {
      s.add(resolveMlScenarioTabId(scenario) || "baseline");
    }
    return s;
  }, [mlScenarioRowsForTabsAndSelection]);

  const effectiveSelectedScenarioTabId = useMemo(() => {
    if (mlScenarioRowsForTabsAndSelection.length === 0) return "";
    if (selectedScenarioTabId != null && tabIdSet.has(selectedScenarioTabId)) return selectedScenarioTabId;
    return pickDefaultPricingScenarioTabId(mlScenarioRowsForTabsAndSelection);
  }, [mlScenarioRowsForTabsAndSelection, selectedScenarioTabId, tabIdSet]);

  useEffect(() => {
    if (!isPage || !hasMlScenarioCompare || mlScenarioRowsForTabsAndSelection.length === 0) return;
    const idSet = new Set(
      mlScenarioRowsForTabsAndSelection.map(({ scenario }) => resolveMlScenarioTabId(scenario) || "baseline"),
    );
    if (selectedScenarioTabId != null && idSet.has(selectedScenarioTabId)) return;
    setSelectedScenarioTabId(pickDefaultPricingScenarioTabId(mlScenarioRowsForTabsAndSelection));
  }, [isPage, hasMlScenarioCompare, mlScenarioTabIdsKey, mlScenarioRowsForTabsAndSelection, selectedScenarioTabId]);

  const handleSelectMlScenarioTabId = useCallback((tabId) => {
    setSelectedScenarioTabId(tabId);
  }, []);

  useEffect(() => {
    onMlCompareWideChange?.(hasMlScenarioCompare);
  }, [hasMlScenarioCompare, onMlCompareWideChange]);

  const mergedPanelRef = useCallback(
    (node) => {
      if (typeof ref === "function") ref(node);
      else if (ref != null && "current" in ref) ref.current = node;
    },
    [ref],
  );

  if (!active) return null;

  const simCtx = sim?.simulated?.pricing_context;
  const simRes = simCtx?.result != null && typeof simCtx.result === "object" ? simCtx.result : null;
  const simIc = simCtx?.internal_costs != null && typeof simCtx.internal_costs === "object" ? simCtx.internal_costs : null;
  const simUi =
    simCtx != null && typeof simCtx === "object" && simCtx.ui != null && typeof simCtx.ui === "object"
      ? /** @type {Record<string, unknown>} */ (simCtx.ui)
      : null;
  const block2Mode = simUi?.block2_mode != null ? String(simUi.block2_mode) : "no_product";
  const block3Mode = simUi?.block3_mode != null ? String(simUi.block3_mode) : "blocked";

  const np =
    sim?.simulated?.net_proceeds != null && typeof sim.simulated.net_proceeds === "object"
      ? /** @type {Record<string, unknown>} */ (sim.simulated.net_proceeds)
      : null;

  const feeSubTitle = buildFeeSubtitleForPricing(row, np);
  const modalSaleFeeDisplay = pickModalSaleFeeFromNp(np);
  const modalMlShippingLine = pickSimulatedShippingLine(np, row);
  const modalNetReceiveDisplay = formatSimulatedNetReceive(np);

  const showModalProductValue =
    (row.listOrOriginalPriceBrl != null && String(row.listOrOriginalPriceBrl).trim() !== "") ||
    (row.promotionActive !== true && row.price != null && Number.isFinite(Number(row.price)));
  const showModalPromoPrice =
    row.promotionActive === true &&
    row.promotionPriceBrl != null &&
    String(row.promotionPriceBrl).trim() !== "";
  const raioxPriceLinesPromoFirst = row.promotionActive === true && showModalPromoPrice && showModalProductValue;
  const modalBaseCommissionHighlightKey = showModalPromoPrice
    ? "promo"
    : showModalProductValue
      ? "product"
      : null;

  const simulatedSaleDisplay = (() => {
    if (np?.sale_price_effective != null && String(np.sale_price_effective).trim() !== "")
      return formatBrlFromApiString(String(np.sale_price_effective));
    if (np?.sale_price != null && String(np.sale_price).trim() !== "")
      return formatBrlFromApiString(String(np.sale_price));
    if (sim?.sale_price_candidate_brl != null && String(sim.sale_price_candidate_brl).trim() !== "")
      return formatBrlFromApiString(String(sim.sale_price_candidate_brl));
    return DASH;
  })();

  const taxPercentLabel =
    simIc?.tax_percent_label != null && String(simIc.tax_percent_label).trim() !== ""
      ? String(simIc.tax_percent_label)
      : null;

  const semRaw =
    simRes?.offer_status_semantic != null ? String(simRes.offer_status_semantic).trim() : "";
  const offerSemClass =
    ["critical", "danger", "acceptable", "great", "excellent"].includes(semRaw)
      ? `anuncios-sell-popover__offer-sem--${semRaw}`
      : "";

  /** Com grid ML, “Resultado” da simulação só exibe Δ lucro / avisos (custos e lucro por cenário vêm dos cards). */
  const showSimResultadoSection =
    (!hasMlScenarioCompare && !requireMlScenarioContract) ||
    (block3Mode === "ok" &&
      simRes != null &&
      (sim?.comparison?.profit_delta_brl != null ||
        (Array.isArray(sim?.warnings) && sim.warnings.length > 0)));

  const listingKeyConcorrentes =
    row?.id != null && String(row.id).trim() !== ""
      ? String(row.id).trim()
      : row?.externalId != null && String(row.externalId).trim() !== ""
        ? String(row.externalId).trim()
        : "";

  const marketplaceListingIdConcorrentes =
    row?.id != null && String(row.id).trim() !== "" ? String(row.id).trim() : null;

  const externalListingIdConcorrentes =
    row?.externalId != null && String(row.externalId).trim() !== ""
      ? String(row.externalId).trim()
      : row?.externalId != null
        ? String(row.externalId)
        : null;

  const precoNossoConcorrentes = useMemo(() => {
    if (!isPage) return null;
    const preco = resolverPrecoRealAnuncioPrecificacao({
      catalogRow: row,
      payload: mlScenariosPayload,
      baselineRow: pricingPageBaselineRow,
    });
    return preco.valor != null && preco.valor > 0 ? preco.valor : null;
  }, [isPage, row, mlScenariosPayload, pricingPageBaselineRow]);

  const precoReferenciaConcorrentes = useMemo(() => {
    if (precoVendendoComparacao != null && precoVendendoComparacao > 0) {
      return precoVendendoComparacao;
    }
    return precoNossoConcorrentes;
  }, [precoVendendoComparacao, precoNossoConcorrentes]);

  const concorrentesSessaoAlinhada =
    concorrentesSessionCache.listingKey === listingKeyConcorrentes;

  const concorrentesSessaoResolvida =
    concorrentesSessaoAlinhada &&
    (concorrentesSessionCache.status === "success" || concorrentesSessionCache.status === "error");

  const carregarConcorrentesSessao = useCallback(async () => {
    const chave = listingKeyConcorrentes;
    if (!chave) {
      setConcorrentesSessionCache({
        listingKey: null,
        status: "success",
        competitors: [],
        error: null,
        semMonitoredListing: true,
      });
      return;
    }

    setConcorrentesSessionCache((prev) => {
      if (prev.listingKey === chave && prev.status === "loading") return prev;
      return {
        listingKey: chave,
        status: "loading",
        competitors: [],
        error: null,
        semMonitoredListing: false,
      };
    });

    try {
      const monitoredListingId = await resolverMonitoredListingIdPrecificacao({
        marketplaceListingId: marketplaceListingIdConcorrentes,
        externalListingId: externalListingIdConcorrentes,
      });

      if (!monitoredListingId) {
        setConcorrentesSessionCache({
          listingKey: chave,
          status: "success",
          competitors: [],
          error: null,
          semMonitoredListing: true,
        });
        return;
      }

      const res = await listMonitoredListingCompetitors(monitoredListingId);
      if (res.ok) {
        const list = Array.isArray(res.competitors) ? res.competitors : [];
        setConcorrentesSessionCache({
          listingKey: chave,
          status: "success",
          competitors: list.slice(0, 6),
          error: null,
          semMonitoredListing: false,
        });
        return;
      }

      setConcorrentesSessionCache({
        listingKey: chave,
        status: "error",
        competitors: [],
        error: res.error || "Não foi possível carregar os concorrentes agora.",
        semMonitoredListing: false,
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível carregar os concorrentes agora.";
      setConcorrentesSessionCache({
        listingKey: chave,
        status: "error",
        competitors: [],
        error: msg,
        semMonitoredListing: false,
      });
    }
  }, [
    listingKeyConcorrentes,
    marketplaceListingIdConcorrentes,
    externalListingIdConcorrentes,
  ]);

  const handleConcorrentesRetry = useCallback(() => {
    limparIndiceMonitoredListingsPrecificacao();
    setConcorrentesSessionCache(CONCORRENTES_SESSAO_CACHE_INICIAL);
  }, [CONCORRENTES_SESSAO_CACHE_INICIAL]);

  useEffect(() => {
    if (!isPage || pricingWorkspaceTab !== "competitors") return;

    if (
      concorrentesSessionCache.listingKey === listingKeyConcorrentes &&
      (concorrentesSessionCache.status === "loading" ||
        concorrentesSessionCache.status === "success" ||
        concorrentesSessionCache.status === "error")
    ) {
      return;
    }

    void carregarConcorrentesSessao();
  }, [
    isPage,
    pricingWorkspaceTab,
    listingKeyConcorrentes,
    concorrentesSessionCache.listingKey,
    concorrentesSessionCache.status,
    carregarConcorrentesSessao,
  ]);

  useEffect(() => {
    if (pricingWorkspaceTab === "promotions") {
      setPiTabsMontadas((prev) => (prev.promocoes ? prev : { ...prev, promocoes: true }));
    }
    if (pricingWorkspaceTab === "competitors") {
      setPiTabsMontadas((prev) => (prev.concorrentes ? prev : { ...prev, concorrentes: true }));
    }
  }, [pricingWorkspaceTab]);

  useEffect(() => {
    if (!cardsIniciaisProntos) return;
    setPiTabsSessao((prev) => (prev.precificacaoPronta ? prev : { ...prev, precificacaoPronta: true }));
  }, [cardsIniciaisProntos]);

  useEffect(() => {
    if (pricingWorkspaceTab !== "promotions" || mlScenariosLoading) return;
    setPiTabsSessao((prev) => (prev.promocoesPronta ? prev : { ...prev, promocoesPronta: true }));
  }, [pricingWorkspaceTab, mlScenariosLoading]);

  useEffect(() => {
    if (!concorrentesSessaoResolvida || !concorrentesCenariosProntos) return;
    setPiTabsSessao((prev) => (prev.concorrentesPronta ? prev : { ...prev, concorrentesPronta: true }));
  }, [concorrentesSessaoResolvida, concorrentesCenariosProntos]);

  const renderListingTypeCompareCards = useCallback(
    (
      /** @type {{
       *   onCenariosProntosChange?: (pronto: boolean) => void;
       *   onPrecoVendendoComparacaoChange?: (preco: number | null) => void;
       *   permitirEdicaoPreco?: boolean;
       * }} */ opts = {},
    ) => {
      if (pricingPageBaselineRow == null) return null;
      return (
        <PricingIntelligenceCompetitorsCompareCards
          baselineRow={pricingPageBaselineRow}
          mlScenariosPayload={mlScenariosPayload}
          catalogRow={row}
          listingHintForAudit={mlListingHintForAudit}
          configuracaoFinanceira={configuracaoFinanceiraSimulacao}
          mlScenariosLoading={mlScenariosLoading}
          onCenariosProntosChange={opts.onCenariosProntosChange}
          onPrecoVendendoComparacaoChange={opts.onPrecoVendendoComparacaoChange}
          permitirEdicaoPreco={opts.permitirEdicaoPreco ?? true}
        />
      );
    },
    [
      pricingPageBaselineRow,
      mlScenariosPayload,
      row,
      mlListingHintForAudit,
      configuracaoFinanceiraSimulacao,
      mlScenariosLoading,
    ],
  );

  const handlePricingSharePlaceholder = useCallback(() => undefined, []);

  const pricingTabRail =
    isPage && hasMlScenarioCompare ? (
      <div className="pricing-intelligence-page__workspace-header-actions">
        {embeddedInModalShell ? (
          <div className="pricing-intelligence-page__workspace-share-row">
            <S7ModalShareActionsToolbar
              actionLabels={S7_PRICING_MODAL_SHARE_ACTION_LABELS}
              onAction={handlePricingSharePlaceholder}
            />
          </div>
        ) : null}
        <div className="pricing-intelligence-page__workspace-tab-rail-row">
          <PricingIntelligenceTabRail activeTab={pricingWorkspaceTab} onTabChange={setPricingWorkspaceTab} />
          <button
            type="button"
            className="pricing-intelligence-page__workspace-tab pricing-intelligence-page__workspace-tab--horizontal pricing-intelligence-page__workspace-tab-rail-save"
            disabled={financialSettingsSaving}
            aria-busy={financialSettingsSaving || undefined}
            onClick={handleSaveFinancialSettings}
          >
            {financialSettingsSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    ) : null;

  const aguardandoHydratacaoCards =
    isPage &&
    hasMlScenarioCompare &&
    pricingWorkspaceTab === "simulator" &&
    pricingPageBaselineRow != null &&
    !piTabsSessao.precificacaoPronta;

  const aguardandoConcorrentesTab =
    isPage &&
    hasMlScenarioCompare &&
    pricingWorkspaceTab === "competitors" &&
    pricingPageBaselineRow != null &&
    !piTabsSessao.concorrentesPronta;

  const aguardandoPromocoesTab =
    isPage &&
    pricingWorkspaceTab === "promotions" &&
    !piTabsSessao.promocoesPronta &&
    mlScenariosLoading === true;

  const aguardandoWorkspacePreparacao =
    aguardandoHydratacaoCards || aguardandoConcorrentesTab || aguardandoPromocoesTab;

  const pricingModalResultsStack = (
    <>
      {hasMlScenarioCompare || (isPage && requireMlScenarioContract) ? (
        <div className="anuncios-pricing-modal__current-scenarios">
          {isPage ? (
            <>
              {SHOW_PRICING_PAGE_BEST_SCENARIO_KPI && mlBestKpiPayload != null ? (
                <PricingScenarioBestSummary
                  title={mlBestKpiPayload.title}
                  profitLabel={mlBestKpiPayload.profitLabel}
                  marginLabel={mlBestKpiPayload.marginLabel}
                />
              ) : null}
              {mlScenariosLoading && !hasMlScenarioCompare ? (
                <div className="pricing-intelligence-page__workspace-shell pricing-intelligence-page__workspace-shell--tabs-horizontal pricing-intelligence-page__workspace-shell--tabs-in-right-col pricing-intelligence-page__workspace-shell--initial-loading">
                  <div className="pricing-intelligence-page__workspace-product-col">
                    <PricingPageProductHeader
                      row={row}
                      theme={theme}
                      compactVertical
                      listingsMetricsLoading={catalogRefreshing}
                    />
                  </div>
                  <div className="pricing-intelligence-page__workspace-main-col">
                    <PricingIntelligenceLoadingState />
                  </div>
                </div>
              ) : null}
              {mlScenariosError != null && String(mlScenariosError).trim() !== "" && !mlScenariosLoading ? (
                <div
                  className="pricing-intelligence-page__block-alert pricing-intelligence-page__block-alert--scenarios"
                  role="alert"
                >
                  <p>{String(mlScenariosError)}</p>
                  <S7Button type="button" variant="secondary" size="sm" onClick={() => void carregarCenariosMl()}>
                    Tentar novamente
                  </S7Button>
                </div>
              ) : null}
              {hasMlScenarioCompare ? (
              <>
                {aguardandoHydratacaoCards ? (
                  <div className="pricing-intelligence-page__workspace-shell pricing-intelligence-page__workspace-shell--tabs-horizontal pricing-intelligence-page__workspace-shell--tabs-in-right-col pricing-intelligence-page__workspace-shell--initial-loading">
                    <div className="pricing-intelligence-page__workspace-product-col">
                      <PricingPageProductHeader
                        row={row}
                        theme={theme}
                        compactVertical
                        listingsMetricsLoading={catalogRefreshing}
                      />
                    </div>
                    <div className="pricing-intelligence-page__workspace-main-col">
                      <PricingIntelligenceLoadingState />
                    </div>
                  </div>
                ) : null}
                {aguardandoConcorrentesTab ? (
                  <div className="pricing-intelligence-page__workspace-shell pricing-intelligence-page__workspace-shell--tabs-horizontal pricing-intelligence-page__workspace-shell--tabs-in-right-col pricing-intelligence-page__workspace-shell--competitors-tab pricing-intelligence-page__workspace-shell--competitors-initial-loading">
                    <div className="pricing-intelligence-page__workspace-product-col">
                      <PricingPageProductHeader
                        row={row}
                        theme={theme}
                        compactVertical
                        listingsMetricsLoading={catalogRefreshing}
                      />
                    </div>
                    <div className="pricing-intelligence-page__workspace-competitors-loading-span">
                      <PricingIntelligenceLoadingState
                        title="Carregando concorrentes..."
                        subtitle="Estamos comparando seu anúncio com os concorrentes do marketplace."
                      />
                    </div>
                  </div>
                ) : null}
                {aguardandoPromocoesTab ? (
                  <div className="pricing-intelligence-page__workspace-shell pricing-intelligence-page__workspace-shell--tabs-horizontal pricing-intelligence-page__workspace-shell--tabs-in-right-col pricing-intelligence-page__workspace-shell--promotions-tab pricing-intelligence-page__workspace-shell--promotions-initial-loading">
                    <div className="pricing-intelligence-page__workspace-product-col">
                      <PricingPageProductHeader
                        row={row}
                        theme={theme}
                        compactVertical
                        listingsMetricsLoading={catalogRefreshing}
                      />
                    </div>
                    <div className="pricing-intelligence-page__workspace-promotions-loading-span">
                      <PricingIntelligenceLoadingState
                        title="Carregando Promoções Inteligentes"
                        subtitle="Estamos carregando os cenários de promoção deste anúncio."
                      />
                    </div>
                  </div>
                ) : null}
                <div
                  className={[
                    "pricing-intelligence-page__workspace-mount",
                    aguardandoWorkspacePreparacao ? "pricing-intelligence-page__workspace-mount--preparing" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden={aguardandoWorkspacePreparacao ? true : undefined}
                >
              <PricingIntelligenceWorkspaceTabs
                activeTab={pricingWorkspaceTab}
                railHeader={
                  isPage ? (
                    <PricingPageProductHeader
                      row={row}
                      theme={theme}
                      compactVertical
                      listingsMetricsLoading={catalogRefreshing}
                    />
                  ) : null
                }
                simulatorPanel={
                  <PricingIntelligenceSectionErrorBoundary
                    sectionLabel="comparativo de preço de venda"
                    externalListingId={row.externalId != null ? String(row.externalId) : null}
                  >
                    {pricingPageBaselineRow != null ? (
                      <PricingPageSalePriceSimulator
                        embedded
                        baselineRow={pricingPageBaselineRow}
                        mlScenariosPayload={mlScenariosPayload}
                        catalogRow={row}
                        listingHintForAudit={mlListingHintForAudit}
                        configuracaoFinanceira={configuracaoFinanceiraSimulacao}
                        tabRailSlot={pricingTabRail}
                        mlScenariosLoading={mlScenariosLoading}
                        onCardsIniciaisProntosChange={
                          isPage ? handleCardsIniciaisProntosChange : undefined
                        }
                      >
                        {renderPricingPageSimulationInputs("simulator")}
                      </PricingPageSalePriceSimulator>
                    ) : (
                      <p className="anuncios-sell-popover__muted" role="status">
                        Cenário de preço de venda (baseline) indisponível para este anúncio.
                      </p>
                    )}
                  </PricingIntelligenceSectionErrorBoundary>
                }
                promotionsRows={pricingPagePromotionRows}
                promotionsListingHint={mlListingHintForAudit}
                promotionsMlScenariosPayload={mlScenariosPayload}
                promotionsBaselineRow={pricingPageBaselineRow}
                promotionsCatalogRow={row}
                promotionsConfiguracaoFinanceira={configuracaoFinanceiraSimulacao}
                promotionsTabRailSlot={pricingTabRail}
                competitorsTabRailSlot={pricingTabRail}
                competitorsCompareCards={renderListingTypeCompareCards({
                  onCenariosProntosChange: handleConcorrentesCenariosProntosChange,
                  onPrecoVendendoComparacaoChange: handlePrecoVendendoComparacaoChange,
                })}
                competitorsPanel={
                  <PricingIntelligenceCompetitorsPanel
                    listingKey={listingKeyConcorrentes}
                    status={
                      concorrentesSessaoAlinhada ? concorrentesSessionCache.status : "idle"
                    }
                    competitors={
                      concorrentesSessaoAlinhada ? concorrentesSessionCache.competitors : []
                    }
                    error={concorrentesSessaoAlinhada ? concorrentesSessionCache.error : null}
                    semMonitoredListing={
                      concorrentesSessaoAlinhada ? concorrentesSessionCache.semMonitoredListing : false
                    }
                    precoNosso={precoReferenciaConcorrentes}
                    onRetry={handleConcorrentesRetry}
                  />
                }
                mountPromotionsLayout={piTabsMontadas.promocoes}
                mountCompetitorsLayout={piTabsMontadas.concorrentes}
              />
                </div>
              </>
              ) : !mlScenariosLoading ? (
                <div className="pricing-intelligence-page__workspace-fallback">
                  <PricingPageProductHeader
                    row={row}
                    theme={theme}
                    compactVertical
                    listingsMetricsLoading={catalogRefreshing}
                  />
                  {!mlScenariosError ? (
                    <p className="anuncios-sell-popover__muted" role="status">
                      Cenários do Mercado Livre indisponíveis. Use &quot;Tentar novamente&quot; acima ou sincronize o
                      anúncio.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <MercadoLivrePricingScenarioCompareGrid
              scenarios={mlScenariosForCompare}
              baselineHeadingOverride="Preço de venda"
            />
          )}
        </div>
      ) : null}
      {!isPage && loading ? <p className="anuncios-pricing-modal__loading">Calculando…</p> : null}
      {!isPage && !loading && !sim ? (
        <p className="anuncios-sell-popover__result-placeholder">
          Ajuste o preço à esquerda para ver o raio-x simulado.
        </p>
      ) : null}
      {!isPage && !loading && sim ? (
        <>
          {!hideSimulatedMarketplaceRevenue && !requireMlScenarioContract ? (
            <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block">
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
                          <strong>{simulatedSaleDisplay}</strong>
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
                          <strong>{simulatedSaleDisplay}</strong>
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
                          <strong>{simulatedSaleDisplay}</strong>
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
                          <strong>{simulatedSaleDisplay}</strong>
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
          ) : null}

          {!hasMlScenarioCompare && !requireMlScenarioContract ? (
          <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
            <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>
            {block2Mode === "no_product" ? (
              <p className="anuncios-sell-popover__raiox-alert">
                Este anúncio não está vinculado a um produto.
              </p>
            ) : (
              <>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Custo do produto</span>
                    <strong
                      className={
                        simIc?.product_cost_brl != null && String(simIc.product_cost_brl).trim() !== ""
                          ? undefined
                          : "anuncios-sell-popover__value--empty"
                      }
                    >
                      {simIc?.product_cost_brl != null && String(simIc.product_cost_brl).trim() !== ""
                        ? formatBrlFromApiString(simIc.product_cost_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Impostos</span>
                    <strong
                      className={
                        simIc?.tax_amount_brl != null && String(simIc.tax_amount_brl).trim() !== ""
                          ? undefined
                          : "anuncios-sell-popover__value--empty"
                      }
                    >
                      {simIc?.tax_amount_brl != null && String(simIc.tax_amount_brl).trim() !== ""
                        ? formatBrlFromApiString(simIc.tax_amount_brl)
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
                        simIc?.operational_packaging_total_brl != null &&
                        String(simIc.operational_packaging_total_brl).trim() !== ""
                          ? undefined
                          : "anuncios-sell-popover__value--empty"
                      }
                    >
                      {simIc?.operational_packaging_total_brl != null &&
                      String(simIc.operational_packaging_total_brl).trim() !== ""
                        ? formatBrlFromApiString(simIc.operational_packaging_total_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                {block2Mode === "incomplete" && simUi?.block2_message != null ? (
                  <p className="anuncios-sell-popover__raiox-warn">
                    ⚠ {String(simUi.block2_message)}
                  </p>
                ) : null}
              </>
            )}
          </div>
          ) : null}

          {showSimResultadoSection && !isPage ? (
          <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
            <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
            {block3Mode === "ok" && simRes != null ? (
              <>
                {sim.comparison?.profit_delta_brl != null ? (
                  <p className="anuncios-pricing-modal__delta">
                    Δ Lucro: {formatBrlLoose(sim.comparison.profit_delta_brl)} (
                    {sim.comparison.profit_delta_pct != null
                      ? `${sim.comparison.profit_delta_pct}%`
                      : DASH}{" "}
                    vs atual) · Δ Margem:{" "}
                    {sim.comparison.margin_delta_pct != null
                      ? `${sim.comparison.margin_delta_pct} pp`
                      : DASH}
                  </p>
                ) : null}
                {Array.isArray(sim.warnings) && sim.warnings.length > 0 ? (
                  <ul className="anuncios-pricing-modal__warnings">
                    {sim.warnings.map((w) => (
                      <li key={w.code}>{w.message}</li>
                    ))}
                  </ul>
                ) : null}
                {!hasMlScenarioCompare && !requireMlScenarioContract ? (
                  <>
                    <div className="anuncios-sell-popover__block">
                      <div className="anuncios-sell-popover__line">
                        <span>{ROTULO_LUCRO_RESULTADO}</span>
                        <strong className={offerSemClass || undefined}>
                          {simRes?.profit_brl != null ? formatBrlFromApiString(simRes.profit_brl) : DASH}
                        </strong>
                      </div>
                    </div>
                    <div className="anuncios-sell-popover__block">
                      <div className="anuncios-sell-popover__line">
                        <span>Margem</span>
                        <strong className={offerSemClass || undefined}>
                          {simRes?.margin_pct != null && String(simRes.margin_pct).trim() !== ""
                            ? `${String(simRes.margin_pct).replace(".", ",")} %`
                            : DASH}
                        </strong>
                      </div>
                    </div>
                    <div className="anuncios-sell-popover__block">
                      <div className="anuncios-sell-popover__line">
                        <span>Preço mínimo saudável</span>
                        <strong>
                          {simRes?.break_even_price_brl != null &&
                          String(simRes.break_even_price_brl).trim() !== ""
                            ? formatBrlFromApiString(simRes.break_even_price_brl)
                            : DASH}
                        </strong>
                      </div>
                    </div>
                    <div className="anuncios-sell-popover__block">
                      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--status-offer">
                        <span>Status da oferta</span>
                        <strong className={offerSemClass || undefined}>
                          {simRes?.offer_status_label != null
                            ? String(simRes.offer_status_label)
                            : simRes?.offer_status != null
                              ? String(simRes.offer_status)
                              : DASH}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            ) : !hasMlScenarioCompare && !requireMlScenarioContract ? (
              <p className="anuncios-sell-popover__result-placeholder">
                {simUi?.block3_message != null && String(simUi.block3_message).trim() !== ""
                  ? String(simUi.block3_message)
                  : DASH}
              </p>
            ) : null}
          </div>
          ) : null}
        </>
      ) : null}
    </>
  );

  const pageTitleId = "pricing-intelligence-page-title";
  const modalTitleId = "ads-pricing-modal-title";

  const rootClassName = [
    "anuncios-sell-popover__panel",
    isPage ? "pricing-intelligence-page__content" : "anuncios-sell-popover__panel--in-shell",
    !isPage ? "anuncios-pricing-modal__panel" : "",
    !isPage && caretTrailing ? "anuncios-sell-popover__panel--caret-trailing" : "",
    hasMlScenarioCompare && isPage ? "pricing-intelligence-page__content--ml-scenario-compare" : "",
    hasMlScenarioCompare && isPage ? "pricing-intelligence-page__content--scenario-rail" : "",
    hasMlScenarioCompare && isPage ? "pricing-intelligence-page__content--compare-near-full" : "",
    hasMlScenarioCompare && !isPage ? "anuncios-pricing-modal__panel--ml-scenario-compare" : "",
    hasMlScenarioCompare && !isPage ? "anuncios-pricing-modal__panel--compare-near-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainGrid = (
    <div
      className={["anuncios-pricing-modal__main-grid", isPage ? "pricing-intelligence-page__main-grid" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {!isPage ? (
        <div className="anuncios-pricing-modal__col anuncios-pricing-modal__col--inputs">
          <div className="anuncios-pricing-modal__hero">
            <PricingCoverThumb url={row.coverThumbnailUrl} />
            <div className="anuncios-pricing-modal__hero-text">
              <span className="anuncios-pricing-modal__hero-title" title={row.adTitle}>
                {row.adTitle}
              </span>
              <span className="anuncios-pricing-modal__hero-meta">
                SKU {row.sku && String(row.sku).trim() !== "" ? row.sku : "—"} · Preço atual {formatBrlLoose(row.price)}
              </span>
              <div className="anuncios-pricing-modal__hero-mkt">
                <MarketplaceBadge marketplace={row.marketplaceRaw || row.marketplaceSlug} />
              </div>
            </div>
          </div>

          <div className="anuncios-sell-popover__section">
            <h4 className="anuncios-sell-popover__section-title">Simulação</h4>
            <div className="anuncios-pricing-modal__field">
              <label htmlFor="ads-pricing-sale">Novo valor de venda (R$)</label>
              <S7Input
                id="ads-pricing-sale"
                value={saleInput}
                onChange={(e) => setSaleInput(e.target.value)}
                placeholder="0,00"
                autoComplete="off"
              />
            </div>
            <div className="anuncios-pricing-modal__field-row">
              <div className="anuncios-pricing-modal__field">
                <label htmlFor="ads-pricing-min-margin">Margem mínima desejada (%)</label>
                <S7Input
                  id="ads-pricing-min-margin"
                  value={minMarginInput}
                  onChange={(e) => setMinMarginInput(e.target.value)}
                  placeholder="ex.: 7"
                />
              </div>
              <div className="anuncios-pricing-modal__field">
                <label htmlFor="ads-pricing-min-profit">Lucro mínimo (R$) — opcional</label>
                <S7Input
                  id="ads-pricing-min-profit"
                  value={minProfitInput}
                  onChange={(e) => setMinProfitInput(e.target.value)}
                  placeholder="opcional"
                />
              </div>
            </div>
            <div className="anuncios-pricing-modal__actions-inline">
              <S7Button type="button" variant="secondary" size="sm" onClick={handleSuggestHealthy}>
                Sugerir preço saudável
              </S7Button>
              <S7Button type="button" variant="secondary" size="sm" onClick={handleResetCurrent}>
                Usar preço atual
              </S7Button>
            </div>
          </div>

          {hasMlScenarioCompare ? (
            <div className="anuncios-pricing-modal__ml-chart-slot">
              <MercadoLivrePricingScenarioCompareChart
                scenarios={mlChartScenarios}
                selectedScenarioTabId={null}
                preserveScenarioDisplayOrder={false}
              />
            </div>
          ) : null}

          {simError ? (
            <p className="anuncios-pricing-modal__error" role="alert">
              {simError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="anuncios-pricing-modal__col anuncios-pricing-modal__col--results">
              {!isPage && mlScenariosLoading ? (
                <p className="anuncios-pricing-modal__loading" role="status">
                  Carregando cenários atuais (ML)…
                </p>
              ) : null}
              {!isPage && simError ? (
                <p className="anuncios-pricing-modal__error" role="alert">
                  {simError}
                </p>
              ) : null}
              {!isPage && mlScenariosError != null && String(mlScenariosError).trim() !== "" ? (
                <p className="anuncios-pricing-modal__error" role="alert">
                  {String(mlScenariosError)}
                </p>
              ) : null}
              {requireMlScenarioContract && !mlScenariosLoading && !hasMlScenarioCompare ? (
                <p className="anuncios-pricing-modal__error" role="status">
                  Contrato canônico de cenários indisponível. O modal ML não aplica fallback local.
                </p>
              ) : null}
              <div className="anuncios-pricing-modal__results-panel">{pricingModalResultsStack}</div>
      </div>
    </div>
  );

  return (
    <div
      ref={mergedPanelRef}
      className={rootClassName}
      role={isPage ? "region" : "dialog"}
      aria-labelledby={isPage ? pageTitleId : modalTitleId}
      style={{
        ...(isPage ? getMarketplaceThemeCssVars(theme) : {}),
        ...(panelStyle || {}),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isPage ? (
        <h2 id={pageTitleId} className="pricing-intelligence-page__visually-hidden">
          Precificação inteligente
        </h2>
      ) : hasMlScenarioCompare ? (
        <div className="anuncios-pricing-modal__head-row">
          <h3 id={modalTitleId} className="anuncios-sell-popover__title">
            Precificação inteligente
          </h3>
          <button type="button" className="anuncios-compare-modal__close" onClick={onClose} aria-label="Fechar">
            <S7Icon name="close" size={18} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <h3 id={modalTitleId} className="anuncios-sell-popover__title">
          Precificação inteligente
        </h3>
      )}
      {!isPage ? (
        <p className="anuncios-sell-popover__subtitle">Simule o cenário e publique no marketplace</p>
      ) : null}

      {isPage ? <div className="pricing-intelligence-page__body">{mainGrid}</div> : mainGrid}

      {!isPage ? (
        <div className="anuncios-pricing-modal__footer">
          <S7Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </S7Button>
          <S7Button
            type="button"
            variant="primary"
            disabled={applyLoading || !sim?.can_apply_price || loading}
            loading={applyLoading}
            onClick={handleApply}
          >
            Atualizar no Mercado Livre
          </S7Button>
        </div>
      ) : null}
    </div>
  );
});

PricingIntelligenceContent.displayName = "PricingIntelligenceContent";

export default PricingIntelligenceContent;
