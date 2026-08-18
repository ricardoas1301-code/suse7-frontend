#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.7 — grid 2 colunas + avatar ancorado + mensagem duplicidade
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  resolveBillingCardErrorMessage,
  PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE,
  CARD_COMMUNICATION_ERROR_MESSAGE,
} from "../src/billing/billingCheckoutErrors.js";

const root = dirname(fileURLToPath(import.meta.url));
const billingCssPath = join(root, "../src/billing/billing.css");
const layoutPath = join(root, "../src/billing/components/PaymentMethodsBodyLayout.jsx");
const errorsPath = join(root, "../src/billing/billingCheckoutErrors.js");

const billingCss = readFileSync(billingCssPath, "utf8");
const layoutJsx = readFileSync(layoutPath, "utf8");
const errorsJs = readFileSync(errorsPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("payment list grid two columns", billingCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"));
assert("payment list mobile single column", /max-width:\s*900px[\s\S]*\.s7-billing-payment-list[\s\S]*grid-template-columns:\s*1fr/.test(billingCss));
assert("card fills grid cell", billingCss.includes(".s7-billing-payment-card") && billingCss.includes("width: 100%"));
assert("card no longer uses 60 percent width", !billingCss.includes("width: 60%"));
assert("shell aligns top", /\.s7-billing-payment-shell\s*\{[\s\S]*?align-items:\s*start/.test(billingCss));
assert("avatar align self start", billingCss.includes(".s7-billing-payment-shell__avatar") && billingCss.includes("align-self: start"));
assert("avatar flex start", /\.s7-billing-payment-shell__avatar\s*\{[\s\S]*?align-items:\s*flex-start/.test(billingCss));
assert("avatar object position top", billingCss.includes("object-position: top center"));
assert("avatar block no fixed positioning", !/\.s7-billing-payment-shell__avatar[\s\S]*position:\s*fixed/.test(billingCss));
assert("avatar block no translateY", !/\.s7-billing-payment-shell__avatar[\s\S]*translateY/.test(billingCss));
assert("layout component preserved", layoutJsx.includes("s7-billing-payment-shell__avatar"));

assert(
  "duplicate message exact copy",
  errorsJs.includes("Não foi possível cadastrar este cartão, pois ele já está registrado como forma de pagamento nesta conta")
);
assert("duplicate resolves by domain code", errorsJs.includes('code === "payment_method_already_exists"'));
assert("duplicate resolves by http 409", errorsJs.includes("res.status === 409"));
assert(
  "409 duplicate message",
  resolveBillingCardErrorMessage({
    ok: false,
    status: 409,
    data: { code: "PAYMENT_METHOD_ALREADY_EXISTS", message: "Este cartão já está cadastrado." },
  }) === PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE
);
assert(
  "409 without code still maps duplicate",
  resolveBillingCardErrorMessage({
    ok: false,
    status: 409,
    data: { message: "conflict" },
  }) === PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE
);
assert(
  "communication fallback preserved for network",
  resolveBillingCardErrorMessage({ ok: false, status: 0, connectionError: true }) ===
    CARD_COMMUNICATION_ERROR_MESSAGE
);
assert(
  "duplicate not communication fallback",
  resolveBillingCardErrorMessage({
    ok: false,
    status: 409,
    data: { code: "PAYMENT_METHOD_ALREADY_EXISTS" },
  }) !== CARD_COMMUNICATION_ERROR_MESSAGE
);

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.7 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.7 unit] OK");
