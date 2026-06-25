// ======================================================================

// Resumo Diário — dados mock (DASH.3). Substituir por props reais na integração.

// DASH.6A: composição alinhada ao Resumo Diário executivo.

// ======================================================================



/** @typedef {{

 *   id: string;

 *   label: string;
 *   labelTip?: string;
 *   value: string;
 *   sharePercent?: string;
 *   tone?: "default" | "positive" | "warning" | "danger" | "money";

 * }} S7DailySummaryMetric */



/** @typedef {{

 *   id: string;

 *   title: string;

 *   columns?: 1 | 2;

 *   metrics: S7DailySummaryMetric[];

 * }} S7DailySummaryBlock */



/** @type {{

 *   title: string;

 *   lastUpdatedLabel: string;

 *   lastUpdatedAt: string;

 *   blocks: S7DailySummaryBlock[];

 * }} */

export const S7_DAILY_SUMMARY_MOCK = {

  title: "Resumo Diário",

  lastUpdatedLabel: "Última atualização",

  lastUpdatedAt: "Hoje às 13:30",

  blocks: [

    {

      id: "sales",

      title: "Vendas",

      columns: 2,

      metrics: [

        { id: "orders", label: "Pedidos", value: "24", tone: "warning" },

        { id: "revenue", label: "Faturamento", value: "R$ 12.480,00", tone: "positive" },

        { id: "avg_ticket", label: "Ticket Médio", value: "R$ 520,00", tone: "money" },

        { id: "highest_sale", label: "Maior Venda", value: "R$ 299,90", tone: "money" },

      ],

    },

    {

      id: "resultado",

      title: "Resultado",

      columns: 2,

      metrics: [

        { id: "net_profit", label: "Lucro (R$)", value: "R$ 3.140,00", tone: "positive" },

        { id: "avg_margin", label: "Lucro (%)", value: "25,2%", tone: "positive" },

        { id: "marketplace_payout", label: "Repasse Marketplace", value: "R$ 9.860,00", tone: "positive" },

        { id: "resultado_tbd", label: "A definir", value: "—", tone: "default" },

      ],

    },

    {

      id: "costs",

      title: "Custos",

      columns: 2,

      metrics: [
        { id: "product_cost", label: "Custo Produto", value: "-R$ 2.100,00", tone: "danger" },
        { id: "marketplace_fee", label: "Comissão Marketplace", value: "-R$ 1.820,00", tone: "danger" },
        { id: "shipping", label: "Frete", value: "-R$ 640,00", tone: "danger" },
        { id: "taxes", label: "Impostos", value: "-R$ 980,00", tone: "danger" },
        { id: "operation_packaging", label: "Operação + Embalagem", value: "-R$ 120,00", tone: "danger" },
        { id: "ml_ads", label: "ML Ads", labelTip: "Valor reservado para usar em Mercado Livre Ads.", value: "—", tone: "danger" },
        { id: "operational_costs", label: "Custos Operacionais", value: "—", tone: "danger" },
      ],

    },

  ],

};


