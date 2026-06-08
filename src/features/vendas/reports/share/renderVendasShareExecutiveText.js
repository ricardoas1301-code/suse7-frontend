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
  linhas.push("Período:");
  linhas.push(payload.periodo.label);
  linhas.push("");
  linhas.push("Conta:");
  linhas.push(payload.contas.label);
  linhas.push("");
  linhas.push("Vendas:");
  linhas.push(payload.quantidadeVendas.label);

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
  linhas.push("");
  linhas.push("Faturamento:");
  linhas.push(r.faturamento.display);
  linhas.push("");
  linhas.push("Lucro líquido:");
  linhas.push(r.lucroLiquido.display);
  linhas.push("");
  linhas.push("Margem:");
  linhas.push(r.margem.display);
  linhas.push("");
  linhas.push("Margem crítica:");
  linhas.push(r.margemCritica.label);
  linhas.push("");
  linhas.push("Prejuízo:");
  linhas.push(r.prejuizo.label);

  return linhas.join("\n");
}
