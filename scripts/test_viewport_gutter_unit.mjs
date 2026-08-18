#!/usr/bin/env node
/**
 * Regressão — gutter externo 12px (SignUp + /planos público).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const signupCss = readFileSync(join(root, "../src/components/Signup.css"), "utf8");
const publicPlansCss = readFileSync(join(root, "../src/billing/pages/PublicPlansPage.css"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert(
  "signup mobile 12px gutter",
  /\.signup-container[\s\S]*--signup-gutter-inline-start:\s*12px/.test(signupCss) &&
    !/padding:\s*12px clamp\(12px,\s*3vw,\s*24px\)/.test(signupCss)
);

assert(
  "signup desktop asymmetric gutter copy 43px form 12px",
  /--signup-gutter-inline-start:\s*43px/.test(signupCss) &&
    /--signup-gutter-inline-end:\s*12px/.test(signupCss)
);

assert(
  "signup desktop space-between layout",
  /@media \(min-width:\s*951px\)[\s\S]*\.signup-container[\s\S]*justify-content:\s*space-between/.test(signupCss)
);

assert(
  "signup desktop uses space-between not center",
  /@media \(min-width:\s*951px\)[\s\S]*\.signup-container[\s\S]*justify-content:\s*space-between/.test(
    signupCss
  )
);

assert(
  "signup form width preserved",
  /\.signup-right[\s\S]*max-width:\s*620px/.test(signupCss)
);

assert(
  "public plans page 12px gutter",
  /\.s7-public-plans-page[\s\S]*padding:\s*12px/.test(publicPlansCss)
);

assert(
  "public plans no narrow centered container",
  /\.s7-public-plans-page__inner[\s\S]*max-width:\s*none/.test(publicPlansCss) &&
    !/max-width:\s*72rem/.test(publicPlansCss)
);

assert(
  "public plans billing page full width",
  /\.s7-public-plans-page \.s7-billing-page[\s\S]*max-width:\s*none/.test(publicPlansCss)
);

assert(
  "public plans back spacing",
  /\.s7-public-plans-page__back[\s\S]*margin:\s*0 0 12px/.test(publicPlansCss)
);

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log("OK test_viewport_gutter_unit", failures.length === 0 ? "all passed" : failures);
