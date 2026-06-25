// ======================================================================
// Renderer de texto do resumo executivo (P_2.8.12F.B — canal Copiar).
//
// Consome o payload único (buildVendasSharePayload) e devolve o resumo
// textual padronizado para a área de transferência. Não acessa o contrato
// agregado diretamente — apenas o payload, garantindo fonte única.
// ======================================================================

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {string}
 */
export function renderVendasShareExecutiveText(payload) {
  if (!payload) return "";

  const linhas = [];
  const cabecalho = payload.cabecalhoExecutivo ?? {};
  const secoes = Array.isArray(payload.resumoExecutivoSchema?.secoes)
    ? payload.resumoExecutivoSchema.secoes
    : [];

  linhas.push("RELATÓRIO DE VENDAS");
  linhas.push("");
  linhas.push(`Período: ${cabecalho.periodo ?? payload.periodo.label}`);
  linhas.push(`Conta(s): ${cabecalho.contas ?? payload.contas.label}`);
  linhas.push(`Quantidade de vendas: ${cabecalho.vendas ?? payload.quantidadeVendas.label}`);
  linhas.push(`Filtros: ${cabecalho.filtros ?? "Nenhum filtro operacional ou busca adicional"}`);
  linhas.push("");
  linhas.push("Resumo Executivo");
  if (secoes.length > 0) {
    for (const secao of secoes) {
      linhas.push(`${secao.titulo}:`);
      const itens = Array.isArray(secao.itens) ? secao.itens : [];
      for (const item of itens) {
        const percentual = item.percentual ? ` (${item.percentual})` : "";
        linhas.push(`- ${item.rotulo}: ${item.valor ?? "—"}${percentual}`);
      }
    }
  } else {
    const r = payload.resumoExecutivo;
    linhas.push(`Faturamento: ${r.faturamento.display}`);
    linhas.push(`Lucro: ${r.lucroLiquido.display}`);
    linhas.push(`Margem: ${r.margem.display}`);
    linhas.push(`Pedidos: ${r.pedidos?.label ?? "0"}`);
    linhas.push(`Ticket médio: ${r.ticketMedio?.display ?? "R$ 0,00"}`);
    linhas.push(`Repasse Marketplace: ${r.repasseMarketplace?.display ?? "R$ 0,00"}`);
    linhas.push(`Saudáveis: ${r.saudaveis ? r.saudaveis.label : "—"}`);
    linhas.push(`Margem crítica: ${r.margemCritica.label}`);
    linhas.push(`Prejuízo: ${r.prejuizo.label}`);
  }

  return linhas.join("\n");
}
