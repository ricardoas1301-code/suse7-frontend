// ======================================================
// Popover flutuante de simulação por card (Clássico/Premium).
// Apenas UI + callbacks: preço de venda, margem desejada e stepper ± preço.
// Fecha somente pelo X (não fecha ao clicar fora).
// ======================================================

/** Incremento padrão do preço de venda por clique (R$). */
const PRECO_STEP_BRL = 1;

import S7Icon from "../ui/S7Icon.jsx";
import S7MoneyDigitsInput from "../ui/S7MoneyDigitsInput.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import { PricingPercentInput } from "./PricingPercentInput.jsx";
import {
  formatarMargemSignedExibicao,
  formatarPercentualParaInput,
} from "./pricingPercentInputUi.js";

/**
 * @param {{
 *   scenarioType: "classic" | "premium" | "promotion" | string;
 *   title?: string | null;
 *   primaryLabel?: string;
 *   secondaryLabel?: string;
 *   secondaryLabelTooltip?: string | null;
 *   secondaryReadOnly?: boolean;
 *   secondaryEmptyLabel?: string;
 *   precoVendaNum?: number | null;
 *   precoSliderMin?: number;
 *   precoSliderMax?: number;
 *   sliderMode?: "absolute" | "centered-offset" | "promotion-discount";
 *   sliderOffset?: number;
 *   sliderOffsetMin?: number;
 *   sliderOffsetMax?: number;
 *   onSliderOffsetChange?: (offset: number) => void;
 *   stepperMaisDesabilitado?: boolean;
 *   stepperMenosDesabilitado?: boolean;
 *   validacaoPrecoErro?: string | null;
 *   sliderHabilitado?: boolean;
 *   onPrecoVendaChange?: (v: number) => void;
 *   margemPctNum?: number | null;
 *   margemEspelhaResultado?: boolean;
 *   onMargemPctTextoChange?: (raw: string) => void;
 *   onIniciarEdicaoMargem?: () => void;
 *   loading?: boolean;
 *   erro?: string | null;
 *   closeAriaLabel?: string;
 *   stepperMinusAriaLabel?: string;
 *   stepperPlusAriaLabel?: string;
 *   sliderAriaLabel?: string;
 *   onClose: () => void;
 * }} props
 */
export function PricingScenarioEditPopover({
  scenarioType,
  title = null,
  primaryLabel = "Preço de venda",
  secondaryLabel = "Margem desejada",
  secondaryLabelTooltip = null,
  secondaryReadOnly = false,
  secondaryEmptyLabel = "—",
  precoVendaNum = null,
  precoSliderMin = 1,
  precoSliderMax = 1000,
  sliderMode = "absolute",
  sliderOffset = 0,
  sliderOffsetMin = 0,
  sliderOffsetMax = 0,
  onSliderOffsetChange,
  stepperMaisDesabilitado = false,
  stepperMenosDesabilitado = false,
  validacaoPrecoErro = null,
  sliderHabilitado = true,
  onPrecoVendaChange,
  margemPctNum = null,
  margemEspelhaResultado = false,
  onMargemPctTextoChange,
  onIniciarEdicaoMargem,
  loading = false,
  erro = null,
  closeAriaLabel = "Fechar simulação",
  stepperMinusAriaLabel = "Diminuir preço de venda",
  stepperPlusAriaLabel = "Aumentar preço de venda",
  sliderAriaLabel = "Ajustar preço de venda",
  onClose,
}) {
  const inputBaseId = `pricing-scenario-edit-${scenarioType}`;

  const precoValorInput =
    precoVendaNum != null && Number.isFinite(precoVendaNum) ? precoVendaNum : null;
  const margemNegativaEspelhada =
    !secondaryReadOnly &&
    margemEspelhaResultado &&
    margemPctNum != null &&
    Number.isFinite(margemPctNum) &&
    margemPctNum < 0;
  const margemFormatada = formatarPercentualParaInput(
    margemPctNum != null && Number.isFinite(margemPctNum) ? margemPctNum.toFixed(2) : "",
  );
  const secondarySomenteLeitura = secondaryReadOnly || margemNegativaEspelhada;
  const secondaryTemValor = margemPctNum != null && Number.isFinite(margemPctNum);
  const secondaryExibicao = secondaryTemValor
    ? secondaryReadOnly
      ? formatarPercentualParaInput(Number(margemPctNum).toFixed(2))
      : margemNegativaEspelhada
        ? formatarMargemSignedExibicao(margemPctNum)
        : margemFormatada
    : secondaryEmptyLabel;

  const modoOffsetCentral = sliderMode === "centered-offset";
  const modoPromocaoDesconto = sliderMode === "promotion-discount";
  const precoBase =
    precoVendaNum != null && Number.isFinite(precoVendaNum) ? precoVendaNum : precoSliderMin;
  const ajustarPreco = (/** @type {number} */ delta) => {
    if (modoOffsetCentral) {
      onSliderOffsetChange?.(sliderOffset + delta);
      return;
    }
    onPrecoVendaChange?.(precoBase + delta);
  };
  const sliderPrecoValor = modoOffsetCentral
    ? Math.min(sliderOffsetMax, Math.max(sliderOffsetMin, sliderOffset))
    : Math.min(precoSliderMax, Math.max(precoSliderMin, precoBase));
  const sliderMin = modoOffsetCentral ? sliderOffsetMin : precoSliderMin;
  const sliderMax = modoOffsetCentral ? sliderOffsetMax : precoSliderMax;
  const sliderStep = modoOffsetCentral || modoPromocaoDesconto ? 1 : 0.01;
  const maisDesabilitado = !sliderHabilitado || stepperMaisDesabilitado;
  const menosDesabilitado = !sliderHabilitado || stepperMenosDesabilitado;

  const tituloPopover =
    title != null && String(title).trim() !== "" ? String(title).trim() : "Simular preço";

  return (
    <div
      className={[
        "pricing-scenario-edit-popover",
        scenarioType === "promotion" ? "pricing-scenario-edit-popover--promotion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
          aria-label={closeAriaLabel}
        >
          <S7Icon name="close" size={13} strokeWidth={2.2} />
        </button>
      </div>

      {/*
        S4.3.6.19 — grid 2×2 canônico: labels na mesma linha, inputs na mesma linha.
        Evita desalinhamento causado por label+ícone mais alto na coluna Desconto.
      */}
      <div className="pricing-scenario-edit-popover__body pricing-scenario-edit-popover__fields-grid">
        <label
          className="s7-input__label pricing-scenario-edit-popover__field-label pricing-scenario-edit-popover__field-label--primary"
          htmlFor={`${inputBaseId}-sale`}
        >
          {primaryLabel}
        </label>

        <label
          className="s7-input__label pricing-scenario-edit-popover__field-label pricing-scenario-edit-popover__field-label--secondary"
          htmlFor={`${inputBaseId}-margin`}
        >
          <span className="pricing-scenario-edit-popover__secondary-label-row">
            <span>{secondaryLabel}</span>
            {secondaryLabelTooltip != null && String(secondaryLabelTooltip).trim() !== "" ? (
              <S7Tooltip content={secondaryLabelTooltip} placement="top-start" offset={8} wrap>
                <button
                  type="button"
                  className="pricing-intelligence-page__simulation-price__optional-info pricing-scenario-edit-popover__discount-info"
                  aria-label={`Informações sobre ${secondaryLabel}`}
                  onClick={(event) => event.preventDefault()}
                >
                  <S7Icon name="info" size={12} strokeWidth={2} />
                </button>
              </S7Tooltip>
            ) : null}
          </span>
        </label>

        <div className="pricing-scenario-edit-popover__field-control pricing-scenario-edit-popover__field-control--primary">
          <S7MoneyDigitsInput
            id={`${inputBaseId}-sale`}
            name={`${inputBaseId}-sale`}
            label=""
            value={precoValorInput}
            onChange={(num) => {
              if (num != null && Number.isFinite(num)) onPrecoVendaChange?.(num);
            }}
            placeholder="R$ 0,00"
            className="pricing-scenario-edit-popover__input"
            fieldClassName="pricing-scenario-edit-popover__sale-field"
            aria-label={primaryLabel}
          />
        </div>

        <div className="pricing-scenario-edit-popover__field-control pricing-scenario-edit-popover__field-control--secondary pricing-scenario-edit-popover__margin-control">
          {secondarySomenteLeitura ? (
            <div className="s7-percent-digits-input pricing-scenario-edit-popover__margin-signed-wrap">
              <input
                id={`${inputBaseId}-margin`}
                name={`${inputBaseId}-margin`}
                type="text"
                readOnly
                className="s7-percent-digits-input__field pricing-scenario-edit-popover__margin-signed"
                value={secondaryExibicao}
                aria-label={`${secondaryLabel} (derivado do preço atual)`}
                tabIndex={-1}
                onFocus={
                  !secondaryReadOnly
                    ? () => onIniciarEdicaoMargem?.()
                    : undefined
                }
                onClick={
                  !secondaryReadOnly
                    ? () => onIniciarEdicaoMargem?.()
                    : undefined
                }
              />
              {secondaryTemValor ? (
                <span className="s7-percent-digits-input__suffix" aria-hidden="true">
                  %
                </span>
              ) : null}
            </div>
          ) : (
            <PricingPercentInput
              id={`${inputBaseId}-margin`}
              name={`${inputBaseId}-margin`}
              value={margemFormatada}
              onChange={(next) => onMargemPctTextoChange?.(next)}
              aria-label={secondaryLabel}
            />
          )}
        </div>
      </div>

      <div className="pricing-scenario-edit-popover__stepper">
        <button
          type="button"
          className="pricing-scenario-edit-popover__step pricing-scenario-edit-popover__step--minus"
          onClick={() => ajustarPreco(-PRECO_STEP_BRL)}
          aria-label={stepperMinusAriaLabel}
          disabled={menosDesabilitado}
        >
          &minus;
        </button>
        <input
          type="range"
          className="pricing-scenario-edit-popover__slider"
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={sliderPrecoValor}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (modoOffsetCentral) onSliderOffsetChange?.(next);
            else onPrecoVendaChange?.(next);
          }}
          aria-label={sliderAriaLabel}
          disabled={!sliderHabilitado}
        />
        <button
          type="button"
          className="pricing-scenario-edit-popover__step pricing-scenario-edit-popover__step--plus"
          onClick={() => ajustarPreco(PRECO_STEP_BRL)}
          aria-label={stepperPlusAriaLabel}
          disabled={maisDesabilitado}
        >
          +
        </button>
      </div>

      {validacaoPrecoErro != null && String(validacaoPrecoErro).trim() !== "" ? (
        <p className="pricing-scenario-edit-popover__validation" role="alert">
          {validacaoPrecoErro}
        </p>
      ) : null}

      {erro != null && String(erro).trim() !== "" ? (
        <p className="pricing-scenario-edit-popover__notice" role="status">
          Mantendo o último cálculo oficial — não foi possível atualizar agora.
        </p>
      ) : null}

      <span className="pricing-scenario-edit-popover__arrow" aria-hidden="true" />
    </div>
  );
}
