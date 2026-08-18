// ======================================================================
// HTML do detalhamento — Relatório de Concorrência (Página 2+ do PDF).
// Apresentação apenas; dados vêm do payload agregado.
// ======================================================================

import {
  buildConcorrenciaShareReportSections,
  CONCORRENCIA_DETALHE_SECAO_TITULO_HTML,
  escapeHtml,
  formatConcorrenteDetalheFinanceiroTexto,
  formatConcorrenteDiferencaLinha,
  formatConcorrenteMetaSecundaria,
  formatProdutoMetaLinha,
} from "./concorrenciaShareReportLayout.js";

/** Bloco financeiro colável — um parágrafo, mesma coluna do nome da loja. */
const CONCORRENTE_FIN_COPY_BLOCO_STYLE =
  "margin:0;padding:0;text-indent:0;margin-left:0;font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:10pt;line-height:1.5;color:#334155;";

/**
 * @param {{
 *   preco?: string;
 *   precoNosso?: string;
 *   diferencaPreco?: string;
 * }} concorrente
 */
function renderFinanceiroCopyHtml(concorrente) {
  const linhas = formatConcorrenteDetalheFinanceiroTexto(concorrente);
  const conteudo = linhas
    .map((linha, indice) => {
      const texto = escapeHtml(linha);
      const isResultado = indice === linhas.length - 1 && linhas.length >= 3;
      return isResultado ? `<strong style="color:#0f172a;">${texto}</strong>` : texto;
    })
    .join("<br />");

  return `<p class="s7-conc-share__comp-fin-copy" style="${CONCORRENTE_FIN_COPY_BLOCO_STYLE}">${conteudo}</p>`;
}

/**
 * @param {string} rotulo
 * @param {string} valor
 * @param {boolean} [destaque=false]
 */
function renderLinhaFinanceiraHtml(rotulo, valor, destaque = false) {
  const valorHtml = destaque ? `<strong>${valor}</strong>` : valor;
  return `<div class="s7-conc-share__fin-row">
  <span class="s7-conc-share__fin-label">${rotulo}</span>
  <span class="s7-conc-share__fin-leader" aria-hidden="true"></span>
  <span class="s7-conc-share__fin-value">${valorHtml}</span>
</div>`;
}

/**
 * @param {{
 *   nomeLoja?: string;
 *   preco?: string;
 *   precoNosso?: string;
 *   diferencaPreco?: string;
 *   tipoAnuncio?: string;
 *   mercadoLider?: string;
 *   reputacao?: string;
 *   vendasVendedor?: string;
 * }} concorrente
 * @param {"default" | "copy"} [variant="default"]
 */
function renderConcorrenteDetalheHtml(concorrente, variant = "default") {
  const loja = escapeHtml(String(concorrente?.nomeLoja ?? "—"));
  const meta = formatConcorrenteMetaSecundaria(concorrente);
  const cabecalhoHtml = meta ? `<strong>${loja}</strong> · ${escapeHtml(meta)}` : `<strong>${loja}</strong>`;

  if (variant === "copy") {
    return `<li class="s7-conc-share__comp-item" style="margin:0 0 8px;padding:8px 10px;background:#f8fafc;border-radius:6px;list-style:none;">
  <p class="s7-conc-share__comp-cabecalho" style="margin:0 0 6px;padding:0;text-indent:0;margin-left:0;font-size:10.5pt;color:#0f172a;line-height:1.35;">${cabecalhoHtml}</p>
  ${renderFinanceiroCopyHtml(concorrente)}
</li>`;
  }

  const precoConc = escapeHtml(String(concorrente?.preco ?? "—"));
  const precoNosso = escapeHtml(String(concorrente?.precoNosso ?? "—"));
  const diff = formatConcorrenteDiferencaLinha(concorrente);
  const diffHtml = diff ? renderLinhaFinanceiraHtml("Resultado", escapeHtml(diff), true) : "";

  const financeiroHtml = `<div class="s7-conc-share__fin">
  ${renderLinhaFinanceiraHtml("Preço concorrente", precoConc)}
  ${renderLinhaFinanceiraHtml("Nosso preço", precoNosso)}
  ${diffHtml}
</div>`;

  return `<li class="s7-conc-share__comp-item">
  <p class="s7-conc-share__comp-cabecalho">${cabecalhoHtml}</p>
  ${financeiroHtml}
</li>`;
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @param {{ variant?: "default" | "copy" }} [options]
 * @returns {string}
 */
export function renderConcorrenciaShareDetalheHtml(payload, options = {}) {
  const variant = options.variant === "copy" ? "copy" : "default";
  const sections = buildConcorrenciaShareReportSections(payload);
  if (!sections || sections.detalhesProdutos.length === 0) return "";

  const produtosHtml = sections.detalhesProdutos
    .map((prod) => {
      const concorrentes = Array.isArray(prod.concorrentes) ? prod.concorrentes : [];
      const concHtml =
        concorrentes.length === 0
          ? `<p class="s7-conc-share__no-comp"${variant === "copy" ? ' style="margin:0;font-size:10pt;color:#64748b;"' : ""}>Sem concorrentes cadastrados.</p>`
          : `<ul class="s7-conc-share__comp-list"${variant === "copy" ? ' style="list-style:none;margin:0;padding:0;"' : ""}>${concorrentes.map((c) => renderConcorrenteDetalheHtml(c, variant)).join("")}</ul>`;
      const produtoStyle =
        variant === "copy"
          ? ' style="margin:0 0 14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;"'
          : "";
      const nomeStyle = variant === "copy" ? ' style="margin:0 0 4px;font-size:11.5pt;font-weight:700;"' : "";
      const metaStyle = variant === "copy" ? ' style="margin:0 0 8px;font-size:9.5pt;color:#64748b;"' : "";
      return `<article class="s7-conc-share__produto"${produtoStyle}><h3 class="s7-conc-share__produto-nome"${nomeStyle}>${escapeHtml(prod.nome)}</h3><p class="s7-conc-share__produto-meta"${metaStyle}>${escapeHtml(formatProdutoMetaLinha(prod))}</p>${concHtml}</article>`;
    })
    .join("");

  const sectionStyle =
    variant === "copy" ? ' style="margin-top:8px;padding-top:8px;"' : "";
  const tituloStyle =
    variant === "copy"
      ? ' style="margin:0 0 12px;font-size:9.5pt;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;"'
      : "";

  return `<section class="s7-conc-share__section s7-conc-share__detalhe"${sectionStyle} aria-label="${escapeHtml(CONCORRENCIA_DETALHE_SECAO_TITULO_HTML)}">
  <h2${tituloStyle}>${escapeHtml(CONCORRENCIA_DETALHE_SECAO_TITULO_HTML)}</h2>
  ${produtosHtml}
</section>`;
}

export const CONCORRENCIA_SHARE_DETALHE_STYLES = `
  .s7-conc-share__section h2 {
    margin: 0 0 12px;
    font-size: 9.5pt;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  }
  .s7-conc-share__detalhe {
    page-break-before: always;
    break-before: page;
    margin-top: 0;
    padding-top: 0;
  }
  .s7-conc-share__produto {
    margin: 0 0 14px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .s7-conc-share__produto-nome { margin: 0 0 4px; font-size: 11.5pt; font-weight: 700; }
  .s7-conc-share__produto-meta { margin: 0 0 8px; font-size: 9.5pt; color: #64748b; }
  .s7-conc-share__comp-list { list-style: none; margin: 0; padding: 0; }
  .s7-conc-share__comp-item {
    margin: 0 0 8px;
    padding: 8px 10px;
    background: #f8fafc;
    border-radius: 6px;
  }
  .s7-conc-share__comp-cabecalho { margin: 0 0 6px; font-size: 10.5pt; color: #0f172a; line-height: 1.35; }
  .s7-conc-share__fin { margin: 0; }
  .s7-conc-share__fin-row {
    display: flex;
    align-items: baseline;
    gap: 0;
    margin: 0 0 2px;
    font-size: 10pt;
    color: #334155;
    line-height: 1.4;
  }
  .s7-conc-share__fin-label { flex: 0 0 auto; white-space: nowrap; }
  .s7-conc-share__fin-leader {
    flex: 1 1 auto;
    min-width: 16px;
    margin: 0 6px;
    border-bottom: 1px dotted #94a3b8;
    height: 0.82em;
  }
  .s7-conc-share__fin-value {
    flex: 0 0 auto;
    text-align: right;
    white-space: nowrap;
    color: #0f172a;
  }
  .s7-conc-share__no-comp { margin: 0; font-size: 10pt; color: #64748b; }
`;
