#!/usr/bin/env node
/**
 * S1.PERFIL-SUPORTE.1 — Fale Conosco modal layout + avatar
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  modal: join(root, "../src/components/ContactModal.jsx"),
  modalCss: join(root, "../src/components/ContactModal.css"),
  api: join(root, "../src/services/faleConoscoContactApi.js"),
  ui: join(root, "../src/services/faleConoscoContactUi.js"),
  focusHook: join(root, "../src/components/ui/useS7DialogFocus.js"),
  avatarMenu: join(root, "../src/components/AvatarMenu.jsx"),
  sections: join(root, "../src/constants/notificationCenterSections.js"),
  avatarAsset: join(root, "../src/assets/profile/modal-fale-conosco-avatar.png"),
};

const files = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => key !== "avatarAsset")
    .map(([k, p]) => [k, readFileSync(p, "utf8")])
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("avatar asset exists", existsSync(paths.avatarAsset));
assert("avatar imported locally", files.modal.includes('modal-fale-conosco-avatar.png'));
assert("no external avatar url", !files.modal.match(/https?:\/\/.*avatar/i));
assert("no base64 avatar", !files.modal.includes("data:image"));

assert("two column body", files.modal.includes("contact-modal__body"));
assert("form main column", files.modal.includes("contact-modal__main"));
assert("head inside main column", files.modal.includes("contact-modal__head") && files.modal.indexOf("contact-modal__main") < files.modal.indexOf("contact-modal__head"));
assert("title Fale Conosco", files.modal.includes(">Fale Conosco<"));
assert("avatar aside", files.modal.includes("contact-modal__avatar-col"));
assert("success feedback below avatar", /contact-modal__avatar-col[\s\S]*contact-modal__success/.test(files.modal));
assert(
  "success not below submit in main",
  !/<\/form>\s*\n\s*\{success \? <p className="msg-success"/.test(files.modal),
);
assert("avatar img decorative", files.modal.includes('alt=""'));

assert("grid two columns css", files.modalCss.includes("grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.85fr)"));
assert("modal width 900", files.modalCss.includes("min(900px, calc(100vw - 32px))"));
assert("modal max height", files.modalCss.includes("min(760px, calc(100dvh - 32px))"));
assert("textarea min 180", files.modalCss.includes("min-height: 180px"));
assert("textarea resize bloqueado", files.modalCss.includes("resize: none"));
assert("textarea scroll interno", files.modalCss.includes("overflow-y: auto"));
assert("mensagem obrigatoria", /name="message"[\s\S]*required/.test(files.modal));
assert("mensagem suprime tooltip nativo", files.modal.includes("onInvalid={(event) => event.preventDefault()}"));
assert("avatar contain sizing", files.modalCss.includes("max-width: 320px") && files.modalCss.includes("object-fit: contain"));
assert("avatar column stacks success", files.modalCss.includes("flex-direction: column") && files.modalCss.includes(".contact-modal__success"));
assert("no avatar position absolute", !files.modalCss.match(/contact-modal__avatar[\s\S]*position:\s*(absolute|fixed)/));
assert("head centered in column", files.modalCss.includes(".contact-modal__head") && files.modalCss.includes("text-align: center"));
assert("responsive breakpoint 860", files.modalCss.includes("max-width: 860px"));

assert("form fields preserved", files.modal.includes('name="name"') && files.modal.includes('name="email"') && files.modal.includes('name="subject"') && files.modal.includes('name="message"'));
assert("subject options preserved", files.modal.includes("FALE_CONOSCO_SUBJECT_OPTIONS"));
assert("submit preserved", files.modal.includes("postFaleConoscoContact"));
assert("payload fields in api", files.api.includes("name:") && files.api.includes("email:") && files.api.includes("subject:") && files.api.includes("message:"));
assert("api endpoint unchanged", files.api.includes("/api/public/fale-conosco/contact"));

assert("dialog role", files.modal.includes('role="dialog"'));
assert("aria-modal", files.modal.includes('aria-modal="true"'));
assert("focus trap hook", files.modal.includes("useS7DialogFocus"));
assert("escape in focus hook", files.focusHook.includes('event.key === "Escape"'));
assert("backdrop close", files.modal.includes("handleOverlayMouseDown"));

assert("internal events hidden", files.sections.includes("FALE_CONOSCO_TEAM") && files.sections.includes("FALE_CONOSCO_CONFIRMATION"));
assert("internal events filter", files.sections.includes("filterSellerFacingNotificationTypes"));

assert("avatar menu opens modal", files.avatarMenu.includes("ContactModal"));

if (failures.length) {
  console.error("[S1.PERFIL-SUPORTE.1 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_suporte_1_unit.mjs");
