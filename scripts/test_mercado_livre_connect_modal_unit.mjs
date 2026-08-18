#!/usr/bin/env node
/**
 * S1.MERCADO-LIVRE-CONNECT-MODAL.1 — Modal Conectar ao Mercado Livre
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pickerJsx = readFileSync(
  join(root, "../src/components/Profile/MarketplaceCompanyPickerModal.jsx"),
  "utf8"
);
const pickerCss = readFileSync(
  join(root, "../src/components/Profile/MarketplaceCompanyPickerModal.css"),
  "utf8"
);
const sellerModalJsx = readFileSync(join(root, "../src/components/Profile/SellerCompanyModal.jsx"), "utf8");
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const profileModalCss = readFileSync(join(root, "../src/components/CompleteProfileModal.css"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("title uses Conectar ao pattern", pickerJsx.includes("Conectar ao {marketplaceLabel}"));
assert("subtitle reduced to cnpj choice", pickerJsx.includes("Escolha qual CNPJ receberá esta conexão."));
assert("removed one account per marketplace subtitle", !pickerJsx.includes("Cada empresa pode ter no máximo uma conta ativa"));
assert("uses profile modal shell", pickerJsx.includes("profile-modal s7-mcpick-modal"));
assert("uses modal stack base layer", pickerJsx.includes("s7-modal-stack-base"));
assert("close button removed", !pickerJsx.includes("s7-mcpick-close"));
assert("backdrop close preserved", pickerJsx.includes("onMouseDown={createCompanyOpen ? undefined : onClose}"));
assert("all connected hint updated", pickerJsx.includes("Para vincular outra conta, cadastre uma nova empresa."));
assert("reuses canonical SellerCompanyModal", pickerJsx.includes("<SellerCompanyModal"));
assert("create mode only for inline cadastro", /mode="create"/.test(pickerJsx));
assert("child modal stacked on top", pickerJsx.includes('stackLayer="top"'));
assert("parent covered while child open", pickerJsx.includes('createCompanyOpen ? " is-covered" : ""'));
assert("refresh hook wired", pickerJsx.includes("onCompaniesChanged"));
assert("page passes refresh callback", pageJsx.includes("onCompaniesChanged={loadIntegrationCompanies}"));
assert("oauth only on explicit select", /onSelectCompany\(r\.id\)/.test(pickerJsx));
assert(
  "cadastrar nova empresa opens create modal",
  /onClick={openCreateCompany}/.test(pickerJsx) && pickerJsx.includes("Cadastrar nova empresa")
);
assert("manage companies link preserved", pickerJsx.includes("Gerenciar empresas em Perfil da Empresa"));
assert("company avatar on row", pickerJsx.includes("s7-company-card-avatar"));
assert("cnpj label on row", pickerJsx.includes('s7-mcpick-row-cnpj-label">CNPJ:'));
assert("connected badge preserved", pickerJsx.includes("Já conectada"));
assert("select disabled for connected", pickerJsx.includes("aria-disabled={disabled || undefined}"));
assert("uses canonical S7Tooltip", pickerJsx.includes("S7Tooltip"));
assert("connected tooltip message", pickerJsx.includes("Esta empresa já está conectada ao"));
assert("highlight newly created company", pickerJsx.includes("is-highlight"));
assert("seller modal supports stack top", sellerModalJsx.includes('stackLayer?: "standalone" | "top"'));
assert("profile modal blue top border exists", profileModalCss.includes("border-top: 4px solid #0077ff"));
assert("focus returns to create button", pickerJsx.includes("createCompanyButtonRef"));
assert("cta to list spacing increased 69 percent", pickerCss.includes("margin-bottom: 20.28px"));
assert("modal width increased 19 percent", pickerCss.includes("width: min(666.4px"));
assert("body hides horizontal overflow", pickerCss.includes("overflow-x: hidden"));
assert("all connected title single-line font", pickerCss.includes("s7-mcpick-all-connected-title") && pickerCss.includes("font-size: 12.5px") && pickerCss.includes("white-space: nowrap"));

if (failures.length) {
  console.error("[S1.MERCADO-LIVRE-CONNECT-MODAL.1 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.MERCADO-LIVRE-CONNECT-MODAL.1 unit] OK");
