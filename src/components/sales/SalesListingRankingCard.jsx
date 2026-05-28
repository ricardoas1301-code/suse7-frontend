// ======================================================================
// Card executivo — Ranking dos Anúncios (top 10, pódio + lista lateral).
// Dados somente via rankings.listings do executive-summary (sem cálculo FE).
// ======================================================================

import { useMemo, useState } from "react";
import { formatBrlFromApiString } from "../../features/listings/utils/catalogFormatters";
import "./SalesListingRankingCard.css";

const DEFAULT_TITLE = "Anúncio sem título";

/**
 * @param {Record<string, unknown> | null | undefined} period
 */
export function formatListingRankingPeriodLabel(period) {
  const preset =
    period?.preset != null && String(period.preset).trim() !== "" ? String(period.preset).trim().toLowerCase() : "all";
  if (preset === "30d") return "30 dias";
  if (preset === "7d") return "7 dias";
  if (preset === "today") return "Hoje";
  if (preset === "month") return "Mês atual";
  if (preset === "all") return "Todo período";
  if (preset === "custom") {
    const start = period?.start_date != null ? String(period.start_date) : "";
    const end = period?.end_date != null ? String(period.end_date) : "";
    if (start && end) return `${start} — ${end}`;
    return "Período customizado";
  }
  return "Todo período";
}

/** @param {unknown} qty */
function formatSalesCountLabel(qty) {
  const n = typeof qty === "number" ? qty : Number.parseInt(String(qty ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return "0 vendas";
  if (n === 1) return "1 venda";
  return `${n.toLocaleString("pt-BR")} vendas`;
}

/** @param {Record<string, unknown>} item */
function pickListingTitle(item) {
  const t = item.title != null ? String(item.title).trim() : "";
  return t !== "" ? t : DEFAULT_TITLE;
}

/**
 * @param {{ imageUrl: string; title: string; className?: string; compact?: boolean }} props
 */
function ListingRankingThumb({ imageUrl, title, className = "", compact = false }) {
  const [broken, setBroken] = useState(false);
  const src = imageUrl.trim();
  const showImage = src !== "" && !broken;

  if (showImage) {
    return (
      <img
        className={`sales-listing-ranking__thumb ${compact ? "sales-listing-ranking__thumb--compact" : ""} ${className}`.trim()}
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={`sales-listing-ranking__thumb sales-listing-ranking__thumb--placeholder ${compact ? "sales-listing-ranking__thumb--compact" : ""} ${className}`.trim()}
      aria-hidden
    >
      <span className="sales-listing-ranking__thumb-letter">{title.slice(0, 1).toUpperCase()}</span>
    </span>
  );
}

/**
 * @param {{
 *   item: Record<string, unknown>;
 *   variant: "podium" | "list";
 *   compact?: boolean;
 *   podiumSize?: "lg" | "sm";
 * }} props
 */
function ListingRankingEntry({ item, variant, compact = false, podiumSize = "sm" }) {
  const rank = typeof item.rank === "number" ? item.rank : Number.parseInt(String(item.rank ?? ""), 10) || 0;
  const title = pickListingTitle(item);
  const imageUrl = item.image_url != null ? String(item.image_url).trim() : "";
  const qtyLabel = formatSalesCountLabel(item.quantity_sold);
  const grossLabel = formatBrlFromApiString(
    item.gross_sales_brl != null ? String(item.gross_sales_brl) : null,
  );

  if (variant === "podium") {
    return (
      <article
        className={`sales-listing-ranking__podium-slot sales-listing-ranking__podium-slot--${podiumSize} sales-listing-ranking__podium-slot--rank-${rank} ${compact ? "sales-listing-ranking__podium-slot--compact" : ""}`}
      >
        <div className="sales-listing-ranking__podium-rank" aria-label={`${rank}º lugar`}>
          {rank}º
        </div>
        <ListingRankingThumb
          imageUrl={imageUrl}
          title={title}
          compact={compact}
          className="sales-listing-ranking__podium-thumb"
        />
        <p className="sales-listing-ranking__podium-title" title={title}>
          {title}
        </p>
        <p className="sales-listing-ranking__podium-qty">{qtyLabel}</p>
        <p className="sales-listing-ranking__podium-gross">{grossLabel}</p>
      </article>
    );
  }

  return (
    <li className={`sales-listing-ranking__list-item ${compact ? "sales-listing-ranking__list-item--compact" : ""}`}>
      <span className="sales-listing-ranking__list-rank" aria-hidden>
        {rank}
      </span>
      {compact ? (
        <div className="sales-listing-ranking__list-body">
          <p className="sales-listing-ranking__list-title" title={title}>
            {title}
          </p>
          <p className="sales-listing-ranking__list-meta sales-listing-ranking__list-meta--compact">
            <span>{qtyLabel}</span>
            <span className="sales-listing-ranking__list-sep" aria-hidden>
              ·
            </span>
            <span>{grossLabel}</span>
          </p>
        </div>
      ) : (
        <>
          <ListingRankingThumb imageUrl={imageUrl} title={title} className="sales-listing-ranking__list-thumb" />
          <div className="sales-listing-ranking__list-body">
            <p className="sales-listing-ranking__list-title" title={title}>
              {title}
            </p>
            <p className="sales-listing-ranking__list-meta">
              <span>{qtyLabel}</span>
              <span className="sales-listing-ranking__list-sep" aria-hidden>
                ·
              </span>
              <span>{grossLabel}</span>
            </p>
          </div>
        </>
      )}
    </li>
  );
}

/** @param {{ compact?: boolean }} props */
function ListingRankingSkeleton({ compact = false }) {
  return (
    <div
      className={`sales-listing-ranking__body sales-listing-ranking__body--loading ${compact ? "sales-listing-ranking__body--compact" : ""}`}
      aria-hidden
    >
      <div className="sales-listing-ranking__podium sales-listing-ranking__podium--skeleton">
        <div className="sales-listing-ranking__skeleton-block sales-listing-ranking__skeleton-block--podium-sm" />
        <div className="sales-listing-ranking__skeleton-block sales-listing-ranking__skeleton-block--podium-lg" />
        <div className="sales-listing-ranking__skeleton-block sales-listing-ranking__skeleton-block--podium-sm" />
      </div>
      <ol className="sales-listing-ranking__list sales-listing-ranking__list--skeleton">
        {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
          <li key={i} className="sales-listing-ranking__skeleton-row" />
        ))}
      </ol>
    </div>
  );
}

/**
 * @param {{
 *   variant?: "compact" | "standalone";
 *   listings?: Record<string, unknown>[];
 *   loading?: boolean;
 *   error?: string | null;
 *   period?: Record<string, unknown> | null;
 *   periodLabel?: string | null;
 * }} props
 */
export default function SalesListingRankingCard({
  variant = "standalone",
  listings = [],
  loading = false,
  error = null,
  period = null,
  periodLabel = null,
}) {
  const compact = variant === "compact";
  const resolvedPeriodLabel = periodLabel ?? formatListingRankingPeriodLabel(period);

  const normalized = useMemo(
    () => (Array.isArray(listings) ? listings.filter((row) => row != null && typeof row === "object") : []),
    [listings],
  );

  const topThree = normalized.slice(0, 3);
  const rest = normalized.slice(3, 10);
  const first = topThree.find((r) => r.rank === 1) ?? topThree[0] ?? null;
  const second = topThree.find((r) => r.rank === 2) ?? topThree[1] ?? null;
  const third = topThree.find((r) => r.rank === 3) ?? topThree[2] ?? null;

  const showEmpty = !loading && !error && normalized.length === 0;
  const showContent = !loading && !error && normalized.length > 0;

  const rootClass = [
    "sales-listing-ranking",
    compact ? "sales-listing-ranking--compact" : "sales-listing-ranking--standalone",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {!compact ? (
        <header className="sales-listing-ranking__head">
          <div className="sales-listing-ranking__head-text">
            <h2 className="sales-listing-ranking__title">Ranking dos anúncios</h2>
            <p className="sales-listing-ranking__subtitle">Top 10 anúncios por vendas no período</p>
          </div>
          <span className="sales-listing-ranking__period-badge">{resolvedPeriodLabel}</span>
        </header>
      ) : null}

      {error ? (
        <p className="sales-listing-ranking__inline-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <ListingRankingSkeleton compact={compact} /> : null}

      {!loading && !error && showEmpty ? (
        <div className="sales-listing-ranking__empty" role="status">
          Nenhum anúncio ranqueável no período.
        </div>
      ) : null}

      {showContent ? (
        <div className={`sales-listing-ranking__body ${compact ? "sales-listing-ranking__body--compact" : ""}`}>
          <div className="sales-listing-ranking__podium" aria-label="Top 3 anúncios">
            {second ? (
              <ListingRankingEntry item={second} variant="podium" compact={compact} podiumSize="sm" />
            ) : null}
            {first ? (
              <ListingRankingEntry item={first} variant="podium" compact={compact} podiumSize="lg" />
            ) : null}
            {third ? (
              <ListingRankingEntry item={third} variant="podium" compact={compact} podiumSize="sm" />
            ) : null}
          </div>

          {rest.length > 0 ? (
            <ol className="sales-listing-ranking__list" aria-label="Posições 4 a 10">
              {rest.map((item) => {
                const key =
                  item.listing_id != null
                    ? String(item.listing_id)
                    : item.rank != null
                      ? `rank-${item.rank}`
                      : pickListingTitle(item);
                return (
                  <ListingRankingEntry key={key} item={item} variant="list" compact={compact} />
                );
              })}
            </ol>
          ) : (
            <div className="sales-listing-ranking__list-placeholder" aria-hidden />
          )}
        </div>
      ) : null}
    </div>
  );
}
