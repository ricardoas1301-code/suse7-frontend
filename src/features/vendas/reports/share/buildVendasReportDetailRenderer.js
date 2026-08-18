// ======================================================================
// Fonte única de renderização do detalhamento — Copiar e Imprimir.
// Apresentação apenas; linhas vêm do payload (listagem da tela).
// ======================================================================

import { DASH, formatNegativeBrlApi } from "../../../../components/sales/saleRayxFormat.js";
import {
  VENDAS_DETALHE_SECAO_TITULO_HTML,
  buildVendaDetalheExportPar,
  escapeHtml,
  formatLinhaIndicador,
  renderVendaDetalheCabecalhoLinha,
  renderVendaDetalheMetaLinha,
} from "./vendasShareReportLayout.js";

/** Campos de custo/despesa — sinal negativo e tom vermelho (apresentação). */
export const VENDAS_DETALHE_CUSTO_HEADERS = new Set([
  "Tarifa / comissão",
  "Envios",
  "Custo do produto",
  "Impostos internos",
  "Operação + embalagem",
]);

const INLINE_FONT =
  "font-family:Calibri,'Segoe UI',Arial,sans-serif;";

const INLINE_VENDA_CARD =
  `margin:0 0 14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;${INLINE_FONT}`;

const INLINE_VENDA_CABECALHO = `margin:0 0 4px;font-size:11.5pt;font-weight:700;color:#0f172a;${INLINE_FONT}`;

const INLINE_VENDA_META = `margin:0 0 8px;font-size:9.5pt;color:#64748b;${INLINE_FONT}`;

const INLINE_FIN_LINHA = `margin:0 0 2px;padding:0;text-indent:0;font-size:10pt;line-height:1.4;color:#334155;${INLINE_FONT}`;

const INLINE_SECAO = "margin-top:8px;padding-top:8px;";

const INLINE_SECAO_TITULO =
  `margin:0 0 12px;font-size:9.5pt;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;${INLINE_FONT}`;

/**
 * @param {string} display
 * @returns {number | null}
 */
function parseBrlDisplayValue(display) {
  const s = String(display ?? "").trim();
  if (!s || s === DASH) return null;

  let num = s.replace(/^R\$\s?/i, "").trim();
  if (num.includes(",")) {
    num = num.replace(/\./g, "").replace(",", ".");
  } else {
    num = num.replace(/\s/g, "");
  }

  const n = Number(num);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formata valor para apresentação no detalhamento (sem alterar dados de origem).
 *
 * @param {string} header
 * @param {string} rawDisplay
 * @returns {{ display: string; tone: "default" | "negative"; destaque: boolean }}
 */
function resolveDetalheValorApresentacao(header, rawDisplay) {
  const valorBruto = String(rawDisplay ?? "").trim();
  const destaque = header === "Saúde da venda" || header === "Lucro" || header === "Margem";

  if (!valorBruto || valorBruto === DASH) {
    return { display: DASH, tone: "default", destaque };
  }

  if (VENDAS_DETALHE_CUSTO_HEADERS.has(header)) {
    const n = parseBrlDisplayValue(valorBruto);
    if (n == null || n === 0) {
      return { display: DASH, tone: "default", destaque: false };
    }
    const formatted = formatNegativeBrlApi(String(Math.abs(n)));
    if (formatted) {
      return { display: formatted, tone: "negative", destaque: false };
    }
  }

  return { display: valorBruto, tone: "default", destaque };
}

/**
 * @param {string} rotulo
 * @param {string} valor
 * @param {{ destaque?: boolean; tone?: "default" | "negative" }} [options]
 */
function renderLinhaIndicadorHtml(rotulo, valor, options = {}) {
  const { destaque = false, tone = "default" } = options;
  const toneClass = tone === "negative" ? " s7-vendas-share__fin-value--negative" : "";
  let valorInner = escapeHtml(valor);
  if (destaque) valorInner = `<strong>${valorInner}</strong>`;

  return `<div class="s7-vendas-share__fin-row">
  <span class="s7-vendas-share__fin-label">${rotulo}</span>
  <span class="s7-vendas-share__fin-leader" aria-hidden="true"></span>
  <span class="s7-vendas-share__fin-value${toneClass}">${valorInner}</span>
</div>`;
}

/**
 * Linha colável (Google Docs / Word) — estilos inline, sem flex.
 *
 * @param {string} rotulo
 * @param {string} valor
 * @param {number} maxRotuloLen
 * @param {{ destaque?: boolean; tone?: "default" | "negative" }} [options]
 */
function renderLinhaIndicadorCopyHtml(rotulo, valor, maxRotuloLen, options = {}) {
  const { destaque = false, tone = "default" } = options;
  const linha = formatLinhaIndicador(rotulo, valor, maxRotuloLen);
  const valorStyle =
    tone === "negative"
      ? "color:#dc2626;font-weight:700;"
      : destaque
        ? "color:#0f172a;font-weight:700;"
        : "";

  if (!valorStyle) {
    return `<p style="${INLINE_FIN_LINHA}">${escapeHtml(linha)}</p>`;
  }

  const separador = linha.lastIndexOf(` ${valor}`);
  if (separador < 0) {
    return `<p style="${INLINE_FIN_LINHA}"><span style="${valorStyle}">${escapeHtml(linha)}</span></p>`;
  }

  const prefixo = linha.slice(0, separador + 1);
  return `<p style="${INLINE_FIN_LINHA}">${escapeHtml(prefixo)}<span style="${valorStyle}">${escapeHtml(valor)}</span></p>`;
}

/**
 * @param {Record<string, unknown>} row
 * @param {"stylesheet" | "inline"} styleMode
 */
function renderVendaDetalheCardHtml(row, styleMode) {
  const exportPar = buildVendaDetalheExportPar(row);
  const cabecalho = escapeHtml(renderVendaDetalheCabecalhoLinha(exportPar));
  const meta = escapeHtml(renderVendaDetalheMetaLinha(exportPar));
  const { headers, row: values } = exportPar;

  if (styleMode === "inline") {
    const maxRotulo = Math.max(...headers.map((header) => header.length));
    const finRows = headers
      .map((header, index) => {
        const apresentacao = resolveDetalheValorApresentacao(header, String(values[index] ?? DASH));
        return renderLinhaIndicadorCopyHtml(header, apresentacao.display, maxRotulo, {
          destaque: apresentacao.destaque,
          tone: apresentacao.tone,
        });
      })
      .join("");

    return `<article style="${INLINE_VENDA_CARD}">
  <h3 style="${INLINE_VENDA_CABECALHO}">${cabecalho}</h3>
  <p style="${INLINE_VENDA_META}">${meta}</p>
  <div>${finRows}</div>
</article>`;
  }

  const finRows = headers
    .map((header, index) => {
      const apresentacao = resolveDetalheValorApresentacao(header, String(values[index] ?? DASH));
      return renderLinhaIndicadorHtml(escapeHtml(header), apresentacao.display, {
        destaque: apresentacao.destaque,
        tone: apresentacao.tone,
      });
    })
    .join("");

  return `<article class="s7-vendas-share__venda">
  <h3 class="s7-vendas-share__venda-cabecalho">${cabecalho}</h3>
  <p class="s7-vendas-share__venda-meta">${meta}</p>
  <div class="s7-vendas-share__fin">${finRows}</div>
</article>`;
}

export const VENDAS_REPORT_DETAIL_STYLES = `
  .s7-vendas-share__section h2 {
    margin: 0 0 12px;
    font-size: 9.5pt;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  }
  .s7-vendas-share__detalhe {
    page-break-before: always;
    break-before: page;
    margin-top: 0;
    padding-top: 0;
  }
  .s7-vendas-share__venda {
    margin: 0 0 14px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .s7-vendas-share__venda-cabecalho { margin: 0 0 4px; font-size: 11.5pt; font-weight: 700; }
  .s7-vendas-share__venda-meta { margin: 0 0 8px; font-size: 9.5pt; color: #64748b; }
  .s7-vendas-share__fin { margin: 0; }
  .s7-vendas-share__fin-row {
    display: flex;
    align-items: baseline;
    gap: 0;
    margin: 0 0 2px;
    font-size: 10pt;
    color: #334155;
    line-height: 1.4;
  }
  .s7-vendas-share__fin-label { flex: 0 0 auto; white-space: nowrap; }
  .s7-vendas-share__fin-leader {
    flex: 1 1 auto;
    min-width: 16px;
    margin: 0 6px;
    border-bottom: 1px dotted #94a3b8;
    height: 0.82em;
  }
  .s7-vendas-share__fin-value {
    flex: 0 0 auto;
    text-align: right;
    white-space: nowrap;
    color: #0f172a;
  }
  .s7-vendas-share__fin-value--negative {
    color: #dc2626;
    font-weight: 700;
  }
`;

/** @deprecated Alias — use VENDAS_REPORT_DETAIL_STYLES */
export const VENDAS_SHARE_DETALHE_STYLES = VENDAS_REPORT_DETAIL_STYLES;

/**
 * Monta HTML + CSS do detalhamento — mesma estrutura para Copiar e Imprimir.
 *
 * @param {readonly Record<string, unknown>[]} detailRows
 * @param {{ title?: string; emptyMessage?: string; styleMode?: "stylesheet" | "inline" }} [options]
 * @returns {{ html: string; styles: string }}
 */
export function buildVendasReportDetailRenderer(detailRows, options = {}) {
  const rows = Array.isArray(detailRows) ? detailRows : [];
  const title = options.title ?? VENDAS_DETALHE_SECAO_TITULO_HTML;
  const emptyMessage = options.emptyMessage ?? "";
  const styleMode = options.styleMode === "inline" ? "inline" : "stylesheet";

  if (rows.length === 0) {
    return { html: emptyMessage, styles: styleMode === "inline" ? "" : VENDAS_REPORT_DETAIL_STYLES };
  }

  const vendasHtml = rows.map((row) => renderVendaDetalheCardHtml(row, styleMode)).join("");

  const html =
    styleMode === "inline"
      ? `<section style="${INLINE_SECAO}" aria-label="${escapeHtml(title)}">
  <h2 style="${INLINE_SECAO_TITULO}">${escapeHtml(title)}</h2>
  ${vendasHtml}
</section>`
      : `<section class="s7-vendas-share__section s7-vendas-share__detalhe" aria-label="${escapeHtml(title)}">
  <h2>${escapeHtml(title)}</h2>
  ${vendasHtml}
</section>`;

  return {
    html,
    styles: styleMode === "inline" ? "" : VENDAS_REPORT_DETAIL_STYLES,
  };
}

/**
 * @param {readonly Record<string, unknown>[]} detailRows
 * @returns {string}
 */
export function renderVendasShareDetalheHtml(detailRows) {
  return buildVendasReportDetailRenderer(detailRows).html;
}
