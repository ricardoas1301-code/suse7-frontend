#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.5 — scroll inteligente + campos obrigatórios modal destinatário
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
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const heroBlock =
  files.dadosEmpresaCss.match(
    /\.dados-empresa-page:not\(\.ml-integrations-page\):not\(\.s7-notification-center-page\) \.profile-card\.s7-empresa-hero\s*\{[^}]+\}/s,
  )?.[0] ?? "";

assert("empresa hero flex shell min-height", /min-height:\s*0/.test(heroBlock));
assert("empresa hero no viewport calc", !/min-height:\s*calc\(/.test(heroBlock));
assert("empresa hero no bottom inset margin hack", !/margin-bottom:\s*12px/.test(heroBlock));

assert(
  "profile shell empresa fills viewport with padding inset",
  files.profileCss.includes(
    ".profile-content:has(> .dados-empresa-page:not(.s7-notification-center-page):not(.ml-integrations-page))",
  ) && files.profileCss.includes("flex: 1 1 auto"),
);
assert(
  "profile shell owns bottom inset via padding",
  files.profileCss.includes("padding: var(--s7-empresa-page-gutter, 12px)") &&
    !/\.profile-content:has\(> \.dados-empresa-page:not\(\.s7-notification-center-page\)\)[\s\S]*padding-bottom:\s*0/.test(
      files.profileCss,
    ),
);
assert(
  "profile layout empresa fills viewport shell",
  files.profileCss.includes(
    ".profile-layout.profile-layout--full:has(> .profile-content > .dados-empresa-page:not(.s7-notification-center-page):not(.ml-integrations-page))",
  ) && files.profileCss.includes("flex: 1 1 auto"),
);
assert("no global overflow hidden in profile css", !/overflow-y:\s*hidden/.test(files.profileCss));
assert("alterar senha hero min-height flex shell", /min-height:\s*0/.test(files.alterarSenhaCss));

assert("modal required legend", files.recipientModal.includes("Campos obrigatórios"));
assert("modal required legend css", files.recipientModalCss.includes(".s7-nrec-modal__required-legend"));
assert("modal red asterisk token", files.recipientModalCss.includes("var(--s7-color-error"));
assert("modal label helper", files.recipientModal.includes("LabelObrigatorio"));
assert("modal function optional unchanged", files.recipientModal.includes("Função (opcional)"));
assert("modal nome required attrs", files.recipientModal.includes('name="label"') && files.recipientModal.includes('aria-required="true"'));
assert("modal email required attrs", files.recipientModal.includes('name="email"') && files.recipientModal.includes("readOnly={isPrimary}"));
assert("modal whatsapp required attrs", files.recipientModal.includes('name="whatsapp"'));
assert("modal focus first invalid", files.recipientModal.includes("REQUIRED_FIELD_ORDER") && files.recipientModal.includes("s7-nrec-field-"));
assert("modal no plain label asterisks", !files.recipientModal.includes("Nome *") && !files.recipientModal.includes("E-mail *"));
assert("modal no cancel button", !files.recipientModal.includes("Cancelar"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.5 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_5_unit.mjs");
