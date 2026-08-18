#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.1 — arquitetura da Central de Notificações
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  navConfig: join(root, "../src/components/Profile/profileNavigationConfig.js"),
  navItems: join(root, "../src/components/Profile/profileNavigationNotificationCenterItems.js"),
  app: join(root, "../src/App.jsx"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
  legacyRedirect: join(root, "../src/components/Profile/NotificationCenterLegacyRedirect.jsx"),
  popupLegacy: join(root, "../src/components/Profile/AlertasPopupLegacyRedirect.jsx"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  categoryCard: join(root, "../src/components/notifications/central/NotificationCategoryCard.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("canonical sections export", files.sections.includes("NOTIFICATION_CENTER_SECTIONS"));
assert("eight nav sections", (files.sections.match(/key: "/g) ?? []).length >= 8);
assert("recipients first order", files.sections.includes('key: "recipients"') && files.sections.includes("order: 1"));
assert("billing renamed label", files.sections.includes('label: "Assinatura e pagamentos"'));
assert("concorrencia section", files.sections.includes('slug: "concorrencia"'));
assert("internal fale conosco hidden", files.sections.includes("FALE_CONOSCO_TEAM") && files.sections.includes("filterSellerFacingNotificationTypes"));
assert("format type count singular", files.sections.includes('if (n === 1) return "1 tipo"'));

assert("menu title central", files.navConfig.includes('label: "CENTRAL DE NOTIFICAÇÕES"'));
assert("no preferencias title", !files.navConfig.includes('"PREFERÊNCIAS"'));
assert("nav from canonical sections", files.navItems.includes("listNotificationCenterNavSections"));
assert("no duplicate hub item", !files.navItems.includes("Central de notificações"));

assert("routes destinatarios", files.app.includes('"notificacoes/destinatarios"'));
assert("routes category slug", files.app.includes("NotificationCenterCategoryPage"));
assert("legacy redirect hub", files.app.includes("NotificationCenterLegacyRedirect"));
assert("legacy popup redirect", files.app.includes("AlertasPopupLegacyRedirect"));
assert("no CentralNotificacoesHub route", !files.app.includes("<CentralNotificacoesHub"));

assert("category page popup before delivery", files.categoryPage.indexOf("NotificationPopupSection") < files.categoryPage.indexOf("NotificationDeliverySection"));
assert("popup section component", files.popupSection.includes("Alertas pop-up"));
assert("delivery section component", files.deliverySection.includes("Notificações e destinatários"));
assert("legacy focus redirect", files.legacyRedirect.includes("resolveLegacyNotificationFocusSlug"));
assert("legacy tab recipients", files.legacyRedirect.includes('tab === "recipients"'));
assert("popup legacy to slug", files.popupLegacy.includes("resolveLegacyPopupCategorySlug"));

assert("empty category card hidden", files.categoryCard.includes("!(category.types?.length ?? 0)"));
assert("type count formatter used", files.categoryCard.includes("formatNotificationTypeCount"));
assert("suse7 in pref group", files.prefGroup.includes("Alertas dentro do SUSE7."));

assert("sales profit groups", files.sections.includes('notificationGroups: ["SALES", "PROFIT"]'));
assert("inventory not products only empty", files.sections.includes('notificationGroups: ["INVENTORY", "PRODUCTS"]'));
assert("competition no popup", files.sections.includes('key: "competition"') && !files.sections.match(/competition[\s\S]{0,120}popupCategory/));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.1 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_architecture_unit.mjs");
