// ======================================================================
// Cabeçalho institucional S7 — exports Excel (referência para relatórios).
// ======================================================================

import suse7LogoUrl from "../../assets/suse7-logo-redonda.png";

/** Cor laranja oficial Suse7 (#ff8533) */
export const S7_EXCEL_ORANGE_ARGB = "FFFF8533";

export const S7_EXCEL_BRAND_NAME = "Suse7 Precifica";

/** Tamanho base anterior (24px) + 60% */
const LOGO_SIZE_PX = Math.round(24 * 1.6);

let cachedLogoBuffer = null;

/**
 * Carrega buffer PNG da logo oficial Suse7 (cache em memória).
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadS7PrecificaLogoBuffer() {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  const response = await fetch(suse7LogoUrl);
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

  const brandRowIndex = 1;
  const spacerRowIndex = 2;
  const tableHeaderRowIndex = 3;
  const textStartCol = 2;

  sheet.getRow(brandRowIndex).height = LOGO_SIZE_PX + 8;
  sheet.getRow(spacerRowIndex).height = 6;

  if (columnCount >= textStartCol) {
    sheet.mergeCells(brandRowIndex, textStartCol, brandRowIndex, columnCount);
  }

  const textCell = sheet.getCell(brandRowIndex, textStartCol);
  textCell.value = {
    richText: [
      {
        font: { bold: true, size: 14, color: { argb: "FF111827" }, name: "Calibri" },
        text: S7_EXCEL_BRAND_NAME,
      },
      {
        font: { bold: true, size: 14, color: { argb: "FF111827" }, name: "Calibri" },
        text: "  ",
      },
      {
        font: { bold: true, size: 13, color: { argb: "FF374151" }, name: "Calibri" },
        text: reportTitle,
      },
    ],
  };
  textCell.alignment = { vertical: "middle", horizontal: "left" };

  try {
    const logoBuffer = await loadS7PrecificaLogoBuffer();
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0.08 },
      ext: { width: LOGO_SIZE_PX, height: LOGO_SIZE_PX },
    });
  } catch {
    // Planilha segue válida sem logo se o asset não carregar.
  }

  return tableHeaderRowIndex;
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
