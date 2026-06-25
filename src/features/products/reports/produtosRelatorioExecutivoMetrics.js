// ======================================================================
// Blocos do resumo executivo — Relatório de Produto.
// Cards (topo) + linhas operacionais (base), alinhado ao Relatório de Concorrência.
// ======================================================================

import { AlertTriangle, CheckCircle, ClipboardList, Eye, Package, TrendingDown } from "lucide-react";

/**
 * @param {{
 *   cadastroCompleto: { label: string };
 *   comAnunciosVinculados: { label: string };
 *   comHistoricoVendas: { label: string };
 *   saudavel: { label: string };
 *   cadastroPendente: { label: string };
 *   lucroPrejuizo: { label: string };
 * }} resumoExecutivo
 */
export function buildProdutosExecutivoBlocos(resumoExecutivo) {
  const cards = [
    {
      id: "cadastro-completo",
      label: "Cadastro completo",
      value: resumoExecutivo.cadastroCompleto.label,
      icon: CheckCircle,
      accent: "green",
    },
    {
      id: "com-anuncios",
      label: "Com anúncios vinculados",
      value: resumoExecutivo.comAnunciosVinculados.label,
      icon: Package,
      accent: "blue",
    },
    {
      id: "com-vendas",
      label: "Com histórico de vendas",
      value: resumoExecutivo.comHistoricoVendas.label,
      icon: Eye,
      accent: "gray",
    },
  ];

  const operacionais = [
    {
      id: "saudavel",
      label: "Saúde saudável",
      value: resumoExecutivo.saudavel.label,
      icon: ClipboardList,
      accent: "green",
    },
    {
      id: "cadastro-pendente",
      label: "Cadastro pendente",
      value: resumoExecutivo.cadastroPendente.label,
      icon: AlertTriangle,
      accent: "orange",
    },
    {
      id: "prejuizo",
      label: "Lucro em prejuízo",
      value: resumoExecutivo.lucroPrejuizo.label,
      icon: TrendingDown,
      accent: "gold",
    },
  ];

  return { cards, operacionais };
}
