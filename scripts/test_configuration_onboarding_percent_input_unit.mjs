#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.4/01D.5/01D.6 — máscara percentual direta.
 */
import { readFileSync } from "node:fs";
import {
  formatarPercentualDiretoComSufixo,
  formatarPercentualDiretoEdicao,
  formatarPercentualDiretoFinal,
  percentualDiretoParaPayload,
  sanitizarPercentualDiretoEdicao,
} from "../src/utils/s7PercentDirectInput.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const displayCases = [
  ["6", "6,00"],
  ["18", "18,00"],
  ["6,5", "6,50"],
  ["6,25", "6,25"],
  ["1", "1,00"],
  ["1,5", "1,50"],
];

for (const [input, expected] of displayCases) {
  assert(`display ${input}`, formatarPercentualDiretoFinal(input) === expected);
  assert(`display suffix ${input}`, formatarPercentualDiretoComSufixo(input) === `${expected} %`);
}

const payloadCases = [
  ["6,00", "6.00"],
  ["1,00", "1.00"],
  ["6,50 %", "6.50"],
  ["18,00 %", "18.00"],
];

for (const [input, expected] of payloadCases) {
  assert(`payload ${input}`, percentualDiretoParaPayload(input) === expected);
}

assert("6 not cents mask", formatarPercentualDiretoFinal("6") === "6,00");
assert("6,5 never 65", formatarPercentualDiretoFinal("6,5") === "6,50");
assert("6,5 raw edit preserved", formatarPercentualDiretoEdicao("6,5") === "6,5");
assert("1,5 never 15", formatarPercentualDiretoFinal("1,5") === "1,50");
assert("65 from typo not same as 6,5", formatarPercentualDiretoFinal("65") === "65,00");

assert("paste 6.25", formatarPercentualDiretoFinal(sanitizarPercentualDiretoEdicao("6.25")) === "6,25");
assert("paste 6,25", formatarPercentualDiretoFinal("6,25") === "6,25");
assert("no double percent sanitize", sanitizarPercentualDiretoEdicao("6,25%%") === "6,25");

function simularSequencia(chars) {
  let raw = "";
  for (const ch of chars) raw = sanitizarPercentualDiretoEdicao(`${raw}${ch}`);
  return raw;
}

{
  let prev = "";
  for (const step of ["1", ",", "5"]) {
    prev = sanitizarPercentualDiretoEdicao(`${prev}${step}`);
    assert(`raw sequence step ${step}`, prev === (step === "1" ? "1" : step === "," ? "1," : "1,5"));
  }
  assert("blur after 1,5", formatarPercentualDiretoFinal(prev) === "1,50");
  assert("1,5 never becomes 15", prev !== "15");
}

assert("9,8 sequence", simularSequencia(["9", ",", "8"]) === "9,8");
assert("9,8 blur", formatarPercentualDiretoFinal("9,8") === "9,80");

const percentComponent = readFileSync(new URL("../src/components/ui/S7PercentDirectInput.jsx", import.meta.url), "utf8");
assert("01D.6 no caret manipulation", !percentComponent.includes("setSelectionRange"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_percent_input_01d4_01d5_01d6",
      cases: displayCases.length * 2 + payloadCases.length + 14,
      failures: 0,
    },
    null,
    2,
  ),
);
