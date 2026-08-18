#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.9 — badge canônico + inativos visíveis nas regras
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  statusBadge: join(root, "../src/components/ui/S7StatusBadge.jsx"),
  billingBadge: join(root, "../src/billing/components/BillingStatusBadge.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  recipientCardCss: join(root, "../src/components/notifications/central/NotificationRecipientCard.css"),
  eventRules: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.jsx"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
  resolveRecipients: join(
    root,
    "../../suse7-backend/src/domain/notifications/central/recipients/resolveCentralRecipients.js"
  ),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("shared S7StatusBadge exists", files.statusBadge.includes("s7-status-badge"));
assert("billing badge delegates to S7StatusBadge", files.billingBadge.includes("S7StatusBadge"));

assert("card uses S7StatusBadge", files.recipientCard.includes("S7StatusBadge"));
assert("card Ativo label", files.recipientCard.includes('"Ativo"'));
assert("card Inativo label", files.recipientCard.includes('"Inativo"'));
assert("card no legacy status badge css", !files.recipientCardCss.includes("s7-nrec-card__status-on"));
assert("card no legacy status uppercase css", !files.recipientCardCss.includes("s7-nrec-card__status-off"));

assert("event rules no active-only filter", !files.eventRules.includes("filter((g) => g.is_active !== false)"));
assert("event rules visibleGroups", files.eventRules.includes("visibleGroups"));
assert("event rules inactive row class", files.eventRules.includes("s7-nevent-rules__row--inactive"));
assert("event rules inactive guard toggle", files.eventRules.includes("group?.is_active === false) return"));
assert("event rules inactive checkbox disabled", files.eventRules.includes("isInactive"));
assert("event rules inactive hint copy", files.eventRules.includes("Destinatário inativo. Ative-o na página Destinatários"));
assert("event rules inactive badge", files.eventRules.includes("s7-nevent-rules__inactive-badge"));
assert("event rules only-inactive hint", files.eventRules.includes("Não há destinatários ativos para este evento."));
assert("event rules inactive opacity css", files.eventRulesCss.includes("s7-nevent-rules__row--inactive"));

assert("dispatcher filters is_active true", files.resolveRecipients.includes('.eq("is_active", true)'));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.9 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_9_unit.mjs");
