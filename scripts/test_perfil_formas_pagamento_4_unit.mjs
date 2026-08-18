#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.4 — card cadastrado + centralização modal
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const cardPath = join(root, "../src/billing/components/PaymentMethodCard.jsx");
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const modalPath = join(root, "../src/billing/components/CardCheckoutModal.jsx");
const modalCssPath = join(root, "../src/billing/components/CardCheckoutModal.css");
const billingCssPath = join(root, "../src/billing/billing.css");

const cardJsx = readFileSync(cardPath, "utf8");
const pageJsx = readFileSync(pagePath, "utf8");
const modalJsx = readFileSync(modalPath, "utf8");
const modalCss = readFileSync(modalCssPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("gateway label removed from card ui", !cardJsx.includes("<dt>Gateway</dt>"));
assert("provider field not rendered in card", !cardJsx.includes("method.provider"));
assert("card icon increased to 36", cardJsx.includes("CreditCard size={36}"));
assert("card icon wrapper class", cardJsx.includes("s7-billing-payment-card__icon--card"));
assert("brand vertical center", billingCss.includes(".s7-billing-payment-card__brand") && billingCss.includes("align-items: center"));
assert("desktop card grid two columns", billingCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"));
assert("card width fills grid cell", billingCss.includes(".s7-billing-payment-card") && billingCss.includes("width: 100%"));
assert("mobile card width 100 percent", billingCss.includes("@media (max-width: 900px)") && billingCss.includes(".s7-billing-payment-card") && billingCss.includes("width: 100%"));
assert("titular preserved", cardJsx.includes("Titular"));
assert("validade preserved", cardJsx.includes("Validade"));
assert("badges preserved", cardJsx.includes("Padrão"));
assert("actions preserved", cardJsx.includes("actions.makeDefault") && cardJsx.includes("actions.remove"));
assert("actions preserved", cardJsx.includes("actions.makeDefault") && cardJsx.includes("actions.remove"));

assert("atualizar still absent", !pageJsx.includes(">Atualizar<"));
assert("modal centers below topnav", modalCss.includes("--s7-topnav-bar-height"));
assert("modal vertical center flex", modalCss.includes("align-items: center"));
assert("modal runtime topnav aware", modalJsx.includes("obterAlturaTopNavPx"));
assert("modal fit fallback when overflow", modalJsx.includes('sheet.style.alignItems = cabeNaViewport ? "center" : "flex-start"'));
assert("save mode 20px spacing preserved", modalCss.includes("margin-top: 20px"));
assert("modal scale runtime preserved", modalJsx.includes("aplicarEscalaModal"));
assert("scroll lock preserved", modalJsx.includes('document.body.style.overflow = "hidden"'));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.4 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.4 unit] OK");
