// ======================================================================
// Modal dedicado à descoberta de concorrentes (busca por nome).
// UX apenas — reutiliza handlers e CandidateSaveAction do fluxo homologado.
// ======================================================================

import S7Icon from "../ui/S7Icon";
import {
  pickCandidatePermalink,
  pickCompetitorThumbnail,
  displayCompetitorTitle,
} from "./concorrenciaCompetitorDisplay";
import { CandidateSaveAction } from "./concorrenciaCandidateSaveAction";
import { ConcorrenciaProdutoConcorrenteCard } from "./ConcorrenciaProdutoConcorrenteCard";
import ConcorrenciaConcorrenteOficialMeta from "./ConcorrenciaConcorrenteOficialMeta";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   discovering: boolean;
 *   loadingMore: boolean;
 *   discoverError: string | null;
 *   hasDiscovered: boolean;
 *   candidates: object[];
 *   hasMoreCandidates: boolean;
 *   activeListingIds: Set<string>;
 *   limitReached: boolean;
 *   precoNosso?: number | string | null;
 *   onSave: (candidate: object) => void;
 *   onLoadMore: () => void;
 * }} props
 */
export default function ConcorrenciaDiscoverModal({
  open,
  onClose,
  discovering,
  loadingMore,
  discoverError,
  hasDiscovered,
  candidates,
  hasMoreCandidates,
  activeListingIds,
  limitReached,
  precoNosso = null,
  onSave,
  onLoadMore,
}) {
  if (!open) return null;

  return (
    <div
      className="concorrencia-discover-modal-backdrop s7-concorrencia-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="s7-concorrencia-modal concorrencia-discover-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar concorrentes do Mercado Livre"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Selecionar concorrentes do Mercado Livre</h2>
        </header>

        <div className="concorrencia-discover-modal__body">
          {discovering ? (
            <div className="concorrencia-produto-modal__state">Buscando candidatos no Mercado Livre…</div>
          ) : discoverError ? (
            <div className="concorrencia-produto-modal__state concorrencia-produto-modal__state--error">
              {discoverError}
            </div>
          ) : hasDiscovered && candidates.length === 0 ? (
            <div className="concorrencia-produto-modal__placeholder">
              <S7Icon name="search" size={22} />
              <span>
                Nenhum concorrente encontrado para este termo no Mercado Livre. Tente uma busca mais ampla, por
                exemplo: &quot;escorredor&quot;, &quot;cuba banheiro&quot; ou a marca do produto.
              </span>
            </div>
          ) : candidates.length > 0 ? (
            <div className="concorrencia-discover-modal__results">
              <div className="concorrencia-produto-modal__cands-meta concorrencia-discover-modal__meta">
                <span className="concorrencia-produto-modal__cands-count">
                  {candidates.length}{" "}
                  {candidates.length === 1 ? "resultado encontrado" : "resultados encontrados"}
                </span>
                {hasMoreCandidates ? (
                  <span className="concorrencia-produto-modal__cands-more-hint">
                    Há mais anúncios no Mercado Livre
                  </span>
                ) : null}
              </div>
              <div className="concorrencia-discover-modal__scroll">
                <ul
                  className="concorrencia-produto-modal__reg-grid concorrencia-discover-modal__reg-grid concorrencia-discover-modal__analitico-list"
                  aria-label="Candidatos encontrados no Mercado Livre"
                >
                  {candidates.map((cand) => {
                    const listingId = String(cand.competitor_listing_id || "");
                    const already = activeListingIds.has(listingId);
                    return (
                      <li key={listingId} className="concorrencia-analitico-item">
                        <ConcorrenciaProdutoConcorrenteCard
                          tagRaiz="div"
                          thumbUrl={pickCompetitorThumbnail(cand)}
                          titulo={displayCompetitorTitle(cand.competitor_title)}
                          href={pickCandidatePermalink(cand)}
                          preco={cand.competitor_price}
                          moeda={cand.currency}
                          precoNosso={precoNosso}
                          ocultarFreteNoPreco
                          ocultarVendedor
                          ocultarMedalha
                          tituloTooltipS7
                          tituloCopiavelS7
                          tituloCopiarChave={listingId}
                          overlayAcao={
                            <CandidateSaveAction
                              listingId={listingId}
                              already={already}
                              limitReached={limitReached}
                              candidate={cand}
                              onSave={onSave}
                              layout="overlay"
                            />
                          }
                        />
                        <ConcorrenciaConcorrenteOficialMeta competitor={cand} variante="discover" />
                      </li>
                    );
                  })}
                </ul>
              </div>
              {hasMoreCandidates ? (
                <div className="concorrencia-discover-modal__footer concorrencia-produto-modal__load-more-wrap">
                  <button
                    type="button"
                    className="concorrencia-produto-modal__load-more-btn"
                    onClick={onLoadMore}
                    disabled={loadingMore || discovering}
                  >
                    {loadingMore ? "Carregando mais…" : "Carregar mais resultados"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
