#!/usr/bin/env node
/**
 * Refino Lote S2 — respiro externo inferior 12px (Perfil + Alterar Senha).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

function read(relativePath) {
  return readFileSync(join(feRoot, relativePath), "utf8");
}

const profileCss = read("src/components/Profile/Profile.css");
const layoutCss = read("src/components/Layout.css");
const dadosEmpresaCss = read("src/components/Profile/DadosEmpresa.css");
const alterarSenhaCss = read("src/components/Profile/AlterarSenha.css");
const alterarSenhaJsx = read("src/components/Profile/AlterarSenha.jsx");
const gateCss = read("src/features/dashboard/configurationOnboarding/ConfigurationAppGate.css");

const empresaPageContentBlock =
  profileCss.match(
    /\.page-content\.s7-page:has\(\.profile-layout--full > \.profile-content > \.dados-empresa-page:not\(\.s7-notification-center-page\):not\(\.ml-integrations-page\)\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const alterarPageContentBlock =
  profileCss.match(
    /\.page-content\.s7-page:has\(\.profile-layout--full > \.profile-content > \.alterar-senha-page\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const empresaLayoutBlock =
  profileCss.match(
    /\.profile-layout\.profile-layout--full:has\(> \.profile-content > \.dados-empresa-page:not\(\.s7-notification-center-page\):not\(\.ml-integrations-page\)\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const alterarLayoutBlock =
  profileCss.match(
    /\.profile-layout\.profile-layout--full:has\(> \.profile-content > \.alterar-senha-page\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const empresaContentBlock =
  profileCss.match(
    /\.profile-content:has\(> \.dados-empresa-page:not\(\.s7-notification-center-page\):not\(\.ml-integrations-page\)\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const alterarContentBlock =
  profileCss.match(
    /\.profile-content:has\(> \.alterar-senha-page\)\s*\{[^}]+\}/s,
  )?.[0] ?? "";

const empresaHero =
  dadosEmpresaCss.match(
    /\.dados-empresa-page:not\(\.ml-integrations-page\):not\(\.s7-notification-center-page\) \.profile-card\.s7-empresa-hero\s*\{[^}]+\}/s,
  )?.[0] ?? "";
const alterarHero =
  alterarSenhaCss.match(/\.alterar-senha-page \.profile-card\.s7-alterar-senha-hero\s*\{[^}]+\}/s)?.[0] ?? "";

assert.ok(profileCss.includes("--s7-empresa-page-gutter: 12px"), "profile shell keeps 12px gutter token");
assert.doesNotMatch(alterarSenhaJsx, /dados-empresa-page/, "Alterar Senha must not reuse dados-empresa-page shell class");

assert.match(empresaPageContentBlock, /display:\s*flex/, "empresa page-content uses flex fill chain");
assert.match(empresaPageContentBlock, /flex:\s*1\s*1\s*auto/, "empresa page-content participates in flex fill");
assert.match(alterarPageContentBlock, /display:\s*flex/, "alterar senha page-content uses flex fill chain");
assert.match(alterarPageContentBlock, /flex:\s*1\s*1\s*auto/, "alterar senha page-content participates in flex fill");

assert.match(empresaLayoutBlock, /flex:\s*1\s*1\s*auto/, "empresa profile-layout fills viewport shell");
assert.match(alterarLayoutBlock, /flex:\s*1\s*1\s*auto/, "alterar senha profile-layout fills viewport shell");

assert.match(
  empresaContentBlock,
  /padding:\s*var\(--s7-empresa-page-gutter,\s*12px\)/,
  "empresa shell uses SSOT padding",
);
assert.match(empresaContentBlock, /flex:\s*1\s*1\s*auto/, "empresa profile-content fills padded shell");
assert.match(empresaContentBlock, /display:\s*flex/, "empresa profile-content is flex column");

assert.match(
  alterarContentBlock,
  /padding:\s*var\(--s7-empresa-page-gutter,\s*12px\)/,
  "alterar senha shell uses SSOT padding",
);
assert.match(alterarContentBlock, /flex:\s*1\s*1\s*auto/, "alterar senha profile-content fills padded shell");
assert.match(alterarContentBlock, /display:\s*flex/, "alterar senha profile-content is flex column");

assert.match(empresaHero, /flex:\s*1\s*1\s*auto/, "empresa hero grows inside padded shell");
assert.match(alterarHero, /flex:\s*1\s*1\s*auto/, "alterar senha hero grows inside padded shell");
assert.doesNotMatch(empresaHero, /margin-bottom:\s*12px/, "empresa hero must not fake inset via margin-bottom");
assert.doesNotMatch(alterarHero, /margin-bottom:\s*12px/, "alterar senha hero must not fake inset via margin-bottom");

assert.ok(layoutCss.includes(".app-container") && layoutCss.includes("height: 100vh"), "layout chain includes app-container");
assert.ok(gateCss.includes(".s7-config-app-gate__content"), "gate content present in real chain");

console.log("test_s2_profile_page_bottom_inset_unit: PASS");
