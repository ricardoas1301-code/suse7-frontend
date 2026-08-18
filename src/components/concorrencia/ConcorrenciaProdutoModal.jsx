// ======================================================================
// ConcorrenciaProdutoModal — Fase S1 (seleção visual + cadastro)
// Modal funcional conectado ao backend de concorrência:
//   Área 1 (esquerda) — concorrentes cadastrados (até 6) com remover
//   Área 2 (direita) — contexto do produto + busca ML (link no principal; nome no modal de descoberta)
//
// Regras: limite funcional de 6 ativos; seller sempre escolhe; soft-delete;
// nada de cálculo financeiro no front; sem edição manual de preço/título.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip";
import { useProductMainImageSrc } from "../../utils/productImageDisplayUrl";
import {
  listProductCompetitors,
  listMonitoredListingCompetitors,
  discoverProductCompetitors,
  discoverMonitoredListingCompetitors,
  resolveCompetitorLink,
  resolveMonitoredCompetitorLink,
  removeProductCompetitor,
} from "../../services/competitionApi";
import {
  formatCompactPriceSales,
  MENSAGEM_ENRICH_PARCIAL,
  pickCandidatePermalink,
  pickCompetitorSellerName,
  pickSalesHint,
  logSalesFrontTrace,
  logSalesAuditDev,
  resolverLinkAnuncioProprio,
  isConcorrenteAnuncioAtivo,
} from "./concorrenciaCompetitorDisplay";
import {
  countProductPendingSlots,
  getListingSaveStatus,
} from "./concorrenciaCompetitorSave";
import {
  notificarConcorrenciaAviso,
  notificarConcorrenciaRemovido,
} from "./concorrenciaToast";
import { useCompetitorSaveQueue } from "./useCompetitorSaveQueue";
import { useNotifications } from "../../contexts/NotificationContext";
import ConcorrenciaDiscoverModal from "./ConcorrenciaDiscoverModal";
import { CandidateSaveAction } from "./concorrenciaCandidateSaveAction";
import { ConcorrenciaProdutoConcorrenteCard } from "./ConcorrenciaProdutoConcorrenteCard";
import { ConcorrenciaOwnProductCard } from "./concorrenciaOwnProductCard";
import { parsePrecoMonetario } from "./concorrenciaCompetitorDisplay";

/** Limite funcional do Suse7 nesta fase (banco permite 9; produto usa 6). */
const FUNCTIONAL_LIMIT = 6;
const DISCOVER_RESULTS_LIMIT = 20;
const MARKETPLACE = "mercado_livre";

function displayCompetitorTitle(title) {
  const t = String(title || "").trim();
  return t || "Anúncio sem título disponível";
}

function formatListingType(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  return s.replace(/_/g, " ");
}

function formatPowerSeller(reputation) {
  const s = String(reputation?.power_seller_status || "").trim().toLowerCase();
  if (!s) return null;
  if (s === "platinum") return "MercadoLíder Platinum";
  if (s === "gold") return "MercadoLíder Gold";
  if (s === "silver") return "MercadoLíder";
  return null;
}

function pickCompetitorThumbnail(c) {
  if (!c || typeof c !== "object") return null;
  for (const key of ["competitor_thumbnail", "thumbnail", "picture_url"]) {
    const v = c[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

function pickCompetitorPrice(c) {
  if (!c || typeof c !== "object") return { value: null, currency: "BRL" };
  const currency = c.last_seen_currency || c.currency || "BRL";
  for (const key of ["last_seen_price", "competitor_price", "price"]) {
    const v = c[key];
    if (v != null && String(v).trim() !== "") return { value: v, currency };
  }
  return { value: null, currency };
}

/** Data/hora curta da última captura ("dd/mm hh:mm") ou null. */
function formatCapturedAt(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Validação leve de URL/id MLB colado pelo seller. */
function looksLikeMercadoLivreLink(value) {
  const s = String(value || "").trim();
  if (!s) return false;
  if (/ML[ABCU]\d{6,}/i.test(s)) return true;
  return /mercadolivre\.com|mercadolibre\.com/i.test(s);
}

/** Link efetivo do concorrente cadastrado (permalink salvo ou montado pelo listing_id). */
function resolveRegisteredCompetitorHref(competitor) {
  const permalink = pickCandidatePermalink(competitor);
  if (permalink) return permalink;
  const id = String(competitor?.competitor_listing_id || "").trim();
  const m = id.match(/ML([ABCU])(\d{6,})/i);
  if (m) return `https://produto.mercadolivre.com.br/ML${m[1].toUpperCase()}-${m[2]}`;
  return null;
}

function ConcorrenciaProdutoModalBody({
  product,
  monitoredListingId = null,
  ownListing,
  onClose,
  onChanged,
  onSaveCompetitor,
}) {
  const productId = product?.id ?? null;
  const monitoredId = monitoredListingId ?? product?.monitored_listing_id ?? null;
  const queueScopeId = monitoredId || productId;
  const name = String(product?.product_name || "Sem nome").trim() || "Sem nome";
  const sku = String(product?.sku || "").trim();
  const productImgUrl = useProductMainImageSrc(product);
  const listingThumb =
    product?.listing_thumbnail != null && String(product.listing_thumbnail).trim() !== ""
      ? String(product.listing_thumbnail).trim()
      : null;
  const imgUrl = listingThumb || productImgUrl;
  const productAdHref = resolverLinkAnuncioProprio(ownListing);
  const precoNosso = parsePrecoMonetario(ownListing?.price);

  const [competitors, setCompetitors] = useState([]);
  const [competitorsLoading, setCompetitorsLoading] = useState(true);
  const [competitorsError, setCompetitorsError] = useState(null);

  const [query, setQuery] = useState(name);
  const [discovering, setDiscovering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [discoverError, setDiscoverError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasDiscovered, setHasDiscovered] = useState(false);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(false);

  const [searchTab, setSearchTab] = useState("name");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCandidate, setLinkCandidate] = useState(null);
  const [linkPartial, setLinkPartial] = useState(false);
  const [linkResolving, setLinkResolving] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkTouched, setLinkTouched] = useState(false);

  const [removingId, setRemovingId] = useState(null);
  const [removeConfirmTarget, setRemoveConfirmTarget] = useState(null);
  const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
  const discoverRunTokenRef = useRef(0);
  const { addNotification } = useNotifications();
  const saveQueueTick = useCompetitorSaveQueue();
  void saveQueueTick;

  const activeCount = competitors.length;
  const pendingSlots = countProductPendingSlots(queueScopeId);
  const occupiedSlots = activeCount + pendingSlots;
  const limitReached = occupiedSlots >= FUNCTIONAL_LIMIT;
  const activeListingIds = useMemo(
    () => new Set(competitors.map((c) => String(c.competitor_listing_id || ""))),
    [competitors]
  );

  const loadCompetitors = useCallback(async ({ silent = false } = {}) => {
    if (!queueScopeId) return;
    if (!silent) {
      setCompetitorsLoading(true);
      setCompetitorsError(null);
    }
    const res = monitoredId
      ? await listMonitoredListingCompetitors(monitoredId)
      : productId
        ? await listProductCompetitors(productId)
        : { ok: false, error: "Contexto do anúncio indisponível." };
    if (res.ok) {
      const list = Array.isArray(res.competitors) ? res.competitors : [];
      setCompetitors(list);
      for (const c of list.slice(0, 6)) {
        logSalesFrontTrace("modal_competitors_load", c, {
          product_id: productId,
          monitored_listing_id: monitoredId,
        });
      }
    } else if (!silent) {
      setCompetitorsError(res.error || "Não foi possível carregar os concorrentes.");
    }
    if (!silent) setCompetitorsLoading(false);
  }, [queueScopeId, monitoredId, productId]);

  // Carrega concorrentes ativos ao abrir e reseta a busca para o nome do produto.
  useEffect(() => {
    setQuery(name);
    setCandidates([]);
    setHasDiscovered(false);
    setDiscoverError(null);
    setCatalogOffset(0);
    setHasMoreCandidates(false);
    setSearchTab("name");
    setLinkUrl("");
    setLinkCandidate(null);
    setLinkPartial(false);
    setLinkError(null);
    setLinkTouched(false);
    setDiscoverModalOpen(false);
    loadCompetitors();
    onChanged?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueScopeId, monitoredId]);

  useEffect(() => {
    const onSaved = (e) => {
      const detail = e.detail || {};
      if (monitoredId && String(detail.monitoredListingId) === String(monitoredId)) {
        loadCompetitors({ silent: true });
        onChanged?.();
        return;
      }
      if (String(detail.productId) !== String(productId)) return;
      loadCompetitors({ silent: true });
      onChanged?.();
    };
    window.addEventListener("s7:concorrencia:competitors-saved", onSaved);
    return () => window.removeEventListener("s7:concorrencia:competitors-saved", onSaved);
  }, [productId, monitoredId, loadCompetitors, onChanged]);

  const mergeCandidates = useCallback((prev, incoming) => {
    const seen = new Set(prev.map((c) => String(c.competitor_listing_id || "")));
    const merged = [...prev];
    for (const c of incoming) {
      const id = String(c.competitor_listing_id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(c);
    }
    return merged;
  }, []);

  const handleCloseDiscoverModal = useCallback(() => {
    discoverRunTokenRef.current += 1;
    setDiscoverModalOpen(false);
    setDiscovering(false);
    setLoadingMore(false);
  }, []);

  // Fechar com ESC (modal de descoberta tem prioridade).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (discoverModalOpen) {
        handleCloseDiscoverModal();
        return;
      }
      if (removeConfirmTarget) {
        setRemoveConfirmTarget(null);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, discoverModalOpen, removeConfirmTarget, handleCloseDiscoverModal]);

  const runDiscover = async ({ offset = 0, append = false, runToken = null } = {}) => {
    if (!productId) return;
    const q = String(query || "").trim();
    if (!q) return;

    const excludeListingIds = append
      ? candidates.map((c) => String(c.competitor_listing_id || "")).filter(Boolean)
      : [];

    if (import.meta.env.DEV) {
      console.info("[COMPETITION_UI] discover request", {
        productId,
        query: q,
        marketplace: MARKETPLACE,
        limit: DISCOVER_RESULTS_LIMIT,
        offset,
        append,
        exclude_count: excludeListingIds.length,
        accumulated: append ? candidates.length : 0,
      });
    }

    const res = monitoredId
      ? await discoverMonitoredListingCompetitors(monitoredId, productId, {
          query: q,
          marketplace: MARKETPLACE,
          limit: DISCOVER_RESULTS_LIMIT,
          offset,
          excludeListingIds,
        })
      : await discoverProductCompetitors(productId, {
          query: q,
          marketplace: MARKETPLACE,
          limit: DISCOVER_RESULTS_LIMIT,
          offset,
          excludeListingIds,
        });

    if (import.meta.env.DEV) {
      console.info("[COMPETITION_UI] discover response", {
        ok: res.ok,
        strategy: res.strategy ?? null,
        total: res.total ?? (res.results?.length ?? 0),
        warning: res.warning ?? null,
        paging: res.paging ?? null,
        debug: res.debug ?? null,
        accumulated_after: append ? candidates.length + (res.results?.length ?? 0) : res.results?.length ?? 0,
        error: res.ok ? null : res.error,
      });
    }

    if (runToken != null && runToken !== discoverRunTokenRef.current) {
      return;
    }

    if (res.ok) {
      const batch = Array.isArray(res.results) ? res.results : [];
      for (const c of batch.slice(0, 5)) {
        logSalesAuditDev("discover_results", c, "modal_discover");
      }
      setCandidates((prev) => (append ? mergeCandidates(prev, batch) : batch));
      const nextOffset =
        res.paging?.nextOffset != null
          ? res.paging.nextOffset
          : res.paging?.hasMore
            ? offset + DISCOVER_RESULTS_LIMIT
            : null;
      setCatalogOffset(nextOffset ?? 0);
      setHasMoreCandidates(Boolean(res.paging?.hasMore));
      if (res.warning === "ml_token_unavailable") {
        setDiscoverError("Conecte uma conta do Mercado Livre em Integrações para buscar concorrentes.");
      }
    } else if (!append) {
      setCandidates([]);
      setDiscoverError(res.error || "Falha ao buscar no Mercado Livre. Tente novamente.");
      setHasMoreCandidates(false);
    } else {
      notificarConcorrenciaAviso(
        addNotification,
        "Não foi possível carregar mais resultados",
        res.error || "Tente novamente."
      );
    }
  };

  const handleDiscover = async () => {
    if (!productId || discovering || loadingMore) return;
    const runToken = discoverRunTokenRef.current + 1;
    discoverRunTokenRef.current = runToken;
    setDiscoverModalOpen(true);
    setDiscovering(true);
    setDiscoverError(null);
    setHasDiscovered(true);
    setCatalogOffset(0);
    setHasMoreCandidates(false);
    await runDiscover({ offset: 0, append: false, runToken });
    if (runToken === discoverRunTokenRef.current) {
      setDiscovering(false);
    }
  };

  const handleLoadMore = async () => {
    if (!productId || discovering || loadingMore || !hasMoreCandidates) return;
    const runToken = discoverRunTokenRef.current + 1;
    discoverRunTokenRef.current = runToken;
    const nextOffset = catalogOffset;
    if (!Number.isFinite(nextOffset) || nextOffset < 0) return;
    setLoadingMore(true);
    await runDiscover({ offset: nextOffset, append: true, runToken });
    if (runToken === discoverRunTokenRef.current) {
      setLoadingMore(false);
    }
  };

  const linkLooksValid = looksLikeMercadoLivreLink(linkUrl);

  const handleResolveLink = async () => {
    if (!productId || linkResolving) return;
    const url = String(linkUrl || "").trim();
    setLinkTouched(true);
    if (!url) {
      setLinkError("Cole o link do anúncio do Mercado Livre.");
      setLinkCandidate(null);
      return;
    }
    if (!looksLikeMercadoLivreLink(url)) {
      setLinkError("Link inválido. Use uma URL de anúncio do Mercado Livre.");
      setLinkCandidate(null);
      return;
    }

    setLinkResolving(true);
    setLinkError(null);
    setLinkCandidate(null);
    setLinkPartial(false);

    if (import.meta.env.DEV) {
      console.info("[COMPETITION_UI] resolve-link request", { productId, url_length: url.length });
    }

    const res = monitoredId
      ? await resolveMonitoredCompetitorLink(monitoredId, productId, url)
      : await resolveCompetitorLink(productId, url);

    if (import.meta.env.DEV) {
      console.info("[COMPETITION_UI] resolve-link response", {
        ok: res.ok,
        item_id: res.item_id ?? null,
        code: res.code ?? null,
        error: res.error ?? null,
        partial: res.partial ?? false,
        resolved_via: res.resolved_via ?? null,
        debug: res.debug ?? null,
      });
    }

    if (res.ok && res.candidate) {
      logSalesAuditDev("resolve_link_preview", res.candidate, "modal_link");
      setLinkCandidate(res.candidate);
      setLinkPartial(res.partial === true);
      setLinkError(null);
    } else {
      setLinkCandidate(null);
      setLinkPartial(false);
      setLinkError(res.error || "Não foi possível ler este anúncio.");
    }
    setLinkResolving(false);
  };

  const handleSave = (candidate) => {
    if (!productId || !onSaveCompetitor) return;
    const listingId = String(candidate.competitor_listing_id || "");
    if (!listingId || getListingSaveStatus(listingId)) return;
    if (limitReached) {
      notificarConcorrenciaAviso(addNotification, "Limite de 6 concorrentes atingido.");
      return;
    }

    const isLinkSave =
      linkCandidate && String(linkCandidate.competitor_listing_id || "") === listingId;

    const res = onSaveCompetitor({
      product,
      candidate,
      linkUrl: isLinkSave ? linkUrl : null,
    });

    if (res?.ok && res.queued) {
      if (isLinkSave) {
        setLinkCandidate(null);
        setLinkUrl("");
        setLinkTouched(false);
      }
    } else if (!res?.ok) {
      if (res?.code === "LIMIT_REACHED" || res?.code === "ALREADY_QUEUED") {
        if (res.code === "LIMIT_REACHED") {
          notificarConcorrenciaAviso(addNotification, "Limite de 6 concorrentes atingido.");
        }
      } else {
        notificarConcorrenciaAviso(
          addNotification,
          "Não foi possível cadastrar",
          res?.error || "Tente novamente."
        );
      }
    }
  };

  const handleRemove = async (competitor) => {
    if (!competitor?.id || removingId) return;
    setRemovingId(competitor.id);
    const res = await removeProductCompetitor(competitor.id);
    if (res.ok) {
      await loadCompetitors();
      notificarConcorrenciaRemovido(addNotification);
      onChanged?.();
    } else {
      notificarConcorrenciaAviso(
        addNotification,
        "Não foi possível remover o concorrente",
        res.error || "Tente novamente."
      );
    }
    setRemovingId(null);
  };

  const handleRequestRemove = (competitor) => {
    if (!competitor?.id || removingId) return;
    setRemoveConfirmTarget(competitor);
  };

  const handleCancelRemove = () => {
    setRemoveConfirmTarget(null);
  };

  const handleConfirmRemove = async () => {
    if (!removeConfirmTarget) return;
    const alvo = removeConfirmTarget;
    setRemoveConfirmTarget(null);
    await handleRemove(alvo);
  };

  return (
    <>
    <div className="s7-concorrencia-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="s7-concorrencia-modal concorrencia-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Gerenciar concorrentes — ${name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Gerenciar concorrentes</h2>
        </header>

        <div className="concorrencia-produto-modal__body">
          <div className="concorrencia-produto-modal__col concorrencia-produto-modal__col--left">
        {/* Coluna esquerda — concorrentes cadastrados */}
        <section className="concorrencia-produto-modal__section concorrencia-produto-modal__section--registered">
          {competitorsLoading ? (
            <div className="concorrencia-produto-modal__state">Carregando concorrentes…</div>
          ) : competitorsError ? (
            <div className="concorrencia-produto-modal__state concorrencia-produto-modal__state--error">
              {competitorsError}
              <button type="button" className="concorrencia-produto-modal__retry" onClick={loadCompetitors}>
                Tentar novamente
              </button>
            </div>
          ) : competitors.length === 0 ? (
            <div className="concorrencia-produto-modal__placeholder">
              <S7Icon name="monitoring" size={22} />
              <span>Nenhum concorrente cadastrado ainda.</span>
            </div>
          ) : (
            <ul
              className="concorrencia-produto-modal__reg-grid"
              aria-label="Concorrentes cadastrados"
            >
              {competitors.map((c) => {
                const competitorLink = resolveRegisteredCompetitorHref(c);
                const thumbUrl = pickCompetitorThumbnail(c);
                const priceInfo = pickCompetitorPrice(c);
                const sellerName = pickCompetitorSellerName(c);
                const reputation = formatPowerSeller(c.reputation);
                const titulo = displayCompetitorTitle(c.competitor_title);
                const listingId = String(c.competitor_listing_id || c.id || "");
                const anuncioInativo = !isConcorrenteAnuncioAtivo(c);
                return (
                  <ConcorrenciaProdutoConcorrenteCard
                    key={c.id}
                    thumbUrl={thumbUrl}
                    titulo={titulo}
                    href={competitorLink}
                    preco={priceInfo.value}
                    moeda={priceInfo.currency}
                    shipping={c.shipping}
                    nomeVendedor={sellerName}
                    medalhaVendedor={reputation}
                    precoNosso={precoNosso}
                    anuncioInativo={anuncioInativo}
                    tituloTooltipS7
                    tituloCopiavelS7
                    tituloCopiarChave={listingId}
                    overlayAcao={
                      <S7Tooltip content="Remover concorrente" placement="bottom-start" offset={6}>
                        <span
                          className="concorrencia-produto-modal__reg-card-delete-wrap"
                          aria-label="Remover concorrente"
                        >
                          <button
                            type="button"
                            className="concorrencia-produto-modal__reg-card-delete"
                            aria-label="Remover concorrente"
                            disabled={removingId === c.id}
                            onClick={() => handleRequestRemove(c)}
                          >
                            {removingId === c.id ? "…" : <S7Icon name="trash" size={13} strokeWidth={1.9} />}
                          </button>
                        </span>
                      </S7Tooltip>
                    }
                    slotRodape={
                      c.enrich_status === "partial" || c.enrich_status === "failed" ? (
                        <span className="concorrencia-produto-modal__reg-card-status concorrencia-produto-modal__reg-card-status--pending">
                          {MENSAGEM_ENRICH_PARCIAL}
                        </span>
                      ) : null
                    }
                  />
                );
              })}
            </ul>
          )}
        </section>
          </div>

          <div className="concorrencia-produto-modal__col concorrencia-produto-modal__col--right">
        {/* Coluna direita — contexto do produto + busca e resultados ML */}
        <ConcorrenciaOwnProductCard
          name={name}
          sku={sku}
          productId={productId}
          imgUrl={imgUrl}
          productAdHref={productAdHref}
          ownListing={ownListing}
          limitReached={limitReached}
          occupiedSlots={occupiedSlots}
          functionalLimit={FUNCTIONAL_LIMIT}
        />

        <section className="concorrencia-produto-modal__section concorrencia-produto-modal__section--search">
          <h4 className="concorrencia-produto-modal__section-title">Buscar concorrentes no Mercado Livre</h4>

          <div className="concorrencia-produto-modal__tabs" role="tablist" aria-label="Forma de cadastro de concorrente">
            <button
              type="button"
              role="tab"
              aria-selected={searchTab === "name"}
              className={`concorrencia-produto-modal__tab${searchTab === "name" ? " concorrencia-produto-modal__tab--active" : ""}`}
              onClick={() => setSearchTab("name")}
            >
              Buscar por nome
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={searchTab === "link"}
              className={`concorrencia-produto-modal__tab${searchTab === "link" ? " concorrencia-produto-modal__tab--active" : ""}`}
              onClick={() => setSearchTab("link")}
            >
              Cadastrar por link
            </button>
          </div>

          {searchTab === "name" ? (
          <div className="concorrencia-produto-modal__search">
            <input
              type="text"
              className="concorrencia-produto-modal__search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, palavras-chave, GTIN ou título"
              aria-label="Termo de busca de concorrentes"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDiscover();
              }}
            />
            <button
              type="button"
              className="concorrencia-produto-modal__search-btn"
              onClick={handleDiscover}
              disabled={discovering || !String(query || "").trim()}
            >
              {discovering ? "Buscando…" : "Buscar no Mercado Livre"}
            </button>
          </div>
          ) : (
          <div className="concorrencia-produto-modal__search concorrencia-produto-modal__search--link">
            <input
              type="url"
              className={`concorrencia-produto-modal__search-input${linkTouched && linkUrl && !linkLooksValid ? " concorrencia-produto-modal__search-input--invalid" : ""}`}
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (linkError) setLinkError(null);
                if (linkCandidate) setLinkCandidate(null);
              }}
              onBlur={() => setLinkTouched(true)}
              placeholder="Cole o link do anúncio no Mercado Livre"
              aria-label="Link do anúncio concorrente"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleResolveLink();
              }}
            />
            <button
              type="button"
              className="concorrencia-produto-modal__search-btn"
              onClick={handleResolveLink}
              disabled={linkResolving || !String(linkUrl || "").trim()}
            >
              {linkResolving ? "Buscando anúncio…" : "Buscar anúncio"}
            </button>
          </div>
          )}

          {searchTab === "link" && linkTouched && linkUrl && !linkLooksValid ? (
            <div className="concorrencia-produto-modal__state concorrencia-produto-modal__state--error">
              Link inválido. Cole uma URL de anúncio do Mercado Livre (ex.: produto.mercadolivre.com.br/…).
            </div>
          ) : null}

          {limitReached ? (
            <div className="concorrencia-produto-modal__limit">
              {FUNCTIONAL_LIMIT} de {FUNCTIONAL_LIMIT} concorrentes monitorados — limite atingido.
            </div>
          ) : null}

          {searchTab === "link" ? (
          <div className="concorrencia-produto-modal__search-results">
            {linkResolving ? (
              <div className="concorrencia-produto-modal__state">Buscando anúncio no Mercado Livre…</div>
            ) : linkError ? (
              <div className="concorrencia-produto-modal__state concorrencia-produto-modal__state--error">
                {linkError}
              </div>
            ) : linkCandidate ? (
              <>
              {linkPartial ? (
                <p className="concorrencia-produto-modal__link-partial-hint">
                  Anúncio identificado pelo link. Dados complementares serão atualizados automaticamente.
                </p>
              ) : null}
              <ul className="concorrencia-produto-modal__cands">
                <li className="concorrencia-produto-modal__cand">
                  <div className="concorrencia-produto-modal__cand-thumb">
                    {linkCandidate.competitor_thumbnail ? (
                      <img src={linkCandidate.competitor_thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="concorrencia-produto-modal__card-thumb-ph" aria-hidden>
                        <S7Icon name="image" size={18} />
                      </span>
                    )}
                  </div>
                  <div className="concorrencia-produto-modal__cand-main">
                    {pickCandidatePermalink(linkCandidate) ? (
                      <a
                        className="concorrencia-produto-modal__cand-title concorrencia-produto-modal__cand-title--link"
                        href={pickCandidatePermalink(linkCandidate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={displayCompetitorTitle(linkCandidate.competitor_title)}
                      >
                        {displayCompetitorTitle(linkCandidate.competitor_title)}
                      </a>
                    ) : (
                      <span
                        className="concorrencia-produto-modal__cand-title"
                        title={displayCompetitorTitle(linkCandidate.competitor_title)}
                      >
                        {displayCompetitorTitle(linkCandidate.competitor_title)}
                      </span>
                    )}
                    <span className="concorrencia-produto-modal__cand-meta">
                      <strong>
                        {formatCompactPriceSales(
                          linkCandidate.competitor_price,
                          pickSalesHint(linkCandidate),
                          linkCandidate.currency
                        )}
                      </strong>
                      {pickCompetitorSellerName(linkCandidate) ? (
                        <>
                          <span className="concorrencia-produto-modal__dot">·</span>
                          {pickCompetitorSellerName(linkCandidate)}
                        </>
                      ) : null}
                      {linkCandidate.shipping?.free_shipping ? (
                        <>
                          <span className="concorrencia-produto-modal__dot">·</span>
                          <span className="concorrencia-produto-modal__free">Frete grátis</span>
                        </>
                      ) : null}
                      {formatListingType(linkCandidate.listing_type) ? (
                        <>
                          <span className="concorrencia-produto-modal__dot">·</span>
                          {formatListingType(linkCandidate.listing_type)}
                        </>
                      ) : null}
                      {formatPowerSeller(linkCandidate.reputation) ? (
                        <>
                          <span className="concorrencia-produto-modal__dot">·</span>
                          <span className="concorrencia-produto-modal__seller-badge">
                            {formatPowerSeller(linkCandidate.reputation)}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <CandidateSaveAction
                    listingId={String(linkCandidate.competitor_listing_id || "")}
                    already={activeListingIds.has(String(linkCandidate.competitor_listing_id || ""))}
                    limitReached={limitReached}
                    candidate={linkCandidate}
                    onSave={handleSave}
                  />
                </li>
              </ul>
              </>
            ) : (
              <div className="concorrencia-produto-modal__placeholder concorrencia-produto-modal__placeholder--ml">
                <S7Icon name="search" size={22} />
                <span>Cole o link de um anúncio concorrente e clique em Buscar anúncio para visualizar antes de cadastrar.</span>
              </div>
            )}
          </div>
          ) : null}
        </section>
          </div>
        </div>

        {removeConfirmTarget ? (
          <div
            className="concorrencia-produto-modal__confirm-backdrop"
            role="presentation"
            onMouseDown={handleCancelRemove}
          >
            <div
              className="concorrencia-produto-modal__confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="concorrencia-remove-confirm-title"
              aria-describedby="concorrencia-remove-confirm-desc"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3 id="concorrencia-remove-confirm-title" className="concorrencia-produto-modal__confirm-title">
                Excluir concorrente?
              </h3>
              <p id="concorrencia-remove-confirm-desc" className="concorrencia-produto-modal__confirm-text">
                Deseja realmente remover este concorrente do monitoramento?
              </p>
              <div className="concorrencia-produto-modal__confirm-actions">
                <button
                  type="button"
                  className="concorrencia-produto-modal__confirm-btn concorrencia-produto-modal__confirm-btn--cancel"
                  onClick={handleCancelRemove}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="concorrencia-produto-modal__confirm-btn concorrencia-produto-modal__confirm-btn--danger"
                  disabled={!!removingId}
                  onClick={() => void handleConfirmRemove()}
                >
                  {removingId ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>

    <ConcorrenciaDiscoverModal
      open={discoverModalOpen}
      onClose={handleCloseDiscoverModal}
      discovering={discovering}
      loadingMore={loadingMore}
      discoverError={discoverError}
      hasDiscovered={hasDiscovered}
      candidates={candidates}
      hasMoreCandidates={hasMoreCandidates}
      activeListingIds={activeListingIds}
      limitReached={limitReached}
      precoNosso={precoNosso}
      onSave={handleSave}
      onLoadMore={() => void handleLoadMore()}
    />
    </>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   product: Record<string, unknown> | null;
 *   monitoredListingId?: string | null;
 *   ownListing?: object | null;
 *   onClose: () => void;
 *   onChanged?: () => void;
 *   onSaveCompetitor?: (args: { product: object; candidate: object; linkUrl?: string | null }) => Promise<object>;
 * }} props
 */
export default function ConcorrenciaProdutoModal({
  open,
  product,
  monitoredListingId = null,
  ownListing = null,
  onClose,
  onChanged,
  onSaveCompetitor,
}) {
  if (!open || !product) return null;
  return createPortal(
    <ConcorrenciaProdutoModalBody
      product={product}
      monitoredListingId={monitoredListingId}
      ownListing={ownListing}
      onClose={onClose}
      onChanged={onChanged}
      onSaveCompetitor={onSaveCompetitor}
    />,
    document.body
  );
}
