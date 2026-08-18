#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.2 — Adapter Mercado Livre (card compacto + modal).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildMercadoLivreIntegrationCardPresentation,
  buildMercadoLivreIntegrationModalPresentation,
  MERCADO_LIVRE_MARKETPLACE_ID,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js";

const root = dirname(fileURLToPath(import.meta.url));
const jsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const cardJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationCard.jsx"),
  "utf8"
);
const modalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const sampleAccount = {
  id: "acc-1",
  status: "active",
  account_alias: "SUPER METALRIO",
  company_trade_name: "Super Metal Rio1",
  company_document_masked: "12.345.678/0001-90",
  last_sync_at: "2026-07-16T14:44:00.000Z",
  connection_badge_label: "Ativa",
  monitoring_headline: "Monitoramento ativo",
};

const sampleSummary = {
  overall: "error",
  connection: {
    badge_label: "Ativa",
    monitoring_headline: "Monitoramento ativo",
    show_reconnect: false,
  },
  checklist: [
    { key: "sales_recent", status: "error" },
    {
      key: "historical_sales",
      status: "pending",
      historical_ux: {
        checklist_primary: "Histórico de vendas",
        checklist_detail_lines: ["Processando janela 1 de 26"],
      },
    },
  ],
};

const card = buildMercadoLivreIntegrationCardPresentation(sampleAccount, sampleSummary);
const modal = buildMercadoLivreIntegrationModalPresentation(sampleAccount, sampleSummary, {
  integrationStage: { label: "Falhou", detail: "tente novamente" },
});

assert("card marketplace id", card.marketplaceId === MERCADO_LIVRE_MARKETPLACE_ID);
assert("card shows account name", card.accountName === "SUPER METALRIO");
assert("card shows company", card.companyName === "Super Metal Rio1");
assert("card shows monitoring headline", card.statusHeadline === "Monitoramento ativo");
assert("card shows badge", card.statusBadge?.label === "Ativa");
assert("card has no diagnostic lines property", card.diagnosticLines === undefined);
assert("card aria label mentions account", card.ariaLabel.includes("SUPER METALRIO"));

assert("modal includes sync rows", modal.integrationStateRows.some((r) => r.label === "Dados recentes"));
assert("modal includes last sync row", modal.integrationStateRows.some((r) => r.label === "Último sincronismo"));
assert("modal separates account identifier row", modal.integrationStateRows.some((r) => r.label === "Identificador da conta"));
assert("modal keeps diagnostic lines", modal.diagnosticLines.length >= 2);
assert("modal exposes sync view link flag", modal.showSyncViewLink === true);
assert("modal does not hide error tone on recent data", modal.integrationStateRows.find((r) => r.label === "Dados recentes")?.tone === "error");

assert("page uses compact card component", jsx.includes("MarketplaceIntegrationCard"));
assert("page uses manage modal component", jsx.includes("MarketplaceIntegrationModal"));
assert("page uses integration cards grid", jsx.includes("s7-marketplace-integration-cards"));
assert("legacy tall account card removed", !jsx.includes("ml-account-card"));
assert("legacy advanced details removed from page", !jsx.includes("ml-account-advanced"));
assert("card opens manage modal", jsx.includes("openManageModal"));
assert("modal sync action preserves technical flow", jsx.includes("openTechnicalSyncDetails"));

assert("generic card has no hardcoded Mercado Livre strings", !cardJsx.includes("SUPER METALRIO"));
assert("generic modal uses details accordion", modalJsx.includes('className="s7-marketplace-integration-modal__advanced"'));
assert("modal backdrop closes on outside click", modalJsx.includes("isCovered ? undefined : onClose"));
assert("modal inner click stops propagation", modalJsx.includes("stopPropagation"));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.2 adapter/ui unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.2 adapter/ui unit] OK");
