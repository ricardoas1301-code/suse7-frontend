// ======================================================================
// Central de Saúde da Concorrência — Dashboard executivo (somente renderização).
// SSOT: GET /api/dashboard/competition-health-summary
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageCheck, TrendingDown, Truck } from "lucide-react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { fetchCompetitionHealthSummary } from "../api/fetchCompetitionHealthSummary.js";
import VendasExecutiveKpiCard from "../../../components/sales/VendasExecutiveKpiCard.jsx";
import S7DashboardSectionPanel from "../../../components/dashboard/S7DashboardSectionPanel.jsx";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import CompetitionMonitoringCoverageCard from "./CompetitionMonitoringCoverageCard.jsx";
import CompetitionPricePositionCard from "./CompetitionPricePositionCard.jsx";
import CompetitionCompetitorReputationCard from "./CompetitionCompetitorReputationCard.jsx";
import { formatCount, formatPercentFromBackend, readCount } from "./CompetitionHealthPieCard.jsx";
import "../../../components/sales/VendasExecutiveKpiCard.css";
import "./CompetitionHealthCenter.css";

const FRIENDLY_LOAD_ERROR = "Não foi possível carregar a Central de Saúde da Concorrência agora.";
const FRIENDLY_LOAD_ERROR_HINT =
  "Tente atualizar a página. Se continuar, verifique os logs do backend.";

/** @param {unknown} raw @param {string} fallbackTitle */
function readSummaryCard(raw, fallbackTitle) {
  if (raw == null || typeof raw !== "object") {
    return { title: fallbackTitle, subtitle: "", percent: null, count: 0, data_available: false };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    title: String(record.title ?? fallbackTitle),
    subtitle: String(record.subtitle ?? ""),
    percent: record.percent != null ? String(record.percent) : null,
    count: readCount(record.count),
    data_available: record.data_available !== false,
  };
}

/** @param {unknown} raw */
function readMaxPricePressureCard(raw) {
  if (raw == null || typeof raw !== "object") {
    return {
      title: "Maior pressão de preço",
      subtitle: "Nenhum concorrente abaixo do seu preço",
      display_value: null,
      has_value: false,
    };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    title: String(record.title ?? "Maior pressão de preço"),
    subtitle: String(record.subtitle ?? ""),
    display_value: record.display_value != null ? String(record.display_value) : null,
    has_value: record.has_value === true,
  };
}

/**
 * @param {{ className?: string }} props
 */
export default function CompetitionHealthCenter({
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
      const res = await fetchCompetitionHealthSummary();
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
  const monitoringCard =
    payload?.monitoring_coverage != null && typeof payload.monitoring_coverage === "object"
      ? /** @type {Record<string, unknown>} */ (payload.monitoring_coverage)
      : {};
  const priceCard =
    payload?.price_position != null && typeof payload.price_position === "object"
      ? /** @type {Record<string, unknown>} */ (payload.price_position)
      : {};
  const reputationCard =
    payload?.competitor_reputation != null && typeof payload.competitor_reputation === "object"
      ? /** @type {Record<string, unknown>} */ (payload.competitor_reputation)
      : {};

  const summaryCards = useMemo(() => {
    const sc = payload?.summary_cards;
    return sc != null && typeof sc === "object" ? /** @type {Record<string, unknown>} */ (sc) : {};
  }, [payload]);

  const freeShipping = useMemo(
    () => readSummaryCard(summaryCards.free_shipping_competitors, "Concorrentes com frete grátis"),
    [summaryCards],
  );
  const fullCompetitors = useMemo(
    () => readSummaryCard(summaryCards.full_competitors, "Concorrentes no Full"),
    [summaryCards],
  );
  const maxPricePressure = useMemo(
    () => readMaxPricePressureCard(summaryCards.max_price_pressure),
    [summaryCards],
  );
  const inactiveCompetitors = useMemo(
    () => readSummaryCard(summaryCards.inactive_competitors, "Concorrentes inativos"),
    [summaryCards],
  );

  const rootClass = ["s7-competition-health-center", className].filter(Boolean).join(" ");

  return (
    <section className={rootClass} aria-label="Central de Saúde da Concorrência">
      <S7DashboardSectionPanel>
        <header className="s7-competition-health-center__head s7-section-jump-host">
          <h2 className="s7-competition-health-center__title">Central de Saúde da Concorrência</h2>
          {sectionJumpDownTargetRef ? (
            <S7SectionJumpButton
              direction="down"
              targetRef={sectionJumpDownTargetRef}
              ariaLabel={sectionJumpDownAriaLabel}
            />
          ) : null}
        </header>

        {loading ? (
          <p className="s7-competition-health-center__loading" role="status">
            Carregando diagnóstico da concorrência…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="s7-competition-health-center__error" role="alert">
            <p className="s7-competition-health-center__error-title">{error}</p>
            <p className="s7-competition-health-center__error-hint">{FRIENDLY_LOAD_ERROR_HINT}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="s7-competition-health-center__cards-row">
              <CompetitionMonitoringCoverageCard cardData={monitoringCard} totalListings={totalListings} />
              <CompetitionPricePositionCard cardData={priceCard} totalListings={totalListings} />
              <CompetitionCompetitorReputationCard cardData={reputationCard} totalListings={totalListings} />
            </div>

            <div
              className="s7-competition-health-center__executive-kpis s7-dashboard-executive-kpi-row"
              aria-label="Indicadores executivos da Central de Saúde da Concorrência"
            >
              <VendasExecutiveKpiCard
                title={freeShipping.title}
                tone="profit"
                value={
                  freeShipping.percent != null
                    ? formatPercentFromBackend(freeShipping.percent)
                    : formatCount(0)
                }
                subtitle={freeShipping.subtitle}
                cardClassName="s7-kpi-chrome--health-active"
                valueIcon={
                  <Truck className="vendas-executive-kpi__value-icon-svg s7-competition-health-kpi-icon--shipping" />
                }
                valueClassName="s7-competition-health-kpi-value--shipping"
              />
              <VendasExecutiveKpiCard
                title={fullCompetitors.title}
                tone="revenue"
                value={
                  fullCompetitors.percent != null
                    ? formatPercentFromBackend(fullCompetitors.percent)
                    : formatCount(0)
                }
                subtitle={fullCompetitors.subtitle}
                cardClassName="s7-kpi-chrome--competition-full"
                valueIcon={
                  <PackageCheck className="vendas-executive-kpi__value-icon-svg s7-competition-health-kpi-icon--full" />
                }
                valueClassName="s7-competition-health-kpi-value--full"
              />
              <VendasExecutiveKpiCard
                title={inactiveCompetitors.title}
                tone="conversion"
                value={formatCount(inactiveCompetitors.count)}
                subtitle={inactiveCompetitors.subtitle}
                cardClassName="s7-kpi-chrome--health-attention"
                valueIcon={
                  <AlertTriangle className="vendas-executive-kpi__value-icon-svg s7-competition-health-kpi-icon--inactive" />
                }
                valueClassName="s7-competition-health-kpi-value--inactive"
              />
              <VendasExecutiveKpiCard
                title={maxPricePressure.title}
                tone="conversion"
                value={
                  maxPricePressure.has_value && maxPricePressure.display_value
                    ? maxPricePressure.display_value
                    : formatCount(0)
                }
                subtitle={maxPricePressure.subtitle}
                cardClassName="s7-kpi-chrome--competition-pressure"
                valueIcon={
                  <TrendingDown className="vendas-executive-kpi__value-icon-svg s7-competition-health-kpi-icon--pressure" />
                }
                valueClassName="s7-competition-health-kpi-value--pressure"
              />
            </div>
          </>
        ) : null}
      </S7DashboardSectionPanel>
    </section>
  );
}
