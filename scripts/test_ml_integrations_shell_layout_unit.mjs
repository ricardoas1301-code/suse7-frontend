#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.1 — Smoke estrutural: shell visual Integrações Mercado Livre.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../src/components/Profile/MercadoLivre.css"), "utf8");
const layoutCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.css"),
  "utf8"
);
const profileCss = readFileSync(join(root, "../src/components/Profile/Profile.css"), "utf8");
const jsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const copyJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationCopy.js"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const pageShellBlock = css.match(/\.ml-integrations-page\s*\{[^}]+\}/s)?.[0] ?? "";
const heroBlock =
  css.match(/\.ml-integrations-page \.profile-card\.ml-card\.s7-ml-integrations-hero\s*\{[^}]+\}/s)?.[0] ?? "";
const headerBlock = layoutCss.match(/\.s7-marketplace-integration-page-header\s*\{[^}]+\}/s)?.[0] ?? "";

const layoutJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.jsx"),
  "utf8"
);

assert("page shell grows with content not viewport flex trap", /flex:\s*0\s+0\s+auto/.test(pageShellBlock));
assert("hero card grows with accounts and footer", /flex:\s*0\s+0\s+auto/.test(heroBlock));
assert("hero card bottom padding 12px", /padding:\s*20px 28px 12px/.test(heroBlock));
assert("hero card uses profile gutter only for external bottom space", /margin:\s*0/.test(heroBlock));
assert("hero keeps dynamic height auto", /height:\s*auto/.test(heroBlock));
assert("hero fills viewport with min-height", /min-height:\s*calc\([\s\S]*100dvh/.test(heroBlock));
assert("hero has no fixed height", !/height:\s*\d+px/.test(heroBlock));
assert("hero has no overflow hidden", !/overflow:\s*hidden/.test(heroBlock));
assert("hero card background is white", /background:\s*#ffffff/.test(heroBlock));
assert("profile content gutter includes ml integrations page", /:has\(\.ml-integrations-page\)/.test(profileCss));
assert("gutter token is 12px", /--s7-empresa-page-gutter:\s*12px/.test(profileCss));
assert("header uses flex title and actions", /display:\s*flex/.test(headerBlock));
assert("header logos removed from page jsx", !/s7-ml-integrations-header__logos/.test(jsx));
assert("page uses generic layout shell", jsx.includes("MarketplaceIntegrationPageLayout"));
assert("integration page uses oauth 2 intro copy", copyJs.includes("protocolo OAuth 2.0 de autenticação") && jsx.includes("ML_INTEGRATION_OAUTH_INTRO"));
assert("oauth intro password sentence removed from SSOT", !copyJs.includes("nunca teremos acesso à sua senha"));
assert("integration page shows historical sales copy", copyJs.includes("dos últimos 12 meses"));
assert("sync modal removed continue footer button", !/Continuar usando o app/.test(jsx));
assert("sync modal removed institutional block", !/Como o Suse7 preserva seu histórico de vendas/.test(
  readFileSync(join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx"), "utf8")
));
assert("legacy security lead removed", !/Sua segurança é nossa prioridade absoluta/.test(jsx));
assert("legacy ads-only intro removed", !/sincronizar seus anúncios e otimizar seus preços/.test(jsx));
assert("connection visual comes from presentation adapter", jsx.includes("mercadoLivrePresentation.connectionVisual"));
assert("CTA uses shared nova empresa button class", /className="s7-btn-nova-empresa"/.test(jsx));
assert("CTA passed via layout connectAction", /connectAction=\{/.test(jsx) && /Conectar nova conta/.test(jsx));
assert("legacy accounts toolbar removed from jsx", !/ml-accounts-toolbar/.test(jsx));
assert("redundant security footer removed from page", !/Conexão segura: tokens tratados/.test(jsx));
assert("security footer prop removed from layout", !layoutJsx.includes("securityFooter"));
assert("page passes account grid rows", jsx.includes("accountGridRows={integrationAccountGridRows}"));
assert("hero content sizes to children", /\.s7-ml-integrations-hero__content[\s\S]*flex:\s*0\s+0\s+auto/.test(css));
assert("no account-count conditional shell rules", /:has\(\s*\.ml-account-card:nth|accounts\.length.*hero/.test(css) === false);

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.1 shell layout unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.1 shell layout unit] OK");
