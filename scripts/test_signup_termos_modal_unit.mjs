#!/usr/bin/env node

/**

 * Regressão — SSOT Termos + modal de aceite no SignUp (catálogo backend).

 */

import { readFileSync } from "node:fs";

import { fileURLToPath } from "node:url";

import { dirname, join } from "node:path";



const root = dirname(fileURLToPath(import.meta.url));



const signupSource = readFileSync(join(root, "../src/components/Signup.jsx"), "utf8");

const termsPageSource = readFileSync(join(root, "../src/pages/Terms.jsx"), "utf8");

const catalogSource = readFileSync(join(root, "../src/components/legal/TermsDocumentContent.jsx"), "utf8");

const modalSource = readFileSync(join(root, "../src/components/legal/TermsAcceptanceModal.jsx"), "utf8");

const catalogApiSource = readFileSync(join(root, "../src/services/legalDocumentCatalogApi.js"), "utf8");

const signupCssSource = readFileSync(join(root, "../src/components/Signup.css"), "utf8");



/** @type {string[]} */

const failures = [];



function assert(name, cond) {

  if (!cond) failures.push(name);

}



assert("signup uses terms acceptance modal", /TermsAcceptanceModal/.test(signupSource));

assert("signup opens modal instead of direct check", /setTermosModalOpen\(true\)/.test(signupSource));

assert("signup stores acceptance record", /setTermosAceite/.test(signupSource));

assert("signup sends acceptance via pending-birth", /criarSignupPendingBirth\(form, termosAceite\)/.test(signupSource));

assert("signup uncheck clears acceptance", /setTermosAceite\(null\)/.test(signupSource));

assert("signup two-phase pre-confirm UX", /setPreConfirmSuccess/.test(signupSource));

assert(

  "footer stacks terms then create account button",

  /className="signup-form-footer"/.test(signupSource) &&

    /signup-btn--stacked/.test(signupSource) &&

    signupSource.indexOf("signup-form-footer") > signupSource.indexOf("signup-senha2")

);



assert(

  "footer css is vertical stack",

  /\.signup-form-footer[\s\S]*flex-direction:\s*column/.test(signupCssSource) &&

    /\.signup-btn--stacked/.test(signupCssSource)

);

assert("terms page uses shared document content", /TermsDocumentContent/.test(termsPageSource));

assert("shared document consumes catalog hook", /useTermosUsoCatalogo/.test(catalogSource));

assert("modal requires scroll before accept", /useScrollAteFinal/.test(modalSource));

assert("modal confirm button label", /Aceitar e continuar/.test(modalSource));

assert("modal no header close button", !/s7-terms-modal__close/.test(modalSource));

assert("modal no cancel button", !/>Cancelar</.test(modalSource));

assert("modal closes on overlay click", /handleOverlayMouseDown/.test(modalSource));

assert(

  "modal closes only via confirm handler",

  /function handleConfirmar/.test(modalSource) && /onAccepted\(/.test(modalSource)

);

assert("acceptance uses scrolled_to_end not read flag", /scrolled_to_end/.test(modalSource));

assert("modal uses catalog metadata on confirm", /catalog\.document_type/.test(modalSource));

assert("catalog api fetches backend endpoint", /\/api\/legal\/documents\/terms-of-use/.test(catalogApiSource));

assert("catalog api fail controlled", /Não foi possível carregar os Termos de Uso/.test(catalogApiSource));



if (failures.length) {

  console.error("FAIL", failures);

  process.exit(1);

}



console.log("OK test_signup_termos_modal_unit", failures.length === 0 ? "all passed" : failures);

