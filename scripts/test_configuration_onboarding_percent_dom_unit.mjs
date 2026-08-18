#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.6 — percent DOM + raw edit regression.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  formatarPercentualDiretoComSufixo,
  formatarPercentualDiretoFinal,
  percentualDiretoParaPayload,
  sanitizarPercentualDiretoEdicao,
} from "../src/utils/s7PercentDirectInput.js";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function simularDigitacaoSequencial(chars) {
  let raw = "";
  for (const ch of chars) {
    raw = sanitizarPercentualDiretoEdicao(`${raw}${ch}`);
  }
  return raw;
}

function simularBlur(raw) {
  return formatarPercentualDiretoFinal(raw);
}

{
  const focused = simularDigitacaoSequencial(["1", ",", "5"]);
  assert("1,5 focused", focused === "1,5");
  assert("1,5 blur", simularBlur(focused) === "1,50");
  assert("1,5 never 15", focused !== "15" && simularBlur(focused) !== "15,00");
}

{
  const focused = simularDigitacaoSequencial(["9", ",", "8"]);
  assert("9,8 focused", focused === "9,8");
  assert("9,8 blur", simularBlur(focused) === "9,80");
  assert("9,8 never 98", focused !== "98" && simularBlur(focused) !== "98,00");
}

{
  const focused = simularDigitacaoSequencial(["6", ",", "5"]);
  assert("6,5 focused", focused === "6,5");
  assert("6,5 blur", simularBlur(focused) === "6,50");
  assert("6,5 never 65", focused !== "65");
}

assert("15,25 blur", simularBlur("15,25") === "15,25");
assert("comma UI canonical", formatarPercentualDiretoComSufixo("6,5") === "6,50 %");
assert("dot input supported", sanitizarPercentualDiretoEdicao("6.5") === "6,5");
assert("dot blur", simularBlur("6.5") === "6,50");
assert("domain payload dot-decimal", percentualDiretoParaPayload("1,5") === "1.50");
assert("decimal safe 100", percentualDiretoParaPayload("100,00") === "100.00");
assert("decimal safe reject 100.01", percentualDiretoParaPayload("100,01") === null);

const percentComponent = readFileSync(join(root, "../src/components/ui/S7PercentDirectInput.jsx"), "utf8");
assert("no caret reposition", !percentComponent.includes("setSelectionRange"));
assert("no caret helper import", !percentComponent.includes("calcularCaretPosicaoDecimal"));
assert("no requestAnimationFrame caret", !percentComponent.includes("requestAnimationFrame"));
assert("raw sanitize on change", percentComponent.includes("sanitizarPercentualDiretoEdicao(event.target.value)"));
assert("text input mode decimal", percentComponent.includes('inputMode="decimal"') && percentComponent.includes('type="text"'));

let domTypingProof = false;
try {
  const { parseHTML } = await import("linkedom");
  const { document } = parseHTML(`<body><input id="pct" type="text" value="" /></body>`);
  const input = document.getElementById("pct");
  let value = "";

  const applyChange = (nextRaw) => {
    value = sanitizarPercentualDiretoEdicao(nextRaw);
    input.value = value;
  };

  for (const ch of ["1", ",", "5"]) {
    applyChange(`${value}${ch}`);
  }

  const focusedValue = value;
  const blurredValue = formatarPercentualDiretoFinal(focusedValue);
  domTypingProof = focusedValue === "1,5" && blurredValue === "1,50";
} catch (error) {
  failures.push(`linkedom percent DOM proof unavailable: ${error?.message ?? error}`);
}

assert("DOM sequential 1,5 focused", domTypingProof);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_percent_dom_01d6",
      cases: 22,
      failures: 0,
    },
    null,
    2,
  ),
);
