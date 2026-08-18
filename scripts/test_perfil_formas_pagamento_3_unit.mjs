#!/usr/bin/env node
/**
 * S1.PERFIL-FORMAS-PAGAMENTO.3 — remover Atualizar + spacing resumo modal
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentMethodsPage.jsx");
const modalPath = join(root, "../src/billing/components/CardCheckoutModal.jsx");
const modalCssPath = join(root, "../src/billing/components/CardCheckoutModal.css");

const pageJsx = readFileSync(pagePath, "utf8");
const modalJsx = readFileSync(modalPath, "utf8");
const modalCss = readFileSync(modalCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("header atualizar removed", !pageJsx.includes(">Atualizar<"));
assert("header without actions prop", !pageJsx.includes("actions={"));
assert("page title preserved", pageJsx.includes('title="Formas de pagamento"'));
assert("page subtitle preserved", pageJsx.includes("Gerencie métodos salvos"));
assert("refresh hook preserved", pageJsx.includes("refresh"));
assert("usePaymentMethods preserved", pageJsx.includes("usePaymentMethods"));
assert("empty state cta preserved", pageJsx.includes("Adicionar forma de pagamento"));
assert("card pai shell preserved", pageJsx.includes('className="profile-card s7-minha-assinatura-hero'));
assert("body layout preserved", pageJsx.includes("PaymentMethodsBodyLayout"));

assert("uso block preserved", modalJsx.includes(">Uso</dt>") || modalJsx.includes("<dt>Uso</dt>"));
assert("recorrente mensal preserved", modalJsx.includes("Recorrente mensal"));
assert("protecao preserved", modalJsx.includes(">Proteção</dt>") || modalJsx.includes("<dt>Proteção</dt>"));
assert("tokenizacao asaas preserved", modalJsx.includes("Tokenização Asaas"));
assert("save mode summary class preserved", modalJsx.includes("summary-col--save-mode"));
assert("old 53px compensation removed", !modalCss.includes("margin-top: 53px"));
assert("new 20px spacing applied", modalCss.includes("margin-top: 20px"));
assert("right column fields preserved", modalJsx.includes("Nome impresso no cartão"));
assert("checkboxes preserved", modalJsx.includes("Definir como cartão principal"));
assert("save button preserved", modalJsx.includes("Salvar cartão de crédito"));
assert("modal shell scale preserved", modalJsx.includes("aplicarEscalaModal"));
assert("scroll lock preserved", modalJsx.includes('document.body.style.overflow = "hidden"'));

if (failures.length) {
  console.error("[S1.PERFIL-FORMAS-PAGAMENTO.3 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.PERFIL-FORMAS-PAGAMENTO.3 unit] OK");
