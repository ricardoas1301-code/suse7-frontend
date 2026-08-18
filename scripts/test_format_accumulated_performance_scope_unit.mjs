/**
 * FE — formatação accumulated performance (sem cálculo financeiro).
 * Executar: node scripts/test_format_accumulated_performance_scope_unit.mjs
 */
import {
  formatAccumulatedPerformanceScope,
  formatAccumulatedQuantity,
  formatAccumulatedBrl,
  formatAccumulatedPercent,
} from "../src/features/shared/formatAccumulatedPerformanceScope.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

{
  const formatted = formatAccumulatedPerformanceScope({
    sales_quantity: "161",
    sales_amount_brl: "42291.65",
    sales_profit_brl: "2271.52",
    sales_profit_percent: "5.37",
  });
  assert(formatted.salesQuantity === "161", "qty pt-BR");
  assert(formatted.salesAmount.includes("42.291,65"), "brl pt-BR");
  assert(formatted.profitAmount.includes("2.271,52"), "profit brl");
  assert(formatted.profitPercent.includes("5,37"), "pct pt-BR");
}

{
  const nullScope = formatAccumulatedPerformanceScope(null);
  assert(nullScope.salesQuantity === "—", "null qty dash");
  assert(nullScope.salesAmount === "—", "null amount dash");
}

{
  const zeroScope = formatAccumulatedPerformanceScope({
    sales_quantity: "0",
    sales_amount_brl: "0.00",
    sales_profit_brl: "0.00",
    sales_profit_percent: "0.00",
  });
  assert(zeroScope.salesQuantity === "0", "zero qty");
  assert(zeroScope.salesAmount.includes("0,00"), "zero brl");
}

assert(formatAccumulatedQuantity(null) === "—", "format qty null");
assert(formatAccumulatedBrl(null) === "—", "format brl null");
assert(formatAccumulatedPercent(null) === "—", "format pct null");

console.log(JSON.stringify({ ok: true, suite: "format_accumulated_performance_scope_unit" }));
