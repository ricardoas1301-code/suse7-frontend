// ======================================================================
// HOOK: useFormValidation
// Objetivo:
// - Infraestrutura reutilizável de UX para formulários (Suse7)
// - Validação leve no cliente; backend continua sendo a autoridade
//
// Expõe: values, errors, touched, setValue, setValues, validateField,
//        validateAll, handleBlur, resetForm, getFieldState
//
// Observações:
// - validators[field] retorna string de erro ou "" / falsy se válido
// - Assinatura do validator: (value, allValues) => string | falsy
// ======================================================================

import { useCallback, useEffect, useState } from "react";

/**
 * @param {{
 *   initialValues?: Record<string, unknown>;
 *   validators?: Record<string, (value: unknown, allValues: Record<string, unknown>) => string | undefined | null | false>;
 * }} options
 */
export function useFormValidation({ initialValues = {}, validators = {} }) {
  const [values, setValuesState] = useState(() => ({ ...initialValues }));
  const [errors, setErrors] = useState(() => ({}));
  const [touched, setTouched] = useState(() => ({}));

  // Remove erros de campos que deixaram de existir em `validators` (ex.: SKU ao mudar formato)
  useEffect(() => {
    const validKeys = new Set(Object.keys(validators));
    setErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!validKeys.has(k)) {
          delete next[k];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    setTouched((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!validKeys.has(k)) {
          delete next[k];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [validators]);

  const setValue = useCallback(
    (field, value) => {
      setValuesState((prev) => {
        const nextValues = { ...prev, [field]: value };

        if (validators[field]) {
          const raw = validators[field](value, nextValues);
          const message = raw ? String(raw) : "";
          setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: message,
          }));
        }

        return nextValues;
      });
    },
    [validators]
  );

  /** Merge parcial em `values`; revalida somente campos presentes em `patch`. */
  const setValues = useCallback(
    (patch) => {
      setValuesState((prev) => {
        const next = { ...prev, ...patch };

        Object.keys(patch).forEach((field) => {
          if (validators[field]) {
            const raw = validators[field](next[field], next);
            const message = raw ? String(raw) : "";
            setErrors((prevErrors) => ({
              ...prevErrors,
              [field]: message,
            }));
          }
        });

        return next;
      });
    },
    [validators]
  );

  /**
   * Valida um campo e persiste o resultado em `errors`.
   * @param {string} field
   * @param {unknown} [nextValue] — se omitido, usa o valor atual de `values[field]`
   * @returns {boolean} true se válido
   */
  const validateField = useCallback(
    (field, nextValue) => {
      const validator = validators[field];
      if (!validator) return true;

      const val = nextValue !== undefined ? nextValue : values[field];
      const allValues = nextValue !== undefined ? { ...values, [field]: nextValue } : values;
      const raw = validator(val, allValues);
      const message = raw ? String(raw) : "";

      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: message,
      }));

      return !message;
    },
    [validators, values]
  );

  const handleBlur = useCallback(
    (field) => {
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));

      validateField(field);
    },
    [validateField]
  );

  /**
   * Valida todos os campos listados em `validators`.
   * Marca esses campos como touched.
   * @returns {{ isValid: boolean; errors: Record<string, string> }}
   */
  const validateAll = useCallback(() => {
    const nextErrors = {};
    let isValid = true;

    Object.keys(validators).forEach((field) => {
      const raw = validators[field]?.(values[field], values);
      const message = raw ? String(raw) : "";
      nextErrors[field] = message;
      if (message) isValid = false;
    });

    setErrors(nextErrors);
    setTouched((t) => {
      const nt = { ...t };
      Object.keys(validators).forEach((f) => {
        nt[f] = true;
      });
      return nt;
    });

    return { isValid, errors: nextErrors };
  }, [validators, values]);

  /**
   * Restaura valores e limpa erros/touched.
   * @param {Partial<T>} [snapshot] — se informado, faz merge sobre `initialValues`
   */
  const resetForm = useCallback(
    (snapshot) => {
      const base = { ...initialValues, ...(snapshot || {}) };
      setValuesState(base);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const getFieldState = useCallback(
    (field) => {
      const value = values[field];
      const message = errors[field] || "";
      const isTouched = !!touched[field];
      const hasError = !!message;
      const isFilled =
        typeof value === "string"
          ? !!value.trim()
          : value !== null && value !== undefined && value !== "";
      const isSuccess = isTouched && !hasError && isFilled;

      return {
        hasError,
        isTouched,
        isSuccess,
        message,
      };
    },
    [values, errors, touched]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setValues,
    validateField,
    validateAll,
    handleBlur,
    resetForm,
    getFieldState,
  };
}
