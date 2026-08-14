#!/usr/bin/env node
/**
 * Teste unitário cirúrgico — Política de Privacidade V2 (página pública + SSOT backend).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BE_ROOT = path.join(__dirname, "../../suse7-backend");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

const catalogMod = await import(
  pathToFileURL(path.join(BE_ROOT, "src/legal/domain/catalogoDocumentosLegais.js")).href
);

const catalog = catalogMod.obterCatalogoPoliticaPrivacidade();
const texto = catalogMod.montarPoliticaPrivacidadePayloadCanonico().content;

function testConteudoCanonico() {
  assert.equal(catalog.title_page, "Política de Privacidade");
  assert.equal(catalog.published_at_label, "13 de agosto de 2026");
  assert.equal(catalog.document_version, "2026-08-13-v2-provisional");
  assert.equal(catalog.document_type, "PRIVACY_POLICY");

  assert.doesNotMatch(texto, /Segurança e Privacidade/);
  assert.doesNotMatch(texto, /Suse7 Precifica/);
  assert.doesNotMatch(texto, /27\/11\/2025/);
  assert.match(texto, /SUSE7/);

  for (let i = 1; i <= 18; i += 1) {
    assert.match(texto, new RegExp(`${i}\\. `));
  }

  assert.match(texto, /3\.1\./);
  assert.match(texto, /3\.7\./);
  assert.match(texto, /10\. Segurança da Informação/);
  assert.match(texto, /13\. Direitos dos titulares/);
  assert.match(texto, /8\. Transferência internacional de dados/);

  assert.match(texto, /\[RAZÃO SOCIAL RESPONSÁVEL PELO SUSE7\]/);
  assert.doesNotMatch(texto, /\[E-MAIL DE PRIVACIDADE/);
  assert.doesNotMatch(texto, /\ba SUSE7\b/i);
  assert.doesNotMatch(texto, /\bda SUSE7\b/i);
  assert.doesNotMatch(texto, /\bpela SUSE7\b/i);
  assert.doesNotMatch(texto, /plataformo SUSE7/i);
  assert.match(texto, /\[PREENCHER, SE APLICÁVEL\]/);
  assert.match(texto, /contato@suse7\.com\.br/);

  const headings = catalog.blocks.filter((b) => b.type === "heading");
  const subheadings = catalog.blocks.filter((b) => b.type === "subheading");
  assert.equal(headings.length, 18);
  assert.equal(subheadings.length, 7);

  const payload = catalogMod.montarPoliticaPrivacidadePayloadCanonico();
  assert.equal(payload.document_type, "PRIVACY_POLICY");
  assert.ok(payload.content.length > 8000);
  assert.equal(catalog.document_hash, catalogMod.POLITICA_PRIVACIDADE_HASH_CONTEUDO);
}

function testPaginaEShell() {
  const privPage = read("src/pages/Privacidade.jsx");
  const termsPage = read("src/pages/Terms.jsx");
  const privacyContent = read("src/components/legal/PrivacyDocumentContent.jsx");
  const catalogApi = read("src/services/legalDocumentCatalogApi.js");

  assert.match(privPage, /PrivacyDocumentContent/);
  assert.match(privPage, /public-legal-container/);
  assert.match(privPage, /public-legal-card/);
  assert.doesNotMatch(privPage, /Segurança e Privacidade/);
  assert.doesNotMatch(privPage, /Privacidade\.css/);

  assert.match(termsPage, /TermsDocumentContent/);
  assert.match(privPage, /PublicLegalHeader/);
  assert.match(termsPage, /PublicLegalHeader/);

  assert.match(privacyContent, /usePoliticaPrivacidadeCatalogo/);
  assert.match(catalogApi, /privacy-policy/);
  assert.match(catalogApi, /buscarCatalogoDocumentoLegal/);
  assert.match(privacyContent, /Não foi possível carregar a Política de Privacidade/);
}

function testLinkTermosIntro() {
  const bloco = catalog.blocks.find(
    (b) => b.type === "paragraph" && b.parts?.some((p) => p.to === "/termos"),
  );
  assert.ok(bloco, "link interno para /termos ausente");
  const parte = bloco.parts.find((p) => p.to === "/termos");
  assert.equal(parte.text, "Termos e Condições de Uso do SUSE7");
}

function main() {
  testConteudoCanonico();
  testPaginaEShell();
  testLinkTermosIntro();
  console.log("PASS test_privacidade_public_page_unit");
}

main();
