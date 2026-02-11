// ======================================================================
// SUSE7 — DISPARO DE NOTIFICAÇÕES DE ESTOQUE
// Função dedicada para isolar lógica de alerta. Pronto para futura
// migração para backend (event-based).
//
// ANOTAÇÃO FUTURA: O disparo real deve acontecer no backend (venda
// decrementar estoque). O front é "alerta na edição"; backend é
// "alerta no mundo real".
// ======================================================================

import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_SEVERITY,
} from "./notificationTypes";

function getDateBucket() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Gera dedupeKey determinístico (inclui snapshot para re-alertar quando estado mudar)
 * Formato: eventType|productId|YYYY-MM-DD|count=N|ex=label1-label2-label3
 */
function buildDedupeKey(eventType, productId, variants = []) {
  const count = variants.length;
  const ex = variants
    .slice(0, 3)
    .map((v) => (v.label || "").replace(/[|\s;]/g, ""))
    .filter(Boolean)
    .join("-");
  return `${eventType}|${productId}|${getDateBucket()}|count=${count}|ex=${ex}`;
}

/**
 * Dispara notificação STOCK_BELOW_MIN (agrupada por save)
 * @param {Function} addNotification
 * @param {Object} options
 * @param {Array<{ label: string }>} options.variants
 * @param {"info"|"warning"} options.severity - info = "no limite" (== min), warning = "abaixo" (< min)
 * @param {string} options.productId - Para dedupeKey
 */
export function dispatchStockBelowMin(addNotification, options = {}) {
  if (typeof addNotification !== "function") return;

  const variants = options.variants ?? [];
  if (variants.length === 0) return;

  const severity = options.severity ?? NOTIFICATION_SEVERITY.WARNING;
  const productId = options.productId ?? "new";
  const atLimit = severity === NOTIFICATION_SEVERITY.INFO;

  const count = variants.length;
  const examples = variants
    .slice(0, 3)
    .map((v) => v.label)
    .join("; ");

  const title = atLimit
    ? count === 1
      ? "Estoque no limite"
      : `${count} variações no limite do estoque mínimo`
    : count === 1
      ? "Estoque abaixo do mínimo"
      : `${count} variações com estoque abaixo do mínimo`;

  const message = atLimit
    ? count === 1
      ? "O estoque real desta variação está no limite mínimo configurado."
      : `O estoque real de ${count} variação(ões) está no limite. Ex: ${examples}${count > 3 ? "..." : ""}`
    : count === 1
      ? "O estoque real desta variação está abaixo do mínimo configurado."
      : `O estoque real de ${count} variação(ões) está abaixo do mínimo. Ex: ${examples}${count > 3 ? "..." : ""}`;

  addNotification({
    event_type: NOTIFICATION_EVENT_TYPES.STOCK_BELOW_MIN,
    entity_type: "product_variant",
    entity_id: null,
    title,
    message,
    severity,
    dedupeKey: buildDedupeKey(
      NOTIFICATION_EVENT_TYPES.STOCK_BELOW_MIN,
      productId,
      variants
    ),
  });
}

/**
 * Dispara notificação STOCK_REAL_ZERO (estoque zerado)
 * @param {Function} addNotification
 * @param {Object} options
 * @param {Array<{ label: string }>} options.variants
 * @param {string} options.productId - Para dedupeKey
 */
export function dispatchStockRealZero(addNotification, options = {}) {
  if (typeof addNotification !== "function") return;

  const variants = options.variants ?? [];
  if (variants.length === 0) return;

  const productId = options.productId ?? "new";
  const count = variants.length;
  const examples = variants
    .slice(0, 3)
    .map((v) => v.label)
    .join("; ");

  const title =
    count === 1
      ? "Estoque zerado"
      : `${count} variações com estoque zerado`;

  const message =
    count === 1
      ? "O estoque real desta variação está zerado. O anúncio pode ser pausado automaticamente."
      : `O estoque real de ${count} variação(ões) está zerado. Ex: ${examples}${count > 3 ? "..." : ""}`;

  addNotification({
    event_type: NOTIFICATION_EVENT_TYPES.STOCK_REAL_ZERO,
    entity_type: "product_variant",
    entity_id: null,
    title,
    message,
    severity: NOTIFICATION_SEVERITY.CRITICAL,
    dedupeKey: buildDedupeKey(
      NOTIFICATION_EVENT_TYPES.STOCK_REAL_ZERO,
      productId,
      variants
    ),
  });
}
