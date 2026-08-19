#!/usr/bin/env node
/**
 * Navegação pública — Sign Up → Planos (same-tab) + header canônico em /planos.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

function read(relPath) {
  return readFileSync(join(feRoot, relPath), "utf8");
}

const signupMarketing = read("src/components/SignupMarketingColumn.jsx");
const publicPlans = read("src/billing/pages/PublicPlansPage.jsx");
const publicPlansCss = read("src/billing/pages/PublicPlansPage.css");
const publicLegalHeader = read("src/components/legal/PublicLegalHeader.jsx");
const appSource = read("src/App.jsx");

assert.doesNotMatch(signupMarketing, /target="_blank"/, "signup plans link must not open new tab");
assert.doesNotMatch(signupMarketing, /window\.open/, "signup plans link must not use window.open");
assert.match(signupMarketing, /to=\{SIGNUP_PLANS_CANONICAL_PATH\}|to="\/planos"/, "signup plans link navigates to /planos");
assert.match(signupMarketing, /from "react-router-dom"/, "signup plans link uses SPA navigation");

assert.doesNotMatch(publicPlans, /Voltar ao cadastro/, "isolated back-to-signup link removed");
assert.match(publicPlans, /PublicLegalHeader/, "public plans uses canonical public header");
assert.doesNotMatch(publicPlans, /BillingProtectedRoute|protectPremiumRoute|AuthOutlet/, "public plans must not add auth gate");

assert.match(publicLegalHeader, /Contato/, "header has Contato");
assert.match(publicLegalHeader, /to="\/login"/, "header has Login");
assert.match(publicLegalHeader, /to="\/signup"/, "header has Teste grátis");
assert.match(publicLegalHeader, /PublicBackLink/, "header has Voltar");

assert.match(publicPlans, /public-legal-container/, "plans page uses legal container spacing");
assert.match(publicPlansCss, /s7-public-plans-page__card/, "plans main card preserved");

const legalCss = read("src/components/legal/publicLegalPage.css");
assert.match(
  legalCss,
  /padding:\s*calc\(var\(--public-legal-header-height,\s*60px\)\s*\+\s*12px\)/,
  "12px respiro below public header",
);

assert.ok(appSource.includes('{ path: "/planos", element: <PublicPlansPage /> }'), "planos remains public route");

console.log("test_public_plans_navigation_unit: PASS");
