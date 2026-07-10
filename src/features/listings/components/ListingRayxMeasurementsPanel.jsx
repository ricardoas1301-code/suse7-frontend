import {
  formatCmInput,
  formatKgInput,
  measureDecimalOnKeyDown,
} from "../rayx/listingMeasurementsDraft.js";
import "../../../components/ProductForm.css";
import "./ListingRayxMeasurementsPanel.css";

/**
 * @param {{
 *   label: string;
 *   kind: "cm" | "kg";
 *   value: string;
 *   onChange: (value: string) => void;
 * }} props
 */
function ListingMeasureField({ label, kind, value, onChange }) {
  const isKg = kind === "kg";
  return (
    <div className="pf-group">
      <label className="s7-label">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="s7-input pf-dimension-input"
        placeholder={isKg ? "Ex: 8,450" : "Ex: 10,00"}
        value={value}
        onChange={(event) =>
          onChange(isKg ? formatKgInput(event.target.value) : formatCmInput(event.target.value))
        }
        onKeyDown={measureDecimalOnKeyDown}
        onWheel={(event) => event.target.blur()}
      />
    </div>
  );
}

/**
 * @param {{
 *   draft: {
 *     shipping: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *     product_mounted: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *   };
 *   onChange: (nextDraft: {
 *     shipping: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *     product_mounted: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *   }) => void;
 * }} props
 */
export default function ListingRayxMeasurementsPanel({ draft, onChange }) {
  const patchBlock = (blockKey, fieldKey, value) => {
    onChange({
      ...draft,
      [blockKey]: {
        ...draft[blockKey],
        [fieldKey]: value,
      },
    });
  };

  return (
    <div className="listing-rayx-measurements">
      <div className="s7-card pf-dimensions-card">
        <div className="s7-card__header">
          <h3 className="s7-card__title">Medidas de envio</h3>
          <p className="s7-card__subtitle">Medidas usadas para cálculo de frete e logística.</p>
        </div>

        <div className="pf-row pf-dimensions-grid">
          <ListingMeasureField
            label="Largura (cm)"
            kind="cm"
            value={draft.shipping.width_cm}
            onChange={(value) => patchBlock("shipping", "width_cm", value)}
          />
          <ListingMeasureField
            label="Altura (cm)"
            kind="cm"
            value={draft.shipping.height_cm}
            onChange={(value) => patchBlock("shipping", "height_cm", value)}
          />
          <ListingMeasureField
            label="Comprimento (cm)"
            kind="cm"
            value={draft.shipping.length_cm}
            onChange={(value) => patchBlock("shipping", "length_cm", value)}
          />
          <ListingMeasureField
            label="Peso (kg)"
            kind="kg"
            value={draft.shipping.weight_kg}
            onChange={(value) => patchBlock("shipping", "weight_kg", value)}
          />
        </div>
      </div>

      <div className="s7-card pf-dimensions-card listing-rayx-measurements__card-spaced">
        <div className="s7-card__header">
          <h3 className="s7-card__title">Medidas do produto (montado)</h3>
          <p className="s7-card__subtitle">Medidas reais do produto pronto/montado (referência interna).</p>
        </div>

        <div className="pf-row pf-dimensions-grid">
          <ListingMeasureField
            label="Largura (cm)"
            kind="cm"
            value={draft.product_mounted.width_cm}
            onChange={(value) => patchBlock("product_mounted", "width_cm", value)}
          />
          <ListingMeasureField
            label="Altura (cm)"
            kind="cm"
            value={draft.product_mounted.height_cm}
            onChange={(value) => patchBlock("product_mounted", "height_cm", value)}
          />
          <ListingMeasureField
            label="Comprimento (cm)"
            kind="cm"
            value={draft.product_mounted.length_cm}
            onChange={(value) => patchBlock("product_mounted", "length_cm", value)}
          />
          <ListingMeasureField
            label="Peso (kg)"
            kind="kg"
            value={draft.product_mounted.weight_kg}
            onChange={(value) => patchBlock("product_mounted", "weight_kg", value)}
          />
        </div>
      </div>
    </div>
  );
}
