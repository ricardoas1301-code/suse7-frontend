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
 *   selectedSelectionId: string | null;
 *   onSelectSelectionId: (selectionId: string) => void;
 * }} props
 */
export function PricingIntelligencePromotionsCarousel({
  rows,
  selectedSelectionId,
  onSelectSelectionId,
}) {
  const trackRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const cardRefs = useRef(/** @type {Record<string, HTMLButtonElement | null>} */ ({}));

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

  const indiceSelecionado = useMemo(() => {
    if (selectedSelectionId == null) return 0;
    const idx = itens.findIndex(({ meta }) => meta.selectionId === selectedSelectionId);
    return idx >= 0 ? idx : 0;
  }, [itens, selectedSelectionId]);

  useEffect(() => {
    const selectionId = itens[indiceSelecionado]?.meta.selectionId;
    if (selectionId == null) return;
    const btn = cardRefs.current[selectionId];
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [indiceSelecionado, itens]);

  const selecionarIndice = useCallback(
    (/** @type {number} */ idx) => {
      const alvo = itens[idx];
      if (alvo == null) return;
      onSelectSelectionId(alvo.meta.selectionId);
    },
    [itens, onSelectSelectionId],
  );

  const voltarSelecao = useCallback(() => {
    if (indiceSelecionado > 0) selecionarIndice(indiceSelecionado - 1);
  }, [indiceSelecionado, selecionarIndice]);

  const avancarSelecao = useCallback(() => {
    if (indiceSelecionado < itens.length - 1) selecionarIndice(indiceSelecionado + 1);
  }, [indiceSelecionado, itens.length, selecionarIndice]);

  if (itens.length === 0) return null;

  const mostrarSetas = itens.length > 1;

  return (
    <div className="pricing-intelligence-page__promotions-carousel" aria-label="Promoções do anúncio">
      {mostrarSetas ? (
        <button
          type="button"
          className="pricing-intelligence-page__promotions-carousel-nav"
          aria-label="Promoção anterior"
          disabled={indiceSelecionado <= 0}
          onClick={voltarSelecao}
        >
          <S7Icon name="chevron_left" size={18} strokeWidth={2} />
        </button>
      ) : null}

      <div className="pricing-intelligence-page__promotions-carousel-track-wrap">
        <div
          ref={trackRef}
          className="pricing-intelligence-page__promotions-carousel-track"
          role="tablist"
          aria-label="Selecionar promoção"
        >
          {itens.map(({ meta }, index) => {
            const ativo = index === indiceSelecionado;
            return (
              <button
                key={meta.selectionId}
                type="button"
                ref={(el) => {
                  cardRefs.current[meta.selectionId] = el;
                }}
                role="tab"
                aria-selected={ativo}
                className={[
                  "pricing-intelligence-page__promotion-mini-card",
                  `pricing-intelligence-page__promotion-mini-card--${meta.statusKind}`,
                  ativo ? "pricing-intelligence-page__promotion-mini-card--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectSelectionId(meta.selectionId)}
              >
                <span className="pricing-intelligence-page__promotion-mini-card-name" title={meta.nome}>
                  {meta.nome}
                </span>
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
          disabled={indiceSelecionado >= itens.length - 1}
          onClick={avancarSelecao}
        >
          <S7Icon name="chevron_right" size={18} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
