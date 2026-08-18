#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.18 — Anúncios + rota canônica
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  navItems: join(root, "../src/components/Profile/profileNavigationNotificationCenterItems.js"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  recipientContent: join(root, "../src/components/notifications/central/NotificationRecipientRulesContent.jsx"),
  cardFooter: join(root, "../src/components/notifications/central/NotificationCardFooter.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  preferences: join(root, "../src/constants/notificationPreferences.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert('label "Anúncios"', files.sections.includes('label: "Anúncios"'));
assert('slug "anuncios"', files.sections.includes('slug: "anuncios"'));
assert("legacy alias anuncios-marketplace", files.sections.includes('"anuncios-marketplace": "anuncios"'));
assert("legacy focus marketplace anuncios", files.sections.includes('marketplace: "anuncios"'));
assert("no nav label anuncios e marketplace", !files.sections.includes('label: "Anúncios e marketplace"'));

assert("redirect preserves search", files.categoryPage.includes("location.search"));
assert("legacy redirect replace", files.categoryPage.includes("resolveNotificationCenterLegacyRedirectSlug"));

assert("menu section route", files.navItems.includes("notificationCenterSectionRoute(section)"));
assert("menu legacy active aliases", files.navItems.includes("NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES"));

const marketplaceBlock = files.sections.split('key: "marketplace"')[1]?.split("},")[0] ?? "";
assert("key marketplace preserved", marketplaceBlock.includes('key: "marketplace"') || files.sections.includes('key: "marketplace"'));
assert("groupedLayout marketplace", files.sections.match(/key: "marketplace"[\s\S]*?groupedLayout: true/));
assert("MARKETPLACE group preserved", files.sections.includes('"MARKETPLACE"'));
assert("popup category preserved", files.sections.includes("NOTIFICATION_CATEGORY_VIEWS.marketplace"));

assert("popup catalog price change", files.preferences.includes("PRICE_CHANGE_CONTEXT_ALERT"));
assert("popup catalog fee shipping", files.preferences.includes("FEE_SHIPPING_REVIEW_MODAL"));
assert("no marketplace in account health section", !files.sections.match(/key: "account_health"[\s\S]*?"MARKETPLACE"/));
assert("marketplace still MARKETPLACE only", files.sections.match(/key: "marketplace"[\s\S]*?notificationGroups: \["MARKETPLACE"\]/));

assert("S7Tooltip preserved", files.recipientContent.includes("S7Tooltip"));
assert("no native title inactive", !files.recipientContent.includes("title={isInactive"));
assert("footer preserved", files.cardFooter.includes("NotificationCardFooter"));
assert("blue accent preserved", files.prefGroup.includes("s7-ncenter-card--left-accent-blue"));
assert("orange accent css", readFileSync(join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"), "utf8").includes("s7-ncenter-recipient--left-accent-orange"));

assert("popup real catalog", files.popupSection.includes("POPUP_ALERTS_CATALOG_BY_VIEW"));
assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));
assert("produtos slug preserved", files.sections.includes('slug: "produtos"'));
assert("vendas slug preserved", files.sections.includes('slug: "vendas"'));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.18 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_18_unit.mjs");
