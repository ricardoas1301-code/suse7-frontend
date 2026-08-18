// ======================================================
// PI — Preço promocional com popover (paridade aba Precificação).
// S4.3.6.10 — fecha somente pelo X; atualização local em tempo real.
// S4.3.6.12 — teto imutável + slider unidirecional de desconto.
// S4.3.6.13 — edição bidirecional preço ↔ desconto.
// ======================================================

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { PromotionMiniCardPencilButton } from "./PromotionMiniCardPencilButton.jsx";
import { PricingScenarioEditPopover } from "./PricingScenarioEditPopover.jsx";
import { decimalBrlParaNumeroSimulacao } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import {
  calcularDescontoSimulacaoAPartirPreco,
  numeroSimulacaoParaPrecoBrl,
  resolverLimitesSliderTetoPromocional,
  validarDescontoPromocionalContraMinimo,
  validarPrecoPromocionalContraTeto,
} from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";
import { PROMO_DESCONTO_PERCENTUAL_EXATO_TOOLTIP } from "../../features/pricing/promotions/promotionDiscountSemantics.js";

/**
 * @param {{
 *   selectionId: string;
 *   showPencil: boolean;
 *   pencilEnabled?: boolean;
 *   tooltip?: string | null;
 *   isOpen: boolean;
 *   onOpen: () => void;
 *   onClose: () => void;
 *   precoBrl?: string | null;
 *   precoTetoBrl?: string | null;
 *   precoBaseBrl?: string | null;
 *   descontoPctNum?: number | null;
 *   initialDiscountPercentDec?: string | null;
 *   initialDiscountPercentDisplay?: string | null;
 *   onPrecoChange: (priceBrl: string) => void;
 * }} props
 */
export function PromotionMiniCardPricePopoverControl({
  selectionId,
  showPencil,
  pencilEnabled = true,
  tooltip = null,
  isOpen,
  onOpen,
  onClose,
  precoBrl = null,
  precoTetoBrl = null,
  precoBaseBrl = null,
  descontoPctNum = null,
  initialDiscountPercentDec = null,
  initialDiscountPercentDisplay = null,
  onPrecoChange,
}) {
  const anchorRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const popoverRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const lastEditSourceRef = useRef(/** @type {"PRICE_INPUT" | "DISCOUNT_INPUT" | "SLIDER" | null} */ (null));
  const [coords, setCoords] = useState(/** @type {{ left: number; bottom: number } | null} */ (null));
  const [validacaoPrecoErro, setValidacaoPrecoErro] = useState(/** @type {string | null} */ (null));

  const precoVendaNum = decimalBrlParaNumeroSimulacao(precoBrl ?? "");
  const limitesSlider = resolverLimitesSliderTetoPromocional(precoTetoBrl, precoBrl);
  const sliderHabilitado = limitesSlider.habilitado && precoTetoBrl != null;

  const aplicarPrecoValido = useCallback(
    (priceBrl) => {
      setValidacaoPrecoErro(null);
      onPrecoChange(priceBrl);
    },
    [onPrecoChange],
  );

  const handlePrecoVendaChange = useCallback(
    (num, /** @type {"PRICE_INPUT" | "SLIDER" | "STEPPER"} */ origem = "PRICE_INPUT") => {
      if (lastEditSourceRef.current === "DISCOUNT_INPUT") return;

      const priceBrl = numeroSimulacaoParaPrecoBrl(num);
      if (priceBrl == null) return;

      lastEditSourceRef.current = origem === "SLIDER" || origem === "STEPPER" ? "SLIDER" : "PRICE_INPUT";

      if (precoTetoBrl == null || String(precoTetoBrl).trim() === "") {
        const calc = calcularDescontoSimulacaoAPartirPreco(precoBaseBrl, priceBrl);
        if (calc?.ok === false) {
          lastEditSourceRef.current = null;
          return;
        }
        aplicarPrecoValido(priceBrl);
        lastEditSourceRef.current = null;
        return;
      }

      const gate = validarPrecoPromocionalContraTeto(precoTetoBrl, priceBrl, precoBaseBrl);
      if (!gate.ok) {
        if (gate.code === "ABOVE_CEILING") {
          setValidacaoPrecoErro(gate.error ?? null);
        }
        lastEditSourceRef.current = null;
        return;
      }
      aplicarPrecoValido(gate.priceBrl ?? priceBrl);
      lastEditSourceRef.current = null;
    },
    [precoTetoBrl, precoBaseBrl, aplicarPrecoValido],
  );

  const handleDescontoPctTextoChange = useCallback(
    (raw) => {
      if (lastEditSourceRef.current === "PRICE_INPUT" || lastEditSourceRef.current === "SLIDER") return;

      const trimmed = String(raw ?? "").trim();
      if (trimmed === "") {
        setValidacaoPrecoErro(null);
        return;
      }

      lastEditSourceRef.current = "DISCOUNT_INPUT";

      const gate = validarDescontoPromocionalContraMinimo({
        baseBrl: precoBaseBrl,
        ceilingBrl: precoTetoBrl,
        discountRaw: trimmed,
        initialDiscountPercentDec,
        initialDiscountPercentDisplay,
      });

      if (!gate.ok) {
        setValidacaoPrecoErro(gate.error ?? "Informe um percentual válido.");
        lastEditSourceRef.current = null;
        return;
      }

      if (gate.priceBrl != null) {
        aplicarPrecoValido(gate.priceBrl);
      }
      lastEditSourceRef.current = null;
    },
    [
      precoBaseBrl,
      precoTetoBrl,
      initialDiscountPercentDec,
      initialDiscountPercentDisplay,
      aplicarPrecoValido,
    ],
  );

  const recomputarPosicao = useCallback(() => {
    const anchorEl = anchorRef.current;
    if (anchorEl == null) return;
    const r = anchorEl.getBoundingClientRect();
    const panel = document.querySelector(".pricing-intelligence-modal__panel");
    const estilosPainel = panel != null ? getComputedStyle(panel) : null;
    const gap = Number.parseFloat(estilosPainel?.getPropertyValue("--s7-pi-edit-popover-gap-acima-linha") ?? "") || 6;
    const deslocamentoBaixo =
      Number.parseFloat(estilosPainel?.getPropertyValue("--s7-pi-edit-popover-deslocamento-baixo") ?? "") || 8;
    let bottom = window.innerHeight - r.bottom + gap - deslocamentoBaixo;

    const cardEl = anchorEl.closest(".pricing-intelligence-page__promotion-mini-card");
    const cardRect = cardEl?.getBoundingClientRect();
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
    if (!isOpen) {
      lastEditSourceRef.current = null;
      return undefined;
    }
    recomputarPosicao();
    const id = requestAnimationFrame(recomputarPosicao);
    window.addEventListener("scroll", recomputarPosicao, true);
    window.addEventListener("resize", recomputarPosicao);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", recomputarPosicao, true);
      window.removeEventListener("resize", recomputarPosicao);
    };
  }, [isOpen, recomputarPosicao, precoVendaNum, descontoPctNum]);

  if (!showPencil) return null;

  return (
    <>
      <span
        ref={anchorRef}
        className="pricing-intelligence-page__promotion-mini-card-finance-pencil"
      >
        <PromotionMiniCardPencilButton
          ariaLabel="Editar preço de venda para simulação"
          tooltip={pencilEnabled ? tooltip : null}
          active={isOpen}
          disabled={!pencilEnabled}
          onClick={(event) => {
            event.stopPropagation();
            if (!pencilEnabled || isOpen) return;
            setValidacaoPrecoErro(null);
            lastEditSourceRef.current = null;
            onOpen();
          }}
        />
      </span>
      {isOpen && coords != null
        ? createPortal(
            <div
              ref={popoverRef}
              className="pricing-scenario-edit-popover__portal pricing-scenario-edit-popover__portal--promotion-mini-card"
              style={{ left: `${coords.left}px`, bottom: `${coords.bottom}px` }}
              data-promotion-selection-id={selectionId}
            >
              <PricingScenarioEditPopover
                scenarioType="promotion"
                title="PROMOÇÃO"
                primaryLabel="Preço de venda"
                secondaryLabel="Desconto"
                secondaryLabelTooltip={PROMO_DESCONTO_PERCENTUAL_EXATO_TOOLTIP}
                secondaryReadOnly={false}
                secondaryEmptyLabel=""
                precoVendaNum={precoVendaNum}
                precoSliderMin={limitesSlider.min}
                precoSliderMax={limitesSlider.max}
                sliderMode="promotion-discount"
                sliderHabilitado={sliderHabilitado}
                stepperMaisDesabilitado={limitesSlider.noTeto === true}
                stepperMenosDesabilitado={limitesSlider.noPiso === true}
                validacaoPrecoErro={validacaoPrecoErro}
                onPrecoVendaChange={(num) => handlePrecoVendaChange(num, "PRICE_INPUT")}
                margemPctNum={descontoPctNum}
                onMargemPctTextoChange={handleDescontoPctTextoChange}
                closeAriaLabel="Fechar ajuste da promoção"
                stepperMinusAriaLabel="Diminuir preço de venda"
                stepperPlusAriaLabel="Aumentar preço de venda"
                sliderAriaLabel="Ajustar preço de venda"
                onClose={onClose}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
