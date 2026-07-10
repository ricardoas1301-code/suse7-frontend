// ======================================================================
// Central de Saúde da Precificação — Dashboard executivo (somente renderização).
// SSOT: GET /api/dashboard/pricing-health-summary
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Truck } from "lucide-react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { fetchPricingHealthSummary } from "../api/fetchPricingHealthSummary.js";
import VendasExecutiveKpiCard from "../../../components/sales/VendasExecutiveKpiCard.jsx";
import S7DashboardSectionPanel from "../../../components/dashboard/S7DashboardSectionPanel.jsx";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import PricingOfferStatusCard from "./PricingOfferStatusCard.jsx";
import PricingProjectedMarginCard from "./PricingProjectedMarginCard.jsx";
import PricingPromotionStatusCard from "./PricingPromotionStatusCard.jsx";
import ListingClassicIcon from "./icons/ListingClassicIcon.jsx";
import ListingPremiumIcon from "./icons/ListingPremiumIcon.jsx";
import {
  formatCount,
  formatPercentFromBackend,
  readCount,
} from "./PricingHealthSlicedPieCard.jsx";
import "../../../components/sales/VendasExecutiveKpiCard.css";
import "./PricingHealthCenter.css";

const FRIENDLY_LOAD_ERROR = "Não foi possível carregar a Central de Saúde da Precificação agora.";
const FRIENDLY_LOAD_ERROR_HINT =
  "Tente atualizar a página. Se continuar, verifique os logs do backend.";

/** @param {unknown} raw @param {string} fallbackTitle */
function readCountKpi(raw, fallbackTitle) {
  if (raw == null || typeof raw !== "object") {
    return { title: fallbackTitle, subtitle: "", count: 0, data_available: false };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    title: String(record.title ?? fallbackTitle),
    subtitle: String(record.subtitle ?? ""),
    count: readCount(record.value ?? record.count),
    data_available: record.data_available !== false,
  };
}

/** @param {unknown} value */
function formatPricingHealthPercentDisplay(value) {
  if (value == null || String(value).trim() === "") return null;
  const raw = String(value).trim().replace(/%\s*$/, "");
  return formatPercentFromBackend(raw);
}

/** @param {unknown} raw @param {string} fallbackTitle */
function readPercentKpi(raw, fallbackTitle) {
  if (raw == null || typeof raw !== "object") {
    return {
      title: fallbackTitle,
      subtitle: "",
      percent: null,
      display_value: null,
      data_available: false,
    };
  }

  const record = /** @type {Record<string, unknown>} */ (raw);
  const percentRaw =
    record.percent != null
      ? record.percent
      : record.display_value != null
        ? record.display_value
        : record.value;

  return {
    title: String(record.title ?? fallbackTitle),
    subtitle: String(record.subtitle ?? ""),
    percent: percentRaw != null ? String(percentRaw) : null,
    display_value: formatPricingHealthPercentDisplay(percentRaw),
    data_available: record.data_available !== false,
  };
}

/**
 * @param {{ className?: string }} props
 */
export default function PricingHealthCenter({
  className = "",
  sectionJumpDownTargetRef = null,
  sectionJumpDownAriaLabel = "Ir para busca e filtros",
}) {
  const authReady = useAuthBootstrapReady();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [payload, setPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchPricingHealthSummary();
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.payload) {
        setError(FRIENDLY_LOAD_ERROR);
        setPayload(null);
        return;
      }
      setPayload(res.payload);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  const totalListings = readCount(payload?.total_listings);
  const offerStatusCard =
    payload?.offer_status != null && typeof payload.offer_status === "object"
      ? /** @type {Record<string, unknown>} */ (payload.offer_status)
      : {};
  const projectedMarginCard =
    payload?.projected_margin != null && typeof payload.projected_margin === "object"
      ? /** @type {Record<string, unknown>} */ (payload.projected_margin)
      : {};
  const promotionStatusCard =
    payload?.promotion_status != null && typeof payload.promotion_status === "object"
      ? /** @type {Record<string, unknown>} */ (payload.promotion_status)
      : {};

  const summaryCards = useMemo(() => {
    const sc = payload?.summary_cards;
    return sc != null && typeof sc === "object" ? /** @type {Record<string, unknown>} */ (sc) : {};
  }, [payload]);

  const classicListings = useMemo(
    () => readCountKpi(summaryCards.classic_listings, "Anúncios Clássico"),
    [summaryCards],
  );
  const premiumListings = useMemo(
    () => readCountKpi(summaryCards.premium_listings, "Anúncios Premium"),
    [summaryCards],
  );
  const freeShippingListings = useMemo(
    () => readPercentKpi(summaryCards.free_shipping_listings, "Com frete grátis"),
    [summaryCards],
  );
  const activePromotionListings = useMemo(
    () => readCountKpi(summaryCards.active_promotion_listings, "Anúncios em promoção"),
    [summaryCards],
  );

  const rootClass = ["s7-pricing-health-center", className].filter(Boolean).join(" ");

  return (
    <section className={rootClass} aria-label="Central de Saúde da Precificação">
      <S7DashboardSectionPanel>
        <header className="s7-pricing-health-center__head s7-section-jump-host">
          <h2 className="s7-pricing-health-center__title">Central de Saúde da Precificação</h2>
          {sectionJumpDownTargetRef ? (
            <S7SectionJumpButton
              direction="down"
              targetRef={sectionJumpDownTargetRef}
              ariaLabel={sectionJumpDownAriaLabel}
            />
          ) : null}
        </header>

        {loading ? (
          <p className="s7-pricing-health-center__loading" role="status">
            Carregando diagnóstico da precificação…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="s7-pricing-health-center__error" role="alert">
            <p className="s7-pricing-health-center__error-title">{error}</p>
            <p className="s7-pricing-health-center__error-hint">{FRIENDLY_LOAD_ERROR_HINT}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="s7-pricing-health-center__cards-row">
              <PricingOfferStatusCard cardData={offerStatusCard} totalListings={totalListings} />
              <PricingProjectedMarginCard cardData={projectedMarginCard} totalListings={totalListings} />
              <PricingPromotionStatusCard cardData={promotionStatusCard} totalListings={totalListings} />
            </div>

            <div
              className="s7-pricing-health-center__executive-kpis s7-dashboard-executive-kpi-row"
              aria-label="Indicadores executivos da Central de Saúde da Precificação"
            >
              <VendasExecutiveKpiCard
                title={classicListings.title}
                tone="revenue"
                value={formatCount(classicListings.count)}
                subtitle={classicListings.subtitle}
                cardClassName="s7-kpi-chrome--pricing-classic"
                valueIcon={
                  <ListingClassicIcon className="vendas-executive-kpi__value-icon-svg s7-pricing-health-kpi-icon--classic s7-pricing-health-listing-icon" />
                }
                valueClassName="s7-pricing-health-kpi-value--classic"
              />
              <VendasExecutiveKpiCard
                title={premiumListings.title}
                tone="profit"
                value={formatCount(premiumListings.count)}
                subtitle={premiumListings.subtitle}
                cardClassName="s7-kpi-chrome--pricing-premium"
                valueIcon={
                  <ListingPremiumIcon className="vendas-executive-kpi__value-icon-svg s7-pricing-health-kpi-icon--premium s7-pricing-health-listing-icon" />
                }
                valueClassName="s7-pricing-health-kpi-value--premium"
              />
              <VendasExecutiveKpiCard
                title={freeShippingListings.title}
                tone="conversion"
                value={
                  freeShippingListings.data_available && freeShippingListings.display_value
                    ? freeShippingListings.display_value
                    : "—"
                }
                subtitle={freeShippingListings.subtitle}
                cardClassName="s7-kpi-chrome--pricing-shipping"
                valueIcon={
                  <Truck className="vendas-executive-kpi__value-icon-svg s7-pricing-health-kpi-icon--shipping" />
                }
                valueClassName="s7-pricing-health-kpi-value--shipping"
              />
              <VendasExecutiveKpiCard
                title={activePromotionListings.title}
                tone="conversion"
                value={formatCount(activePromotionListings.count)}
                subtitle={activePromotionListings.subtitle}
                cardClassName="s7-kpi-chrome--pricing-promotion"
                valueIcon={
                  <Sparkles className="vendas-executive-kpi__value-icon-svg s7-pricing-health-kpi-icon--promotion" />
                }
                valueClassName="s7-pricing-health-kpi-value--promotion"
              />
            </div>
          </>
        ) : null}
      </S7DashboardSectionPanel>
    </section>
  );
}
