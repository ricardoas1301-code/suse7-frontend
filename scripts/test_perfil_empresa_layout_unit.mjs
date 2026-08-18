#!/usr/bin/env node
/**
 * S1.7.4 — Smoke estrutural: respiro inferior dinâmico do Perfil da Empresa.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../src/components/Profile/DadosEmpresa.css"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const pageShellBlock = css.match(/\.dados-empresa-page\s*\{[^}]+\}/s)?.[0] ?? "";
const heroBlock =
  css.match(/\.dados-empresa-page \.profile-card\.s7-empresa-hero\s*\{[^}]+\}/s)?.[0] ?? "";

assert("page shell does not use padding-bottom for gap", !/padding-bottom:\s*12px/.test(pageShellBlock));
assert("page shell sizes to content", /flex:\s*0\s+0\s+auto/.test(pageShellBlock));
assert("hero card has 12px external margin-bottom", /margin-bottom:\s*12px/.test(heroBlock));
assert("hero keeps dynamic height auto", /height:\s*auto/.test(heroBlock));
assert("hero sizes to content without viewport min-height", /min-height:\s*auto/.test(heroBlock));
assert("no viewport min-height calc on hero", !/min-height:\s*calc\(/.test(heroBlock));
assert("no company-count conditional rules", /:has\(\s*\.s7-company-card:nth|company-cards.*:has/.test(css) === false);

if (failures.length) {
  console.error("[S1.7.4 perfil empresa layout unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.7.4 perfil empresa layout unit] OK");
