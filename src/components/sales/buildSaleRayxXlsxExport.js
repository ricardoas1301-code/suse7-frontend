// ======================================================
// Export Excel (.xlsx) — Raio-x da venda (topo institucional S7).
// ======================================================

import { buildSaleRayxExportRows } from "./buildSaleRayxExportRows.js";
import {
  applyS7ExcelInstitutionalHeader,
  styleS7ExcelTableHeaderRow,
} from "../../shared/exports/s7ExcelInstitutionalHeader.js";

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {string[]} headers
 * @param {string[]} row
 */
function applyComfortableColumnWidths(sheet, headers, row) {
  headers.forEach((header, index) => {
    const colIndex = index + 1;
    const dataLen = String(row[index] ?? "").length;
    const headerLen = String(header).length;
    const width = Math.min(48, Math.max(12, Math.max(headerLen, dataLen) + 2));
    sheet.getColumn(colIndex).width = width;
  });
}

/**
 * @param {Parameters<typeof buildSaleRayxExportRows>[0]} ctx
 */
export async function buildSaleRayxXlsxExport(ctx) {
  const { default: ExcelJS } = await import("exceljs");
  const { headers, row, xlsxFilename } = buildSaleRayxExportRows(ctx);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Suse7 Precifica";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Raio-X");

  const headerRowIndex = await applyS7ExcelInstitutionalHeader(sheet, workbook, {
    reportTitle: "Raio-X da Venda",
    columnCount: headers.length,
  });

  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = [undefined, ...headers];
  styleS7ExcelTableHeaderRow(headerRow);

  const dataRow = sheet.getRow(headerRowIndex + 1);
  dataRow.values = [undefined, ...row];
  dataRow.eachCell((cell) => {
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  applyComfortableColumnWidths(sheet, headers, row);

  sheet.views = [{ state: "frozen", ySplit: headerRowIndex, activeCell: `A${headerRowIndex + 1}` }];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, filename: xlsxFilename };
}

/**
 * @param {Parameters<typeof buildSaleRayxExportRows>[0]} ctx
 */
export async function downloadSaleRayxXlsx(ctx) {
  const { buffer, filename } = await buildSaleRayxXlsxExport(ctx);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
