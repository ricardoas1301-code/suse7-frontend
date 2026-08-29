// ======================================================================
// Card compacto de venda — lista mobile (P_2.7), somente exibição.
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { getSaleHealthUi, getVendasTableFinancialHealthToneClass } from "../../../utils/saleHealthUi";
import { pickSaleRayxDetailItemId } from "../../../components/sales/saleRayxDetailItemId";
import { pickSaleOperationalStatusLabel } from "../../../components/sales/saleRayxFinancialPickers";
import { getSaleStatusToneClass } from "../utils/saleStatusToneClass";
import { resolveSalesRowProductThumbUrl, salesRowThumbCacheKey } from "../../../utils/resolveSalesRowProductThumbUrl";
import {
  formatVendasBuyerNameShort,
  pickVendasListingMercadoLivreUrl,
  VENDAS_LIST_DASH,
} from "../utils/vendasListRowDisplay.js";
import { S7RankedThumbnail } from "../../../components/top10/S7Top10Badge.jsx";
import { buildTop10BadgeAriaLabel } from "../../top10/buildTop10QuantityRankLookup.js";
import "./VendasMobileSaleCard.css";
import VendasRowSelectCheckbox from "../selection/VendasRowSelectCheckbox.jsx";

const DASH = VENDAS_LIST_DASH;

/** @param {string | null | undefined} s */
function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** @param {string | null | undefined} s */
function formatPctApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** @returns {{ date: string; time: string } | null} */
function formatSaleDateParts(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** @param {{ date: string; time: string } | null} parts */
function formatSaleDateTimeLine(parts) {
  if (!parts) return null;
  return `${parts.date} ${parts.time}`;
}

/** @param {string} toneClass */
function finValueClass(toneClass) {
  if (toneClass === "vendas-page__fin--health-critical") return "vendas-mobile-sale-card__metric-value--critical";
  if (toneClass === "vendas-page__fin--health-warn") return "vendas-mobile-sale-card__metric-value--warn";
  if (toneClass === "vendas-page__fin--health-healthy") return "vendas-mobile-sale-card__metric-value--healthy";
  return "";
}

/** @param {{ row: Record<string, unknown>; top10Rank?: number | null; top10SalesCount?: number | null }} props */
function VendasMobileProductThumb({ row, top10Rank = null, top10SalesCount = null }) {
  const [src, setSrc] = useState("");
  const [broken, setBroken] = useState(false);
  const cacheKey = useMemo(() => salesRowThumbCacheKey(row), [row]);

  useEffect(() => {
    let cancelled = false;
    setSrc("");
    setBroken(false);
    (async () => {
      const u = await resolveSalesRowProductThumbUrl(row);
      if (!cancelled) setSrc(u != null && String(u).trim() !== "" ? String(u).trim() : "");
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, row]);

  const thumbInner =
    src !== "" && !broken ? (
      <span
        className="vendas-mobile-sale-card__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle"
        aria-hidden
      >
        <img
          className="vendas-mobile-sale-card__thumb s7-operational-thumb"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      </span>
    ) : (
      <span className="vendas-mobile-sale-card__thumb-slot" aria-hidden />
    );

  const numericRank = Number(top10Rank);
  if (!Number.isInteger(numericRank) || numericRank < 1 || numericRank > 10) {
    return thumbInner;
  }

  return (
    <S7RankedThumbnail
      rank={numericRank}
      size={26}
      salesCount={top10SalesCount}
      ariaLabel={buildTop10BadgeAriaLabel(numericRank, {
        mode: "last_30_days",
        salesCount: top10SalesCount,
      })}
    >
      {thumbInner}
    </S7RankedThumbnail>
  );
}

/**
 * @param {{
 *   title: string;
 *   listingMercadoLivreUrl: string | null;
 *   listingId: string;
 * }} props
 */
function VendasMobileProductTitle({ title, listingMercadoLivreUrl, listingId }) {
  const lid = listingId != null && String(listingId).trim() !== "" ? String(listingId).trim() : "";
  const titleNode = listingMercadoLivreUrl ? (
    <a
      href={listingMercadoLivreUrl}
      className="anuncios-ad-title-link vendas-mobile-sale-card__title-link"
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => e.stopPropagation()}
    >
      {title}
    </a>
  ) : (
    <span className="vendas-mobile-sale-card__title">{title}</span>
  );

  return (
    <div className="vendas-mobile-sale-card__headline">
      <div className="vendas-mobile-sale-card__title-slot">{titleNode}</div>
      {lid ? <span className="vendas-mobile-sale-card__listing-id">{lid}</span> : null}
    </div>
  );
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   onOpenRayx: (itemId: string) => void;
 *   selected?: boolean;
 *   onToggleSelect?: () => void;
 *   selectionDisabled?: boolean;
 *   selectionAriaLabel?: string;
 *   top10Rank?: number | null;
 *   top10SalesCount?: number | null;
 * }} props
 */
export default function VendasMobileSaleCard({
  row,
  onOpenRayx,
  selected = false,
  onToggleSelect,
  selectionDisabled = false,
  selectionAriaLabel = "Selecionar venda",
  top10Rank = null,
  top10SalesCount = null,
}) {
  const f = /** @type {Record<string, unknown>} */ (row.financials ?? {});
  const detailItemId = pickSaleRayxDetailItemId(row);
  const financialHealthTone = getVendasTableFinancialHealthToneClass(f.margin_percent);
  const healthUi = getSaleHealthUi(f);
  const dateParts = formatSaleDateParts(row.sale_date);
  const buyerName =
    row.buyer_display_name != null && String(row.buyer_display_name).trim() !== ""
      ? String(row.buyer_display_name).trim()
      : "";
  const listingIdForMeta =
    row.listing_id_display != null && String(row.listing_id_display).trim() !== ""
      ? String(row.listing_id_display).trim()
      : "";
  const productTitleDisplay =
    row.product_display_title != null && String(row.product_display_title).trim() !== ""
      ? String(row.product_display_title).trim()
      : "Produto não identificado";
  const listingMercadoLivreUrl = pickVendasListingMercadoLivreUrl(row, listingIdForMeta);
  const saleCode =
    row.sale_display_code != null && String(row.sale_display_code).trim() !== ""
      ? String(row.sale_display_code).trim()
      : DASH;
  const statusLabel = pickSaleOperationalStatusLabel(row);

  return (
    <article className={`vendas-mobile-sale-card${selected ? " vendas-mobile-sale-card--selected" : ""}`}>
      <div className="vendas-mobile-sale-card__product">
        <VendasRowSelectCheckbox
          checked={selected}
          disabled={selectionDisabled}
          onChange={() => onToggleSelect?.()}
          ariaLabel={selectionAriaLabel}
        />
        <VendasMobileProductThumb row={row} top10Rank={top10Rank} top10SalesCount={top10SalesCount} />
        <VendasMobileProductTitle
          title={productTitleDisplay}
          listingMercadoLivreUrl={listingMercadoLivreUrl}
          listingId={listingIdForMeta}
        />
      </div>

      <div className="vendas-mobile-sale-card__sale-block">
        <div className="vendas-mobile-sale-card__sale-line">
          <span className="vendas-mobile-sale-card__field-label">Venda</span>
          <span className="vendas-mobile-sale-card__sale-code">{saleCode}</span>
        </div>
        <div className="vendas-mobile-sale-card__sale-line vendas-mobile-sale-card__sale-line--meta">
          <span>{dateParts ? formatSaleDateTimeLine(dateParts) : DASH}</span>
        </div>
        {buyerName ? (
          <div className="vendas-mobile-sale-card__sale-line">
            <span className="vendas-mobile-sale-card__field-label">Comprador</span>
            <span className="vendas-mobile-sale-card__meta">{formatVendasBuyerNameShort(buyerName)}</span>
          </div>
        ) : null}
      </div>

      <div className="vendas-mobile-sale-card__metrics" aria-label="Lucro, margem e saúde">
        <div className="vendas-mobile-sale-card__metric">
          <span className="vendas-mobile-sale-card__metric-label">Lucro (R$)</span>
          <span className={`vendas-mobile-sale-card__metric-value ${finValueClass(financialHealthTone)}`}>
            {formatBrlApi(f.profit_brl)}
          </span>
        </div>
        <div className="vendas-mobile-sale-card__metric">
          <span className="vendas-mobile-sale-card__metric-label">Margem (%)</span>
          <span className={`vendas-mobile-sale-card__metric-value ${finValueClass(financialHealthTone)}`}>
            {formatPctApi(f.margin_percent)}
          </span>
        </div>
        <div className="vendas-mobile-sale-card__metric vendas-mobile-sale-card__metric--health">
          <span className="vendas-mobile-sale-card__metric-label">Saúde</span>
          <span className={`vendas-mobile-sale-card__health ${healthUi.badgeClass}`}>
            {healthUi.showDot ? <span className="vendas-mobile-sale-card__health-dot" aria-hidden /> : null}
            {healthUi.label}
          </span>
        </div>
      </div>

      <div className="vendas-mobile-sale-card__footer">
        <button
          type="button"
          className="vendas-mobile-sale-card__rayx-btn"
          disabled={!detailItemId}
          onClick={() => {
            if (detailItemId) onOpenRayx(detailItemId);
          }}
        >
          Raio-X
        </button>
        {statusLabel ? (
          <span
            className={`vendas-mobile-sale-card__status ${getSaleStatusToneClass(statusLabel)}`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}
