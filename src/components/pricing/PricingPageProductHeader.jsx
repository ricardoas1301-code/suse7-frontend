// ======================================================
// Cabeçalho do produto na página de Precificação Inteligente.
// Consolida identidade do anúncio dentro do card principal.
// ======================================================

import { useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import { buildPricingIntelligenceSidebarMetrics } from "../../features/listings/pricing-intelligence/buildPricingIntelligenceSidebarMetrics.js";
import { tracePiProductRenderStage } from "../../features/listings/pricing-intelligence/piProductRenderTrace.js";
import { DASH } from "../../features/listings/utils/catalogFormatters.js";

function MetricRow({ label, value, loading = false }) {
  return (
    <div className="pricing-intelligence-page__product-metrics-row">
      <span className="pricing-intelligence-page__product-metrics-label">{label}</span>
      {loading ? (
        <span className="pricing-intelligence-page__product-metrics-skeleton" aria-hidden />
      ) : (
        <span className="pricing-intelligence-page__product-metrics-value">{value}</span>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Record<string, unknown>} props.row
 * @param {import("../../theme/marketplaceTheme.js").MarketplaceTheme} props.theme
 * @param {boolean} [props.compactVertical]
 * @param {boolean} [props.listingsMetricsLoading] Skeleton só enquanto o catálogo ainda carrega; depois, métricas ausentes viram "—".
 */
export function PricingPageProductHeader({ row, theme, compactVertical = false, listingsMetricsLoading = false }) {
  const [imgBroken, setImgBroken] = useState(false);
  const cover =
    row?.coverThumbnailUrl != null && String(row.coverThumbnailUrl).trim() !== ""
      ? String(row.coverThumbnailUrl).trim()
      : "";

  const title = row?.adTitle != null && String(row.adTitle).trim() !== "" ? String(row.adTitle).trim() : "—";
  const listingPermalink =
    row?.listingPermalink != null && String(row.listingPermalink).trim() !== ""
      ? String(row.listingPermalink).trim()
      : "";
  const hasTitle = title !== "—";
  const titleNode =
    hasTitle && listingPermalink !== "" ? (
      <a
        href={listingPermalink}
        className="pricing-intelligence-page__product-header-title-link"
        target="_blank"
        rel="noreferrer noopener"
        title={`Abrir no ${theme?.displayName ?? "marketplace"} — ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title}
      </a>
    ) : (
      title
    );
  const listingIdRaw =
    row?.externalId != null && String(row.externalId).trim() !== "" ? String(row.externalId).trim() : "—";
  const listingId = listingIdRaw.replace(/^MLB\s*/i, "");
  const sku = row?.sku != null && String(row.sku).trim() !== "" ? String(row.sku).trim() : "—";
  const showLogo = theme?.logoSrc != null && String(theme.logoSrc).trim() !== "";
  const isMercadoLivreTheme = String(theme?.key ?? theme?.resolvedKey ?? "").trim().toLowerCase() === "mercado_livre";
  const metricsLoading = listingsMetricsLoading === true;

  const metrics = buildPricingIntelligenceSidebarMetrics(row);

  tracePiProductRenderStage("header_render", {
    external_listing_id: row?.externalId ?? null,
    internal_listing_id: row?.id ?? null,
    product_id: row?.productId ?? row?.product_id ?? null,
    merged_row: row,
    header_product: {
      sales_quantity: metrics.productSalesCount,
      sales_amount_brl: metrics.productSalesAmount,
      sales_profit_brl: metrics.productProfitAmount,
      sales_profit_percent: metrics.productProfitPercent,
    },
    render_product: {
      sales_quantity: metrics.productSalesCount,
      sales_amount_brl: metrics.productSalesAmount,
      sales_profit_brl: metrics.productProfitAmount,
      sales_profit_percent: metrics.productProfitPercent,
    },
  });

  return (
    <section
      className={[
        "pricing-intelligence-page__product-header",
        compactVertical ? "pricing-intelligence-page__product-header--vertical" : "",
        isMercadoLivreTheme ? "pricing-intelligence-page__product-header--marketplace-mercado_livre" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Resumo do produto"
    >
      {compactVertical ? (
        <>
          <div className="pricing-intelligence-page__product-header-marketplace" aria-label={`Marketplace ${theme?.displayName ?? "Marketplace"}`}>
            {showLogo ? (
              <img src={String(theme.logoSrc)} alt={theme?.logoAlt || theme?.displayName || "Marketplace"} />
            ) : (
              <span>{theme?.displayName ?? "Marketplace"}</span>
            )}
          </div>

          <div
            className={[
              "pricing-intelligence-page__product-header-thumb",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            {cover !== "" && !imgBroken ? (
              <img
                src={cover}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgBroken(true)}
                className="pricing-intelligence-page__product-header-thumb-img"
              />
            ) : (
              <span className="pricing-intelligence-page__product-header-thumb-fallback">
                <S7Icon name="image" size={20} strokeWidth={1.7} />
              </span>
            )}
          </div>

          <p className="pricing-intelligence-page__product-header-title" title={title}>
            {titleNode}
          </p>
          <p className="pricing-intelligence-page__product-header-meta pricing-intelligence-page__product-header-meta--copy">
            <span className="pricing-intelligence-page__product-header-meta-item s7-copy-group">
              <span>MLB{listingId}</span>
              <S7CopyButton
                value={`MLB${listingId}`}
                ariaLabel="Copiar código MLB"
                tooltipText="Copiar MLB"
                toastLabel="MLB"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                toastEventType="LISTING_ID_COPIED"
                toastFailEventType="LISTING_ID_COPY_FAILED"
                toastEntityType="marketplace_listing"
              />
            </span>
            <span className="pricing-intelligence-page__product-header-meta-sep" aria-hidden>
              |
            </span>
            <span className="pricing-intelligence-page__product-header-meta-item s7-copy-group">
              <span className="anuncios-ad-sku-label">SKU:</span>
              <span className="anuncios-ad-sku-value">{sku}</span>
              <S7CopyButton
                value={sku}
                ariaLabel="Copiar SKU"
                tooltipText="Copiar SKU"
                toastLabel="SKU"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                toastEventType="LISTING_SKU_COPIED"
                toastFailEventType="LISTING_SKU_COPY_FAILED"
                toastEntityType="marketplace_listing"
              />
            </span>
          </p>
          <p className="pricing-intelligence-page__product-header-meta pricing-intelligence-page__product-header-meta--copy pricing-intelligence-page__product-header-meta--account">
            <span className="pricing-intelligence-page__product-header-meta-item">
              <span className="anuncios-ad-sku-label">Conta:</span>
              {metricsLoading ? (
                <span className="pricing-intelligence-page__product-metrics-skeleton" aria-hidden />
              ) : (
                <span className="anuncios-ad-sku-value" title={metrics.marketplaceAccount}>
                  {metrics.marketplaceAccount}
                </span>
              )}
            </span>
          </p>
          <div className="pricing-intelligence-page__product-metrics">
            <div className="pricing-intelligence-page__product-metrics-type">
              <span className="pricing-intelligence-page__product-metrics-label">Tipo do anúncio:</span>
              {metricsLoading ? (
                <span className="pricing-intelligence-page__product-metrics-skeleton" aria-hidden />
              ) : metrics.listingType === DASH ? (
                <span className="pricing-intelligence-page__product-metrics-value">{metrics.listingType}</span>
              ) : (
                <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
                  {metrics.listingType}
                </span>
              )}
            </div>

            <section className="pricing-intelligence-page__product-metrics-section pricing-intelligence-page__product-metrics-section--accumulated-listing">
              <h5 className="pricing-intelligence-page__product-metrics-title">Desempenho acumulado do Anúncio</h5>
              <MetricRow label="Vendas Qtd:" value={metrics.listingSalesCount} loading={metricsLoading} />
              <MetricRow label="Vendas R$:" value={metrics.listingSalesAmount} loading={metricsLoading} />
              <MetricRow label="Lucro R$:" value={metrics.listingProfitAmount} loading={metricsLoading} />
              <MetricRow label="Lucro %:" value={metrics.listingProfitPercent} loading={metricsLoading} />
            </section>

            <section className="pricing-intelligence-page__product-metrics-section pricing-intelligence-page__product-metrics-section--accumulated-product">
              <h5 className="pricing-intelligence-page__product-metrics-title">Desempenho acumulado do Produto</h5>
              <MetricRow label="Vendas Qtd:" value={metrics.productSalesCount} loading={metricsLoading} />
              <MetricRow label="Vendas R$:" value={metrics.productSalesAmount} loading={metricsLoading} />
              <MetricRow label="Lucro R$:" value={metrics.productProfitAmount} loading={metricsLoading} />
              <MetricRow label="Lucro %:" value={metrics.productProfitPercent} loading={metricsLoading} />
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="pricing-intelligence-page__product-header-marketplace" aria-label={`Marketplace ${theme?.displayName ?? "Marketplace"}`}>
            {showLogo ? (
              <img src={String(theme.logoSrc)} alt={theme?.logoAlt || theme?.displayName || "Marketplace"} />
            ) : (
              <span>{theme?.displayName ?? "Marketplace"}</span>
            )}
          </div>

          <div className="pricing-intelligence-page__product-header-main">
            <div
              className={[
                "pricing-intelligence-page__product-header-thumb",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden
            >
              {cover !== "" && !imgBroken ? (
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgBroken(true)}
                  className="pricing-intelligence-page__product-header-thumb-img"
                />
              ) : (
                <span className="pricing-intelligence-page__product-header-thumb-fallback">
                  <S7Icon name="image" size={20} strokeWidth={1.7} />
                </span>
              )}
            </div>

            <div className="pricing-intelligence-page__product-header-copy">
              <p className="pricing-intelligence-page__product-header-title" title={title}>
                {titleNode}
              </p>
              <p className="pricing-intelligence-page__product-header-meta pricing-intelligence-page__product-header-meta--copy">
                <span className="pricing-intelligence-page__product-header-meta-item s7-copy-group">
                  <span>MLB{listingId}</span>
                  <S7CopyButton
                value={`MLB${listingId}`}
                ariaLabel="Copiar código MLB"
                tooltipText="Copiar MLB"
                toastLabel="MLB"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                toastEventType="LISTING_ID_COPIED"
                toastFailEventType="LISTING_ID_COPY_FAILED"
                toastEntityType="marketplace_listing"
              />
                </span>
                <span className="pricing-intelligence-page__product-header-meta-sep" aria-hidden>
                  |
                </span>
                <span className="pricing-intelligence-page__product-header-meta-item s7-copy-group">
                  <span className="anuncios-ad-sku-label">SKU:</span>
                  <span className="anuncios-ad-sku-value">{sku}</span>
                  <S7CopyButton
                value={sku}
                ariaLabel="Copiar SKU"
                tooltipText="Copiar SKU"
                toastLabel="SKU"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                toastEventType="LISTING_SKU_COPIED"
                toastFailEventType="LISTING_SKU_COPY_FAILED"
                toastEntityType="marketplace_listing"
              />
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

