#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.8 — foco modal + remoção Ativar/Desativar dos cards
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  recipientModal: join(root, "../src/components/notifications/central/NotificationRecipientModal.jsx"),
  recipientCard: join(root, "../src/components/notifications/central/NotificationRecipientCard.jsx"),
  recipientsPage: join(root, "../src/components/Profile/NotificationCenterRecipientsPage.jsx"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("modal stable handleClose", files.recipientModal.includes("useCallback") && files.recipientModal.includes("onCloseRef"));
assert("modal focus invalid pending ref", files.recipientModal.includes("focusInvalidPendingRef"));
assert("modal focus only after invalid submit", files.recipientModal.includes("focusInvalidPendingRef.current = true"));
assert("modal focus effect gated by pending ref", /!focusInvalidPendingRef\.current/.test(files.recipientModal));

assert("card no ativar desativar", !files.recipientCard.includes("Desativar") && !files.recipientCard.includes("Ativar"));
assert("card no onToggleActive prop", !files.recipientCard.includes("onToggleActive"));
assert("card keeps editar", files.recipientCard.includes("Editar"));
assert("card keeps remover secondary", files.recipientCard.includes("Remover"));

assert("page no handleToggleActive", !files.recipientsPage.includes("handleToggleActive"));
assert("page no onToggleActive prop", !files.recipientsPage.includes("onToggleActive"));
assert("page keeps modal submit", files.recipientsPage.includes("handleRecipientSubmit"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.8 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_8_unit.mjs");
