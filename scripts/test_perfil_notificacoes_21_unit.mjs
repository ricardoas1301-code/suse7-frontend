#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.21 — Assinatura e pagamentos: Alertas pop-up fixtures
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  visualPlaceholders: join(root, "../src/constants/notificationCenterVisualPopupPlaceholders.js"),
  salesPlaceholders: join(root, "../src/constants/salesPopupVisualPlaceholders.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  preferences: join(root, "../src/constants/notificationPreferences.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const billingBlock = files.sections.split('key: "billing"')[1]?.split("},")[0] ?? "";

assert('key "billing"', files.sections.includes('key: "billing"'));
assert('slug "assinatura-pagamentos"', files.sections.includes('slug: "assinatura-pagamentos"'));
assert('label "Assinatura e pagamentos"', files.sections.includes('label: "Assinatura e pagamentos"'));
assert("groupedLayout billing", billingBlock.includes("groupedLayout: true"));
assert("notificationGroups BILLING", billingBlock.includes('notificationGroups: ["BILLING"]'));
assert("no popupCategory billing", !billingBlock.includes("popupCategory"));

assert("billing in visual registry", files.visualPlaceholders.includes("billing: S7_BILLING_POPUP_VISUAL_PLACEHOLDERS"));
assert("billing placeholder prefix", files.visualPlaceholders.includes("S7_BILLING_POPUP_PLACEHOLDER"));
assert("four billing placeholder entries", files.visualPlaceholders.match(/S7_BILLING_POPUP_VISUAL_PLACEHOLDERS[\s\S]*?\[1, 2, 3, 4\]\.map/));
assert("billing fixture comment", files.visualPlaceholders.includes("trilha real de pop-ups de Assinatura e pagamentos"));
assert("billing in section keys", files.visualPlaceholders.includes('"billing"'));

assert("shouldShow uses visual placeholders", files.sections.includes("sectionUsesVisualPopupPlaceholders(section.key)"));
assert("category page resolver", files.categoryPage.includes("resolveNotificationCenterVisualPopupPlaceholders"));
assert("popup section card title", files.categoryPage.includes('title="Alertas pop-up"'));

assert("placeholders disabled", files.popupSection.includes('aria-disabled="true"'));
assert("placeholders no prefs fetch", files.popupSection.includes("if (useVisualPlaceholders) return undefined"));
assert("billing no popup_alert keys", !files.visualPlaceholders.match(/S7_BILLING[\s\S]*?popup_alert\./));

assert("competition placeholders intact", files.visualPlaceholders.includes("competition: S7_COMPETITION_POPUP_VISUAL_PLACEHOLDERS"));
assert("competition prefix intact", files.visualPlaceholders.includes("S7_COMPETITION_POPUP_PLACEHOLDER"));
assert("sales placeholders intact", files.salesPlaceholders.includes("S7_SALES_POPUP_VISUAL_PLACEHOLDERS"));
assert("sales_profit in keys", files.visualPlaceholders.includes('"sales_profit"'));

assert("products not in visual keys", !files.visualPlaceholders.includes('"products_stock"'));
assert("marketplace not in visual keys", !files.visualPlaceholders.includes('"marketplace"'));
assert("account_health not in visual keys", !files.visualPlaceholders.includes('"account_health"'));

assert("BILLING category preserved", files.preferences.includes("BILLING") || files.sections.includes('"BILLING"'));
assert("mandatory no blue accent", files.prefGroup.includes("showLeftAccent && !mandatory"));
assert("mandatory class preserved", files.prefGroup.includes("s7-npref-group--mandatory"));

assert("concorrencia slug preserved", files.sections.includes('slug: "concorrencia"'));
assert("vendas slug preserved", files.sections.includes('slug: "vendas"'));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.21 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_21_unit.mjs");
