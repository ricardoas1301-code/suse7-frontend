// ======================================================================
// Diagnóstico visual — /anuncios-2
// Mesma fonte de dados que /anuncios: GET /api/ml/listings + mapGridApiToCatalogRow.
// Grid mínima: CAPA + Nº (botão abre modal com fotos persistidas no Suse7).
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { buildApiUrl, apiFetch, getSessionToken } from "../config/api";
import { ListingCoverThumb } from "../features/listings/components/AdsCatalogRow.jsx";
import { mapGridApiToCatalogRow } from "../features/listings/utils/mlListingsGridMapping.js";
import "../components/Products.css";
import "../components/Anuncios.css";
import "./AnunciosTeste.css";

const DASH = "—";

/** Quantas miniaturas mostrar no modal (primeiras N da galeria persistida). */
const MODAL_GALLERY_LIMIT = 7;

export default function AnunciosTeste() {
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [catalogRows, setCatalogRows] = useState(
    /** @type {ReturnType<typeof mapGridApiToCatalogRow>[]} */ ([])
  );

  /** @type {{ title: string; urls: string[]; displayId: string; source: string | null } | null} */
  const [galleryModal, setGalleryModal] = useState(null);

  const fetchListings = useCallback(async () => {
    const url = buildApiUrl("/api/ml/listings");
    if (!url) {
      setListError("Defina VITE_API_BASE_URL apontando para o backend.");
      setCatalogRows([]);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setListError(null);
    let token = await getSessionToken();
    if (!token) {
      await new Promise((r) => setTimeout(r, 150));
      token = await getSessionToken();
    }
    if (!token) {
      setListLoading(false);
      setListError("Sessão ainda não disponível para o token. Atualize a página ou entre novamente.");
      setCatalogRows([]);
      return;
    }
    if (import.meta.env.DEV) {
      console.info("[Suse7][API listings URL]", url);
    }
    const res = await apiFetch(url);
    setListLoading(false);
    if (!res.ok) {
      const msg = res.error || res.data?.error || "Não foi possível carregar os anúncios.";
      setListError(msg);
      setCatalogRows([]);
      return;
    }
    const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
    setCatalogRows(listings.map(mapGridApiToCatalogRow));
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (!galleryModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setGalleryModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryModal]);

  const openGallery = useCallback((row) => {
    const urls = Array.isArray(row.galleryImageUrls) ? row.galleryImageUrls : [];
    const title = row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "Anúncio";
    const displayId = row.listingNumberDisplay && row.listingNumberDisplay !== DASH ? String(row.listingNumberDisplay) : "";
    const source = row.galleryImageSource != null ? String(row.galleryImageSource) : null;
    setGalleryModal({ title, urls, displayId, source });
  }, []);

  return (
    <div className="anuncios-teste">
      <h1 className="anuncios-teste__title">Diagnóstico CAPA (teste técnico)</h1>
      <p className="anuncios-teste__subtitle">
        Listagem mínima para isolar a renderização da imagem. Mesmo endpoint e mesmo mapeamento que a página
        Anúncios. Rota: <code>/anuncios-2</code>. Clique no número para ver até {MODAL_GALLERY_LIMIT} fotos: primeiro{" "}
        <code>marketplace_listing_pictures</code>; se vazio, <code>raw_json.pictures</code>.
      </p>

      <div className="anuncios-teste__toolbar">
        <button type="button" className="anuncios-teste__reload" onClick={() => fetchListings()} disabled={listLoading}>
          {listLoading ? "A carregar…" : "Recarregar"}
        </button>
      </div>

      {listError ? <div className="anuncios-teste__error">{listError}</div> : null}

      <div className="anuncios-teste__grid" role="table" aria-label="Anúncios — teste de capa">
        <div className="anuncios-teste__head" role="columnheader">
          CAPA
        </div>
        <div className="anuncios-teste__head" role="columnheader">
          Nº do anúncio
        </div>

        {listLoading && catalogRows.length === 0 ? (
          <div className="anuncios-teste__loading">A carregar anúncios…</div>
        ) : null}

        {!listLoading && !listError && catalogRows.length === 0 ? (
          <div className="anuncios-teste__empty">Nenhum anúncio devolvido pela API.</div>
        ) : null}

        {catalogRows.map((row) => (
          <div key={row.id} style={{ display: "contents" }}>
            <div
              className="products-catalog__cell anuncios-catalog__cell--thumb"
              title={row.adTitle !== DASH ? row.adTitle : undefined}
              role="cell"
            >
              <ListingCoverThumb url={row.coverThumbnailUrl} />
            </div>
            <div className="anuncios-teste__row-num" role="cell">
              {row.listingNumber === DASH ? (
                DASH
              ) : (
                <button
                  type="button"
                  className="anuncios-teste__listing-btn"
                  onClick={() => openGallery(row)}
                  aria-label={`Ver fotos persistidas do anúncio ${row.listingNumberDisplay}`}
                >
                  {row.listingNumberDisplay}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {galleryModal &&
        createPortal(
          <div
            className="anuncios-teste-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anuncios-teste-modal-title"
          >
            <button
              type="button"
              className="anuncios-teste-modal__backdrop"
              aria-label="Fechar"
              onClick={() => setGalleryModal(null)}
            />
            <div className="anuncios-teste-modal__card">
              <div className="anuncios-teste-modal__header">
                <h2 id="anuncios-teste-modal-title" className="anuncios-teste-modal__title">
                  Fotos persistidas
                </h2>
                <button type="button" className="anuncios-teste-modal__close" onClick={() => setGalleryModal(null)}>
                  Fechar
                </button>
              </div>
              <p className="anuncios-teste-modal__meta">
                {galleryModal.displayId ? (
                  <>
                    Anúncio <strong>{galleryModal.displayId}</strong>
                    {" · "}
                  </>
                ) : null}
                <span className="anuncios-teste-modal__meta-title">{galleryModal.title}</span>
              </p>
              <p className="anuncios-teste-modal__hint">
                Origem das URLs:{" "}
                {galleryModal.source === "raw_json.pictures" ? (
                  <>
                    <code>raw_json.pictures</code> (fallback — tabela de fotos sem URL válida ou vazia).
                  </>
                ) : galleryModal.source === "marketplace_listing_pictures" ? (
                  <>
                    <code>marketplace_listing_pictures</code> (até {MODAL_GALLERY_LIMIT} primeiras com HTTP válido).
                  </>
                ) : (
                  <>nenhuma (nem tabela nem snapshot com URLs utilizáveis).</>
                )}
              </p>
              {galleryModal.urls.length === 0 ? (
                <p className="anuncios-teste-modal__empty">
                  Nenhuma URL de imagem utilizável: sem linhas em <code>marketplace_listing_pictures</code> com HTTP
                  válido e sem URLs em <code>raw_json.pictures</code> (ou sync ainda não hidratou o item).
                </p>
              ) : (
                <>
                  <ul className="anuncios-teste-modal__gallery">
                    {galleryModal.urls.slice(0, MODAL_GALLERY_LIMIT).map((src, i) => (
                      <li key={`${src.slice(0, 48)}-${i}`} className="anuncios-teste-modal__tile">
                        <img src={src} alt="" className="anuncios-teste-modal__img" loading="lazy" decoding="async" />
                        <span className="anuncios-teste-modal__idx">{i + 1}</span>
                      </li>
                    ))}
                  </ul>
                  {galleryModal.urls.length > MODAL_GALLERY_LIMIT ? (
                    <p className="anuncios-teste-modal__more">
                      +{galleryModal.urls.length - MODAL_GALLERY_LIMIT} outra(s) URL(s) na resposta da API (total{" "}
                      {galleryModal.urls.length}).
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
