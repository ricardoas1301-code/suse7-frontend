// ======================================================================
// Percentual com máscara por dígitos — mesmo padrão do Custo Operacional (Produtos).
// ======================================================================

import { useEffect, useRef, useState } from "react";
import {
  extrairDigitosPercentual,
  formatarPercentualDeDigitos,
  valorPercentualExibidoParaDigitos,
} from "../../utils/percentualDigitos.js";

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
 *   maxDigitos?: number;
 *   "aria-label"?: string;
 * }} props
 */
export default function S7PercentDigitsInput({
  id,
  name = id,
  value,
  onChange,
  disabled = false,
  placeholder = "0,00",
  className = "",
  fieldClassName = "",
  maxDigitos,
  "aria-label": ariaLabel,
}) {
  const focadoRef = useRef(false);
  const [digits, setDigits] = useState(() => valorPercentualExibidoParaDigitos(value));

  useEffect(() => {
    if (!focadoRef.current) {
      setDigits(valorPercentualExibidoParaDigitos(value));
    }
  }, [value]);

  useEffect(() => {
    if (disabled) {
      focadoRef.current = false;
      setDigits(valorPercentualExibidoParaDigitos(value));
    }
  }, [disabled, value]);

  const exibicao = formatarPercentualDeDigitos(digits, maxDigitos);

  return (
    <div
      className={[
        "s7-percent-digits-input",
        disabled ? "s7-percent-digits-input--disabled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={["s7-percent-digits-input__field", fieldClassName].filter(Boolean).join(" ")}
        value={exibicao}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel ?? name}
        onFocus={() => {
          focadoRef.current = true;
          setDigits(valorPercentualExibidoParaDigitos(value));
        }}
        onBlur={() => {
          focadoRef.current = false;
        }}
        onChange={(e) => {
          const nextDigits = extrairDigitosPercentual(e.target.value, maxDigitos);
          setDigits(nextDigits);
          onChange(formatarPercentualDeDigitos(nextDigits, maxDigitos));
        }}
      />
      <span className="s7-percent-digits-input__suffix" aria-hidden="true">
        %
      </span>
    </div>
  );
}
