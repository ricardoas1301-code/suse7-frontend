#!/usr/bin/env node
/**
 * Regressão — SignUp simplificado V2 (campos visíveis, CEP opcional no onboarding).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SIGNUP_REQUIRED_FIELD_MESSAGES,
  SIGNUP_VALIDATION_FIELD_ORDER,
} from "../src/components/signupFormPresentation.js";
import { montarSignupProfilePayload } from "../src/components/signupAccountPayload.js";

const root = dirname(fileURLToPath(import.meta.url));
const signupSource = readFileSync(join(root, "../src/components/Signup.jsx"), "utf8");
const marketingSource = readFileSync(join(root, "../src/components/SignupMarketingColumn.jsx"), "utf8");
const signupCss = readFileSync(join(root, "../src/components/Signup.css"), "utf8");

/** @type {string[]} */
const failures = [];

function check(name, cond) {
  if (!cond) failures.push(name);
}

const CAMPOS_VISIVEIS = [
  "Razão social",
  "Nome fantasia",
  "CPF/CNPJ",
  "E-mail",
  "WhatsApp",
  "Telefone",
];

for (const label of CAMPOS_VISIVEIS) {
  check(`campo visível: ${label}`, signupSource.includes(label));
}

const CAMPOS_REMOVIDOS = [
  "Custo operacional",
  'htmlFor="signup-cep"',
  'name="cep"',
  'id="signup-numero"',
  'id="signup-endereco"',
  "Complemento",
  'id="signup-bairro"',
  'id="signup-cidade"',
  'id="signup-estado"',
  "Hora de encerramento operacional",
  "OperationalWorkingDaysField",
  "buscarCEP",
  "row--fiscal-quad",
  "signup-custo-operacional",
  'id="signup-imposto"',
  "Imposto (%)",
];

for (const token of CAMPOS_REMOVIDOS) {
  check(`ausente no sign-up: ${token}`, !signupSource.includes(token));
}

check("validação não inclui cep", !SIGNUP_VALIDATION_FIELD_ORDER.includes("cep"));
check("mensagens não incluem cep", !("cep" in SIGNUP_REQUIRED_FIELD_MESSAGES));
check("validarCampos não exige cep", !/if\s*\(\s*!form\.cep\s*\)/.test(signupSource));

// Two-phase: Signup.jsx não monta profile localmente no submit — delega ao pending-birth backend.
check("two-phase usa criarSignupPendingBirth", /criarSignupPendingBirth\(/.test(signupSource));
check("two-phase usa vincularSignupPendingBirth", /vincularSignupPendingBirth\(/.test(signupSource));
check("two-phase usa abortarSignupPendingBirth", /abortarSignupPendingBirth\(/.test(signupSource));
check("two-phase não faz profiles.upsert no submit email/senha", !/handleSubmit[\s\S]{0,4000}\.from\("profiles"\)\.upsert/.test(signupSource));
check("two-phase exibe SignupCheckEmail pós-pre-confirm", /SignupCheckEmail/.test(signupSource) && /preConfirmSuccess/.test(signupSource));
check("auth signUp inclui signup_pending_pointer metadata", /signup_pending_pointer/.test(signupSource));

// Helper montarSignupProfilePayload permanece válido para outros fluxos — teste de contrato do módulo.
check("montarSignupProfilePayload omite campos de onboarding tardio", (() => {
  const payloadSemCep = montarSignupProfilePayload(
    {
      nome: "Empresa Teste LTDA",
      nome_loja: "Empresa Teste",
      whatsapp: "(11) 99999-9999",
      telefone: "",
      cpf_cnpj: "12.345.678/0001-90",
    },
    "user-uuid",
    "seller@example.com",
  );
  return (
    payloadSemCep.nome === "Empresa Teste LTDA" &&
    payloadSemCep.email === "seller@example.com" &&
    !("imposto_percentual" in payloadSemCep) &&
    !("cep" in payloadSemCep) &&
    !("endereco" in payloadSemCep) &&
    !("operational_day_closes_at" in payloadSemCep) &&
    !("operational_working_days" in payloadSemCep)
  );
})());

check("marketing mantém primeiro benefício", /📊 Toda a sua operação em um só lugar/.test(marketingSource));
check("marketing remove bloco de margem", !/💰 Venda sabendo quanto realmente está ganhando/.test(marketingSource));
check("marketing remove footer", !/signup-marketing-footer/.test(marketingSource));
check("marketing usa wrapper centralizável", /signup-left__content/.test(marketingSource));
check("css centraliza coluna esquerda", /\.signup-left__content[\s\S]*justify-content:\s*center/.test(signupCss));
check("divisor so texto", /signup-divider__text/.test(signupSource) && !/signup-divider__line/.test(signupSource));
check("espacamento divisor compacto", /\.signup-divider[\s\S]*margin-top:\s*20px[\s\S]*margin-bottom:\s*28px/.test(signupCss));
check("card padding-top 36px", /\.signup-right[\s\S]*padding:\s*36px 20px 64px/.test(signupCss));
check("senhas proximas dos termos", /\.signup-right form > \.row:has\(\+ \.signup-form-footer\)[\s\S]*margin-bottom:\s*10px/.test(signupCss));
check("footer termos para cta triplo", /\.signup-right \.signup-form-footer \{[\s\S]*gap:\s*36px[\s\S]*margin-top:\s*12px/.test(signupCss));
check("cta abaixo dos termos", /signup-form-footer/.test(signupSource) && /signup-btn--stacked/.test(signupSource));
check("botao mesma altura dos inputs", /\.signup-btn--stacked[\s\S]*min-height:\s*var\(--su-in-minh\)/.test(signupCss));
check("rows com respiro 28px", /\.signup-right \.row[\s\S]*margin-bottom:\s*28px/.test(signupCss));
check("linha imposto removida", !/row--imposto-single/.test(signupSource));

if (failures.length) {
  console.error("FAIL test_signup_simplified_v2_unit", failures);
  process.exit(1);
}

console.log("PASS test_signup_simplified_v2_unit");
