// ======================================================================
// Layout oficial do Relatório de Vendas — Copiar / Imprimir / PDF.
// Apresentação apenas; dados vêm do payload e linhas já listadas na tela.
// ======================================================================

import { buildSaleRayxExportRows } from "../../../../components/sales/buildSaleRayxExportRows.js";
import { mapVendasListRowToRayxExportContext } from "./mapVendasListRowToRayxExportContext.js";
import { renderVendasShareExecutiveText } from "./renderVendasShareExecutiveText.js";

export const VENDAS_SHARE_SEPARADOR = "━━━━━━━━━━━━━━━━━━━━━━━";

export const VENDAS_DETALHE_SECAO_TITULO = "DETALHAMENTO DAS VENDAS";
export const VENDAS_DETALHE_SECAO_TITULO_HTML = "Detalhamento das vendas";

const FINANCEIRO_GAP_MIN = 12;

/**
 * @param {string} rotulo
 * @param {string} valor
 * @param {number} maxRotuloLen
 */
export function formatLinhaIndicador(rotulo, valor, maxRotuloLen) {
  const prefixo = `${rotulo} `;
  const pontos = ".".repeat(Math.max(3, maxRotuloLen + 1 + FINANCEIRO_GAP_MIN - prefixo.length));
  return `${prefixo}${pontos} ${valor}`;
}

/**
 * @param {Record<string, unknown>} row
 */
export function buildVendaDetalheExportPar(row) {
  const ctx = mapVendasListRowToRayxExportContext(row);
  return buildSaleRayxExportRows(ctx);
}

/**
 * @param {{ headers: string[]; row: string[] }} exportPar
 */
export function renderVendaDetalheCabecalhoLinha(exportPar) {
  const venda = exportPar.row[0] ?? "—";
  const produto = exportPar.row[6] ?? "—";
  return `${venda} · ${produto}`;
}

/**
 * @param {{ headers: string[]; row: string[] }} exportPar
 */
export function renderVendaDetalheMetaLinha(exportPar) {
  const partes = [exportPar.row[1], exportPar.row[3], exportPar.row[4], exportPar.row[5]].filter(
    (valor) => valor != null && String(valor).trim() !== "" && String(valor).trim() !== "—",
  );
  return partes.length > 0 ? partes.join(" · ") : "—";
}

/**
 * @param {Record<string, unknown>} row
 * @returns {string[]}
 */
export function renderVendaDetalheTextoLinhas(row) {
  const exportPar = buildVendaDetalheExportPar(row);
  const { headers, row: values } = exportPar;
  const linhas = [renderVendaDetalheCabecalhoLinha(exportPar), renderVendaDetalheMetaLinha(exportPar), ""];

  const maxRotulo = Math.max(...headers.map((header) => header.length));
  for (let i = 0; i < headers.length; i += 1) {
    linhas.push(formatLinhaIndicador(headers[i], String(values[i] ?? "—"), maxRotulo));
  }
  return linhas;
}

/**
 * @param {readonly Record<string, unknown>[]} rows
 * @returns {string[]}
 */
export function renderDetalhamentoVendasTexto(rows) {
  const linhas = [];
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return linhas;

  for (const row of list) {
    linhas.push("");
    linhas.push(...renderVendaDetalheTextoLinhas(row));
  }
  return linhas;
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 */
export function renderVendasShareExecutiveCardText(payload) {
  return renderVendasShareExecutiveText(payload);
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {readonly Record<string, unknown>[]} detailRows
 */
export function renderVendasShareDetalheCopyText(payload, detailRows) {
  if (!payload) return "";
  const rows = Array.isArray(detailRows) ? detailRows : [];
  if (rows.length === 0) return "";

  const linhas = [
    "",
    "",
    VENDAS_SHARE_SEPARADOR,
    "",
    VENDAS_DETALHE_SECAO_TITULO,
    ...renderDetalhamentoVendasTexto(rows),
  ];
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {readonly Record<string, unknown>[]} detailRows
 */
export function renderVendasShareFullCopyText(payload, detailRows) {
  const card = renderVendasShareExecutiveCardText(payload);
  const detalhe = renderVendasShareDetalheCopyText(payload, detailRows);
  if (!detalhe) return `${card}\n`;
  return `${card}\n\n\n\n${detalhe}\n`;
}

/** @param {string} value */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
