#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.13 — UX final Vendas + padrão visual Central
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  channelPresentation: join(root, "../src/constants/notificationChannelPresentation.js"),
  visualVariants: join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  dualExpanders: join(root, "../src/components/notifications/central/NotificationDailySalesDualExpanders.jsx"),
  scheduleUtils: join(root, "../src/components/notifications/central/dailySalesSummaryScheduleUtils.js"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  channelToggle: join(root, "../src/components/notifications/central/NotificationChannelToggle.jsx"),
  dualExpanders: join(root, "../src/components/notifications/central/NotificationDailySalesDualExpanders.jsx"),
  dailySchedule: join(root, "../src/components/notifications/central/NotificationDailySalesSchedule.jsx"),
  recipientContent: join(root, "../src/components/notifications/central/NotificationRecipientRulesContent.jsx"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  profileNav: join(root, "../src/components/Profile/profileNavigationNotificationCenterItems.js"),
  s7Bell: join(root, "../src/components/notifications/S7NotificationCenter.jsx"),
  drawer: join(root, "../src/components/NotificationsDrawer.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  app: join(root, "../src/App.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("canonical slug vendas", files.sections.includes('slug: "vendas"'));
assert("legacy alias vendas-lucro", files.sections.includes('"vendas-lucro": "vendas"'));
assert("legacy focus sales vendas", files.sections.includes('sales: "vendas"'));

assert("category page legacy redirect", files.categoryPage.includes("resolveNotificationCenterLegacyRedirectSlug"));
assert("profile nav legacy active", files.profileNav.includes("NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES"));

assert("in app copy canonical", files.channelPresentation.includes("Central de notificações"));
assert("hook applies channel presentation", readFileSync(join(root, "../src/hooks/useCentralNotificationSettings.js"), "utf8").includes("applyNotificationChannelsPresentation"));

assert("bell title", files.s7Bell.includes("Central de notificações"));
assert("drawer title", files.drawer.includes("Central de notificações"));

assert("blue accent primitive", files.visualVariants.includes("s7-ncenter-card--left-accent-blue"));
assert("orange recipient primitive", files.visualVariants.includes("s7-ncenter-recipient--left-accent-orange"));
assert("pref group uses blue primitive", files.prefGroup.includes("s7-ncenter-card--left-accent-blue"));

assert("compact in app toggle", files.channelToggle.includes("compactInCard"));
assert("dual expanders", files.dualExpanders.includes("Destinatários") && files.dualExpanders.includes("Regras"));
assert("openPanel exclusive", files.dualExpanders.includes("openPanel"));
assert("actions row", files.dualExpanders.includes("NotificationCardFooter"));
assert("recipient row accent", files.recipientContent.includes("s7-ncenter-recipient--left-accent-orange"));

assert("sininho removed", !files.dailySchedule.includes("Sininho"));
assert("alertas suse7 removed", !files.dailySchedule.includes("Alertas no Suse7"));
assert("new rules intro", files.dailySchedule.includes("Configure os dias e horários"));
assert("popup preserved", files.dailySchedule.includes("Pop-up"));

assert("alertas popup redirect vendas", files.app.includes('notificacoes/vendas"'));

assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.13 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_13_unit.mjs");
