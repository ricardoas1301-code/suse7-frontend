// ======================================================
// Cor semântica do status da venda — Raio-x (padrão ML).
// ======================================================

/** @param {unknown} v */
function safeStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * @typedef {"success" | "warning" | "danger" | "neutral"} SaleStatusTone
 */

/**
 * @typedef {{ tone: SaleStatusTone; color: string | null }} SaleStatusColor
 */

/**
 * Resolve cor e tom do status para exibição no bloco esquerdo.
 * Aceita código API (paid, shipped…) ou rótulo PT ("A caminho").
 *
 * @param {unknown} status
 * @returns {SaleStatusColor}
 */
export function getSaleStatusColor(status) {
  const raw = safeStr(status);
  if (!raw) return { tone: "neutral", color: null };

  const key = raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

  const codeMap = /** @type {Record<string, SaleStatusTone>} */ ({
    paid: "success",
    shipped: "success",
    delivered: "success",
    handling: "success",
    ready_to_ship: "success",
    pending: "warning",
    processing: "warning",
    payment_pending: "warning",
    cancelled: "danger",
    canceled: "danger",
    cancel: "danger",
  });

  if (codeMap[key]) {
    return {
      tone: codeMap[key],
      color: codeMap[key] === "success" ? "var(--s7-status-success, #00a650)" : null,
    };
  }

  if (
    key.includes("caminho") ||
    key.includes("enviado") ||
    key.includes("entregue") ||
    key.includes("pago") ||
    key.includes("concluid")
  ) {
    return { tone: "success", color: "var(--s7-status-success, #00a650)" };
  }

  if (key.includes("pendent") || key.includes("aguard") || key.includes("process")) {
    return { tone: "warning", color: null };
  }

  if (key.includes("cancel") || key.includes("devol") || key.includes("reembol")) {
    return { tone: "danger", color: null };
  }

  return { tone: "neutral", color: null };
}
