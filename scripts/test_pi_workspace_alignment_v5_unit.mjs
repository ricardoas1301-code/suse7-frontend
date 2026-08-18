/**
 * S1.PI-WORKSPACE-ALIGNMENT-V5 — gap compartilhado entre Premium e workspace direito.
 * Executar: node scripts/test_pi_workspace_alignment_v5_unit.mjs
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

const workspaceTabs = read("src/components/pricing/PricingIntelligenceWorkspaceTabs.jsx");
assert(workspaceTabs.includes("workspace-shell--simulator-tab"), "aba Precificação marcada");
assert(workspaceTabs.includes("workspace-shell--promotions-tab"), "aba Promoções intacta");
assert(workspaceTabs.includes("workspace-shell--competitors-tab"), "aba Concorrentes intacta");

const css = read("src/components/Anuncios.css");
assert(css.includes("--s7-pi-workspace-column-gap: 16px"), "token gap compartilhado");
assert(css.includes("gap: var(--s7-pi-workspace-column-gap"), "shell usa token");
assert(css.includes("10px var(--s7-pi-workspace-column-gap"), "promo/concorrentes usam token");
assert(
  css.includes("column-gap: var(--s7-pi-workspace-column-gap"),
  "Precificação usa mesmo column-gap",
);
assert(
  css.includes("grid-template-columns: var(--s7-pricing-listing-type-compare-w) minmax(0, 1fr)"),
  "Precificação grid 2 colunas alinhado",
);
assert(!css.includes("gap: var(--s7-pricing-workspace-gap, 12px)"), "gap 12px removido do cenário dual");

const piContent = read("src/components/PricingIntelligenceContent.jsx");
assert(piContent.includes("Comparativo de Ofertas S7"), "nome Comparativo preservado");
assert(!piContent.includes("comparativo-ofertas-s7-icon"), "botão Comparativo inalterado sem ícone");

console.log("test_pi_workspace_alignment_v5_unit.mjs — OK");
