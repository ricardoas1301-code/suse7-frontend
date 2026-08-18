#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.16 — padronização global + menu
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  popupSection: join(root, "../src/components/notifications/center/NotificationPopupSection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  cardFooter: join(root, "../src/components/notifications/central/NotificationCardFooter.jsx"),
  eventRules: join(root, "../src/components/notifications/central/NotificationEventRecipientRules.jsx"),
  visualVariants: join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"),
  sectionGridCss: join(root, "../src/components/notifications/center/NotificationCenterSectionCard.css"),
  navItems: join(root, "../src/components/Profile/profileNavigationNotificationCenterItems.js"),
  avatarMenu: join(root, "../src/components/AvatarMenu.jsx"),
  ticketsNav: join(root, "../src/components/Profile/profileNavigationTickets.js"),
  s7Bell: join(root, "../src/components/notifications/S7NotificationCenter.jsx"),
  app: join(root, "../src/App.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  placeholders: join(root, "../src/constants/salesPopupVisualPlaceholders.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const groupedSlugs = [
  "produtos",
  "anuncios",
  "saude-operacao",
  "concorrencia",
  "assinatura-pagamentos",
];

for (const slug of groupedSlugs) {
  assert(`groupedLayout ${slug}`, files.sections.includes(`slug: "${slug}"`) && files.sections.includes("groupedLayout: true"));
}

assert("vendas groupedLayout preserved", files.sections.includes('slug: "vendas"') && files.sections.match(/sales_profit[\s\S]*groupedLayout: true/));
const recipientsBlock = files.sections.split('key: "recipients"')[1]?.split("},")[0] ?? "";
assert("recipients no groupedLayout", !recipientsBlock.includes("groupedLayout"));

assert("popup section helper", files.sections.includes("shouldShowNotificationCenterPopupSection"));
assert("real popups helper", files.sections.includes("sectionHasRealPopupAlerts"));
assert("category uses popup helper", files.categoryPage.includes("shouldShowNotificationCenterPopupSection"));
assert("visual placeholders helper", files.categoryPage.includes("sectionUsesVisualPopupPlaceholders"));
assert("visual placeholders registry", readFileSync(join(root, "../src/constants/notificationCenterVisualPopupPlaceholders.js"), "utf8").includes("NOTIFICATION_CENTER_VISUAL_POPUP_PLACEHOLDERS"));
assert("sales in visual placeholder keys", readFileSync(join(root, "../src/constants/notificationCenterVisualPopupPlaceholders.js"), "utf8").includes('"sales_profit"'));

assert("history excluded from nav", files.sections.includes('section.kind !== "history"'));
assert("history route preserved", files.sections.includes('slug: "historico"'));
assert("historico app route", files.app.includes('notificacoes/historico'));

assert("delivery canonical title", files.deliverySection.includes('title: "Notificações"'));
assert("delivery legacy title separate", files.deliverySection.includes("legacyTitle"));
assert("grouped uses canonical copy", files.deliverySection.includes("hideHeader"));

assert("grid four columns", files.sectionGridCss.includes("repeat(4, minmax(0, 1fr))"));
assert("grid align start", files.sectionGridCss.includes("align-items: start"));

assert("blue accent token", files.visualVariants.includes("--s7-ncenter-left-accent-blue"));
assert("mandatory skips blue", files.prefGroup.includes("showLeftAccent && !mandatory"));
assert("footer shared", files.cardFooter.includes("NotificationCardFooter"));
assert("canonical footer prop", files.eventRules.includes("canonicalFooter"));

assert("sininho ver todas", files.s7Bell.includes('to="/notificacoes"') && files.s7Bell.includes("Ver todas"));

assert("tickets menu item", files.avatarMenu.includes("Tickets"));
assert("tickets em breve", files.avatarMenu.includes('aria-disabled="true"') && files.avatarMenu.includes("Em breve"));
assert("tickets above suporte", files.avatarMenu.indexOf("Tickets") < files.avatarMenu.indexOf("Suporte"));
assert("tickets audit no seller route", files.ticketsNav.includes("PROFILE_TICKETS_SELLER_ROUTE = null"));
assert("tickets coming soon flag", files.ticketsNav.includes("PROFILE_TICKETS_COMING_SOON = true"));
assert("admin tickets only in audit", files.ticketsNav.includes("/admin/dev-center/tickets"));

assert("destinatarios untouched", files.recipientCard.includes("S7StatusBadge"));
assert("placeholders fixture registry", files.placeholders.includes("S7_SALES_POPUP_VISUAL_PLACEHOLDERS"));
assert("popup placeholders prop", files.popupSection.includes("useVisualPlaceholders"));

assert("nav builds from sections", files.navItems.includes("listNotificationCenterNavSections"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.16 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_16_unit.mjs");
