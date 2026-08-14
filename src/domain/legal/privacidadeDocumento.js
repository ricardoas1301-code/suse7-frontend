// ======================================================================
// Política de Privacidade — SSOT canônico (conteúdo + metadata)
// ======================================================================

import { PRIVACIDADE_BLOCOS_PROVISORIO_20260813 } from "./privacidadeBlocosProvisorio20260813.js";

/** @typedef {{ text: string; bold?: boolean; href?: string; to?: string }} PrivacidadeTextoParte */
/** @typedef {{ type: 'paragraph'; parts: PrivacidadeTextoParte[] }} PrivacidadeParagrafo */
/** @typedef {{ type: 'heading'; text: string }} PrivacidadeTituloSecao */
/** @typedef {{ type: 'subheading'; text: string }} PrivacidadeSubsecao */
/** @typedef {{ type: 'list'; items: PrivacidadeTextoParte[][] }} PrivacidadeLista */
/** @typedef {{ type: 'contact_details'; intro?: string; lines: { label: string; value?: string; href?: string; boldLabel?: boolean }[] }} PrivacidadeContatoDetalhado */
/** @typedef {{ type: 'footer'; parts: PrivacidadeTextoParte[] }} PrivacidadeRodape */
/** @typedef {PrivacidadeParagrafo | PrivacidadeTituloSecao | PrivacidadeSubsecao | PrivacidadeLista | PrivacidadeContatoDetalhado | PrivacidadeRodape} PrivacidadeBloco */

export const PRIVACIDADE_TIPO_DOCUMENTO = "PRIVACY_POLICY";

export const PRIVACIDADE_VERSAO_ID = "2026-08-13-v2-provisional";

export const PRIVACIDADE_DATA_PUBLICACAO_ROTULO = "13 de agosto de 2026";

export const PRIVACIDADE_TITULO_PAGINA = "Política de Privacidade";

/** @type {readonly PrivacidadeBloco[]} */
export const PRIVACIDADE_BLOCOS = PRIVACIDADE_BLOCOS_PROVISORIO_20260813;

/**
 * @param {readonly PrivacidadeBloco[]} [blocos]
 */
export function montarPrivacidadeTextoCanonico(blocos = PRIVACIDADE_BLOCOS) {
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

export function montarPrivacidadePayloadCanonico() {
  return {
    document_type: PRIVACIDADE_TIPO_DOCUMENTO,
    version_id: PRIVACIDADE_VERSAO_ID,
    published_at_label: PRIVACIDADE_DATA_PUBLICACAO_ROTULO,
    content: montarPrivacidadeTextoCanonico(),
  };
}

export const PRIVACIDADE_HASH_CONTEUDO = "03ba3a40c5f1c09b213fe32e794427e576ab53613623be9775d62f8fb27e5348";
