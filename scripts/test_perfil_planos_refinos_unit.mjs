#!/usr/bin/env node
/**
 * S1.PERFIL-PLANOS.3 — respiro da grade, card pai, CTAs e modal Arsenal
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const planCardPath = join(root, "../src/billing/components/PlanCard.jsx");
const planCtaPath = join(root, "../src/billing/planCta.js");
const arsenalPath = join(root, "../src/billing/suse7CompleteArsenal.js");
const arsenalModalPath = join(root, "../src/billing/components/PlansArsenalModal.jsx");
const arsenalModalCssPath = join(root, "../src/billing/components/PlansArsenalModal.css");
const billingCssPath = join(root, "../src/billing/billing.css");
const plansPagePath = join(root, "../src/billing/pages/PlansPage.jsx");

const planCard = readFileSync(planCardPath, "utf8");
const planCta = readFileSync(planCtaPath, "utf8");
const arsenal = readFileSync(arsenalPath, "utf8");
const arsenalModal = readFileSync(arsenalModalPath, "utf8");
const arsenalModalCss = readFileSync(arsenalModalCssPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const plansPage = readFileSync(plansPagePath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("selectable CTA label constant", planCta.includes('PLAN_SELECT_CTA_LABEL = "Escolher este plano"'));
assert("infinity keeps specialist CTA", planCta.includes('"Falar com especialista"'));
assert("changeKind preserved for downgrade", planCta.includes('changeKind') && planCta.includes('"downgrade"'));
assert("usesCheckout preserved", planCta.includes("usesCheckout: !current && !quote && changeKind !== \"downgrade\""));

assert("current plan status element", planCard.includes("s7-billing-plan-card__current-status") && planCard.includes('aria-current="true"'));
assert("current plan no action button", planCard.includes("cta.isCurrent ?") && !planCard.includes("disabled={cta.disabled}"));
assert("badge seu plano preserved", planCard.includes("s7-billing-plan-card__pill"));
assert("card footer with margin auto pattern", planCard.includes("s7-billing-plan-card__footer") && billingCss.includes(".s7-billing-plan-card__footer"));

assert("grid row gap explicit", billingCss.includes("row-gap: 20px"));
assert("grid explicit row placement desktop", billingCss.includes("nth-child(-n + 5)") && billingCss.includes("nth-child(n + 6):nth-child(-n + 8)"));
assert("planos hero auto height", billingCss.includes(".s7-planos-page .profile-card.s7-planos-hero") && billingCss.includes("min-height: auto"));
assert("planos billing page auto height", billingCss.includes(".s7-planos-page .s7-billing-page") && billingCss.includes("min-height: auto"));
assert("planos card min-height auto", billingCss.includes(".s7-planos-page .s7-billing-plan-card") && billingCss.includes("min-height: auto"));
assert("no negative margin hack in planos grid", !billingCss.includes("margin-top: -") && !billingCss.includes("translateY("));
assert("avatar inside grid row 2", billingCss.includes(".s7-billing-plans-page-avatar") && billingCss.includes("grid-row: 2"));
assert("5 column desktop preserved", billingCss.includes("repeat(5, minmax(0, 1fr))"));
assert("hero padding bottom 12px", billingCss.includes("padding-bottom: 12px"));

assert("healthy phrase as list item", arsenal.includes("realmente saudável.") && !arsenal.includes("highlight:"));
assert("no highlight render in modal", !arsenalModal.includes("highlight") && !arsenalModalCss.includes("__highlight"));
assert("modal body top spacing", arsenalModalCss.includes("padding-top: 16px"));

assert("checkout handlers unchanged", plansPage.includes("changeKind === \"downgrade\"") && plansPage.includes("confirmPaidCheckout"));
assert("no migration in frontend mission scope", !plansPage.includes("migration"));

if (failures.length) {
  console.error("[S1.PERFIL-PLANOS.3 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_perfil_planos_refinos_unit.mjs");
