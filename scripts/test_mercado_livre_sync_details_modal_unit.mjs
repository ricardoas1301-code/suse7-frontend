#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-SYNC.1 — Shell compartilhado, duas colunas, resumo e SSOT conta.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildMercadoLivreSyncAccountPickerOptions,
  buildMercadoLivreSyncDetailsPresentation,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreSyncDetailsAdapter.js";
import {
  buildMarketplaceSyncExecutionSummary,
  resolveSyncStepStatusBucket,
  resolveSyncStepStatusLabel,
} from "../src/components/Profile/marketplaceIntegration/marketplaceSyncExecutionSummary.js";
import { buildMarketplaceSyncStepPresentation } from "../src/components/Profile/marketplaceIntegration/marketplaceSyncStepPresentation.js";
import {
  buildSellerCompaniesById,
  resolveLinkedCompanyDocumentFormatted,
} from "../src/components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js";

const root = dirname(fileURLToPath(import.meta.url));
const shellJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceModalShell.jsx"),
  "utf8"
);
const shellCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/marketplaceModalShell.css"),
  "utf8"
);
const syncModalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx"),
  "utf8"
);
const syncModalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.css"),
  "utf8"
);
const integrationModalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx"),
  "utf8"
);
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("integration modal uses shared shell", integrationModalJsx.includes("MarketplaceModalShell"));
assert("sync modal uses shared shell", syncModalJsx.includes("MarketplaceModalShell"));
assert("shell exposes integration-management variant", shellJsx.includes('variant = "integration-management"'));
assert("shell exposes sync-details variant", shellJsx.includes('variant === "sync-details"'));
assert("shared shell max-width 820", /max-width:\s*820px/.test(shellCss));
assert("sync shell fixed body overflow", /overflow:\s*hidden/.test(shellCss));
assert("sync modal top contextual layout", /s7-marketplace-sync-details-modal__context-row/.test(syncModalCss));
assert("steps grid three columns", /s7-marketplace-sync-details-modal__steps-grid[\s\S]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(syncModalCss));
assert("single modal content scroll", /s7-marketplace-sync-details-modal__content[\s\S]*overflow-y:\s*auto/.test(syncModalCss));
assert("compact account column block", syncModalJsx.includes("s7-marketplace-sync-details-modal__account-column"));
assert("situation block exists", syncModalJsx.includes("s7-marketplace-sync-details-modal__situation-rows"));
assert("steps section title exists", syncModalJsx.includes("Etapas da sincronização"));
assert("account picker removed from sync modal", !syncModalJsx.includes("accountPicker"));
assert("support message not rendered in modal", !syncModalJsx.includes("header.supportMessage"));
assert("page passes explicit context account id", pageJsx.includes("contextMarketplaceAccountId={onboardingAccountId}"));
assert("technical detail hidden from seller ui", !syncModalJsx.includes("Detalhe técnico:"));
assert("step cards render title and status only", /step-body[\s\S]*step-title[\s\S]*step-status/.test(syncModalJsx));
assert("step title uses span to avoid global p color", syncModalJsx.includes('<span className="s7-marketplace-sync-details-modal__step-title">'));
assert("error pendency yellow footer hint removed", !pageJsx.includes("ml-onboarding-final-hint--warn"));
assert("steps use semantic ordered list", syncModalJsx.includes('<ol className="s7-marketplace-sync-details-modal__steps-grid"'));
assert("page uses generic sync modal", pageJsx.includes("MarketplaceSyncDetailsModal"));
assert("page keeps modal stack covered prop", pageJsx.includes("isCovered={integrationModalStacked}"));
assert("page opens sync with explicit account id", pageJsx.includes("openTechnicalSyncDetails(manageModalAccount.id)"));
assert("page preserves focus return", pageJsx.includes("syncViewButtonRef.current?.focus()"));

const companiesById = buildSellerCompaniesById([
  { id: "sc-1", document_cnpj: "73151110000209", trade_name: "SMR Goiânia", logo_url: "https://cdn/logo.png" },
]);

const account = {
  id: "acc-1",
  status: "active",
  account_alias: "CHURRASCO SMR",
  seller_company_id: "sc-1",
  company_trade_name: "SMR Goiânia",
  company_document_masked: "***0209",
  last_sync_at: "2026-07-16T20:27:00.000Z",
  connection_badge_label: "Ativa",
};

const summary = {
  overall: "error",
  title: "Sincronização com pendências",
  description: "Uma etapa falhou. Você pode tentar de novo ou seguir usando o app enquanto corrigimos.",
  sales_sync_engine: { last_sales_sync_at: "2026-07-16T20:27:00.000Z" },
  checklist: [
    { key: "listings", label: "Anúncios", status: "error", progress_current: 180, progress_total: 282, error_message: "stale_running_timeout>900000ms" },
    { key: "sales_recent", label: "Vendas recentes", status: "done" },
    { key: "fees", label: "Taxas", status: "pending" },
  ],
};

const presentation = buildMercadoLivreSyncDetailsPresentation(account, summary, {
  companiesById,
  checklist: summary.checklist,
  linkedCompanyDocumentFormatted: resolveLinkedCompanyDocumentFormatted(companiesById, account.seller_company_id),
});

assert("header title fixed", presentation.header.title === "Detalhes da sincronização");
assert("header status uses payload title", presentation.header.statusLabel === "Sincronização com pendências");
assert("support message uses payload description", presentation.header.supportMessage.includes("Uma etapa falhou"));
assert("connected account name", presentation.connectedAccount.accountName === "CHURRASCO SMR");
assert("connected account cnpj ssot", presentation.connectedAccount.linkedCompanyDocumentFormatted === "73.151.110/0002-09");
assert("connected account identifier", presentation.connectedAccount.accountIdentifier === "***0209");
assert("connected account avatar url", presentation.connectedAccount.linkedCompanyAvatarUrl === "https://cdn/logo.png");

const listingsStep = presentation.steps.find((s) => s.key === "listings");
assert("step keeps raw fraction", listingsStep?.progressHint === " (180/282)");
assert("step keeps technical error", listingsStep?.technicalDetail === "stale_running_timeout>900000ms");
assert("step status label semantic", listingsStep?.statusLabel === "Com erro");

const executionSummary = buildMarketplaceSyncExecutionSummary(presentation.steps, summary, account);
assert("summary completed count", executionSummary.completedCount === 1);
assert("summary error count", executionSummary.errorCount === 1);
assert("summary pending count", executionSummary.pendingCount === 1);
assert("summary running dash when none", executionSummary.runningStepLabel === "—");
assert("summary last updated formatted", executionSummary.lastUpdated.includes("2026"));
assert("summary no invented percentage", !JSON.stringify(executionSummary).includes("%"));

assert("status bucket done", resolveSyncStepStatusBucket("done") === "completed");
assert("status bucket error", resolveSyncStepStatusBucket("error") === "error");
assert("status label running", resolveSyncStepStatusLabel("running") === "Em andamento");

const picker = buildMercadoLivreSyncAccountPickerOptions([
  account,
  { id: "acc-2", account_alias: "LOJA 2", external_seller_id: "999" },
]);
assert("picker preserves account ids", picker[0].id === "acc-1" && picker[1].id === "acc-2");

const stepVm = buildMarketplaceSyncStepPresentation(summary.checklist[0]);
assert("step presentation keeps label", stepVm.label === "Anúncios");

const runningStepVm = buildMarketplaceSyncStepPresentation({
  key: "sales_recent",
  label: "Vendas recentes",
  status: "running",
  progress_current: 180,
  progress_total: 282,
});
assert("running step enables progress bar", runningStepVm.showProgressBar === true);
assert("running step hides title fraction", runningStepVm.progressHint === "");
assert("running step percent computed", runningStepVm.progressPercent === 64);
assert("step visual identity mapped", runningStepVm.visualIdentity === "sales");
assert("connect step identity", buildMarketplaceSyncStepPresentation({ key: "ml_connect", label: "Conectar", status: "done" }).visualIdentity === "connect");

if (failures.length) {
  console.error("[S1.INTEGRATIONS-SYNC.1 unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-SYNC.1 unit] OK");
