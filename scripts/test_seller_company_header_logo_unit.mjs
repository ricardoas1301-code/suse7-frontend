#!/usr/bin/env node
/**
 * Logo global header — SSOT empresa principal + fallback seguro
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolverUrlAvatarLojaHeader,
  resolverInicialAvatarLojaHeader,
} from "../src/domain/seller/resolverUrlAvatarLoja.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(join(root, "..", relativePath), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert(
  "logo_url empresa tem prioridade",
  resolverUrlAvatarLojaHeader({
    logo_url: "https://cdn/logo.png",
    photo_url: "https://cdn/profile.png",
  }) === "https://cdn/logo.png",
);

assert(
  "fallback photo_url quando logo ausente",
  resolverUrlAvatarLojaHeader({
    logo_url: null,
    photo_url: "https://cdn/profile.png",
  }) === "https://cdn/profile.png",
);

assert(
  "sem logo retorna null",
  resolverUrlAvatarLojaHeader({ logo_url: "", photo_url: "" }) === null,
);

assert("inicial empresa", resolverInicialAvatarLojaHeader("Acme Store") === "A");

const layoutSource = read("src/components/Layout.jsx");
const avatarMenuSource = read("src/components/AvatarMenu.jsx");
const headerAvatarSource = read("src/components/Avatar/SellerCompanyHeaderAvatar.jsx");
const profileApiSource = read("src/services/userProfileApi.js");
const profileSummaryBackend = readFileSync(
  join(root, "../../suse7-backend/src/handlers/user/profileSummary.js"),
  "utf8",
);

assert("Layout usa resolverUrlAvatarLojaHeader", layoutSource.includes("resolverUrlAvatarLojaHeader"));
assert("Layout escuta logoUpdated", layoutSource.includes("logoUpdated"));
assert("Layout consome logo_url API", layoutSource.includes("res.logo_url"));
assert("AvatarMenu usa SellerCompanyHeaderAvatar", avatarMenuSource.includes("SellerCompanyHeaderAvatar"));
assert("sem logo-default.png no header", !avatarMenuSource.includes("/logo-default.png"));
assert("header avatar onError fallback", headerAvatarSource.includes("onError={handleError}"));
assert("profile API expõe logo_url", profileApiSource.includes("logo_url"));
assert("profile-summary backend logo_url SSOT", profileSummaryBackend.includes("carregarLogoUrlEmpresaPrincipal"));
assert("profile-summary backend seller_companies logo_url", profileSummaryBackend.includes("logo_url"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "seller_company_header_logo_unit", cases: 13 }, null, 2));
