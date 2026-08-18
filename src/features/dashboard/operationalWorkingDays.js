// ======================================================================
// Dias de operação do seller (Resumo Diário — ciclo operacional)
// Convenção: 0 = domingo … 6 = sábado (Date.getDay / JS padrão).
// ======================================================================

/** @type {number[]} Todos os dias — fallback e default para perfis legados. */
export const DEFAULT_OPERATIONAL_WORKING_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Opções de UI (Segunda → Domingo). */
export const OPERATIONAL_WEEKDAY_OPTIONS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

/**
 * Normaliza dias vindos do profile/API.
 * @param {unknown} raw
 * @returns {number[]}
 */
export function normalizeOperationalWorkingDays(raw) {
  if (raw == null) return [...DEFAULT_OPERATIONAL_WORKING_DAYS];
  const source = Array.isArray(raw) ? raw : [];
  if (source.length === 0) return [...DEFAULT_OPERATIONAL_WORKING_DAYS];

  const normalized = [
    ...new Set(
      source
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ].sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : [...DEFAULT_OPERATIONAL_WORKING_DAYS];
}

/**
 * @param {unknown} workingDays
 * @returns {boolean}
 */
export function isFullOperationalWeek(workingDays) {
  return normalizeOperationalWorkingDays(workingDays).length === 7;
}

/**
 * @param {number[]} workingDays
 * @returns {boolean}
 */
export function areOperationalWorkingDaysEqual(workingDays, other) {
  const a = normalizeOperationalWorkingDays(workingDays);
  const b = normalizeOperationalWorkingDays(other);
  return a.length === b.length && a.every((day, index) => day === b[index]);
}
