// ======================================================================
// Cabeçalho operacional — coluna Anúncio / Produto (padrão lista Vendas).
// ======================================================================

import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import "./S7CatalogListingHeadline.css";

/**
 * @param {{
 *   title: string;
 *   titleHref?: string | null;
 *   listingId?: string;
 *   listingIdCopyValue?: string;
 *   sku?: string;
 *   skuCopyValue?: string;
 *   layout?: "inline" | "stacked";
 *   listingFirst?: boolean;
 *   titleClassName?: string;
 *   titleTooltip?: string;
 *   titleCopyValue?: string;
 *   stopTitlePropagation?: boolean;
 *   copyTitleFlashKey?: string;
 *   copyListingFlashKey?: string;
 *   copySkuFlashKey?: string;
 *   listingEntityType?: string;
 *   skuEntityType?: string;
 *   showSkuWhenEmpty?: boolean;
 *   skuEmptyLabel?: string;
 *   metaExtra?: import("react").ReactNode;
 *   footer?: import("react").ReactNode;
 *   actions?: import("react").ReactNode;
 *   className?: string;
 * }} props
 */
export default function S7CatalogListingHeadline({
  title,
  titleHref = null,
  listingId = "",
  listingIdCopyValue = "",
  sku = "",
  skuCopyValue = "",
  layout = "inline",
  listingFirst = false,
  titleClassName = "",
  titleTooltip = "",
  titleCopyValue = "",
  stopTitlePropagation = false,
  copyTitleFlashKey = "catalog-listing-title",
  copyListingFlashKey = "catalog-listing-id",
  copySkuFlashKey = "catalog-listing-sku",
  listingEntityType = "marketplace_listing",
  skuEntityType = "marketplace_listing",
  showSkuWhenEmpty = false,
  skuEmptyLabel = "—",
  metaExtra = null,
  footer = null,
  actions = null,
  className = "",
}) {
  const titulo = String(title || "").trim() || "—";
  const lid = String(listingId || "").trim();
  const sk = String(sku || "").trim();
  const tituloCopiar = String(titleCopyValue || "").trim();
  const lidCopiar = String(listingIdCopyValue || listingId || "").trim();
  const skCopiar = String(skuCopyValue || sku || "").trim();
  const hasMeta = Boolean(lid || sk || showSkuWhenEmpty);
  const stacked = layout === "stacked";

  const titleClass = [
    stacked ? "s7-catalog-headline__title" : "s7-catalog-headline__title vendas-page__product-title",
    titleClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const titleInner =
    titleHref && String(titleHref).trim() !== "" ? (
      <a
        href={titleHref}
        className={[
          "anuncios-ad-title-link",
          stacked
            ? "s7-catalog-headline__title-link"
            : "vendas-page__product-title-link vendas-page__product-title s7-catalog-headline__title-link",
          titleClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        target="_blank"
        rel="noreferrer noopener"
        onClick={stopTitlePropagation ? (e) => e.stopPropagation() : undefined}
      >
        {titulo}
      </a>
    ) : (
      <span className={titleClass}>{titulo}</span>
    );

  const titleNode = titleTooltip ? (
    <S7Tooltip content={titleTooltip} placement="top-start" offset={6} wrap className="s7-catalog-headline__title-tip">
      {titleInner}
    </S7Tooltip>
  ) : (
    titleInner
  );

  const titleCopyButton =
    tituloCopiar && titulo !== "—" ? (
      <S7CopyButton
        value={tituloCopiar}
        ariaLabel="Copiar nome do anúncio"
        tooltipText="Copiar nome do anúncio"
        toastLabel="Nome do anúncio"
        showToast={true}
        iconMode="unicode"
        flashMs={S7_COPY_OFFICIAL_FLASH_MS}
        flashKey={copyTitleFlashKey}
        toastEntityType={listingEntityType}
      />
    ) : null;

  const listingMeta =
    lid || lidCopiar ? (
      <span
        className="s7-copy-group s7-catalog-headline__meta-ad vendas-page__product-meta-ad"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="s7-catalog-headline__meta-value vendas-page__meta-value vendas-page__meta-value--listing">
          {lid || "—"}
        </span>
        {lidCopiar ? (
          <S7CopyButton
            value={lidCopiar}
            ariaLabel="Copiar ID do anúncio"
            tooltipText="Copiar ID do anúncio"
            toastLabel="ID do anúncio"
            showToast={true}
            iconMode="unicode"
            flashMs={S7_COPY_OFFICIAL_FLASH_MS}
            flashKey={copyListingFlashKey}
            toastEventType="LISTING_ID_COPIED"
            toastFailEventType="LISTING_ID_COPY_FAILED"
            toastEntityType={listingEntityType}
          />
        ) : null}
      </span>
    ) : null;

  const skuMeta =
    sk || showSkuWhenEmpty ? (
      <span
        className="s7-copy-group s7-catalog-headline__meta-sku vendas-page__product-meta-sku"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="anuncios-ad-sku-label">SKU</span>
        <span className={`anuncios-ad-sku-value${sk ? "" : " anuncios-ad-sku-value--empty"}`}>
          {sk || skuEmptyLabel}
        </span>
        {skCopiar ? (
          <S7CopyButton
            value={skCopiar}
            ariaLabel="Copiar SKU"
            tooltipText="Copiar SKU"
            toastLabel="SKU"
            showToast={true}
            iconMode="unicode"
            flashMs={S7_COPY_OFFICIAL_FLASH_MS}
            flashKey={copySkuFlashKey}
            toastEventType="LISTING_SKU_COPIED"
            toastFailEventType="LISTING_SKU_COPY_FAILED"
            toastEntityType={skuEntityType}
          />
        ) : null}
      </span>
    ) : null;

  const metaRow =
    hasMeta && (listingMeta || skuMeta || metaExtra) ? (
      <div className={`s7-catalog-headline__meta vendas-page__product-meta${stacked ? " s7-catalog-headline__meta--stacked" : ""}`}>
        {listingMeta}
        {listingMeta && skuMeta ? (
          <span className="s7-catalog-headline__meta-sep vendas-page__product-meta-sep" aria-hidden />
        ) : null}
        {skuMeta}
        {(listingMeta || skuMeta) && metaExtra ? (
          <span className="s7-catalog-headline__meta-sep vendas-page__product-meta-sep" aria-hidden />
        ) : null}
        {metaExtra}
      </div>
    ) : (
      <span className="s7-catalog-headline__meta--muted vendas-page__product-meta--muted">—</span>
    );

  const rootClass = [
    "s7-catalog-headline",
    "vendas-page__product-headline",
    stacked ? "s7-catalog-headline--stacked" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (stacked) {
    return (
      <div className={rootClass}>
        {listingFirst && listingMeta ? (
          <div className="s7-catalog-headline__meta s7-catalog-headline__meta--stacked">{listingMeta}</div>
        ) : null}
        <div className="s7-catalog-headline__title-row">
          <span className="s7-catalog-headline__title-slot">{titleNode}</span>
          {titleCopyButton}
        </div>
        {!listingFirst ? (
          metaRow
        ) : skuMeta ? (
          <div className="s7-catalog-headline__meta s7-catalog-headline__meta--stacked">{skuMeta}</div>
        ) : null}
        {actions ? <div className="s7-catalog-headline__actions">{actions}</div> : null}
        {footer ? <div className="s7-catalog-headline__footer">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <span className="s7-catalog-headline__title-slot vendas-page__product-title-slot">
        {titleNode}
        {titleCopyButton}
      </span>
      {hasMeta ? metaRow : null}
      {actions ? <div className="s7-catalog-headline__actions">{actions}</div> : null}
      {footer ? <div className="s7-catalog-headline__footer">{footer}</div> : null}
    </div>
  );
}

/**
 * Coluna Produto — mesma tipografia da coluna Anúncio (nome + SKU).
 * @param {{
 *   title: string;
 *   sku?: string;
 *   incomplete?: boolean;
 *   titleTooltip?: string;
 *   copyNameFlashKey?: string;
 *   copySkuFlashKey?: string;
 *   footer?: import("react").ReactNode;
 *   actions?: import("react").ReactNode;
 * }} props
 */
export function S7CatalogProductHeadline({
  title,
  sku = "",
  incomplete = false,
  titleTooltip = "",
  copyNameFlashKey = "catalog-product-name",
  copySkuFlashKey = "catalog-product-sku",
  footer = null,
  actions = null,
}) {
  const nome = String(title || "").trim() || "Sem nome";
  const sk = String(sku || "").trim();
  const incompleteClass = incomplete ? " s7-catalog-headline__title--incomplete" : "";

  const titleInner = (
    <span className={`s7-catalog-headline__title vendas-page__product-title${incompleteClass}`}>{nome}</span>
  );

  const titleNode = titleTooltip ? (
    <S7Tooltip
      content={titleTooltip}
      placement="top-start"
      offset={6}
      wrap
      className={`s7-catalog-headline__title-tip products-catalog__product-name-tip${incompleteClass}`}
    >
      {titleInner}
    </S7Tooltip>
  ) : (
    titleInner
  );

  return (
    <div className="s7-catalog-headline s7-catalog-headline--stacked s7-catalog-headline--product">
      <div className="s7-catalog-headline__title-row products-catalog__name-row">
        <span className="s7-catalog-headline__title-slot vendas-page__product-title-slot products-catalog__name-inline">
          {titleNode}
          <S7CopyButton
            value={nome}
            ariaLabel={`Copiar nome ${nome}`}
            tooltipText="Copiar nome"
            toastLabel="Nome do produto"
            showToast={true}
            iconMode="unicode"
            flashMs={S7_COPY_OFFICIAL_FLASH_MS}
            flashKey={copyNameFlashKey}
            toastEntityType="product"
          />
        </span>
      </div>
      <div className="s7-catalog-headline__meta s7-catalog-headline__meta--stacked products-catalog__sku-row">
        <span className="s7-copy-group s7-catalog-headline__meta-sku">
          <span className="anuncios-ad-sku-label">SKU</span>
          <span className="anuncios-ad-sku-value s7-catalog-headline__meta-value">{sk || "—"}</span>
          {sk ? (
            <S7CopyButton
              value={sk}
              ariaLabel={`Copiar SKU ${sk}`}
              tooltipText="Copiar SKU"
              toastLabel="SKU"
              showToast={true}
              iconMode="unicode"
              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
              flashKey={copySkuFlashKey}
              toastEventType="LISTING_SKU_COPIED"
              toastFailEventType="LISTING_SKU_COPY_FAILED"
              toastEntityType="product"
            />
          ) : null}
        </span>
      </div>
      {actions ? <div className="s7-catalog-headline__actions products-catalog__product-actions">{actions}</div> : null}
      {footer ? <div className="s7-catalog-headline__footer">{footer}</div> : null}
    </div>
  );
}
