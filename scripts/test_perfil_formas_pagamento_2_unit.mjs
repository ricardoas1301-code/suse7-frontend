#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.2 — avatar + layout 2 colunas + modal cartão
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const layoutPath = join(root, "../src/billing/components/PaymentMethodsBodyLayout.jsx");
const emptyPath = join(root, "../src/billing/components/PaymentMethodEmptyState.jsx");
const modalPath = join(root, "../src/billing/components/CardCheckoutModal.jsx");
const modalCssPath = join(root, "../src/billing/components/CardCheckoutModal.css");
const wideLayoutCssPath = join(root, "../src/billing/components/billingWideCheckoutLayout.css");
const billingCssPath = join(root, "../src/billing/billing.css");
const profileCssPath = join(root, "../src/components/Profile/Profile.css");
const illustrationPath = join(root, "../src/assets/profile/formas-de-pagamento-illustration.png");

const pageJsx = readFileSync(pagePath, "utf8");
const layoutJsx = readFileSync(layoutPath, "utf8");
const emptyJsx = readFileSync(emptyPath, "utf8");
const modalJsx = readFileSync(modalPath, "utf8");
const modalCss = readFileSync(modalCssPath, "utf8");
const wideLayoutCss = readFileSync(wideLayoutCssPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const profileCss = readFileSync(profileCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

try {
  readFileSync(illustrationPath);
  assert("avatar asset exists", true);
} catch {
  assert("avatar asset exists", false);
}

assert("page uses body layout wrapper", pageJsx.includes("PaymentMethodsBodyLayout"));
assert("empty state inside layout", /PaymentMethodsBodyLayout[\s\S]*PaymentMethodEmptyState/.test(pageJsx));
assert("payment list inside layout", /PaymentMethodsBodyLayout[\s\S]*s7-billing-payment-list/.test(pageJsx));
assert("layout renders avatar column", layoutJsx.includes("s7-billing-payment-shell__avatar"));
assert("layout renders content column", layoutJsx.includes("s7-billing-payment-shell__content"));
assert("avatar outside dashed panel", layoutJsx.includes("s7-billing-payment-shell__panel"));
assert("avatar uses provided illustration", layoutJsx.includes("formas-de-pagamento-illustration.png"));
assert("avatar object-fit contain", billingCss.includes("object-fit: contain"));
assert("avatar alt text present", layoutJsx.includes("alt="));
assert("avatar size increased 33 percent", billingCss.includes("max-width: 372px") && billingCss.includes("max-height: 426px"));
assert("two-column grid desktop", billingCss.includes("grid-template-columns: minmax(200px, 0.68fr) minmax(0, 1.32fr)"));
assert("mobile stack breakpoint", billingCss.includes("@media (max-width: 900px)"));
assert("dashed panel on content only", billingCss.includes(".s7-billing-payment-shell__panel") && billingCss.includes("border: 1px dashed #cbd5e1"));
assert("empty state icon preserved", emptyJsx.includes("CreditCard"));
assert("empty state texts preserved", emptyJsx.includes("Nenhuma forma de pagamento cadastrada"));
assert("card pai shell preserved", pageJsx.includes('className="profile-card s7-minha-assinatura-hero'));
assert("12px gutter preserved", profileCss.includes("--s7-empresa-page-gutter: 12px"));

assert("cadastro seguro removed from modal", !modalJsx.includes("Cadastro seguro"));
assert("recorrente mensal preserved", modalJsx.includes("Recorrente mensal"));
assert("tokenizacao asaas preserved", modalJsx.includes("Tokenização Asaas"));
assert("save button preserved", modalJsx.includes("Salvar cartão de crédito"));
assert("footer security notice preserved", modalJsx.includes("não armazena o número completo"));
assert("card fields preserved", modalJsx.includes("Nome impresso no cartão"));
assert("checkboxes preserved", modalJsx.includes("Salvar cartão para pagamentos futuros"));
assert("modal proportional viewport fit runtime", modalJsx.includes("aplicarEscalaModal"));
assert("modal 16 percent base reduction", modalJsx.includes("CARD_CHECKOUT_BASE_SCALE = 0.84"));
assert("modal panel ref for measurement", modalJsx.includes("ref={panelRef}"));
assert("modal fit host wrapper", modalJsx.includes("s7-billing-card-checkout__fit-host"));
assert("modal backdrop overflow hidden", modalCss.includes("overflow: hidden"));
assert("backdrop flex safe scroll", billingCss.includes("align-items: flex-start"));
assert("body scroll lock on open", modalJsx.includes('document.body.style.overflow = "hidden"'));
assert("scroll position restored on close", modalJsx.includes("window.scrollTo(0, scrollY)"));
assert("save mode facts spacing adjusted", modalCss.includes("summary-col--save-mode") && modalCss.includes("margin-top: 20px"));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.2 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.2 unit] OK");
