#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.3 — destinatários + menu do Perfil
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  avatarNav: join(root, "../src/components/Profile/AvatarProfileNavigation.jsx"),
  avatarMenuCss: join(root, "../src/components/AvatarMenu.css"),
  avatarMenu: join(root, "../src/components/AvatarMenu.jsx"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  recipientModal: join(root, "../src/components/notifications/central/NotificationRecipientModal.jsx"),
  recipientDeleteModal: join(root, "../src/components/notifications/central/NotificationRecipientDeleteModal.jsx"),
  recipientModalCss: join(root, "../src/components/notifications/central/NotificationRecipientModal.css"),
  ensurePrimary: join(root, "../../suse7-backend/src/domain/notifications/central/seller/ensureSellerPrimaryRecipient.js"),
  groupsService: join(root, "../../suse7-backend/src/domain/notifications/central/seller/sellerNotificationRecipientGroupsService.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("menu group separator symmetric css", files.avatarMenuCss.includes(".avatar-menu-nav-group:not(:first-child)"));
assert("menu portal anchor", files.avatarMenu.includes("computeAvatarMenuAnchorPosition"));
assert("menu no header gap calc", !files.avatarMenuCss.includes("calc(100% + 8px)"));
assert("menu open animation class", files.avatarMenu.includes("avatar-menu--open"));
assert("menu reveal animation", files.avatarMenuCss.includes("avatarMenuReveal"));
assert("menu reduced motion", files.avatarMenuCss.includes("prefers-reduced-motion: reduce"));
assert("menu transform origin top right", files.avatarMenuCss.includes("transform-origin: top right"));

assert("recipients intro copy SUSE7", files.recipientsPage.includes("notificações do SUSE7"));
assert("recipients intro cadastre e gerencie", files.recipientsPage.includes("Cadastre e gerencie as pessoas"));
assert("recipients no pessoas cadastradas", !files.recipientsPage.includes("Pessoas cadastradas"));
assert("recipients header action in shell", files.recipientsPage.includes("headerAction"));
assert("no window.confirm", !files.recipientsPage.includes("window.confirm"));
assert("delete modal wired", files.recipientsPage.includes("NotificationRecipientDeleteModal"));
assert("show full contact on page", files.recipientsPage.includes("showFullContact"));

assert("card primary badge", files.recipientCard.includes("s7-nrec-card__primary-badge"));
assert("card masking preserved by default", files.recipientCard.includes("maskEmail"));
assert("card full contact prop", files.recipientCard.includes("showFullContact"));

assert("edit modal useS7DialogFocus", files.recipientModal.includes("useS7DialogFocus"));
assert("edit modal no close X", !files.recipientModal.includes("s7-nrec-modal__close"));
assert("edit modal primary readonly email helper", files.recipientModal.includes("e-mail de acesso da conta"));
assert("edit modal switch", files.recipientModal.includes("s7-nrec-modal__switch"));
assert("edit modal blue border", files.recipientModalCss.includes("border-top: 4px solid"));

assert("delete modal danger border", files.recipientDeleteModal.includes("Remover destinatário?"));
assert("delete modal manter action", files.recipientDeleteModal.includes("Manter destinatário"));
assert("delete modal confirm action", files.recipientDeleteModal.includes("Remover destinatário"));
assert("delete modal preserve history copy", files.recipientDeleteModal.includes("histórico de notificações será preservado"));

assert("ensure primary service", files.ensurePrimary.includes("ensureSellerPrimaryRecipient"));
assert("primary protected error", files.ensurePrimary.includes("PRIMARY_RECIPIENT_PROTECTED"));
assert("groups aggregate is_primary", files.groupsService.includes("is_primary"));
assert("groups list calls ensure", files.groupsService.includes("ensureSellerPrimaryRecipient"));
assert("groups delete blocks primary", files.groupsService.includes("PRIMARY_RECIPIENT_ERROR"));
assert("groups patch blocks primary deactivate", files.groupsService.includes("destinatário principal deve permanecer ativo"));

assert("modal footer switch and save same row", files.recipientModal.includes("s7-nrec-modal__footer-status"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.3 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_destinatarios_unit.mjs");
