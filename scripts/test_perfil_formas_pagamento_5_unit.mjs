#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.5 — modal remoção + regra principal + auditoria contexto seguro
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const cardPath = join(root, "../src/billing/components/PaymentMethodCard.jsx");
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const uiPath = join(root, "../src/billing/paymentMethodUi.js");
const confirmModalPath = join(root, "../src/components/ui/S7ConfirmModal.jsx");
const cardModalPath = join(root, "../src/billing/components/CardCheckoutModal.jsx");
const billingCssPath = join(root, "../src/billing/billing.css");
const billingApiPath = join(root, "../src/billing/services/billingApi.js");

const cardJsx = readFileSync(cardPath, "utf8");
const pageJsx = readFileSync(pagePath, "utf8");
const uiJs = readFileSync(uiPath, "utf8");
const confirmModalJsx = readFileSync(confirmModalPath, "utf8");
const cardModalJsx = readFileSync(cardModalPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const billingApi = readFileSync(billingApiPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("window confirm removed", !cardJsx.includes("window.confirm"));
assert("uses canonical S7ConfirmModal", cardJsx.includes("S7ConfirmModal"));
assert("remove modal title", cardJsx.includes("Remover forma de pagamento?"));
assert("remove card action label", cardJsx.includes('confirmLabel="Remover cartão"'));
assert("remove modal hide cancel", cardJsx.includes("hideCancel"));
assert("danger confirm variant", cardJsx.includes('confirmVariant="danger"'));
assert("masked description builder", uiJs.includes("buildPaymentMethodRemoveDescription"));
assert("description uses formatPaymentMethodTitle", /buildPaymentMethodRemoveDescription[\s\S]*formatPaymentMethodTitle/.test(uiJs));
assert("other methods copy", uiJs.includes("outra forma de pagamento disponível"));
assert("single method copy", uiJs.includes("não haverá uma forma de pagamento cadastrada"));
assert("gateway ui removed", !cardJsx.includes("<dt>Gateway</dt>"));
assert("provider not rendered", !cardJsx.includes("method.provider"));
assert("total methods count prop wired", pageJsx.includes("totalMethodsCount={displayedMethods.length}"));
assert("single method hides primary actions", cardJsx.includes("const showPrimaryActions = totalMethodsCount > 1"));
assert("primary label for default card", cardJsx.includes("s7-billing-payment-card__primary-label"));
assert("make default only when multiple", /showPrimaryActions[\s\S]*actions\.makeDefault/.test(cardJsx));
assert("delete uses method id", cardJsx.includes("deletePaymentMethod(method.id)"));
assert("set default uses method id", cardJsx.includes("setDefaultPaymentMethod(method.id)"));
assert("remove loading blocks double submit", cardJsx.includes("loading={removeLoading}"));
assert("remove error stays in modal", cardJsx.includes("setRemoveError"));
assert("focus return anchor", cardJsx.includes("removeButtonRef"));
assert("card width grid cell preserved", billingCss.includes("width: 100%"));
assert("atualizar still absent", !pageJsx.includes(">Atualizar<"));

assert("no insecure connection copy in billing ui", !cardJsx.includes("ligação segura"));
assert("no insecure connection copy in card modal", !cardModalJsx.includes("ligação segura"));
assert("card form rendered by app not iframe", !cardModalJsx.includes("<iframe"));
assert("billing api uses buildApiUrl", billingApi.includes("buildApiUrl"));
assert("no hardcoded http billing endpoint", !/http:\/\//.test(billingApi));
assert("confirm modal supports escape", confirmModalJsx.includes('e.key === "Escape"'));
assert("confirm modal backdrop dismiss", confirmModalJsx.includes("handleOverlayMouseDown"));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.5 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.5 unit] OK");
