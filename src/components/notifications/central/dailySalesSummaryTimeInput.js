// =============================================================================
// Máscara e parse — input HH:mm (Resumo de vendas do dia)
// =============================================================================

const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * @param {string} raw
 */
export function isValidDailySalesSummaryTime(raw) {
  return HH_MM_RE.test(String(raw ?? "").trim());
}

/**
 * Durante digitação: permite dígitos e ":" (máx. 5 chars HH:mm ou 4 dígitos).
 * @param {string} raw
 */
export function sanitizeDailySalesSummaryTimeDraft(raw) {
  const s = String(raw ?? "");
  if (s.includes(":")) {
    const [h, m = ""] = s.split(":");
    const hd = h.replace(/\D/g, "").slice(0, 2);
    const md = m.replace(/\D/g, "").slice(0, 2);
    return md.length ? `${hd}:${md}` : hd;
  }
  return s.replace(/\D/g, "").slice(0, 4);
}

/**
 * Normaliza input manual no blur/Enter/confirmação do wheel.
 * 1642 → 16:42 | 8 → 08:00 | 845 → 08:45 | 16:42 → 16:42
 * @param {string} raw
 * @returns {string | null}
 */
export function parseDailySalesSummaryTimeInput(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  if (isValidDailySalesSummaryTime(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length <= 2) {
    const h = Number(digits);
    if (Number.isInteger(h) && h >= 0 && h <= 23) {
      return `${String(h).padStart(2, "0")}:00`;
    }
    return null;
  }

  if (digits.length === 3) {
    const h = Number(digits.slice(0, 1));
    const m = Number(digits.slice(1, 3));
    if (h >= 0 && h <= 9 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }

  if (digits.length === 4) {
    const h = Number(digits.slice(0, 2));
    const m = Number(digits.slice(2, 4));
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }

  return null;
}

/**
 * @param {number} hour 0-23
 * @param {number} minute 0-59
 */
export function formatDailySalesSummaryTimeParts(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * @param {string} value HH:mm
 */
export function parseDailySalesSummaryTimeParts(value) {
  if (!isValidDailySalesSummaryTime(value)) {
    return { hour: 8, minute: 0 };
  }
  const [h, m] = value.split(":").map(Number);
  return { hour: h, minute: m };
}
