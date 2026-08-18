#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.14 — polimento final cards + resumo diário
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  visualVariants: join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"),
  notificacoesCss: join(root, "../src/components/Profile/Notificacoes.css"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
  dualExpanders: join(root, "../src/components/notifications/central/NotificationDailySalesDualExpanders.jsx"),
  dualExpandersCss: join(root, "../src/components/notifications/central/NotificationDailySalesDualExpanders.css"),
  cardFooterCss: join(root, "../src/components/notifications/central/NotificationCardFooter.css"),
  scheduleUtils: join(root, "../src/components/notifications/central/dailySalesSummaryScheduleUtils.js"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("shared blue css var", files.visualVariants.includes("--s7-ncenter-left-accent-blue"));
assert("popup uses shared token", files.notificacoesCss.includes("--s7-ncenter-left-accent-blue"));
assert("notificacoes imports variants", files.notificacoesCss.includes("notificationCenterVisualVariants.css"));

assert("recipient compact white bg", files.eventRulesCss.includes("background: #fff"));
assert("pref group accent cascade", files.prefGroupCss.includes(".s7-npref-group.s7-ncenter-card--left-accent-blue"));
assert("recipient accent cascade", files.eventRulesCss.includes(".s7-nevent-rules__row--compact.s7-ncenter-recipient--left-accent-orange"));

assert("openPanel state", files.dualExpanders.includes("openPanel"));
assert("mutually exclusive toggle", files.dualExpanders.includes('togglePanel("recipients")'));
assert("single badge in footer actions", files.dualExpanders.includes("NotificationEventRulesStatusBadge"));
assert("footer actions wrapper", files.dualExpanders.includes("NotificationCardFooter"));
assert("no duplicate badge head", !files.dualExpanders.match(/s7-nevent-rules__head[\s\S]*Regras salvas[\s\S]*s7-nevent-rules__head/));

assert("metadata helpers", files.scheduleUtils.includes("getDailySalesSummaryCompactCardMetadata"));
assert("days label helper", files.scheduleUtils.includes("formatDailySalesSummaryDaysPresentation"));
assert("times label helper", files.scheduleUtils.includes("formatDailySalesSummaryTimesPresentation"));
assert("nao configurados", files.scheduleUtils.includes("Não configurados"));
assert("todos os dias", files.scheduleUtils.includes("Todos os dias"));

assert("pref uses compact metadata", files.prefGroup.includes("getDailySalesSummaryCompactCardMetadata"));
assert("pref dias label", files.prefGroup.includes('>Dias:</span>'));
assert("pref no badge when compact metadata", files.prefGroup.includes("dailyMetadata"));

assert("compact footer flex", files.cardFooterCss.includes("s7-npref-group__footer-actions"));

assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.14 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_14_unit.mjs");
