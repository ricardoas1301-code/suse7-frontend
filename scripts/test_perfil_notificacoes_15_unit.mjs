#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.15 — rodapé canônico + linha única Resumo diário
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  cardFooter: join(root, "../src/components/notifications/central/NotificationCardFooter.jsx"),
  cardFooterCss: join(root, "../src/components/notifications/central/NotificationCardFooter.css"),
  dualExpanders: join(root, "../src/components/notifications/central/NotificationDailySalesDualExpanders.jsx"),
  eventRules: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.jsx"),
  statusBadge: join(root, "../src/components/notifications/central/NotificationEventRulesStatusBadge.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  visualVariants: join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("NotificationCardFooter component", files.cardFooter.includes("NotificationCardFooter"));
assert("footer divider class", files.cardFooter.includes("s7-npref-group__footer-divider"));
assert("footer actions wrapper", files.cardFooter.includes("s7-npref-group__footer-actions"));
assert("footer margin-top auto", files.cardFooterCss.includes("margin-top: auto"));
assert("footer actions flex row", files.cardFooterCss.includes("flex-direction: row"));
assert("footer actions nowrap desktop", files.cardFooterCss.includes("flex-wrap: nowrap"));
assert("badge flex 0 0 auto", files.cardFooterCss.includes("flex: 0 0 auto"));
assert("footer actions width auto", files.cardFooterCss.includes(".s7-npref-group__footer-actions") && files.cardFooterCss.includes("width: auto"));
assert("dual uses shared footer", files.dualExpanders.includes("NotificationCardFooter"));
assert("dual three elements same footer", files.dualExpanders.includes("Destinatários") && files.dualExpanders.includes("Regras") && files.dualExpanders.includes("NotificationEventRulesStatusBadge"));
assert("dual no duplicate badge head", !files.dualExpanders.includes("s7-nevent-rules__head"));
assert("dual mutually exclusive", files.dualExpanders.includes("openPanel"));
assert("dual toggle recipients", files.dualExpanders.includes('togglePanel("recipients")'));
assert("dual toggle rules", files.dualExpanders.includes('togglePanel("rules")'));

assert("event rules canonical footer prop", files.eventRules.includes("canonicalFooter"));
assert("event rules uses NotificationCardFooter", files.eventRules.includes("NotificationCardFooter"));
assert("shared status badge component", files.statusBadge.includes("NotificationEventRulesStatusBadge"));

assert("pref group body wrapper", files.prefGroup.includes("s7-npref-group__body"));
assert("pref passes canonicalFooter compact", files.prefGroup.includes("canonicalFooter={compact}"));
assert("compact footer margin-top auto", files.prefGroupCss.includes(".s7-npref-group--compact .s7-npref-group__footer"));
assert("compact flex column", files.prefGroupCss.includes("flex-direction: column"));

assert("dashed divider style", files.cardFooterCss.includes("border-top: 1px dashed #e2e8f0"));
assert("blue accent preserved", files.visualVariants.includes("--s7-ncenter-left-accent-blue"));
assert("orange recipient accent preserved", files.eventRulesCss.includes("s7-ncenter-recipient--left-accent-orange"));
assert("recipient white bg preserved", files.eventRulesCss.includes("background: #fff"));

assert("destinatarios page untouched", files.recipientCard.includes("S7StatusBadge"));
assert("no position absolute footer", !files.cardFooterCss.includes("position: absolute") && !files.prefGroupCss.includes(".s7-npref-group__footer") || !files.prefGroupCss.match(/\.s7-npref-group__footer[\s\S]*position:\s*absolute/));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.15 unit] FAIL");
  for (const f of failures) console.fail?.(" -", f) ?? console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_15_unit.mjs");
