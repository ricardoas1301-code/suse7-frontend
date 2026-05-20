// ======================================================
// Formatação leve do Raio-x de Vendas — strings da API.
// ======================================================

export const DASH = "—";

/** @param {string | null | undefined} s */
export function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** @param {string | null | undefined} s */
export function formatNegativeBrlApi(s) {
  if (s == null || String(s).trim() === "") return null;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return null;
  return `-${formatBrlApi(String(Math.abs(n)))}`;
}

/** @param {string | null | undefined} s */
export function formatPositiveBrlApi(s) {
  if (s == null || String(s).trim() === "") return null;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return null;
  return `+${formatBrlApi(String(Math.abs(n)))}`;
}

/** @param {string | null | undefined} iso */
export function formatDatePtDayMonth(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const day = d.toLocaleDateString("pt-BR", { day: "numeric" });
  const month = d.toLocaleDateString("pt-BR", { month: "long" });
  return `${day} de ${month}`;
}

/** @param {string | null | undefined} iso */
export function formatDatePt(iso) {
  if (iso == null || String(iso).trim() === "") return DASH;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return DASH;
  return new Date(t).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Exibe no máximo `maxWords` palavras; o restante vira reticências.
 * @param {string | null | undefined} raw
 * @param {number} [maxWords]
 * @returns {{ display: string; full: string | null; truncated: boolean }}
 */
export function truncateWordsDisplay(raw, maxWords = 3) {
  if (raw == null || String(raw).trim() === "") {
    return { display: DASH, full: null, truncated: false };
  }
  const full = String(raw).trim();
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { display: full, full, truncated: false };
  }
  return {
    display: `${words.slice(0, maxWords).join(" ")}…`,
    full,
    truncated: true,
  };
}

/** @param {string | null | undefined} id */
export function shortUuid(id) {
  if (id == null || String(id).trim() === "") return DASH;
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

/** @param {string | null | undefined} pct */
export function formatPercentApi(pct) {
  if (pct == null || String(pct).trim() === "") return DASH;
  const n = Number(String(pct).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} %`;
}

/** @param {string | null | undefined} pct */
export function formatPercentDetailLabel(pct) {
  if (pct == null || String(pct).trim() === "") return null;
  const n = Number(String(pct).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/** @param {string | null | undefined} pct */
export function formatTariffPercentLabel(pct) {
  if (pct == null || String(pct).trim() === "") return null;
  const n = Number(String(pct).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `Tarifa de ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}
