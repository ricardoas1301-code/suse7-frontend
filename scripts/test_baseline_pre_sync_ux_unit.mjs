import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mapSupabaseAuthErrorMessage } from "../src/lib/supabaseEnv.js";
import { LISTINGS_EMPTY_CATALOG_MESSAGE } from "../src/features/listings/config/listingsPageModes.js";
import { EXECUTIVE_PANEL_EMPTY_KPI_VALUE } from "../src/components/sales/vendasExecutivePanelUx.js";
import { shouldShowOperationalTasks } from "../src/features/dashboard/operationalTasks/operationalTasksRoutes.js";

const root = dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

assert.equal(
  mapSupabaseAuthErrorMessage({ message: "Email or phone missing" }),
  "E-mail ou telefone ausente.",
);
assert.equal(
  mapSupabaseAuthErrorMessage({ message: "Missing email or phone" }),
  "E-mail ou telefone ausente.",
);

assert.equal(EXECUTIVE_PANEL_EMPTY_KPI_VALUE, "0,00");

assert.equal(
  LISTINGS_EMPTY_CATALOG_MESSAGE,
  "Importe ou vincule seus anúncios. Se já importou, aguarde a sincronização ou tente recarregar.",
);

const layoutSource = read("../src/components/Layout.jsx");
const appSource = read("../src/App.jsx");
const panelSource = read("../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
const popoverSource = read("../src/components/sales/TopRankingListingPopover.jsx");
const termsSource = read("../src/components/legal/TermsAcceptanceModal.jsx");
const contactSource = read("../src/components/ContactModal.jsx");
const contactCss = read("../src/components/ContactModal.css");
const dashboardSource = read("../src/components/Dashboard.jsx");
const dashboardCssSource = read("../src/components/Dashboard.css");
const executiveEmptySource = read("../src/components/sales/ExecutiveCardEmptyState.jsx");
const pricingPieSource = read("../src/features/dashboard/components/PricingHealthSlicedPieCard.jsx");
const productProfitSource = read("../src/features/dashboard/components/ProductProfitabilityCard.jsx");
const pricingHealthSource = read("../src/features/dashboard/components/PricingHealthCenter.jsx");
const competitionHealthSource = read("../src/features/dashboard/components/CompetitionHealthCenter.jsx");
const executiveDisplaySource = read("../src/features/sales/executiveSummaryDisplay.js");

const expectedNavOrder = [
  '"/vendas"',
  '"/precificacoes"',
  '"/promocoes"',
  '"/gestao-full"',
  '"/anuncios"',
  '"/produtos"',
  '"/concorrencia"',
  '"/central-mensagens"',
  '"/relatorios"',
];

let navCursor = 0;
for (const pathToken of expectedNavOrder) {
  const idx = layoutSource.indexOf(pathToken, navCursor);
  assert.ok(idx >= navCursor, `menu missing or out of order: ${pathToken}`);
  navCursor = idx + pathToken.length;
}

assert.ok(!layoutSource.includes("Clientes 360 S7"), "clientes nav should be removed");
assert.ok(!layoutSource.includes('"/registros"'), "registros nav should be removed");

assert.ok(appSource.includes('path: "central-mensagens"'), "central-mensagens route missing");
assert.ok(appSource.includes('path: "gestao-full"'), "gestao-full route missing");
assert.ok(appSource.includes('path: "promocoes"'), "promocoes route missing");
assert.ok(appSource.includes("element: <CentralMensagensPage />"), "central-mensagens page missing");
assert.ok(appSource.includes('path: "clientes", element: <Navigate to="/" replace />'), "clientes redirect missing");

assert.ok(panelSource.includes("s7-operational-tasks-panel__title--collapsible"), "title collapse class missing");
assert.ok(panelSource.includes("onClick={collapsible ? toggleCollapsed : undefined}"), "title toggle missing");

assert.ok(popoverSource.includes("onMouseEnter={openNow}"), "popover hover bridge missing");
assert.ok(!termsSource.includes("Abrir Termos em nova aba"), "external terms link should be removed");
assert.ok(termsSource.includes("Leia o documento integralmente para habilitar o aceite."), "terms tooltip copy missing");

assert.equal(shouldShowOperationalTasks("/promocoes"), true);
assert.equal(shouldShowOperationalTasks("/central-mensagens"), true);
assert.equal(shouldShowOperationalTasks("/gestao-full"), true);

assert.ok(contactSource.includes("contact-modal__avatar-stack"), "fale conosco avatar stack missing");
assert.ok(contactCss.includes("justify-content: center"), "fale conosco column centering missing");
assert.ok(contactCss.includes("contact-modal__success-slot"), "fale conosco feedback slot missing");
const mainColumnBlock =
  contactSource.match(
    /className="contact-modal__main">([\s\S]*?)<\/div>\s*\n\s*<aside className="contact-modal__avatar-col"/,
  )?.[1] ?? "";
assert.doesNotMatch(mainColumnBlock, /msg-error/, "fale conosco error must not render in form column");
assert.ok(
  contactSource.includes("contact-modal__success-slot") &&
    contactSource.includes("contact-modal__feedback msg-error"),
  "fale conosco error feedback slot missing",
);
assert.ok(contactSource.includes("Mensagem enviada com sucesso! 🎉"), "fale conosco success copy missing");
assert.match(
  executiveDisplaySource,
  /formatExecutiveCostMoneyOrDash[\s\S]*formatBrlFromApiString\("0"\)/,
  "cost formatter zero fallback missing",
);
assert.ok(
  executiveDisplaySource.includes("const zeroValue = formatExecutiveCostMoneyOrDash(\"0\")"),
  "cost placeholder uses zero formatter",
);
const costsPlaceholderBlock =
  executiveDisplaySource.match(/if \(!summary\) \{[\s\S]*?return EXECUTIVE_COSTS_PLACEHOLDER_METRICS[\s\S]*?\}\);\r?\n  \}/)?.[0] ??
  "";
assert.ok(costsPlaceholderBlock.includes("zeroValue"), "cost placeholder block missing");
assert.doesNotMatch(costsPlaceholderBlock, /value: "—"/);

assert.ok(executiveEmptySource.includes('name="catalog_filter_no_sales"'), "executive empty icon missing");
assert.ok(pricingPieSource.includes("ExecutiveCardEmptyState"), "pricing health empty primitive missing");
assert.ok(productProfitSource.includes("ExecutiveCardEmptyState"), "product profitability empty primitive missing");

assert.ok(
  pricingHealthSource.includes("freeShippingListings.display_value ?? formatCount(freeShippingListings.count)"),
  "pricing free shipping zero fallback missing",
);
assert.doesNotMatch(pricingHealthSource, /freeShippingListings[\s\S]*?:\s*"—"/);

assert.ok(
  competitionHealthSource.includes(": formatCount(0)"),
  "competition executive zero fallback missing",
);
assert.doesNotMatch(competitionHealthSource, /:\s*"—"/);

assert.ok(dashboardSource.includes("sectionJumpDownTargetRef={dashboardNextSectionRef}"), "dashboard top10 scroll ref missing");
assert.ok(
  dashboardCssSource.includes(".page-content:has(.vendas-page.dashboard-page)") &&
    dashboardCssSource.includes("padding: 12px") &&
    dashboardCssSource.includes("gap: var(--s7-catalog-block-gap, 12px)") &&
    dashboardCssSource.includes(".dashboard-page__top10-block"),
  "dashboard top10 outer page frame 12px",
);
assert.ok(
  !dashboardCssSource.includes(":has(> .vendas-page.dashboard-page)"),
  "dashboard frame must use descendant selector (ConfigurationAppGateShell)",
);
assert.ok(!dashboardSource.includes('navigate("/vendas")'), "dashboard top10 must not navigate to vendas");
assert.ok(!dashboardSource.includes("Ir para Vendas"), "dashboard top10 vendas tooltip removed");

console.log("test_baseline_pre_sync_ux_unit: PASS");
