// ======================================================
// PI — Carrossel horizontal de mini-cards de promoção (navegação).
// Somente UX; sem lógica financeira.
// ======================================================

import { useCallback, useEffect, useMemo, useRef } from "react";

import S7Icon from "../ui/S7Icon.jsx";
import { resolvePromotionMiniCardMeta } from "./pricingPromotionCarouselUi.js";
import { logPiPromosAuditRendered } from "./pricingPromotionsAudit.js";

/**
 * @param {{
 *   rows: { scenario: unknown; group: string }[];
 *   selectedSelectionIds?: string[];
 *   selectedSelectionId?: string | null;
 *   onSelectSelectionId: (selectionId: string) => void;
 * }} props
 */
export function PricingIntelligencePromotionsCarousel({
  rows,
  selectedSelectionIds = [],
  selectedSelectionId = null,
  onSelectSelectionId,
}) {
  const trackRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const cardRefs = useRef(/** @type {Record<string, HTMLButtonElement | null>} */ ({}));

  const idsSelecionados = useMemo(() => {
    if (selectedSelectionIds.length > 0) return selectedSelectionIds;
    return selectedSelectionId != null ? [selectedSelectionId] : [];
  }, [selectedSelectionIds, selectedSelectionId]);

  const itens = useMemo(
    () =>
      rows.map((row, index) => ({
        row,
        meta: resolvePromotionMiniCardMeta(row, index),
      })),
    [rows],
  );

  useEffect(() => {
    logPiPromosAuditRendered(itens.length, null);
  }, [itens.length]);

  const indiceFoco = useMemo(() => {
    const alvo = idsSelecionados[idsSelecionados.length - 1];
    if (alvo == null) return 0;
    const idx = itens.findIndex(({ meta }) => meta.selectionId === alvo);
    return idx >= 0 ? idx : 0;
  }, [itens, idsSelecionados]);

  useEffect(() => {
    const selectionId = itens[indiceFoco]?.meta.selectionId;
    if (selectionId == null) return;
    const btn = cardRefs.current[selectionId];
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [indiceFoco, itens]);

  const selecionarIndice = useCallback(
    (/** @type {number} */ idx) => {
      const alvo = itens[idx];
      if (alvo == null) return;
      onSelectSelectionId(alvo.meta.selectionId);
    },
    [itens, onSelectSelectionId],
  );

  const voltarSelecao = useCallback(() => {
    if (indiceFoco > 0) selecionarIndice(indiceFoco - 1);
  }, [indiceFoco, selecionarIndice]);

  const avancarSelecao = useCallback(() => {
    if (indiceFoco < itens.length - 1) selecionarIndice(indiceFoco + 1);
  }, [indiceFoco, itens.length, selecionarIndice]);

  if (itens.length === 0) return null;

  const mostrarSetas = itens.length > 1;

  return (
    <div className="pricing-intelligence-page__promotions-carousel" aria-label="Promoções do anúncio">
      {mostrarSetas ? (
        <button
          type="button"
          className="pricing-intelligence-page__promotions-carousel-nav"
          aria-label="Promoção anterior"
          disabled={indiceFoco <= 0}
          onClick={voltarSelecao}
        >
          <S7Icon name="chevron_left" size={18} strokeWidth={2} />
        </button>
      ) : null}

      <div className="pricing-intelligence-page__promotions-carousel-track-wrap">
        <div
          ref={trackRef}
          className="pricing-intelligence-page__promotions-carousel-track"
          role="listbox"
          aria-label="Selecionar promoção para comparar"
          aria-multiselectable="true"
        >
          {itens.map(({ meta }) => {
            const indiceSlot = idsSelecionados.indexOf(meta.selectionId);
            const selecionado = indiceSlot >= 0;
            return (
              <button
                key={meta.selectionId}
                type="button"
                ref={(el) => {
                  cardRefs.current[meta.selectionId] = el;
                }}
                role="option"
                aria-selected={selecionado}
                className={[
                  "pricing-intelligence-page__promotion-mini-card",
                  `pricing-intelligence-page__promotion-mini-card--${meta.statusKind}`,
                  selecionado ? "pricing-intelligence-page__promotion-mini-card--selected" : "",
                  selecionado && indiceSlot === 0
                    ? "pricing-intelligence-page__promotion-mini-card--slot-a"
                    : "",
                  selecionado && indiceSlot === 1
                    ? "pricing-intelligence-page__promotion-mini-card--slot-b"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectSelectionId(meta.selectionId)}
              >
                <span className="pricing-intelligence-page__promotion-mini-card-name" title={meta.nome}>
                  {meta.nome}
                </span>
                {meta.precoPromocional ? (
                  <span className="pricing-intelligence-page__promotion-mini-card-price">{meta.precoPromocional}</span>
                ) : null}
                {meta.descontoResumo ? (
                  <span className="pricing-intelligence-page__promotion-mini-card-discount">{meta.descontoResumo}</span>
                ) : null}
                <span
                  className={[
                    "pricing-intelligence-page__promotion-mini-card-status",
                    `pricing-intelligence-page__promotion-mini-card-status--${meta.statusKind}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {meta.status}
                </span>
                {selecionado ? (
                  <span className="pricing-intelligence-page__promotion-mini-card-slot-badge" aria-hidden>
                    {indiceSlot === 0 ? "A" : "B"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {mostrarSetas ? (
        <button
          type="button"
          className="pricing-intelligence-page__promotions-carousel-nav"
          aria-label="Próxima promoção"
          disabled={indiceFoco >= itens.length - 1}
          onClick={avancarSelecao}
        >
          <S7Icon name="chevron_right" size={18} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
