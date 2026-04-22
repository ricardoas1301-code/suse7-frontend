// ======================================================
// Modal “Precificação inteligente” — shell multi-marketplace (espelha Raio-x).
// Simulação e aplicação: somente via POST /api/pricing/* (sem lógica de dinheiro no JSX).
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, buildApiUrl } from "../config/api";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../theme/marketplaceTheme.js";
import MarketplaceBadge from "./MarketplaceBadge.jsx";
import S7Button from "./ui/S7Button";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import { MercadoLivrePricingScenarioCompareChart } from "./MercadoLivrePricingScenarioCompareChart.jsx";
import { MercadoLivrePricingScenarioCompareGrid } from "./MercadoLivrePricingScenarioCompareGrid.jsx";
import {
  buildRaioxScenariosFromSaleXrayModalContract,
  enrichRaioxScenariosWithListingPromotionMetadata,
  mergeListingGridRowIntoMlScenarios,
  shouldSaleXrayDebugTrace,
} from "./mercadoLivrePricingScenarioCompareShared.js";

/** Evita import circular com Anuncios.jsx (export de ListingCoverThumb). */
function PricingCoverThumb({ url }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [url]);
  const trimmed = url != null && String(url).trim() !== "" ? String(url).trim() : "";
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

/** Largura alvo ~2× o popover estreito original; ainda limitada ao viewport em commitPosition. */
const ADS_PRICING_MODAL_W = 720;
/** Com comparativo ML + gráfico: mais largura, sempre limitada ao viewport em commitPosition. */
const ADS_PRICING_MODAL_W_ML_COMPARE = 960;
const ADS_PRICING_MODAL_MAX_H = 820;
/** Margem do modal comparativo em relação à viewport (quase full-screen). */
const ADS_PRICING_MODAL_COMPARE_MARGIN_PX = 20;
const ADS_PRICING_Z = 200110;
const ADS_PRICING_DEBOUNCE_MS = 420;
const DASH = "—";

function getRaioxPopoverViewportInsets() {
  const edge = 12;
  const gapBelowNav = 8;
  let top = edge;
  let bottom = edge;
  if (typeof document === "undefined") return { top, bottom };
  const nav = document.querySelector(".navbar-premium");
  if (nav) {
    const nb = nav.getBoundingClientRect().bottom;
    if (Number.isFinite(nb) && nb > 0) top = Math.max(top, nb + gapBelowNav);
  } else {
    top = Math.max(top, 72);
  }
  try {
    const tEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-top)") || "0",
    );
    const bEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0",
    );
    if (Number.isFinite(tEnv) && tEnv > 0) top = Math.max(top, tEnv + edge);
    if (Number.isFinite(bEnv) && bEnv > 0) bottom = Math.max(bottom, bEnv + edge);
  } catch {
    /* ignore */
  }
  return { top, bottom };
}

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

/**
 * @param {{ row: Record<string, unknown>; open: boolean; anchorRef: React.MutableRefObject<HTMLElement | null>; onClose: () => void; onApplied?: () => void | Promise<void>; }} props
 */
export default function AdsPricingIntelligenceModal({ row, open, anchorRef, onClose, onApplied }) {
  const { addNotification } = useNotifications();
  const shellRef = useRef(null);
  const panelRef = useRef(null);
  const debounceRef = useRef(null);
  const mlCompareLayoutWideRef = useRef(false);

  const [geom, setGeom] = useState({
    left: 0,
    top: 0,
    maxW: ADS_PRICING_MODAL_W,
    maxH: ADS_PRICING_MODAL_MAX_H,
    arrowTopPx: 24,
    centeredFill: false,
  });
  const [caretTrailing, setCaretTrailing] = useState(false);

  const [saleInput, setSaleInput] = useState("");
  const [minMarginInput, setMinMarginInput] = useState("7");
  const [minProfitInput, setMinProfitInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [sim, setSim] = useState(null);
  const [simError, setSimError] = useState(null);

  const theme = getMarketplaceTheme(row.marketplaceRaw || row.marketplaceSlug);

  const commitPosition = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const bottomPad = bottomInset + 96;
    const margin = 12;

    if (mlCompareLayoutWideRef.current) {
      const m = ADS_PRICING_MODAL_COMPARE_MARGIN_PX;
      const maxW = Math.max(ADS_PRICING_MODAL_W_ML_COMPARE, vw - 2 * m);
      const maxH = vh - topInset - bottomPad;
      setCaretTrailing(false);
      setGeom({
        left: 0,
        top: 0,
        maxW,
        maxH,
        arrowTopPx: 24,
        centeredFill: true,
      });
      return;
    }

    const trig = anchorRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const gap = 10;
    const capW = ADS_PRICING_MODAL_W;
    const maxW = Math.min(capW, vw - 2 * margin);
    const panelEl = panelRef.current;
    const estW = panelEl && panelEl.getBoundingClientRect().width > 40 ? panelEl.getBoundingClientRect().width : maxW;

    let left;
    let trailing = false;
    const leftPreferred = r.left - gap - estW;
    if (leftPreferred >= margin) {
      left = leftPreferred;
      trailing = true;
    } else {
      left = r.right + gap;
      if (left + estW > vw - margin) left = Math.max(margin, vw - margin - estW);
      trailing = false;
    }

    const maxH = Math.min(ADS_PRICING_MODAL_MAX_H, vh - topInset - bottomPad);
    let panelH = maxH;
    if (panelEl) {
      const rect = panelEl.getBoundingClientRect();
      const hScroll = panelEl.scrollHeight;
      const h = Number.isFinite(hScroll) && hScroll > 0 ? Math.max(rect.height, hScroll) : rect.height;
      if (Number.isFinite(h) && h > 32) panelH = Math.min(h, maxH);
    }
    const iconCy = r.top + r.height / 2;
    let top = iconCy - panelH / 2 - 120;
    const bottomReserve = panelH + 48;
    top = Math.min(Math.max(top, topInset), vh - bottomPad - bottomReserve);
    const arrowTopPx = Math.max(14, Math.min(panelH - 14, iconCy - top));
    setCaretTrailing(trailing);
    setGeom({ left, top, maxW, maxH, arrowTopPx, centeredFill: false });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => requestAnimationFrame(commitPosition));
  }, [open, commitPosition]);

  useEffect(() => {
    if (!open) return;
    const run = () => commitPosition();
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, true);
    let ro = null;
    const id = window.setTimeout(() => {
      const el = panelRef.current;
      if (el && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(run);
        ro.observe(el);
      }
    }, 50);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run, true);
      ro?.disconnect();
    };
  }, [open, commitPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const [mlScenariosPayload, setMlScenariosPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [mlScenariosLoading, setMlScenariosLoading] = useState(false);
  const [mlScenariosError, setMlScenariosError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!open) return;
    const p = row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null;
    setSaleInput(p != null ? String(p).replace(".", ",") : "");
    setSim(null);
    setSimError(null);
  }, [open, row.id, row.price]);

  useEffect(() => {
    if (!open) {
      setMlScenariosPayload(null);
      setMlScenariosError(null);
      setMlScenariosLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
        const url = buildApiUrl("/api/ml/listings/sale-xray-modal");
        if (shouldSaleXrayDebugTrace(row.externalId)) {
          console.log("[SALE_XRAY] calling sale-xray-modal", {
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
        if (data.from_sale_xray_modal !== true || data.sale_xray_modal == null || typeof data.sale_xray_modal !== "object") {
          if (!cancelled) {
            setMlScenariosError(
              "Resposta do Raio-x inválida: esperado contrato sale_xray_modal (from_sale_xray_modal). Verifique o backend.",
            );
            setMlScenariosPayload(null);
          }
          return;
        }
        if (shouldSaleXrayDebugTrace(data)) {
          console.log("[SALE_XRAY] response", data);
        }
        if (!cancelled) {
          setMlScenariosPayload(data);
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
  }, [open, row.externalId, row.marketplaceRaw]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => requestAnimationFrame(commitPosition));
  }, [open, commitPosition, mlScenariosPayload]);

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
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      runSimulate();
    }, ADS_PRICING_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [open, saleInput, minMarginInput, minProfitInput, runSimulate]);

  const handleSuggestHealthy = () => {
    const s = sim?.suggested_price_brl ?? sim?.current?.pricing_context?.result?.break_even_price_brl;
    if (s == null || String(s).trim() === "") return;
    const n = Number(String(s).replace(",", "."));
    if (!Number.isFinite(n)) return;
    setSaleInput(String(n).replace(".", ","));
  };

  const handleResetCurrent = () => {
    const p = row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null;
    if (p != null) setSaleInput(String(p).replace(".", ","));
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
  mlCompareLayoutWideRef.current = hasMlScenarioCompare;

  if (!open || typeof document === "undefined") return null;

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
          <MercadoLivrePricingScenarioCompareGrid scenarios={mlScenariosForCompare} />
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

          {showSimResultadoSection ? (
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

  return createPortal(
    <>
      <div
        className="anuncios-pricing-modal__backdrop"
        style={{ zIndex: ADS_PRICING_Z - 1 }}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={shellRef}
        className={[
          "anuncios-raiox-shell",
          "anuncios-raiox-shell--portal",
          "anuncios-raiox-shell--open",
          "anuncios-pricing-modal__shell",
          geom.centeredFill ? "anuncios-pricing-modal__shell--compare-fill" : "",
          theme.shellModifierClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...(geom.centeredFill
            ? {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: geom.maxW,
                maxWidth: geom.maxW,
                height: geom.maxH,
                maxHeight: geom.maxH,
              }
            : {
                left: geom.left,
                top: geom.top,
                width: geom.maxW,
                maxWidth: geom.maxW,
                maxHeight: geom.maxH,
              }),
          zIndex: ADS_PRICING_Z,
          ...getMarketplaceThemeCssVars(theme),
        }}
      >
        <div className="anuncios-raiox-shell__frame" aria-hidden />
        {theme.logoSrc ? (
          <div className="anuncios-raiox-shell__badge">
            <img
              src={theme.logoSrc}
              alt={theme.logoAlt ?? ""}
              loading="lazy"
              decoding="async"
              className="anuncios-raiox-shell__badge-img"
            />
          </div>
        ) : (
          <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text">
            <span className="anuncios-raiox-shell__badge-fallback">{theme.displayName}</span>
          </div>
        )}
        <div
          ref={panelRef}
          className={[
            "anuncios-sell-popover__panel",
            "anuncios-sell-popover__panel--in-shell",
            caretTrailing ? "anuncios-sell-popover__panel--caret-trailing" : "",
            "anuncios-pricing-modal__panel",
            hasMlScenarioCompare ? "anuncios-pricing-modal__panel--ml-scenario-compare" : "",
            hasMlScenarioCompare ? "anuncios-pricing-modal__panel--compare-near-full" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="dialog"
          aria-labelledby="ads-pricing-modal-title"
          style={{
            ["--raiox-caret-top"]: `${geom.arrowTopPx}px`,
            maxHeight: geom.maxH,
            ...(geom.centeredFill ? { height: "100%", overflow: "hidden" } : {}),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {hasMlScenarioCompare ? (
            <div className="anuncios-pricing-modal__head-row">
              <h3 id="ads-pricing-modal-title" className="anuncios-sell-popover__title">
                Precificação inteligente
              </h3>
              <button type="button" className="anuncios-compare-modal__close" onClick={onClose} aria-label="Fechar">
                <S7Icon name="close" size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <h3 id="ads-pricing-modal-title" className="anuncios-sell-popover__title">
              Precificação inteligente
            </h3>
          )}
          <p className="anuncios-sell-popover__subtitle">Simule o cenário e publique no marketplace</p>

          <div className="anuncios-pricing-modal__main-grid">
            <div className="anuncios-pricing-modal__col anuncios-pricing-modal__col--inputs">
              <div className="anuncios-pricing-modal__hero">
                <PricingCoverThumb url={row.coverThumbnailUrl} />
                <div className="anuncios-pricing-modal__hero-text">
                  <span className="anuncios-pricing-modal__hero-title" title={row.adTitle}>
                    {row.adTitle}
                  </span>
                  <span className="anuncios-pricing-modal__hero-meta">
                    SKU {row.sku && String(row.sku).trim() !== "" ? row.sku : "—"} · Preço atual{" "}
                    {formatBrlLoose(row.price)}
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
                  <MercadoLivrePricingScenarioCompareChart scenarios={mlScenariosForCompare} />
                </div>
              ) : null}

              {simError ? (
                <p className="anuncios-pricing-modal__error" role="alert">
                  {simError}
                </p>
              ) : null}
            </div>

            <div className="anuncios-pricing-modal__col anuncios-pricing-modal__col--results">
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
        </div>
      </div>
    </>,
    document.body,
  );
}
