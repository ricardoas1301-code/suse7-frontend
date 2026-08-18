// ======================================================================
// Top 3 produtos — Resumo Diário (reusa renderer da lista Top 10, posições 4–10).
// Thumbs: mesma hidratação do SalesTopRankingCard (fetchExecutiveRankingThumbMap).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import { SalesTopRankingList } from "../sales/SalesTopRankingCard.jsx";
import {
  fetchExecutiveRankingThumbMap,
  mergeExecutiveRankingRowThumb,
} from "../sales/executiveRankingListingThumb";
import "../sales/vendasExecutivePanelUx.css";
import "../sales/SalesTopRankingCard.css";

/**
 * @param {{
 *   items: readonly Record<string, unknown>[];
 * }} props
 */
export default function S7DailySummaryTopProducts({ items }) {
  const { user } = useAuthBootstrap();
  const [thumbByListingId, setThumbByListingId] = useState(/** @type {Record<string, string>} */ ({}));

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

  const ranked = hydrated.slice(0, 3).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return (
    <div className="s7-daily-summary__top-products" aria-label="Top 3 produtos do ciclo">
      <span className="s7-daily-summary__top-products-label">Top 3 Produtos</span>
      {ranked.length > 0 ? (
        <div className="sales-top-ranking sales-top-ranking--tone-quantity s7-daily-summary__top-products-ranking">
          <SalesTopRankingList items={ranked} metric="quantity" popoverPlacement="right-center" />
        </div>
      ) : (
        <p className="s7-daily-summary__top-products-empty">—</p>
      )}
    </div>
  );
}
