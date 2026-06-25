// ======================================================================
// Layout oficial do Relatório de Concorrência — Copiar / Imprimir / PDF.
// Apresentação apenas; dados vêm do payload agregado (sem recálculo).
// ======================================================================

import { buildConcorrenciaShareExecBlocos } from "../concorrenciaRelatorioExecutivoMetrics.js";

export const CONCORRENCIA_SHARE_SEPARADOR = "━━━━━━━━━━━━━━━━━━━━━━━";

/** @param {readonly { conta: string; sku?: string }[]} detalhesProdutos */
export function buildDistribuicaoPorContaFromDetalhes(detalhesProdutos) {
  const counts = new Map();
  for (const prod of detalhesProdutos ?? []) {
    const conta = String(prod?.conta ?? "—").trim() || "—";
    counts.set(conta, (counts.get(conta) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([conta, quantidadeProdutos]) => ({
      conta,
      quantidadeProdutos,
      quantidadeLabel: `${quantidadeProdutos.toLocaleString("pt-BR")} ${
        quantidadeProdutos === 1 ? "produto" : "produtos"
      }`,
    }));
}

/**
 * @param {string} nome
 * @param {string} valor
 */
export function formatLinhaDistribuicaoConta(nome, valor) {
  const esquerda = String(nome ?? "").trim();
  const direita = String(valor ?? "").trim();
  const larguraAlvo = 44;
  const pontos = Math.max(3, larguraAlvo - esquerda.length - direita.length - 2);
  return `${esquerda} ${".".repeat(pontos)} ${direita}`;
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
export function buildResumoExecutivoItens(payload) {
  const r = payload.resumoExecutivo;
  return [
    { icone: "🎯", titulo: "Com concorrentes", valor: r.comConcorrentes.label },
    { icone: "🏆", titulo: "Sem concorrentes", valor: r.semConcorrentes.label },
    { icone: "✅", titulo: "Concorrência completa", valor: r.concorrenciaCompleta.label },
    { icone: "⚠️", titulo: "Concorrência incompleta", valor: r.concorrenciaIncompleta.label },
    { icone: "⏸️", titulo: "Concorrentes inativos", valor: r.comConcorrentesInativos.label },
    { icone: "👁️", titulo: "Concorrentes monitorados", valor: r.totalConcorrentesMonitorados.label },
  ];
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
export function buildConcorrenciaShareReportSections(payload) {
  if (!payload) return null;

  const detalhes = Array.isArray(payload.detalhesProdutos) ? payload.detalhesProdutos : [];
  const distribuicaoPorConta = buildDistribuicaoPorContaFromDetalhes(detalhes);

  return {
    cabecalho: {
      titulo: String(payload.titulo ?? "Relatório de Concorrência").toUpperCase(),
      subtitulo: payload.subtitulo ?? "Inteligência Competitiva",
      conta: payload.conta.label,
      filtro: payload.filtroOperacional.label,
      busca: payload.busca.hasQuery ? payload.busca.label : null,
      produtos: payload.quantidadeProdutos.label,
    },
    distribuicaoPorConta,
    mostrarDistribuicao: distribuicaoPorConta.length > 1,
    resumoExecutivo: buildResumoExecutivoItens(payload),
    detalhesProdutos: detalhes,
  };
}

export const CONCORRENCIA_DETALHE_SECAO_TITULO = "DETALHAMENTO DOS CONCORRENTES";
export const CONCORRENCIA_DETALHE_SECAO_TITULO_HTML = "Detalhamento dos concorrentes";

/**
 * @param {{ idAnuncio?: string; sku?: string; conta?: string; marketplace?: string; quantidadeConcorrentesLabel?: string }} prod
 */
export function formatProdutoMetaLinha(prod) {
  const partes = [];
  const anuncio = String(prod?.idAnuncio ?? "").trim();
  if (anuncio && anuncio !== "—") partes.push(`Anúncio ${anuncio}`);
  partes.push(`SKU ${prod?.sku ?? "—"}`);
  partes.push(String(prod?.conta ?? "—"));
  partes.push(String(prod?.marketplace ?? "—"));
  partes.push(String(prod?.quantidadeConcorrentesLabel ?? "—"));
  return partes.join(" · ");
}

/**
 * Metadados do concorrente (tipo · mercado líder · reputação · vendas).
 * @param {{
 *   tipoAnuncio?: string;
 *   mercadoLider?: string;
 *   reputacao?: string;
 *   vendasVendedor?: string;
 * }} concorrente
 */
export function formatConcorrenteMetaSecundaria(concorrente) {
  const partes = [];
  const tipo = String(concorrente?.tipoAnuncio ?? "").trim();
  const lider = String(concorrente?.mercadoLider ?? "").trim();
  const reputacao = String(concorrente?.reputacao ?? "").trim();
  const vendas = String(concorrente?.vendasVendedor ?? "").trim();
  if (tipo && tipo !== "—") partes.push(tipo);
  if (lider && lider !== "—") partes.push(lider);
  if (reputacao && reputacao !== "—") partes.push(reputacao);
  if (vendas && vendas !== "—") partes.push(vendas);
  return partes.join(" · ");
}

/**
 * Linha de diferença de preço (ex.: "↑ R$ 170,00 acima").
 * @param {{ diferencaPreco?: string }} concorrente
 */
export function formatConcorrenteDiferencaLinha(concorrente) {
  const diff = String(concorrente?.diferencaPreco ?? "").trim();
  return diff && diff !== "—" ? diff : "";
}

/**
 * Cabeçalho compacto — loja + metadados na mesma linha.
 * @param {{
 *   nomeLoja?: string;
 *   tipoAnuncio?: string;
 *   mercadoLider?: string;
 *   reputacao?: string;
 *   vendasVendedor?: string;
 * }} concorrente
 */
export function formatConcorrenteCabecalhoLinha(concorrente) {
  const loja = String(concorrente?.nomeLoja ?? "—").trim() || "—";
  const meta = formatConcorrenteMetaSecundaria(concorrente);
  return meta ? `${loja} · ${meta}` : loja;
}

/** Coluna de valores alinhada — líder pontilhado no texto plano (Copiar). */
const FINANCEIRO_GAP_MIN = 12;

/**
 * Linhas financeiras comparativas com pontilhado — Copiar (texto plano).
 * @param {{
 *   preco?: string;
 *   precoNosso?: string;
 *   diferencaPreco?: string;
 * }} concorrente
 * @returns {string[]}
 */
export function formatConcorrenteDetalheFinanceiroTexto(concorrente) {
  /** @type {[string, string][]} */
  const rotulos = [
    ["Preço concorrente", String(concorrente?.preco ?? "—").trim() || "—"],
    ["Nosso preço", String(concorrente?.precoNosso ?? "—").trim() || "—"],
  ];
  const diff = formatConcorrenteDiferencaLinha(concorrente);
  if (diff) rotulos.push(["Resultado", diff]);

  const maxRotulo = Math.max(...rotulos.map(([rotulo]) => rotulo.length));
  const colunaValor = maxRotulo + 1 + FINANCEIRO_GAP_MIN;

  return rotulos.map(([rotulo, valor]) => {
    const prefixo = `${rotulo} `;
    const pontos = ".".repeat(Math.max(3, colunaValor - prefixo.length));
    return `${prefixo}${pontos} ${valor}`;
  });
}

/**
 * Bloco textual comparativo por concorrente — Copiar / PDF.
 * @param {{
 *   nomeLoja?: string;
 *   preco?: string;
 *   precoNosso?: string;
 *   diferencaPreco?: string;
 *   tipoAnuncio?: string;
 *   mercadoLider?: string;
 *   reputacao?: string;
 *   vendasVendedor?: string;
 * }} concorrente
 * @returns {string[]}
 */
export function renderConcorrenteDetalheTextoLinhas(concorrente) {
  return [formatConcorrenteCabecalhoLinha(concorrente), ...formatConcorrenteDetalheFinanceiroTexto(concorrente)];
}

/** @deprecated Use renderConcorrenteDetalheTextoLinhas */
export function formatConcorrenteLinhaPrincipal(concorrente) {
  return renderConcorrenteDetalheTextoLinhas(concorrente).join("\n");
}

/**
 * @param {ReturnType<typeof buildConcorrenciaShareReportSections>["detalhesProdutos"]} detalhes
 */
export function renderDetalhamentoConcorrentesTexto(detalhes) {
  const linhas = [];
  const list = Array.isArray(detalhes) ? detalhes : [];
  if (list.length === 0) return linhas;

  for (const prod of list) {
    linhas.push("");
    linhas.push(String(prod.nome ?? "Sem nome"));
    linhas.push(formatProdutoMetaLinha(prod));
    const concorrentes = Array.isArray(prod.concorrentes) ? prod.concorrentes : [];
    if (concorrentes.length === 0) {
      linhas.push("Sem concorrentes cadastrados.");
      continue;
    }
    for (const c of concorrentes) {
      linhas.push("");
      linhas.push(...renderConcorrenteDetalheTextoLinhas(c));
    }
  }
  return linhas;
}

/** @deprecated Use renderDetalhamentoConcorrentesTexto */
export const renderDetalhamentoProdutosTexto = renderDetalhamentoConcorrentesTexto;

/**
 * Texto do card executivo — mesma estrutura visual do PDF (página 1).
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
export function renderConcorrenciaShareExecutiveCardText(payload) {
  const sections = buildConcorrenciaShareReportSections(payload);
  if (!sections) return "";
  return renderConcorrenciaShareExecutiveCardTextFromSections(payload, sections);
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 * @param {NonNullable<ReturnType<typeof buildConcorrenciaShareReportSections>>} sections
 */
export function renderConcorrenciaShareExecutiveCardTextFromSections(payload, sections) {
  const { kpis, operacionais } = buildConcorrenciaShareExecBlocos(payload.resumoExecutivo);

  const linhas = [
    "Suse7 Precifica",
    "Relatório de Concorrência",
    "Inteligência Competitiva",
    "",
    `Conta: ${sections.cabecalho.conta}`,
    `Produtos: ${sections.cabecalho.produtos}`,
  ];

  if (sections.mostrarDistribuicao) {
    linhas.push("", "Distribuição por conta", "");
    for (const conta of sections.distribuicaoPorConta) {
      linhas.push(formatLinhaDistribuicaoConta(conta.conta, conta.quantidadeLabel));
    }
  }

  linhas.push("", "Resumo executivo", "");
  for (const kpi of kpis) {
    linhas.push(`${kpi.label}: ${kpi.value}`);
  }
  linhas.push("");
  for (const op of operacionais) {
    linhas.push(`${op.label}: ${op.value}`);
  }
  linhas.push("", "Gerado por Suse7 Precifica", "Inteligência Competitiva");

  return linhas.join("\n").trim();
}

/**
 * Texto do detalhamento — mesma estrutura do PDF (página 2+).
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
export function renderConcorrenciaShareDetalheCopyText(payload) {
  const sections = buildConcorrenciaShareReportSections(payload);
  if (!sections?.detalhesProdutos?.length) return "";

  const linhas = [
    "",
    "",
    CONCORRENCIA_SHARE_SEPARADOR,
    "",
    CONCORRENCIA_DETALHE_SECAO_TITULO,
    ...renderDetalhamentoConcorrentesTexto(sections.detalhesProdutos),
  ];
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Relatório completo para fallback textual (card + detalhamento).
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload>} payload
 */
export function renderConcorrenciaShareFullCopyText(payload) {
  const card = renderConcorrenciaShareExecutiveCardText(payload);
  const detalhe = renderConcorrenciaShareDetalheCopyText(payload);
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
