#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.6 — modal remoção + multicartões + duplicidade
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const cardPath = join(root, "../src/billing/components/PaymentMethodCard.jsx");
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const checkoutModalPath = join(root, "../src/billing/components/CardCheckoutModal.jsx");
const cardFormPath = join(root, "../src/billing/cardFormUi.js");
const errorsPath = join(root, "../src/billing/billingCheckoutErrors.js");
const billingApiPath = join(root, "../src/billing/services/billingApi.js");
const confirmModalPath = join(root, "../src/components/ui/S7ConfirmModal.jsx");
const confirmCssPath = join(root, "../src/components/ui/S7ConfirmModal.css");

const cardJsx = readFileSync(cardPath, "utf8");
const pageJsx = readFileSync(pagePath, "utf8");
const checkoutJsx = readFileSync(checkoutModalPath, "utf8");
const cardFormJs = readFileSync(cardFormPath, "utf8");
const errorsJs = readFileSync(errorsPath, "utf8");
const billingApi = readFileSync(billingApiPath, "utf8");
const confirmModalJsx = readFileSync(confirmModalPath, "utf8");
const confirmCss = readFileSync(confirmCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("remove modal hides cancel", cardJsx.includes("hideCancel"));
assert("remove modal danger border", cardJsx.includes("dangerBorder"));
assert("remove modal no manter cartao", !cardJsx.includes('cancelLabel="Manter cartão"'));
assert("confirm modal single action class", confirmModalJsx.includes("s7-confirm-modal-actions--single"));
assert("confirm modal danger border class", confirmModalJsx.includes("s7-confirm-modal-card--danger-border"));
assert("danger border css", confirmCss.includes("s7-confirm-modal-card--danger-border"));

assert("save mode forces new card submit", /isSaveMode[\s\S]*!isSaveMode && !useNewCard/.test(checkoutJsx));
assert("save mode opens with useNewCard true", /isSaveMode[\s\S]*setUseNewCard\(true\)/.test(checkoutJsx));
assert("form reset on open", checkoutJsx.includes("buildEmptyForm(creditCards.length > 0)"));
assert("second card default unchecked", checkoutJsx.includes("set_default: !hasExistingCards"));
assert("idempotency key per open", checkoutJsx.includes("idempotencyKeyRef"));
assert("validation banner local", checkoutJsx.includes("Confira os campos destacados."));

assert("generic preencha removed from page", !pageJsx.includes('"Preencha os dados do cartão."'));
assert("page uses validation local message", pageJsx.includes("CARD_VALIDATION_LOCAL_MESSAGE"));
assert("page prevents double submit", pageJsx.includes("if (saveLoading) return"));
assert("page sends idempotency key", pageJsx.includes("idempotency_key"));

assert("duplicate error message", errorsJs.includes("PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE"));
assert("duplicate exact mission copy", errorsJs.includes("já está registrado como forma de pagamento nesta conta"));
assert("duplicate resolves http 409", errorsJs.includes("res.status === 409"));
assert("communication error message", errorsJs.includes("CARD_COMMUNICATION_ERROR_MESSAGE"));
assert("resolve duplicate code", /payment_method_already_exists/.test(errorsJs));

assert("billing api idempotency field", billingApi.includes("idempotency_key"));
assert("set default explicit boolean in form payload", cardFormJs.includes("set_default: Boolean(form.set_default)"));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.6 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.6 unit] OK");
