#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.6 — Altura útil, identidade ancorada, modal, avatar nos cards.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildMercadoLivreIntegrationCardPresentation,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationAdapter.js";
import {
  buildSellerCompaniesById,
  resolveLinkedCompanyPresentation,
} from "../src/components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js";

const root = dirname(fileURLToPath(import.meta.url));
const pageCss = readFileSync(join(root, "../src/components/Profile/MercadoLivre.css"), "utf8");
const layoutCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.css"),
  "utf8"
);
const cardJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationCard.jsx"),
  "utf8"
);
const cardCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationCard.css"),
  "utf8"
);
const modalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.css"),
  "utf8"
);
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const formatJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const heroBlock =
  pageCss.match(/\.ml-integrations-page \.profile-card\.ml-card\.s7-ml-integrations-hero\s*\{[^}]+\}/s)?.[0] ??
  "";
const pageShellBlock = pageCss.match(/\.ml-integrations-page\s*\{[^}]+\}/s)?.[0] ?? "";

assert("page shell grows with content not viewport flex trap", /flex:\s*0\s+0\s+auto/.test(pageShellBlock));
assert("hero keeps min-height viewport fill", /min-height:\s*calc\([\s\S]*100dvh/.test(heroBlock));
assert("hero keeps auto growth", /height:\s*auto/.test(heroBlock));
assert("hero avoids duplicate external bottom margin", !/margin:\s*0\s+0\s+12px/.test(heroBlock));
assert("hero uses only profile gutter for 12px bottom", /margin:\s*0/.test(heroBlock));
assert("no min-height reset by account count", !/:has\([\s\S]*s7-marketplace-integration-cards[\s\S]*min-height:\s*0/.test(pageCss));
assert("redundant security footer removed", !/ml-security-hint--footer/.test(pageCss));

assert("grid rows do not stretch with short content", /align-content:\s*start/.test(layoutCss));
const visualBlock =
  layoutCss.match(/\.s7-marketplace-integration-page-body__visual\s*\{[^}]+\}/s)?.[0] ?? "";
assert("visual column anchored with internal centering", /align-self:\s*stretch/.test(visualBlock) && /position:\s*relative/.test(visualBlock));
assert("connection visual fixed vertical anchor", /s7-marketplace-connection-visual[\s\S]*position:\s*absolute/.test(layoutCss));
assert("connection visual anchor uses two-row card geometry", /--s7-mi-visual-card-height:\s*76px/.test(layoutCss));
assert("connection logos scaled plus sixteen percent", /clamp\(136px,\s*21\.6vw,\s*176px\)/.test(layoutCss));
assert("visual column no sticky", !/position:\s*sticky/.test(layoutCss));
assert("visual column no fixed positioning", !/position:\s*fixed/.test(layoutCss));

assert("avatar resolver exported", formatJs.includes("resolveLinkedCompanyPresentation"));
assert("avatar resolves by seller_company_id", /companiesById\.get\(scId\)/.test(formatJs));
assert("avatar uses logo_url", /logo_url/.test(formatJs));
assert("page resolves avatar via integrationCompaniesById", pageJsx.includes("resolveLinkedCompanyPresentation"));
assert("page passes avatar props to card", pageJsx.includes("linkedCompanyAvatarUrl"));

assert("card meta column with badge and avatar", cardJsx.includes("s7-marketplace-integration-card__meta"));
assert("avatar below badge in meta column", /statusBadge[\s\S]*s7-marketplace-integration-card__company-avatar/.test(cardJsx));
assert("avatar compact size plus sixteen percent", /37px/.test(cardCss));
assert("avatar object-fit contain", /object-fit:\s*contain/.test(cardCss));
assert("avatar fallback initials", cardJsx.includes("s7-marketplace-integration-card__company-avatar-fallback"));
assert("card min-height preserved", /min-height:\s*76px/.test(cardCss));

const companiesById = buildSellerCompaniesById([
  {
    id: "sc-rf",
    trade_name: "RF Móveis",
    logo_url: "https://cdn.example/rf.png",
    document_cnpj: "62194333000156",
  },
]);
const linked = resolveLinkedCompanyPresentation(companiesById, "sc-rf", "RF Móveis");
assert("avatar url from linked company", linked.avatarUrl === "https://cdn.example/rf.png");
assert("avatar alt contextual", linked.avatarAlt === "Logo da empresa RF Móveis");

const card = buildMercadoLivreIntegrationCardPresentation(
  { id: "a1", status: "active", account_alias: "LOJASRFMOVEIS", seller_company_id: "sc-rf", company_trade_name: "RF Móveis" },
  null,
  { linkedCompany: linked }
);
assert("card exposes linked company avatar", card.linkedCompany.avatarUrl === "https://cdn.example/rf.png");

const missingLogo = resolveLinkedCompanyPresentation(companiesById, "missing", "Inspirazzo");
assert("avatar fallback initial", missingLogo.avatarInitial === "I");
assert("avatar fallback without url", missingLogo.avatarUrl === null);

assert("modal identity lines override profile-modal centering", /\.profile-modal\.s7-marketplace-integration-modal p\.s7-marketplace-integration-modal__identity-line[\s\S]*text-align:\s*left/.test(modalCss));
assert("modal compact identity gap", /--s7-mi-identity-gap:\s*2px/.test(modalCss));
assert("modal stack preserved in page", pageJsx.includes("isCovered={integrationModalStacked}"));

assert("hooks stable before loading return", (() => {
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
  return !/\buse(State|Effect|Memo|Callback|Ref)\s*\(/.test(body.slice(loadingIdx));
})());

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.6 unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.6 unit] OK");
