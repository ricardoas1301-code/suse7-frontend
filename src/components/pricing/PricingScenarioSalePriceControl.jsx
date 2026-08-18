// ======================================================
// Linha "Valor de venda" com edição independente por card.
// Lápis abre o popover de simulação ancorado acima da linha.
// O popover é portado para o body (fixed) para ficar acima de todos
// os elementos (inclusive o menu do topo) e não ser recortado.
// ======================================================

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Icon from "../ui/S7Icon.jsx";
import { PricingScenarioEditPopover } from "./PricingScenarioEditPopover.jsx";

/**
 * @typedef {{
 *   scenarioType: "classic" | "premium" | string;
 *   title?: string | null;
 *   displayValue: string;
 *   isOpen: boolean;
 *   onOpen: () => void;
 *   onClose: () => void;
 *   precoVendaNum?: number | null;
 *   precoSliderMin?: number;
 *   precoSliderMax?: number;
 *   onPrecoVendaChange?: (v: number) => void;
 *   onPrecoVendaTextoChange?: (raw: string) => void;
 *   margemPctNum?: number | null;
 *   margemEspelhaResultado?: boolean;
 *   margemSliderMax?: number;
 *   onMargemPctChange?: (v: number) => void;
 *   onMargemPctTextoChange?: (raw: string) => void;
 *   onIniciarEdicaoMargem?: () => void;
 *   loading?: boolean;
 *   erro?: string | null;
 * }} SalePriceEditControl
 */

/** @param {{ control: SalePriceEditControl }} props */
export function PricingScenarioSalePriceControl({ control }) {
  const {
    scenarioType,
    title = null,
    displayValue,
    isOpen,
    onOpen,
    onClose,
    precoVendaNum = null,
    precoSliderMin = 1,
    precoSliderMax = 1000,
    onPrecoVendaChange,
    onPrecoVendaTextoChange,
    margemPctNum = null,
    margemEspelhaResultado = false,
    margemSliderMax = 60,
    onMargemPctChange,
    onMargemPctTextoChange,
    onIniciarEdicaoMargem,
    loading = false,
    erro = null,
  } = control;

  const lineRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const anchorRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const popoverRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [coords, setCoords] = useState(
    /** @type {{ left: number; bottom: number } | null} */ (null),
  );

  const recomputarPosicao = useCallback(() => {
    const anchorEl = anchorRef.current ?? lineRef.current;
    if (anchorEl == null) return;
    const r = anchorEl.getBoundingClientRect();
    const panel = document.querySelector(".pricing-intelligence-modal__panel");
    const estilosPainel = panel != null ? getComputedStyle(panel) : null;
    const gap = Number.parseFloat(estilosPainel?.getPropertyValue("--s7-pi-edit-popover-gap-acima-linha") ?? "") || 6;
    const deslocamentoBaixo =
      Number.parseFloat(estilosPainel?.getPropertyValue("--s7-pi-edit-popover-deslocamento-baixo") ?? "") || 8;
    /** Base da linha "Valor de venda" (lápis + R$) — popover encosta acima dela, não no topo do card. */
    let bottom = window.innerHeight - r.bottom + gap - deslocamentoBaixo;

    const colEl = lineRef.current?.closest(".pricing-listing-type-compare__col");
    const cardRect = colEl?.getBoundingClientRect();

    const pop = popoverRef.current;
    if (pop != null) {
      const largura = pop.offsetWidth;

      if (cardRect != null) {
        let left = cardRect.left + cardRect.width / 2;
        const margemCard = 6;
        left = Math.max(
          cardRect.left + margemCard + largura / 2,
          Math.min(left, cardRect.right - margemCard - largura / 2),
        );
        setCoords({ left, bottom });
        return;
      }

      const margem = 8;
      const panel = document.querySelector(".pricing-intelligence-modal__panel");
      const limitesHorizontais = panel?.getBoundingClientRect() ?? {
        left: margem,
        right: window.innerWidth - margem,
      };
      const left = Math.max(
        limitesHorizontais.left + largura / 2,
        Math.min(r.left + r.width / 2, limitesHorizontais.right - largura / 2),
      );
      setCoords({ left, bottom });
      return;
    }

    setCoords({ left: r.left + r.width / 2, bottom });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    recomputarPosicao();
    const id = requestAnimationFrame(recomputarPosicao);
    window.addEventListener("scroll", recomputarPosicao, true);
    window.addEventListener("resize", recomputarPosicao);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", recomputarPosicao, true);
      window.removeEventListener("resize", recomputarPosicao);
    };
  }, [isOpen, recomputarPosicao, loading]);

  return (
    <div
      ref={lineRef}
      className="pricing-scenario-sale-control anuncios-sell-popover__line anuncios-sell-popover__line--key anuncios-sell-popover__line--promo-sale"
    >
      <span className="anuncios-sell-popover__promo-sale-label">
        <span className="anuncios-sell-popover__promo-sale-title-inline">
          <span className="anuncios-sell-popover__promo-sale-title-text">Valor de venda</span>
        </span>
      </span>
      <span ref={anchorRef} className="pricing-scenario-sale-control__value-wrap">
        <button
          type="button"
          className={[
            "pricing-inline-editable-metric__edit-btn",
            isOpen ? "pricing-inline-editable-metric__edit-btn--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={isOpen ? "Fechar simulação do valor de venda" : "Simular valor de venda"}
          aria-expanded={isOpen}
          onClick={isOpen ? onClose : onOpen}
        >
          <S7Icon name="edit" size={12} strokeWidth={2} />
        </button>
        <strong>{displayValue}</strong>
        {loading ? (
          <span
            className="pricing-scenario-sale-control__loading"
            role="status"
            aria-label="Recalculando cenário oficial"
            title="Recalculando no Mercado Livre…"
          />
        ) : null}
      </span>
      {isOpen && coords != null
        ? createPortal(
            <div
              ref={popoverRef}
              className="pricing-scenario-edit-popover__portal"
              style={{ left: `${coords.left}px`, bottom: `${coords.bottom}px` }}
            >
              <PricingScenarioEditPopover
                scenarioType={scenarioType}
                title={title}
                precoVendaNum={precoVendaNum}
                precoSliderMin={precoSliderMin}
                precoSliderMax={precoSliderMax}
                onPrecoVendaChange={onPrecoVendaChange}
                onPrecoVendaTextoChange={onPrecoVendaTextoChange}
                margemPctNum={margemPctNum}
                margemEspelhaResultado={margemEspelhaResultado}
                margemSliderMax={margemSliderMax}
                onMargemPctChange={onMargemPctChange}
                onMargemPctTextoChange={onMargemPctTextoChange}
                onIniciarEdicaoMargem={onIniciarEdicaoMargem}
                loading={loading}
                erro={erro}
                onClose={onClose}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
