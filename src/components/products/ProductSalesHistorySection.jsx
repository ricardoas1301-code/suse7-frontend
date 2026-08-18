// ======================================================================
// Histórico de vendas do produto — lista compacta sempre visível.
// ======================================================================

import raioxTriggerIcon from "../../assets/raiox-trigger-icon.png";
import {
  formatBrlFromApiString,
  formatPercentFromApiString,
} from "../../features/listings/utils/catalogFormatters";
import { pickSaleOperationalStatusLabel } from "../sales/saleRayxFinancialPickers";
import { pickSaleRayxDetailItemId } from "../sales/saleRayxDetailItemId";
import SaleDetailModal from "../sales/SaleDetailModal";
import { useSaleDetailModal } from "../sales/useSaleDetailModal";
import { resolveSaleStatusToneKey } from "../../features/vendas/utils/saleStatusToneClass.js";
import { formatMarketplaceListingDisplayId } from "../../utils/marketplaceListingId";
import S7CatalogAccountCell, {
  pickCatalogAccountFields,
  S7CatalogChannelCell,
} from "../catalog/S7CatalogAccountCell.jsx";
import "../catalog/S7CatalogAccountCell.css";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import S7Pagination from "../ui/S7Pagination";
import S7Tooltip from "../ui/S7Tooltip";
import "../Products.css";
import "./ProductSalesHistorySection.css";

const DASH = "—";

/**
 * @param {unknown} iso
 */
function formatSaleHistoryDate(iso) {
  if (iso == null || String(iso).trim() === "") return DASH;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("pt-BR");
}

/**
 * @param {string | null | undefined} raw
 */
function formatMoneyCell(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  return formatBrlFromApiString(String(raw));
}

/**
 * @param {string | null | undefined} raw
 */
function formatProfitCell(raw) {
  const text = formatMoneyCell(raw);
  if (text === DASH) return { text, tone: "" };
  const n = Number(String(raw).replace(",", "."));
  const tone =
    Number.isFinite(n) && n < 0
      ? "pf-product-sales-history__money--negative"
      : Number.isFinite(n) && n > 0
        ? "pf-product-sales-history__money--positive"
        : "";
  return { text, tone };
}

/**
 * @param {string | null | undefined} raw
 */
function formatMarginCell(raw) {
  if (raw == null || String(raw).trim() === "") return { text: DASH, tone: "" };
  const text = formatPercentFromApiString(String(raw));
  const n = Number(String(raw).replace(",", "."));
  const tone =
    Number.isFinite(n) && n < 0
      ? "pf-product-sales-history__money--negative"
      : Number.isFinite(n) && n > 0
        ? "pf-product-sales-history__money--positive"
        : "";
  return { text, tone };
}

/**
 * @param {Record<string, unknown>} row
 */
function pickSaleHistorySaleCode(row) {
  const code =
    row.sale_display_code != null && String(row.sale_display_code).trim() !== ""
      ? String(row.sale_display_code).trim()
      : row.external_order_id != null && String(row.external_order_id).trim() !== ""
        ? String(row.external_order_id).trim()
        : "";
  return code || null;
}

/**
 * @param {Record<string, unknown>} row
 */
function pickSaleHistoryListing(row) {
  const listingId =
    row.listing_id_display != null && String(row.listing_id_display).trim() !== ""
      ? String(row.listing_id_display).trim()
      : row.external_listing_id != null
        ? String(row.external_listing_id).trim()
        : "";
  if (!listingId) return null;
  return (
    formatMarketplaceListingDisplayId(
      row.marketplace != null ? String(row.marketplace) : "",
      listingId,
    ) || listingId
  );
}

/**
 * @param {Record<string, unknown>} row
 */
function pickSaleHistoryFinancials(row) {
  return row.financials != null && typeof row.financials === "object"
    ? /** @type {Record<string, unknown>} */ (row.financials)
    : {};
}

/**
 * @param {string | null | undefined} label
 */
function saleHistoryStatusClass(label) {
  const key = resolveSaleStatusToneKey(label);
  if (key === "entregue") return "pf-product-sales-history__status--success";
  if (key === "cancelada") return "pf-product-sales-history__status--danger";
  if (key === "enviar") return "pf-product-sales-history__status--warning";
  if (key === "caminho") return "pf-product-sales-history__status--info";
  return "pf-product-sales-history__status--neutral";
}

/**
 * @param {import("react").ReactNode} content
 */
function CellWithTooltip({ content, className = "" }) {
  const text = content != null ? String(content) : DASH;
  const textClass = [
    "pf-product-sales-history__cell-text",
    className,
    text.length > 14 ? "pf-product-sales-history__cell-text--truncate" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (text === DASH || text.length <= 14) {
    return <span className={textClass}>{text}</span>;
  }
  return (
    <S7Tooltip content={text} placement="top-start" offset={6} wrap>
      <span className={textClass}>{text}</span>
    </S7Tooltip>
  );
}

/**
 * @param {{
 *   value: string | null;
 *   ariaLabel: string;
 *   tooltipText: string;
 *   toastLabel: string;
 *   flashKey: string;
 *   toastEventType?: string;
 *   toastFailEventType?: string;
 *   toastEntityType?: string;
 * }} props
 */
function CopyableIdCell({
  value,
  ariaLabel,
  tooltipText,
  toastLabel,
  flashKey,
  toastEventType,
  toastFailEventType,
  toastEntityType,
}) {
  if (value == null || String(value).trim() === "") {
    return <span className="pf-product-sales-history__cell-text">{DASH}</span>;
  }

  const text = String(value).trim();

  return (
    <span
      className="s7-copy-group pf-product-sales-history__copy-row"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <CellWithTooltip content={text} className="pf-product-sales-history__id-text" />
      <S7CopyButton
        value={text}
        ariaLabel={ariaLabel}
        tooltipText={tooltipText}
        toastLabel={toastLabel}
        showToast={true}
        iconMode="unicode"
        flashMs={S7_COPY_OFFICIAL_FLASH_MS}
        flashKey={flashKey}
        toastEventType={toastEventType}
        toastFailEventType={toastFailEventType}
        toastEntityType={toastEntityType}
      />
    </span>
  );
}

/**
 * @param {{ itemId: string; onOpen: (itemId: string) => void }} props
 */
function SaleRayxOpenButton({ itemId, onOpen }) {
  return (
    <S7Tooltip content="Abrir Raio-X da venda" placement="top-start" offset={6} wrap>
      <button
        type="button"
        className="pf-product-sales-history__rayx-btn"
        aria-label="Abrir Raio-X da venda"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(itemId);
        }}
      >
        <img
          src={raioxTriggerIcon}
          alt=""
          aria-hidden
          className="pf-product-sales-history__rayx-btn-icon"
          loading="lazy"
          decoding="async"
        />
      </button>
    </S7Tooltip>
  );
}

/**
 * @param {{
 *   rows: readonly Record<string, unknown>[];
 *   total: number;
 *   salesCount?: number;
 *   page: number;
 *   totalPages: number;
 *   loading: boolean;
 *   error: string | null;
 *   onPageChange: (page: number) => void;
 *   embedded?: boolean;
 *   hideSectionTitle?: boolean;
 *   alwaysShowCount?: boolean;
 * }} props
 */
export default function ProductSalesHistorySection({
  rows,
  total,
  salesCount = 0,
  page,
  totalPages,
  loading,
  error,
  onPageChange,
  embedded = false,
  hideSectionTitle = false,
  alwaysShowCount = false,
}) {
  const displayTotal = salesCount > 0 ? salesCount : total;
  const showCountBadge = alwaysShowCount || displayTotal > 0;
  const { modalOpen, selectedItemId, openDetail, closeDetail } = useSaleDetailModal();

  return (
    <section
      className={[
        "pf-product-sales-history",
        embedded ? "pf-product-sales-history--embedded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Histórico de vendas"
    >
      <header className="pf-product-sales-history__head">
        {hideSectionTitle ? (
          <h3 className="pf-product-sales-history__subtitle">Total de vendas</h3>
        ) : (
          <h3 className="pf-product-sales-history__title">Histórico de vendas</h3>
        )}
        {showCountBadge ? (
          <span className="pf-product-sales-history__count">
            {displayTotal.toLocaleString("pt-BR")}
          </span>
        ) : null}
      </header>

      {loading ? <p className="hint pf-product-sales-history__hint">Carregando histórico…</p> : null}
      {error ? (
        <p className="hint pf-performance-error pf-product-sales-history__hint" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="hint pf-product-sales-history__hint">Nenhuma venda vinculada a este produto ainda.</p>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="pf-product-sales-history__table-block">
          <div className="pf-product-sales-history__table-card">
            <div className="pf-product-sales-history__table-hscroll">
              <table className="pf-product-sales-history__table">
                <thead>
                  <tr>
                    <th scope="col" className="pf-product-sales-history__col-rayx">
                      <span className="pf-product-sales-history__sr-only">Raio-X</span>
                    </th>
                    <th scope="col">Data</th>
                    <th scope="col">Nº Venda</th>
                    <th scope="col">Anúncio</th>
                    <th scope="col">Loja</th>
                    <th scope="col">Canal</th>
                    <th scope="col">Preço</th>
                    <th scope="col">Lucro (R$)</th>
                    <th scope="col">Lucro (%)</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((raw, index) => {
                    const row = raw && typeof raw === "object" ? raw : {};
                    const f = pickSaleHistoryFinancials(row);
                    const saleCode = pickSaleHistorySaleCode(row);
                    const listing = pickSaleHistoryListing(row);
                    const profit = formatProfitCell(f.profit_brl ?? f.contribution_profit_brl);
                    const margin = formatMarginCell(f.margin_percent);
                    const saleValue = formatMoneyCell(
                      f.sale_price ?? f.gross_sale_brl ?? f.gross_sales_brl ?? row.gross_sale_brl,
                    );
                    const accountFields = pickCatalogAccountFields(row);
                    const statusLabel = pickSaleOperationalStatusLabel(row) || DASH;
                    const statusClass = saleHistoryStatusClass(statusLabel);
                    const rowKey =
                      row.item_id ??
                      row.sale_item_id ??
                      `${row.external_order_id ?? "ord"}-${index}`;
                    const detailItemId = pickSaleRayxDetailItemId(row);

                    return (
                      <tr key={String(rowKey)}>
                        <td className="pf-product-sales-history__col-rayx">
                          {detailItemId ? (
                            <SaleRayxOpenButton itemId={detailItemId} onOpen={openDetail} />
                          ) : null}
                        </td>
                        <td>{formatSaleHistoryDate(row.sale_date ?? row.date_created_marketplace)}</td>
                        <td>
                          <CopyableIdCell
                            value={saleCode}
                            ariaLabel={`Copiar pedido ${saleCode ?? ""}`}
                            tooltipText="Copiar pedido"
                            toastLabel="Pedido"
                            flashKey={`product-rayx-sale-${saleCode ?? rowKey}`}
                            toastEventType="SALE_ORDER_COPIED"
                            toastFailEventType="SALE_ORDER_COPY_FAILED"
                            toastEntityType="sale"
                          />
                        </td>
                        <td>
                          <CopyableIdCell
                            value={listing}
                            ariaLabel={`Copiar anúncio ${listing ?? ""}`}
                            tooltipText="Copiar anúncio"
                            toastLabel="Anúncio"
                            flashKey={`product-rayx-listing-${listing ?? rowKey}`}
                            toastEventType="LISTING_SKU_COPIED"
                            toastFailEventType="LISTING_SKU_COPY_FAILED"
                            toastEntityType="listing"
                          />
                        </td>
                        <td className="pf-product-sales-history__account-col">
                          <S7CatalogAccountCell
                            compact
                            marketplaceAccountId={accountFields.marketplaceAccountId}
                            accountAlias={accountFields.accountAlias}
                            accountLogoUrl={accountFields.accountLogoUrl}
                          />
                        </td>
                        <td className="pf-product-sales-history__channel-col">
                          <S7CatalogChannelCell
                            marketplace={row.marketplace != null ? String(row.marketplace) : null}
                            marketplaceLabel={
                              row.marketplace_label != null ? String(row.marketplace_label) : null
                            }
                          />
                        </td>
                        <td className="pf-product-sales-history__num-col">{saleValue}</td>
                        <td
                          className={["pf-product-sales-history__num-col", profit.tone]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {profit.text}
                        </td>
                        <td
                          className={["pf-product-sales-history__num-col", margin.tone]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {margin.text}
                        </td>
                        <td>
                          <span
                            className={["pf-product-sales-history__status", statusClass]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {displayTotal > 0 ? (
            <S7Pagination
              page={page}
              totalPages={totalPages}
              total={displayTotal}
              noun="vendas"
              disabled={loading}
              ariaLabel="Paginação — histórico de vendas"
              onPrevious={() => onPageChange(Math.max(1, page - 1))}
              onNext={() => onPageChange(Math.min(totalPages, page + 1))}
            />
          ) : null}
        </div>
      ) : null}

      <SaleDetailModal open={modalOpen} itemId={selectedItemId} onClose={closeDetail} />
    </section>
  );
}
