// ======================================================
// PI — Input local de preço manual para simulação (aba Promoções Beta).
// ======================================================

import { useCallback, useEffect, useState } from "react";

import {
  formatarDecimalBrlExibicao,
  PROMOTION_MANUAL_CTA_SIMULAR,
  PROMOTION_MANUAL_INPUT_LABEL,
  PROMOTION_MANUAL_INPUT_PLACEHOLDER,
  PROMOTION_MANUAL_PRICE_INVALID_MSG,
  validarPrecoManualSimulacao,
} from "../../features/pricing/promotions/promotionManualSimulationPrice.js";

/**
 * @param {{
 *   selectionId: string;
 *   initialPriceBrl?: string | null;
 *   onSimular: (selectionId: string, priceBrl: string) => void;
 *   compact?: boolean;
 * }} props
 */
export function PromotionMiniCardManualPriceField({
  selectionId,
  initialPriceBrl = null,
  onSimular,
  compact = false,
}) {
  const [draft, setDraft] = useState("");
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (initialPriceBrl != null && String(initialPriceBrl).trim() !== "") {
      const exibicao = formatarDecimalBrlExibicao(initialPriceBrl);
      setDraft(exibicao != null ? exibicao.replace(/\s/g, " ") : "");
    } else {
      setDraft("");
    }
    setErro(null);
  }, [selectionId, initialPriceBrl]);

  const executarSimular = useCallback(() => {
    const resultado = validarPrecoManualSimulacao(draft);
    if (!resultado.ok) {
      setErro(resultado.error ?? PROMOTION_MANUAL_PRICE_INVALID_MSG);
      return;
    }
    setErro(null);
    onSimular(selectionId, resultado.priceBrl);
  }, [draft, onSimular, selectionId]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        executarSimular();
      }
    },
    [executarSimular],
  );

  return (
    <div
      className={[
        "pricing-intelligence-page__promotion-mini-card-manual",
        compact ? "pricing-intelligence-page__promotion-mini-card-manual--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label
        className="pricing-intelligence-page__promotion-mini-card-manual-label"
        htmlFor={`promo-manual-price-${selectionId}`}
      >
        {PROMOTION_MANUAL_INPUT_LABEL}
      </label>
      <div className="pricing-intelligence-page__promotion-mini-card-manual-row">
        <input
          id={`promo-manual-price-${selectionId}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="pricing-intelligence-page__promotion-mini-card-manual-input"
          placeholder={PROMOTION_MANUAL_INPUT_PLACEHOLDER}
          value={draft}
          aria-invalid={erro != null ? "true" : undefined}
          aria-describedby={erro != null ? `promo-manual-price-error-${selectionId}` : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            if (erro != null) setErro(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="pricing-intelligence-page__promotion-mini-card-manual-action"
          onClick={(event) => {
            event.stopPropagation();
            executarSimular();
          }}
        >
          {PROMOTION_MANUAL_CTA_SIMULAR}
        </button>
      </div>
      {erro ? (
        <p
          id={`promo-manual-price-error-${selectionId}`}
          className="pricing-intelligence-page__promotion-mini-card-manual-error"
          role="alert"
        >
          {erro}
        </p>
      ) : null}
    </div>
  );
}
