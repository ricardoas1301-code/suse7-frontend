// ======================================================================
// Export Excel (.xlsx) do Relatório de Vendas (P_2.8.12F.G).
//
// Fonte ÚNICA de verdade: consome o VendasSharePayload (buildVendasSharePayload),
// derivado do contrato agregado já homologado. Não recalcula nada, não acessa
// backend. Reutilizável pelo WhatsApp e pelo futuro canal Excel.
// ======================================================================

import {
  applyS7ExcelInstitutionalHeader,
  styleS7ExcelTableHeaderRow,
} from "../../../../shared/exports/s7ExcelInstitutionalHeader.js";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * @param {string} raw
 * @returns {string}
 */
function sanitizeFilenamePart(raw) {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload} payload
 * @returns {string}
 */
function resolveFilename(payload) {
  const ini = payload.periodo?.dataInicial;
  const fim = payload.periodo?.dataFinal;
  const periodPart =
    ini && fim ? `${ini}_a_${fim}` : sanitizeFilenamePart(payload.periodo?.label ?? "periodo");
  return `relatorio-vendas-${sanitizeFilenamePart(periodPart) || "periodo"}.xlsx`;
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {string[][]} rows
 * @param {number} startRowIndex
 */
function applyColumnWidths(sheet, rows) {
  for (let col = 0; col < 2; col += 1) {
    let max = col === 0 ? 22 : 18;
    for (const row of rows) {
      max = Math.max(max, String(row[col] ?? "").length + 2);
    }
    sheet.getColumn(col + 1).width = Math.min(54, max);
  }
}

/**
 * Gera o workbook do relatório de vendas em buffer + nome de arquivo.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<{ buffer: ArrayBuffer; filename: string } | null>}
 */
export async function buildVendasReportXlsx(payload) {
  if (!payload) return null;

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Suse7 Precifica";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Relatório de Vendas");

  const headerRowIndex = await applyS7ExcelInstitutionalHeader(sheet, workbook, {
    reportTitle: "Relatório de Vendas",
    columnCount: 2,
  });

  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = ["Indicador", "Valor"];
  styleS7ExcelTableHeaderRow(headerRow);

  const r = payload.resumoExecutivo;
  /** @type {[string, string][]} */
  const rows = [];
  rows.push(["Período", payload.periodo.label]);
  rows.push(["Conta", payload.contas.label]);
  rows.push(["Vendas", payload.quantidadeVendas.label]);

  if (payload.mostrarDistribuicao && payload.distribuicaoPorConta.length > 0) {
    rows.push(["", ""]);
    rows.push(["Distribuição por conta", ""]);
    for (const conta of payload.distribuicaoPorConta) {
      rows.push([conta.conta, conta.quantidadeLabel]);
    }
  }

  rows.push(["", ""]);
  rows.push(["Resumo executivo", ""]);
  rows.push(["Faturamento", r.faturamento.display]);
  rows.push(["Lucro", r.lucroLiquido.display]);
  rows.push(["Margem", r.margem.display]);
  rows.push(["Saudáveis", r.saudaveis ? r.saudaveis.label : "—"]);
  rows.push(["Margem crítica", r.margemCritica.label]);
  rows.push(["Prejuízo", r.prejuizo.label]);

  let rowIndex = headerRowIndex + 1;
  for (const [indicador, valor] of rows) {
    const row = sheet.getRow(rowIndex);
    row.values = [indicador, valor];
    const isSection = valor === "" && indicador !== "";
    row.getCell(1).font = { bold: isSection, size: 11 };
    row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    row.getCell(2).font = { bold: false, size: 11 };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    rowIndex += 1;
  }

  applyColumnWidths(sheet, rows);
  sheet.views = [
    { state: "frozen", ySplit: headerRowIndex, activeCell: `A${headerRowIndex + 1}` },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, filename: resolveFilename(payload) };
}

/**
 * Gera o Excel como Blob + nome de arquivo (para anexo/download).
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<{ blob: Blob; filename: string } | null>}
 */
export async function buildVendasReportXlsxBlob(payload) {
  const built = await buildVendasReportXlsx(payload);
  if (!built) return null;
  return {
    blob: new Blob([built.buffer], { type: XLSX_MIME }),
    filename: built.filename,
  };
}

/**
 * Baixa o Excel do relatório (futuro canal Excel / fallback de anexo).
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<boolean>}
 */
export async function downloadVendasReportXlsx(payload) {
  const built = await buildVendasReportXlsxBlob(payload);
  if (!built || typeof document === "undefined") return false;
  const url = URL.createObjectURL(built.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = built.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}
