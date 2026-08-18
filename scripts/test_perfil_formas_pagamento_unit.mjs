#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.1 — ordem menu Assinatura + card pai Formas de pagamento
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const navStaticPath = join(root, "../src/components/Profile/profileNavigationStatic.js");
const navConfigPath = join(root, "../src/components/Profile/profileNavigationConfig.js");
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const profileCssPath = join(root, "../src/components/Profile/Profile.css");
const billingCssPath = join(root, "../src/billing/billing.css");

const navStatic = readFileSync(navStaticPath, "utf8");
const navConfig = readFileSync(navConfigPath, "utf8");
const pageJsx = readFileSync(pagePath, "utf8");
const profileCss = readFileSync(profileCssPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function extractSubscriptionItemIds(source) {
  const groupMatch = source.match(/id:\s*"subscription"[\s\S]*?items:\s*\[([\s\S]*?)\]\s*,?\s*\}/);
  if (!groupMatch) return [];
  const ids = [...groupMatch[1].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  return ids;
}

const subscriptionIds = extractSubscriptionItemIds(navStatic);
const expectedOrder = ["my-subscription", "payment-methods", "payment-history", "plans"];

assert("canonical nav uses STATIC_PROFILE_NAVIGATION_GROUPS", navConfig.includes("STATIC_PROFILE_NAVIGATION_GROUPS"));
assert(
  "subscription menu order is canonical",
  JSON.stringify(subscriptionIds) === JSON.stringify(expectedOrder)
);
assert("my-subscription route preserved", navStatic.includes('route: "/perfil/assinatura/minha-assinatura"'));
assert("payment-methods route preserved", navStatic.includes('route: "/perfil/assinatura/formas-de-pagamento"'));
assert("payment-history route preserved", navStatic.includes('route: "/perfil/assinatura/historico"'));
assert("plans route preserved", navStatic.includes('route: "/perfil/assinatura/planos"'));

assert("page uses profile shell wrapper", pageJsx.includes('className="dados-empresa-page minha-assinatura-page'));
assert("page uses profile-card hero shell", pageJsx.includes('className="profile-card s7-minha-assinatura-hero'));
assert("header stays inside shell", /profile-card[\s\S]*s7-billing-payment-page-header/.test(pageJsx));
assert("empty state stays inside shell", /profile-card[\s\S]*PaymentMethodEmptyState/.test(pageJsx));
assert("header atualizar action removed", !pageJsx.includes(">Atualizar<"));
assert("refresh hook preserved", pageJsx.includes("refresh"));
assert("add payment method preserved", pageJsx.includes("Adicionar forma de pagamento"));
assert("checkout modal preserved outside card overlay", pageJsx.includes("<CardCheckoutModal"));
assert("billing api untouched in page", pageJsx.includes("createCardPaymentMethod"));
assert("usePaymentMethods hook preserved", pageJsx.includes("usePaymentMethods"));

assert("profile content gutter 12px for assinatura shell", profileCss.includes("--s7-empresa-page-gutter: 12px"));
assert(
  "minha-assinatura-page triggers gutter in profile-content",
  profileCss.includes(".profile-content:has(.minha-assinatura-page)")
);
assert("billing shell white card styles exist", billingCss.includes(".minha-assinatura-page .profile-card.s7-minha-assinatura-hero"));
assert("billing shell white background", billingCss.includes("background: #ffffff"));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.1 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.1 unit] OK");
