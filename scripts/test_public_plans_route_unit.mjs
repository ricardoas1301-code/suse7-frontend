#!/usr/bin/env node
/**
 * Regressão — rota pública /planos e catálogo guest.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(root, "../src/App.jsx"), "utf8");
const pathsSource = readFileSync(join(root, "../src/billing/plansCatalogPaths.js"), "utf8");
const publicPageSource = readFileSync(join(root, "../src/billing/pages/PublicPlansPage.jsx"), "utf8");
const catalogSource = readFileSync(join(root, "../src/billing/components/PlansCatalogSection.jsx"), "utf8");
const planFeaturesSource = readFileSync(join(root, "../src/billing/planIncludedFeatures.js"), "utf8");
const billingRoutesSource = readFileSync(
  join(root, "../../suse7-backend/src/billing/routes/billingRoutes.js"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const plansRouteBlock =
  billingRoutesSource.match(/if \(pathNorm === "\/api\/billing\/plans"\) \{[\s\S]*?\n  \}/)?.[0] ?? "";

assert("public route registered in App", /\{ path: "\/planos", element: <PublicPlansPage \/> \}/.test(appSource));
assert("public plans path constant", /PUBLIC_PLANS_PATH = "\/planos"/.test(pathsSource));
assert("authenticated path preserved", /AUTHENTICATED_PLANS_PATH = "\/perfil\/assinatura\/planos"/.test(pathsSource));
assert("signup canonical path is public", /SIGNUP_PLANS_CANONICAL_PATH = PUBLIC_PLANS_PATH/.test(pathsSource));
assert("public page uses shared catalog", /PlansCatalogSection/.test(publicPageSource));
assert("public page no subscription hook", !/useSubscriptionStatus/.test(publicPageSource));
assert("public page no current plan badge", /currentPlan=\{null\}/.test(publicPageSource));
assert("guest cta goes to signup", /navigate\(slug \? `\/signup\?plan=/.test(publicPageSource));
assert("authenticated cta goes to profile plans", /AUTHENTICATED_PLANS_PATH/.test(publicPageSource));
assert("shared catalog component exists", /s7-billing-plans-grid/.test(catalogSource));
assert(
  "plans header positioning line in shared catalog",
  /PLANS_PAGE_POSITIONING_LINE/.test(catalogSource) &&
    /s7-billing-plans-page-header__positioning/.test(catalogSource) &&
    /do SUSE7 para organizar sua operação/.test(planFeaturesSource)
);
assert(
  "backend allows guest plans read",
  plansRouteBlock.includes("supabaseServiceRoleKey") && !plansRouteBlock.includes('code: "UNAUTHORIZED"')
);

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log("OK test_public_plans_route_unit", failures.length === 0 ? "all passed" : failures);
