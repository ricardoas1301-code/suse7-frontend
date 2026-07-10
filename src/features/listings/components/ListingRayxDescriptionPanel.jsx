import "../../../components/ProductForm.css";
import "./ListingRayxDescriptionPanel.css";

/**
 * @param {{
 *   value?: string;
 *   onChange?: (value: string) => void;
 *   placeholder?: string;
 * }} props
 */
export default function ListingRayxDescriptionPanel({
  value = "",
  onChange,
  placeholder = "Descreva o anúncio...",
}) {
  return (
    <div className="listing-rayx-description-panel pf-description-section">
      <div className="pf-description-wrapper listing-rayx-description-panel__wrapper">
        <textarea
          id="listing-rayx-description-textarea"
          className="s7-input pf-description-textarea listing-rayx-description-panel__textarea"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          aria-label="Descrição do anúncio"
          spellCheck
        />
      </div>
    </div>
  );
}
