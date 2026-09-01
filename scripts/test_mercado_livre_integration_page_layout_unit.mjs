#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.5 — Composição em duas colunas + refino CNPJ no modal.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildMercadoLivreIntegrationModalPresentation,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js";
import {
  resolveLinkedCompanyDocumentFormatted,
  buildSellerCompaniesById,
} from "../src/components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js";

const root = dirname(fileURLToPath(import.meta.url));
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const pageCss = readFileSync(join(root, "../src/components/Profile/MercadoLivre.css"), "utf8");
const layoutJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.jsx"),
  "utf8"
);
const layoutCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.css"),
  "utf8"
);
const presentationJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/mercadoLivrePresentation.js"),
  "utf8"
);
const modalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx"),
  "utf8"
);
const modalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.css"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const bodyBlock = layoutCss.match(/\.s7-marketplace-integration-page-body\s*\{[^}]+\}/s)?.[0] ?? "";
const visualBlock = layoutCss.match(/\.s7-marketplace-integration-page-body__visual\s*\{[^}]+\}/s)?.[0] ?? "";
const logoBlock =
  layoutCss.match(/\.s7-marketplace-connection-visual__logo\s*\{[^}]+\}/s)?.[0] ?? "";
const leftGridBlock =
  layoutCss.match(
    /\.s7-marketplace-integration-page-body__main-integrations \.s7-marketplace-integration-cards\s*\{[^}]+\}/s
  )?.[0] ?? "";

assert("page uses generic layout component", pageJsx.includes("MarketplaceIntegrationPageLayout"));
assert("page uses connection visual from adapter", pageJsx.includes("MarketplaceConnectionVisual"));
assert("page does not import header logos directly", !/import suse7Logo/.test(pageJsx));
assert("header logos block removed from page jsx", !/s7-ml-integrations-header__logos/.test(pageJsx));
assert("legacy header grid removed from page css", !/\.s7-ml-integrations-header\s*\{/.test(pageCss));
assert("layout has two equal columns", /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)/.test(bodyBlock));
assert("grid rows do not stretch with short content", /align-content:\s*start/.test(bodyBlock));
assert("integrations row anchored to start", /s7-marketplace-integration-page-body__main-integrations[\s\S]*align-self:\s*start/.test(layoutCss));
assert("visual column uses fixed anchor container", /s7-marketplace-integration-page-body__visual[\s\S]*position:\s*relative/.test(layoutCss));
assert("visual column no sticky", !/position:\s*sticky/.test(layoutCss));
assert("connection visual enlarged structurally (~176px)", /176px/.test(logoBlock));
assert("connection visual avoids transform scale", !/transform:\s*scale/.test(layoutCss));
assert("no account-count min-height override", !/:has\([\s\S]*s7-marketplace-integration-cards[\s\S]*min-height:\s*0/.test(pageCss));
assert("presentation exports connectionVisual config", /connectionVisual:\s*\{/.test(presentationJs));
assert("presentation provides platform and marketplace logos", /platformLogoSrc/.test(presentationJs) && /marketplaceLogoSrc/.test(presentationJs));
assert("layout places security content in main column", layoutJsx.includes("securityContent"));
assert("layout places integrations in main column", layoutJsx.includes("integrationsContent"));
assert("layout places brand visual in aside", layoutJsx.includes("brandConnectionVisual"));
assert("layout no longer renders security footer", !layoutJsx.includes("securityFooter"));
assert("left column grid keeps two-column card width", /repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(leftGridBlock));
assert("mobile stacks columns", /grid-template-columns:\s*1fr/.test(layoutCss));
assert("hero keeps min-height viewport fill", /min-height:\s*calc\([\s\S]*100dvh/.test(pageCss));
assert("hero keeps auto growth", /height:\s*auto/.test(pageCss));
assert("redundant security footer removed from css", !/ml-security-hint--footer/.test(pageCss));
assert("no account-count conditional layout", !/:has\(\s*\.s7-marketplace-integration-card:nth|accounts\.length.*hero/.test(pageCss));

assert("modal identity uses flex-start alignment", /\.s7-marketplace-integration-modal__identity[\s\S]*align-items:\s*flex-start/.test(modalCss));
assert("modal groups empresa and cnpj in details block", modalJsx.includes("s7-marketplace-integration-modal__identity-details"));
assert("modal cnpj line immediately after loja", /Loja:[\s\S]*CNPJ:/.test(modalJsx));
assert("modal uses Loja label", modalJsx.includes("Loja:"));
assert("modal drops Empresa vinculada label", !modalJsx.includes("Empresa vinculada:"));
assert("modal does not duplicate cnpj in state rows header", (modalJsx.match(/CNPJ:/g) || []).length === 1);

const companiesById = buildSellerCompaniesById([
  { id: "sc-1", document_cnpj: "73151110000128", trade_name: "Super Metal Rio1" },
]);
const account = {
  id: "acc-1",
  status: "active",
  account_alias: "SUPER METALRIO",
  seller_company_id: "sc-1",
  company_trade_name: "Super Metal Rio1",
  company_document_masked: "***0128",
  connection_badge_label: "Ativa",
};
const modal = buildMercadoLivreIntegrationModalPresentation(account, null, {
  linkedCompanyDocumentFormatted: resolveLinkedCompanyDocumentFormatted(companiesById, account.seller_company_id),
});
assert("modal keeps masked identifier separate", modal.accountIdentifier === "***0128");
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
  "missing cnpj shows dash",
  buildMercadoLivreIntegrationModalPresentation(account, null, {
    linkedCompanyDocumentFormatted: "—",
  }).linkedCompanyDocumentFormatted === "—"
);

assert("page keeps stack modal behavior", pageJsx.includes("isCovered={integrationModalStacked}"));
assert("page keeps hooks before loading return", (() => {
  const start = pageJsx.indexOf("export default function MercadoLivre()");
  const braceStart = pageJsx.indexOf("{", start);
  let depth = 0;
  let bodyEnd = -1;
  for (let i = braceStart; i < pageJsx.length; i += 1) {
    if (pageJsx[i] === "{") depth += 1;
    else if (pageJsx[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        bodyEnd = i;
        break;
      }
    }
  }
  const body = pageJsx.slice(braceStart + 1, bodyEnd);
  const loadingIdx = body.search(/\n\s*if\s*\(\s*loading\s*\)\s*\{/);
  const afterLoading = body.slice(loadingIdx);
  return !/\buse(State|Effect|Memo|Callback|Ref)\s*\(/.test(afterLoading);
})());

assert("empty state title without ainda", pageJsx.includes("Nenhuma conta Mercado Livre conectada</p>"));
assert("empty state title removed ainda word", !pageJsx.includes("Nenhuma conta Mercado Livre conectada ainda"));
assert(
  "empty state removed perfil dados da empresa hint",
  !pageJsx.includes("Perfil → Dados da Empresa")
);
assert(
  "empty state benefit subtitle",
  pageJsx.includes("Conecte sua conta para começar a importar seus anúncios e vendas.")
);
assert("empty state keeps connect cta", pageJsx.includes("Conectar minha conta"));
assert("empty state keeps oauth handler", pageJsx.includes("onClick={handleConnectMyAccount}"));
assert("empty state title styling class", pageCss.includes(".ml-accounts-empty__title"));
assert("empty state subtitle styling class", pageCss.includes(".ml-accounts-empty__subtitle"));
assert("empty state headline uses 22px token", /\.ml-accounts-empty__title[\s\S]*font-size:\s*22px/.test(pageCss));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.5 page layout unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.5 page layout unit] OK");
