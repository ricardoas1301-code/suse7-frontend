#!/usr/bin/env node
/**
 * Regressão — SignUp UX: validação sequencial, ordem visual e Google.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  SIGNUP_VALIDATION_FIELD_ORDER,
  SIGNUP_REQUIRED_FIELD_MESSAGES,
  getFirstSignupValidationError,
  getSignupRequiredFieldMessage,
  toSequentialSignupErrors,
  clearSignupFieldValidity,
  showSignupFieldValidation,
} from "../src/components/signupFormPresentation.js";

const root = dirname(fileURLToPath(import.meta.url));
const signupSource = readFileSync(join(root, "../src/components/Signup.jsx"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert(
  "visual label Nome da Loja",
  /Nome da Loja/.test(signupSource) && !/Nome fantasia/.test(signupSource),
);

assert(
  "payload key nome_loja preserved",
  /nome_loja/.test(signupSource) && /form\.nome_loja/.test(signupSource),
);

assert(
  "razao social required with asterisk",
  /Razão social <ReqMark \/>/.test(signupSource) &&
    /if\s*\(\s*!String\(form\.nome/.test(signupSource),
);

assert(
  "form uses sequential error presentation",
  /toSequentialSignupErrors/.test(signupSource) &&
    /setErrors\(sequentialErrors\)/.test(signupSource),
);

assert(
  "validation field order starts with nome (razao social)",
  SIGNUP_VALIDATION_FIELD_ORDER[0] === "nome",
);

assert(
  "validation field order excludes cep",
  !SIGNUP_VALIDATION_FIELD_ORDER.includes("cep"),
);

assert(
  "sequential errors exposes only one field",
  Object.keys(
    toSequentialSignupErrors({
      nome: SIGNUP_REQUIRED_FIELD_MESSAGES.nome,
      nome_loja: SIGNUP_REQUIRED_FIELD_MESSAGES.nome_loja,
      email: SIGNUP_REQUIRED_FIELD_MESSAGES.email,
    }),
  ).length === 1,
);

assert(
  "sequential errors picks razao social first with personalized message",
  toSequentialSignupErrors({
    nome: SIGNUP_REQUIRED_FIELD_MESSAGES.nome,
    nome_loja: SIGNUP_REQUIRED_FIELD_MESSAGES.nome_loja,
  }).nome === "Informe a razão social.",
);

assert(
  "sequential errors picks nome fantasia after razao social filled",
  toSequentialSignupErrors({
    nome_loja: SIGNUP_REQUIRED_FIELD_MESSAGES.nome_loja,
    cpf_cnpj: SIGNUP_REQUIRED_FIELD_MESSAGES.cpf_cnpj,
  }).nome_loja === "Informe o nome fantasia.",
);

assert(
  "sequential errors picks cpf after nome fantasia",
  toSequentialSignupErrors({
    cpf_cnpj: SIGNUP_REQUIRED_FIELD_MESSAGES.cpf_cnpj,
    email: SIGNUP_REQUIRED_FIELD_MESSAGES.email,
  }).cpf_cnpj === "Informe o CPF/CNPJ.",
);

assert(
  "required messages avoid generic Campo obrigatorio for known fields",
  Object.values(SIGNUP_REQUIRED_FIELD_MESSAGES).every((msg) => msg !== "Campo obrigatório"),
);

assert(
  "signup validarCampos uses getSignupRequiredFieldMessage",
  /getSignupRequiredFieldMessage/.test(signupSource) &&
    !/e\.nome\s*=\s*["']Campo obrigatório["']/.test(signupSource),
);

assert(
  "razao social message parity",
  getSignupRequiredFieldMessage("nome") === "Informe a razão social.",
);

assert(
  "nome fantasia message parity with nova empresa copy",
  getSignupRequiredFieldMessage("nome_loja") === "Informe o nome fantasia.",
);

assert(
  "whatsapp message parity with nova empresa copy",
  getSignupRequiredFieldMessage("whatsapp") === "Informe o WhatsApp.",
);

assert(
  "validation field order excludes imposto",
  !SIGNUP_VALIDATION_FIELD_ORDER.includes("imposto_percentual"),
);

assert(
  "getFirstSignupValidationError follows canonical order",
  getFirstSignupValidationError({
    senha: "x",
    email: SIGNUP_REQUIRED_FIELD_MESSAGES.email,
    nome: SIGNUP_REQUIRED_FIELD_MESSAGES.nome,
  })?.field === "nome",
);

assert(
  "getFirstSignupValidationError returns null when empty",
  getFirstSignupValidationError({}) === null,
);

assert(
  "visual order line 1 razao + nome da loja",
  /Linha 1: Razão social \| Nome da Loja/.test(signupSource),
);

assert(
  "visual order line 2 cpf + email",
  /Linha 2: CPF\/CNPJ \| E-mail/.test(signupSource),
);

assert(
  "visual order line 3 whatsapp + telefone before senha",
  /Linha 3: WhatsApp \| Telefone/.test(signupSource) &&
    signupSource.indexOf("signup-whatsapp") < signupSource.indexOf("signup-senha"),
);

assert("google button preserved", /Entrar com Google/.test(signupSource));
assert("divider preserved", /signup-divider__text/.test(signupSource));

assert("presentation helpers export showSignupFieldValidation", typeof showSignupFieldValidation === "function");
assert("presentation helpers export clearSignupFieldValidity", typeof clearSignupFieldValidity === "function");

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log("OK test_signup_ux_unit", failures.length === 0 ? "all passed" : failures);
