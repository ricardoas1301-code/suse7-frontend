// ======================================================
// Percentual opcional — delega ao input homologado (máscara por dígitos).
// ======================================================

import S7PercentDigitsInput from "../ui/S7PercentDigitsInput.jsx";

/**
 * @param {{
 *   id: string;
 *   name?: string;
 *   value: string;
 *   onChange: (v: string) => void;
 *   disabled?: boolean;
 *   placeholder?: string;
 *   className?: string;
 *   fieldClassName?: string;
 *   "aria-label"?: string;
 * }} props
 */
export function PricingPercentInput(props) {
  return (
    <S7PercentDigitsInput
      {...props}
      className={["pricing-percent-input", props.className].filter(Boolean).join(" ")}
      fieldClassName={["pricing-percent-input__field", props.fieldClassName].filter(Boolean).join(" ")}
    />
  );
}
