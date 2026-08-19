import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ANUNCIOS_LIST_HEADER_LABELS,
  PRECIFICACOES_LIST_HEADER_LABELS,
  PRODUTOS_LIST_HEADER_LABELS,
  VENDAS_LIST_HEADER_LABELS,
} from "../src/features/listings/layout/listColumnsCanonicalOrder.js";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

function read(relativePath) {
  return readFileSync(join(feRoot, relativePath), "utf8");
}

/** @param {string} source @param {string[]} needles @param {string} label */
function assertOrderedSubstrings(source, needles, label) {
  let lastIndex = -1;
  for (const needle of needles) {
    const idx = source.indexOf(needle, lastIndex + 1);
    assert.ok(idx > lastIndex, `${label}: expected "${needle}" after prior column markers`);
    lastIndex = idx;
  }
}

// --- Vendas ---
const vendasPage = read("src/pages/VendasPage.jsx");
const vendasColgroup = read("src/features/vendas/components/VendasTableColgroup.jsx");

assert.match(vendasPage, /Nº Venda/, "vendas header must use Nº Venda");
assert.match(vendasPage, /vendas-page__col-thumb/, "vendas must have dedicated thumb column");
assert.doesNotMatch(vendasPage, /<th[^>]*>\s*Venda\s*<\/th>/, "vendas price header must not remain as Venda");
assert.match(vendasPage, /vendas-page__col-sale-value[\s\S]*?\n\s*Preço/, "vendas price header must be Preço");
assert.doesNotMatch(vendasPage, /Valor de venda/, "vendas list must not use Valor de venda header");

const vendasBodyBlock = vendasPage.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0] ?? "";
assert.ok(vendasBodyBlock, "vendas tbody missing");

assertOrderedSubstrings(
  vendasBodyBlock,
  [
    'className="vendas-page__col-venda',
    'className="vendas-page__col-thumb',
    'className="vendas-page__col-product',
    'className="vendas-page__col-account',
    'className="vendas-page__col-channel',
    'className="vendas-page__col-sale-value',
    'className="vendas-page__col-fee',
    'className="vendas-page__col-shipping',
    'className="vendas-page__col-payout',
    'className="vendas-page__col-cost',
    'className="vendas-page__col-tax',
    'className={`vendas-page__col-profit',
    'className={`vendas-page__col-margin',
    'className="vendas-page__col-sale-status',
  ],
  "vendas tbody columns",
);

assert.match(vendasColgroup, /col-venda[\s\S]*col-thumb[\s\S]*col-product/, "vendas colgroup thumb between venda and anuncio");

const vendasCss = read("src/styles/VendasPage.css");
assert.match(vendasCss, /col\.vendas-page__col-venda\s*\{[\s\S]*?width:\s*7\.5%;/, "vendas col-venda width 7.5% in operacao-shell");
assert.match(vendasCss, /col\.vendas-page__col-margin\s*\{[\s\S]*?width:\s*6\.75%;/, "vendas col-margin width 6.75% dedicated");
assert.doesNotMatch(
  vendasCss,
  /col\.vendas-page__col-profit,[\s\S]*?col\.vendas-page__col-margin,[\s\S]*?width:\s*5\.75%/,
  "col-margin must not share 5.75% group with profit cols",
);
assert.match(vendasCss, /thead th\.vendas-page__col-venda[\s\S]*?width:\s*7\.5%;/, "vendas desktop media col-venda 7.5%");
assert.match(vendasPage, /Lucro \(%\)/, "vendas Lucro (%) label exact");

assertOrderedSubstrings(
  vendasPage,
  [
    "vendas-page__col-venda",
    "vendas-page__col-thumb",
    "vendas-page__col-product",
    "vendas-page__col-account",
    "vendas-page__col-channel",
    "vendas-page__col-sale-value",
    "vendas-page__col-fee",
    "vendas-page__col-shipping",
    "vendas-page__col-payout",
    "vendas-page__col-cost",
    "vendas-page__col-tax",
    "vendas-page__col-profit",
    "vendas-page__col-margin",
    "vendas-page__col-sale-status",
  ],
  "vendas header columns",
);

// --- Precificações / Anúncios ---
const anunciosSrc = read("src/components/Anuncios.jsx");
const adsRowSrc = read("src/features/listings/components/AdsCatalogRow.jsx");

assert.doesNotMatch(anunciosSrc, /Preço atual/, "precificacoes header must not use Preço atual");
assert.doesNotMatch(anunciosSrc, /products-catalog__sr-only">Capa/, "list thumb header must stay unlabeled");
assert.doesNotMatch(anunciosSrc, /Valor de venda/, "list headers must not use Valor de venda");

for (const label of PRECIFICACOES_LIST_HEADER_LABELS) {
  const pattern = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(anunciosSrc, new RegExp(pattern), `precificacoes header label ${label}`);
}

assert.match(anunciosSrc, /dataCol=\{ANUNCIOS_COL\.revenue\}/, "anuncios faturamento column present");
assert.match(anunciosSrc, /dataCol=\{ANUNCIOS_COL\.avgTicket\}/, "anuncios ticket medio column present");
assert.match(anunciosSrc, />\s*Preço\s*</, "anuncios/precificacoes price label Preço");

assertOrderedSubstrings(
  anunciosSrc,
  [
    "dataCol={PRECIFICACOES_COL.listing}",
    "dataCol={PRECIFICACOES_COL.listingType}",
    "dataCol={PRECIFICACOES_COL.account}",
    "dataCol={PRECIFICACOES_COL.channel}",
    "dataCol={PRECIFICACOES_COL.sales}",
    "dataCol={PRECIFICACOES_COL.currentPrice}",
    "dataCol={PRECIFICACOES_COL.commission}",
    "dataCol={PRECIFICACOES_COL.shipping}",
    "dataCol={PRECIFICACOES_COL.payout}",
    "dataCol={PRECIFICACOES_COL.cost}",
    "dataCol={PRECIFICACOES_COL.tax}",
    "dataCol={PRECIFICACOES_COL.profitBrl}",
    "dataCol={PRECIFICACOES_COL.profitPercent}",
    "dataCol={PRECIFICACOES_COL.competitors}",
  ],
  "precificacoes header columns",
);

assertOrderedSubstrings(
  adsRowSrc,
  [
    "data-col={PRECIFICACOES_COL.listing}",
    "data-col={PRECIFICACOES_COL.listingType}",
    "data-col={PRECIFICACOES_COL.account}",
    "data-col={PRECIFICACOES_COL.channel}",
    "dataCol={PRECIFICACOES_COL.sales}",
    "dataCol={PRECIFICACOES_COL.currentPrice}",
    "dataCol={PRECIFICACOES_COL.commission}",
    "dataCol={PRECIFICACOES_COL.shipping}",
    "dataCol={PRECIFICACOES_COL.payout}",
    "dataCol={PRECIFICACOES_COL.cost}",
    "dataCol={PRECIFICACOES_COL.tax}",
    "dataCol={PRECIFICACOES_COL.profitBrl}",
    "dataCol={PRECIFICACOES_COL.profitPercent}",
    "dataCol={PRECIFICACOES_COL.competitors}",
  ],
  "precificacoes row columns",
);

assertOrderedSubstrings(
  anunciosSrc,
  [
    "dataCol={ANUNCIOS_COL.listing}",
    "dataCol={ANUNCIOS_COL.listingType}",
    "dataCol={ANUNCIOS_COL.account}",
    "dataCol={ANUNCIOS_COL.channel}",
    "dataCol={ANUNCIOS_COL.sales}",
    "dataCol={ANUNCIOS_COL.salePrice}",
    "dataCol={ANUNCIOS_COL.revenue}",
    "dataCol={ANUNCIOS_COL.payout}",
    "dataCol={ANUNCIOS_COL.avgTicket}",
    "dataCol={ANUNCIOS_COL.profitBrl}",
    "dataCol={ANUNCIOS_COL.profitPercent}",
    "dataCol={ANUNCIOS_COL.quality}",
  ],
  "anuncios header columns",
);

assertOrderedSubstrings(
  adsRowSrc,
  [
    "data-col={ANUNCIOS_COL.listing}",
    "data-col={ANUNCIOS_COL.listingType}",
    "data-col={ANUNCIOS_COL.account}",
    "data-col={ANUNCIOS_COL.channel}",
    "dataCol={ANUNCIOS_COL.sales}",
    "dataCol={ANUNCIOS_COL.salePrice}",
    "dataCol={ANUNCIOS_COL.revenue}",
    "dataCol={ANUNCIOS_COL.payout}",
    "dataCol={ANUNCIOS_COL.avgTicket}",
    "dataCol={ANUNCIOS_COL.profitBrl}",
    "dataCol={ANUNCIOS_COL.profitPercent}",
    "data-col={ANUNCIOS_COL.quality}",
  ],
  "anuncios row columns",
);

// --- Produtos ---
const productsSrc = read("src/components/Products.jsx");

assert.match(productsSrc, /dataCol=\{PRODUTOS_COL\.avgTicket\}/, "produtos ticket medio column present");
assert.match(productsSrc, /dataCol=\{PRODUTOS_COL\.payout\}[\s\S]*dataCol=\{PRODUTOS_COL\.avgTicket\}/, "produtos repasse before ticket medio in header block");

assertOrderedSubstrings(
  productsSrc.split("const catalogGridHead = ")[1]?.slice(0, 2500) ?? "",
  [
    "dataCol={PRODUTOS_COL.listings}",
    "dataCol={PRODUTOS_COL.sales}",
    "dataCol={PRODUTOS_COL.revenue}",
    "dataCol={PRODUTOS_COL.payout}",
    "dataCol={PRODUTOS_COL.avgTicket}",
    "dataCol={PRODUTOS_COL.profitBrl}",
    "dataCol={PRODUTOS_COL.profitPercent}",
    "dataCol={PRODUTOS_COL.stock}",
  ],
  "produtos header columns",
);

assertOrderedSubstrings(
  productsSrc.split("<CatalogMetricCell dataCol={PRODUTOS_COL.listings}")[1] ?? "",
  [
    "dataCol={PRODUTOS_COL.sales}",
    "dataCol={PRODUTOS_COL.revenue}",
    "dataCol={PRODUTOS_COL.payout}",
    "dataCol={PRODUTOS_COL.avgTicket}",
    "dataCol={PRODUTOS_COL.profitBrl}",
    "dataCol={PRODUTOS_COL.profitPercent}",
    "dataCol={PRODUTOS_COL.stock}",
  ],
  "produtos row columns",
);

// --- Concorrência ---
const concorrenciaSrc = read("src/pages/ConcorrenciaPage.jsx");
assert.match(concorrenciaSrc, /products-catalog__cell--thumb[\s\S]*Anúncio/, "concorrencia thumb before anuncio");
assert.match(concorrenciaSrc, /Concorrente \$\{idx \+ 1\}/, "concorrencia competitor header template");
assert.match(concorrenciaSrc, /COMPETITOR_COLUMNS = 6/, "concorrencia six competitor columns");

assert.deepEqual(VENDAS_LIST_HEADER_LABELS.length, 13);
assert.deepEqual(PRECIFICACOES_LIST_HEADER_LABELS.length, 14);
assert.deepEqual(ANUNCIOS_LIST_HEADER_LABELS.length, 12);
assert.deepEqual(PRODUTOS_LIST_HEADER_LABELS.length, 9);

console.log("test_list_columns_canonical_order_unit: PASS");
