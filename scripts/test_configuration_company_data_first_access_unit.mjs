#!/usr/bin/env node
/**
 * Refinos primeiro acesso social — modal Dados da empresa (M1).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  CONFIGURATION_COMPANY_DATA_MODAL_STATE,
  resolverEstadoModalDadosEmpresa,
} from "../src/features/dashboard/configurationOnboarding/configurationCompanyDataModalState.js";
import { CONFIGURATION_MILESTONE_ACTION_TYPES } from "../src/features/dashboard/configurationOnboarding/configurationMilestoneActionRegistry.js";
import {
  buildConfigurationCompanyDataCreateBody,
  mapConfigurationCompanyDataForm,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingFormHelpers.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const modalCompany = CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA;

assert(
  "FIRST_CREATE quando companyId ausente",
  resolverEstadoModalDadosEmpresa({
    actionType: modalCompany,
    companyId: null,
    companyAmbiguous: false,
  }).state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.FIRST_CREATE,
);

assert(
  "FIRST_CREATE não traz erro",
  resolverEstadoModalDadosEmpresa({
    actionType: modalCompany,
    companyId: null,
    companyAmbiguous: false,
  }).error === null,
);

assert(
  "EDIT_EXISTING quando companyId presente",
  resolverEstadoModalDadosEmpresa({
    actionType: modalCompany,
    companyId: "co-1",
    companyAmbiguous: false,
  }).state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.EDIT_EXISTING,
);

assert(
  "ERROR quando ambíguo",
  resolverEstadoModalDadosEmpresa({
    actionType: modalCompany,
    companyId: null,
    companyAmbiguous: true,
  }).state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR,
);

assert(
  "ERROR quando fetch falha",
  resolverEstadoModalDadosEmpresa({
    actionType: modalCompany,
    companyId: "co-1",
    companyAmbiguous: false,
    fetchFailed: true,
    fetchError: "Falha de rede",
  }).state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR,
);

const socialEmail = "seller@real.com";
const mapped = mapConfigurationCompanyDataForm({}, { accountEmail: socialEmail });
assert("email social pré-preenchido", mapped.contact_email === socialEmail);
assert("form vazio sem company", mapped.company_name === "" && mapped.trade_name === "");

const createBody = buildConfigurationCompanyDataCreateBody({
  company_name: "Razão LTDA",
  trade_name: "Fantasia",
  document_cnpj: "62194333000156",
  contact_email: socialEmail,
  whatsapp: "17999998888",
});
assert("create body flag onboarding", createBody.configuration_onboarding === true);
assert("create body is_primary", createBody.is_primary === true);
assert("create body document_cnpj", createBody.document_cnpj === "62194333000156");

const root = dirname(fileURLToPath(import.meta.url));
const dashboardSrc = readFileSync(join(root, "../src/components/Dashboard.jsx"), "utf8");
assert("Dashboard não importa CompleteProfileModal", !dashboardSrc.includes('import CompleteProfileModal'));
assert("Dashboard não renderiza CompleteProfileModal", !dashboardSrc.includes("<CompleteProfileModal"));
assert("Dashboard não consulta primeiro_login", !dashboardSrc.includes("primeiro_login"));

const modalSrc = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationCompanyDataModal.jsx"),
  "utf8",
);
assert("email readonly no modal", modalSrc.includes("readOnly={contactEmailLocked}"));
assert("email classe bloqueada", modalSrc.includes("s7-co-input-readonly"));
assert("grid duas colunas desktop", modalSrc.includes("configuration-onboarding-modal-form__row"));
assert("titulo Dados da Loja", modalSrc.includes('title="Dados da Loja"'));
assert("label Nome da Loja", modalSrc.includes("Nome da Loja"));

const hostSrc = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingActionsHost.jsx"),
  "utf8",
);
assert("host usa create onboarding", hostSrc.includes("createSellerCompanyForConfiguration"));
assert("host usa resolverEstadoModalDadosEmpresa", hostSrc.includes("resolverEstadoModalDadosEmpresa"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, test: "configuration_company_data_first_access_unit", failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify({
    pass: true,
    test: "configuration_company_data_first_access_unit",
    cases: 17,
  }),
);
