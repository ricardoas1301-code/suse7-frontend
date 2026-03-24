// ======================================================
// COMPONENTE: S7RankingCard
// Card premium de ranking (dashboard): top 3 destacados + 4–10.
// valueType: quantidade inteira ou moeda BRL (2 decimais).
// variant: identidade visual sutil (sales | revenue | profit).
// ======================================================

import S7Icon from "./S7Icon";
import "./S7RankingCard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

const qtyFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDisplayValue(value, valueType) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
  if (valueType === "currency") return brlFormatter.format(n);
  return qtyFormatter.format(n);
}

/**
 * @param {{
 *   title: string;
 *   valueType: "quantity" | "currency";
 *   items: Array<{ rank?: number; product_id: string; product_name: string; sku?: string; value: number }>;
 *   variant?: "sales" | "revenue" | "profit";
 *   loading?: boolean;
 *   emptyTitle?: string;
 *   emptyDescription?: string;
 *   onItemClick?: (item: { rank: number; product_id: string; product_name: string; value: number }) => void;
 *   className?: string;
 * }} props
 */
export default function S7RankingCard({
  title = "",
  valueType = "quantity",
  variant = "sales",
  items = [],
  loading = false,
  emptyTitle = "Sem dados ainda",
  emptyDescription = "Dados aparecem após vendas e vínculos com anúncios.",
  onItemClick,
  className = "",
}) {
  const sorted = [...items]
    .filter((r) => r && r.product_id)
    .sort((a, b) => (Number(a.rank) || 0) - (Number(b.rank) || 0))
    .slice(0, 10);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const handleActivate = (item, rankDisplay) => {
    const payload = {
      rank: rankDisplay,
      product_id: item.product_id,
      product_name: item.product_name,
      value: item.value,
    };
    if (import.meta.env.DEV) {
      console.info("[S7RankingCard] item click (preparado para filtro/detalhe)", payload);
    }
    onItemClick?.(payload);
  };

  const handleKeyDown = (e, item, rankDisplay) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate(item, rankDisplay);
    }
  };

  const rootClass = ["s7-ranking-card", `s7-ranking-card--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div className={`${rootClass} s7-ranking-card--loading`} aria-busy="true" aria-label={title}>
        <div className="s7-ranking-card__head">
          <div className="s7-ranking-card__title s7-ranking-card__skeleton s7-ranking-card__skeleton--title" />
        </div>
        <ul className="s7-ranking-card__list">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="s7-ranking-card__row s7-ranking-card__row--skeleton">
              <span className="s7-ranking-card__skeleton s7-ranking-card__skeleton--line" />
              <span className="s7-ranking-card__skeleton s7-ranking-card__skeleton--short" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className={rootClass}>
        <div className="s7-ranking-card__head">
          <h3 className="s7-ranking-card__title">{title}</h3>
        </div>
        <div className="s7-ranking-card__empty">
          <div className="s7-ranking-card__empty-icon" aria-hidden>
            <S7Icon name="reports" size={26} />
          </div>
          <p className="s7-ranking-card__empty-title">{emptyTitle}</p>
          <p className="s7-ranking-card__empty-desc">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  const skuLine = (item) => {
    const s = item?.sku != null ? String(item.sku).trim() : "";
    if (!s) return null;
    return (
      <span className="s7-ranking-card__sku" title={s}>
        {s}
      </span>
    );
  };

  return (
    <div className={rootClass}>
      <div className="s7-ranking-card__head">
        <h3 className="s7-ranking-card__title">{title}</h3>
      </div>

      <ul className="s7-ranking-card__list s7-ranking-card__list--podium">
        {top3.map((item, idx) => {
          const rankDisplay = Number(item.rank) || idx + 1;
          const medal = MEDALS[idx] || `${rankDisplay}º`;
          return (
            <li key={`${item.product_id}-${rankDisplay}`}>
              <button
                type="button"
                className={`s7-ranking-card__row s7-ranking-card__row--podium s7-ranking-card__row--place-${idx + 1}`}
                aria-label={`Posição ${rankDisplay}: ${item.product_name}`}
                onClick={() => handleActivate(item, rankDisplay)}
                onKeyDown={(e) => handleKeyDown(e, item, rankDisplay)}
              >
                <span className="s7-ranking-card__medal" aria-hidden>
                  {medal}
                </span>
                <span className="s7-ranking-card__text">
                  <span className="s7-ranking-card__name" title={item.product_name}>
                    {item.product_name}
                  </span>
                  {skuLine(item)}
                </span>
                <span className="s7-ranking-card__value">{formatDisplayValue(item.value, valueType)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {rest.length > 0 ? (
        <>
          <div className="s7-ranking-card__divider" role="presentation" />
          <ul className="s7-ranking-card__list s7-ranking-card__list--rest">
            {rest.map((item, idx) => {
              const rankDisplay = Number(item.rank) || idx + 4;
              return (
                <li key={`${item.product_id}-${rankDisplay}`}>
                  <button
                    type="button"
                    className="s7-ranking-card__row s7-ranking-card__row--compact"
                    aria-label={`Posição ${rankDisplay}: ${item.product_name}`}
                    onClick={() => handleActivate(item, rankDisplay)}
                    onKeyDown={(e) => handleKeyDown(e, item, rankDisplay)}
                  >
                    <span className="s7-ranking-card__rank-num">{rankDisplay}</span>
                    <span className="s7-ranking-card__text">
                      <span className="s7-ranking-card__name" title={item.product_name}>
                        {item.product_name}
                      </span>
                      {skuLine(item)}
                    </span>
                    <span className="s7-ranking-card__value">{formatDisplayValue(item.value, valueType)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
