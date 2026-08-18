// ======================================================================
// Moeda BRL com máscara por dígitos (estilo maquininha), mesmo padrão
// homologado do percentual / Custo Operacional.
// 1 → R$ 0,01 | 1000 → R$ 10,00 | 135000 → R$ 1.350,00
// Mantém a marcação do S7Input (wrapper/control/field) para herdar o
// mesmo visual dos demais inputs do popover.
// ======================================================================

import { useEffect, useRef, useState } from "react";
import {
  digitosMoedaParaNumero,
  extrairDigitosMoeda,
  formatarMoedaDeDigitos,
  numeroMoedaParaDigitos,
} from "../../utils/currencyDigits.js";

/**
 * @param {{
 *   id: string;
 *   name?: string;
 *   label?: string;
 *   value: number | null;
 *   onChange: (v: number | null) => void;
 *   disabled?: boolean;
 *   placeholder?: string;
 *   className?: string;
 *   fieldClassName?: string;
 *   "aria-label"?: string;
 * }} props
 */
export default function S7MoneyDigitsInput({
  id,
  name = id,
  label = "",
  value,
  onChange,
  disabled = false,
  placeholder = "R$ 0,00",
  className = "",
  fieldClassName = "",
  "aria-label": ariaLabel,
}) {
  const focadoRef = useRef(false);
  const [digits, setDigits] = useState(() => numeroMoedaParaDigitos(value));

  useEffect(() => {
    if (!focadoRef.current) {
      setDigits(numeroMoedaParaDigitos(value));
    }
  }, [value]);

  useEffect(() => {
    if (disabled) {
      focadoRef.current = false;
      setDigits(numeroMoedaParaDigitos(value));
    }
  }, [disabled, value]);

  const exibicao = formatarMoedaDeDigitos(digits);

  return (
    <div className={["s7-input__wrapper", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="s7-input__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="s7-input__control">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={["s7-input__field", fieldClassName].filter(Boolean).join(" ")}
          value={exibicao}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel ?? label ?? name}
          onFocus={() => {
            focadoRef.current = true;
            setDigits(numeroMoedaParaDigitos(value));
          }}
          onBlur={() => {
            focadoRef.current = false;
          }}
          onChange={(e) => {
            const nextDigits = extrairDigitosMoeda(e.target.value);
            setDigits(nextDigits);
            onChange(digitosMoedaParaNumero(nextDigits));
          }}
        />
      </div>
    </div>
  );
}
