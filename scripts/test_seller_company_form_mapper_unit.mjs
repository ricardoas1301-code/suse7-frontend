#!/usr/bin/env node
/**
 * S1.7.3 — Unit tests mapper (e-mail secundário SSOT + dirty state).
 */
import {
  buildSellerCompanyCreateBody,
  buildSellerCompanyEditPatchBody,
  formatSellerCompanyCepInputFromApi,
  formatSellerCompanyPercentInputFromApi,
  mapSellerCompanyApiToForm,
  normalizeSellerCompanyCepForPatch,
  normalizeSellerCompanyContactEmailForPatch,
  SELLER_COMPANY_CREATE_REQUIRED_FIELD_ORDER,
  validateSellerCompanyCepInput,
  validateSellerCompanyCreateForm,
} from "../src/components/Profile/sellerCompanyFormMapper.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("percent 1.00 api", formatSellerCompanyPercentInputFromApi("1.00") === "1,00");
assert("cep api mask", formatSellerCompanyCepInputFromApi("15025055") === "15025-055");
assert("validate empty cep", validateSellerCompanyCepInput("").ok === true);
assert("normalize email patch", normalizeSellerCompanyContactEmailForPatch("  Teste@Gmail.com ") === "teste@gmail.com");

const hydratedSecondary = mapSellerCompanyApiToForm(
  {
    company_name: "SMR",
    contact_email: "contato@smr.com",
    is_primary: false,
  },
  { accountEmail: "rico@suse7.com.br" },
);
assert("hydrate secondary email", hydratedSecondary.contact_email === "contato@smr.com");
assert("hydrate secondary not account email", hydratedSecondary.contact_email !== "rico@suse7.com.br");

const hydratedPrimary = mapSellerCompanyApiToForm(
  { company_name: "RF", contact_email: "old@x.com", is_primary: true },
  { accountEmail: "rico@suse7.com.br" },
);
assert("hydrate primary uses account email", hydratedPrimary.contact_email === "rico@suse7.com.br");

const patchEmailSave = buildSellerCompanyEditPatchBody(
  { contact_email: "teste33@gmail.com", operational_cost_rate: "10,00" },
  { isPrimary: false, baselineContactEmail: "", baselineCep: "" },
);
assert("patch saves secondary email", patchEmailSave.contact_email === "teste33@gmail.com");
assert(
  "patch email dirty only",
  !Object.prototype.hasOwnProperty.call(
    buildSellerCompanyEditPatchBody(
      { contact_email: "", operational_cost_rate: "10,00" },
      { isPrimary: false, baselineContactEmail: "", baselineCep: "" },
    ),
    "contact_email",
  ),
);

const patchEmailClear = buildSellerCompanyEditPatchBody(
  { contact_email: "", operational_cost_rate: "10,00" },
  { isPrimary: false, baselineContactEmail: "teste33@gmail.com", baselineCep: "" },
);
assert("patch clears secondary email", patchEmailClear.contact_email === null);

const patchPrimary = buildSellerCompanyEditPatchBody(
  { contact_email: "rico@suse7.com.br", operational_cost_rate: "1,00" },
  { isPrimary: true, baselineContactEmail: "rico@suse7.com.br", baselineCep: "" },
);
assert("patch omits email primary", !Object.prototype.hasOwnProperty.call(patchPrimary, "contact_email"));

const createWithEmail = buildSellerCompanyCreateBody({
  company_name: "Nova",
  document_cnpj: "73151110000128",
  contact_email: "teste33@gmail.com",
});
assert("create with email", createWithEmail.contact_email === "teste33@gmail.com");

const createWithoutEmail = buildSellerCompanyCreateBody({
  company_name: "Nova",
  document_cnpj: "73151110000128",
  contact_email: "",
});
assert("create without email null", createWithoutEmail.contact_email === null);

const requiredFail = validateSellerCompanyCreateForm({
  company_name: "X",
  trade_name: "",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
  whatsapp: "(17) 99999-9999",
  cep: "15025-055",
  address_number: "10",
});
assert("required trade name", requiredFail.ok === false && requiredFail.field === "trade_name");

const requiredOrder = SELLER_COMPANY_CREATE_REQUIRED_FIELD_ORDER.join(",");
assert(
  "required field order canonical",
  requiredOrder ===
    "company_name,trade_name,document_cnpj,default_tax_rate,contact_email,whatsapp,cep,address_number",
);

const emptyForm = {};
const step1 = validateSellerCompanyCreateForm(emptyForm);
assert("order step1 company_name", step1.ok === false && step1.field === "company_name");

const step2 = validateSellerCompanyCreateForm({ company_name: "Razão" });
assert("order step2 trade_name", step2.ok === false && step2.field === "trade_name");

const step3 = validateSellerCompanyCreateForm({ company_name: "Razão", trade_name: "Fantasia" });
assert("order step3 document_cnpj", step3.ok === false && step3.field === "document_cnpj");

const step4 = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
});
assert("order step4 default_tax_rate", step4.ok === false && step4.field === "default_tax_rate");

const step5 = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
});
assert("order step5 contact_email", step5.ok === false && step5.field === "contact_email");

const step6 = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
});
assert("order step6 whatsapp", step6.ok === false && step6.field === "whatsapp");

const step7 = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
  whatsapp: "(17) 99999-9999",
});
assert("order step7 cep", step7.ok === false && step7.field === "cep");

const step8 = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
  whatsapp: "(17) 99999-9999",
  cep: "15025-055",
});
assert("order step8 address_number", step8.ok === false && step8.field === "address_number");

const emailBeforeWhatsapp = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "invalido",
  whatsapp: "",
  cep: "",
  address_number: "",
});
assert(
  "invalid email before whatsapp",
  emailBeforeWhatsapp.ok === false && emailBeforeWhatsapp.field === "contact_email",
);

const cepBeforeNumber = validateSellerCompanyCreateForm({
  company_name: "Razão",
  trade_name: "Fantasia",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
  whatsapp: "(17) 99999-9999",
  cep: "123",
  address_number: "",
});
assert("invalid cep before number", cepBeforeNumber.ok === false && cepBeforeNumber.field === "cep");

const requiredOk = validateSellerCompanyCreateForm({
  company_name: "X",
  trade_name: "Y",
  document_cnpj: "73151110000128",
  default_tax_rate: "9,00",
  contact_email: "a@b.com",
  whatsapp: "(17) 99999-9999",
  cep: "15025-055",
  address_number: "10",
});
assert("required ok", requiredOk.ok === true);

if (failures.length) {
  console.error("[S1.7.3 seller-company form mapper unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.7.3 seller-company form mapper unit] OK");
