#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.2 — shell visual + menu do Perfil
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  shell: join(root, "../src/components/Profile/NotificationCenterPageShell.jsx"),
  shellCss: join(root, "../src/components/Profile/NotificationCenterPageShell.css"),
  profileCss: join(root, "../src/components/Profile/Profile.css"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
  historicoPage: join(root, "../src/components/Profile/NotificationHistorico.jsx"),
  avatarNav: join(root, "../src/components/Profile/AvatarProfileNavigation.jsx"),
  avatarMenu: join(root, "../src/components/AvatarMenu.jsx"),
  avatarMenuCss: join(root, "../src/components/AvatarMenu.css"),
  avatarAnchor: join(root, "../src/components/avatarMenuAnchor.js"),
  navConfig: join(root, "../src/components/Profile/profileNavigationConfig.js"),
  sections: join(root, "../src/constants/notificationCenterSections.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("shell component exists", files.shell.includes("NotificationCenterPageShell"));
assert("shell uses dados-empresa-page", files.shell.includes("dados-empresa-page s7-notification-center-page"));
assert("shell uses profile-card hero", files.shell.includes("profile-card s7-notification-center-hero"));
assert("shell title subtitle children", files.shell.includes("title") && files.shell.includes("subtitle") && files.shell.includes("children"));
assert("shell auto height", files.shellCss.includes("min-height: auto") && files.shellCss.includes("height: auto"));
assert("shell no overflow hidden", !files.shellCss.includes("overflow: hidden"));
assert("shell padding bottom 12", files.shellCss.includes("padding: 20px 24px 12px"));
assert("profile gutter for notification center", files.profileCss.includes(":has(.s7-notification-center-page)"));
assert("gutter token", files.profileCss.includes("--s7-empresa-page-gutter: 12px"));

const pages = ["categoryPage", "recipientsPage", "historicoPage"];
for (const key of pages) {
  assert(`${key} uses shell`, files[key].includes("NotificationCenterPageShell"));
}

assert("category six slugs via sections", files.sections.includes('slug: "vendas"'));
assert("eight sections total", (files.sections.match(/kind: "/g) ?? []).length >= 3);

assert("avatar nav semantic group title", files.avatarNav.includes("avatar-menu-nav-group__title"));
assert("avatar nav semantic group items", files.avatarNav.includes("avatar-menu-nav-group__items"));
assert("avatar nav semantic group item", files.avatarNav.includes("avatar-menu-nav-group__item"));
assert("avatar nav group separator symmetric", files.avatarMenuCss.includes(".avatar-menu-nav-group:not(:first-child)"));
assert("menu group border-top", files.avatarMenuCss.includes("border-top: 1px solid"));
assert("menu item compact gap", files.avatarMenuCss.includes("gap: 2px"));
assert("menu no nth-child spacing hack", !files.avatarMenuCss.includes("nth-child"));
assert("menu portal anchor helper", files.avatarMenu.includes("computeAvatarMenuAnchorPosition"));
assert("menu anchor uses navbar bottom", files.avatarAnchor.includes("navRect.bottom"));
assert("nav config preserved groups", files.navConfig.includes("PROFILE_NAVIGATION_GROUPS"));
assert("central section title preserved", files.navConfig.includes("CENTRAL DE NOTIFICAÇÕES"));

function jsxAfterReturn(source) {
  const idx = source.indexOf("return (");
  return idx >= 0 ? source.slice(idx) : source;
}

assert("historico modal outside shell", jsxAfterReturn(files.historicoPage).indexOf("</NotificationCenterPageShell>") < jsxAfterReturn(files.historicoPage).indexOf("<NotificationEventDetailsModal"));
assert("recipients modal outside shell", jsxAfterReturn(files.recipientsPage).indexOf("</NotificationCenterPageShell>") < jsxAfterReturn(files.recipientsPage).indexOf("<NotificationRecipientModal"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.2 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_shell_unit.mjs");
