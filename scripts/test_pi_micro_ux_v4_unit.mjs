/**
 * S1.PI-RX-MICRO-UX-V4 — MLB/SKU spacing + Comparativo textual.
 * Executar: node scripts/test_pi_micro_ux_v4_unit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

const vendasCss = read("src/styles/VendasPage.css");
assert(vendasCss.includes(".vendas-sale-rayx__product-toolbar .anuncios-raiox-compare__toolbar-meta--with-copy"), "MLB inline-flex coeso");
assert(vendasCss.includes("margin-inline: 3px 5px"), "gap copiar/divisor/SKU ajustado");

const saleRayXHeader = read("src/components/sales/SaleRayXProductHeader.jsx");
assert(saleRayXHeader.includes("anuncios-raiox-compare__toolbar-meta-text"), "MLB visível");
assert(saleRayXHeader.includes("anuncios-raiox-compare__toolbar-copy"), "copiar funcional");
assert(saleRayXHeader.includes("anuncios-raiox-compare__toolbar-meta-sep"), "divisor preservado");
assert(saleRayXHeader.includes("anuncios-ad-sku-label"), "SKU visível");

const piContent = read("src/components/PricingIntelligenceContent.jsx");
assert(piContent.includes('pricingWorkspaceTab === "promotions"'), "Comparativo só Promoções");
assert(piContent.includes("Comparativo de Ofertas S7"), "texto visível restaurado");
assert(!piContent.includes("comparativo-ofertas-s7-icon"), "import ícone removido");
assert(!piContent.includes("workspace-comparativo-btn-icon"), "wrapper ícone removido");
assert(!piContent.includes("S7Tooltip"), "sem tooltip duplicado no comparativo");
assert(!piContent.includes('title="Comparativo de Ofertas S7"'), "sem title nativo");
assert(piContent.includes('aria-label="Comparativo de Ofertas S7"'), "aria-label preservado");
assert(piContent.includes("pricing-intelligence-page__workspace-tab--active"), "padrão aba ativa");
assert(piContent.includes("RaioxOfferComparisonChartModal"), "modal comparativo preservado");

const anunciosCss = read("src/components/Anuncios.css");
assert(
  anunciosCss.includes(".pricing-intelligence-page__workspace-comparativo-btn"),
  "estilo comparativo compartilhado",
);
assert(anunciosCss.includes("var(--s7-orange"), "token aba ativa reutilizado");
assert(anunciosCss.includes("font-size: 9.5px"), "fonte discretamente menor");
assert(anunciosCss.includes("min-height: 26px"), "altura compatível com abas");
assert(anunciosCss.includes("padding: 5px 10px"), "padding compacto");
assert(!anunciosCss.includes("workspace-comparativo-btn-icon"), "CSS ícone removido");

const modalCss = read("src/components/pricing/PricingIntelligenceModal.css");
assert(!modalCss.includes("workspace-comparativo-btn-icon"), "CSS ícone morto removido do modal");

console.log("test_pi_micro_ux_v4_unit.mjs — OK");
