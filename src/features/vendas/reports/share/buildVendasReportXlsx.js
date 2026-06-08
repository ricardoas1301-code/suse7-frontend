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
 * Converte data ISO (yyyy-mm-dd) para dd-mm-yyyy (amigável em nome de arquivo).
 * @param {string | null | undefined} iso
 * @returns {string | null}
 */
function isoToFriendlyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/**
 * Período legível para nome de arquivo: "01-06-2026 a 08-06-2026".
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload} payload
 * @returns {string}
 */
function resolvePeriodoLabel(payload) {
  const ini = isoToFriendlyDate(payload.periodo?.dataInicial);
  const fim = isoToFriendlyDate(payload.periodo?.dataFinal);
  if (ini && fim) return `${ini} a ${fim}`;
  const label = String(payload.periodo?.label ?? "").trim();
  if (label) return label.replace(/\//g, "-").replace(/\s*at[ée]\s*/i, " a ");
  return "periodo";
}

/**
 * Nome base oficial e amigável dos arquivos do Relatório de Vendas.
 * Ex.: "Suse7 - Relatório de Vendas 01-06-2026 a 08-06-2026"
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload} payload
 * @returns {string}
 */
export function resolveVendasReportBaseName(payload) {
  return `Suse7 - Relatório de Vendas ${resolvePeriodoLabel(payload)}`;
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload} payload
 * @returns {string}
 */
function resolveFilename(payload) {
  return `${resolveVendasReportBaseName(payload)}.xlsx`;
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
