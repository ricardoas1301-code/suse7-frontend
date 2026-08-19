#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.6 — scroll Alterar Senha + modal avatar duas colunas
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  profileCss: join(root, "../src/components/Profile/Profile.css"),
  dadosEmpresaCss: join(root, "../src/components/Profile/DadosEmpresa.css"),
  alterarSenhaCss: join(root, "../src/components/Profile/AlterarSenha.css"),
  recipientModal: join(root, "../src/components/notifications/central/NotificationRecipientModal.jsx"),
  recipientModalCss: join(root, "../src/components/notifications/central/NotificationRecipientModal.css"),
  avatarAsset: join(root, "../src/assets/profile/modal-editar-destinatario-avatar.png"),
};

const files = Object.fromEntries(
  Object.entries(paths)
    .filter(([k]) => k !== "avatarAsset")
    .map(([k, p]) => [k, readFileSync(p, "utf8")])
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const empresaHero =
  files.dadosEmpresaCss.match(
    /\.dados-empresa-page:not\(\.ml-integrations-page\):not\(\.s7-notification-center-page\) \.profile-card\.s7-empresa-hero\s*\{[^}]+\}/s,
  )?.[0] ?? "";
const alterarHero =
  files.alterarSenhaCss.match(/\.alterar-senha-page \.profile-card\.s7-alterar-senha-hero\s*\{[^}]+\}/s)?.[0] ?? "";

assert("dados empresa hero no bottom inset margin hack", !/margin-bottom:\s*12px/.test(empresaHero));
assert("alterar senha hero no bottom inset margin hack", !/margin-bottom:\s*12px/.test(alterarHero));
assert("alterar senha scoped shell rule", files.profileCss.includes(":has(> .profile-content > .alterar-senha-page)"));
assert(
  "compact profile pages use shell padding for bottom inset",
  files.profileCss.includes("padding: var(--s7-empresa-page-gutter, 12px)") &&
    !/\.profile-content:has\(> \.alterar-senha-page\)[\s\S]*padding-bottom:\s*0/.test(files.profileCss),
);

assert("modal avatar asset import", files.recipientModal.includes("modal-editar-destinatario-avatar.png"));
try {
  readFileSync(paths.avatarAsset);
  assert("modal avatar asset file exists", true);
} catch {
  assert("modal avatar asset file exists", false);
}

assert("modal two column body", files.recipientModal.includes("s7-nrec-modal__body"));
assert("modal avatar column", files.recipientModal.includes("s7-nrec-modal__avatar-col"));
assert("modal wider panel", files.recipientModalCss.includes("min(820px"));
assert("modal fields full column width", !files.recipientModalCss.includes("66.666%"));
assert("modal object-fit contain", files.recipientModalCss.includes("object-fit: contain"));
assert("modal avatar aria hidden aside", files.recipientModal.includes('aria-hidden="true"'));
assert("modal required legend preserved", files.recipientModal.includes("Campos obrigatórios"));
assert("modal no cancel", !files.recipientModal.includes("Cancelar"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.6 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_6_unit.mjs");
