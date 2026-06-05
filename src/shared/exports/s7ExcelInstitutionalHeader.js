// ======================================================================
// Cabeçalho institucional S7 — exports Excel (referência para relatórios).
// ======================================================================

import precificaS7IconUrl from "../../assets/precifica-s7-icon.png";

/** Cor laranja oficial Suse7 (#ff8533) */
export const S7_EXCEL_ORANGE_ARGB = "FFFF8533";

export const S7_EXCEL_BRAND_NAME = "Suse7 Precifica";

let cachedLogoBuffer = null;

/**
 * Carrega buffer PNG do logo Precifica (cache em memória).
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadS7PrecificaLogoBuffer() {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  const response = await fetch(precificaS7IconUrl);
  if (!response.ok) {
    throw new Error("LOGO_LOAD_FAILED");
  }
  cachedLogoBuffer = await response.arrayBuffer();
  return cachedLogoBuffer;
}

/**
 * Insere topo institucional na planilha e retorna a linha do cabeçalho da tabela.
 * @param {import("exceljs").Worksheet} sheet
 * @param {import("exceljs").Workbook} workbook
 * @param {{ reportTitle: string; columnCount: number }} options
 * @returns {Promise<number>} índice 1-based da linha de cabeçalho da tabela
 */
export async function applyS7ExcelInstitutionalHeader(sheet, workbook, options) {
  const reportTitle = String(options.reportTitle ?? "").trim() || "Relatório";
  const columnCount = Math.max(1, options.columnCount ?? 1);

  sheet.getColumn(1).width = 10;
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 20;
  sheet.getRow(3).height = 20;

  try {
    const logoBuffer = await loadS7PrecificaLogoBuffer();
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0.1, row: 0.15 },
      ext: { width: 42, height: 42 },
    });
  } catch {
    // Planilha segue válida sem logo se o asset não carregar.
  }

  const brandStartCol = 2;
  if (columnCount >= brandStartCol) {
    sheet.mergeCells(1, brandStartCol, 3, columnCount);
    const brandCell = sheet.getCell(1, brandStartCol);
    brandCell.value = S7_EXCEL_BRAND_NAME;
    brandCell.font = { bold: true, size: 14, color: { argb: "FF111827" } };
    brandCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  } else {
    const brandCell = sheet.getCell(1, 1);
    brandCell.value = S7_EXCEL_BRAND_NAME;
    brandCell.font = { bold: true, size: 14, color: { argb: "FF111827" } };
    brandCell.alignment = { vertical: "middle", horizontal: "left" };
  }

  const titleRowIndex = 5;
  sheet.mergeCells(titleRowIndex, 1, titleRowIndex, columnCount);
  const titleCell = sheet.getCell(titleRowIndex, 1);
  titleCell.value = reportTitle;
  titleCell.font = { bold: true, size: 13, color: { argb: "FF374151" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(titleRowIndex).height = 22;

  sheet.getRow(6).height = 8;

  return 7;
}

/**
 * Aplica estilo laranja no cabeçalho da tabela de dados.
 * @param {import("exceljs").Row} headerRow
 */
export function styleS7ExcelTableHeaderRow(headerRow) {
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: S7_EXCEL_ORANGE_ARGB },
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE67300" } },
    };
  });
}
