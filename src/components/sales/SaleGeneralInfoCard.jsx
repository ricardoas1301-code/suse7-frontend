// ======================================================
// Dados gerais da venda (somente leitura, sem card).
// ======================================================

import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import { getMarketplaceBadgeAsset } from "../../utils/marketplaceBadge";
import { DASH, formatDatePt, truncateWordsDisplay } from "./saleRayxFormat";
import {
  pickFulfillmentDisplay,
  pickSaleNumberCopyText,
  pickSaleNumberDisplay,
  pickSaleTypeDisplay,
  pickSaleShippingDisplayCompact,
  pickSaleStatusLabel,
} from "./saleRayxGeneralDisplay";
import { getSaleStatusColor } from "./saleRayxStatusColor";
import { resolveMoneyReleaseDate } from "./saleRayxMoneyRelease";
import SaleRayXProductHeader from "./SaleRayXProductHeader";
import SaleRayXProductPhoto from "./SaleRayXProductPhoto";
import SaleRayXAccumulatedPerformance from "./SaleRayXAccumulatedPerformance";

/**
 * @param {{ value: string; copyText: string; empty: boolean }} props
 */
function CopyableSaleNumber({ value, copyText, empty }) {
  return (
    <div className="vendas-sale-rayx__copy-target anuncios-raiox-compare__toolbar-meta-block">
      <span
        className={[
          "vendas-sale-rayx__info-value-line",
          "vendas-sale-rayx__info-value-line--emphasis",
          empty ? "anuncios-sell-popover__value--empty" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
      <S7CopyButton
        value={copyText}
        ariaLabel="Copiar venda nº"
        tooltipText="Copiar venda nº"
        toastLabel="Venda nº"
        showToast={true}
        iconMode="unicode"
        flashMs={S7_COPY_OFFICIAL_FLASH_MS}
        flashKey="raiox-sale-number"
        toastEventType="LISTING_ID_COPIED"
        toastFailEventType="LISTING_ID_COPY_FAILED"
        toastEntityType="marketplace_listing"
        className="anuncios-raiox-compare__toolbar-copy"
      />
    </div>
  );
}

/**
 * @param {{ label: string; value: string }} props
 */
function InfoLineStack({ label, value }) {
  return (
    <div className="anuncios-sell-popover__block">
      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
        <span>{label}</span>
      </div>
      <div className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis">{value}</div>
    </div>
  );
}

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   emphasis?: boolean;
 *   valueTitle?: string | null;
 *   truncateValue?: boolean;
 *   tone?: "success" | "warning" | "danger" | "neutral";
 *   statusColor?: string | null;
 * }} props
 */
function InfoLine({
  label,
  value,
  emphasis = false,
  valueTitle = null,
  truncateValue = false,
  tone = "neutral",
  statusColor = null,
}) {
  const empty = value === DASH;
  const toneClass =
    tone === "success"
      ? "vendas-sale-rayx__info-value-line--status-success"
      : tone === "warning"
        ? "vendas-sale-rayx__info-value-line--status-warning"
        : tone === "danger"
          ? "vendas-sale-rayx__info-value-line--status-danger"
          : "";

  return (
    <div
      className={[
        "anuncios-sell-popover__block",
        "vendas-sale-rayx__info-line",
        emphasis ? "vendas-sale-rayx__info-line--emphasis" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
        <span>{label}</span>
      </div>
      <div
        className={[
          "vendas-sale-rayx__info-value-line",
          "vendas-sale-rayx__info-value-line--emphasis",
          truncateValue ? "vendas-sale-rayx__info-value-line--truncate" : "",
          toneClass,
          empty ? "anuncios-sell-popover__value--empty" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        title={valueTitle != null && String(valueTitle).trim() !== "" ? String(valueTitle).trim() : undefined}
        style={statusColor && !empty ? { color: statusColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   quantity: string;
 *   client: string;
 *   clientTitle?: string | null;
 * }} props
 */
function HeroQuantityClientRow({ quantity, client, clientTitle = null }) {
  return (
    <div className="anuncios-sell-popover__block vendas-sale-rayx__info-line vendas-sale-rayx__hero-client-qty-row">
      <div className="vendas-sale-rayx__hero-client-qty-grid">
        <span className="vendas-sale-rayx__hero-qty-client-label">Cliente</span>
        <span className="vendas-sale-rayx__hero-qty-client-label vendas-sale-rayx__hero-qty-client-label--qty">
          Quantidade
        </span>
        <span
          className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis vendas-sale-rayx__hero-qty-client-value vendas-sale-rayx__hero-qty-client-value--client vendas-sale-rayx__info-value-line--truncate"
          title={clientTitle != null && String(clientTitle).trim() !== "" ? String(clientTitle).trim() : undefined}
        >
          {client}
        </span>
        <span className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis vendas-sale-rayx__hero-qty-client-value vendas-sale-rayx__hero-qty-client-value--qty">
          {quantity}
        </span>
      </div>
    </div>
  );
}

/**
 * @param {{ display: { type: "full" | "flex" | "standard"; label: string } }} props
 */
function SaleFulfillmentValue({ display }) {
  const valueClass =
    display.type === "full"
      ? "vendas-sale-rayx__fulfillment-value vendas-sale-rayx__fulfillment-value--full"
      : display.type === "flex"
        ? "vendas-sale-rayx__fulfillment-value vendas-sale-rayx__fulfillment-value--flex"
        : "vendas-sale-rayx__fulfillment-value vendas-sale-rayx__fulfillment-value--standard";

  return (
    <div className={valueClass}>
      {display.type === "full" ? (
        <span className="vendas-sale-rayx__fulfillment-badge vendas-sale-rayx__fulfillment-badge--full" aria-label="FULL">
          <svg
            className="vendas-sale-rayx__fulfillment-bolt"
            viewBox="0 0 12 16"
            width="10"
            height="13"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M7.2 0 2.4 8.2h3.1L4.2 16l7.2-9.4H7.9L7.2 0Z"
            />
          </svg>
          FULL
        </span>
      ) : display.type === "flex" ? (
        <span className="vendas-sale-rayx__fulfillment-badge vendas-sale-rayx__fulfillment-badge--flex">
          {display.label}
        </span>
      ) : (
        <span className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis">{display.label}</span>
      )}
    </div>
  );
}

/**
 * @param {{
 *   display: { type: "ads" | "affiliate" | "standard"; label: string; icon: string | null };
 *   marketplace?: string | null;
 * }} props
 */
function SaleTypeValue({ display, marketplace = null }) {
  const mlBadge =
    display.type === "ads" && display.icon === "mercado_livre_ads"
      ? getMarketplaceBadgeAsset(marketplace ?? "mercado_livre")
      : null;

  return (
    <span
      className={[
        "vendas-sale-rayx__sale-type-value",
        display.type === "ads" ? "vendas-sale-rayx__sale-type-value--ads" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {mlBadge ? (
        <img
          src={mlBadge.src}
          alt=""
          className="vendas-sale-rayx__sale-type-ml-icon"
          width={14}
          height={14}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis vendas-sale-rayx__sale-type-label">
        {display.label}
      </span>
    </span>
  );
}

/**
 * @param {{
 *   display: { type: "full" | "flex" | "standard"; label: string };
 *   saleTypeDisplay: { type: "ads" | "affiliate" | "standard"; label: string; icon: string | null };
 *   marketplace?: string | null;
 * }} props
 */
function HeroFulfillmentSaleTypeRow({ display, saleTypeDisplay, marketplace = null }) {
  return (
    <div className="anuncios-sell-popover__block vendas-sale-rayx__info-line vendas-sale-rayx__hero-fulfillment-type-row">
      <div className="vendas-sale-rayx__hero-fulfillment-type-grid">
        <span className="vendas-sale-rayx__hero-qty-client-label">Entrega</span>
        <span className="vendas-sale-rayx__hero-qty-client-label vendas-sale-rayx__hero-qty-client-label--qty">
          Origem da venda
        </span>
        <div className="vendas-sale-rayx__hero-fulfillment-type-value vendas-sale-rayx__hero-fulfillment-type-value--delivery">
          <SaleFulfillmentValue display={display} />
        </div>
        <div className="vendas-sale-rayx__hero-fulfillment-type-value vendas-sale-rayx__hero-fulfillment-type-value--type">
          <SaleTypeValue display={saleTypeDisplay} marketplace={marketplace} />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ shipping: ReturnType<typeof pickSaleShippingDisplayCompact> }} props
 */
function SaleShippingInfoBlock({ shipping }) {
  if (!shipping) return null;

  return (
    <div className="anuncios-sell-popover__block vendas-sale-rayx__shipping-block vendas-sale-rayx__shipping-block--compact">
      <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
        <span>{shipping.title}</span>
      </div>
      <div className="vendas-sale-rayx__shipping-lines vendas-sale-rayx__shipping-lines--compact">
        {shipping.streetLine ? (
          <div className="vendas-sale-rayx__shipping-line vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis">
            {shipping.streetLine}
          </div>
        ) : null}
        {shipping.cepCityState ? (
          <div className="vendas-sale-rayx__shipping-line vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis">
            {shipping.cepCityState}
          </div>
        ) : null}
        {shipping.receiverLabel ? (
          <div className="vendas-sale-rayx__shipping-line vendas-sale-rayx__shipping-line--receiver vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis">
            {shipping.receiverLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   itemId?: string | null;
 *   saleContextMetrics?: Record<string, unknown> | null;
 *   listingInternalId?: string | null;
 *   onOpenOfferCompare?: () => void;
 * }} props
 */
export default function SaleGeneralInfoLines({
  general,
  product,
  financial,
  profitMargin,
  listingTitle,
  itemId,
  saleContextMetrics,
  listingInternalId: listingInternalIdProp,
  onOpenOfferCompare,
}) {
  const g = general && typeof general === "object" ? general : {};
  const saleNumberDisplay = pickSaleNumberDisplay(g);
  const saleNumberCopy = pickSaleNumberCopyText(g);
  const saleStatusLabel = pickSaleStatusLabel(g);
  const saleStatusRaw = g.sale_status ?? g.order_status ?? saleStatusLabel;
  const { tone: saleStatusTone, color: saleStatusColor } = getSaleStatusColor(saleStatusRaw);
  const saleTypeDisplay = pickSaleTypeDisplay(g);
  const fulfillmentDisplay = pickFulfillmentDisplay(g);
  const shippingCompact = pickSaleShippingDisplayCompact(g.shipping_display_compact);
  const moneyRelease = resolveMoneyReleaseDate(g, product);

  const productTitle =
    listingTitle != null && String(listingTitle).trim() !== ""
      ? String(listingTitle).trim()
      : product?.title != null && String(product.title).trim() !== ""
        ? String(product.title).trim()
        : null;

  const listingInternalId =
    listingInternalIdProp != null && String(listingInternalIdProp).trim() !== ""
      ? String(listingInternalIdProp).trim()
      : null;

  const buyerName = truncateWordsDisplay(
    g.buyer_display_name != null ? String(g.buyer_display_name) : null,
    3,
  );

  return (
    <div className="vendas-sale-rayx__sale-data-card">
      {productTitle ? (
        <h3 className="vendas-sale-rayx__product-title">{productTitle}</h3>
      ) : null}
      <SaleRayXProductHeader
        placement="card"
        product={product}
        general={general}
        listingId={product?.listing_id_display ?? general?.listing_id_display ?? null}
        sku={product?.sku_display ?? general?.sku_display ?? null}
        listingInternalId={listingInternalId}
        onOpenOfferCompare={onOpenOfferCompare}
      />
      <div className="vendas-sale-rayx__left-blocks">
        <div className="vendas-sale-rayx__sale-data-hero">
          <div className="vendas-sale-rayx__sale-data-hero-top">
            <SaleRayXProductPhoto product={product} variant="hero" />
            <div className="vendas-sale-rayx__general-lines vendas-sale-rayx__general-lines--primary vendas-sale-rayx__left-info-stack">
              <InfoLine
                label="Conta marketplace"
                value={g.account_alias != null ? String(g.account_alias) : DASH}
                emphasis
              />
              <div className="anuncios-sell-popover__block vendas-sale-rayx__info-line vendas-sale-rayx__info-line--emphasis">
                <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
                  <span>Venda nº</span>
                </div>
                {saleNumberCopy != null && saleNumberDisplay != null ? (
                  <CopyableSaleNumber
                    value={saleNumberDisplay}
                    copyText={saleNumberCopy}
                    empty={false}
                  />
                ) : (
                  <div className="vendas-sale-rayx__info-value-line vendas-sale-rayx__info-value-line--emphasis anuncios-sell-popover__value--empty">
                    {DASH}
                  </div>
                )}
              </div>
              <InfoLine
                label="Status da venda"
                value={saleStatusLabel ?? DASH}
                emphasis
                tone={saleStatusTone}
                statusColor={saleStatusColor}
              />
              <InfoLine
                label="Data da venda"
                value={formatDatePt(g.sale_date != null ? String(g.sale_date) : null)}
              />
            </div>
            <HeroQuantityClientRow
              quantity={g.quantity != null ? String(g.quantity) : DASH}
              client={buyerName.display}
              clientTitle={buyerName.truncated ? buyerName.full : null}
            />
          </div>
          <div className="vendas-sale-rayx__general-lines vendas-sale-rayx__general-lines--below-image vendas-sale-rayx__left-info-stack">
            {fulfillmentDisplay ? (
              <HeroFulfillmentSaleTypeRow
                display={fulfillmentDisplay}
                saleTypeDisplay={saleTypeDisplay}
                marketplace={g.marketplace != null ? String(g.marketplace) : null}
              />
            ) : null}
            <SaleShippingInfoBlock shipping={shippingCompact} />
          </div>
        </div>

        <div className="vendas-sale-rayx__left-post vendas-sale-rayx__left-info-stack">
          <SaleRayXAccumulatedPerformance metrics={saleContextMetrics} />
          {moneyRelease ? (
            <InfoLineStack key="money-release" label={moneyRelease.label} value={moneyRelease.dateDisplay} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
