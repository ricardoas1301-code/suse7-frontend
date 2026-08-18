import { useCallback, useEffect, useRef, useState } from "react";

import {

  formatarPercentualDiretoFinal,

  sanitizarPercentualDiretoEdicao,

} from "../../utils/s7PercentDirectInput.js";

import "./S7PercentDirectInput.css";



/**

 * Percentual direto pt-BR — raw string durante edição; normaliza só no blur/save.

 *

 * @param {{

 *   id?: string;

 *   name?: string;

 *   value: string;

 *   onChange: (value: string) => void;

 *   onBlur?: (event: import("react").FocusEvent<HTMLInputElement>) => void;

 *   disabled?: boolean;

 *   placeholder?: string;

 *   className?: string;

 *   fieldClassName?: string;

 *   "aria-label"?: string;

 * }} props

 */

export default function S7PercentDirectInput({

  id,

  name,

  value,

  onChange,

  onBlur,

  disabled = false,

  placeholder = "0,00",

  className = "",

  fieldClassName = "",

  "aria-label": ariaLabel,

}) {

  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [focused, setFocused] = useState(false);

  const [draft, setDraft] = useState("");



  useEffect(() => {

    if (focused) return;

    setDraft(value ? formatarPercentualDiretoFinal(value) : "");

  }, [focused, value]);



  const exibicao = focused ? draft : draft;



  const handleChange = useCallback(

    (event) => {

      const sanitized = sanitizarPercentualDiretoEdicao(event.target.value);

      setDraft(sanitized);

      onChange(sanitized);

    },

    [onChange],

  );



  const handleFocus = useCallback(() => {

    setFocused(true);

    setDraft(value ? sanitizarPercentualDiretoEdicao(value) : "");

  }, [value]);



  const handleBlur = useCallback(

    (event) => {

      setFocused(false);

      const normalized = draft ? formatarPercentualDiretoFinal(draft) : "";

      setDraft(normalized);

      if (normalized !== value) {

        onChange(normalized);

      }

      onBlur?.(event);

    },

    [draft, onBlur, onChange, value],

  );



  return (

    <div

      className={[

        "s7-percent-direct-input",

        disabled ? "s7-percent-direct-input--disabled" : "",

        className,

      ]

        .filter(Boolean)

        .join(" ")}

    >

      <input

        ref={inputRef}

        id={id}

        name={name}

        type="text"

        inputMode="decimal"

        autoComplete="off"

        className={["s7-percent-direct-input__field", fieldClassName].filter(Boolean).join(" ")}

        value={exibicao}

        disabled={disabled}

        placeholder={placeholder}

        aria-label={ariaLabel}

        onFocus={handleFocus}

        onBlur={handleBlur}

        onChange={handleChange}

      />

      <span className="s7-percent-direct-input__suffix" aria-hidden="true">

        %

      </span>

    </div>

  );

}

