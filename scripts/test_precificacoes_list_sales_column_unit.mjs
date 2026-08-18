import assert from "node:assert/strict";
import { PRECIFICACOES_COL } from "../src/features/listings/layout/precificacoesCatalogColumns.js";
import {
  PRECIFICACOES_LIST_HIDDEN_COLUMN_IDS,
  PRECIFICACOES_LIST_MINIMAL_COLUMN_ORDER,
} from "../src/features/listings/layout/precificacoesListColumnsConfig.js";
import {
  formatarQuantidadeVendasListaPrecificacoes,
  formatarQuantidadeVendasListaPrecificacoesDaLinha,
  lerQuantidadeVendasListaPrecificacoesParaOrdenacao,
  PRECIFICACOES_LIST_SALES_COUNT_FIELD,
} from "../src/features/listings/layout/formatPrecificacoesListSalesCount.js";
import { applyPrecificacoesCatalogFilters } from "../src/features/listings/filters/applyPrecificacoesCatalogFilters.js";
import { anuncioAtendeFiltroRapidoPrecificacoesLista } from "../src/features/listings/domain/pricingHealth/pricingHealthListClassifiers.js";

assert.equal(PRECIFICACOES_LIST_SALES_COUNT_FIELD, "salesCount");

assert.ok(!PRECIFICACOES_LIST_MINIMAL_COLUMN_ORDER.includes(PRECIFICACOES_COL.promotions));
assert.equal(PRECIFICACOES_LIST_HIDDEN_COLUMN_IDS.includes(PRECIFICACOES_COL.promotions), true);

const salesIdx = PRECIFICACOES_LIST_MINIMAL_COLUMN_ORDER.indexOf(PRECIFICACOES_COL.sales);
const profitIdx = PRECIFICACOES_LIST_MINIMAL_COLUMN_ORDER.indexOf(PRECIFICACOES_COL.profitBrl);
assert.ok(salesIdx >= 0 && profitIdx >= 0);
assert.equal(salesIdx, profitIdx - 1);

// Zero vs ausência
assert.equal(formatarQuantidadeVendasListaPrecificacoes(0), "0");
assert.equal(formatarQuantidadeVendasListaPrecificacoes(null), "—");
assert.equal(formatarQuantidadeVendasListaPrecificacoes(undefined), "—");
assert.equal(formatarQuantidadeVendasListaPrecificacoes(Number.NaN), "—");
assert.equal(formatarQuantidadeVendasListaPrecificacoes(""), "—");
assert.equal(formatarQuantidadeVendasListaPrecificacoes(1250), "1.250");

// Paridade Mais vendidos ↔ coluna VENDAS
function row(id, salesCount, financial = true) {
  return {
    id,
    salesCount,
    catalog_pricing_health_buckets: {
      offer_status_bucket: "healthy",
      projected_margin_bucket: "margin_20_29",
      promotion_bucket: "no_promotion",
      listing_type_key: "classic",
      free_shipping: false,
      financial_evaluable: financial,
      profit_brl: financial ? "10.00" : null,
      margin_pct: financial ? "20.00" : null,
    },
  };
}

const sorted = applyPrecificacoesCatalogFilters(
  [row("A", 430), row("B", 255), row("C", 198)],
  "top_sales",
).map((r) => String(r.id));

assert.deepEqual(sorted, ["A", "B", "C"]);
assert.deepEqual(
  sorted.map((id) => {
    const source = id === "A" ? row("A", 430) : id === "B" ? row("B", 255) : row("C", 198);
    return {
      id,
      sort: lerQuantidadeVendasListaPrecificacoesParaOrdenacao(source),
      display: formatarQuantidadeVendasListaPrecificacoesDaLinha(source),
    };
  }),
  [
    { id: "A", sort: 430, display: "430" },
    { id: "B", sort: 255, display: "255" },
    { id: "C", sort: 198, display: "198" },
  ],
);

// Filtros promocionais intactos
const promoRow = {
  id: "promo-1",
  salesCount: 10,
  catalog_pricing_health_buckets: {
    offer_status_bucket: "healthy",
    projected_margin_bucket: "margin_20_29",
    promotion_bucket: "active_promotion",
    listing_type_key: "classic",
    free_shipping: false,
    financial_evaluable: true,
    profit_brl: "5.00",
    margin_pct: "15.00",
  },
};
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(promoRow, "promotion_active"), true);

console.log("[test_precificacoes_list_sales_column_unit] OK");
