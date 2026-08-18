#!/usr/bin/env node
/**
 * Regressão — tela própria de sucesso pós-cadastro (SignupCheckEmail).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const signupSource = readFileSync(join(root, "../src/components/Signup.jsx"), "utf8");
const successSource = readFileSync(join(root, "../src/pages/SignupCheckEmail.jsx"), "utf8");
const successCss = readFileSync(join(root, "../src/pages/SignupCheckEmail.css"), "utf8");

/** @type {string[]} */
const failures = [];

function check(name, cond) {
  if (!cond) failures.push(name);
}

check("signup early return tela propria", /if\s*\(\s*preConfirmSuccess\s*\)[\s\S]*return\s*<SignupCheckEmail/.test(signupSource));
check("signup nao embute sucesso no card direito", !/signup-right[\s\S]{0,80}preConfirmSuccess/.test(signupSource));
check("titulo conta criada", successSource.includes("Conta criada com sucesso"));
check("boas-vindas SUSE7", successSource.includes("Seja bem-vindo à SUSE7!"));
check("email mascarado preservado", successSource.includes("{emailMasked"));
check("texto spam auxiliar", successSource.includes("pasta de spam") && successSource.includes("lixo eletrônico"));
check("cta unico ir para login", successSource.includes("Ir para o login") && successSource.includes('to="/login"'));
check("sem botao entendi", !successSource.includes("Entendi"));
check("sem onClose", !successSource.includes("onClose"));
check("css pagina propria centralizada", successCss.includes(".signup-success-page") && successCss.includes("align-items: center"));
check("copy entrar no SUSE7", successSource.includes("entrar no SUSE7") && !successSource.includes("entrar na plataforma"));
check("avatars dentro do card", successSource.includes("signup-success-card__body") && successSource.indexOf("signup-success-card__avatar--left") > successSource.indexOf("signup-success-card__body"));
check("avatar altura card", successCss.includes(".signup-success-card__avatar-img") && successCss.includes("height: 100%") && successCss.includes("object-fit: contain"));
check("css grid avatars internos", successCss.includes("grid-template-columns: minmax(195px, 1.08fr) minmax(0, 1.45fr) minmax(195px, 1.08fr)"));
check("css card com avatars", successCss.includes("min(1150px"));
check("avatar masculino 10% maior", successCss.includes(".signup-success-card__avatar--right .signup-success-card__avatar-img") && successCss.includes("transform: scale(1.1)"));
check("cta azul principal", successCss.includes(".signup-success-card__cta") && successCss.includes("background: #007bff"));

if (failures.length) {
  console.error("FAIL test_signup_check_email_unit", failures);
  process.exit(1);
}

console.log("PASS test_signup_check_email_unit");
