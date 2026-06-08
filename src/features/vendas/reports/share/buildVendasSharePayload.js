// ======================================================================
// Contrato ÚNICO de compartilhamento do Relatório de Vendas (P_2.8.12F.A).
//
// Fonte de verdade única consumida por TODOS os canais (Copiar, WhatsApp,
// E-mail, PDF, Excel). Cada canal apenas renderiza este payload no formato
// que precisa — nenhum canal monta o próprio conteúdo a partir do zero.
//
// PRINCÍPIOS
// - Deriva EXCLUSIVAMENTE do contrato agregado já existente
//   (buildVendasAggregatedReport). Não recalcula nada, não chama backend.
// - Mantém os valores crus (strings decimais) e adiciona apenas a versão
//   de exibição (pt-BR) usando os formatadores oficiais do Raio-X.
// - Preparado para múltiplas contas/CNPJs (campos em lista).
// ======================================================================

import {
  formatBrlApi,
  formatPercentDetailLabel,
  DASH,
} from "../../../../components/sales/saleRayxFormat.js";

/**
 * @param {number | string | null | undefined} value
 * @returns {number}
 */
function toCount(value) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {number} count
 * @returns {string} ex.: "163 vendas" · "1 venda"
 */
function vendasCountLabel(count) {
  const n = toCount(count);
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "venda" : "vendas"}`;
}

/**
 * @typedef {{
 *   titulo: string;
 *   escopo: "filters" | "selected";
 *   periodo: { label: string; dataInicial: string | null; dataFinal: string | null };
 *   contas: { lista: { id: string | null; label: string }[]; label: string };
 *   quantidadeVendas: { valor: number; label: string };
 *   distribuicaoPorConta: {
 *     contaId: string | null;
 *     conta: string;
 *     quantidadeVendas: number;
 *     quantidadeLabel: string;
 *   }[];
 *   mostrarDistribuicao: boolean;
 *   resumoExecutivo: {
 *     faturamento: { raw: string | null; display: string };
 *     lucroLiquido: { raw: string | null; display: string };
 *     margem: { raw: string | null; display: string };
 *     margemCritica: { valor: number; label: string };
 *     prejuizo: { valor: number; label: string };
 *     saudaveis: { valor: number; label: string } | null;
 *   };
 *   _meta: {
 *     versao: number | null;
 *     fonteResumo: string | null;
 *     analiseLimitada: boolean;
 *     geradoEm: string | null;
 *   };
 * }} VendasSharePayload
 */

/**
 * Gera o payload único de compartilhamento a partir do contrato agregado.
 *
 * @param {import("../buildVendasAggregatedReport.js").VendasAggregatedReport | null | undefined} report
 * @returns {VendasSharePayload | null}
 */
export function buildVendasSharePayload(report) {
  if (!report || typeof report !== "object") return null;

  const resumo = report.resumoExecutivo ?? {};
  const periodo = report.periodo ?? {};
  const filtros = report.filtros ?? {};
  const contasRaw = Array.isArray(filtros.contas) ? filtros.contas : [];
  const distRaw = Array.isArray(report.distribuicaoPorConta) ? report.distribuicaoPorConta : [];

  const quantidadeVendas = toCount(resumo.quantidadeVendas);

  const distribuicaoPorConta = distRaw.map((c) => {
    const qtd = toCount(c?.quantidadeVendas);
    return {
      contaId: c?.contaId ?? null,
      conta: String(c?.conta ?? "Conta não definida"),
      quantidadeVendas: qtd,
      quantidadeLabel: vendasCountLabel(qtd),
    };
  });

  const contas = contasRaw.map((c) => ({
    id: c?.id ?? null,
    label: String(c?.label ?? "—"),
  }));

  const margemDisplay = formatPercentDetailLabel(resumo.margemPercentual);

  return {
    titulo: "Relatório de Vendas",
    escopo: report.escopo === "selected" ? "selected" : "filters",
    periodo: {
      label: String(periodo.label ?? "Período"),
      dataInicial: periodo.dataInicial ?? null,
      dataFinal: periodo.dataFinal ?? null,
    },
    contas: {
      lista: contas,
      label: contas.length ? contas.map((c) => c.label).join(", ") : "Todas as contas",
    },
    quantidadeVendas: {
      valor: quantidadeVendas,
      label: quantidadeVendas.toLocaleString("pt-BR"),
    },
    distribuicaoPorConta,
    // Mesma regra de exibição do modal (P_2.8.12E): só faz sentido com 2+ contas.
    mostrarDistribuicao: distribuicaoPorConta.length > 1,
    resumoExecutivo: {
      faturamento: {
        raw: resumo.faturamentoBruto ?? null,
        display: formatBrlApi(resumo.faturamentoBruto),
      },
      lucroLiquido: {
        raw: resumo.lucroLiquido ?? null,
        display: formatBrlApi(resumo.lucroLiquido),
      },
      margem: {
        raw: resumo.margemPercentual ?? null,
        display: margemDisplay ?? DASH,
      },
      margemCritica: {
        valor: toCount(resumo.vendasMargemCritica),
        label: vendasCountLabel(resumo.vendasMargemCritica),
      },
      prejuizo: {
        valor: toCount(resumo.vendasPrejuizo),
        label: vendasCountLabel(resumo.vendasPrejuizo),
      },
      saudaveis:
        resumo.vendasSaudaveis == null
          ? null
          : {
              valor: toCount(resumo.vendasSaudaveis),
              label: vendasCountLabel(resumo.vendasSaudaveis),
            },
    },
    _meta: {
      versao: report.versao ?? null,
      fonteResumo: report?._meta?.fonteResumo ?? null,
      analiseLimitada: Boolean(report?._meta?.analiseLimitada),
      geradoEm: report.geradoEm ?? null,
    },
  };
}
