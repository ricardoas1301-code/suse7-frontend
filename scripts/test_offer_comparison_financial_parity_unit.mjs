/**
 * S1.COMPARATIVO-OFERTAS-S7-FINANCIAL-PARITY-AND-UX-V1
 * Paridade financeira do Comparativo (adapter + seleção listing type).
 * Executar: node scripts/test_offer_comparison_financial_parity_unit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approx(actual, expected, tolerance = 0.02) {
  return Math.abs(actual - expected) <= tolerance;
}

const adapterUrl = pathToFileURL(
  path.join(root, "src/components/rayx/offerComparisonFinancialAdapter.js"),
).href;

const {
  adaptarCenarioGraficoComparativo,
  classificarSaudeMargemComparativo,
  extrairLucroMargemNumericoComparativo,
  resolverListingTypeComparativoOfertas,
  selecionarResultadoFinanceiroPorListingType,
} = await import(adapterUrl);

const EXPECTED_PREMIUM = [
  { key: "baseline", profit: 13.79, margin: 17.48, health: "good" },
  { key: "07.07", profit: 12.5, margin: 16.33, health: "good" },
  { key: "inverno", profit: 11.62, margin: 15.5, health: "good" },
  { key: "julho", profit: 11.62, margin: 15.5, health: "good" },
  { key: "aumente", profit: 7.33, margin: 10.93, health: "good" },
  { key: "top", profit: 6.24, margin: 9.59, health: "good" },
  { key: "lightning", profit: 1.03, margin: 1.86, health: "regular" },
];

function buildSimScenario(profit, margin, price) {
  return {
    marketplace: { sale_price_brl: String(price) },
    result: { profit_brl: profit.toFixed(2), margin_pct: margin.toFixed(2) },
  };
}

function buildSourceScenario(id, name) {
  return {
    scenario_id: id,
    promotion_name: name,
    is_baseline: id === "baseline",
    result: { profit_brl: "29.57", margin_pct: "37.48" },
  };
}

/** Listing PREMIUM — INSPIRAZZO / MLB6487881250 */
const premiumRow = {
  externalId: "MLB6487881250",
  sku: "2035",
  listingTypeLabel: "Premium",
  product_card_metrics: { listingType: "gold_pro" },
};

const listingTypeRes = resolverListingTypeComparativoOfertas(premiumRow);
assert(listingTypeRes.ok === true, "listing PREMIUM detectado");
assert(listingTypeRes.listingType === "premium", "tipo premium");

const classicScenario = buildSimScenario(17.74, 22.48, 78.9);
const premiumScenario = buildSimScenario(13.79, 17.48, 78.9);

const selectedPremium = selecionarResultadoFinanceiroPorListingType({
  classicScenario,
  premiumScenario,
  listingType: "premium",
});
assert(selectedPremium.scenario?.result?.profit_brl === "13.79", "seleção PREMIUM usa premium");

const selectedClassic = selecionarResultadoFinanceiroPorListingType({
  classicScenario,
  premiumScenario,
  listingType: "classic",
});
assert(selectedClassic.scenario?.result?.profit_brl === "17.74", "seleção CLÁSSICO usa classic");

const missingType = resolverListingTypeComparativoOfertas({});
assert(missingType.ok === false, "tipo ausente → indisponível explícito");
assert(missingType.reason === "listing_type_indisponivel", "motivo listing_type_indisponivel");

const ambiguousType = resolverListingTypeComparativoOfertas({ listingTypeLabel: "Anúncio especial" });
assert(ambiguousType.ok === false, "tipo ambíguo → indisponível");

const prices = [78.9, 76.53, 74.95, 74.95, 67.06, 65.05, 55.48];
for (let i = 0; i < EXPECTED_PREMIUM.length; i += 1) {
  const exp = EXPECTED_PREMIUM[i];
  const sim = buildSimScenario(exp.profit, exp.margin, prices[i]);
  const src = buildSourceScenario(exp.key, exp.key);
  const adapted = adaptarCenarioGraficoComparativo(src, sim, "premium");
  assert(adapted != null, `adaptador retorna cenário ${exp.key}`);
  const nums = extrairLucroMargemNumericoComparativo(adapted);
  assert(approx(nums.profit, exp.profit), `${exp.key} profit esperado ${exp.profit}, got ${nums.profit}`);
  assert(approx(nums.margin, exp.margin), `${exp.key} margin esperado ${exp.margin}, got ${nums.margin}`);
  const health = classificarSaudeMargemComparativo(String(exp.margin));
  assert(health === exp.health, `${exp.key} saúde ${exp.health}, got ${health}`);
}

assert(classificarSaudeMargemComparativo("1.86") === "regular", "relâmpago 1.86% → regular");
assert(classificarSaudeMargemComparativo("17.48") === "good", "preço 17.48% → good");

const modal = fs.readFileSync(path.join(root, "src/components/rayx/RaioxOfferComparisonChartModal.jsx"), "utf8");
assert(modal.includes("useOfferComparisonChartScenarios"), "modal usa hook de paridade");
assert(modal.includes("comparativo-ofertas-s7-icon"), "imagem institucional no modal");
assert(modal.includes("anuncios-raiox-chart-mini__body-illustration"), "layout imagem à direita");
assert(modal.includes("context-row--compact-ml-sku"), "MLB/SKU compacto");

const piContent = fs.readFileSync(path.join(root, "src/components/PricingIntelligenceContent.jsx"), "utf8");
assert(piContent.includes("configuracaoFinanceira={configuracaoFinanceiraSimulacao}"), "PI passa config financeira ao modal");
assert(!piContent.includes("useOfferComparisonChartScenarios"), "hook não invade PI promo logic");

const anunciosCss = fs.readFileSync(path.join(root, "src/components/Anuncios.css"), "utf8");
assert(anunciosCss.includes("context-row--compact-ml-sku"), "CSS MLB/SKU comparativo");
assert(anunciosCss.includes("body-inner"), "grid gráfico + imagem");

console.log("test_offer_comparison_financial_parity_unit.mjs — OK");
