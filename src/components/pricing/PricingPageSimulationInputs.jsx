// ======================================================
// Precificação Inteligente (página) — bloco "Simulação de preço".
// Estado controlado pelo pai; sem cálculo financeiro local.
// Campos opcionais reservados para parâmetros futuros de simulação no backend.
// ======================================================

import { useCallback, useState } from "react";
import S7Button from "../ui/S7Button.jsx";
import S7Input from "../ui/S7Input.jsx";
import S7Icon from "../ui/S7Icon.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";

/**
 * @param {{
 *   salePrice: string;
 *   onSalePriceChange: (v: string) => void;
 *   desiredMarginPct: string;
 *   onDesiredMarginPctChange: (v: string) => void;
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
 * }} props
 */
export function PricingPageSimulationInputs({
  salePrice,
  onSalePriceChange,
  desiredMarginPct,
  onDesiredMarginPctChange,
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
}) {
  // ======================================================
  // Labels opcionais editáveis (estado local).
  // Fallback para rótulo padrão quando valor ficar vazio.
  // ======================================================
  const defaultOptionalLabels = {
    plannedPromo: "Desc. / promo",
    mlAds: "ML Ads",
    affiliates: "Afiliados",
    reserve: "Reserva",
  };
  const [optionalLabels, setOptionalLabels] = useState(defaultOptionalLabels);
  const [editingFieldKey, setEditingFieldKey] = useState(/** @type {"plannedPromo" | "mlAds" | "affiliates" | "reserve" | null} */ (null));
  const [editingDraft, setEditingDraft] = useState("");

  const FIELD_EDIT_TOOLTIP =
    "Personalize este campo para representar um desconto, custo adicional ou KPI interno da sua operação. Quando ativado, o percentual informado será considerado na precificação.";

  // ======================================================
  // Sanitização de percentual (apenas inteiros 0-9).
  // Não faz cálculo; apenas valida entrada visual.
  // ======================================================
  const sanitizePercentInput = useCallback((raw) => {
    const s = String(raw ?? "").replace(/[^\d,.]/g, "");
    const normalized = s.replace(",", ".");
    const parts = normalized.split(".");
    if (parts.length <= 1) return s.replace(".", ",");
    return `${parts[0].replace(".", ",")},${parts.slice(1).join("")}`;
  }, []);
  const percentSuffix = <span className="pricing-intelligence-page__simulation-price__percent-suffix">%</span>;

  // ======================================================
  // Toggle de campo opcional: liga/desliga e deixa o input
  // habilitado somente quando ativo.
  // ======================================================
  const OptionalToggle = ({ id, enabled, onToggle, label }) => (
    <button
      type="button"
      id={id}
      className={[
        "pricing-intelligence-page__simulation-price__toggle",
        enabled ? "pricing-intelligence-page__simulation-price__toggle--on" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      aria-label={enabled ? `Desativar ${label}` : `Ativar ${label}`}
    >
      <span className="pricing-intelligence-page__simulation-price__toggle-knob" aria-hidden="true" />
      <span className="pricing-intelligence-page__simulation-price__toggle-text">{enabled ? "On" : "Off"}</span>
    </button>
  );

  // ======================================================
  // Fluxo de edição de label (Enter/blur confirma; Esc cancela).
  // ======================================================
  const beginEditOptionalLabel = useCallback(
    (fieldKey) => {
      const current = optionalLabels[fieldKey] ?? defaultOptionalLabels[fieldKey];
      setEditingFieldKey(fieldKey);
      setEditingDraft(String(current));
    },
    [optionalLabels],
  );

  const commitOptionalLabelEdit = useCallback(() => {
    if (editingFieldKey == null) return;
    const fallback = defaultOptionalLabels[editingFieldKey];
    const next = String(editingDraft ?? "").trim();
    setOptionalLabels((prev) => ({
      ...prev,
      [editingFieldKey]: next !== "" ? next : fallback,
    }));
    setEditingFieldKey(null);
    setEditingDraft("");
  }, [editingFieldKey, editingDraft]);

  const cancelOptionalLabelEdit = useCallback(() => {
    setEditingFieldKey(null);
    setEditingDraft("");
  }, []);

  // ======================================================
  // Label opcional com ícone de lápis (preparo para edição
  // de nomenclatura por seller no futuro).
  // ======================================================
  const OptionalLabel = ({ fieldKey, text }) => (
    <span className="pricing-intelligence-page__simulation-price__optional-label-wrap">
      {editingFieldKey === fieldKey ? (
        <input
          type="text"
          className="pricing-intelligence-page__simulation-price__optional-label-input"
          value={editingDraft}
          onChange={(e) => setEditingDraft(e.target.value)}
          onBlur={commitOptionalLabelEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitOptionalLabelEdit();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelOptionalLabelEdit();
            }
          }}
          autoFocus
          aria-label={`Editar nome do campo ${text}`}
        />
      ) : (
        <span className="pricing-intelligence-page__simulation-price__optional-label">{text}</span>
      )}
      <S7Tooltip content={FIELD_EDIT_TOOLTIP} placement="bottom-start" offset={6} wrap>
        <button
          type="button"
          className="pricing-intelligence-page__simulation-price__optional-edit"
          aria-label={`Personalizar nome do campo ${text}`}
          onClick={() => beginEditOptionalLabel(fieldKey)}
        >
          <S7Icon name="edit" size={12} strokeWidth={2} />
        </button>
      </S7Tooltip>
    </span>
  );

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
        {mode === "promotions" ? "Promoção" : "Precificação do produto"}
      </h3>
      <div className="pricing-intelligence-page__simulation-price__grid">
        {mode === "promotions" ? (
          // ======================================================
          // Promoções: apenas desconto promocional (UI preparada).
          // Sem simulação completa de preço nesta aba.
          // ======================================================
          <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--promotion-only">
            <S7Input
              label="Desconto da promoção"
              name="pricing-page-sim-promo"
              value={plannedPromoPct}
              onChange={(e) => onPlannedPromoPctChange(sanitizePercentInput(e.target.value))}
              placeholder="0"
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
              rightElement={percentSuffix}
              className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--promotion"
              hint="Preparado para habilitação por contrato do marketplace."
            />
          </div>
        ) : (
          <>
            {/* Linha 1: preço + margem na horizontal (sem aumentar o card). */}
            <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--sale">
              <S7Input
                label="Preço de venda (R$)"
                name="pricing-page-sim-sale-price"
                value={salePrice}
                onChange={(e) => onSalePriceChange(e.target.value)}
                placeholder="0,00"
                autoComplete="off"
                inputMode="decimal"
                className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--primary"
              />
            </div>
            <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--margin">
              <S7Input
                label="Margem desejada"
                name="pricing-page-sim-margin"
                value={desiredMarginPct}
                onChange={(e) => onDesiredMarginPctChange(sanitizePercentInput(e.target.value))}
                placeholder="0"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                rightElement={percentSuffix}
                className="pricing-intelligence-page__simulation-price__input"
              />
            </div>
            {/* Linha 2: opcionais em uma única linha (4 colunas). */}
            <div className="pricing-intelligence-page__simulation-price__optional-row">
              <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--optional">
                <div className="pricing-intelligence-page__simulation-price__optional-head">
                  <OptionalLabel fieldKey="plannedPromo" text={optionalLabels.plannedPromo} />
                </div>
                <div className="pricing-intelligence-page__simulation-price__optional-control">
                  <S7Input
                    label=""
                    name="pricing-page-sim-promo"
                    value={plannedPromoPct}
                    onChange={(e) => onPlannedPromoPctChange(sanitizePercentInput(e.target.value))}
                    placeholder="0"
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    rightElement={percentSuffix}
                    className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--optional"
                    disabled={!plannedPromoEnabled}
                  />
                  <OptionalToggle
                    id="pricing-page-sim-toggle-promo"
                    label="desconto/promo"
                    enabled={plannedPromoEnabled}
                    onToggle={onPlannedPromoEnabledChange}
                  />
                </div>
              </div>

              <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--optional">
                <div className="pricing-intelligence-page__simulation-price__optional-head">
                  <OptionalLabel fieldKey="mlAds" text={optionalLabels.mlAds} />
                </div>
                <div className="pricing-intelligence-page__simulation-price__optional-control">
                  <S7Input
                    label=""
                    name="pricing-page-sim-ml-ads"
                    value={mlAdsPct}
                    onChange={(e) => onMlAdsPctChange(sanitizePercentInput(e.target.value))}
                    placeholder="0"
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    rightElement={percentSuffix}
                    className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--optional"
                    disabled={!mlAdsEnabled}
                  />
                  <OptionalToggle
                    id="pricing-page-sim-toggle-ml-ads"
                    label="ML Ads"
                    enabled={mlAdsEnabled}
                    onToggle={onMlAdsEnabledChange}
                  />
                </div>
              </div>

              <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--optional">
                <div className="pricing-intelligence-page__simulation-price__optional-head">
                  <OptionalLabel fieldKey="affiliates" text={optionalLabels.affiliates} />
                </div>
                <div className="pricing-intelligence-page__simulation-price__optional-control">
                  <S7Input
                    label=""
                    name="pricing-page-sim-affiliates"
                    value={affiliatesPct}
                    onChange={(e) => onAffiliatesPctChange(sanitizePercentInput(e.target.value))}
                    placeholder="0"
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    rightElement={percentSuffix}
                    className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--optional"
                    disabled={!affiliatesEnabled}
                  />
                  <OptionalToggle
                    id="pricing-page-sim-toggle-affiliates"
                    label="afiliados"
                    enabled={affiliatesEnabled}
                    onToggle={onAffiliatesEnabledChange}
                  />
                </div>
              </div>

              <div className="pricing-intelligence-page__simulation-price__cell pricing-intelligence-page__simulation-price__cell--optional">
                <div className="pricing-intelligence-page__simulation-price__optional-head">
                  <OptionalLabel fieldKey="reserve" text={optionalLabels.reserve} />
                </div>
                <div className="pricing-intelligence-page__simulation-price__optional-control">
                  <S7Input
                    label=""
                    name="pricing-page-sim-reserve"
                    value={safetyReservePct}
                    onChange={(e) => onSafetyReservePctChange(sanitizePercentInput(e.target.value))}
                    placeholder="0"
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    rightElement={percentSuffix}
                    className="pricing-intelligence-page__simulation-price__input pricing-intelligence-page__simulation-price__input--optional"
                    disabled={!safetyReserveEnabled}
                  />
                  <OptionalToggle
                    id="pricing-page-sim-toggle-reserve"
                    label="reserva"
                    enabled={safetyReserveEnabled}
                    onToggle={onSafetyReserveEnabledChange}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {mode === "simulator" && onSaveFinancialSettings ? (
        <div className="pricing-intelligence-page__simulation-price__actions">
          <S7Button
            type="button"
            variant="primary"
            size="sm"
            loading={saveFinancialSettingsLoading}
            disabled={saveFinancialSettingsLoading}
            onClick={onSaveFinancialSettings}
          >
            Salvar configurações
          </S7Button>
        </div>
      ) : null}
    </section>
  );
}
