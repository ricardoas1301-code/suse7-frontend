#!/usr/bin/env node

/**

 * Teste unitário cirúrgico — Termos de Uso V2 (página pública + SSOT backend).

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



const catalog = catalogMod.obterCatalogoTermosUso();

const texto = catalogMod.montarTermosUsoPayloadCanonico().content;



function testConteudoCanonico() {

  assert.equal(catalog.title_page, "Termos e Condições de Uso do SUSE7");

  assert.equal(catalog.published_at_label, "13 de agosto de 2026");

  assert.equal(catalog.document_version, "2026-08-13-v2-provisional");



  assert.match(texto, /SUSE7/);

  assert.doesNotMatch(texto, /Suse7 Precifica/);

  assert.doesNotMatch(texto, /27\/11\/2025/);



  for (let i = 1; i <= 19; i += 1) {

    assert.match(texto, new RegExp(`${i}\\. `));

  }



  assert.match(texto, /\[RAZÃO SOCIAL RESPONSÁVEL PELO SUSE7\]/);

  assert.match(texto, /denominado "SUSE7"/);

  assert.doesNotMatch(texto, /\ba SUSE7\b/i);

  assert.doesNotMatch(texto, /\bda SUSE7\b/i);

  assert.doesNotMatch(texto, /\bpela SUSE7\b/i);

  assert.doesNotMatch(texto, /plataformo SUSE7/i);

  assert.match(texto, /\[CNPJ\]/);

  assert.match(texto, /\[ENDEREÇO\]/);

  assert.match(texto, /\[RAZÃO SOCIAL\]/);

  assert.match(texto, /contato@suse7\.com\.br/);



  const headings = catalog.blocks.filter((b) => b.type === "heading");

  assert.equal(headings.length, 19);



  const payload = catalogMod.montarTermosUsoPayloadCanonico();

  assert.equal(payload.document_type, "TERMS_OF_USE");

  assert.ok(payload.content.length > 5000);

  assert.equal(catalog.document_hash, catalogMod.TERMOS_USO_HASH_CONTEUDO);

}



function testArquivosPaginaEHeader() {

  const termsPage = read("src/pages/Terms.jsx");

  const privPage = read("src/pages/Privacidade.jsx");

  const header = read("src/components/legal/PublicLegalHeader.jsx");

  const backLink = read("src/components/legal/PublicBackLink.jsx");

  const backLinkCss = read("src/components/legal/publicBackLink.css");

  const headerCss = read("src/components/legal/publicLegalPage.css");

  const termsContent = read("src/components/legal/TermsDocumentContent.jsx");



  assert.match(termsPage, /PublicLegalHeader/);

  assert.match(termsPage, /public-legal-container/);

  assert.match(termsPage, /public-legal-card/);

  assert.doesNotMatch(termsPage, /margin-right:\s*-110px/);

  assert.match(termsContent, /useTermosUsoCatalogo/);



  assert.match(privPage, /PrivacyDocumentContent/);

  assert.doesNotMatch(privPage, /Segurança e Privacidade/);

  assert.doesNotMatch(privPage, /terms-navbar-right/);

  assert.doesNotMatch(privPage, /Privacidade\.css/);



  assert.match(header, /Contato/);

  assert.match(header, /PublicBackLink/);

  assert.match(backLink, /Voltar/);

  assert.match(backLinkCss, /#0f172a/);

  assert.match(header, /to="\/login"/);

  assert.match(header, /to="\/signup"/);

  assert.match(header, /Teste grátis/);



  assert.match(headerCss, /justify-content:\s*space-between/);

  assert.match(headerCss, /public-legal-header__actions/);



  assert.match(headerCss, /padding: calc\(var\(--public-legal-header-height, 60px\) \+ 12px\) 12px 12px/);

  assert.doesNotMatch(headerCss, /margin-right:\s*-110px/);

  assert.match(headerCss, /white-space:\s*nowrap/);

  assert.match(headerCss, /flex-shrink:\s*0/);

}



function main() {

  testConteudoCanonico();

  testArquivosPaginaEHeader();

  console.log("PASS test_termos_uso_public_page_unit");

}



main();

