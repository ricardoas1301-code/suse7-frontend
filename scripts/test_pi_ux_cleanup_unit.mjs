/**
 * S1.RX-SALE-PI-UX-CLEANUP-V3 — limpeza Raio-X + PI toolbar + aba Promoções.
 * Executar: node scripts/test_pi_ux_cleanup_unit.mjs
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

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

const saleRayXHeader = read("src/components/sales/SaleRayXProductHeader.jsx");
assert(!saleRayXHeader.includes("precifica-s7-icon"), "Raio-X sem ícone PI S7");
assert(!saleRayXHeader.includes("openPricingIntelligenceInNewTab"), "Raio-X sem deep link helper");
assert(!saleRayXHeader.includes("comparativo-ofertas-s7-icon"), "Raio-X sem Comparativo");
assert(!saleRayXHeader.includes("Precificação Inteligente S7"), "Raio-X sem tooltip PI");
assert(saleRayXHeader.includes("anuncios-raiox-compare__toolbar-meta-text"), "MLB permanece");
assert(saleRayXHeader.includes("anuncios-ad-sku-label"), "SKU permanece");
assert(saleRayXHeader.includes("anuncios-raiox-compare__toolbar-meta--with-copy"), "alinhamento MLB/SKU");

const saleDetail = read("src/components/sales/SaleDetailModal.jsx");
assert(!saleDetail.includes("RaioxOfferComparisonChartModal"), "SaleDetailModal sem comparativo");
assert(!saleDetail.includes("listingInternalId"), "SaleDetailModal sem props PI");

assert(!fileExists("src/utils/openPricingIntelligenceInNewTab.js"), "openPricingIntelligenceInNewTab removido");
assert(
  !fileExists("src/features/listings/pricing-intelligence/buildPricingIntelligenceDeepLink.js"),
  "buildPricingIntelligenceDeepLink removido",
);

const anuncios = read("src/components/Anuncios.jsx");
assert(!anuncios.includes("parsePricingIntelligenceDeepLink"), "Anuncios sem parse deep link");
assert(!anuncios.includes("piDeepLinkConsumedRef"), "Anuncios sem ref deep link");
assert(!anuncios.includes("useSearchParams"), "Anuncios sem useSearchParams deep link");
assert(anuncios.includes("openPricingIntelligenceModal"), "Anuncios mantém abertura PI na grid");

const piContent = read("src/components/PricingIntelligenceContent.jsx");
assert(piContent.includes('pricingWorkspaceTab === "promotions"'), "Comparativo condicional promoções");
assert(piContent.includes('aria-label="Comparativo de Ofertas S7"'), "aria-label preservado");
assert(!piContent.includes('title="Comparativo de Ofertas S7"'), "sem title nativo duplicado");
assert(!piContent.includes('data-tip="Comparativo de Ofertas S7"'), "sem s7-tip duplicado no botão");
assert(piContent.includes("RaioxOfferComparisonChartModal"), "modal comparativo preservado");

const promoPicker = read("src/components/pricing/PricingIntelligencePromotionsCompactPicker.jsx");
assert(
  !promoPicker.includes("Compare a promoção selecionada nos modelos Clássico e Premium."),
  "frase auxiliar removida",
);
assert(!promoPicker.includes("promotions-compare-hint"), "elemento hint removido");

const modalCss = read("src/components/pricing/PricingIntelligenceModal.css");
assert(modalCss.includes("min-height: 32px"), "toolbar altura estável");
assert(!modalCss.includes("workspace-comparativo-btn-icon"), "sem CSS de ícone no modal");

const promoCss = read("src/components/pricing/PricingIntelligencePromotionsPanel.css");
assert(!promoCss.includes("promotions-compare-hint"), "CSS hint removido");

console.log("test_pi_ux_cleanup_unit.mjs — OK");
