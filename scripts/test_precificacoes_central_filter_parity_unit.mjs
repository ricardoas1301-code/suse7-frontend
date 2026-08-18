import assert from "node:assert/strict";
import {
  montarDistribuicaoMargemProjetada,
  montarDistribuicaoPromocoesAnuncios,
  montarDistribuicaoStatusOferta,
} from "../../suse7-backend/src/domain/pricing/health/pricingHealthBucketEngine.js";
import { montarBucketsAnuncioListaPrecificacao } from "../../suse7-backend/src/domain/pricing/health/buildListingCatalogPricingHealthBuckets.js";
import {
  PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET,
} from "../src/features/listings/domain/pricingHealth/pricingHealthConstants.js";
import { anuncioAtendeFiltroRapidoPrecificacoesLista } from "../src/features/listings/domain/pricingHealth/pricingHealthListClassifiers.js";
import Decimal from "decimal.js";

function snapshot(overrides = {}) {
  return {
    marketplace_listing_id: overrides.marketplace_listing_id ?? "uuid-default",
    external_listing_id: overrides.external_listing_id ?? "MLB-DEFAULT",
    has_result: overrides.has_result ?? true,
    margin_pct_decimal:
      overrides.margin_pct_decimal !== undefined
        ? overrides.margin_pct_decimal
        : new Decimal(String(overrides.margin_pct ?? "15")),
    margin_pct: overrides.margin_pct ?? "15",
    profit_brl_decimal:
      overrides.profit_brl_decimal !== undefined
        ? overrides.profit_brl_decimal
        : overrides.has_result === false
          ? null
          : new Decimal("10"),
    listing_type_key: overrides.listing_type_key ?? "classic",
    free_shipping: overrides.free_shipping === true,
    promotion_bucket_key: overrides.promotion_bucket_key ?? "no_promotion",
  };
}

const fixtures = [
  snapshot({ marketplace_listing_id: "1", margin_pct: "35", margin_pct_decimal: new Decimal("35"), promotion_bucket_key: "active_promotion", listing_type_key: "premium", free_shipping: true }),
  snapshot({ marketplace_listing_id: "2", margin_pct: "25", margin_pct_decimal: new Decimal("25"), promotion_bucket_key: "scheduled_promotion" }),
  snapshot({ marketplace_listing_id: "3", margin_pct: "15", margin_pct_decimal: new Decimal("15"), promotion_bucket_key: "available_promotion" }),
  snapshot({ marketplace_listing_id: "4", margin_pct: "7", margin_pct_decimal: new Decimal("7") }),
  snapshot({ marketplace_listing_id: "5", margin_pct: "-2", margin_pct_decimal: new Decimal("-2") }),
  snapshot({ marketplace_listing_id: "6", has_result: false, margin_pct: null, margin_pct_decimal: null, profit_brl_decimal: null }),
  snapshot({ marketplace_listing_id: "7", margin_pct: "3", margin_pct_decimal: new Decimal("3"), listing_type_key: "classic" }),
];

const rows = fixtures.map((snap) => ({
  id: snap.marketplace_listing_id,
  externalId: snap.external_listing_id,
  salesCount: 0,
  statusKey: "active",
  listingStatusRaw: "active",
  catalog_pricing_health_buckets: montarBucketsAnuncioListaPrecificacao(snap),
}));

function contarFiltro(filterId) {
  return rows.filter((row) => anuncioAtendeFiltroRapidoPrecificacoesLista(row, filterId)).length;
}

function contarCentral(dist, bucketKey) {
  return dist.distribution.find((b) => b.key === bucketKey)?.count ?? 0;
}

const statusDist = montarDistribuicaoStatusOferta(fixtures);
const marginDist = montarDistribuicaoMargemProjetada(fixtures);
const promoDist = montarDistribuicaoPromocoesAnuncios(fixtures);

const parityMatrix = [
  ["STATUS DA OFERTA", "Saudável", contarCentral(statusDist, "healthy"), contarFiltro("offer_status_healthy")],
  ["STATUS DA OFERTA", "Atenção", contarCentral(statusDist, "attention"), contarFiltro("offer_status_attention")],
  ["STATUS DA OFERTA", "Crítico", contarCentral(statusDist, "critical"), contarFiltro("offer_status_critical")],
  ["STATUS DA OFERTA", "Sem dados", contarCentral(statusDist, "no_data"), contarFiltro("offer_status_no_data")],
  ["MARGEM PROJETADA", "Margem ≥30%", contarCentral(marginDist, "margin_30_plus"), contarFiltro("projected_margin_30_plus")],
  ["MARGEM PROJETADA", "Margem 20–29%", contarCentral(marginDist, "margin_20_29"), contarFiltro("projected_margin_20_29")],
  ["MARGEM PROJETADA", "Margem 10–19%", contarCentral(marginDist, "margin_10_19"), contarFiltro("projected_margin_10_19")],
  ["MARGEM PROJETADA", "Margem 0–9%", contarCentral(marginDist, "margin_0_9"), contarFiltro("projected_margin_0_9")],
  ["MARGEM PROJETADA", "Prejuízo", contarCentral(marginDist, "loss"), contarFiltro("projected_margin_loss")],
  ["MARGEM PROJETADA", "Sem dados", contarCentral(marginDist, "no_data"), contarFiltro("projected_margin_no_data")],
  ["PROMOÇÕES", "Em promoção", contarCentral(promoDist, "active_promotion"), contarFiltro("promotion_active")],
  ["PROMOÇÕES", "Promoção programada", contarCentral(promoDist, "scheduled_promotion"), contarFiltro("promotion_scheduled")],
  ["PROMOÇÕES", "Disponíveis", contarCentral(promoDist, "available_promotion"), contarFiltro("promotion_available")],
  ["PROMOÇÕES", "Sem promoção", contarCentral(promoDist, "no_promotion"), contarFiltro("promotion_none")],
  ["TIPO", "Clássico", rows.filter((r) => r.catalog_pricing_health_buckets.listing_type_key === PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET.listing_type_classic).length, contarFiltro("listing_type_classic")],
  ["TIPO", "Premium", rows.filter((r) => r.catalog_pricing_health_buckets.listing_type_key === PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET.listing_type_premium).length, contarFiltro("listing_type_premium")],
  ["LOGÍSTICA", "Frete grátis", rows.filter((r) => r.catalog_pricing_health_buckets.free_shipping === true).length, contarFiltro("logistics_free_shipping")],
];

for (const [group, kpi, central, filter] of parityMatrix) {
  assert.equal(
    filter,
    central,
    `${group} / ${kpi}: Central=${central} Filtro=${filter}`,
  );
}

// Promoções — cada bucket distinto (não aceitar paridade acidental com zeros).
assert.equal(contarFiltro("promotion_active"), 1);
assert.equal(contarFiltro("promotion_scheduled"), 1);
assert.equal(contarFiltro("promotion_available"), 1);
assert.equal(contarFiltro("promotion_none"), 4);

// Bucket canônico imune a drift de valores brutos na row.
const driftRow = {
  id: "drift",
  catalog_pricing_health_buckets: {
    offer_status_bucket: "healthy",
    projected_margin_bucket: PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_10_19,
    promotion_bucket: PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET.promotion_none,
    listing_type_key: "classic",
    free_shipping: false,
    financial_evaluable: true,
    profit_brl: "1.00",
    margin_pct: "99.99",
  },
};
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(driftRow, "projected_margin_30_plus"), false);
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(driftRow, "projected_margin_10_19"), true);

console.log("[test_precificacoes_central_filter_parity_unit] OK —", parityMatrix.length, "KPIs com diferença 0");
