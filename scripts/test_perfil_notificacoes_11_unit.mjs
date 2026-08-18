#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.11 — polimento estrutural página Vendas
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sortNotificationTypesForPresentation } from "../src/constants/notificationCenterPresentationOrder.js";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sectionCardCss: join(root, "../src/components/notifications/center/NotificationCenterSectionCard.css"),
  categoryPageCss: join(root, "../src/components/Profile/NotificationCenterCategoryPage.css"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  placeholders: join(root, "../src/constants/salesPopupVisualPlaceholders.js"),
  presentationOrder: join(root, "../src/constants/notificationCenterPresentationOrder.js"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  eventRules: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.jsx"),
  eventRulesCss: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"),
  scheduleUtils: join(root, "../src/components/notifications/central/dailySalesSummaryScheduleUtils.js"),
  settingsHook: join(root, "../src/hooks/useCentralNotificationSettings.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("section card box-sizing", files.sectionCardCss.includes("box-sizing: border-box"));
assert("section card min-width 0", files.sectionCardCss.includes("min-width: 0"));
assert("sections 12px padding", files.categoryPageCss.includes("padding: 0 12px"));
assert("grid child min-width", files.sectionCardCss.includes(".s7-ncenter-section-grid > *"));

assert("placeholders fixture", files.placeholders.includes("S7_SALES_POPUP_VISUAL_PLACEHOLDERS"));
assert("placeholder comment", files.placeholders.includes("FIXTURE VISUAL"));
assert("popup visual placeholders prop", files.popupSection.includes("useVisualPlaceholders"));
assert("popup placeholder disabled switch", files.popupSection.includes("notif-switch-row--disabled"));
assert("popup real catalog preserved", files.popupSection.includes("POPUP_ALERTS_CATALOG_BY_VIEW"));
assert("popup reduced min-height", files.popupSection.includes("118px") || readFileSync(join(root, "../src/components/notifications/center/NotificationPopupSection.css"), "utf8").includes("118px"));

assert("presentation order module", files.presentationOrder.includes("sortNotificationTypesForPresentation"));
assert("mandatory first sort", files.presentationOrder.includes("is_mandatory"));
assert("alphabetical label sort", files.presentationOrder.includes('localeCompare(presentationLabel(a.type), presentationLabel(b.type), "pt-BR"'));
assert("delivery uses sort", files.deliverySection.includes("sortNotificationTypesForPresentation"));

const sortedBilling = sortNotificationTypesForPresentation([
  { category: { code: "BILLING" }, type: { label: "Renovação concluída", is_mandatory: false } },
  { category: { code: "BILLING" }, type: { label: "Assinatura suspensa", is_mandatory: true } },
  { category: { code: "BILLING" }, type: { label: "Cobrança gerada", is_mandatory: false } },
  { category: { code: "BILLING" }, type: { label: "Pagamento falhou", is_mandatory: true } },
]);
assert(
  "runtime mandatory before optional",
  sortedBilling[0].type.label === "Assinatura suspensa" && sortedBilling[1].type.label === "Pagamento falhou"
);
assert(
  "runtime alpha within groups",
  sortedBilling[2].type.label === "Cobrança gerada" && sortedBilling[3].type.label === "Renovação concluída"
);
assert("delivery highlight expanded", files.deliverySection.includes("highlightExpandedRecipients"));

assert("daily toggle removed", !files.prefGroup.includes("s7-npref-group__master-toggle"));
assert("in app centering class", files.prefGroup.includes("s7-npref-group--has-in-app"));
assert("recipient row accent prop", files.eventRules.includes("recipientRowAccent"));
assert("no parent orange panel", !files.eventRulesCss.includes("s7-nevent-rules__panel--accent"));

assert("effective execution helper", files.scheduleUtils.includes("getDailySalesSummaryEffectiveExecutionState"));
assert("no disabled badge branch", !files.scheduleUtils.includes('"Desativado"'));
assert("save always enabled", files.settingsHook.includes("enabled: true"));
assert("category page placeholders flag", files.categoryPage.includes("useVisualPlaceholders") && files.categoryPage.includes("sectionUsesVisualPopupPlaceholders"));

assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.11 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_11_unit.mjs");
