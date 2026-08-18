// ======================================================================
// Testes unitários — busca modal Incluir anúncio (Concorrência).
// Executar: node ./scripts/test_concorrencia_incluir_modal_search_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import {
  criarSetMarketplaceListingsMonitorados,
  extrairChaveMarketplaceListingIncluirModal,
  linhaMonitoredAtendeBuscaIncluirModal,
  mesclarResultadosBuscaIncluirModal,
  resolverMensagemVazioBuscaIncluirModal,
} from "../src/features/concorrencia/incluirAnuncio/concorrenciaIncluirAnuncioSearchPresentation.js";

const monitoredSku11011 = {
  marketplace_listing_id: "ml-11011-a",
  product_name: "Tábua De Passar Roupa Grande",
  sku: "11011",
  external_listing_id: "MLB6086562408",
  account_label: "Conta A",
  own_listing: { price: "299.90", sales_count: 12, external_listing_id: "MLB6086562408" },
};

const monitoredSku11011b = {
  marketplace_listing_id: "ml-11011-b",
  product_name: "Tábua Reforçada Branca",
  sku: "11011",
  external_listing_id: "MLB6086602390",
  account_label: "Conta B",
  own_listing: { price: "319.90", sales_count: 8 },
};

const availableListing = {
  marketplace_listing_id: "ml-new-1",
  title: "Produto novo",
  sku: "22022",
  external_listing_id: "MLB9999999999",
};

const monitoredSet = criarSetMarketplaceListingsMonitorados([
  monitoredSku11011,
  monitoredSku11011b,
]);

assert.equal(extrairChaveMarketplaceListingIncluirModal(monitoredSku11011), "ml-11011-a");
assert.equal(linhaMonitoredAtendeBuscaIncluirModal(monitoredSku11011, "11011"), true);
assert.equal(linhaMonitoredAtendeBuscaIncluirModal(monitoredSku11011, "inexistente"), false);

// API vazia + monitorados locais (caso SKU 11011 homologado)
const somenteMonitorados = mesclarResultadosBuscaIncluirModal(
  [],
  [monitoredSku11011, monitoredSku11011b],
  monitoredSet,
  "11011",
);
assert.equal(somenteMonitorados.hasAnyMatch, true);
assert.equal(somenteMonitorados.allMonitored, true);
assert.equal(somenteMonitorados.hasAvailable, false);
assert.equal(somenteMonitorados.items.length, 2);
assert.equal(somenteMonitorados.items.every((item) => item.isAlreadyMonitored), true);

const msgTodosMonitorados = resolverMensagemVazioBuscaIncluirModal({
  searching: false,
  searchError: null,
  hasSearchText: true,
  hasAnyMatch: true,
  allMonitored: true,
});
assert.equal(msgTodosMonitorados.kind, "results");
assert.equal(msgTodosMonitorados.message, null);

// Zero resultado real
const nenhum = mesclarResultadosBuscaIncluirModal([], [], monitoredSet, "sku-inexistente-xyz");
assert.equal(nenhum.hasAnyMatch, false);
const msgNenhum = resolverMensagemVazioBuscaIncluirModal({
  searching: false,
  searchError: null,
  hasSearchText: true,
  hasAnyMatch: false,
  allMonitored: false,
});
assert.equal(msgNenhum.kind, "not_found");

// Conjunto misto
const misto = mesclarResultadosBuscaIncluirModal(
  [availableListing, { ...monitoredSku11011, isAlreadyMonitored: false }],
  [monitoredSku11011b],
  monitoredSet,
  "11011",
);
assert.equal(misto.items.length, 3);
assert.equal(misto.hasAvailable, true);
assert.equal(misto.allMonitored, false);
assert.equal(
  misto.items.filter((item) => item.isAlreadyMonitored).length,
  2,
);
assert.equal(
  misto.items.find((item) => item.marketplace_listing_id === "ml-new-1")?.isAlreadyMonitored,
  false,
);

// Deduplicação por marketplace_listing_id
const dedupe = mesclarResultadosBuscaIncluirModal(
  [{ marketplace_listing_id: "ml-11011-a", title: "API" }],
  [monitoredSku11011],
  monitoredSet,
  "11011",
);
assert.equal(dedupe.items.length, 1);
assert.equal(dedupe.items[0].isAlreadyMonitored, true);

console.log("[OK] test_concorrencia_incluir_modal_search_unit — 10 cenários");
