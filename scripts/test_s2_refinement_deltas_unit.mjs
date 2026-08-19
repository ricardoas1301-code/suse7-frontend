#!/usr/bin/env node
/**
 * Refino Lote S2 — regression guards cirúrgicos (UF, percentuais, Dashboard Top 10).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  configurationPercentHasPersistedValue,
  resolveConfigurationPercentInitialDisplay,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingFormHelpers.js";
import { mapSellerCompanyApiToForm } from "../src/components/Profile/sellerCompanyFormMapper.js";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

function read(relativePath) {
  return readFileSync(join(feRoot, relativePath), "utf8");
}

const sellerCompanyFormBody = read("src/components/Profile/SellerCompanyFormBody.jsx");
const sellerCompanyModal = read("src/components/Profile/SellerCompanyModal.jsx");
const percentModal = read("src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx");
const dashboardCss = read("src/components/Dashboard.css");
const dashboardJsx = read("src/components/Dashboard.jsx");

// --- Estado UF ---
assert.ok(!sellerCompanyFormBody.includes("BRASIL_UFS"), "UF must not use BRASIL_UFS select list");
assert.ok(!sellerCompanyFormBody.includes("<select"), "UF must not be a select");
assert.ok(
  sellerCompanyFormBody.includes('name="address_state"') &&
    sellerCompanyFormBody.includes("readOnly") &&
    sellerCompanyFormBody.includes("maxLength={2}"),
  "UF must be read-only input filled via CEP",
);
assert.ok(sellerCompanyModal.includes("viacep.com.br"), "CEP autofill integration preserved");
assert.ok(sellerCompanyModal.includes("address_state: data.uf"), "CEP still maps UF");

const formWithoutUf = mapSellerCompanyApiToForm({ address_state: null });
assert.equal(formWithoutUf.address_state, "", "no persisted UF starts empty");
assert.notEqual(formWithoutUf.address_state, "SP", "must not default to SP");

const formWithUf = mapSellerCompanyApiToForm({ address_state: "SP" });
assert.equal(formWithUf.address_state, "SP", "persisted UF loads");

// --- Alíquota / Custo operacional: value vs placeholder ---
assert.equal(resolveConfigurationPercentInitialDisplay(null), "", "tax absent → empty value");
assert.equal(resolveConfigurationPercentInitialDisplay(undefined), "", "tax undefined → empty value");
assert.equal(resolveConfigurationPercentInitialDisplay(""), "", "tax blank → empty value");
assert.equal(resolveConfigurationPercentInitialDisplay("6.00"), "6,00", "tax persisted → formatted value");
assert.equal(resolveConfigurationPercentInitialDisplay("0.00"), "0,00", "zero persisted → real value");

assert.equal(configurationPercentHasPersistedValue(null), false);
assert.equal(configurationPercentHasPersistedValue(""), false);
assert.equal(configurationPercentHasPersistedValue("0.00"), true);
assert.equal(configurationPercentHasPersistedValue("6.00"), true);

assert.ok(percentModal.includes('placeholder = "0,00"'), "percent modal default placeholder 0,00");
assert.ok(percentModal.includes("placeholder={placeholder}"), "placeholder passed to input");
assert.ok(percentModal.includes("showNotApplicable"), "Não se aplica preserved");

// --- Dashboard Top 10 external rhythm ---
assert.ok(
  dashboardCss.includes(".page-content:has(.vendas-page.dashboard-page)") &&
    dashboardCss.includes("padding: 12px") &&
    dashboardCss.includes("gap: var(--s7-catalog-block-gap, 12px)"),
  "dashboard uses 12px external frame and block gap",
);
assert.ok(
  !dashboardCss.includes("--s7-section-panel-inset-x: 12px"),
  "must not shrink internal Top 10 panel inset",
);
assert.ok(dashboardJsx.includes("dashboard-page__top10-block"), "Top 10 block preserved");
assert.ok(dashboardJsx.includes("S7ImportIntelligencePanel"), "next section preserved");

console.log("test_s2_refinement_deltas_unit: PASS");
