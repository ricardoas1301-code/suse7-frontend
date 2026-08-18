#!/usr/bin/env node
/**
 * S1.PERFIL-PLANOS.1 — card pai + respiro 12px (paridade Perfil)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PlansPage.jsx");
const billingCssPath = join(root, "../src/billing/billing.css");
const profileCssPath = join(root, "../src/components/Profile/Profile.css");

const pageJsx = readFileSync(pagePath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const profileCss = readFileSync(profileCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("page uses profile shell classes", pageJsx.includes('className="dados-empresa-page minha-assinatura-page s7-planos-page"'));
assert("page uses white parent card", pageJsx.includes('className="profile-card s7-minha-assinatura-hero s7-planos-hero"'));
assert("header inside parent card", /profile-card[\s\S]*Planos/.test(pageJsx));
assert("plans grid inside parent card", /profile-card[\s\S]*s7-billing-plans-grid/.test(pageJsx));
assert("plans page intro copy", pageJsx.includes("PLANS_PAGE_AUXILIARY_TITLE"));
assert("checkout modals outside parent card", /profile-card[\s\S]*<\/div>\s*\{selectedPlan && cardApproved/.test(pageJsx));
assert("pix modal outside parent card", /s7-planos-hero[\s\S]*<\/div>[\s\S]*<PixCheckoutModal/.test(pageJsx));
assert("plan card component preserved", pageJsx.includes("<PlanCard"));
assert("12px gutter token preserved", profileCss.includes("--s7-empresa-page-gutter: 12px"));
assert("minha-assinatura shell css preserved", billingCss.includes(".minha-assinatura-page .profile-card.s7-minha-assinatura-hero"));
assert("planos hero overflow visible", billingCss.includes(".s7-planos-page .profile-card.s7-planos-hero"));
assert("plans grid margin bottom reset inside shell", billingCss.includes(".s7-planos-page .s7-billing-plans-grid"));

if (failures.length) {
  console.error("[S1.PERFIL-PLANOS.1 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_perfil_planos_shell_unit.mjs");
