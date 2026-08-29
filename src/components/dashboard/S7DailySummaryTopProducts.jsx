// ======================================================================
// Top 3 do dia — Resumo Diário / Vendas ao Vivo (ciclo operacional).
// Troféu CPJ-0004 = ranking listing 30d somente quando há 1 listing vinculado.
// Multi-listing: sem troféu (decisão de produto pendente).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { SalesTopRankingList } from "../sales/SalesTopRankingCard.jsx";
import {
  fetchExecutiveRankingThumbMap,
  mergeExecutiveRankingRowThumb,
} from "../sales/executiveRankingListingThumb";
import { useS7Top10Ranking } from "../../features/top10/useS7Top10Ranking.js";
import { pickListingIdForTop10Badge } from "../../features/top10/buildTop10QuantityRankLookup.js";
import { normalizeLinkedListingIds } from "../sales/salesTopRankingUtils.js";
import "../sales/vendasExecutivePanelUx.css";
import "../sales/SalesTopRankingCard.css";

/**
 * @param {{
 *   items: readonly Record<string, unknown>[];
 *   marketplaceAccountId?: string | null;
 * }} props
 */
export default function S7DailySummaryTopProducts({ items, marketplaceAccountId = "" }) {
  const { user } = useAuthBootstrap();
  const [thumbByListingId, setThumbByListingId] = useState(/** @type {Record<string, string>} */ ({}));

  const { getEntryForListingId } = useS7Top10Ranking({
    marketplaceAccountId,
  });

  const normalized = useMemo(
    () => (Array.isArray(items) ? items.filter((row) => row != null && typeof row === "object") : []),
    [items],
  );

  useEffect(() => {
    const userId = user?.id != null ? String(user.id) : "";
    if (!userId || normalized.length === 0) {
      setThumbByListingId({});
      return undefined;
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

  const topThree = useMemo(() => hydrated.slice(0, 3), [hydrated]);

  /**
   * Cenário A: exatamente 1 listing → correlaciona com ranking 30d.
   * Cenário B: vários listings → null (sem escolha arbitrária).
   * @param {Record<string, unknown>} item
   */
  const resolveTrophyRank = (item) => {
    const linked = normalizeLinkedListingIds(item);
    if (linked.length !== 1) return null;
    const soleId = pickListingIdForTop10Badge(item) || linked[0];
    return getEntryForListingId(soleId)?.rank ?? null;
  };

  /**
   * @param {Record<string, unknown>} item
   */
  const resolveTrophySalesCount = (item) => {
    const linked = normalizeLinkedListingIds(item);
    if (linked.length !== 1) return null;
    const soleId = pickListingIdForTop10Badge(item) || linked[0];
    return getEntryForListingId(soleId)?.quantitySold ?? null;
  };

  const anySoleListingTrophy = topThree.some((item) => {
    const linked = normalizeLinkedListingIds(item);
    if (linked.length !== 1) return false;
    const soleId = pickListingIdForTop10Badge(item) || linked[0];
    const rank = getEntryForListingId(soleId)?.rank ?? null;
    return rank != null;
  });

  return (
    <div className="s7-daily-summary__top-products" aria-label="Top 3 do dia">
      <span className="s7-daily-summary__top-products-label">Top 3 do dia</span>
      {topThree.length > 0 ? (
        <div className="sales-top-ranking sales-top-ranking--tone-quantity s7-daily-summary__top-products-ranking">
          <SalesTopRankingList
            items={topThree}
            metric="quantity"
            popoverPlacement="right-center"
            listRankArrayOffset={0}
            enableTop10Trophy={anySoleListingTrophy}
            resolveTrophyRank={resolveTrophyRank}
            resolveTrophySalesCount={resolveTrophySalesCount}
            trophyShowTooltip
            trophyPlacement="after-thumb"
            listAriaLabel="Top 3 do dia"
          />
        </div>
      ) : (
        <p className="s7-daily-summary__top-products-empty">—</p>
      )}
    </div>
  );
}
