// ======================================================
// Percentual opcional — delega ao input homologado (máscara por dígitos).
// ======================================================

import S7PercentDigitsInput from "../ui/S7PercentDigitsInput.jsx";
import { MAX_DIGITOS_PERCENTUAL_SIMULACAO } from "../../utils/percentualDigitos.js";

/**
 * @param {{
 *   id: string;
 *   name?: string;
 *   value: string;
 *   onChange: (v: string) => void;
 *   disabled?: boolean;
 *   placeholder?: string;
 * }} props
 */
export function PricingOptionalPercentInput(props) {
  return (
    <S7PercentDigitsInput
      {...props}
      maxDigitos={MAX_DIGITOS_PERCENTUAL_SIMULACAO}
      className="pricing-optional-percent-input"
      fieldClassName="pricing-optional-percent-input__field"
    />
  );
}
