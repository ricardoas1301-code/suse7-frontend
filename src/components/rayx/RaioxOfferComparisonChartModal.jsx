// ======================================================
// Modal Comparativo de Ofertas S7 (gráfico) — compartilhado Anúncios + Vendas.
// ======================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import precificaS7Icon from "../../assets/precifica-s7-icon.png";
import { MercadoLivrePricingScenarioCompareChart } from "../MercadoLivrePricingScenarioCompareChart.jsx";
import "../Anuncios.css";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import { computeRaioxChartMiniDialogWidthPx } from "../../features/listings/utils/raioxCatalogLayout.js";
import { DASH } from "../sales/saleRayxFormat.js";
import { useOptionalPromocoesCompareContext } from "../pricing/PricingIntelligencePromotionsCompareContext.jsx";
import { PricingIntelligenceLoadingState } from "../pricing/PricingIntelligenceLoadingState.jsx";
import { useOfferComparisonChartScenarios } from "./useOfferComparisonChartScenarios.js";
import { isBaselineOfferComparisonScenario } from "./offerComparisonPromotionTruth.js";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   scenarios: unknown[];
 *   listingTitle?: string | null;
 *   thumbnailUrl?: string | null;
 *   listingIdDisplay?: string | null;
 *   listingIdCopyText?: string | null;
 *   skuLabel?: string | null;
 *   skuCopyText?: string | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown; group?: string } | null;
 *   configuracaoFinanceira?: Record<string, unknown> | null;
 *   onOpenPricing?: () => void;
 *   stackAboveSaleRayx?: boolean;
 *   layerRef?: import("react").RefObject<HTMLDivElement | null>;
 * }} props
 */
export default function RaioxOfferComparisonChartModal({
  open,
  onClose,
  scenarios,
  listingTitle = null,
  thumbnailUrl = null,
  listingIdDisplay = null,
  listingIdCopyText = null,
  skuLabel = null,
  skuCopyText = null,
  catalogRow = null,
  mlScenariosPayload = null,
  baselineRow = null,
  configuracaoFinanceira = null,
  onOpenPricing,
  stackAboveSaleRayx = false,
  layerRef = null,
}) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 390,
  );

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // S4.3.6.20 — Escape da camada superior (capture): fecha só o Comparativo e bloqueia a camada inferior.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const scenarioList = Array.isArray(scenarios) ? scenarios : [];
  const promocoesCompare = useOptionalPromocoesCompareContext();

  const listingExternalIdForSim =
    listingIdCopyText != null && String(listingIdCopyText).trim() !== ""
      ? String(listingIdCopyText).trim().replace(/^#/, "")
      : listingIdDisplay != null && String(listingIdDisplay).trim() !== ""
        ? String(listingIdDisplay).trim().replace(/^#/, "")
        : null;

  const listingIdForSim = useMemo(() => {
    if (catalogRow != null && typeof catalogRow === "object") {
      const id = /** @type {Record<string, unknown>} */ (catalogRow).id;
      if (id != null && String(id).trim() !== "") return String(id).trim();
    }
    return null;
  }, [catalogRow]);

  const resolveManualPriceRecord = useCallback(
    (scenario) => {
      if (promocoesCompare == null || isBaselineOfferComparisonScenario(scenario)) return null;
      const opcoes = Array.isArray(promocoesCompare.opcoes) ? promocoesCompare.opcoes : [];
      const hit = opcoes.find((o) => o?.row?.scenario === scenario);
      if (hit?.selectionId != null) {
        return promocoesCompare.obterPrecoManualSimulacao(hit.selectionId) ?? null;
      }
      // Fallback por promotion_id (referência de objeto pode divergir).
      const src =
        scenario != null && typeof scenario === "object"
          ? /** @type {Record<string, unknown>} */ (scenario)
          : null;
      const pid = src?.promotion_id != null ? String(src.promotion_id) : "";
      if (pid === "") return null;
      const byId = opcoes.find((o) => {
        const s =
          o?.row?.scenario != null && typeof o.row.scenario === "object"
            ? /** @type {Record<string, unknown>} */ (o.row.scenario)
            : null;
        return s?.promotion_id != null && String(s.promotion_id) === pid;
      });
      if (byId?.selectionId == null) return null;
      return promocoesCompare.obterPrecoManualSimulacao(byId.selectionId) ?? null;
    },
    [promocoesCompare],
  );

  const {
    chartScenarios,
    loading: financialLoading,
    hasPendingLane = false,
    error: financialError,
    listingTypeUnavailable,
  } = useOfferComparisonChartScenarios({
    scenarios: scenarioList,
    catalogRow,
    listingExternalId: listingExternalIdForSim,
    listingId: listingIdForSim,
    mlScenariosPayload,
    baselineRow,
    configuracaoFinanceira,
    enabled: open && scenarioList.length > 0,
    resolveManualPriceRecord,
    manualPriceRevision: promocoesCompare?.manualPriceGeneration ?? 0,
  });

  // S4.3.6.21 — nunca exibir result stale do payload (scenarioList) no gráfico.
  const chartScenarioList = listingTypeUnavailable ? [] : chartScenarios;

  // S4.3.6.23 — barras horizontais pedem largura estável (nome + barra + texto externo).
  // Refine UX: largura do modal +16% sobre a base (−10% anterior × 1.16).
  const dialogWidthPx = useMemo(() => {
    const n = chartScenarioList.length || scenarioList.length;
    const computed = computeRaioxChartMiniDialogWidthPx(Math.max(n, 4), viewportWidth);
    const floor = Math.min(Math.max(280, viewportWidth - 32), 560);
    const base = Math.max(computed, floor);
    const vwCap = Math.max(280, viewportWidth - 32);
    return Math.min(vwCap, Math.max(280, Math.round(base * 0.9 * 1.16)));
  }, [chartScenarioList.length, scenarioList.length, viewportWidth]);

  const listingDisplay =
    listingIdDisplay != null && String(listingIdDisplay).trim() !== ""
      ? String(listingIdDisplay).trim()
      : listingIdCopyText != null && String(listingIdCopyText).trim() !== ""
        ? String(listingIdCopyText).trim()
        : DASH;
  const listingCopy =
    listingIdCopyText != null && String(listingIdCopyText).trim() !== ""
      ? String(listingIdCopyText).trim().replace(/^#/, "")
      : listingDisplay !== DASH
        ? String(listingDisplay).replace(/^#/, "")
        : "";
  const skuText = skuLabel != null && String(skuLabel).trim() !== "" ? String(skuLabel).trim() : "";
  const skuCopy = skuCopyText != null && String(skuCopyText).trim() !== "" ? String(skuCopyText).trim() : skuText;
  const titleText = listingTitle != null ? String(listingTitle).trim() : "";
  const thumb = thumbnailUrl != null ? String(thumbnailUrl).trim() : "";

  if (!open || scenarioList.length === 0 || typeof document === "undefined") return null;

  const showFinancialUnavailable = listingTypeUnavailable || (financialError != null && chartScenarios.length === 0);

  const layerClass = [
    "anuncios-raiox-chart-mini-layer",
    stackAboveSaleRayx ? "anuncios-raiox-chart-mini-layer--above-sale-rayx" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      ref={layerRef}
      className={layerClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anuncios-raiox-chart-mini-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="anuncios-raiox-chart-mini__backdrop"
        aria-hidden
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div
        className="anuncios-raiox-chart-mini__dialog"
        style={{
          ["--s7-raiox-chart-mini-dialog-width"]: `${dialogWidthPx}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="anuncios-compare-modal__head-row anuncios-raiox-chart-mini__head-row--no-close">
          <h4
            id="anuncios-raiox-chart-mini-title"
            className="anuncios-raiox-chart-mini__title s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available"
          >
            Comparativo de ofertas S7
          </h4>
        </div>
        <div
          className="anuncios-raiox-chart-mini__context"
          aria-label="Contexto do anúncio"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="anuncios-raiox-chart-mini__context-name-row">
            {thumb !== "" ? (
              <img
                src={thumb}
                alt=""
                className="anuncios-raiox-chart-mini__context-name-thumb"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.remove();
                }}
              />
            ) : null}
            <div className="anuncios-raiox-chart-mini__context-name-stack">
              {titleText !== "" ? (
                <div className="anuncios-raiox-chart-mini__context-name anuncios-raiox-chart-mini__context-name--plain">
                  <span className="anuncios-raiox-chart-mini__context-name-text">{titleText}</span>
                </div>
              ) : null}
              <div className="anuncios-raiox-chart-mini__context-row anuncios-raiox-chart-mini__context-row--compact-ml-sku">
                {onOpenPricing ? (
                  <button
                    type="button"
                    className="anuncios-raiox-chart-mini__context-pricing s7-tip s7-tip-bottom s7-tip-left"
                    data-tip="Precificação inteligente"
                    aria-label="Abrir precificação inteligente"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPricing();
                    }}
                  >
                    <img
                      src={precificaS7Icon}
                      alt=""
                      className="anuncios-raiox-chart-mini__context-pricing-icon"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ) : null}
                <span className="anuncios-raiox-chart-mini__context-meta">
                  <span className="anuncios-raiox-chart-mini__context-meta-value">{listingDisplay}</span>
                  {listingCopy !== "" ? (
                    <S7CopyButton
                      value={listingCopy}
                      ariaLabel="Copiar ID do anúncio"
                      tooltipText="Copiar ID do anúncio"
                      toastLabel="ID do anúncio"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="raiox-chart-ext"
                      toastEventType="LISTING_ID_COPIED"
                      toastFailEventType="LISTING_ID_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                      className="anuncios-raiox-chart-mini__context-copy"
                    />
                  ) : null}
                </span>
                {skuText !== "" ? (
                  <>
                    <span className="anuncios-raiox-chart-mini__context-sep" aria-hidden="true">
                      |
                    </span>
                    <span className="anuncios-raiox-chart-mini__context-meta anuncios-raiox-chart-mini__context-meta--sku">
                      <span className="anuncios-ad-sku-label">SKU</span>
                      <span className="anuncios-raiox-chart-mini__context-meta-value">{skuText}</span>
                      {skuCopy !== "" ? (
                        <S7CopyButton
                          value={skuCopy}
                          ariaLabel="Copiar SKU"
                          tooltipText="Copiar SKU"
                          toastLabel="SKU"
                          showToast={true}
                          iconMode="unicode"
                          flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                          flashKey="raiox-chart-sku"
                          toastEventType="LISTING_SKU_COPIED"
                          toastFailEventType="LISTING_SKU_COPY_FAILED"
                          toastEntityType="marketplace_listing"
                          className="anuncios-raiox-chart-mini__context-copy"
                        />
                      ) : null}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="anuncios-raiox-chart-mini__body">
          {showFinancialUnavailable ? (
            <p className="anuncios-sell-popover__muted anuncios-raiox-chart-mini__financial-unavailable" role="alert">
              {financialError ?? "Tipo do anúncio indisponível para paridade financeira do comparativo."}
            </p>
          ) : null}
          <div className="anuncios-raiox-chart-mini__body-inner anuncios-raiox-chart-mini__body-inner--chart-only">
            <div className="anuncios-raiox-chart-mini__body-chart">
              {!showFinancialUnavailable && (financialLoading || hasPendingLane) ? (
                <div className="anuncios-raiox-chart-mini__financial-loading-center">
                  <PricingIntelligenceLoadingState
                    compact
                    title="Carregando Comparativo de Ofertas S7"
                    subtitle="Estamos resolvendo os cenários financeiros deste anúncio."
                  />
                </div>
              ) : null}
              {!showFinancialUnavailable &&
              !financialLoading &&
              !hasPendingLane &&
              chartScenarioList.length > 0 ? (
                <MercadoLivrePricingScenarioCompareChart
                  scenarios={chartScenarioList}
                  preserveScenarioDisplayOrder
                  laneMetaLayout="diverging-ranked"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
