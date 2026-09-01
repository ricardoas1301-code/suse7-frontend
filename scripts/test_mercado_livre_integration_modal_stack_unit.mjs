#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.4 — Modal integração: CNPJ SSOT, stack, cabeçalho, opções avançadas.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildMercadoLivreIntegrationModalPresentation,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js";
import {
  formatMarketplaceCompanyCnpj,
  resolveLinkedCompanyDocumentFormatted,
  buildSellerCompaniesById,
} from "../src/components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js";

const root = dirname(fileURLToPath(import.meta.url));
const modalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx"),
  "utf8"
);
const shellJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceModalShell.jsx"),
  "utf8"
);
const modalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.css"),
  "utf8"
);
const stackCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/s7ModalStack.css"),
  "utf8"
);
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const companiesById = buildSellerCompaniesById([
  { id: "sc-1", document_cnpj: "73151110000128", trade_name: "Super Metal Rio1" },
  { id: "sc-2", document_cnpj: "12345678000199", trade_name: "Outra Empresa" },
]);

assert("cnpj format preserves zeros", formatMarketplaceCompanyCnpj("73151110000128") === "73.151.110/0001-28");
assert(
  "cnpj resolves by seller_company_id",
  resolveLinkedCompanyDocumentFormatted(companiesById, "sc-1") === "73.151.110/0001-28"
);
assert(
  "cnpj does not resolve by name similarity",
  resolveLinkedCompanyDocumentFormatted(companiesById, "sc-2") === "12.345.678/0001-99"
);
assert("missing company id shows dash", resolveLinkedCompanyDocumentFormatted(companiesById, "") === "—");
assert("unknown company id shows dash", resolveLinkedCompanyDocumentFormatted(companiesById, "missing") === "—");

const account = {
  id: "acc-1",
  status: "active",
  account_alias: "SUPER METALRIO",
  seller_company_id: "sc-1",
  company_trade_name: "Super Metal Rio1",
  company_document_masked: "***0128",
  last_sync_at: "2026-07-16T14:44:00.000Z",
  connection_badge_label: "Ativa",
};

const modal = buildMercadoLivreIntegrationModalPresentation(account, null, {
  linkedCompanyDocumentFormatted: resolveLinkedCompanyDocumentFormatted(companiesById, account.seller_company_id),
});

assert("modal exposes linked company document", modal.linkedCompanyDocumentFormatted === "73.151.110/0001-28");
assert("modal keeps account identifier separate", modal.accountIdentifier === "***0128");
assert(
  "state rows omit Identificador da conta (Loja+CNPJ is identity SSOT)",
  !modal.integrationStateRows.some((r) => r.label === "Identificador da conta")
);
assert(
  "state rows keep Conta / Monitoramento / Dados recentes / Histórico / Último sincronismo",
  ["Conta", "Monitoramento", "Dados recentes", "Histórico de vendas", "Último sincronismo"].every((label) =>
    modal.integrationStateRows.some((r) => r.label === label)
  )
);
assert("modal identity shows Loja trade name", modal.linkedCompanyName === "Super Metal Rio1" || modal.companyName === "Super Metal Rio1");
assert(
  "modal missing cnpj shows dash",
  buildMercadoLivreIntegrationModalPresentation(account, null, {
    linkedCompanyDocumentFormatted: "—",
  }).linkedCompanyDocumentFormatted === "—"
);

assert("modal identity lines left aligned", /\.profile-modal\.s7-marketplace-integration-modal p\.s7-marketplace-integration-modal__identity-line[\s\S]*text-align:\s*left/.test(modalCss));
assert("modal compact identity gap", /--s7-mi-identity-gap:\s*2px/.test(modalCss));
assert("modal groups empresa and cnpj lines", modalJsx.includes("s7-marketplace-integration-modal__identity-details"));
assert("modal cnpj follows loja line", /Loja:[\s\S]*CNPJ:/.test(modalJsx));
assert(
  "advanced body has top padding gap",
  /\.s7-marketplace-integration-modal__advanced-body[\s\S]*padding:\s*10px/.test(modalCss)
);
assert("modal shows loja label", modalJsx.includes("Loja:"));
assert("modal removes empresa vinculada label", !modalJsx.includes("Empresa vinculada:"));
assert("modal shows cnpj label", modalJsx.includes("CNPJ:"));
assert("advanced options default collapsed", modalJsx.includes("defaultOpen={false}"));
assert("advanced options reset via key", modalJsx.includes("advancedOptionsResetKey"));
assert("integration modal uses shared marketplace shell", modalJsx.includes("MarketplaceModalShell"));
assert("stack covered disables base backdrop click", shellJsx.includes("isCovered ? undefined : onClose"));
assert("stack escape ignored when covered", shellJsx.includes("if (!open || isCovered) return undefined"));
assert(
  "stack css defines base and top layers",
  /--s7-z-modal-base/.test(stackCss) && /--s7-z-modal-stack-top/.test(stackCss)
);

assert(
  "page keeps integration modal open on sync view",
  !/closeManageModal\(\);\s*void openTechnicalSyncDetails/.test(pageJsx)
);
assert("page passes stack covered prop", pageJsx.includes("isCovered={integrationModalStacked}"));
assert("page passes sync button ref", pageJsx.includes("buttonRef: syncViewButtonRef"));
assert("page resolves cnpj via seller company id", pageJsx.includes("resolveLinkedCompanyDocumentFormatted"));
assert("page focus returns after sync dismiss", pageJsx.includes("syncViewButtonRef.current?.focus()"));
assert("page body scroll locked while modals open", pageJsx.includes('document.body.style.overflow = "hidden"'));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.4 modal/stack unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.4 modal/stack unit] OK");
