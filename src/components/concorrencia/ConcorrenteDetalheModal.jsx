// ======================================================================
// ConcorrenteDetalheModal — shell Raio-x do marketplace + card homologado
// ======================================================================

import MarketplaceRayXShell from "../rayx/MarketplaceRayXShell";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../../theme/marketplaceTheme.js";
import {
  displayCompetitorTitle,
  MENSAGEM_ENRICH_PARCIAL,
  pickCompetitorPrice,
  pickCompetitorPictures,
  pickCompetitorThumbnail,
  resolveRegisteredCompetitorHref,
  isConcorrenteAnuncioAtivo,
} from "./concorrenciaCompetitorDisplay";
import { ConcorrenciaProdutoConcorrenteCard } from "./ConcorrenciaProdutoConcorrenteCard";
import ConcorrenciaConcorrenteOficialMeta from "./ConcorrenciaConcorrenteOficialMeta";

function ConcorrenteDetalheModalBody({
  competitor,
  numeroConcorrente = null,
  precoNosso = null,
  onClose,
}) {
  const c = competitor || {};

  const thumbUrl = pickCompetitorThumbnail(c);
  const urlsGaleria = pickCompetitorPictures(c);
  const priceInfo = pickCompetitorPrice(c);
  const competitorLink = resolveRegisteredCompetitorHref(c);
  const titulo = displayCompetitorTitle(c.competitor_title);
  const listingId = String(c.competitor_listing_id || c.id || "");
  const anuncioInativo = !isConcorrenteAnuncioAtivo(c);
  const marketplace = c.marketplace ?? "mercado_livre";
  const temaMarketplace = getMarketplaceTheme(marketplace);

  return (
    <MarketplaceRayXShell
      open
      onClose={onClose}
      marketplace={marketplace}
      layout="compact"
      hideChannelBadge
      maxWidth={306}
      shellClassName="concorrente-detalhe-modal__shell"
      ariaLabelledBy="concorrente-detalhe-title"
    >
      <div className="concorrente-detalhe-modal__stage">
        <div className="concorrente-detalhe-modal__frame" aria-hidden />
        <div
          className="concorrente-detalhe-modal__mkt-badge"
          style={getMarketplaceThemeCssVars(temaMarketplace)}
          aria-hidden
        >
          {temaMarketplace.logoSrc ? (
            <img
              src={temaMarketplace.logoSrc}
              alt={temaMarketplace.logoAlt ?? ""}
              loading="lazy"
              decoding="async"
              className="concorrente-detalhe-modal__mkt-badge-img"
            />
          ) : (
            <span className="concorrente-detalhe-modal__mkt-badge-text">{temaMarketplace.displayName}</span>
          )}
        </div>
        <div
          className="concorrente-detalhe-modal__panel"
          style={getMarketplaceThemeCssVars(temaMarketplace)}
        >
          <header className="concorrente-detalhe-modal__head">
            <h2 id="concorrente-detalhe-title">
              Concorrente
              {numeroConcorrente != null ? (
                <>
                  {" "}
                  <span className="concorrente-detalhe-modal__head-num">{numeroConcorrente}</span>
                </>
              ) : null}
            </h2>
          </header>

          <div className="concorrente-detalhe-modal__body">
            <ul
              className="concorrencia-produto-modal__reg-grid concorrente-detalhe-modal__card-grid"
              aria-label="Detalhes do concorrente"
            >
              <ConcorrenciaProdutoConcorrenteCard
                thumbUrl={thumbUrl}
                modoGaleria
                urlsGaleria={urlsGaleria}
                titulo={titulo}
                tituloMaxCaracteres={53}
                href={competitorLink}
                tituloTooltipS7
                tituloCopiavelS7
                tituloCopiarChave={listingId}
                preco={priceInfo.value}
                moeda={priceInfo.currency}
                ocultarFreteNoPreco
                ocultarVendedor
                ocultarMedalha
                precoNosso={precoNosso}
                anuncioInativo={anuncioInativo}
                slotRodape={
                  c.enrich_status === "partial" || c.enrich_status === "failed" ? (
                    <span className="concorrencia-produto-modal__reg-card-status concorrencia-produto-modal__reg-card-status--pending">
                      {MENSAGEM_ENRICH_PARCIAL}
                    </span>
                  ) : null
                }
              />
            </ul>
            <ConcorrenciaConcorrenteOficialMeta
              competitor={c}
              variante="detalhe"
              ocultarFrete
            />
          </div>
        </div>
      </div>
    </MarketplaceRayXShell>
  );
}

export default function ConcorrenteDetalheModal({
  open,
  competitor,
  numeroConcorrente = null,
  precoNosso = null,
  onClose,
}) {
  if (!open || !competitor) return null;
  return (
    <ConcorrenteDetalheModalBody
      competitor={competitor}
      numeroConcorrente={numeroConcorrente}
      precoNosso={precoNosso}
      onClose={onClose}
    />
  );
}
