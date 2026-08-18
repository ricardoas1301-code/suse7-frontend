#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.10 — reestruturação visual página Vendas
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  sectionCard: join(root, "../src/components/notifications/center/NotificationCenterSectionCard.jsx"),
  sectionCardCss: join(root, "../src/components/notifications/center/NotificationCenterSectionCard.css"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
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

assert("sales label Vendas", files.sections.includes('label: "Vendas"'));
assert("sales slug canonical", files.sections.includes('slug: "vendas"'));
assert("sales groupedLayout flag", files.sections.includes("groupedLayout: true"));
assert("notification groups preserved", files.sections.includes('notificationGroups: ["SALES", "PROFIT"]'));

assert("section card component", files.sectionCard.includes("s7-ncenter-section-card"));
assert("four column grid", files.sectionCardCss.includes("repeat(4, minmax(0, 1fr))"));
assert("grid align start", files.sectionCardCss.includes("align-items: start"));
assert("breakpoint 1180", files.sectionCardCss.includes("max-width: 1180px"));
assert("breakpoint 860", files.sectionCardCss.includes("max-width: 860px"));
assert("breakpoint 560", files.sectionCardCss.includes("max-width: 560px"));

assert("category page uses section card", files.categoryPage.includes("NotificationCenterSectionCard"));
assert("category page grouped layout", files.categoryPage.includes("useGroupedLayout"));
assert("popup section card title", files.categoryPage.includes('title="Alertas pop-up"'));
assert("notifications section title", files.categoryPage.includes('title="Notificações"'));
assert("notifications section copy", files.categoryPage.includes("Configure os canais e escolha quem receberá"));

assert("popup grid layout prop", files.popupSection.includes('layout === "grid"'));
assert("popup hide header prop", files.popupSection.includes("hideHeader"));
assert("popup card grid flex footer", files.popupSection.includes("s7-ncenter-popup__card--grid"));

assert("delivery grid layout prop", files.deliverySection.includes('layout === "grid"'));
assert("delivery new title constant", files.deliverySection.includes('title: "Notificações"'));
assert("delivery legacy title preserved", files.deliverySection.includes("Notificações e destinatários"));
assert("delivery compact prop", files.deliverySection.includes("compact={isGrid}"));

assert("pref group compact prop", files.prefGroup.includes("compact = false"));
assert("pref group compact class", files.prefGroup.includes("s7-npref-group--compact"));
assert("event rules compact prop", files.eventRules.includes("compact = false"));
assert("recipient content compact row", files.recipientContent.includes("s7-nevent-rules__row--compact"));
assert("recipient content compact channels", files.recipientContent.includes("s7-nevent-rules__channels"));

assert("destinatarios card untouched S7StatusBadge", files.recipientCard.includes("S7StatusBadge"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.10 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_10_unit.mjs");
