// ======================================================================
// Export Excel (.xlsx) do Relatório de Concorrência.
// Padrão atual: 2 abas
// 1) Relatório Executivo
// 2) Detalhamento
// Consome o payload único — sem recálculo nem backend.
// ======================================================================

import { parsePrecoMonetario } from "../../../../components/concorrencia/concorrenciaCompetitorDisplay.js";
import {
  applyS7ExcelInstitutionalHeader,
  styleS7ExcelTableHeaderRow,
} from "../../../../shared/exports/s7ExcelInstitutionalHeader.js";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const EXCEL_NUM_FMT = "#,##0.00";
const EXCEL_INT_FMT = "#,##0";

/** @type {readonly string[]} */
const DETALHE_HEADERS = [
  "Produto",
  "Anúncio MLB",
  "SKU",
  "Conta",
  "Marketplace",
  "Nome do concorrente",
  "Tipo anúncio",
  "Reputação",
  "Mercado Líder",
  "Vendas",
  "Preço concorrente",
  "Nosso preço",
  "Diferença",
  "Posição",
];

/** Índices 0-based das colunas numéricas na aba Detalhamento. */
const DETALHE_COL_VENDAS = 9;
const DETALHE_COL_PRECO_CONCORRENTE = 10;
const DETALHE_COL_PRECO_NOSSO = 11;
const DETALHE_COL_DIFERENCA = 12;

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {string}
 */
export function resolveConcorrenciaReportBaseName(payload) {
  const qtd = payload?.quantidadeProdutos?.valor ?? 0;
  const data = new Date();
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const yyyy = data.getFullYear();
  return `Suse7 - Relatório de Concorrência ${dd}-${mm}-${yyyy} (${qtd} produtos)`;
}

/**
 * @param {string | null | undefined} precoFormatado
 * @returns {number | null}
 */
function extrairPrecoExcel(precoFormatado) {
  const texto = String(precoFormatado ?? "").trim();
  if (!texto || texto === "—") return null;
  return parsePrecoMonetario(texto.replace(/^R\$\s*/i, "").trim());
}

/**
 * @param {string | null | undefined} rotuloDiferenca
 * @returns {number | null}
 */
function extrairDiferencaExcel(rotuloDiferenca) {
  const texto = String(rotuloDiferenca ?? "").trim();
  if (!texto || texto === "—") return null;
  const match = texto.match(/R\$\s*([\d.,]+)/i);
  if (match) return parsePrecoMonetario(match[1]);
  return parsePrecoMonetario(texto);
}

/**
 * @param {string | null | undefined} vendasFormatado
 * @returns {number | null}
 */
function extrairVendasExcel(vendasFormatado) {
  const texto = String(vendasFormatado ?? "").trim();
  if (!texto || texto === "—") return null;
  const digits = texto.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string | null | undefined} mercadoLider
 * @returns {string}
 */
function rotuloMercadoLiderExcel(mercadoLider) {
  const texto = String(mercadoLider ?? "").trim();
  if (!texto || texto === "—") return "Não";
  return texto;
}

/**
 * @param {string | null | undefined} posicaoPreco
 * @returns {string}
 */
function rotuloPosicaoExcel(posicaoPreco) {
  const texto = String(posicaoPreco ?? "").trim();
  if (texto.includes("Acima")) return "Acima";
  if (texto.includes("Abaixo")) return "Abaixo";
  if (texto.includes("Equivalente")) return "Equivalente";
  return "—";
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {string[][]} rows
 */
function applyExecutiveColumnWidths(sheet, rows) {
  for (let col = 0; col < 2; col += 1) {
    let max = col === 0 ? 28 : 18;
    for (const row of rows) {
      max = Math.max(max, String(row[col] ?? "").length + 2);
    }
    sheet.getColumn(col + 1).width = Math.min(54, max);
  }
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
async function fillExecutiveWorksheet(sheet, payload) {
  const headerRowIndex = await applyS7ExcelInstitutionalHeader(sheet, sheet.workbook, {
    reportTitle: "Relatório Executivo",
    columnCount: 2,
  });

  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = ["Indicador", "Valor"];
  styleS7ExcelTableHeaderRow(headerRow);

  const r = payload.resumoExecutivo;
  /** @type {[string, string][]} */
  const rows = [];
  rows.push(["Conta", payload.conta.label]);
  rows.push(["Filtro", payload.filtroOperacional.label]);
  if (payload.busca.hasQuery) {
    rows.push(["Busca", payload.busca.query]);
  }
  rows.push(["Produtos analisados", r.produtosAnalisados.label]);

  if (payload.mostrarDistribuicao && payload.distribuicaoPorConta.length > 0) {
    rows.push(["", ""]);
    rows.push(["Distribuição por conta", ""]);
    for (const conta of payload.distribuicaoPorConta) {
      rows.push([conta.conta, conta.quantidadeLabel]);
    }
  }

  rows.push(["", ""]);
  rows.push(["Resumo executivo", ""]);
  rows.push(["Produtos com concorrentes", r.comConcorrentes.label]);
  rows.push(["Produtos sem concorrentes", r.semConcorrentes.label]);
  rows.push(["Concorrência completa", r.concorrenciaCompleta.label]);
  rows.push(["Concorrência incompleta", r.concorrenciaIncompleta.label]);
  rows.push(["Com concorrentes inativos", r.comConcorrentesInativos.label]);
  rows.push(["Total de concorrentes monitorados", r.totalConcorrentesMonitorados.label]);

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

  applyExecutiveColumnWidths(sheet, rows);
  sheet.views = [{ state: "frozen", ySplit: headerRowIndex, activeCell: `A${headerRowIndex + 1}` }];
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
async function fillDetalhamentoWorksheet(sheet, payload) {
  const detalheDataRows = montarLinhasDetalheConcorrentes(payload);
  const headerRowIndex = await applyS7ExcelInstitutionalHeader(sheet, sheet.workbook, {
    reportTitle: "Detalhamento",
    columnCount: DETALHE_HEADERS.length,
  });

  const detailHeaderRow = sheet.getRow(headerRowIndex);
  detailHeaderRow.values = DETALHE_HEADERS;
  styleS7ExcelTableHeaderRow(detailHeaderRow);

  let rowIndex = headerRowIndex + 1;
  for (const dataRow of detalheDataRows) {
    const row = sheet.getRow(rowIndex);
    aplicarLinhaDetalheExcel(row, dataRow);
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    rowIndex += 1;
  }

  applyDetailColumnWidths(sheet, DETALHE_HEADERS, detalheDataRows);
  sheet.views = [{ state: "frozen", ySplit: headerRowIndex, activeCell: `A${headerRowIndex + 1}` }];
}

/**
 * @param {import("exceljs").Worksheet} sheet
 * @param {string[]} headers
 * @param {Array<Array<string | number | null>>} dataRows
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
 * @param {import("exceljs").Row} row
 * @param {Array<string | number | null>} values
 */
function aplicarLinhaDetalheExcel(row, values) {
  values.forEach((valor, index) => {
    const cell = row.getCell(index + 1);
    cell.value = valor ?? "—";
    if (typeof valor === "number") {
      if (index === DETALHE_COL_VENDAS) cell.numFmt = EXCEL_INT_FMT;
      if (
        index === DETALHE_COL_PRECO_CONCORRENTE ||
        index === DETALHE_COL_PRECO_NOSSO ||
        index === DETALHE_COL_DIFERENCA
      ) {
        cell.numFmt = EXCEL_NUM_FMT;
      }
    }
  });
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 * @returns {Array<Array<string | number | null>>}
 */
function montarLinhasDetalheConcorrentes(payload) {
  /** @type {Array<Array<string | number | null>>} */
  const linhas = [];

  for (const prod of payload.detalhesProdutos ?? []) {
    const concorrentes = Array.isArray(prod.concorrentes) ? prod.concorrentes : [];
    const baseProduto = [
      prod.nome,
      prod.idAnuncio ?? "—",
      prod.sku,
      prod.conta,
      prod.marketplace,
    ];

    if (concorrentes.length === 0) {
      linhas.push([
        ...baseProduto,
        "—",
        "—",
        "—",
        "—",
        null,
        null,
        null,
        null,
        "—",
      ]);
      continue;
    }

    for (const c of concorrentes) {
      linhas.push([
        ...baseProduto,
        c.nomeLoja,
        c.tipoAnuncio,
        c.reputacao,
        rotuloMercadoLiderExcel(c.mercadoLider),
        extrairVendasExcel(c.vendasVendedor),
        extrairPrecoExcel(c.preco),
        extrairPrecoExcel(c.precoNosso),
        extrairDiferencaExcel(c.diferencaPreco),
        rotuloPosicaoExcel(c.posicaoPreco),
      ]);
    }
  }

  return linhas;
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {Promise<{ buffer: ArrayBuffer; filename: string } | null>}
 */
export async function buildConcorrenciaReportXlsx(payload) {
  if (!payload) return null;

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Suse7 Precifica";
  workbook.created = new Date();

  const executiveSheet = workbook.addWorksheet("Relatório Executivo");
  const detalhamentoSheet = workbook.addWorksheet("Detalhamento");
  await fillExecutiveWorksheet(executiveSheet, payload);
  await fillDetalhamentoWorksheet(detalhamentoSheet, payload);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `${resolveConcorrenciaReportBaseName(payload)}.xlsx`,
  };
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {Promise<{ blob: Blob; filename: string } | null>}
 */
export async function buildConcorrenciaReportXlsxBlob(payload) {
  const built = await buildConcorrenciaReportXlsx(payload);
  if (!built) return null;
  return {
    blob: new Blob([built.buffer], { type: XLSX_MIME }),
    filename: built.filename,
  };
}

/**
 * Dispara download do Excel no navegador.
 *
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 */
export async function downloadConcorrenciaReportXlsx(payload) {
  const built = await buildConcorrenciaReportXlsxBlob(payload);
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
