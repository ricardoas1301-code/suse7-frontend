// ======================================================================

// Termos de Uso — SSOT canônico (conteúdo + metadata de versionamento)

// ======================================================================



import { TERMOS_USO_BLOCOS_PROVISORIO_20260813 } from "./termosUsoBlocosProvisorio20260813.js";



/** @typedef {{ text: string; bold?: boolean; href?: string }} TermosTextoParte */

/** @typedef {{ type: 'paragraph'; parts: TermosTextoParte[] }} TermosParagrafo */

/** @typedef {{ type: 'heading'; text: string }} TermosTituloSecao */

/** @typedef {{ type: 'list'; items: TermosTextoParte[][] }} TermosLista */

/** @typedef {{ type: 'contact'; email: string; website: string }} TermosContato */

/** @typedef {{ type: 'contact_details'; intro: string; lines: { label: string; value?: string; href?: string; boldLabel?: boolean }[] }} TermosContatoDetalhado */

/** @typedef {{ type: 'footer'; parts: TermosTextoParte[] }} TermosRodape */

/** @typedef {TermosParagrafo | TermosTituloSecao | TermosLista | TermosContato | TermosContatoDetalhado | TermosRodape} TermosBloco */



export const TERMOS_USO_TIPO_DOCUMENTO = "TERMS_OF_USE";



/** Identificador técnico da versão provisória oficial (13/08/2026). */

export const TERMOS_USO_VERSAO_ID = "2026-08-13-v2-provisional";



/** Rótulo exibido na página pública e no modal. */

export const TERMOS_USO_DATA_PUBLICACAO_ROTULO = "13 de agosto de 2026";



export const TERMOS_USO_TITULO_PAGINA = "Termos e Condições de Uso do SUSE7";

export const TERMOS_USO_TITULO_MODAL = "Termos de Uso do SUSE7";



/** @type {readonly TermosBloco[]} */

export const TERMOS_USO_BLOCOS = TERMOS_USO_BLOCOS_PROVISORIO_20260813;



/**

 * Serializa o documento para hash/auditoria (sem DOM/CSS).

 * @param {readonly TermosBloco[]} [blocos]

 */

export function montarTermosUsoTextoCanonico(blocos = TERMOS_USO_BLOCOS) {

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

 * Payload canônico para hash e validação backend.

 */

export function montarTermosUsoPayloadCanonico() {

  return {

    document_type: TERMOS_USO_TIPO_DOCUMENTO,

    version_id: TERMOS_USO_VERSAO_ID,

    published_at_label: TERMOS_USO_DATA_PUBLICACAO_ROTULO,

    content: montarTermosUsoTextoCanonico(),

  };

}



/**

 * SHA-256 do payload canônico (calculado offline — ver script de teste/regressão).

 * Não alterar manualmente; atualizar apenas quando o conteúdo/versão mudar.

 */

export const TERMOS_USO_HASH_CONTEUDO = "92364df98d295ad434c5413b5288eb0457f691edebdd0c7cfde98e6f54efc63c";


