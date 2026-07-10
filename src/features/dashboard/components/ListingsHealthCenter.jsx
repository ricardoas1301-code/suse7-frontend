// ======================================================================
// Central de Saúde dos Anúncios — Dashboard executivo (somente renderização).
// SSOT: GET /api/dashboard/listings-health-summary
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, PackageCheck, ShoppingCart } from "lucide-react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { fetchListingsHealthSummary } from "../api/fetchListingsHealthSummary.js";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import VendasExecutiveKpiCard from "../../../components/sales/VendasExecutiveKpiCard.jsx";
import S7DashboardSectionPanel from "../../../components/dashboard/S7DashboardSectionPanel.jsx";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import ListingHealthMiniGauge from "./ListingHealthMiniGauge.jsx";
import "./ListingHealthMiniGauge.css";
import "../../../components/sales/VendasExecutiveKpiCard.css";
import "./ListingsHealthCenter.css";

/** Mensagem amigável quando a API falha (HTTP ou payload ok:false). */
const FRIENDLY_LOAD_ERROR = "Não foi possível carregar a Central de Saúde dos Anúncios agora.";
const FRIENDLY_LOAD_ERROR_HINT =
  "Tente atualizar a página. Se continuar, verifique os logs do backend.";

/** @param {unknown} rawError */
function resolveFriendlyError(rawError) {
  const technical = rawError != null ? String(rawError).trim() : "";
  if (import.meta.env?.DEV && technical) {
    console.error("[ListingsHealthCenter] technical error", { message: technical });
  }
  return FRIENDLY_LOAD_ERROR;
}

/** @param {unknown} value */
function formatCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

/** @param {unknown} value */
function readSummaryCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Padrão Top 10 — título externo + card branco com altura fixa.
 * @param {{ title: string; children: import("react").ReactNode; className?: string }} props
 */
function HealthMainCard({ title, children, className = "" }) {
  return (
    <div
      className={[
        "s7-dashboard-large-card-stack",
        "s7-listings-health-center__main-card-stack",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="s7-dashboard-large-card-head s7-listings-health-center__main-card-head">{title}</h3>
      <article className="s7-dashboard-large-card s7-listings-health-center__main-card">{children}</article>
    </div>
  );
}

/** @param {string} bandKey @param {Record<string, unknown>} row */
function resolveBandVisual(bandKey, row) {
  const shortLabel =
    row.short_label != null && String(row.short_label).trim() !== ""
      ? String(row.short_label).trim()
      : bandKey === "complete"
        ? "100%"
        : bandKey === "excellent"
          ? "90–99%"
          : bandKey === "attention"
            ? "70–89%"
            : bandKey === "critical"
              ? "50–69%"
              : "<50%";
  const gaugeValue =
    row.gauge_value != null && Number.isFinite(Number(row.gauge_value))
      ? Number(row.gauge_value)
      : bandKey === "complete"
        ? 100
        : bandKey === "excellent"
          ? 95
          : bandKey === "attention"
            ? 80
            : bandKey === "critical"
              ? 60
              : 25;
  const tone =
    row.severity != null && String(row.severity).trim() !== ""
      ? String(row.severity).trim()
      : bandKey || "attention";
  return { shortLabel, gaugeValue, tone };
}

/** @param {number} count */
function formatBandCount(count) {
  const n = Number(count);
  const safe = Number.isFinite(n) ? n : 0;
  return `${formatCount(safe)} anúncio${safe === 1 ? "" : "s"}`;
}

const REGISTRATION_BAND_ORDER = ["complete", "excellent", "attention", "critical", "urgent"];

const OPERATIONAL_BAND_ORDER = ["active", "critical_stock", "zero_stock", "paused", "inactive"];

const COMMERCIAL_BAND_ORDER = [
  "excellent_margin",
  "healthy_margin",
  "attention_margin",
  "critical_margin",
  "negative_margin",
  "no_commercial_data",
];

/** @type {Record<string, string>} */
const COMMERCIAL_BAND_TOOLTIPS = {
  excellent_margin: "Total de anúncios com margem de lucro superior a 30%.",
  healthy_margin: "Total de anúncios com margem de lucro entre 20% e 29%.",
  attention_margin: "Total de anúncios com margem de lucro entre 10% e 19%.",
  critical_margin: "Total de anúncios com margem de lucro entre 0% e 9%.",
  negative_margin: "Total de anúncios com vendas em prejuízo.",
  no_commercial_data:
    "Anúncios sem histórico de venda ou sem margem calculável no período consolidado.",
};

/** Topo visual do pódio comercial — fração da altura da coluna (cap + degrau). */
/** @type {Record<string, number>} */
const COMMERCIAL_BAND_TOOLTIP_ANCHOR_TOP = {
  excellent_margin: 0.1,
  healthy_margin: 0.24,
  attention_margin: 0.36,
  critical_margin: 0.46,
  negative_margin: 0.54,
  no_commercial_data: 0.62,
};

/**
 * @param {number} totalListings
 */
function formatHealthPodiumTotalLine(totalListings) {
  const safeTotal = Number.isFinite(totalListings) ? totalListings : 0;
  return `Total de anúncios: ${formatCount(safeTotal)}`;
}

/** @param {{ totalListings: number }} props */
function HealthPodiumTotalLine({ totalListings }) {
  return (
    <p className="s7-listings-health-center__health-podium-total">
      {formatHealthPodiumTotalLine(totalListings)}
    </p>
  );
}

/**
 * @param {string} bandKey
 * @param {number} count
 * @param {string} [fallback]
 */
function formatOperationalStepLabel(bandKey, count, fallback = "") {
  const n = Number.isFinite(count) ? count : 0;
  if (bandKey === "active") return n === 1 ? "ativo" : "ativos";
  if (bandKey === "critical_stock") return n === 1 ? "crítico" : "críticos";
  if (bandKey === "zero_stock") return "sem estoque";
  if (bandKey === "paused") return n === 1 ? "pausado" : "pausados";
  if (bandKey === "inactive") return n === 1 ? "inativo" : "inativos";
  return fallback || "anúncios";
}

/**
 * @param {Array<Record<string, unknown>>} distribution
 */
function sortOperationalDistribution(distribution) {
  return [...distribution].sort((a, b) => {
    const keyA = String(a.key ?? "");
    const keyB = String(b.key ?? "");
    const idxA = OPERATIONAL_BAND_ORDER.indexOf(keyA);
    const idxB = OPERATIONAL_BAND_ORDER.indexOf(keyB);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {Array<Record<string, unknown>>} distribution
 */
function sortCommercialDistribution(distribution) {
  return [...distribution].sort((a, b) => {
    const keyA = String(a.key ?? "");
    const keyB = String(b.key ?? "");
    const idxA = COMMERCIAL_BAND_ORDER.indexOf(keyA);
    const idxB = COMMERCIAL_BAND_ORDER.indexOf(keyB);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {Array<Record<string, unknown>>} distribution
 */
function sortRegistrationDistribution(distribution) {
  return [...distribution].sort((a, b) => {
    const keyA = String(a.key ?? "");
    const keyB = String(b.key ?? "");
    const idxA = REGISTRATION_BAND_ORDER.indexOf(keyA);
    const idxB = REGISTRATION_BAND_ORDER.indexOf(keyB);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   stepIndex: number;
 *   isActive?: boolean;
 *   isDimmed?: boolean;
 *   onHoverStart?: () => void;
 *   onHoverEnd?: () => void;
 * }} props
 */
function RegistrationPodiumColumn({ row, stepIndex, isActive = false, isDimmed = false, onHoverStart, onHoverEnd }) {
  const key = String(row.key ?? "");
  const count = Number(row.count ?? 0);
  const accessibleLabel = String(row.label ?? key);
  const { shortLabel, gaugeValue, tone } = resolveBandVisual(key, row);
  const isLead = stepIndex === 0;
  const safeCount = Number.isFinite(count) ? count : 0;

  return (
    <div
      className={[
        "s7-listings-health-center__podium-column",
        `s7-listings-health-center__podium-column--${key || "unknown"}`,
        isLead ? "s7-listings-health-center__podium-column--lead" : "",
        isActive ? "s7-listings-health-center__podium-column--podium-highlight" : "",
        isDimmed ? "s7-listings-health-center__podium-column--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--s7-podium-step-index": stepIndex }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={`${accessibleLabel}: ${formatBandCount(safeCount)}`}
    >
      <div className="s7-listings-health-center__podium-gauge-wrap">
        <ListingHealthMiniGauge
          variant={isLead ? "podium-lead" : "podium"}
          tone={tone}
          gaugeValue={gaugeValue}
          displayText={shortLabel}
          ariaLabel={`${accessibleLabel}: ${formatBandCount(safeCount)}`}
        />
      </div>
      <div className="s7-listings-health-center__podium-step" aria-hidden={false}>
        <p className="s7-listings-health-center__podium-count">
          <span className="s7-listings-health-center__podium-count-value">{formatCount(safeCount)}</span>
          <span className="s7-listings-health-center__podium-count-label">
            anúncio{safeCount === 1 ? "" : "s"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Card de distribuição — Saúde do cadastro (pódio executivo por faixa).
 * @param {{
 *   title: string;
 *   distribution: Array<Record<string, unknown>>;
 *   totalListings: number;
 *   emptyLabel?: string;
 * }} props
 */
function RegistrationHealthCard({
  title,
  distribution,
  totalListings,
  emptyLabel = "Nenhum anúncio monitorado.",
}) {
  const hasData = totalListings > 0 && distribution.length > 0;
  const sorted = sortRegistrationDistribution(distribution);
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));

  return (
    <HealthMainCard title={title}>
      <div className="s7-listings-health-center__main-card-body s7-listings-health-center__main-card-body--registration">
        {hasData ? <HealthPodiumTotalLine totalListings={totalListings} /> : null}
        {!hasData || sorted.length === 0 ? (
          <p className="s7-listings-health-center__empty">{emptyLabel}</p>
        ) : (
          <div className="s7-listings-health-center__registration-podium" role="img" aria-label="Distribuição da saúde de cadastro por faixa">
            {sorted.map((row, index) => {
              const key = String(row.key ?? row.label ?? index);
              return (
                <RegistrationPodiumColumn
                  key={key}
                  row={row}
                  stepIndex={index}
                  isActive={activeBandKey === key}
                  isDimmed={activeBandKey != null && activeBandKey !== key}
                  onHoverStart={() => setActiveBandKey(key)}
                  onHoverEnd={() => setActiveBandKey(null)}
                />
              );
            })}
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   stepIndex: number;
 *   isActive?: boolean;
 *   isDimmed?: boolean;
 *   onHoverStart?: () => void;
 *   onHoverEnd?: () => void;
 * }} props
 */
function OperationalPodiumColumn({
  row,
  stepIndex,
  isActive = false,
  isDimmed = false,
  onHoverStart,
  onHoverEnd,
}) {
  const key = String(row.key ?? "");
  const count = Number(row.count ?? 0);
  const safeCount = Number.isFinite(count) ? count : 0;
  const shortLabel =
    row.short_label != null && String(row.short_label).trim() !== ""
      ? String(row.short_label).trim()
      : String(row.label ?? key);
  const stepLabel = formatOperationalStepLabel(
    key,
    safeCount,
    row.step_label != null ? String(row.step_label) : "anúncios",
  );
  const isLead = stepIndex === 0;

  return (
    <div
      className={[
        "s7-listings-health-center__podium-column",
        `s7-listings-health-center__podium-column--${key || "unknown"}`,
        isLead ? "s7-listings-health-center__podium-column--lead" : "",
        isActive ? "s7-listings-health-center__podium-column--podium-highlight" : "",
        isDimmed ? "s7-listings-health-center__podium-column--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--s7-podium-step-index": stepIndex }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={`${shortLabel}: ${formatCount(safeCount)} ${stepLabel}`}
    >
      <div className="s7-listings-health-center__podium-cap-wrap">
        <span className="s7-listings-health-center__podium-cap-label">{shortLabel}</span>
      </div>
      <div className="s7-listings-health-center__podium-step" aria-hidden={false}>
        <p className="s7-listings-health-center__podium-count">
          <span className="s7-listings-health-center__podium-count-value">{formatCount(safeCount)}</span>
          <span className="s7-listings-health-center__podium-count-label">{stepLabel}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Card de distribuição — Saúde operacional (pódio executivo por estado).
 * @param {{
 *   title: string;
 *   distribution: Array<Record<string, unknown>>;
 *   totalListings: number;
 *   emptyLabel?: string;
 * }} props
 */
function OperationalHealthCard({
  title,
  distribution,
  totalListings,
  emptyLabel = "Nenhum anúncio monitorado.",
}) {
  const hasData = totalListings > 0 && distribution.length > 0;
  const sorted = sortOperationalDistribution(distribution);
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));

  return (
    <HealthMainCard title={title}>
      <div className="s7-listings-health-center__main-card-body s7-listings-health-center__main-card-body--operational">
        {hasData ? <HealthPodiumTotalLine totalListings={totalListings} /> : null}
        {!hasData || sorted.length === 0 ? (
          <p className="s7-listings-health-center__empty">{emptyLabel}</p>
        ) : (
          <div
            className="s7-listings-health-center__operational-podium"
            role="img"
            aria-label="Distribuição da saúde operacional por estado"
          >
            {sorted.map((row, index) => {
              const key = String(row.key ?? row.label ?? index);
              return (
                <OperationalPodiumColumn
                  key={key}
                  row={row}
                  stepIndex={index}
                  isActive={activeBandKey === key}
                  isDimmed={activeBandKey != null && activeBandKey !== key}
                  onHoverStart={() => setActiveBandKey(key)}
                  onHoverEnd={() => setActiveBandKey(null)}
                />
              );
            })}
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   stepIndex: number;
 *   isActive?: boolean;
 *   isDimmed?: boolean;
 *   onHoverStart?: () => void;
 *   onHoverEnd?: () => void;
 * }} props
 */
function CommercialPodiumColumn({
  row,
  stepIndex,
  isActive = false,
  isDimmed = false,
  onHoverStart,
  onHoverEnd,
}) {
  const key = String(row.key ?? "");
  const count = Number(row.count ?? 0);
  const safeCount = Number.isFinite(count) ? count : 0;
  const shortLabel =
    row.short_label != null && String(row.short_label).trim() !== ""
      ? String(row.short_label).trim()
      : String(row.label ?? key);
  const isLead = stepIndex === 0;
  const tooltipContent = COMMERCIAL_BAND_TOOLTIPS[key] ?? String(row.label ?? shortLabel);
  const tooltipAnchorTop = COMMERCIAL_BAND_TOOLTIP_ANCHOR_TOP[key] ?? 0.1;

  return (
    <S7Tooltip
      content={tooltipContent}
      wrap
      placement="top-start"
      offset={8}
      anchorTopRatio={tooltipAnchorTop}
      className="s7-listings-health-center__podium-tooltip"
    >
      <div
        className={[
          "s7-listings-health-center__podium-column",
          `s7-listings-health-center__podium-column--${key || "unknown"}`,
          isLead ? "s7-listings-health-center__podium-column--lead" : "",
          isActive ? "s7-listings-health-center__podium-column--podium-highlight" : "",
          isDimmed ? "s7-listings-health-center__podium-column--dimmed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ "--s7-podium-step-index": stepIndex }}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        onFocus={onHoverStart}
        onBlur={onHoverEnd}
        tabIndex={0}
        role="group"
        aria-label={`${shortLabel}: ${formatBandCount(safeCount)}`}
      >
        <div className="s7-listings-health-center__podium-cap-wrap">
          <span className="s7-listings-health-center__podium-cap-label">{shortLabel}</span>
        </div>
        <div className="s7-listings-health-center__podium-step" aria-hidden={false}>
          <p className="s7-listings-health-center__podium-count">
            <span className="s7-listings-health-center__podium-count-value">{formatCount(safeCount)}</span>
            <span className="s7-listings-health-center__podium-count-label">
              anúncio{safeCount === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>
    </S7Tooltip>
  );
}

/**
 * Card de distribuição — Saúde comercial (pódio por margem histórica).
 * @param {{
 *   title: string;
 *   distribution: Array<Record<string, unknown>>;
 *   totalListings: number;
 *   emptyLabel?: string;
 * }} props
 */
function CommercialHealthCard({ title, distribution, totalListings, emptyLabel = "Nenhum anúncio monitorado." }) {
  const hasData = totalListings > 0 && distribution.length > 0;
  const sorted = sortCommercialDistribution(distribution);
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));

  return (
    <HealthMainCard title={title}>
      <div className="s7-listings-health-center__main-card-body s7-listings-health-center__main-card-body--commercial">
        {hasData ? <HealthPodiumTotalLine totalListings={totalListings} /> : null}
        {!hasData || sorted.length === 0 ? (
          <p className="s7-listings-health-center__empty">{emptyLabel}</p>
        ) : (
          <div
            className="s7-listings-health-center__commercial-podium"
            role="img"
            aria-label="Distribuição da saúde comercial por faixa de margem"
          >
            {sorted.map((row, index) => {
              const rowKey = String(row.key ?? row.label ?? index);
              return (
                <CommercialPodiumColumn
                  key={rowKey}
                  row={row}
                  stepIndex={index}
                  isActive={activeBandKey === rowKey}
                  isDimmed={activeBandKey != null && activeBandKey !== rowKey}
                  onHoverStart={() => setActiveBandKey(rowKey)}
                  onHoverEnd={() => setActiveBandKey(null)}
                />
              );
            })}
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

/**
 * @param {{ className?: string }} props
 */
export default function ListingsHealthCenter({
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
      const res = await fetchListingsHealthSummary();
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(resolveFriendlyError(res.error));
        setPayload(null);
        return;
      }
      if (res.ok === false || (res.error != null && String(res.error).trim() !== "")) {
        setError(resolveFriendlyError(res.error));
        setPayload(null);
        return;
      }
      setPayload({
        summary: res.summary,
        summary_cards: res.summary_cards,
        cards: res.cards,
        metadata: res.metadata,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  const summary = useMemo(() => {
    const s = payload?.summary;
    return s != null && typeof s === "object" ? /** @type {Record<string, unknown>} */ (s) : {};
  }, [payload]);

  const cards = useMemo(() => {
    const c = payload?.cards;
    return c != null && typeof c === "object" ? /** @type {Record<string, unknown>} */ (c) : {};
  }, [payload]);

  const registrationCard =
    cards.registration_health != null && typeof cards.registration_health === "object"
      ? /** @type {Record<string, unknown>} */ (cards.registration_health)
      : {};
  const operationalCard =
    cards.operational_health != null && typeof cards.operational_health === "object"
      ? /** @type {Record<string, unknown>} */ (cards.operational_health)
      : {};
  const commercialCard =
    cards.commercial_health != null && typeof cards.commercial_health === "object"
      ? /** @type {Record<string, unknown>} */ (cards.commercial_health)
      : {};

  const registrationDistribution = Array.isArray(registrationCard.distribution)
    ? registrationCard.distribution
    : [];
  const registrationTotalListings = Number(
    registrationCard.total_listings ?? summary.total_listings ?? 0,
  );
  const operationalDistribution = Array.isArray(operationalCard.distribution)
    ? operationalCard.distribution
    : [];
  const operationalTotalListings = Number(
    operationalCard.total_listings ?? summary.total_listings ?? 0,
  );
  const commercialDistribution = Array.isArray(commercialCard.distribution)
    ? commercialCard.distribution
    : [];
  const commercialTotalListings = Number(
    commercialCard.total_listings ?? summary.total_listings ?? 0,
  );

  const summaryCards = useMemo(() => {
    const sc = payload?.summary_cards;
    return sc != null && typeof sc === "object" ? /** @type {Record<string, unknown>} */ (sc) : {};
  }, [payload]);

  const summaryKpis = useMemo(() => {
    const activeCount = readSummaryCount(summaryCards.active_count);
    const pausedCount = readSummaryCount(summaryCards.paused_count);
    const inactiveCount = readSummaryCount(summaryCards.inactive_count);
    const totalListings = readSummaryCount(summary.total_listings);
    const activeWithSalesCount = readSummaryCount(summaryCards.active_with_sales_count);
    const activeWithoutSalesCount = readSummaryCount(summaryCards.active_without_sales_count);
    const offlineCount = readSummaryCount(summaryCards.offline_count);
    const needsAttentionCount = readSummaryCount(summaryCards.attention_count);

    return {
      activeCount,
      pausedCount,
      inactiveCount,
      offlineCount,
      totalListings,
      activeWithSalesCount,
      activeWithoutSalesCount,
      needsAttentionCount,
    };
  }, [summary, summaryCards]);

  const rootClass = ["s7-listings-health-center", className].filter(Boolean).join(" ");

  return (
    <section className={rootClass} aria-label="Central de Saúde dos Anúncios">
      <S7DashboardSectionPanel>
        <header className="s7-listings-health-center__head s7-section-jump-host">
          <h2 className="s7-listings-health-center__title">Central de Saúde dos Anúncios</h2>
          {sectionJumpDownTargetRef ? (
            <S7SectionJumpButton
              direction="down"
              targetRef={sectionJumpDownTargetRef}
              ariaLabel={sectionJumpDownAriaLabel}
            />
          ) : null}
        </header>

        {loading ? (
          <p className="s7-listings-health-center__loading" role="status">
            Carregando diagnóstico dos anúncios…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="s7-listings-health-center__error" role="alert">
            <p className="s7-listings-health-center__error-title">{error}</p>
            <p className="s7-listings-health-center__error-hint">{FRIENDLY_LOAD_ERROR_HINT}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="s7-listings-health-center__cards-row">
              <RegistrationHealthCard
                title="Saúde do cadastro"
                distribution={registrationDistribution}
                totalListings={registrationTotalListings}
                emptyLabel="Nenhum anúncio monitorado."
              />
              <OperationalHealthCard
                title="Saúde operacional"
                distribution={operationalDistribution}
                totalListings={operationalTotalListings}
                emptyLabel="Nenhum anúncio monitorado."
              />
              <CommercialHealthCard
                title="Saúde comercial"
                distribution={commercialDistribution}
                totalListings={commercialTotalListings}
                emptyLabel="Nenhum anúncio monitorado."
              />
            </div>

            <div
              className="s7-listings-health-center__executive-kpis s7-dashboard-executive-kpi-row"
              aria-label="Indicadores executivos da Central de Saúde dos Anúncios"
            >
              <VendasExecutiveKpiCard
                title="Anúncios ativos"
                tone="quantity"
                value={formatCount(summaryKpis.activeCount)}
                subtitle={`Total de anúncios: ${formatCount(summaryKpis.totalListings)}`}
                cardClassName="s7-kpi-chrome--health-active"
                valueIcon={
                  <PackageCheck className="vendas-executive-kpi__value-icon-svg s7-listings-health-kpi-icon--active" />
                }
              />
              <VendasExecutiveKpiCard
                title="Fora do ar"
                tone="profit"
                value={formatCount(summaryKpis.offlineCount)}
                subtitle={`Pausados: ${formatCount(summaryKpis.pausedCount)} · Inativos: ${formatCount(summaryKpis.inactiveCount)}`}
                cardClassName="s7-kpi-chrome--health-offline"
                valueIcon={
                  <Ban className="vendas-executive-kpi__value-icon-svg s7-listings-health-kpi-icon--offline" />
                }
                valueClassName="s7-listings-health-kpi-value--offline"
              />
              <VendasExecutiveKpiCard
                title="Ativos com venda"
                tone="conversion"
                value={formatCount(summaryKpis.activeWithSalesCount)}
                subtitle={`Ativos sem venda: ${formatCount(summaryKpis.activeWithoutSalesCount)}`}
                cardClassName="s7-kpi-chrome--health-no-sales"
                valueIcon={
                  <ShoppingCart className="vendas-executive-kpi__value-icon-svg s7-listings-health-kpi-icon--no-sales" />
                }
                valueClassName="s7-listings-health-kpi-value--with-sales"
              />
              <VendasExecutiveKpiCard
                title="Precisam atenção"
                tone="profit"
                value={formatCount(summaryKpis.needsAttentionCount)}
                subtitle="Cadastro, estoque, status ou margem"
                cardClassName="s7-kpi-chrome--health-attention"
                valueIcon={
                  <AlertTriangle className="vendas-executive-kpi__value-icon-svg s7-listings-health-kpi-icon--attention" />
                }
                valueClassName="s7-listings-health-kpi-value--attention vendas-executive-kpi__value--negative-warn"
              />
            </div>
          </>
        ) : null}

        {!loading && !error && Number(summary.total_listings ?? 0) === 0 ? (
          <p className="s7-listings-health-center__empty" role="status">
            Nenhum anúncio encontrado para este filtro.
          </p>
        ) : null}
      </S7DashboardSectionPanel>
    </section>
  );
}
