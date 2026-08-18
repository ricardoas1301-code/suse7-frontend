#!/usr/bin/env node

/**
 * Regressão — copy comercial da coluna esquerda do SignUp (V2 simplificado).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const marketingSource = readFileSync(join(root, "../src/components/SignupMarketingColumn.jsx"), "utf8");
const signupSource = readFileSync(join(root, "../src/components/Signup.jsx"), "utf8");
const pathsSource = readFileSync(join(root, "../src/billing/plansCatalogPaths.js"), "utf8");
const signupCssSource = readFileSync(join(root, "../src/components/Signup.css"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("signup uses isolated marketing column", /SignupMarketingColumn/.test(signupSource));
assert("plans canonical path is public /planos", /SIGNUP_PLANS_CANONICAL_PATH = PUBLIC_PLANS_PATH/.test(pathsSource));
assert(
  "marketing re-exports signup plans path",
  /export \{ SIGNUP_PLANS_CANONICAL_PATH \}/.test(marketingSource),
);
assert(
  "single top plans link",
  (marketingSource.match(/<SignupPlansLink/g) ?? []).length === 1,
);
assert(
  "plans links open new tab safely",
  /target="_blank"/.test(marketingSource) && /rel="noopener noreferrer"/.test(marketingSource),
);
assert("main title preserved", /Comece agora o seu/.test(marketingSource) && /Teste Grátis/.test(marketingSource));
assert("lead copy uses do SUSE7", /Conheça o poder do SUSE7/.test(marketingSource));
assert("lead copy not da SUSE7", !/Conheça o poder da SUSE7/.test(marketingSource));
assert(
  "free tier approved copy",
  /Comece sem cartão, sem fidelidade\. Cancele seu plano a qualquer momento\./.test(marketingSource),
);
assert("hero spacing token", /\.signup-marketing-hero[\s\S]*margin-top:\s*0/.test(signupCssSource));
assert("title to lead spacing doubled", /\.signup-main-title[\s\S]*margin:\s*0 0 24px/.test(signupCssSource));
assert("free tier to plans spacing doubled", /\.signup-free-tier[\s\S]*margin:\s*0 0 28px/.test(signupCssSource));
assert("plans link spacing increased", /\.signup-plans-link[\s\S]*margin:\s*0 0 40px/.test(signupCssSource));
assert(
  "intro paragraphs regular graphite",
  /\.signup-lead[\s\S]*font-weight:\s*400[\s\S]*color:\s*#374151/.test(signupCssSource) &&
    /\.signup-free-tier[\s\S]*font-weight:\s*400[\s\S]*color:\s*#374151/.test(signupCssSource) &&
    /\.signup-marketing-hero[\s\S]*\.signup-lead[\s\S]*#374151/.test(signupCssSource),
);
assert("first approved section present", /📊 Toda a sua operação/.test(marketingSource));
assert("removed margin section", !/💰 Venda sabendo quanto realmente está ganhando/.test(marketingSource));
assert("removed pricing section", !/🧠 Precificação inteligente/.test(marketingSource));
assert("removed footer block", !/signup-marketing-footer/.test(marketingSource));
assert("top plans link label", /Conheça todos os planos →/.test(marketingSource));
assert("uses SUSE7 naming", !/Suse7 Precifica/.test(marketingSource));
assert("form still present in signup jsx", /validarCampos/.test(signupSource) && /signup-form/.test(signupSource));
assert("left column centering wrapper", /signup-left__content/.test(marketingSource));
assert("signup back link uses shared public header", /signup-back-anchor/.test(signupSource) && /PublicBackLink/.test(signupSource));
assert("marketing column no inline back link", !/signup-back-top/.test(marketingSource));
assert("signup back anchor matches legal back padding", /\.signup-back-anchor[\s\S]*padding:\s*0 12px/.test(signupCssSource));
assert("signup no top menu bar", !/signup-page-header/.test(signupCssSource));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log("OK test_signup_marketing_unit", failures.length === 0 ? "all passed" : failures);
