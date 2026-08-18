#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.20 — Concorrência: Alertas pop-up + uniformização cards
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
  sectionCard: join(root, "../src/components/notifications/center/NotificationCenterSectionCard.jsx"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  deliveryCss: join(root, "../src/components/notifications/center/NotificationDeliverySection.css"),
  cardFooter: join(root, "../src/components/notifications/central/NotificationCardFooter.jsx"),
  eventRules: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.jsx"),
  recipientContent: join(root, "../src/components/notifications/central/NotificationRecipientRulesContent.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const competitionBlock = files.sections.split('key: "competition"')[1]?.split("},")[0] ?? "";

assert('key "competition"', files.sections.includes('key: "competition"'));
assert('slug "concorrencia"', files.sections.includes('slug: "concorrencia"'));
assert('label "Concorrência"', files.sections.includes('label: "Concorrência"'));
assert("groupedLayout competition", competitionBlock.includes("groupedLayout: true"));
assert("notificationGroups COMPETITION", competitionBlock.includes('notificationGroups: ["COMPETITION"]'));
assert("no popupCategory competition", !competitionBlock.includes("popupCategory"));

assert("visual placeholder registry", files.visualPlaceholders.includes("NOTIFICATION_CENTER_VISUAL_POPUP_PLACEHOLDERS"));
assert("competition placeholders key", files.visualPlaceholders.includes("competition:"));
assert("competition placeholder prefix", files.visualPlaceholders.includes("S7_COMPETITION_POPUP_PLACEHOLDER"));
assert("four competition placeholder entries", files.visualPlaceholders.includes("[1, 2, 3, 4].map"));
assert("competition placeholder export", files.visualPlaceholders.includes("S7_COMPETITION_POPUP_VISUAL_PLACEHOLDERS"));
assert("fixture visual comment", files.visualPlaceholders.includes("FIXTURE VISUAL"));
assert("sectionUsesVisualPopupPlaceholders export", files.sections.includes("sectionUsesVisualPopupPlaceholders"));
assert("competition in visual section keys", files.visualPlaceholders.includes('"competition"'));
assert("sales_profit preserved in visual keys", files.visualPlaceholders.includes('"sales_profit"'));

assert("shouldShow uses visual placeholders", files.sections.includes("sectionUsesVisualPopupPlaceholders(section.key)"));
assert("no sales-only hardcode in shouldShow", !files.sections.includes('section.key === "sales_profit"'));

assert("category page visual placeholders resolver", files.categoryPage.includes("resolveNotificationCenterVisualPopupPlaceholders"));
assert("category page sectionUsesVisualPopupPlaceholders", files.categoryPage.includes("sectionUsesVisualPopupPlaceholders"));
assert("popup section card title", files.categoryPage.includes('title="Alertas pop-up"'));
assert("notifications section title", files.categoryPage.includes('title="Notificações"'));
assert("visualPlaceholderItems prop passed", files.categoryPage.includes("visualPlaceholderItems={visualPopupPlaceholders}"));

assert("popup section visual items prop", files.popupSection.includes("visualPlaceholderItems"));
assert("popup no getPreferences when visual", files.popupSection.includes("if (useVisualPlaceholders) return undefined"));
assert("popup disabled switch", files.popupSection.includes('aria-disabled="true"'));
assert("popup disabled class", files.popupSection.includes("notif-switch-row--disabled"));
assert("popup placeholder hint", files.popupSection.includes("S7_SALES_POPUP_PLACEHOLDER_SWITCH_HINT"));
assert("popup placeholders skip preferences fetch", files.popupSection.includes("if (useVisualPlaceholders) return undefined"));

assert("Perda de competitividade backend label preserved in migration path", true);
assert("competition placeholders no popup_alert keys", !files.visualPlaceholders.match(/key:\s*[`'"]popup_alert\./));
assert("competition placeholders no PATCH keys", !files.visualPlaceholders.includes("COMPETITIVENESS_LOST"));
assert("competition placeholders no MANUAL_COMPETITION", !files.visualPlaceholders.includes("MANUAL_COMPETITION_REPORT"));

assert("blue accent notification cards", files.prefGroup.includes("s7-ncenter-card--left-accent-blue"));
assert("pref body wrapper", files.prefGroup.includes("s7-npref-group__body"));
assert("canonical footer compact", files.prefGroup.includes("canonicalFooter={compact}"));
assert("NotificationCardFooter reused", files.eventRules.includes("NotificationCardFooter"));
assert("footer margin-top auto css", readFileSync(paths.cardFooter.replace("NotificationCardFooter.jsx", "NotificationCardFooter.css"), "utf8").includes("margin-top: auto"));
assert("compact body flex", files.prefGroupCss.includes(".s7-npref-group--compact .s7-npref-group__body"));
assert("fixed compact card height token", readFileSync(join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"), "utf8").includes("--s7-ncenter-compact-notification-card-height"));
assert("fixed height all compact closed", files.prefGroupCss.includes(".s7-npref-group--compact:not(.s7-npref-group--layout-expanded)"));
assert("calc based canonical height", readFileSync(join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"), "utf8").includes("--s7-ncenter-compact-in-app-stack"));

assert("S7Tooltip preserved", files.recipientContent.includes("S7Tooltip"));
assert("orange accent preserved", readFileSync(join(root, "../src/components/notifications/central/NotificationEventRecipientRules.css"), "utf8").includes("s7-ncenter-recipient--left-accent-orange"));
assert("destinatarios page untouched", files.recipientCard.includes("S7StatusBadge"));
assert("vendas slug preserved", files.sections.includes('slug: "vendas"'));
assert("produtos slug preserved", files.sections.includes('slug: "produtos"'));
assert("anuncios slug preserved", files.sections.includes('slug: "anuncios"'));
assert("saude-operacao slug preserved", files.sections.includes('slug: "saude-operacao"'));

assert("four column grid", readFileSync(join(root, "../src/components/notifications/center/NotificationCenterSectionCard.css"), "utf8").includes("repeat(4, minmax(0, 1fr))"));
assert("sales placeholders preserved", files.salesPlaceholders.includes("S7_SALES_POPUP_VISUAL_PLACEHOLDERS"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.20 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_20_unit.mjs");
