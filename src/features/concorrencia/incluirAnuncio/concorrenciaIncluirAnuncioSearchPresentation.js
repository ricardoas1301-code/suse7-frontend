// ======================================================================
// Apresentação da busca — modal Incluir anúncio (Concorrência).
// Mescla resultados da API com anúncios já monitorados (dataset da página).
// ======================================================================

import { extrairIdAnuncioProprio } from "../../../components/concorrencia/concorrenciaCompetitorDisplay.js";

/** @param {unknown} value */
export function normalizarTextoBuscaIncluirModal(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Identidade canônica para inclusão/monitoramento — marketplace_listing_id (SSOT API).
 * @param {unknown} row
 */
export function extrairChaveMarketplaceListingIncluirModal(row) {
  return String(row?.marketplace_listing_id ?? "").trim();
}

/**
 * @param {readonly unknown[]} monitoredListings
 */
export function criarSetMarketplaceListingsMonitorados(monitoredListings) {
  const set = new Set();
  const list = Array.isArray(monitoredListings) ? monitoredListings : [];
  for (const row of list) {
    const id = extrairChaveMarketplaceListingIncluirModal(row);
    if (id) set.add(id);
  }
  return set;
}

/**
 * @param {unknown} row
 * @param {string} query
 */
export function linhaMonitoredAtendeBuscaIncluirModal(row, query) {
  const q = normalizarTextoBuscaIncluirModal(query);
  if (!q) return false;
  if (!row || typeof row !== "object") return false;

  const record = /** @type {Record<string, unknown>} */ (row);
  const ownListing = record.own_listing ?? null;
  const campos = [
    record.product_name,
    record.title,
    record.sku,
    record.external_listing_id,
    extrairIdAnuncioProprio(ownListing),
    ownListing && typeof ownListing === "object"
      ? /** @type {Record<string, unknown>} */ (ownListing).title
      : null,
  ];

  return campos.some((valor) => normalizarTextoBuscaIncluirModal(valor).includes(q));
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapearMonitoredParaResultadoIncluirModal(row) {
  const ownListing =
    row.own_listing && typeof row.own_listing === "object"
      ? /** @type {Record<string, unknown>} */ (row.own_listing)
      : null;

  return {
    marketplace_listing_id: row.marketplace_listing_id ?? null,
    title: row.product_name ?? ownListing?.title ?? null,
    product_name: row.product_name ?? null,
    sku: row.sku ?? null,
    external_listing_id: extrairIdAnuncioProprio(ownListing) || row.external_listing_id || null,
    listing_thumbnail: row.listing_thumbnail ?? null,
    account_label: row.account_label ?? null,
    price: ownListing?.price ?? row.price ?? null,
    currency: ownListing?.currency ?? row.currency ?? "BRL",
    sales_count: ownListing?.sales_count ?? ownListing?.sales ?? row.sales_count ?? row.sales ?? 0,
    marketplace_account_id: row.marketplace_account_id ?? null,
    isAlreadyMonitored: true,
  };
}

/**
 * @param {readonly unknown[]} apiResults
 * @param {readonly unknown[]} monitoredListings
 * @param {ReadonlySet<string>} monitoredIdsSet
 * @param {string} query
 */
export function mesclarResultadosBuscaIncluirModal(apiResults, monitoredListings, monitoredIdsSet, query) {
  const q = String(query ?? "").trim();
  if (!q) {
    return {
      items: [],
      hasAnyMatch: false,
      allMonitored: false,
      hasAvailable: false,
    };
  }

  const seen = new Set();
  /** @type {Record<string, unknown>[]} */
  const items = [];

  const apiList = Array.isArray(apiResults) ? apiResults : [];
  for (const raw of apiList) {
    if (!raw || typeof raw !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (raw);
    const id = extrairChaveMarketplaceListingIncluirModal(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    items.push({
      ...row,
      isAlreadyMonitored: monitoredIdsSet.has(id),
    });
  }

  const monitoredList = Array.isArray(monitoredListings) ? monitoredListings : [];
  for (const raw of monitoredList) {
    if (!raw || typeof raw !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (raw);
    const id = extrairChaveMarketplaceListingIncluirModal(row);
    if (!id || seen.has(id)) continue;
    if (!linhaMonitoredAtendeBuscaIncluirModal(row, q)) continue;
    seen.add(id);
    items.push(mapearMonitoredParaResultadoIncluirModal(row));
  }

  const hasAnyMatch = items.length > 0;
  const allMonitored = hasAnyMatch && items.every((item) => Boolean(item.isAlreadyMonitored));
  const hasAvailable = items.some((item) => !item.isAlreadyMonitored);

  return { items, hasAnyMatch, allMonitored, hasAvailable };
}

/**
 * @param {{
 *   searching?: boolean;
 *   searchError?: string | null;
 *   hasSearchText?: boolean;
 *   hasAnyMatch?: boolean;
 *   allMonitored?: boolean;
 * }} ctx
 */
export function resolverMensagemVazioBuscaIncluirModal(ctx) {
  if (ctx.searching) return { kind: "searching", message: "Buscando anúncios…" };
  if (ctx.searchError) return { kind: "error", message: ctx.searchError };
  if (!ctx.hasSearchText) return { kind: "idle", message: null };
  if (!ctx.hasAnyMatch) {
    return { kind: "not_found", message: "Nenhum anúncio encontrado para esta busca." };
  }
  return { kind: "results", message: null };
}
