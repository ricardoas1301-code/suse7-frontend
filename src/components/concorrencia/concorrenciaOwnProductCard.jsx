// ======================================================================
// Card do anúncio próprio — coluna direita do modal de gestão
// ======================================================================

import { useState } from "react";
import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import MarketplaceBadge from "../MarketplaceBadge";
import {
  extrairContaAnuncioProprio,
  extrairIdAnuncioProprio,
  extrairTipoAnuncioProprio,
  formatPrice,
  formatSalesCountProprio,
} from "./concorrenciaCompetitorDisplay";
import "./concorrenciaOwnProductCard.css";

/**
 * @param {{
 *   name: string;
 *   sku: string;
 *   productId: string | number | null;
 *   imgUrl: string | null;
 *   productAdHref: string | null;
 *   ownListing: object | null;
 *   limitReached: boolean;
 *   occupiedSlots: number;
 *   functionalLimit: number;
 * }} props
 */
export function ConcorrenciaOwnProductCard({
  name,
  sku,
  productId,
  imgUrl,
  productAdHref,
  ownListing,
  limitReached,
  occupiedSlots,
  functionalLimit,
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const preco = ownListing?.price ?? null;
  const vendas = ownListing?.sales ?? null;
  const moeda = ownListing?.currency ?? "BRL";
  const freteGratis = ownListing?.shipping?.free_shipping === true;
  const precoTxt = formatPrice(preco, moeda);
  const vendasNumero = (() => {
    const n = Number(vendas);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
  })();
  const vendasTxt = formatSalesCountProprio(vendas);
  const exibirLinhaPrecoVendas = precoTxt !== "—" || ownListing != null;

  const idCompleto = extrairIdAnuncioProprio(ownListing);
  const listingId = idCompleto.replace(/^MLB\s*/i, "");
  const mlbCopiar = listingId ? `MLB${listingId.replace(/^MLB/i, "")}` : "";
  const skuExibicao = sku || "—";
  const conta = extrairContaAnuncioProprio(ownListing);
  const tipoAnuncio = extrairTipoAnuncioProprio(ownListing);

  const tituloBase =
    productAdHref != null && String(productAdHref).trim() !== "" ? (
      <a
        href={productAdHref}
        className="concorrencia-produto-modal__own-title-link"
        target="_blank"
        rel="noreferrer noopener"
        onClick={(e) => e.stopPropagation()}
      >
        {name}
      </a>
    ) : (
      <span className="concorrencia-produto-modal__own-title-text">{name}</span>
    );

  const textoConcorrentes = limitReached
    ? `${functionalLimit} de ${functionalLimit} concorrentes monitorados`
    : `${occupiedSlots}/${functionalLimit} concorrentes`;

  return (
    <div className="concorrencia-produto-modal__own-card-wrap">
      <section className="concorrencia-produto-modal__own-card" aria-label="Resumo do seu anúncio">
        <div className="concorrencia-produto-modal__own-head">
          <div className="concorrencia-produto-modal__own-thumb" aria-hidden>
            {imgUrl && !imgBroken ? (
              <img
                src={imgUrl}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgBroken(true)}
              />
            ) : (
              <span className="concorrencia-produto-modal__own-thumb-ph">
                <S7Icon name="image" size={20} strokeWidth={1.7} />
              </span>
            )}
          </div>

          <div className="concorrencia-produto-modal__own-head-copy">
            <div className="concorrencia-produto-modal__own-title-wrap s7-copy-group s7-ad-title-copy-row">
              <S7Tooltip
                content={name}
                placement="top-start"
                offset={6}
                wrap
                className="concorrencia-produto-modal__own-title-tip"
              >
                {tituloBase}
              </S7Tooltip>
              <S7CopyButton
                value={name}
                ariaLabel="Copiar título do anúncio"
                tooltipText="Copiar título"
                toastLabel="Título"
                showToast
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                flashKey={`concorrencia-modal-titulo-${productId}`}
                className="concorrencia-produto-modal__own-title-copy"
              />
            </div>

            {exibirLinhaPrecoVendas ? (
              <p className="concorrencia-produto-modal__own-price-line">
                {precoTxt !== "—" ? (
                  <span className="concorrencia-produto-modal__own-price">{precoTxt}</span>
                ) : null}
                {precoTxt !== "—" ? (
                  <span className="concorrencia-produto-modal__own-price-sep" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span
                  className={[
                    "concorrencia-produto-modal__own-sales",
                    vendasNumero === 0 ? "concorrencia-produto-modal__own-sales--zero" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {vendasTxt}
                </span>
                {freteGratis ? (
                  <span className="concorrencia-produto-modal__own-frete">Frete grátis</span>
                ) : null}
              </p>
            ) : null}

            <p className="concorrencia-produto-modal__own-meta">
              {mlbCopiar ? (
                <span className="concorrencia-produto-modal__own-meta-item s7-copy-group">
                  <span>{mlbCopiar}</span>
                  <S7CopyButton
                    value={mlbCopiar}
                    ariaLabel="Copiar código MLB"
                    tooltipText="Copiar MLB"
                    toastLabel="MLB"
                    showToast
                    iconMode="unicode"
                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                    flashKey={`concorrencia-modal-mlb-${productId}-${mlbCopiar}`}
                    toastEventType="LISTING_ID_COPIED"
                    toastFailEventType="LISTING_ID_COPY_FAILED"
                    toastEntityType="marketplace_listing"
                  />
                </span>
              ) : null}
              {mlbCopiar ? (
                <span className="concorrencia-produto-modal__own-meta-sep" aria-hidden>
                  |
                </span>
              ) : null}
              <span className="concorrencia-produto-modal__own-meta-item s7-copy-group">
                <span className="anuncios-ad-sku-label">SKU:</span>
                <span className="anuncios-ad-sku-value">{skuExibicao}</span>
                {sku ? (
                  <S7CopyButton
                    value={sku}
                    ariaLabel="Copiar SKU"
                    tooltipText="Copiar SKU"
                    toastLabel="SKU"
                    showToast
                    iconMode="unicode"
                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                    flashKey={`concorrencia-modal-sku-${productId}`}
                    toastEventType="LISTING_SKU_COPIED"
                    toastFailEventType="LISTING_SKU_COPY_FAILED"
                    toastEntityType="marketplace_listing"
                  />
                ) : null}
              </span>
            </p>

            {conta ? (
              <p className="concorrencia-produto-modal__own-meta concorrencia-produto-modal__own-meta--account">
                <span className="concorrencia-produto-modal__own-meta-item">
                  <span className="anuncios-ad-sku-label">Conta:</span>
                  <span className="anuncios-ad-sku-value" title={conta}>
                    {conta}
                  </span>
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="concorrencia-produto-modal__own-foot">
          <div className="concorrencia-produto-modal__own-chan">
            <MarketplaceBadge marketplace="mercado_livre" label="Mercado Livre" size={18} />
            <span>Mercado Livre</span>
          </div>

          <div className="concorrencia-produto-modal__own-tipo-row">
            <span className="concorrencia-produto-modal__own-tipo-label">Tipo do anúncio:</span>
            {tipoAnuncio ? (
              <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
                {tipoAnuncio.toUpperCase()}
              </span>
            ) : (
              <span className="concorrencia-produto-modal__own-tipo-empty">—</span>
            )}
          </div>

          <div className="concorrencia-produto-modal__own-count-row">
            <span
              className={`concorrencia-produto-modal__count-pill${
                limitReached ? " concorrencia-produto-modal__count-pill--full" : ""
              }`}
            >
              {textoConcorrentes}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
