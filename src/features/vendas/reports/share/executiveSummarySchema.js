/**
 * Contrato unificado do Resumo Executivo (Vendas/Notificação).
 * Mantém somente dados já consolidados no payload compartilhado.
 */

/**
 * @param {number | string | null | undefined} value
 */
function toCount(value) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {number} count
 */
function vendasCountLabel(count) {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? "venda" : "vendas"}`;
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 */
export function buildVendasExecutiveSummarySchema(payload) {
  const resumo = payload?.resumoExecutivo ?? {};
  const saudaveisValor = resumo?.saudaveis?.valor;
  const saudaveisIndisponivel = saudaveisValor == null;

  const margemCriticaValor = toCount(resumo?.margemCritica?.valor);
  const prejuizoValor = toCount(resumo?.prejuizo?.valor);
  const saudaveisCount = saudaveisIndisponivel ? 0 : toCount(saudaveisValor);
  const custos = Array.isArray(resumo?.custos) ? resumo.custos : [];

  return {
    versao: 1,
    secoes: [
      {
        id: "vendas",
        titulo: "Vendas",
        itens: [
          { id: "faturamento", rotulo: "Faturamento", valor: resumo?.faturamento?.display ?? "—" },
          { id: "pedidos", rotulo: "Pedidos", valor: resumo?.pedidos?.label ?? "0" },
          { id: "ticketMedio", rotulo: "Ticket médio", valor: resumo?.ticketMedio?.display ?? "R$ 0,00" },
          {
            id: "saudaveis",
            rotulo: "Saudáveis",
            valor: saudaveisIndisponivel ? "—" : vendasCountLabel(saudaveisCount),
            indisponivel: saudaveisIndisponivel,
          },
        ],
      },
      {
        id: "resultado",
        titulo: "Resultado",
        itens: [
          { id: "lucro", rotulo: "Lucro", valor: resumo?.lucroLiquido?.display ?? "—" },
          {
            id: "repasseMarketplace",
            rotulo: "Repasse Marketplace",
            valor: resumo?.repasseMarketplace?.display ?? "R$ 0,00",
          },
          {
            id: "margem",
            rotulo: "Margem",
            valor: resumo?.margem?.display ?? "—",
            indisponivel: resumo?.margem?.raw == null,
          },
        ],
      },
      {
        id: "custos",
        titulo: "Custos",
        itens: custos.map((custo) => ({
          id: custo.id,
          rotulo: custo.label,
          valor: custo.display,
          percentual: custo.sharePercent,
        })),
      },
    ],
    metricasUi: {
      revenueValue: resumo?.faturamento?.display ?? "—",
      netProfitValue: resumo?.lucroLiquido?.display ?? "—",
      marginValue: resumo?.margem?.display ?? "—",
      marginUnavailable: resumo?.margem?.raw == null,
      healthyCount: saudaveisCount,
      healthyUnavailable: saudaveisIndisponivel,
      healthyValue: saudaveisIndisponivel ? "—" : undefined,
      lowMarginCount: margemCriticaValor,
      negativeCount: prejuizoValor,
      loading: false,
      empty: false,
      error: null,
    },
  };
}

