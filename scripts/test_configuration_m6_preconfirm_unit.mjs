#!/usr/bin/env node
/**
 * 01E-C — M6 preconfirm + registry + mask
 */
import { milestoneAcaoClicavel, resolverAcaoMilestone } from "../src/features/dashboard/configurationOnboarding/configurationMilestoneActionRegistry.js";
import { CONFIGURATION_MILESTONE_ACTION_TYPES } from "../src/features/dashboard/configurationOnboarding/configurationMilestoneActionRegistry.js";
import {
  mascararDocumentoFiscalBr,
  resolverNomeEmpresaPreConfirmacao,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingDocumentMask.js";
import { formatCpfCnpjBr } from "../src/utils/profileInputMasks.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const m1m5Complete = [
  { id: "COMPANY_DATA", status: "COMPLETED" },
  { id: "LEGAL_ACCEPTANCE", status: "COMPLETED" },
  { id: "TAX_RATE", status: "COMPLETED" },
  { id: "OPERATIONAL_COST", status: "COMPLETED" },
  { id: "OPERATIONAL_CYCLE", status: "COMPLETED" },
  { id: "FIRST_MARKETPLACE_CONNECTION", status: "PENDING" },
];

const action = resolverAcaoMilestone("FIRST_MARKETPLACE_CONNECTION");
assert("M6 implemented", action.implemented === true);
assert("M6 action type", action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM);
assert(
  "M6 clickable at 83",
  milestoneAcaoClicavel("FIRST_MARKETPLACE_CONNECTION", "PENDING", m1m5Complete) === true,
);

assert("CNPJ masked", mascararDocumentoFiscalBr("62194333000156") === "62.***.***/****-56");
assert("CPF masked", mascararDocumentoFiscalBr("12345678901") === "***.***.***-01");
assert(
  "company name",
  resolverNomeEmpresaPreConfirmacao({ trade_name: "Fantasia", company_name: "Razão" }) === "Fantasia",
);
assert(
  "CNPJ full pt-BR for preconfirm",
  formatCpfCnpjBr("62194333000156") === "62.194.333/0001-56",
);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_m6_preconfirm_01e_c",
      cases: 8,
      failures: 0,
    },
    null,
    2,
  ),
);
