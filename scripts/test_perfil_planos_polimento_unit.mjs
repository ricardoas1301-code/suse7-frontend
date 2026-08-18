#!/usr/bin/env node
/**
 * S1.PERFIL-PLANOS.4 — polimento final: copy masculina, espaçamento, downgrade, Infinity suporte, Clientes 360
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const paths = {
  planIncluded: join(root, "../src/billing/planIncludedFeatures.js"),
  arsenal: join(root, "../src/billing/suse7CompleteArsenal.js"),
  plansPage: join(root, "../src/billing/pages/PlansPage.jsx"),
  downgradeModal: join(root, "../src/billing/components/SubscriptionDowngradeModal.jsx"),
  contactModal: join(root, "../src/components/ContactModal.jsx"),
  infinitySupport: join(root, "../src/billing/planInfinitySupport.js"),
  contactUi: join(root, "../src/services/faleConoscoContactUi.js"),
  contactApi: join(root, "../src/services/faleConoscoContactApi.js"),
  billingCss: join(root, "../src/billing/billing.css"),
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

// 1. Concordância masculina SUSE7
assert("intro No SUSE7", files.planIncluded.includes("No SUSE7,"));
assert("card ao SUSE7", files.planIncluded.includes("Acesso completo ao SUSE7"));
assert("arsenal button do SUSE7", files.planIncluded.includes("Ver arsenal completo do SUSE7"));
assert("modal title do SUSE7", files.arsenal.includes('SUSE7_ARSENAL_MODAL_TITLE = "Arsenal completo do SUSE7"'));
assert("healthy phrase O SUSE7 ele", files.arsenal.includes("O SUSE7 não mostra apenas quanto você vendeu; ele mostra"));
assert("no Na SUSE7", !files.planIncluded.includes("Na SUSE7"));
assert("no à SUSE7 in cards", !files.planIncluded.includes("à SUSE7"));
assert("no da SUSE7 in arsenal title", !files.arsenal.includes("Arsenal completo da SUSE7"));
assert("no A SUSE7 feminine", !files.arsenal.includes("A SUSE7 não mostra"));

// 2. Espaçamento benefícios
assert("highlights li spacing", files.billingCss.includes(".s7-billing-plan-card__highlights li + li") && files.billingCss.includes("margin-top: 7px"));

// 3. Espaçamento arsenal e suporte
assert("arsenal link bottom margin", files.billingCss.includes(".s7-billing-plan-card__arsenal-link") && files.billingCss.includes("margin: 10px 0 12px"));

// 4. Modal downgrade com useS7DialogFocus
assert("downgrade modal component", files.downgradeModal.includes("useS7DialogFocus"));
assert("downgrade backdrop close", files.downgradeModal.includes("handleOverlayMouseDown"));
assert("downgrade escape via hook", files.downgradeModal.includes("onClose: handleClose"));
assert("downgrade preserve actions", files.downgradeModal.includes("Manter plano atual") && files.downgradeModal.includes("Agendar downgrade"));
assert("plans page uses downgrade modal", files.plansPage.includes("SubscriptionDowngradeModal"));
assert("no inline downgrade sheet", !files.plansPage.includes("<h3>Agendar downgrade?</h3>"));

// 5. Infinity abre modal suporte
assert("infinity support prefill", files.infinitySupport.includes('subject: "Plano Infinity"'));
assert("infinity support context", files.infinitySupport.includes('source: "plans_infinity"') && files.infinitySupport.includes('plan_key: "infinity"'));
assert("plans page contact modal", files.plansPage.includes("ContactModal") && files.plansPage.includes("INFINITY_SUPPORT_PREFILL"));
assert("no mailto infinity", !files.plansPage.includes("getCommercialContactHref"));

// 6. Clientes 360 removido
assert("no clientes 360 in arsenal", !files.arsenal.includes("Clientes 360"));

// 7. Contact modal canonical subjects
assert("plano infinity subject option", files.contactUi.includes('"Plano Infinity"'));
assert("contact api metadata", files.contactApi.includes("body.source") && files.contactApi.includes("body.plan_key"));

if (failures.length) {
  console.error("[S1.PERFIL-PLANOS.4 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_perfil_planos_polimento_unit.mjs");
