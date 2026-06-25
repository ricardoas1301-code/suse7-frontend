/**
 * DASH.7 — testes unitários do escopo de filtro do Dashboard (blocos separados).
 * Executar: node scripts/test_dashboard_scope_filter_unit.mjs
 */
import {
  isExecutiveSummaryQueryEnabled,
  resolveDailySummaryScope,
  resolveTop10Scope,
} from "../src/components/dashboard/dashboardScope.js";
import { resolveVendasPeriodRange } from "../src/features/vendas/filters/vendasFiltersPeriod.js";

const monthRange = resolveVendasPeriodRange("this_month");
const todayRange = resolveVendasPeriodRange("today");

/** @type {import("../src/components/dashboard/dashboardScope.js") extends never ? never : Parameters<typeof resolveDailySummaryScope>[0]} */
const defaultDailyFilters = {
  periodPreset: "today",
  startDate: todayRange.startDate,
  endDate: todayRange.endDate,
  marketplace: "",
  marketplaceAccountId: "",
};

/** @type {Parameters<typeof resolveTop10Scope>[0]} */
const defaultTop10Filters = {
  periodPreset: "this_month",
  startDate: monthRange.startDate,
  endDate: monthRange.endDate,
  marketplace: "",
  marketplaceAccountId: "",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Teste 1 — estado inicial: Resumo no ciclo operacional, Top 10 no mês atual
{
  const resumo = resolveDailySummaryScope(defaultDailyFilters, {}, { periodTouched: false });
  const top10 = resolveTop10Scope(defaultTop10Filters, { periodTouched: false });

  assert(resumo.resumoUsesOperationalCycle === true, "Resumo deve usar ciclo operacional no estado inicial");
  assert(resumo.resumoParams.period_preset === "operational_cycle", "Resumo params operational_cycle");
  assert(resumo.allAccountsScope === true, "Resumo inicia com todas as contas");
  assert(top10.executiveParams.period_preset === "custom", "Top 10 deve enviar período custom com datas explícitas");
  assert(top10.executiveParams.start_date != null, "Top 10 start_date explícito");
  assert(top10.executiveParams.end_date != null, "Top 10 end_date explícito");
  assert(top10.top10PeriodLabel === "Mês atual", "Label Top 10 = Mês atual");
  assert(top10.allAccountsScope === true, "Top 10 inicia com todas as contas");
  assert(
    top10.executiveParams.marketplace_account_id == null ||
      top10.executiveParams.marketplace_account_id === undefined,
    "Top 10 não envia marketplace_account_id com todas as contas",
  );
}

// Teste 2 — trocar só conta no Resumo: mantém ciclo operacional
{
  const filters = { ...defaultDailyFilters, marketplaceAccountId: "acc-resumo" };
  const resumo = resolveDailySummaryScope(filters, {}, { periodTouched: false });
  assert(resumo.resumoUsesOperationalCycle === true, "Conta no Resumo não desativa ciclo operacional");
  assert(resumo.accountIdForApi === "acc-resumo", "Conta do Resumo enviada na API");
  assert(resumo.resumoParams.period_preset === "operational_cycle", "Resumo continua operational_cycle");
}

// Teste 3 — trocar só conta no Top 10: mantém mês atual
{
  const filters = { ...defaultTop10Filters, marketplaceAccountId: "acc-top10" };
  const top10 = resolveTop10Scope(filters, { periodTouched: false });
  assert(top10.periodTouched === false, "Conta no Top 10 não marca periodTouched");
  assert(top10.executiveParams.period_preset === "custom", "Top 10 continua no mês atual com datas explícitas");
  assert(top10.executiveParams.start_date != null, "Top 10 mantém start_date");
  assert(top10.executiveParams.end_date != null, "Top 10 mantém end_date");
  assert(top10.executiveParams.marketplace_account_id === "acc-top10", "Conta Top 10 na API");
}

// Teste 4 — período manual no Resumo
{
  const lastWeek = resolveVendasPeriodRange("last_week");
  const filters = {
    ...defaultDailyFilters,
    periodPreset: "last_week",
    startDate: lastWeek.startDate,
    endDate: lastWeek.endDate,
  };
  const resumo = resolveDailySummaryScope(filters, {}, { periodTouched: true });
  assert(resumo.resumoUsesOperationalCycle === false, "Resumo manual não usa ciclo");
  assert(resumo.resumoParams.period_preset === "custom", "Resumo manual usa custom");
}

// Teste 5 — período manual no Top 10
{
  const lastWeek = resolveVendasPeriodRange("last_week");
  const filters = {
    ...defaultTop10Filters,
    periodPreset: "last_week",
    startDate: lastWeek.startDate,
    endDate: lastWeek.endDate,
  };
  const top10 = resolveTop10Scope(filters, { periodTouched: true });
  assert(top10.executiveParams.period_preset === "custom", "Top 10 manual usa custom com datas");
  assert(top10.top10PeriodLabel.includes("–") || top10.top10PeriodLabel.length > 4, "Top 10 label de intervalo");
}

// Teste 6 — query enabled com operational_cycle e month preset
{
  const resumo = resolveDailySummaryScope(defaultDailyFilters, {}, { periodTouched: false });
  const top10 = resolveTop10Scope(defaultTop10Filters, { periodTouched: false });
  assert(isExecutiveSummaryQueryEnabled(resumo.resumoParams) === true, "Resumo habilita query");
  assert(isExecutiveSummaryQueryEnabled(top10.executiveParams) === true, "Top 10 habilita query com todas as contas");
}

console.log("test_dashboard_scope_filter_unit.mjs — OK");
