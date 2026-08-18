#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMercadoLivreSyncExecutiveSummaryLines } from "../src/components/Profile/marketplaceIntegration/marketplaceSyncExecutiveSummary.js";
import { buildMarketplaceSyncExecutionSummary } from "../src/components/Profile/marketplaceIntegration/marketplaceSyncExecutionSummary.js";
import {
  buildMercadoLivreIntegrationModalPresentation,
  mlAccountCanOpenSyncDetails,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js";
import { ML_SYNC_DETAILS_CTA_LABEL } from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationCopy.js";

const root = dirname(fileURLToPath(import.meta.url));
/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const connectionActive = {
  health: "connected",
  badge_label: "Ativa",
  alert_message: null,
  show_reconnect: false,
  monitoring_headline: "Monitoramento ativo",
  pipeline_active: true,
};

const summaryComplete = {
  overall: "done",
  initial_sync_engaged: true,
  title: "Integração Mercado Livre",
  sync_presentation: {
    sync_summary_label: "Concluída",
    sync_summary_tone: "ok",
    historical_empty_success: true,
    fully_complete: true,
  },
  checklist: [
    { key: "sales_recent", status: "done", label: "Vendas recentes" },
    { key: "historical_sales", status: "done", label: "Histórico de vendas", historical_ux: { empty_history: true } },
    { key: "listings", status: "done", label: "Anúncios" },
    { key: "products", status: "done", label: "Produtos/SKU" },
    { key: "monitoring", status: "pending", label: "Webhook/monitoramento" },
  ],
  step_counts: { completed: 7, pending: 0, error: 0, running: 0 },
};

const executive = buildMercadoLivreSyncExecutiveSummaryLines(summaryComplete, { connection: connectionActive });
assert("executive summary has 5 lines", executive.length === 5);
assert(
  "executive summary no window jargon",
  !executive.some((line) => /janela|Processando janela|Janela atual/i.test(line)),
);
assert(
  "executive summary includes integration line",
  executive.some((line) => line.startsWith("Integração Mercado Livre: Concluída")),
);
assert(
  "executive summary no loose error intro",
  !executive.some((line) => /Falhou — tente novamente/i.test(line)),
);
assert(
  "monitoring uses connection SSOT when checklist pending",
  executive.some((line) => line === "Monitoramento: Ativo"),
);

const summaryError = {
  ...summaryComplete,
  overall: "error",
  sync_presentation: { sync_summary_label: "Com pendências" },
  checklist: summaryComplete.checklist.map((row) =>
    row.key === "sales_recent" ? { ...row, status: "error" } : row,
  ),
};

const executiveError = buildMercadoLivreSyncExecutiveSummaryLines(summaryError, { connection: connectionActive });
assert(
  "error guidance only on failing item",
  executiveError.some((line) =>
    line.startsWith("Dados recentes: Com erro (reconecte o Mercado Livre ou fale com o suporte)"),
  ),
);
assert(
  "error guidance not duplicated on pending monitoring",
  !executiveError.some((line) => line.includes("Monitoramento: Na fila (reconecte")),
);

const modalPresentation = buildMercadoLivreIntegrationModalPresentation(
  { status: "active", account_alias: "SUPER METALRIO", company_name: "Super Metal" },
  summaryError,
  { linkedCompanyDocumentFormatted: "00.000.000/0001-00" },
);
assert(
  "integration state rows exclude identifier and company",
  !modalPresentation.integrationStateRows.some((row) =>
    ["Identificador da conta", "Empresa vinculada"].includes(row.label),
  ),
);
assert("integration state rows count is 5", modalPresentation.integrationStateRows.length === 5);
assert(
  "diagnostic has no loose alert intro",
  !modalPresentation.diagnosticLines.some((line) => /Falhou — tente novamente/i.test(line)),
);
assert("error state keeps sync details link", modalPresentation.showSyncViewLink === true);
assert("error state keeps advanced sync details action", modalPresentation.showSyncDetailsAction === true);

const modalComplete = buildMercadoLivreIntegrationModalPresentation(
  { status: "active", account_alias: "Aroma Glamour", company_name: "Aroma Glamour" },
  summaryComplete,
  { linkedCompanyDocumentFormatted: "00.000.000/0001-00" },
);
assert(
  "completed integration keeps sync details link",
  modalComplete.showSyncViewLink === true && modalComplete.showSyncDetailsAction === true,
);
assert(
  "completed empty history can open sync details",
  mlAccountCanOpenSyncDetails(summaryComplete, true) === true,
);
assert(
  "awaiting start without engagement hides sync details",
  mlAccountCanOpenSyncDetails({ overall: "awaiting_start", initial_sync_engaged: false, checklist: [] }, true) ===
    false,
);

const mercadoLivreJs = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
assert(
  "mercado livre page uses canonical sync details label",
  mercadoLivreJs.includes("ML_SYNC_DETAILS_CTA_LABEL") &&
    !mercadoLivreJs.includes('label: "Ver sincronização"') &&
    !mercadoLivreJs.includes("Importação inteligente</button>"),
);
assert(
  "advanced options opens technical sync details directly",
  mercadoLivreJs.includes("handleOpenSyncDetails(manageModalAccount.id)") &&
    !mercadoLivreJs.includes("openOperationalImportModal(manageModalAccount.id)"),
);
assert(
  "sync details opening uses shared loading state",
  mercadoLivreJs.includes("syncDetailsOpeningAccountId") &&
    mercadoLivreJs.includes("syncDetailsOpeningAccountIdRef"),
);
assert(
  "sync details opening indicator component exists",
  readFileSync(
    join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsOpeningIndicator.jsx"),
    "utf8",
  ).includes("Carregando detalhes da sincronização"),
);
assert(
  "integration modal sync link supports loading state",
  readFileSync(
    join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx"),
    "utf8",
  ).includes("syncViewAction.loading"),
);
assert("canonical CTA label constant", ML_SYNC_DETAILS_CTA_LABEL === "Detalhes da sincronização");
assert(
  "completed sync details omit redundant footer copy",
  !mercadoLivreJs.includes("completion_line_1") && !mercadoLivreJs.includes("modal_success_summary"),
);

const steps = summaryComplete.checklist.map((row) => ({ ...row, label: row.label, status: row.status }));
const execution = buildMarketplaceSyncExecutionSummary(steps, summaryComplete);
assert("execution complete running dash", execution.runningStepLabel === "—");
assert("execution complete label", execution.overallSituation === "Concluída");
assert("execution complete count", execution.completedCount === 7);

const adapterJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js"),
  "utf8",
);
assert(
  "adapter uses executive summary",
  adapterJs.includes("buildMercadoLivreSyncExecutiveSummaryLines") &&
    !adapterJs.includes("mlHotHistoricalLines"),
);

const modalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.css"),
  "utf8",
);
assert("advanced accordion chevron css", modalCss.includes("s7-marketplace-integration-modal__advanced-chevron"));

const shellCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/marketplaceModalShell.css"),
  "utf8",
);
const integrationModalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.css"),
  "utf8",
);
assert(
  "integration modal scroll viewport owns overflow",
  shellCss.includes("s7-marketplace-integration-modal__scroll-viewport") &&
    shellCss.includes("overflow-y: auto") &&
    shellCss.includes("overflow: hidden") &&
    !integrationModalCss.includes("overflow-y: auto"),
);

if (failures.length > 0) {
  console.error("FAIL ml sync presentation frontend:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS ml sync presentation frontend (${25 - failures.length} checks)`);
