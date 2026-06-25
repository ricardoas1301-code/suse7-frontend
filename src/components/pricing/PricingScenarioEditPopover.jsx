// ======================================================
// Popover flutuante de simulação por card (Clássico/Premium).
// Apenas UI + callbacks: preço de venda, margem desejada e stepper ± preço.
// Fecha somente pelo X (não fecha ao clicar fora).
// ======================================================

/** Incremento padrão do preço de venda por clique (R$). */
const PRECO_STEP_BRL = 1;

import S7Icon from "../ui/S7Icon.jsx";
import S7MoneyDigitsInput from "../ui/S7MoneyDigitsInput.jsx";
import { PricingPercentInput } from "./PricingPercentInput.jsx";
import {
  formatarMargemSignedExibicao,
  formatarPercentualParaInput,
} from "./pricingPercentInputUi.js";

/**
 * @param {{
 *   scenarioType: "classic" | "premium" | string;
 *   title?: string | null;
 *   precoVendaNum?: number | null;
 *   precoSliderMin?: number;
 *   precoSliderMax?: number;
 *   onPrecoVendaChange?: (v: number) => void;
 *   margemPctNum?: number | null;
 *   margemEspelhaResultado?: boolean;
 *   onMargemPctTextoChange?: (raw: string) => void;
 *   onIniciarEdicaoMargem?: () => void;
 *   loading?: boolean;
 *   erro?: string | null;
 *   onClose: () => void;
 * }} props
 */
export function PricingScenarioEditPopover({
  scenarioType,
  title = null,
  precoVendaNum = null,
  precoSliderMin = 1,
  precoSliderMax = 1000,
  onPrecoVendaChange,
  margemPctNum = null,
  margemEspelhaResultado = false,
  onMargemPctTextoChange,
  onIniciarEdicaoMargem,
  loading = false,
  erro = null,
  onClose,
}) {
  const inputBaseId = `pricing-scenario-edit-${scenarioType}`;

  const precoValorInput =
    precoVendaNum != null && Number.isFinite(precoVendaNum) ? precoVendaNum : null;
  const margemNegativaEspelhada =
    margemEspelhaResultado &&
    margemPctNum != null &&
    Number.isFinite(margemPctNum) &&
    margemPctNum < 0;
  const margemFormatada = formatarPercentualParaInput(
    margemPctNum != null && Number.isFinite(margemPctNum) ? margemPctNum.toFixed(2) : "",
  );
  const margemSignedExibicao = formatarMargemSignedExibicao(margemPctNum);

  const precoBase =
    precoVendaNum != null && Number.isFinite(precoVendaNum) ? precoVendaNum : precoSliderMin;
  const ajustarPreco = (/** @type {number} */ delta) => {
    onPrecoVendaChange?.(precoBase + delta);
  };
  const sliderPrecoValor = Math.min(precoSliderMax, Math.max(precoSliderMin, precoBase));

  const tituloPopover =
    title != null && String(title).trim() !== "" ? String(title).trim() : "Simular preço";

  return (
    <div
      className="pricing-scenario-edit-popover"
      role="dialog"
      aria-label={`Simulação independente — ${tituloPopover}`}
      data-scenario-type={scenarioType}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pricing-scenario-edit-popover__head">
        <div className="pricing-scenario-edit-popover__head-main">
          <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill pricing-scenario-edit-popover__pill">
            {tituloPopover}
          </span>
          {loading ? (
            <span
              className="pricing-scenario-edit-popover__loading"
              role="status"
              aria-label="Recalculando no Mercado Livre"
              title="Recalculando no Mercado Livre…"
            />
          ) : null}
        </div>
        <button
          type="button"
          className="pricing-scenario-edit-popover__close"
          onClick={onClose}
          aria-label="Fechar simulação"
        >
          <S7Icon name="close" size={13} strokeWidth={2.2} />
        </button>
      </div>

      <div className="pricing-scenario-edit-popover__body">
        <div className="pricing-scenario-edit-popover__block">
          <S7MoneyDigitsInput
            id={`${inputBaseId}-sale`}
            name={`${inputBaseId}-sale`}
            label="Preço de venda"
            value={precoValorInput}
            onChange={(num) => {
              if (num != null && Number.isFinite(num)) onPrecoVendaChange?.(num);
            }}
            placeholder="R$ 0,00"
            className="pricing-scenario-edit-popover__input"
            fieldClassName="pricing-scenario-edit-popover__sale-field"
            aria-label="Preço de venda"
          />
        </div>

        <div className="pricing-scenario-edit-popover__block pricing-scenario-edit-popover__block--margin">
          <div className="s7-input__wrapper pricing-scenario-edit-popover__field-stack">
            <label
              className="s7-input__label pricing-scenario-edit-popover__field-label"
              htmlFor={`${inputBaseId}-margin`}
            >
              Margem desejada
            </label>
            <div className="s7-input__control pricing-scenario-edit-popover__margin-control">
              {margemNegativaEspelhada ? (
                <div className="s7-percent-digits-input pricing-scenario-edit-popover__margin-signed-wrap">
                  <input
                    id={`${inputBaseId}-margin`}
                    name={`${inputBaseId}-margin`}
                    type="text"
                    readOnly
                    className="s7-percent-digits-input__field pricing-scenario-edit-popover__margin-signed"
                    value={margemSignedExibicao}
                    aria-label="Margem desejada (resultado do preço atual)"
                    onFocus={() => onIniciarEdicaoMargem?.()}
                    onClick={() => onIniciarEdicaoMargem?.()}
                  />
                  <span className="s7-percent-digits-input__suffix" aria-hidden="true">
                    %
                  </span>
                </div>
              ) : (
                <PricingPercentInput
                  id={`${inputBaseId}-margin`}
                  name={`${inputBaseId}-margin`}
                  value={margemFormatada}
                  onChange={(next) => onMargemPctTextoChange?.(next)}
                  aria-label="Margem desejada"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-scenario-edit-popover__stepper">
        <button
          type="button"
          className="pricing-scenario-edit-popover__step pricing-scenario-edit-popover__step--minus"
          onClick={() => ajustarPreco(-PRECO_STEP_BRL)}
          aria-label="Diminuir preço de venda"
        >
          &minus;
        </button>
        <input
          type="range"
          className="pricing-scenario-edit-popover__slider"
          min={precoSliderMin}
          max={precoSliderMax}
          step={0.01}
          value={sliderPrecoValor}
          onChange={(e) => onPrecoVendaChange?.(Number(e.target.value))}
          aria-label="Ajustar preço de venda"
        />
        <button
          type="button"
          className="pricing-scenario-edit-popover__step pricing-scenario-edit-popover__step--plus"
          onClick={() => ajustarPreco(PRECO_STEP_BRL)}
          aria-label="Aumentar preço de venda"
        >
          +
        </button>
      </div>

      {erro != null && String(erro).trim() !== "" ? (
        <p className="pricing-scenario-edit-popover__notice" role="status">
          Mantendo o último cálculo oficial — não foi possível atualizar agora.
        </p>
      ) : null}

      <span className="pricing-scenario-edit-popover__arrow" aria-hidden="true" />
    </div>
  );
}
