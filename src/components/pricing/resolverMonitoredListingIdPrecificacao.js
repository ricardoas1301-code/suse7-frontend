// ======================================================
// Resolve monitored_listing_id a partir do anúncio do catálogo PI.
// Mesma âncora da Página Concorrência (listMonitoredListings).
// ======================================================

import { listMonitoredListings } from "../../services/competitionApi.js";

/** @type {{ byMarketplaceListingId: Map<string, string>; byExternalListingId: Map<string, string> } | null} */
let indiceMonitoredListings = null;
/** @type {Promise<{ byMarketplaceListingId: Map<string, string>; byExternalListingId: Map<string, string> }> | null} */
let promessaIndice = null;

function montarIndice(rows) {
  /** @type {Map<string, string>} */
  const byMarketplaceListingId = new Map();
  /** @type {Map<string, string>} */
  const byExternalListingId = new Map();

  for (const row of rows) {
    const monitoredId =
      row?.monitored_listing_id != null ? String(row.monitored_listing_id).trim() : "";
    if (!monitoredId) continue;

    const marketplaceListingId =
      row?.marketplace_listing_id != null ? String(row.marketplace_listing_id).trim() : "";
    if (marketplaceListingId) {
      byMarketplaceListingId.set(marketplaceListingId, monitoredId);
    }

    const ownListing =
      row?.own_listing != null && typeof row.own_listing === "object" ? row.own_listing : null;
    for (const candidato of [
      ownListing?.external_listing_id,
      ownListing?.external_listing_id_display,
      row?.external_listing_id,
    ]) {
      if (candidato == null || String(candidato).trim() === "") continue;
      byExternalListingId.set(String(candidato).trim().toUpperCase(), monitoredId);
    }
  }

  return { byMarketplaceListingId, byExternalListingId };
}

async function carregarIndiceMonitoredListings() {
  if (indiceMonitoredListings) return indiceMonitoredListings;
  if (!promessaIndice) {
    promessaIndice = (async () => {
      const res = await listMonitoredListings();
      if (!res.ok) {
        throw new Error(res.error || "Não foi possível consultar anúncios monitorados.");
      }
      const rows = Array.isArray(res.monitoredListings) ? res.monitoredListings : [];
      indiceMonitoredListings = montarIndice(rows);
      return indiceMonitoredListings;
    })().finally(() => {
      promessaIndice = null;
    });
  }
  return promessaIndice;
}

/** Limpa índice em memória (nova sessão do modal / troca de anúncio). */
export function limparIndiceMonitoredListingsPrecificacao() {
  indiceMonitoredListings = null;
  promessaIndice = null;
}

/**
 * @param {{
 *   marketplaceListingId?: string | null;
 *   externalListingId?: string | null;
 * }} params
 * @returns {Promise<string | null>}
 */
export async function resolverMonitoredListingIdPrecificacao({
  marketplaceListingId = null,
  externalListingId = null,
}) {
  const indice = await carregarIndiceMonitoredListings();
  const mlId = marketplaceListingId != null ? String(marketplaceListingId).trim() : "";
  if (mlId && indice.byMarketplaceListingId.has(mlId)) {
    return indice.byMarketplaceListingId.get(mlId) ?? null;
  }

  const ext = externalListingId != null ? String(externalListingId).trim().toUpperCase() : "";
  if (ext && indice.byExternalListingId.has(ext)) {
    return indice.byExternalListingId.get(ext) ?? null;
  }

  return null;
}
