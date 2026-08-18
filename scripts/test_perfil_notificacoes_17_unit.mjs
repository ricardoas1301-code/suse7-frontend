#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.17 — Produtos + tooltip canônico global
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  navItems: join(root, "../src/components/Profile/profileNavigationNotificationCenterItems.js"),
  recipientContent: join(root, "../src/components/notifications/central/NotificationRecipientRulesContent.jsx"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
  s7Tooltip: join(root, "../src/components/ui/S7Tooltip.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  app: join(root, "../src/App.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert('label "Produtos"', files.sections.includes('label: "Produtos"'));
assert('slug "produtos"', files.sections.includes('slug: "produtos"'));
assert("legacy alias produtos-estoque", files.sections.includes('"produtos-estoque": "produtos"'));
assert("legacy focus products produtos", files.sections.includes('products: "produtos"'));
assert("no nav label produtos e estoque", !files.sections.includes('label: "Produtos e estoque"'));

assert("redirect preserves search", files.categoryPage.includes("location.search"));
assert("legacy redirect helper", files.categoryPage.includes("resolveNotificationCenterLegacyRedirectSlug"));

assert("menu uses section route", files.navItems.includes("notificationCenterSectionRoute(section)"));
assert("menu legacy active", files.navItems.includes("NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES"));

assert("groupedLayout products", files.sections.match(/products_stock[\s\S]*?groupedLayout: true/));
assert("PRODUCTS group preserved", files.sections.includes('"INVENTORY", "PRODUCTS"'));
assert("popup category preserved", files.sections.includes("NOTIFICATION_CATEGORY_VIEWS.products"));

assert("S7Tooltip imported", files.recipientContent.includes('from "../../ui/S7Tooltip"'));
assert("tooltip copy preserved", files.recipientContent.includes("NOTIFICATION_INACTIVE_RECIPIENT_HINT"));
assert("approved hint text", files.recipientContent.includes("Destinatário inativo. Ative-o na página Destinatários"));
assert("single row tooltip", files.recipientContent.includes("isInactive") && files.recipientContent.includes("<S7Tooltip"));
assert("no native title inactive", !files.recipientContent.includes("title={isInactive"));
assert("inactive tabIndex", files.recipientContent.includes("tabIndex={0}"));
assert("aria-disabled row", files.recipientContent.includes('aria-disabled="true"'));
assert("checkbox disabled preserved", files.recipientContent.includes("disabled={emailDisabled}"));
assert("aria-label preserved", files.recipientContent.includes("aria-label={emailLabel}"));
assert("tooltip wrap", files.recipientContent.includes("wrap"));
assert("inactive row css", files.eventRulesCss.includes("s7-nevent-rules__inactive-tooltip-target"));

assert("historico route preserved", files.app.includes("notificacoes/historico"));
assert("dynamic slug route", files.app.includes("notificacoes/:slug"));

assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));
assert("s7tooltip portal", files.s7Tooltip.includes("S7TooltipTextPortal"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.17 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_17_unit.mjs");
