// ======================================================================
// Suse7 — Pesos & medidas (pt-BR)
// - cm: "." milhar, "," + 2 decimais (ex.: 10.000,00)
// - kg: "." milhar, "," + 3 decimais (ex.: 1,560 kg)
// ======================================================================

/**
 * Campos de dimensão em centímetros (envio + montado).
 */
export const PRODUCT_CM_FIELDS = [
  "width",
  "height",
  "length",
  "assembled_width",
  "assembled_height",
  "assembled_length",
];

/**
 * Campos de peso em kg.
 */
export const PRODUCT_KG_FIELDS = ["weight", "assembled_weight"];

/**
 * Todos os campos numéricos da aba (ordem legada).
 */
export const PRODUCT_DECIMAL_MEASURE_FIELDS = [
  ...PRODUCT_CM_FIELDS,
  ...PRODUCT_KG_FIELDS,
];

// --- KG: máscara ÷1000, 3 decimais, milhar ----------------------------------

/** Teto numérico kg (evita overflow no banco). */
export const KG_MEASURE_MAX = 999_999.999;

/** @deprecated use KG_MEASURE_MAX */
export const MEASURE_DECIMAL_MAX = KG_MEASURE_MAX;

/**
 * Dígitos crus: ÷1000 → sempre 3 casas decimais (gramas implícitas).
 * 9 dígitos → até 999.999,999 kg
 */
const KG_AUTO_MAX_RAW_DIGITS = 9;

// --- CM ---------------------------------------------------------------------

/** Teto numérico cm (evita overflow no banco). */
export const CM_MEASURE_MAX = 999_999_999.99;

const CM_AUTO_MAX_RAW_DIGITS = 11;

/**
 * Máscara cm: só dígitos na digitação; exibe com milhar e 2 decimais.
 * @param {string} value
 * @returns {string}
 */
export function formatCmInput(value) {
  if (value == null || value === "") return "";

  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length > CM_AUTO_MAX_RAW_DIGITS) {
    digits = digits.slice(0, CM_AUTO_MAX_RAW_DIGITS);
  }

  const number = parseInt(digits, 10) / 100;
  if (!Number.isFinite(number)) return "";

  const clamped = Math.min(Math.max(number, 0), CM_MEASURE_MAX);

  return clamped.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
}

export function formatCmFromNumber(n) {
  if (n == null || !Number.isFinite(n)) return "";
  const clamped = Math.min(Math.max(n, 0), CM_MEASURE_MAX);
  const cents = Math.round(clamped * 100);
  return formatCmInput(String(cents));
}

export function toCmInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatCmFromNumber(value);
  }
  const str = String(value).trim();
  if (!str) return "";
  const n = parsePtBRNumber(str);
  if (n != null && Number.isFinite(n)) {
    return formatCmFromNumber(n);
  }
  const digits = str.replace(/\D/g, "");
  return digits ? formatCmInput(digits) : "";
}

// --- KG ---------------------------------------------------------------------

/**
 * Máscara kg: só dígitos; exibe milhar + 3 decimais (1,560 kg).
 * @param {string} value
 * @returns {string}
 */
export function formatKgInput(value) {
  if (value == null || value === "") return "";

  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length > KG_AUTO_MAX_RAW_DIGITS) {
    digits = digits.slice(0, KG_AUTO_MAX_RAW_DIGITS);
  }

  const number = parseInt(digits, 10) / 1000;
  if (!Number.isFinite(number)) return "";

  const clamped = Math.min(Math.max(number, 0), KG_MEASURE_MAX);

  return clamped.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    useGrouping: true,
  });
}

export function formatKgFromNumber(n) {
  if (n == null || !Number.isFinite(n)) return "";
  const clamped = Math.min(Math.max(n, 0), KG_MEASURE_MAX);
  const thousandths = Math.round(clamped * 1000);
  return formatKgInput(String(thousandths));
}

export function toKgInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatKgFromNumber(value);
  }
  const str = String(value).trim();
  if (!str) return "";
  const n = parsePtBRNumber(str);
  if (n != null && Number.isFinite(n)) {
    return formatKgFromNumber(n);
  }
  const digits = str.replace(/\D/g, "");
  return digits ? formatKgInput(digits) : "";
}

/**
 * Parse string pt-BR com milhar (.) e decimal (,) → número.
 * @param {string|null|undefined} value
 * @returns {number|null}
 */
export function parseCmPtBR(value) {
  return parsePtBRNumber(value);
}

/** @param {string|null|undefined} value */
export function parseKgPtBR(value) {
  return parsePtBRNumber(value);
}

/** Núcleo: remove milhar e normaliza decimal pt-BR. */
function parsePtBRNumber(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseDecimal(value) {
  return parsePtBRNumber(value);
}

export function parseDecimalBR(value) {
  return parseDecimal(value);
}

export function isValidCmValue(value) {
  if (value == null || value === "" || String(value).trim() === "") return true;
  const n = parseCmPtBR(value);
  if (n == null || !Number.isFinite(n)) return false;
  return n >= 0 && n <= CM_MEASURE_MAX;
}

export function isValidKgValue(value) {
  if (value == null || value === "" || String(value).trim() === "") return true;
  const n = parseKgPtBR(value);
  if (n == null || !Number.isFinite(n)) return false;
  return n >= 0 && n <= KG_MEASURE_MAX;
}

/**
 * Valida os 8 campos (cm 2 dec; kg 3 dec, formato pt-BR).
 * @param {Record<string, unknown>|null|undefined} product
 * @returns {string|null}
 */
export function validateProductMeasureFields(product) {
  if (!product || typeof product !== "object") return null;

  for (const k of PRODUCT_CM_FIELDS) {
    const raw = product[k];
    if (!isValidCmValue(raw)) {
      return "Medidas em cm: formato inválido. Use ponto nos milhares e vírgula nas duas decimais.";
    }
  }

  for (const k of PRODUCT_KG_FIELDS) {
    const raw = product[k];
    if (!isValidKgValue(raw)) {
      return "Peso (kg): formato inválido. Use ponto nos milhares e vírgula nas três decimais.";
    }
  }

  return null;
}

export function measureDecimalOnKeyDown(e) {
  const NAV_KEYS = new Set([
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ]);
  if (NAV_KEYS.has(e.key)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === "," || e.key === ".") {
    e.preventDefault();
    return;
  }

  if (e.key.length !== 1) return;
  if (/[0-9]/.test(e.key)) return;
  e.preventDefault();
}
