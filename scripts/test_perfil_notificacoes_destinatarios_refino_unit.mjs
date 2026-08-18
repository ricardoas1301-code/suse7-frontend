#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.4 — refinamentos menu + destinatários
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  avatarMenu: join(root, "../src/components/AvatarMenu.jsx"),
  avatarMenuCss: join(root, "../src/components/AvatarMenu.css"),
  avatarAnchor: join(root, "../src/components/avatarMenuAnchor.js"),
  avatarNav: join(root, "../src/components/Profile/AvatarProfileNavigation.jsx"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  recipientCardCss: join(root, "../src/components/notifications/central/NotificationRecipientCard.css"),
  recipientModal: join(root, "../src/components/notifications/central/NotificationRecipientModal.jsx"),
  recipientModalCss: join(root, "../src/components/notifications/central/NotificationRecipientModal.css"),
  recipientDeleteModal: join(root, "../src/components/notifications/central/NotificationRecipientDeleteModal.jsx"),
  groupsService: join(root, "../../suse7-backend/src/domain/notifications/central/seller/sellerNotificationRecipientGroupsService.js"),
  syncService: join(root, "../../suse7-backend/src/domain/notifications/central/seller/syncPrimaryRecipientCompanyContact.js"),
  migration: join(root, "../../suse7-backend/supabase/migrations/20260720180000_s7_notification_recipients_soft_delete.sql"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("menu portal anchored", files.avatarMenu.includes("avatar-menu--anchored") && files.avatarMenu.includes("createPortal"));
assert("menu anchor helper", files.avatarAnchor.includes("navbar-premium") && files.avatarAnchor.includes("getBoundingClientRect"));
assert("menu symmetric group gap css", files.avatarMenuCss.includes(".avatar-menu-nav-group:not(:first-child)"));
assert("menu border-top separator", files.avatarMenuCss.includes("border-top: 1px solid"));
assert("no separator div in nav", !files.avatarNav.includes("avatar-menu-nav-group__separator"));

assert("section copy email whatsapp", files.recipientsPage.includes("e-mail ou WhatsApp"));

assert("card dl anatomy", files.recipientCard.includes("<dl className=\"s7-nrec-card__facts\""));
assert("card function dash", files.recipientCard.includes("Função"));
assert("card status uniform class", files.recipientCardCss.includes(".s7-nrec-card__status"));
assert("card email nowrap desktop", files.recipientCardCss.includes("white-space: nowrap"));

assert("modal primary name editable", !files.recipientModal.includes("label: e.target.value }))}\n                maxLength={120}\n                readOnly={isPrimary}"));
assert("modal email readonly primary only", files.recipientModal.includes("readOnly={isPrimary}") && files.recipientModal.includes("e-mail de acesso"));
assert("modal no contato legend", !files.recipientModal.includes("<legend>Contato</legend>"));
assert("modal no cancel button", !files.recipientModal.includes("Cancelar"));
assert("modal no whatsapp helper", !files.recipientModal.includes("Somente números"));
assert("modal focus visible", files.recipientModalCss.includes(":focus-visible"));

assert("delete modal history copy", files.recipientDeleteModal.includes("novas notificações"));
assert("delete modal preserve history", files.recipientDeleteModal.includes("histórico de notificações será preservado"));

assert("soft delete migration", files.migration.includes("deleted_at"));
assert("list filters deleted", files.groupsService.includes('.is("deleted_at", null)'));
assert("archive not physical delete recipients", !files.groupsService.includes('from("s7_notification_recipients")\n    .delete()'));
assert("sync primary service", files.syncService.includes("profiles") && files.syncService.includes("seller_companies"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.4 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_destinatarios_refino_unit.mjs");
