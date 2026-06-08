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

  linhas.push("RELATÓRIO DE VENDAS");
  linhas.push("");
  linhas.push(`Período: ${payload.periodo.label}`);
  linhas.push(`Conta: ${payload.contas.label}`);
  linhas.push(`Vendas: ${payload.quantidadeVendas.label}`);

  if (payload.mostrarDistribuicao && payload.distribuicaoPorConta.length > 0) {
    linhas.push("");
    linhas.push("Distribuição por conta:");
    for (const conta of payload.distribuicaoPorConta) {
      linhas.push(`• ${conta.conta} — ${conta.quantidadeLabel}`);
    }
  }

  const r = payload.resumoExecutivo;
  linhas.push("");
  linhas.push("Resumo Executivo");
  linhas.push(`Faturamento: ${r.faturamento.display}`);
  linhas.push(`Lucro: ${r.lucroLiquido.display}`);
  linhas.push(`Margem: ${r.margem.display}`);
  linhas.push(`Saudáveis: ${r.saudaveis ? r.saudaveis.label : "—"}`);
  linhas.push(`Margem crítica: ${r.margemCritica.label}`);
  linhas.push(`Prejuízo: ${r.prejuizo.label}`);

  return linhas.join("\n");
}
