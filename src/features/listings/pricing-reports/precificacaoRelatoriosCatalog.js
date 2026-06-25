// ======================================================================
// Catálogo estrutural de relatórios — Precificação (S1.7)
// Somente metadados de UI. Sem consultas, exportação ou regras financeiras.
// ======================================================================

import { PRECIFICACAO_RELATORIO_STATUS } from "./precificacaoRelatoriosConstants.js";

/**
 * @typedef {{
 *   id: string;
 *   nome: string;
 *   descricao: string;
 *   icon: string;
 *   iconTone: string;
 *   status: import("./precificacaoRelatoriosConstants.js").PrecificacaoRelatorioStatusId;
 * }} PrecificacaoRelatorioDef
 */

/**
 * @typedef {{
 *   id: string;
 *   titulo: string;
 *   descricao: string;
 *   relatorios: PrecificacaoRelatorioDef[];
 * }} PrecificacaoRelatorioCategoria
 */

const STATUS_INICIAL = PRECIFICACAO_RELATORIO_STATUS.PREPARACAO;

/** @type {PrecificacaoRelatorioCategoria[]} */
export const PRECIFICACAO_RELATORIOS_CATEGORIAS = [
  {
    id: "lucratividade",
    titulo: "Relatórios de lucratividade",
    descricao: "Saúde financeira dos anúncios por lucro, margem e prejuízo.",
    relatorios: [
      {
        id: "mais_lucrativos",
        nome: "Produtos mais lucrativos",
        descricao: "Ranking dos anúncios com maior lucro absoluto no período.",
        icon: "catalog_filter_top_profit",
        iconTone: "success",
        status: STATUS_INICIAL,
      },
      {
        id: "menos_lucrativos",
        nome: "Produtos menos lucrativos",
        descricao: "Anúncios com menor contribuição de lucro — priorize revisão de preço e custo.",
        icon: "catalog_filter_declining",
        iconTone: "decline",
        status: STATUS_INICIAL,
      },
      {
        id: "prejuizo",
        nome: "Produtos com prejuízo",
        descricao: "Ofertas com margem ou lucro negativo que exigem correção imediata.",
        icon: "catalog_filter_loss",
        iconTone: "danger",
        status: STATUS_INICIAL,
      },
      {
        id: "margem_baixa",
        nome: "Produtos com margem baixa",
        descricao: "Margem abaixo do patamar saudável — risco de erosão no repasse.",
        icon: "catalog_filter_low_margin",
        iconTone: "warning",
        status: STATUS_INICIAL,
      },
      {
        id: "sem_lucro",
        nome: "Produtos sem lucro",
        descricao: "Anúncios sem contribuição positiva de lucro no recorte analisado.",
        icon: "catalog_filter_no_sales",
        iconTone: "slate",
        status: STATUS_INICIAL,
      },
    ],
  },
  {
    id: "oportunidade",
    titulo: "Relatórios de oportunidade",
    descricao: "Potencial de preço, promoção e recuperação financeira.",
    relatorios: [
      {
        id: "aumento_preco",
        nome: "Produtos com potencial de aumento de preço",
        descricao: "Margem confortável com espaço para reprecificação sem perder competitividade.",
        icon: "catalog_filter_opportunity",
        iconTone: "insight",
        status: STATUS_INICIAL,
      },
      {
        id: "margem_acima_meta",
        nome: "Produtos com margem acima da meta",
        descricao: "Ofertas acima do alvo de margem — validar elasticidade e volume.",
        icon: "catalog_filter_top_profit",
        iconTone: "success",
        status: STATUS_INICIAL,
      },
      {
        id: "oportunidade_promocao",
        nome: "Produtos com oportunidade de promoção",
        descricao: "Cenários em que campanha ou desconto estratégico pode acelerar giro.",
        icon: "catalog_filter_top_sales",
        iconTone: "fire",
        status: STATUS_INICIAL,
      },
      {
        id: "recuperacao_financeira",
        nome: "Produtos com oportunidade de recuperação financeira",
        descricao: "Combinações de custo, frete e comissão com espaço de recuperação.",
        icon: "catalog_filter_attention",
        iconTone: "warning",
        status: STATUS_INICIAL,
      },
    ],
  },
  {
    id: "cadastro",
    titulo: "Relatórios de cadastro",
    descricao: "Qualidade de dados de produto, SKU e custos para precificação confiável.",
    relatorios: [
      {
        id: "sem_custo",
        nome: "Produtos sem custo cadastrado",
        descricao: "Anúncios sem custo base — impossibilitam simulação fiel de margem.",
        icon: "records",
        iconTone: "warning",
        status: STATUS_INICIAL,
      },
      {
        id: "sem_sku",
        nome: "Produtos sem SKU",
        descricao: "Ofertas sem vínculo de SKU — risco operacional e de consolidação.",
        icon: "catalog_filter_attention",
        iconTone: "warning",
        status: STATUS_INICIAL,
      },
      {
        id: "cadastro_incompleto",
        nome: "Produtos com cadastro incompleto",
        descricao: "Campos essenciais ausentes para análise financeira completa.",
        icon: "info",
        iconTone: "neutral",
        status: STATUS_INICIAL,
      },
      {
        id: "pendente_analise",
        nome: "Produtos pendentes de análise",
        descricao: "Itens aguardando revisão manual ou sincronização de dados.",
        icon: "catalog_filter_new",
        iconTone: "slate",
        status: STATUS_INICIAL,
      },
    ],
  },
  {
    id: "marketplace",
    titulo: "Relatórios de marketplace",
    descricao: "Impacto de frete, comissão, taxas e repasse por canal.",
    relatorios: [
      {
        id: "frete_elevado",
        nome: "Frete elevado",
        descricao: "Anúncios em que o frete comprime margem ou repasse líquido.",
        icon: "monitoring",
        iconTone: "warning",
        status: STATUS_INICIAL,
      },
      {
        id: "comissao_elevada",
        nome: "Comissão elevada",
        descricao: "Ofertas com comissão do marketplace acima do patamar usual.",
        icon: "catalog_filter_mkt",
        iconTone: "mkp",
        status: STATUS_INICIAL,
      },
      {
        id: "maior_impacto_taxas",
        nome: "Produtos com maior impacto de taxas",
        descricao: "Ranking por peso relativo de taxas e encargos no resultado.",
        icon: "catalog_filter_loss",
        iconTone: "danger",
        status: STATUS_INICIAL,
      },
      {
        id: "menor_repasse",
        nome: "Produtos com menor repasse",
        descricao: "Menor valor líquido repassado ao seller após deduções do canal.",
        icon: "catalog_filter_declining",
        iconTone: "decline",
        status: STATUS_INICIAL,
      },
    ],
  },
  {
    id: "operacional",
    titulo: "Relatórios operacionais",
    descricao: "Giro, status de publicação e desempenho comercial dos anúncios.",
    relatorios: [
      {
        id: "mais_vendidos",
        nome: "Mais vendidos",
        descricao: "Ranking por volume de vendas no período selecionado.",
        icon: "catalog_filter_top_sales",
        iconTone: "fire",
        status: STATUS_INICIAL,
      },
      {
        id: "menos_vendidos",
        nome: "Menos vendidos",
        descricao: "Anúncios com baixo giro — candidatos a ajuste de preço ou campanha.",
        icon: "catalog_filter_declining",
        iconTone: "decline",
        status: STATUS_INICIAL,
      },
      {
        id: "sem_vendas",
        nome: "Sem vendas",
        descricao: "Ofertas sem vendas no recorte — investigar visibilidade e competitividade.",
        icon: "catalog_filter_no_sales",
        iconTone: "slate",
        status: STATUS_INICIAL,
      },
      {
        id: "ativos",
        nome: "Produtos ativos",
        descricao: "Anúncios publicados e ativos no marketplace.",
        icon: "catalog_filter_with_ads",
        iconTone: "success",
        status: STATUS_INICIAL,
      },
      {
        id: "pausados",
        nome: "Produtos pausados",
        descricao: "Ofertas pausadas ou inativas — impacto no mix e na receita.",
        icon: "catalog_filter_no_ads",
        iconTone: "neutral",
        status: STATUS_INICIAL,
      },
    ],
  },
];

/** Total de relatórios no catálogo estrutural (útil para estados vazios futuros). */
export function contarRelatoriosPrecificacao() {
  return PRECIFICACAO_RELATORIOS_CATEGORIAS.reduce((acc, cat) => acc + cat.relatorios.length, 0);
}
