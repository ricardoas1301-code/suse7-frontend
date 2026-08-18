// ======================================================================
// Padrão de cabeçalho Excel — Relatório de Vendas agregado (P_2.8.12B).
//
// DIFERENÇA para o Raio-X da Venda:
// - NÃO usa logo/imagem no topo.
// - Identidade institucional em TEXTO simples:
//     A1: "Suse7 Precifica"
//     B1: nome do relatório (ex.: "Relatório de Vendas Selecionadas")
// - Cabeçalho da tabela mantém o MESMO visual do Raio-X:
//     fundo laranja S7 + fonte branca em negrito (reutiliza
//     styleS7ExcelTableHeaderRow do header institucional).
//
// Este módulo deixa o padrão REGISTRADO e pronto para o futuro botão
// Excel/CSV consumir o contrato agregado (buildVendasAggregatedReport.js).
// ======================================================================

import {
  S7_EXCEL_BRAND_NAME,
  S7_EXCEL_ORANGE_ARGB,
  styleS7ExcelTableHeaderRow,
} from "./s7ExcelInstitutionalHeader.js";

export { S7_EXCEL_BRAND_NAME, S7_EXCEL_ORANGE_ARGB, styleS7ExcelTableHeaderRow };

/**
 * Aplica o topo institucional em TEXTO (sem logo) na planilha do relatório e
 * retorna o índice 1-based da linha de cabeçalho da tabela de dados.
 *
 * Layout:
 *   Linha 1 → A1: marca | B1: nome do relatório
 *   Linha 2 → espaçador
 *   Linha 3 → cabeçalho da tabela (aplicar styleS7ExcelTableHeaderRow nessa linha)
 *
 * @param {import("exceljs").Worksheet} sheet
 * @param {{ reportName: string }} options
 * @returns {number} índice 1-based da linha do cabeçalho da tabela
 */
export function applyS7ReportExcelTextHeader(sheet, options) {
  const reportName = String(options?.reportName ?? "").trim() || "Relatório de Vendas";

  const brandRowIndex = 1;
  const spacerRowIndex = 2;
  const tableHeaderRowIndex = 3;

  const brandCell = sheet.getCell(brandRowIndex, 1);
  brandCell.value = S7_EXCEL_BRAND_NAME;
  brandCell.font = { bold: true, size: 13, color: { argb: "FF111827" }, name: "Calibri" };
  brandCell.alignment = { vertical: "middle", horizontal: "left" };

  const nameCell = sheet.getCell(brandRowIndex, 2);
  nameCell.value = reportName;
  nameCell.font = { bold: true, size: 12, color: { argb: "FF374151" }, name: "Calibri" };
  nameCell.alignment = { vertical: "middle", horizontal: "left" };

  sheet.getRow(brandRowIndex).height = 22;
  sheet.getRow(spacerRowIndex).height = 6;

  return tableHeaderRowIndex;
}
