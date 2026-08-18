// ======================================================
// Precificação Inteligente (página) — bloco "Precificação do produto".
// Centro de comando: preço de venda + margem desejada (campos e sliders).
// ======================================================

import { useEffect, useRef, useState } from "react";
import S7Input from "../ui/S7Input.jsx";
import S7Icon from "../ui/S7Icon.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import { PricingOptionalPercentInput } from "./PricingOptionalPercentInput.jsx";
import { PricingPercentInput } from "./PricingPercentInput.jsx";
import { formatarBrlExibicao } from "./pricingScenarioLocalSimulation.js";
import { formatarPercentualParaInput } from "./pricingPercentInputUi.js";
import {
  COMPANY_OPERATIONAL_COST_PI_LABEL,
  COMPANY_OPERATIONAL_COST_TOOLTIP,
} from "../../domain/costs/costSemanticsPresentation.js";

const SAFETY_MARGIN_TOOLTIP =
  "Defina uma margem mínima para proteger sua venda. Futuramente, o Suse7 poderá alertar ou agir quando taxas, frete ou custos deixarem o anúncio abaixo desse limite.";

const STRATEGIC_RESERVE_GROUP_TOOLTIP =
  "Margem de segurança programada para cenários como promoções e programas de afiliados.";

const OPERATIONAL_COSTS_GROUP_TOOLTIP =
  "Orçamento destinado a campanhas de tráfego (ML Ads) e ao custo operacional percentual da empresa vinculada ao anúncio.";

/**
 * @param {{ id: string; checked: boolean; onChange: (v: boolean) => void; label: string }} props
 */
function OptionalCheckbox({ id, checked, onChange, label }) {
  return (
    <label className="pricing-intelligence-page__simulation-price__checkbox" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="pricing-intelligence-page__simulation-price__checkbox-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={checked ? `Desativar ${label}` : `Ativar ${label}`}
      />
      <span className="pricing-intelligence-page__simulation-price__checkbox-mark" aria-hidden="true" />
    </label>
  );
}

/** @param {{ text: string }} props */
function OptionalLabel({ text }) {
  return <span className="pricing-intelligence-page__simulation-price__optional-label">{text}</span>;
}

/** @param {{ text: string; tooltip: string }} props */
function OptionalLabelWithInfo({ text, tooltip }) {
  return (
    <span className="pricing-intelligence-page__simulation-price__optional-label-wrap">
      <span className="pricing-intelligence-page__simulation-price__optional-label">{text}</span>
      <S7Tooltip content={tooltip} placement="bottom-start" offset={6} wrap>
        <button
          type="button"
          className="pricing-intelligence-page__simulation-price__optional-info"
          aria-label={`Informações sobre ${text}`}
        >
          <S7Icon name="info" size={12} strokeWidth={2} />
        </button>
      </S7Tooltip>
    </span>
  );
}

/**
 * @param {{
 *   title: string;
 *   tooltip: string;
 * }} props
 */
function ParamGroupHeading({ title, tooltip }) {
  return (
    <div className="pricing-intelligence-page__simulation-price__param-group-head">
      <span className="pricing-intelligence-page__simulation-price__param-group-title">{title}</span>
      <S7Tooltip content={tooltip} placement="bottom-start" offset={6} wrap>
        <button
          type="button"
          className="pricing-intelligence-page__simulation-price__optional-info"
          aria-label={`Informações sobre ${title}`}
        >
          <S7Icon name="info" size={12} strokeWidth={2} />
        </button>
      </S7Tooltip>
    </div>
  );
}

/**
 * @param {{
 *   id: string;
 *   label: import("react").ReactNode;
 *   value: string;
 *   onChange: (v: string) => void;
 *   enabled: boolean;
 *   onEnabledChange: (v: boolean) => void;
 *   ariaLabel: string;
 * }} props
 */
function ParametroOpcional({ id, label, value, onChange, enabled, onEnabledChange, ariaLabel }) {
  return (
    <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--optional">
      <div className="pricing-intelligence-page__simulation-price__optional-head">{label}</div>
      <div className="pricing-intelligence-page__simulation-price__optional-control">
        <PricingOptionalPercentInput id={id} name={id} value={value} onChange={onChange} disabled={!enabled} />
        <OptionalCheckbox id={`${id}-toggle`} checked={enabled} onChange={onEnabledChange} label={ariaLabel} />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   precoFormatado: string;
 *   onPrecoVendaTextoChange?: (raw: string) => void;
 * }} props
 */
function CommandSaleInput({ precoFormatado, onPrecoVendaTextoChange }) {
  const focadoRef = useRef(false);
  const [rascunho, setRascunho] = useState(precoFormatado);

  useEffect(() => {
    if (!focadoRef.current) {
      setRascunho(precoFormatado);
    }
  }, [precoFormatado]);

  return (
    <S7Input
      label="Preço de Venda"
      name="pricing-page-sim-sale-price"
      value={rascunho}
      onChange={(e) => {
        const next = e.target.value;
        setRascunho(next);
        onPrecoVendaTextoChange?.(next);
      }}
      onFocus={() => {
        focadoRef.current = true;
        setRascunho(precoFormatado);
      }}
      onBlur={() => {
        focadoRef.current = false;
        setRascunho(precoFormatado);
      }}
      placeholder="R$ 0,00"
      autoComplete="off"
      inputMode="decimal"
      className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--primary"
      inputClassName="pricing-intelligence-page__simulation-price__sale-field"
    />
  );
}

/**
 * @param {{
 *   margemFormatada: string;
 *   onMargemPctTextoChange?: (raw: string) => void;
 * }} props
 */
function CommandMarginInput({ margemFormatada, onMargemPctTextoChange }) {
  return (
    <div className="pricing-intelligence-page__simulation-price__margin-field">
      <label
        className="s7-input__label pricing-intelligence-page__simulation-price__margin-label"
        htmlFor="pricing-page-sim-margin"
      >
        Margem Desejada
      </label>
      <div className="pricing-intelligence-page__simulation-price__margin-control">
        <PricingPercentInput
          id="pricing-page-sim-margin"
          name="pricing-page-sim-margin"
          value={margemFormatada}
          onChange={(next) => onMargemPctTextoChange?.(next)}
          aria-label="Margem desejada"
        />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   plannedPromoPct: string;
 *   onPlannedPromoPctChange: (v: string) => void;
 *   plannedPromoEnabled: boolean;
 *   onPlannedPromoEnabledChange: (enabled: boolean) => void;
 *   mlAdsPct: string;
 *   onMlAdsPctChange: (v: string) => void;
 *   mlAdsEnabled: boolean;
 *   onMlAdsEnabledChange: (enabled: boolean) => void;
 *   affiliatesPct: string;
 *   onAffiliatesPctChange: (v: string) => void;
 *   affiliatesEnabled: boolean;
 *   onAffiliatesEnabledChange: (enabled: boolean) => void;
 *   safetyReservePct: string;
 *   onSafetyReservePctChange: (v: string) => void;
 *   safetyReserveEnabled: boolean;
 *   onSafetyReserveEnabledChange: (enabled: boolean) => void;
 *   onSaveFinancialSettings?: () => void;
 *   saveFinancialSettingsLoading?: boolean;
 *   mode?: "simulator" | "promotions";
 *   precoVendaNum?: number;
 *   onPrecoVendaChange?: (v: number) => void;
 *   onPrecoVendaTextoChange?: (raw: string) => void;
 *   precoSliderMin?: number;
 *   precoSliderMax?: number;
 *   margemPctNum?: number;
 *   onMargemPctChange?: (v: number) => void;
 *   onMargemPctTextoChange?: (raw: string) => void;
 *   margemSliderMax?: number;
 * }} props
 */
export function PricingPageSimulationInputs({
  plannedPromoPct,
  onPlannedPromoPctChange,
  plannedPromoEnabled,
  onPlannedPromoEnabledChange,
  mlAdsPct,
  onMlAdsPctChange,
  mlAdsEnabled,
  onMlAdsEnabledChange,
  affiliatesPct,
  onAffiliatesPctChange,
  affiliatesEnabled,
  onAffiliatesEnabledChange,
  safetyReservePct,
  onSafetyReservePctChange,
  safetyReserveEnabled,
  onSafetyReserveEnabledChange,
  onSaveFinancialSettings,
  saveFinancialSettingsLoading = false,
  mode = "simulator",
  precoVendaNum,
  onPrecoVendaChange,
  onPrecoVendaTextoChange,
  precoSliderMin = 1,
  precoSliderMax = 1000,
  margemPctNum = 0,
  onMargemPctChange,
  onMargemPctTextoChange,
  margemSliderMax = 60,
}) {
  const [safetyMarginPct, setSafetyMarginPct] = useState("");
  const [safetyMarginEnabled, setSafetyMarginEnabled] = useState(false);

  const precoFormatado =
    precoVendaNum != null && Number.isFinite(precoVendaNum)
      ? formatarBrlExibicao(precoVendaNum)
      : "—";
  const margemFormatada = formatarPercentualParaInput(
    margemPctNum != null && Number.isFinite(margemPctNum) ? margemPctNum.toFixed(2) : "",
  );

  const sliderPrecoValor =
    precoVendaNum != null && Number.isFinite(precoVendaNum)
      ? Math.min(precoSliderMax, Math.max(precoSliderMin, precoVendaNum))
      : precoSliderMin;
  const sliderMargemValor =
    margemPctNum != null && Number.isFinite(margemPctNum)
      ? Math.min(margemSliderMax, Math.max(0, margemPctNum))
      : 0;

  return (
    <section
      className={[
        "pricing-intelligence-page__simulation-price",
        mode === "promotions" ? "pricing-intelligence-page__simulation-price--promotions" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="pricing-intelligence-page-simulation-price-title"
    >
      <h3 className="pricing-intelligence-page__simulation-price__title" id="pricing-intelligence-page-simulation-price-title">
        {mode === "promotions" ? "Promoção" : "Ajustes de custo e reserva"}
      </h3>
      <div
        className={[
          "pricing-intelligence-page__simulation-price__grid",
          mode === "simulator" ? "pricing-intelligence-page__simulation-price__grid--config-only" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {mode === "promotions" ? (
          <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--promotion-only">
            <label className="s7-input__label" htmlFor="pricing-page-sim-promo-discount">
              Desconto da promoção
            </label>
            <PricingPercentInput
              id="pricing-page-sim-promo-discount"
              name="pricing-page-sim-promo"
              value={plannedPromoPct}
              onChange={onPlannedPromoPctChange}
              className="pricing-intelligence-page__simulation-price__promo-percent"
              fieldClassName="pricing-intelligence-page__simulation-price__promo-percent-field"
              aria-label="Desconto da promoção"
            />
            <p className="pricing-intelligence-page__simulation-price__promo-hint">
              Preparado para habilitação por contrato do marketplace.
            </p>
          </div>
        ) : (
          <>
            {typeof onPrecoVendaChange === "function" ? (
              <div className="pricing-intelligence-page__simulation-price__command">
                <div className="pricing-intelligence-page__simulation-price__command-block">
                  <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--sale">
                    <CommandSaleInput
                      precoFormatado={precoFormatado}
                      onPrecoVendaTextoChange={onPrecoVendaTextoChange}
                    />
                  </div>
                  <input
                    type="range"
                    className="pricing-intelligence-page__simulation-price__slider"
                    min={precoSliderMin}
                    max={precoSliderMax}
                    step={0.01}
                    value={sliderPrecoValor}
                    onChange={(e) => onPrecoVendaChange?.(Number(e.target.value))}
                    aria-label="Ajustar preço de venda"
                  />
                </div>
                <div className="pricing-intelligence-page__simulation-price__command-block">
                  <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--margin">
                    <CommandMarginInput
                      margemFormatada={margemFormatada}
                      onMargemPctTextoChange={onMargemPctTextoChange}
                    />
                  </div>
                  <input
                    type="range"
                    className="pricing-intelligence-page__simulation-price__slider"
                    min={0}
                    max={margemSliderMax}
                    step={0.01}
                    value={sliderMargemValor}
                    onChange={(e) => onMargemPctChange?.(Number(e.target.value))}
                    aria-label="Ajustar margem desejada"
                  />
                </div>
              </div>
            ) : null}

            <div className="pricing-intelligence-page__simulation-price__params-main pricing-intelligence-page__simulation-price__params-main--split">
              <div className="pricing-intelligence-page__simulation-price__param-group">
                <ParamGroupHeading title="Reserva Estratégica" tooltip={STRATEGIC_RESERVE_GROUP_TOOLTIP} />
                <div className="pricing-intelligence-page__simulation-price__optional-row pricing-intelligence-page__simulation-price__optional-row--pair">
                  <ParametroOpcional
                    id="pricing-page-sim-promo"
                    label={<OptionalLabel text="Promoção" />}
                    value={plannedPromoPct}
                    onChange={onPlannedPromoPctChange}
                    enabled={plannedPromoEnabled}
                    onEnabledChange={onPlannedPromoEnabledChange}
                    ariaLabel="promoção"
                  />
                  <ParametroOpcional
                    id="pricing-page-sim-affiliates"
                    label={<OptionalLabel text="Afiliados" />}
                    value={affiliatesPct}
                    onChange={onAffiliatesPctChange}
                    enabled={affiliatesEnabled}
                    onEnabledChange={onAffiliatesEnabledChange}
                    ariaLabel="afiliados"
                  />
                </div>
              </div>

              <div
                className="pricing-intelligence-page__simulation-price__param-divider pricing-intelligence-page__simulation-price__param-divider--vertical"
                role="separator"
                aria-orientation="vertical"
              />

              <div className="pricing-intelligence-page__simulation-price__param-group">
                <ParamGroupHeading title="Investimentos e Custos" tooltip={OPERATIONAL_COSTS_GROUP_TOOLTIP} />
                <div className="pricing-intelligence-page__simulation-price__optional-row pricing-intelligence-page__simulation-price__optional-row--pair">
                  <ParametroOpcional
                    id="pricing-page-sim-ml-ads"
                    label={<OptionalLabel text="ML Ads" />}
                    value={mlAdsPct}
                    onChange={onMlAdsPctChange}
                    enabled={mlAdsEnabled}
                    onEnabledChange={onMlAdsEnabledChange}
                    ariaLabel="ML Ads"
                  />
                  <ParametroOpcional
                    id="pricing-page-sim-reserve"
                    label={
                      <OptionalLabelWithInfo
                        text={COMPANY_OPERATIONAL_COST_PI_LABEL}
                        tooltip={COMPANY_OPERATIONAL_COST_TOOLTIP}
                      />
                    }
                    value={safetyReservePct}
                    onChange={onSafetyReservePctChange}
                    enabled={safetyReserveEnabled}
                    onEnabledChange={onSafetyReserveEnabledChange}
                    ariaLabel="custo operacional da empresa"
                  />
                </div>
              </div>
              {/* Margem de Segurança: ocultada temporariamente da UI.
                  Estado/lógica preservados (safetyMarginPct/safetyMarginEnabled)
                  para reativação futura na regra de preço mínimo/limite de segurança. */}
            </div>
          </>
        )}
      </div>
      {/* Botão "Salvar configurações" movido para baixo dos gráficos (UX),
          renderizado via footerSlot do PricingPageSalePriceSimulator. */}
    </section>
  );
}
