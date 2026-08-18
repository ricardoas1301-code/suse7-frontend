#!/usr/bin/env node
/**
 * S1.PERFIL-PLANOS.2 — catálogo, arsenal, infinity, suporte e regressões
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(root, "../..");
const backendCatalogPath = join(repoRoot, "suse7-backend/scripts/fixtures/suse7FreshPlansCatalogBaseline.js");
const planCardPath = join(root, "../src/billing/components/PlanCard.jsx");
const plansPagePath = join(root, "../src/billing/pages/PlansPage.jsx");
const planCtaPath = join(root, "../src/billing/planCta.js");
const arsenalPath = join(root, "../src/billing/suse7CompleteArsenal.js");
const featuresPath = join(root, "../src/billing/planIncludedFeatures.js");
const supportPath = join(root, "../src/billing/planSupportChannels.js");
const arsenalModalPath = join(root, "../src/billing/components/PlansArsenalModal.jsx");
const avatarPath = join(root, "../src/billing/components/PlansPageAvatar.jsx");
const billingCssPath = join(root, "../src/billing/billing.css");
const shellTestPath = join(root, "test_perfil_planos_shell_unit.mjs");

const backendCatalog = readFileSync(backendCatalogPath, "utf8");
const planCard = readFileSync(planCardPath, "utf8");
const plansPage = readFileSync(plansPagePath, "utf8");
const planCta = readFileSync(planCtaPath, "utf8");
const arsenal = readFileSync(arsenalPath, "utf8");
const features = readFileSync(featuresPath, "utf8");
const support = readFileSync(supportPath, "utf8");
const arsenalModal = readFileSync(arsenalModalPath, "utf8");
const avatar = readFileSync(avatarPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const shellTest = readFileSync(shellTestPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const expectedOrder = ["baby", "start", "crescer", "pro", "scale", "elite", "enterprise", "infinity"];

for (const key of expectedOrder) {
  assert(`catalog contains ${key}`, backendCatalog.includes(`plan_key: "${key}"`));
}

assert("catalog has 8 plans", (backendCatalog.match(/plan_key:/g) || []).length === 8);
assert("enterprise fixed price 109900 cents", backendCatalog.includes("price_cents: 109900"));
assert("infinity quote mode", backendCatalog.includes('plan_key: "infinity"') && backendCatalog.includes('pricing_mode: "quote"'));
assert("infinity null price_cents", backendCatalog.includes("price_cents: null"));
assert("baby paid 5900 cents", backendCatalog.includes("price_cents: 5900"));
assert("elite limit 10000", backendCatalog.includes("sales_limit_monthly: 10000"));
assert("infinity range starts 20001", backendCatalog.includes("sales_range_min: 20001"));

assert("no starter/pro/ultra tiers in PlanCard", !planCard.includes("presentation.tier") && !planCard.includes("Starter") && !planCard.includes("Ultra"));
assert("shared benefits in PlanCard", planCard.includes("PLAN_INCLUDED_FEATURES") && planCard.includes("PLAN_INCLUDED_FEATURES_TITLE"));
assert("arsenal button in PlanCard", planCard.includes('type="button"') && planCard.includes("PLAN_ARSENAL_BUTTON_LABEL"));
assert("support label in PlanCard", planCard.includes("resolvePlanSupportLabel"));
assert("card flex anatomy", billingCss.includes(".s7-billing-plan-card__body") && billingCss.includes("flex-direction: column"));

assert("page copy SUSE7", plansPage.includes("PLANS_PAGE_AUXILIARY_TITLE") && plansPage.includes("PLANS_PAGE_DESCRIPTION"));
assert("single arsenal modal instance", (plansPage.match(/<PlansArsenalModal/g) || []).length === 1);
assert("avatar in grid", plansPage.includes("PlansPageAvatar"));
assert("card pai preserved", shellTest.includes("s7-planos-page") && plansPage.includes("s7-planos-hero"));

assert("infinity CTA label", planCta.includes("Falar com especialista"));
assert("selectable CTA label", planCta.includes("Escolher este plano"));
assert("quote plan checkout disabled", planCta.includes("isQuote") && planCta.includes("usesCheckout: !current && !quote"));
assert("commercial contact mailto", planCta.includes("getCommercialContactHref"));

assert("seven arsenal sections", (arsenal.match(/id: "/g) || []).length === 7);
assert("healthy sales phrase as list item", arsenal.includes("realmente saudável.") && !arsenal.includes("highlight:"));
assert("features shared source", features.includes("Precificação real e automática"));
assert("free trial label", features.includes("Teste grátis por 15 dias"));
assert("free trial baby exception", planCard.includes("isBabyPlan") && planCard.includes("PLAN_BABY_FREE_LABEL"));
assert("highlights green check", billingCss.includes(".s7-billing-plan-card__highlights li::before") && billingCss.includes("#16a34a"));
assert("support baby email", support.includes('baby: "E-mail"'));
assert("support pro email ticket", support.includes('pro: "E-mail / Ticket"'));
assert("growth highlight copy", features.includes("PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_1"));
assert("baby free label", features.includes("100% grátis"));
assert("baby free limit inline", features.includes("PLAN_BABY_SALES_LIMIT_MONTHLY") && features.includes("30"));
assert("baby sem tooltip", !planCard.includes("S7Tooltip") && !planCard.includes("PLAN_BABY_FREE_LIMIT_PREFIX"));
assert("baby limit display", readFileSync(join(root, "../src/billing/planDisplay.js"), "utf8").includes('normalizePlanKey(plan) === "baby"'));
assert("plans header growth line break", readFileSync(join(root, "../src/billing/components/PlansCatalogSection.jsx"), "utf8").includes("PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_1") && readFileSync(join(root, "../src/billing/components/PlansCatalogSection.jsx"), "utf8").includes("<br />"));
assert("no support VIP", !support.toLowerCase().includes("vip") && !planCard.toLowerCase().includes("suporte vip"));

assert("modal no cancel button", !arsenalModal.includes("Cancelar") && !arsenalModal.includes("Fechar"));
assert("modal escape + backdrop", arsenalModal.includes("useS7DialogFocus") && arsenalModal.includes("handleOverlayMouseDown"));
assert("modal declarative sections", arsenalModal.includes("SUSE7_COMPLETE_ARSENAL"));

assert("avatar asset path", avatar.includes("planos-page-avatar.png"));
assert("avatar alt text", avatar.includes("alt="));
assert("desktop grid 5 columns", billingCss.includes("repeat(5, minmax(0, 1fr))"));
assert("avatar desktop placement", billingCss.includes("grid-column: 4 / span 2"));

if (failures.length) {
  console.error("[S1.PERFIL-PLANOS.2 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_perfil_planos_catalog_unit.mjs");
