#!/usr/bin/env node
/**
 * Modal cadastro cartão — preenchimento vertical com 12px de respiro (save mode)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const modalJsx = readFileSync(join(root, "../src/billing/components/CardCheckoutModal.jsx"), "utf8");
const modalCss = readFileSync(join(root, "../src/billing/components/CardCheckoutModal.css"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("save mode viewport fill class", modalJsx.includes("s7-billing-card-checkout-sheet--viewport-fill"));
assert("save mode skips runtime zoom", /isSaveMode\) return/.test(modalJsx));
assert("viewport gutter 12px", modalCss.includes("--s7-billing-card-checkout-viewport-gutter-y: 12px"));
assert("panel height uses viewport minus gutters", modalCss.includes("var(--s7-billing-card-checkout-viewport-gutter-y, 12px) * 2"));
assert("form card grows in fill mode", modalCss.includes(".s7-billing-card-checkout-sheet--viewport-fill .s7-billing-card-checkout__form-card"));
assert("no fixed 380 max in fill mode", /viewport-fill[\s\S]*max-height:\s*none/.test(modalCss));
assert("payment block density 6 percent", modalCss.includes("--s7-card-checkout-payment-density: 0.94"));
assert("form body no scroll in fill mode", /viewport-fill[\s\S]*form-body[\s\S]*overflow-y:\s*hidden/.test(modalCss));

if (failures.length) {
  console.error("[formas-pagamento modal viewport unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[formas-pagamento modal viewport unit] OK");
