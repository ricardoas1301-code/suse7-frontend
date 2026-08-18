#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.7 — header destinatários, grade 4×2, rodapé modal
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  shell: join(root, "../src/components/Profile/NotificationCenterPageShell.jsx"),
  shellCss: join(root, "../src/components/Profile/NotificationCenterPageShell.css"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
  hubCss: join(root, "../src/components/Profile/CentralNotificacoesHub.css"),
  recipientModal: join(root, "../src/components/notifications/central/NotificationRecipientModal.jsx"),
  recipientModalCss: join(root, "../src/components/notifications/central/NotificationRecipientModal.css"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("shell headerAction prop", files.shell.includes("headerAction"));
assert("shell title row", files.shell.includes("s7-notification-center-hero__title-row"));
assert("shell actions slot", files.shell.includes("s7-notification-center-hero__actions"));

assert("recipients page class scope", files.recipientsPage.includes("s7-ncenter-recipients-page"));
assert("recipients new intro copy", files.recipientsPage.includes("Cadastre e gerencie as pessoas"));
assert("recipients button in headerAction", files.recipientsPage.includes("Adicionar destinatário"));
assert("recipients removed pessoas cadastradas", !files.recipientsPage.includes("Pessoas cadastradas"));
assert("recipients removed intermediate copy", !files.recipientsPage.includes("Gerencie os contatos"));

assert("recipients grid four columns", /\.s7-ncenter-recipients-page \.s7-cnhub__recipients-grid[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/.test(files.hubCss));
assert("recipients scoped grid no auto-fit", !/\.s7-ncenter-recipients-page \.s7-cnhub__recipients-grid[\s\S]*auto-fit/.test(files.hubCss));
assert("recipients page min-height viewport", files.hubCss.includes(".s7-ncenter-recipients-page"));
assert("recipients hero flex fill", files.hubCss.includes(".s7-ncenter-recipients-page .profile-card.s7-notification-center-hero"));
assert("recipients grid breakpoints", files.hubCss.includes("repeat(3, minmax(0, 1fr))") && files.hubCss.includes("repeat(2, minmax(0, 1fr))"));

assert("modal footer status block", files.recipientModal.includes("s7-nrec-modal__footer-status"));
assert("modal switch in footer", files.recipientModal.includes('s7-nrec-modal__switch-label">Ativo'));
assert("modal no switch row in fields", !files.recipientModal.includes("s7-nrec-modal__switch-row"));
assert("modal footer space between", files.recipientModalCss.includes("justify-content: space-between"));

assert("category page no headerAction required", !files.categoryPage.includes("headerAction="));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.7 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_7_unit.mjs");
