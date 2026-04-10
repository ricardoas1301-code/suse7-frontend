// ======================================================
// Modal “Precificação inteligente” — shell multi-marketplace (espelha Raio-x).
// Simulação e aplicação: somente via POST /api/pricing/* (sem lógica de dinheiro no JSX).
// ======================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, buildApiUrl } from "../config/api";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../theme/marketplaceTheme.js";
import MarketplaceBadge from "./MarketplaceBadge.jsx";
import S7Button from "./ui/S7Button";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";

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

const ADS_PRICING_MODAL_W = 360;
const ADS_PRICING_MODAL_MAX_H = 780;
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

  const [geom, setGeom] = useState({
    left: 0,
    top: 0,
    maxW: ADS_PRICING_MODAL_W,
    maxH: ADS_PRICING_MODAL_MAX_H,
    arrowTopPx: 24,
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
    const trig = anchorRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const bottomPad = bottomInset + 96;
    const maxW = Math.min(ADS_PRICING_MODAL_W, vw - 2 * margin);
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
    setGeom({ left, top, maxW, maxH, arrowTopPx });
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

  useEffect(() => {
    if (!open) return;
    const p = row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null;
    setSaleInput(p != null ? String(p).replace(".", ",") : "");
    setSim(null);
    setSimError(null);
  }, [open, row.id, row.price]);

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

  if (!open || typeof document === "undefined") return null;

  const simCtx = sim?.simulated?.pricing_context;
  const simRes = simCtx?.result != null && typeof simCtx.result === "object" ? simCtx.result : null;
  const simIc = simCtx?.internal_costs != null && typeof simCtx.internal_costs === "object" ? simCtx.internal_costs : null;
  const semRaw =
    simRes?.offer_status_semantic != null ? String(simRes.offer_status_semantic).trim() : "";
  const offerSemClass =
    ["critical", "danger", "acceptable", "great", "excellent"].includes(semRaw)
      ? `anuncios-sell-popover__offer-sem--${semRaw}`
      : "";

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
          theme.shellModifierClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          left: geom.left,
          top: geom.top,
          width: geom.maxW,
          maxWidth: geom.maxW,
          maxHeight: geom.maxH,
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
          ]
            .filter(Boolean)
            .join(" ")}
          role="dialog"
          aria-labelledby="ads-pricing-modal-title"
          style={{ ["--raiox-caret-top"]: `${geom.arrowTopPx}px`, maxHeight: geom.maxH }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="ads-pricing-modal-title" className="anuncios-sell-popover__title">
            Precificação inteligente
          </h3>
          <p className="anuncios-sell-popover__subtitle">Simule o cenário e publique no marketplace</p>

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

          {simError ? (
            <p className="anuncios-pricing-modal__error" role="alert">
              {simError}
            </p>
          ) : null}

          <div className="anuncios-sell-popover__section">
            <h4 className="anuncios-sell-popover__section-title">Resultado simulado</h4>
            {loading ? <p className="anuncios-pricing-modal__loading">Calculando…</p> : null}
            {!loading && sim ? (
              <>
                {sim.comparison?.profit_delta_brl != null ? (
                  <p className="anuncios-pricing-modal__delta">
                    Δ Lucro: {formatBrlLoose(sim.comparison.profit_delta_brl)} (
                    {sim.comparison.profit_delta_pct != null ? `${sim.comparison.profit_delta_pct}%` : "—"} vs atual) ·
                    Δ Margem:{" "}
                    {sim.comparison.margin_delta_pct != null ? `${sim.comparison.margin_delta_pct} pp` : "—"}
                  </p>
                ) : null}
                {Array.isArray(sim.warnings) && sim.warnings.length > 0 ? (
                  <ul className="anuncios-pricing-modal__warnings">
                    {sim.warnings.map((w) => (
                      <li key={w.code}>{w.message}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Preço mínimo saudável</span>
                    <strong>
                      {simRes?.break_even_price_brl != null && String(simRes.break_even_price_brl).trim() !== ""
                        ? formatBrlLoose(simRes.break_even_price_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Lucro líquido</span>
                    <strong className={offerSemClass || undefined}>
                      {simRes?.profit_brl != null ? formatBrlLoose(simRes?.profit_brl) : DASH}
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
                    <span>Custo do produto</span>
                    <strong>
                      {simIc?.product_cost_brl != null && String(simIc.product_cost_brl).trim() !== ""
                        ? formatBrlLoose(simIc.product_cost_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Impostos</span>
                    <strong>
                      {simIc?.tax_amount_brl != null && String(simIc.tax_amount_brl).trim() !== ""
                        ? formatBrlLoose(simIc.tax_amount_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Operação + Embalagem</span>
                    <strong>
                      {simIc?.operational_packaging_total_brl != null &&
                      String(simIc.operational_packaging_total_brl).trim() !== ""
                        ? formatBrlLoose(simIc.operational_packaging_total_brl)
                        : DASH}
                    </strong>
                  </div>
                </div>
                <div className="anuncios-sell-popover__block">
                  <div className="anuncios-sell-popover__line">
                    <span>Status da oferta</span>
                    <strong className={offerSemClass || undefined}>
                      {simRes?.offer_status_label != null ? String(simRes.offer_status_label) : DASH}
                    </strong>
                  </div>
                </div>
              </>
            ) : null}
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
