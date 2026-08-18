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
import { buildSaleRayxExportRows } from "../../../../components/sales/buildSaleRayxExportRows.js";
import { resolveVendasReportDetailRows } from "./fetchVendasReportDetailRows.js";
import { mapVendasListRowToRayxExportContext } from "./mapVendasListRowToRayxExportContext.js";

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
 */
function applyExecutiveColumnWidths(sheet, rows) {
  for (let col = 0; col < 2; col += 1) {
    let max = col === 0 ? 22 : 18;
    for (const row of rows) {
      max = Math.max(max, String(row[col] ?? "").length + 2);
    }
    sheet.getColumn(col + 1).width = Math.min(54, max);
  }
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload} payload
 * @returns {[string, string][]}
 */
function buildResumoExecutivoRows(payload) {
  const cabecalho = payload.cabecalhoExecutivo ?? {};
  const fallbackResumo = payload.resumoExecutivo;
  const custos = Array.isArray(fallbackResumo?.custos) ? fallbackResumo.custos : [];

  /** @type {[string, string][]} */
  const rows = [
    ["Período", cabecalho.periodo ?? payload.periodo.label],
    ["Conta(s)", cabecalho.contas ?? payload.contas.label],
    ["Quantidade de vendas", cabecalho.vendas ?? payload.quantidadeVendas.label],
    ["Filtros", cabecalho.filtros ?? "Nenhum filtro operacional ou busca adicional"],
    ["", ""],
    ["Resumo executivo", ""],
    ["Faturamento", fallbackResumo.faturamento.display],
    ["Lucro", fallbackResumo.lucroLiquido.display],
    ["Margem", fallbackResumo.margem.display],
    ["Pedidos", fallbackResumo.pedidos?.label ?? "0"],
    ["Ticket médio", fallbackResumo.ticketMedio?.display ?? "R$ 0,00"],
    ["Repasse Marketplace", fallbackResumo.repasseMarketplace?.display ?? "R$ 0,00"],
    ["Saudáveis", fallbackResumo.saudaveis ? fallbackResumo.saudaveis.label : "—"],
    ["Margem crítica", fallbackResumo.margemCritica.label],
    ["Prejuízo", fallbackResumo.prejuizo.label],
    ["", ""],
    ["Custos", ""],
  ];

  for (const custo of custos) {
    rows.push([`${custo.label} (R$)`, custo.display]);
    rows.push([`${custo.label} (%)`, custo.sharePercent]);
  }

  return rows;
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {string[]} headers
 * @param {string[][]} dataRows
 */
function applyDetailColumnWidths(sheet, headers, dataRows) {
  headers.forEach((header, index) => {
    const colIndex = index + 1;
    let max = Math.max(12, String(header).length + 2);
    for (const row of dataRows) {
      max = Math.max(max, String(row[index] ?? "").length + 2);
    }
    sheet.getColumn(colIndex).width = Math.min(48, max);
  });
}

/**
 * Gera o workbook do relatório de vendas em buffer + nome de arquivo.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<{ buffer: ArrayBuffer; filename: string } | null>}
 */
export async function buildVendasReportXlsx(payload) {
  if (!payload) return null;
  const startedAt = performance.now();

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Suse7 Precifica";
  workbook.created = new Date();

  const resumoSheet = workbook.addWorksheet("Resumo Executivo");
  const resumoHeaderRowIndex = await applyS7ExcelInstitutionalHeader(resumoSheet, workbook, {
    reportTitle: "Resumo Executivo",
    columnCount: 2,
  });
  const resumoHeaderRow = resumoSheet.getRow(resumoHeaderRowIndex);
  resumoHeaderRow.values = ["Indicador", "Valor"];
  styleS7ExcelTableHeaderRow(resumoHeaderRow);

  const resumoRows = buildResumoExecutivoRows(payload);
  let resumoRowIndex = resumoHeaderRowIndex + 1;
  for (const [indicador, valor] of resumoRows) {
    const row = resumoSheet.getRow(resumoRowIndex);
    row.values = [indicador, valor];
    const isSection = valor === "" && indicador !== "";
    row.getCell(1).font = { bold: isSection, size: 11 };
    row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    row.getCell(2).font = { bold: false, size: 11 };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    resumoRowIndex += 1;
  }
  applyExecutiveColumnWidths(resumoSheet, resumoRows);
  resumoSheet.views = [
    { state: "frozen", ySplit: resumoHeaderRowIndex, activeCell: `A${resumoHeaderRowIndex + 1}` },
  ];

  const detailSheet = workbook.addWorksheet("Vendas Detalhadas");
  const detailStartedAt = performance.now();
  const detailSalesRows = await resolveVendasReportDetailRows(payload);
  /** @type {string[] | null} */
  let detailHeaders = null;
  /** @type {string[][]} */
  const detailDataRows = [];

  for (const saleRow of detailSalesRows) {
    const exportCtx = mapVendasListRowToRayxExportContext(
      /** @type {Record<string, unknown>} */ (saleRow),
    );
    const { headers, row } = buildSaleRayxExportRows(exportCtx);
    if (!detailHeaders) detailHeaders = headers;
    detailDataRows.push(row);
  }

  const detailColumnCount = detailHeaders?.length || 2;
  const detailHeaderRowIndex = await applyS7ExcelInstitutionalHeader(detailSheet, workbook, {
    reportTitle: "Vendas Detalhadas",
    columnCount: detailColumnCount,
  });

  if (detailHeaders && detailDataRows.length > 0) {
    const detailHeaderRow = detailSheet.getRow(detailHeaderRowIndex);
    detailHeaderRow.values = detailHeaders;
    styleS7ExcelTableHeaderRow(detailHeaderRow);

    let detailRowIndex = detailHeaderRowIndex + 1;
    for (const detailRow of detailDataRows) {
      const dataRow = detailSheet.getRow(detailRowIndex);
      dataRow.values = detailRow;
      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
      });
      detailRowIndex += 1;
    }
    applyDetailColumnWidths(detailSheet, detailHeaders, detailDataRows);
  } else {
    const headerRow = detailSheet.getRow(detailHeaderRowIndex);
    headerRow.values = ["Mensagem"];
    styleS7ExcelTableHeaderRow(headerRow);
    const row = detailSheet.getRow(detailHeaderRowIndex + 1);
    row.values = ["Nenhuma venda detalhada encontrada para o recorte selecionado."];
    row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    detailSheet.getColumn(1).width = 72;
  }
  detailSheet.views = [
    { state: "frozen", ySplit: detailHeaderRowIndex, activeCell: `A${detailHeaderRowIndex + 1}` },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  if (import.meta.env.DEV) {
    const durationMs = Math.round(performance.now() - startedAt);
    const detailDurationMs = Math.round(performance.now() - detailStartedAt);
    const firstRow =
      Array.isArray(detailSalesRows) && detailSalesRows.length > 0 ? detailSalesRows[0] : null;
    console.info("[S7][VendasXlsx][debug]", {
      duration_ms: durationMs,
      detail_fetch_and_map_ms: detailDurationMs,
      resumo_vendas_count: payload.quantidadeVendas?.valor ?? 0,
      detail_rows_count: detailSalesRows.length,
      first_detail_row_keys: firstRow ? Object.keys(firstRow).slice(0, 20) : [],
      custos_resumo: payload?.resumoExecutivo?.custos ?? null,
    });
  }
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
