// ======================================================================
// Termos de Uso — helpers de serialização (conteúdo vem do catálogo backend)
// LEGAL.DOCUMENT.SSOT.01 — type/version/hash NÃO são autoridade no frontend.
// ======================================================================

/** @typedef {{ text: string; bold?: boolean; href?: string }} TermosTextoParte */
/** @typedef {{ type: 'paragraph'; parts: TermosTextoParte[] }} TermosParagrafo */
/** @typedef {{ type: 'heading'; text: string }} TermosTituloSecao */
/** @typedef {{ type: 'list'; items: TermosTextoParte[][] }} TermosLista */
/** @typedef {{ type: 'contact'; email: string; website: string }} TermosContato */
/** @typedef {{ type: 'contact_details'; intro: string; lines: { label: string; value?: string; href?: string; boldLabel?: boolean }[] }} TermosContatoDetalhado */
/** @typedef {{ type: 'footer'; parts: TermosTextoParte[] }} TermosRodape */
/** @typedef {TermosParagrafo | TermosTituloSecao | TermosLista | TermosContato | TermosContatoDetalhado | TermosRodape} TermosBloco */

/**
 * Serializa blocos para hash/auditoria (sem DOM/CSS).
 * @param {readonly TermosBloco[]} blocos
 */
export function montarTermosUsoTextoCanonico(blocos) {
  return blocos
    .map((bloco) => {
      if (bloco.type === "paragraph" || bloco.type === "footer") {
        return bloco.parts.map((parte) => parte.text).join("");
      }
      if (bloco.type === "heading") return bloco.text;
      if (bloco.type === "list") {
        return bloco.items
          .map((item) => item.map((parte) => parte.text).join(""))
          .join("\n");
      }
      if (bloco.type === "contact") {
        return `${bloco.email}\n${bloco.website}`;
      }
      if (bloco.type === "contact_details") {
        return [
          bloco.intro,
          ...bloco.lines.map((line) => `${line.label}${line.value ? ` ${line.value}` : ""}`),
        ].join("\n");
      }
      return "";
    })
    .join("\n\n");
}

/**
 * Payload canônico para hash — usa metadados do catálogo backend.
 * @param {{
 *   document_type: string;
 *   document_version: string;
 *   published_at_label: string;
 *   blocks: readonly TermosBloco[];
 * }} catalog
 */
export function montarTermosUsoPayloadCanonicoFromCatalog(catalog) {
  return {
    document_type: catalog.document_type,
    version_id: catalog.document_version,
    published_at_label: catalog.published_at_label,
    content: montarTermosUsoTextoCanonico(catalog.blocks),
  };
}
