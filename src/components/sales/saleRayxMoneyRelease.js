// ======================================================
// Liberação do dinheiro — leitura de payloads já expostos.
// ======================================================

import { formatDatePtDayMonth } from "./saleRayxFormat";

/**
 * @param {unknown} source
 */
function asObject(source) {
  if (!source || typeof source !== "object") return null;
  return /** @type {Record<string, unknown>} */ (source);
}

/**
 * @param {unknown} raw
 */
function pickTrim(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

/**
 * @param {unknown} raw
 */
function parseIsoDate(raw) {
  const s = pickTrim(raw);
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

/**
 * @param {unknown} node
 * @param {string[]} keys
 */
function pickDateFromNode(node, keys) {
  if (!node) return null;
  for (const key of keys) {
    const iso = parseIsoDate(node[key]);
    if (iso) return iso;
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null} orderRaw
 */
function pickFromPayments(orderRaw) {
  const payments = orderRaw?.payments;
  if (!Array.isArray(payments)) return null;
  for (const payment of payments) {
    if (!payment || typeof payment !== "object") continue;
    const iso = pickDateFromNode(/** @type {Record<string, unknown>} */ (payment), [
      "money_release_date",
      "date_of_money_release",
      "available_funds_date",
      "release_date",
    ]);
    if (iso) return iso;
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 * @param {Record<string, unknown> | null | undefined} product
 * @returns {{ label: string; dateDisplay: string; iso: string } | null}
 */
export function resolveMoneyReleaseDate(general, product) {
  const g = general && typeof general === "object" ? general : {};
  const p = product && typeof product === "object" ? product : {};
  const orderRaw = asObject(p.order_raw_json);
  const itemRaw = asObject(p.raw_json);
  const s7 =
    orderRaw?._s7_money && typeof orderRaw._s7_money === "object"
      ? /** @type {Record<string, unknown>} */ (orderRaw._s7_money)
      : null;

  const candidates = [
    g.money_release_date,
    g.funds_available_from,
    g.money_available_from,
    orderRaw ? pickDateFromNode(orderRaw, ["money_release_date", "funds_release_date", "available_funds_date"]) : null,
    itemRaw ? pickDateFromNode(itemRaw, ["money_release_date", "funds_release_date", "available_funds_date"]) : null,
    s7 ? pickDateFromNode(s7, ["money_release_date", "available_from", "release_date"]) : null,
    pickFromPayments(orderRaw),
  ];

  let iso = null;
  for (const raw of candidates) {
    const parsed = parseIsoDate(raw);
    if (parsed) {
      iso = parsed;
      break;
    }
  }
  if (!iso) return null;

  const dateDisplay = formatDatePtDayMonth(iso);
  if (!dateDisplay) return null;

  return {
    label: "Você pode usar o dinheiro a partir de",
    dateDisplay,
    iso,
  };
}
