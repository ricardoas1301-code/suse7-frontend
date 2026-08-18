// ======================================================================
// Top 10 executivo — componente único (pódio + lista) para os 3 cenários.
// Dados: executive-summary (rankings.*); sem cálculo financeiro no FE.
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { resolveShareProductThumbnail } from "../../shared/renderers/saleRayx/resolveShareProductThumbnail";
import { resolveSalesRowProductThumbUrl } from "../../utils/resolveSalesRowProductThumbUrl";
import TopRankingListingPopover from "./TopRankingListingPopover";
import {
  fetchExecutiveRankingThumbMap,
  mergeExecutiveRankingRowThumb,
  resolveExecutiveRankingListingImage,
} from "./executiveRankingListingThumb";
import {
  getTopRankingListMetricLine,
  getTopRankingPodiumDisplay,
  pickListingTitle,
  pickTopRankingFallbackImageUrl,
  rankingItemAsThumbRecord,
  resolveTopRankingDisplayRank,
  topRankingThumbCacheKey,
} from "./salesTopRankingUtils";
import S7Icon from "../ui/S7Icon";
import {
  EXECUTIVE_PANEL_EMPTY_RANKING_MESSAGE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "./vendasExecutivePanelUx";
import "./vendasExecutivePanelUx.css";
import "./SalesTopRankingCard.css";

function tryMlLargerImageUrl(url) {
  const s = url.trim();
  if (!s) return "";
  if (/-I\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(s)) {
    return s.replace(/-I\.(jpg|jpeg|png|webp)(\?.*)?$/i, "-O.$1$2");
  }
  return "";
}

/**
 * @param {{
 *   className?: string;
 *   variant?: "square" | "bubble";
 *   size?: "list" | "podium-sm" | "podium-lg";
 * }} props
 */
function TopRankingThumbPlaceholder({ className = "", variant = "square", size = "list" }) {
  const variantClass = variant === "bubble" ? "sales-top-ranking__thumb--bubble" : "sales-top-ranking__thumb--square";
  const sizeClass =
    size === "podium-lg"
      ? "sales-top-ranking__thumb--podium-lg"
      : size === "podium-sm"
        ? "sales-top-ranking__thumb--podium-sm"
        : "sales-top-ranking__thumb--list";

  return (
    <span
      className={`${variantClass} sales-top-ranking__thumb--placeholder ${sizeClass} ${className}`.trim()}
      aria-hidden
    />
  );
}

/**
 * @param {{
 *   imageUrl: string;
 *   fallbackUrl?: string;
 *   title: string;
 *   className?: string;
 *   variant?: "square" | "bubble";
 *   size?: "list" | "podium-sm" | "podium-lg";
 * }} props
 */
function TopRankingThumb({
  imageUrl,
  fallbackUrl = "",
  title,
  className = "",
  variant = "square",
  size = "list",
}) {
  const [broken, setBroken] = useState(false);
  const [srcOverride, setSrcOverride] = useState("");
  const [useFallback, setUseFallback] = useState(false);

  const primary = imageUrl.trim();
  const fallback = fallbackUrl.trim();
  const activeBase = useFallback && fallback ? fallback : primary;
  const src = (srcOverride || activeBase).trim();
  const showImage = src !== "" && !broken;

  const variantClass = variant === "bubble" ? "sales-top-ranking__thumb--bubble" : "sales-top-ranking__thumb--square";
  const sizeClass =
    size === "podium-lg"
      ? "sales-top-ranking__thumb--podium-lg"
      : size === "podium-sm"
        ? "sales-top-ranking__thumb--podium-sm"
        : "sales-top-ranking__thumb--list";

  useEffect(() => {
    setBroken(false);
    setSrcOverride("");
    setUseFallback(false);
  }, [imageUrl, fallbackUrl]);

  if (!showImage) {
    return <TopRankingThumbPlaceholder className={className} variant={variant} size={size} />;
  }

  return (
    <img
      className={`${variantClass} ${sizeClass} ${className}`.trim()}
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!srcOverride) {
          const larger = tryMlLargerImageUrl(activeBase);
          if (larger) {
            setSrcOverride(larger);
            return;
          }
        }
        if (!useFallback && fallback && activeBase === primary) {
          setUseFallback(true);
          setSrcOverride("");
          return;
        }
        setBroken(true);
      }}
    />
  );
}

/** Thumbnail — mesma cadeia do Raio-X / listagem de vendas. */
function TopRankingThumbFromItem({ item, title, className = "", variant = "square", size = "list" }) {
  const [imageUrl, setImageUrl] = useState(() => resolveExecutiveRankingListingImage(item).url);
  const [fallbackUrl, setFallbackUrl] = useState(() => pickTopRankingFallbackImageUrl(item));
  const cacheKey = useMemo(() => topRankingThumbCacheKey(item), [item]);
  const thumbRecord = useMemo(() => rankingItemAsThumbRecord(item), [item, cacheKey]);

  useEffect(() => {
    let cancelled = false;
    const sync = resolveExecutiveRankingListingImage(item, { logContext: "thumb_component" }).url;
    const syncFallback = pickTopRankingFallbackImageUrl(item);
    setImageUrl(sync);
    setFallbackUrl(syncFallback);
    if (sync) return undefined;

    const listingExtra =
      item?.listing != null && typeof item.listing === "object"
        ? /** @type {Record<string, unknown>} */ (item.listing)
        : null;

    (async () => {
      const rayx = await resolveShareProductThumbnail(thumbRecord, listingExtra);
      if (!cancelled && rayx.url) {
        setImageUrl(rayx.url);
        return;
      }

      const vendas = await resolveSalesRowProductThumbUrl(thumbRecord);
      if (!cancelled && vendas) setImageUrl(vendas);
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, item, thumbRecord]);

  return (
    <TopRankingThumb
      imageUrl={imageUrl}
      fallbackUrl={fallbackUrl}
      title={title}
      className={className}
      variant={variant}
      size={size}
    />
  );
}

/** @param {{ item: Record<string, unknown>; metric: "quantity" | "gross_revenue" | "net_profit"; displayRank: number; isHighlighted?: boolean; isDimmed?: boolean; onHoverStart?: () => void; onHoverEnd?: () => void; }} props */
export function SalesTopRankingPodium({
  item,
  metric,
  displayRank,
  isHighlighted = false,
  isDimmed = false,
  onHoverStart,
  onHoverEnd,
}) {
  const rank = displayRank;
  const fullTitle = pickListingTitle(item);
  const podiumLines = getTopRankingPodiumDisplay(item, metric);
  const thumbSize = rank === 1 ? "podium-lg" : "podium-sm";

  return (
    <article
      className={[
        `sales-top-ranking__podium-col sales-top-ranking__podium-col--rank-${rank}`,
        isHighlighted ? "sales-top-ranking__podium-col--podium-highlight" : "",
        isDimmed ? "sales-top-ranking__podium-col--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${rank}º lugar — ${fullTitle}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
    >
      <div className="sales-top-ranking__podium-pedestal">
        <div className="sales-top-ranking__podium-hero">
          <TopRankingListingPopover item={item} placement="top-start">
            <div
              className="sales-top-ranking__podium-photo-stack"
              aria-label={`${rank}º lugar — ${fullTitle}`}
            >
              <div className="sales-top-ranking__podium-bubble-inner">
                <TopRankingThumbFromItem
                  item={item}
                  title={fullTitle}
                  variant="bubble"
                  size={thumbSize}
                  className="sales-top-ranking__podium-thumb"
                />
                <span className="sales-top-ranking__podium-rank-badge" aria-hidden>
                  {rank}
                </span>
              </div>
            </div>
          </TopRankingListingPopover>
        </div>
          <div className="sales-top-ranking__podium-pedestal-inner">
            <div className="sales-top-ranking__podium-stats">
              <p className="sales-top-ranking__podium-sales">{podiumLines.salesLine}</p>
              <p className="sales-top-ranking__podium-value">{podiumLines.valueLine}</p>
            </div>
            <span className="sales-top-ranking__podium-prize" aria-hidden="true">
              {rank === 1 ? (
                <S7Icon name="podium_trophy" size={28} strokeWidth={1.85} />
              ) : (
                <S7Icon name="podium_medal" size={rank === 2 ? 24 : 22} strokeWidth={1.85} />
              )}
            </span>
        </div>
      </div>
    </article>
  );
}

/** @param {{ items: Record<string, unknown>[]; metric: "quantity" | "gross_revenue" | "net_profit"; popoverPlacement?: "bottom-start" | "top-start" | "left-center" | "right-center" }} props */
export function SalesTopRankingList({ items, metric, popoverPlacement = "left-center" }) {
  if (!items.length) {
    return <div className="sales-top-ranking__list-placeholder" aria-hidden />;
  }

  return (
    <div className="sales-top-ranking__list-panel">
      <ol className="sales-top-ranking__list" aria-label="Posições 4 a 10">
        {items.map((item, listIndex) => {
          const rank = resolveTopRankingDisplayRank({
            arrayIndex: listIndex + 3,
            fallbackRank: item.rank,
            metricKey: "lista-lateral",
          });
          const fullTitle = pickListingTitle(item);
          const metricLine = getTopRankingListMetricLine(item, metric);
          const key =
            item.listing_id != null
              ? String(item.listing_id)
              : item.rank != null
                ? `rank-${item.rank}`
                : fullTitle;

          return (
            <li key={key} className="sales-top-ranking__list-item">
              <span className="sales-top-ranking__list-rank">{rank}</span>
              <div className="sales-top-ranking__list-thumb-cell">
                <TopRankingThumbFromItem
                  item={item}
                  title={fullTitle}
                  variant="bubble"
                  size="list"
                  className="sales-top-ranking__list-thumb"
                />
              </div>
              <div className="sales-top-ranking__list-copy">
                <div className="sales-top-ranking__list-name">
                  <TopRankingListingPopover item={item} placement={popoverPlacement} />
                </div>
                <p className="sales-top-ranking__list-metric">{metricLine}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TopRankingSkeletonHeader({ external = false } = {}) {
  return (
    <div
      className={[
        "sales-top-ranking__head",
        "sales-top-ranking__head--skeleton",
        external ? "sales-top-ranking__head--external" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <span className="sales-top-ranking__skeleton-head-title" />
      <span className="sales-top-ranking__skeleton-head-badge" />
    </div>
  );
}

function TopRankingSkeleton() {
  return (
    <div
      className="sales-top-ranking__body sales-top-ranking__body--loading vendas-executive-state-fade-in"
      aria-hidden
    >
      <div className="sales-top-ranking__podium sales-top-ranking__podium--skeleton">
        <div className="sales-top-ranking__skeleton-podium-col sales-top-ranking__skeleton-podium-col--rank-2">
          <span className="sales-top-ranking__skeleton-bubble sales-top-ranking__skeleton-bubble--sm" />
          <span className="sales-top-ranking__skeleton-pedestal sales-top-ranking__skeleton-pedestal--rank-2" />
        </div>
        <div className="sales-top-ranking__skeleton-podium-col sales-top-ranking__skeleton-podium-col--rank-1">
          <span className="sales-top-ranking__skeleton-bubble sales-top-ranking__skeleton-bubble--lg" />
          <span className="sales-top-ranking__skeleton-pedestal sales-top-ranking__skeleton-pedestal--rank-1" />
        </div>
        <div className="sales-top-ranking__skeleton-podium-col sales-top-ranking__skeleton-podium-col--rank-3">
          <span className="sales-top-ranking__skeleton-bubble sales-top-ranking__skeleton-bubble--sm" />
          <span className="sales-top-ranking__skeleton-pedestal sales-top-ranking__skeleton-pedestal--rank-3" />
        </div>
      </div>
      <ul className="sales-top-ranking__list-panel sales-top-ranking__list-panel--skeleton">
        {Array.from({ length: 7 }).map((_, i) => (
          <li key={i} className="sales-top-ranking__skeleton-list-item">
            <span className="sales-top-ranking__skeleton-rank" />
            <span className="sales-top-ranking__skeleton-thumb" />
            <span className="sales-top-ranking__skeleton-lines">
              <span className="sales-top-ranking__skeleton-line" />
              <span className="sales-top-ranking__skeleton-line sales-top-ranking__skeleton-line--short" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{ variant: "empty" | "error"; message: string; onRetry?: () => void }} props
 */
function TopRankingPanelState({ variant, message, onRetry }) {
  return (
    <div
      className={`sales-top-ranking__body sales-top-ranking__body--state sales-top-ranking__body--state-${variant} vendas-executive-state-fade-in`}
      role={variant === "error" ? "alert" : "status"}
    >
      <div className="sales-top-ranking__state-center">
        {variant === "empty" ? (
          <span className="sales-top-ranking__state-icon" aria-hidden>
            <S7Icon name="catalog_filter_no_sales" size={28} strokeWidth={1.75} />
          </span>
        ) : null}
        <p className="sales-top-ranking__state-message">{message}</p>
        {variant === "error" && onRetry ? (
          <div className="sales-top-ranking__state-actions">
            <button type="button" className="sales-top-ranking__retry-btn" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SalesTopRankingCard({
  title,
  metric,
  listings = [],
  loading = false,
  error = null,
  periodLabel = null,
  tituloExterno = false,
  onRetry,
  showEmptyState = false,
}) {
  const { user } = useAuthBootstrap();
  const [thumbByListingId, setThumbByListingId] = useState(/** @type {Record<string, string>} */ ({}));

  const normalized = useMemo(
    () => (Array.isArray(listings) ? listings.filter((row) => row != null && typeof row === "object") : []),
    [listings],
  );

  useEffect(() => {
    const userId = user?.id != null ? String(user.id) : "";
    if (!userId || normalized.length === 0) {
      setThumbByListingId({});
      return;
    }

    let cancelled = false;
    fetchExecutiveRankingThumbMap(userId, normalized).then((map) => {
      if (!cancelled) setThumbByListingId(map);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, normalized]);

  const hydrated = useMemo(
    () => normalized.map((row) => mergeExecutiveRankingRowThumb(row, thumbByListingId)),
    [normalized, thumbByListingId],
  );

  const topThree = hydrated.slice(0, 3);
  const rest = hydrated.slice(3, 10);
  const podiumCenter = topThree[0] ?? null;
  const podiumLeft = topThree[1] ?? null;
  const podiumRight = topThree[2] ?? null;

  const showLoading = Boolean(loading);
  const showError = Boolean(error) && !showLoading;
  const showEmpty = Boolean(showEmptyState) && !showLoading && !showError;
  const showContent = !showLoading && !showError && !showEmpty && normalized.length > 0;
  const panelErrorMessage = error ? EXECUTIVE_PANEL_ERROR_MESSAGE : null;
  const [activePodiumRank, setActivePodiumRank] = useState(/** @type {number | null} */ (null));
  const toneClass =
    metric === "gross_revenue"
      ? "sales-top-ranking--tone-revenue"
      : metric === "net_profit"
        ? "sales-top-ranking--tone-profit"
        : "sales-top-ranking--tone-quantity";

  const headerNode =
    showLoading ? (
      <TopRankingSkeletonHeader external={tituloExterno} />
    ) : (
      <header
        className={[
          "sales-top-ranking__head",
          tituloExterno ? "sales-top-ranking__head--external" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <h2 className="sales-top-ranking__title">{title}</h2>
        {periodLabel ? <span className="sales-top-ranking__period-badge">{periodLabel}</span> : null}
      </header>
    );

  const cardShell = (
    <div
      className={[
        "sales-top-ranking",
        toneClass,
        showLoading ? "sales-top-ranking--loading" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!tituloExterno ? headerNode : null}

      <div className="sales-top-ranking__stage">
        {showLoading ? <TopRankingSkeleton /> : null}
        {showError && panelErrorMessage ? (
          <TopRankingPanelState variant="error" message={panelErrorMessage} onRetry={onRetry} />
        ) : null}
        {showEmpty ? (
          <TopRankingPanelState variant="empty" message={EXECUTIVE_PANEL_EMPTY_RANKING_MESSAGE} />
        ) : null}
        {showContent ? (
          <div className="sales-top-ranking__body vendas-executive-state-fade-in">
            <div className="sales-top-ranking__podium" aria-label="Top 3 anúncios">
              {podiumLeft ? (
                <SalesTopRankingPodium
                  item={podiumLeft}
                  metric={metric}
                  displayRank={resolveTopRankingDisplayRank({
                    arrayIndex: 1,
                    fallbackRank: podiumLeft.rank,
                    metricKey: metric,
                  })}
                  isHighlighted={activePodiumRank === 2}
                  isDimmed={activePodiumRank != null && activePodiumRank !== 2}
                  onHoverStart={() => setActivePodiumRank(2)}
                  onHoverEnd={() => setActivePodiumRank(null)}
                />
              ) : null}
              {podiumCenter ? (
                <SalesTopRankingPodium
                  item={podiumCenter}
                  metric={metric}
                  displayRank={resolveTopRankingDisplayRank({
                    arrayIndex: 0,
                    fallbackRank: podiumCenter.rank,
                    metricKey: metric,
                  })}
                  isHighlighted={activePodiumRank === 1}
                  isDimmed={activePodiumRank != null && activePodiumRank !== 1}
                  onHoverStart={() => setActivePodiumRank(1)}
                  onHoverEnd={() => setActivePodiumRank(null)}
                />
              ) : null}
              {podiumRight ? (
                <SalesTopRankingPodium
                  item={podiumRight}
                  metric={metric}
                  displayRank={resolveTopRankingDisplayRank({
                    arrayIndex: 2,
                    fallbackRank: podiumRight.rank,
                    metricKey: metric,
                  })}
                  isHighlighted={activePodiumRank === 3}
                  isDimmed={activePodiumRank != null && activePodiumRank !== 3}
                  onHoverStart={() => setActivePodiumRank(3)}
                  onHoverEnd={() => setActivePodiumRank(null)}
                />
              ) : null}
            </div>
            <SalesTopRankingList items={rest} metric={metric} />
          </div>
        ) : null}
      </div>
    </div>
  );

  if (tituloExterno) {
    return (
      <div className="sales-top-ranking-stack sales-top-ranking-stack--titulo-externo">
        {headerNode}
        {cardShell}
      </div>
    );
  }

  return cardShell;
}
