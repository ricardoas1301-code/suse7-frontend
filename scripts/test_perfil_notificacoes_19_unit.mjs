#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.19 — Saúde da operação + destinatários inativos
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  eventPresentation: join(root, "../src/constants/notificationEventPresentation.js"),
  recipientContent: join(root, "../src/components/notifications/central/NotificationRecipientRulesContent.jsx"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  channelCss: join(root, "../src/components/notifications/central/NotificationChannelToggle.css"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert('label "Saúde da operação"', files.sections.includes('label: "Saúde da operação"'));
assert("slug saude-operacao", files.sections.includes('slug: "saude-operacao"'));
assert("no old page label", !files.sections.includes('label: "Saúde da conta e operação"'));
assert("new page subtitle", files.sections.includes("Conexões, sincronizações e alertas operacionais da sua conta."));
assert("account_health key preserved", files.sections.includes('key: "account_health"'));
assert("groupedLayout health", files.sections.match(/key: "account_health"[\s\S]*?groupedLayout: true/));
assert("notification groups preserved", files.sections.includes('"ACCOUNT_HEALTH", "SYNC", "SYSTEM"'));
assert("popup category preserved", files.sections.includes("NOTIFICATION_CATEGORY_VIEWS.health"));

assert("marketplace disconnected presentation", files.eventPresentation.includes("MARKETPLACE_DISCONNECTED"));
assert("disconnected title", files.eventPresentation.includes('title: "Conta desconectada"'));
assert("disconnected subtitle", files.eventPresentation.includes('description: "Conta marketplace desconectada."'));
assert("no criticamente", !files.eventPresentation.includes("criticamente"));

assert("row content wrapper", files.recipientContent.includes("s7-nevent-rules__row-content"));
assert("inactive content opacity class", files.recipientContent.includes("s7-nevent-rules__row-content--inactive"));
assert("no opacity on inactive row wrapper", !files.eventRulesCss.match(/\.s7-nevent-rules__row--inactive\s*\{[^}]*opacity/));
assert("inactive content opacity css", files.eventRulesCss.includes(".s7-nevent-rules__row-content--inactive"));
assert("compact white bg preserved", files.eventRulesCss.includes("background: #fff"));
assert("orange accent preserved", files.eventRulesCss.includes("s7-ncenter-recipient--left-accent-orange"));
assert("S7Tooltip preserved", files.recipientContent.includes("S7Tooltip"));
assert("no native title", !files.recipientContent.includes("title={isInactive"));
assert("checkbox disabled preserved", files.recipientContent.includes("disabled={emailDisabled}"));

assert("mandatory skips in-app channel block", files.prefGroup.includes("!inAppLockedMandatory"));
assert("inAppLockedMandatory", files.prefGroup.includes("inAppLockedMandatory"));
assert("mandatory hint preserved", files.prefGroup.includes("Notificação obrigatória no app"));
assert("badge fit content", files.prefGroupCss.includes("width: fit-content"));
assert("mandatory no blue accent", files.prefGroup.includes("showLeftAccent && !mandatory"));

assert("destinatarios page untouched", files.recipientCard.includes("S7StatusBadge"));
assert("produtos slug preserved", files.sections.includes('slug: "produtos"'));
assert("anuncios slug preserved", files.sections.includes('slug: "anuncios"'));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.19 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_19_unit.mjs");
