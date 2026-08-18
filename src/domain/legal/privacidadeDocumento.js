// ======================================================================

// Política de Privacidade — helpers de serialização (conteúdo vem do catálogo backend)

// LEGAL.DOCUMENT.SSOT.01 — type/version/hash NÃO são autoridade no frontend.

// ======================================================================



/** @typedef {{ text: string; bold?: boolean; href?: string; to?: string }} PrivacidadeTextoParte */

/** @typedef {{ type: 'paragraph'; parts: PrivacidadeTextoParte[] }} PrivacidadeParagrafo */

/** @typedef {{ type: 'heading'; text: string }} PrivacidadeTituloSecao */

/** @typedef {{ type: 'subheading'; text: string }} PrivacidadeSubsecao */

/** @typedef {{ type: 'list'; items: PrivacidadeTextoParte[][] }} PrivacidadeLista */

/** @typedef {{ type: 'contact_details'; intro?: string; lines: { label: string; value?: string; href?: string; boldLabel?: boolean }[] }} PrivacidadeContatoDetalhado */

/** @typedef {{ type: 'footer'; parts: PrivacidadeTextoParte[] }} PrivacidadeRodape */

/** @typedef {PrivacidadeParagrafo | PrivacidadeTituloSecao | PrivacidadeSubsecao | PrivacidadeLista | PrivacidadeContatoDetalhado | PrivacidadeRodape} PrivacidadeBloco */



/**

 * Serializa blocos para hash/auditoria (sem DOM/CSS).

 * @param {readonly PrivacidadeBloco[]} blocos

 */

export function montarPrivacidadeTextoCanonico(blocos) {

  return blocos

    .map((bloco) => {

      if (bloco.type === "paragraph" || bloco.type === "footer") {

        return bloco.parts.map((parte) => parte.text).join("");

      }

      if (bloco.type === "heading" || bloco.type === "subheading") return bloco.text;

      if (bloco.type === "list") {

        return bloco.items.map((item) => item.map((parte) => parte.text).join("")).join("\n");

      }

      if (bloco.type === "contact_details") {

        return [

          bloco.intro || "",

          ...bloco.lines.map((line) => `${line.label}${line.value ? ` ${line.value}` : ""}`),

        ]

          .filter(Boolean)

          .join("\n");

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

 *   blocks: readonly PrivacidadeBloco[];

 * }} catalog

 */

export function montarPrivacidadePayloadCanonicoFromCatalog(catalog) {

  return {

    document_type: catalog.document_type,

    version_id: catalog.document_version,

    published_at_label: catalog.published_at_label,

    content: montarPrivacidadeTextoCanonico(catalog.blocks),

  };

}

