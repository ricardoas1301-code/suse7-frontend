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
  mergeListingGridRowIntoMlScenarios,
  saleXrayListingHintFromScenarios,
  shouldSaleXrayDebugTrace,
  wrapPricingScenariosApiAsSaleXrayModalPayload,
} from "./mercadoLivrePricingScenarioCompareShared.js";
import { PricingPageProductHeader } from "./pricing/PricingPageProductHeader.jsx";
import { PricingScenarioBestSummary } from "./pricing/PricingScenarioBestSummary.jsx";
import { pickDefaultPricingScenarioTabId } from "./pricing/pickDefaultPricingScenarioTabId.js";
import { PricingIntelligenceWorkspaceTabs } from "./pricing/PricingIntelligenceWorkspaceTabs.jsx";
import { PricingPageSalePriceSimulator } from "./pricing/PricingPageSalePriceSimulator.jsx";
import { PricingPageSimulationInputs } from "./pricing/PricingPageSimulationInputs.jsx";
import { PricingScenarioDetail } from "./pricing/PricingScenarioDetail.jsx";
import { PricingScenarioRail } from "./pricing/PricingScenarioRail.jsx";
import { splitPricingPageScenarioRows } from "./pricing/pricingPageScenarioSplit.js";
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
 * }} props
 */
export const PricingIntelligenceContent = forwardRef(function PricingIntelligenceContent(
  { row, active, onClose, onApplied, variant = "modal", panelStyle = null, caretTrailing = false, onMlCompareWideChange },
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
  const [selectedScenarioTabId, setSelectedScenarioTabId] = useState(/** @type {string | null} */ (null));
  const [pricingWorkspaceTab, setPricingWorkspaceTab] = useState(/** @type {"simulator" | "promotions"} */ ("simulator"));

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

  useEffect(() => {
    if (!active) return;
    // Evita flash de cenários anteriores ao trocar de anúncio no modal.
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
        const saleXrayBody =
          variant === "page"
            ? { listingExternalId: row.externalId, scenarioScope: "pricing_opportunities" }
            : { listingExternalId: row.externalId };
        const result = await apiFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleXrayBody),
        });
        const data = /** @type {Record<string, unknown> | undefined} */ (result.data);
        if (!result.ok) {
          if (!cancelled) {
            setMlScenariosError(
              result.error != null ? String(result.error) : "Não foi possível carregar os cenários.",
            );
            setMlScenariosPayload(null);
          }
          return;
        }
        if (!data || data.ok !== true) {
          if (!cancelled) {
            setMlScenariosError(
              data?.error != null ? String(data.error) : "Não foi possível carregar os cenários.",
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
          setMlScenariosError("Não foi possível carregar os cenários.");
          setMlScenariosPayload(null);
        }
      } finally {
        if (!cancelled) setMlScenariosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, row.externalId, row.marketplaceRaw, variant]);

  const runSimulate = useCallback(async () => {
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
      setSimError(res.error ?? "Falha na simulação");
      return;
    }
    setSim(res.data);
  }, [row.id, row.marketplaceRaw, saleInput, minMarginInput, minProfitInput]);

  useEffect(() => {
    if (!active) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      runSimulate();
    }, ADS_PRICING_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [active, saleInput, minMarginInput, minProfitInput, runSimulate]);

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
      const msg = res.error ?? "Não foi possível atualizar o preço.";
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
    const fromContract = buildRaioxScenariosFromSaleXrayModalContract(mlScenariosPayload);
    if (fromContract == null || fromContract.length === 0) return [];
    const merged = mergeListingGridRowIntoMlScenarios(fromContract, row);
    return enrichRaioxScenariosWithListingPromotionMetadata(merged, mlScenariosPayload, row);
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
  const { pricingPageBaselineRow, pricingPagePromotionRows } = useMemo(
    () => (isPage ? splitPricingPageScenarioRows(mlCompareDisplayRows) : { pricingPageBaselineRow: null, pricingPagePromotionRows: [] }),
    [isPage, mlCompareDisplayRows],
  );

  const pricingPageSimulationInputs = useMemo(() => {
    if (!isPage) return null;
    return (
      <PricingPageSimulationInputs
        salePrice={saleInput}
        onSalePriceChange={handleSaleInputChange}
        desiredMarginPct={minMarginInput}
        onDesiredMarginPctChange={setMinMarginInput}
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
        onSaveFinancialSettings={handleSaveFinancialSettings}
        saveFinancialSettingsLoading={financialSettingsSaving}
        mode="simulator"
      />
    );
  }, [
    isPage,
    saleInput,
    minMarginInput,
    pageSimPlannedPromoPct,
    pageSimMlAdsPct,
    pageSimAffiliatesPct,
    pageSimSafetyReservePct,
    pageSimPlannedPromoEnabled,
    pageSimMlAdsEnabled,
    pageSimAffiliatesEnabled,
    pageSimSafetyReserveEnabled,
    handleTogglePlannedPromo,
    handleToggleMlAds,
    handleToggleAffiliates,
    handleToggleSafetyReserve,
    handleSaleInputChange,
    handleSaveFinancialSettings,
    financialSettingsSaving,
  ]);

  // ======================================================
  // Promoções: bloco enxuto apenas com desconto promocional.
  // ======================================================
  const pricingPagePromotionsInputs = useMemo(() => {
    if (!isPage) return null;
    return (
      <PricingPageSimulationInputs
        salePrice={saleInput}
        onSalePriceChange={handleSaleInputChange}
        desiredMarginPct={minMarginInput}
        onDesiredMarginPctChange={setMinMarginInput}
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
        mode="promotions"
      />
    );
  }, [
    isPage,
    saleInput,
    minMarginInput,
    pageSimPlannedPromoPct,
    pageSimMlAdsPct,
    pageSimAffiliatesPct,
    pageSimSafetyReservePct,
    pageSimPlannedPromoEnabled,
    pageSimMlAdsEnabled,
    pageSimAffiliatesEnabled,
    pageSimSafetyReserveEnabled,
    handleTogglePlannedPromo,
    handleToggleMlAds,
    handleToggleAffiliates,
    handleToggleSafetyReserve,
    handleSaleInputChange,
  ]);

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

  /** Alinha “Preço de venda” do card ML ao preço do catálogo (mesmo critério do card esquerdo). */
  const pageBaselineListingSaleDisplayOverride = useMemo(() => {
    if (!isPage) return null;
    if (row?.price != null && Number.isFinite(Number(row.price))) {
      return formatBrlLoose(Number(row.price));
    }
    if (row?.listingSalePriceBrl != null && String(row.listingSalePriceBrl).trim() !== "") {
      return formatBrlFromApiString(String(row.listingSalePriceBrl).trim());
    }
    if (row?.effectiveSalePriceBrl != null && String(row.effectiveSalePriceBrl).trim() !== "") {
      return formatBrlFromApiString(String(row.effectiveSalePriceBrl).trim());
    }
    return null;
  }, [isPage, row.price, row.listingSalePriceBrl, row.effectiveSalePriceBrl]);

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

  const selectedMlScenarioRowBundle = useMemo(() => {
    if (!hasMlScenarioCompare || mlScenarioRowsForTabsAndSelection.length === 0) return null;
    const tid = effectiveSelectedScenarioTabId;
    const idx = mlScenarioRowsForTabsAndSelection.findIndex(
      ({ scenario }) => (resolveMlScenarioTabId(scenario) || "baseline") === tid,
    );
    return mlScenarioRowsForTabsAndSelection[idx >= 0 ? idx : 0] ?? null;
  }, [hasMlScenarioCompare, mlScenarioRowsForTabsAndSelection, effectiveSelectedScenarioTabId]);

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

  const pricingModalResultsStack = (
    <>
      {hasMlScenarioCompare ? (
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
              <PricingIntelligenceWorkspaceTabs
                activeTab={pricingWorkspaceTab}
                onTabChange={setPricingWorkspaceTab}
                railHeader={isPage ? <PricingPageProductHeader row={row} theme={theme} compactVertical /> : null}
                simulatorPanel={
                  pricingPageBaselineRow != null ? (
                    <PricingPageSalePriceSimulator
                      embedded
                      baselineRow={pricingPageBaselineRow}
                      listingHintForAudit={mlListingHintForAudit}
                      baselineListingSaleDisplayOverride={pageBaselineListingSaleDisplayOverride}
                    >
                      {pricingPageSimulationInputs}
                    </PricingPageSalePriceSimulator>
                  ) : (
                    <p className="anuncios-sell-popover__muted" role="status">
                      Cenário de preço de venda (baseline) indisponível para este anúncio.
                    </p>
                  )
                }
                promotionsPanel={
                  <div
                    className={[
                      "pricing-intelligence-page__scenario-workspace",
                      "pricing-intelligence-page__scenario-workspace--promotions-only",
                      pricingPagePromotionRows.length === 0
                        ? "pricing-intelligence-page__scenario-workspace--no-promotions"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {pricingPagePromotionRows.length > 0 ? (
                      <>
                        <PricingScenarioRail
                          workspaceSidebar
                          rows={pricingPagePromotionRows}
                          selectedTabId={effectiveSelectedScenarioTabId}
                          onSelectTabId={handleSelectMlScenarioTabId}
                          baselineHeadingOverride="Preço de venda"
                          bestScenarioTabId={mlBestScenarioTabId}
                        />
                        <div className="pricing-intelligence-page__scenario-main">
                          {selectedMlScenarioRowBundle != null ? (
                            <div className="pricing-intelligence-page__scenario-detail-col">
                              <PricingScenarioDetail
                                key={effectiveSelectedScenarioTabId}
                                scenario={selectedMlScenarioRowBundle.scenario}
                                group={selectedMlScenarioRowBundle.group}
                                baselineHeadingOverride="Preço de venda"
                                hideBreakEvenInResult={isPage}
                                listingHintForAudit={mlListingHintForAudit}
                                baselineListingSaleDisplayOverride={pageBaselineListingSaleDisplayOverride}
                              />
                            </div>
                          ) : null}
                          <div className="pricing-intelligence-page__scenario-right-stack">
                            {pricingPagePromotionsInputs}
                            <div className="pricing-intelligence-page__chart-slot anuncios-pricing-modal__ml-chart-slot pricing-intelligence-page__chart-slot--page-vertical-compact">
                              <MercadoLivrePricingScenarioCompareChart
                                scenarios={mlChartScenarios}
                                selectedScenarioTabId={effectiveSelectedScenarioTabId}
                                preserveScenarioDisplayOrder
                                enablePagePositiveCompact={isPage}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="pricing-intelligence-page__promotions-empty" role="status">
                        <p className="anuncios-sell-popover__muted">
                          Nenhuma promoção retornada para este anúncio. Use a aba <strong>Simulador</strong> para o
                          preço de venda atual.
                        </p>
                      </div>
                    )}
                  </div>
                }
              />
            </>
          ) : (
            <MercadoLivrePricingScenarioCompareGrid
              scenarios={mlScenariosForCompare}
              baselineHeadingOverride="Preço de venda"
            />
          )}
        </div>
      ) : null}
      {loading ? <p className="anuncios-pricing-modal__loading">Calculando…</p> : null}
      {!loading && !sim ? (
        <p className="anuncios-sell-popover__result-placeholder">
          Ajuste o preço à esquerda para ver o raio-x simulado.
        </p>
      ) : null}
      {!loading && sim ? (
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
                        <span>Lucro líquido</span>
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
              {isPage && simError ? (
                <p className="anuncios-pricing-modal__error" role="alert">
                  {simError}
                </p>
              ) : null}
              {mlScenariosLoading ? (
                <p className="anuncios-pricing-modal__loading" role="status">
                  Carregando cenários atuais (ML)…
                </p>
              ) : null}
              {mlScenariosError != null && String(mlScenariosError).trim() !== "" ? (
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
