import { ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE } from "./notificationRoutingCatalog";

export const NOTIFICATION_CHANNELS = {
  app: "app",
  email: "email",
  whatsapp: "whatsapp",
};

export const NOTIFICATION_PRIORITIES = {
  critical: "critical",
  important: "important",
  medium: "medium",
  info: "info",
};

export const NOTIFICATION_CATEGORIES = {
  salesProfit: "sales_profit",
  productsStock: "products_stock",
  marketplace: "marketplace",
  accountHealth: "account_health",
};

export const NOTIFICATION_CATEGORY_VIEWS = {
  sales: "sales",
  products: "products",
  marketplace: "marketplace",
  health: "health",
};

export const NOTIFICATION_CATEGORY_TABS = [
  { key: NOTIFICATION_CATEGORY_VIEWS.sales, label: "Vendas e lucro", category: NOTIFICATION_CATEGORIES.salesProfit },
  {
    key: NOTIFICATION_CATEGORY_VIEWS.products,
    label: "Produtos e estoque",
    category: NOTIFICATION_CATEGORIES.productsStock,
  },
  {
    key: NOTIFICATION_CATEGORY_VIEWS.marketplace,
    label: "Anúncios e marketplace",
    category: NOTIFICATION_CATEGORIES.marketplace,
  },
  {
    key: NOTIFICATION_CATEGORY_VIEWS.health,
    label: "Saúde da conta e operação",
    category: NOTIFICATION_CATEGORIES.accountHealth,
  },
];

export const POPUP_ALERTS_CATEGORY_VIEWS = {
  sales: "sales",
  products: "products",
  marketplace: "marketplace",
  health: "health",
};

export const POPUP_ALERTS_CATEGORY_TABS = [
  { key: POPUP_ALERTS_CATEGORY_VIEWS.sales, label: "Vendas e lucro", category: NOTIFICATION_CATEGORIES.salesProfit },
  {
    key: POPUP_ALERTS_CATEGORY_VIEWS.products,
    label: "Produtos e estoque",
    category: NOTIFICATION_CATEGORIES.productsStock,
  },
  {
    key: POPUP_ALERTS_CATEGORY_VIEWS.marketplace,
    label: "Anúncios e marketplace",
    category: NOTIFICATION_CATEGORIES.marketplace,
  },
  {
    key: POPUP_ALERTS_CATEGORY_VIEWS.health,
    label: "Saúde da conta e operação",
    category: NOTIFICATION_CATEGORIES.accountHealth,
  },
];

export const NOTIFICATION_TYPES = {
  LOW_STOCK: "LOW_STOCK",
  MIN_STOCK: "MIN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  NEGATIVE_SALE: "NEGATIVE_SALE",
  LOW_MARGIN_SALE: "LOW_MARGIN_SALE",
  DAILY_SALES_SUMMARY: "DAILY_SALES_SUMMARY",
  PAUSED_PRODUCT_WITH_RECENT_SALES: "PAUSED_PRODUCT_WITH_RECENT_SALES",
  PAUSED_PRODUCT_WITHOUT_RECENT_SALES: "PAUSED_PRODUCT_WITHOUT_RECENT_SALES",
  MARKETPLACE_PRICE_CHANGED: "MARKETPLACE_PRICE_CHANGED",
  MARKETPLACE_FEE_CHANGED: "MARKETPLACE_FEE_CHANGED",
  MARKETPLACE_SHIPPING_CHANGED: "MARKETPLACE_SHIPPING_CHANGED",
  LISTING_COMPETITIVENESS_LOST: "LISTING_COMPETITIVENESS_LOST",
  LISTING_OPPORTUNITY_FOUND: "LISTING_OPPORTUNITY_FOUND",
  SALES_DROP: "SALES_DROP",
  INACTIVE_PRODUCT: "INACTIVE_PRODUCT",
  ACCOUNT_HEALTH_ALERT: "ACCOUNT_HEALTH_ALERT",
  LISTING_HEALTH_ALERT: "LISTING_HEALTH_ALERT",
};

export const NOTIFICATION_CATALOG = [
  {
    id: "sales-profit",
    title: "Vendas e lucro",
    category: NOTIFICATION_CATEGORIES.salesProfit,
    items: [
      {
        type: NOTIFICATION_TYPES.NEGATIVE_SALE,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.NEGATIVE_SALE,
        label: "Venda com prejuízo",
        description: "Quando o lucro líquido da venda for menor que R$ 0,00.",
        priority: NOTIFICATION_PRIORITIES.critical,
        tone: "danger",
      },
      {
        type: NOTIFICATION_TYPES.LOW_MARGIN_SALE,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.LOW_MARGIN_SALE,
        label: "Venda com margem baixa",
        description: "Quando a margem líquida da venda for menor que 5%.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.DAILY_SALES_SUMMARY,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.DAILY_SALES_SUMMARY,
        label: "Resumo diário de vendas",
        description:
          "Resumo no fim do dia com total vendido, lucro total, margem média, quantidade de vendas e produtos mais vendidos.",
        priority: NOTIFICATION_PRIORITIES.info,
        tone: "neutral",
        future: true,
      },
    ],
  },
  {
    id: "products-stock",
    title: "Produtos e estoque",
    category: NOTIFICATION_CATEGORIES.productsStock,
    items: [
      {
        type: NOTIFICATION_TYPES.LOW_STOCK,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.LOW_STOCK,
        label: "Estoque baixo",
        description: "Produto com estoque abaixo do nível configurado.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.MIN_STOCK,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.MIN_STOCK,
        label: "Estoque abaixo do mínimo",
        description: "Produto abaixo do estoque mínimo definido pelo seller.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.OUT_OF_STOCK,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.OUT_OF_STOCK,
        label: "Estoque zerado",
        description: "Produto sem estoque disponível.",
        priority: NOTIFICATION_PRIORITIES.critical,
        tone: "danger",
      },
      {
        type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITH_RECENT_SALES,
        label: "Produto pausado com vendas recentes",
        description: "Produto pausado com vendas recentes ou boa performance.",
        priority: NOTIFICATION_PRIORITIES.critical,
        tone: "danger",
      },
      {
        type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITHOUT_RECENT_SALES,
        label: "Produto pausado sem vendas recentes",
        description: "Produto pausado sem vendas recentes relevantes.",
        priority: NOTIFICATION_PRIORITIES.medium,
        tone: "neutral",
      },
    ],
  },
  {
    id: "marketplace",
    title: "Anúncios e marketplace",
    category: NOTIFICATION_CATEGORIES.marketplace,
    items: [
      {
        type: NOTIFICATION_TYPES.MARKETPLACE_PRICE_CHANGED,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.MARKETPLACE_PRICE_CHANGED,
        label: "Alteração de preço no marketplace",
        description: "Preço atual mudou em relação ao último snapshot salvo.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.MARKETPLACE_FEE_CHANGED,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.MARKETPLACE_FEE_CHANGED,
        label: "Alteração de comissão/tarifa",
        description: "Tarifa de venda/comissão mudou versus o snapshot anterior.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.MARKETPLACE_SHIPPING_CHANGED,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.MARKETPLACE_SHIPPING_CHANGED,
        label: "Alteração de frete",
        description: "Custo de frete do seller mudou versus o snapshot anterior.",
        priority: NOTIFICATION_PRIORITIES.important,
        tone: "warning",
      },
      {
        type: NOTIFICATION_TYPES.LISTING_COMPETITIVENESS_LOST,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.LISTING_COMPETITIVENESS_LOST,
        label: "Anúncio com perda de competitividade",
        description: "Quando o anúncio perder posição, relevância ou competitividade.",
        priority: NOTIFICATION_PRIORITIES.medium,
        tone: "neutral",
        future: true,
      },
      {
        type: NOTIFICATION_TYPES.LISTING_OPPORTUNITY_FOUND,
        routingKey: ROUTING_KEY_BY_LEGACY_NOTIFICATION_TYPE.LISTING_OPPORTUNITY_FOUND,
        label: "Anúncio com melhoria de oportunidade",
        description: "Quando houver potencial de melhorar margem ou preço.",
        priority: NOTIFICATION_PRIORITIES.info,
        tone: "neutral",
        future: true,
      },
    ],
  },
  {
    id: "account-health",
    title: "Saúde da conta e operação",
    category: NOTIFICATION_CATEGORIES.accountHealth,
    items: [
      {
        type: NOTIFICATION_TYPES.SALES_DROP,
        label: "Queda brusca de vendas",
        description: "Vendas caíram muito em comparação com a média histórica.",
        priority: NOTIFICATION_PRIORITIES.critical,
        tone: "danger",
      },
      {
        type: NOTIFICATION_TYPES.INACTIVE_PRODUCT,
        label: "Produto parado",
        description: "Produto ativo, com estoque, mas sem vendas há X dias.",
        priority: NOTIFICATION_PRIORITIES.medium,
        tone: "neutral",
      },
      {
        type: NOTIFICATION_TYPES.ACCOUNT_HEALTH_ALERT,
        label: "Alerta de saúde da conta",
        description: "Futuro vínculo com métricas de saúde no marketplace.",
        priority: NOTIFICATION_PRIORITIES.info,
        tone: "neutral",
        future: true,
      },
      {
        type: NOTIFICATION_TYPES.LISTING_HEALTH_ALERT,
        label: "Alerta de saúde do anúncio",
        description: "Futuro vínculo com exposição, visitas, conversão e reputação.",
        priority: NOTIFICATION_PRIORITIES.info,
        tone: "neutral",
        future: true,
      },
    ],
  },
];

export const NOTIFICATION_CATALOG_LOOKUP = NOTIFICATION_CATALOG.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.category }))
).reduce((acc, item) => {
  acc[item.type] = item;
  return acc;
}, {});

export const NOTIFICATION_CATALOG_BY_VIEW = NOTIFICATION_CATEGORY_TABS.reduce((acc, tab) => {
  const group = NOTIFICATION_CATALOG.find((item) => item.category === tab.category) ?? null;
  acc[tab.key] = group;
  return acc;
}, {});

export const POPUP_ALERTS_CATALOG = [
  {
    id: "popup-sales-profit",
    title: "Vendas e lucro",
    category: NOTIFICATION_CATEGORIES.salesProfit,
    items: [
      {
        key: "LOSS_CONFIRM_BEFORE_DISMISS",
        label: "Confirmação de prejuízo",
        description: "Exibe confirmação antes de dispensar alertas de venda com prejuízo.",
      },
      {
        key: "LOW_MARGIN_CONTEXT_HINT",
        label: "Dica de margem baixa",
        description: "Mostra lembrete contextual para revisar preços quando a margem estiver baixa.",
      },
    ],
  },
  {
    id: "popup-products-stock",
    title: "Produtos e estoque",
    category: NOTIFICATION_CATEGORIES.productsStock,
    items: [
      {
        key: "STOCK_ZERO_ACTION_HINT",
        label: "Ação para estoque zerado",
        description: "Mostra pop-up com ação rápida ao detectar estoque zerado.",
      },
      {
        key: "STOCK_MIN_REVIEW_REMINDER",
        label: "Lembrete de estoque mínimo",
        description: "Exibe lembrete para revisar mínimo configurado em produtos críticos.",
      },
    ],
  },
  {
    id: "popup-marketplace",
    title: "Anúncios e marketplace",
    category: NOTIFICATION_CATEGORIES.marketplace,
    items: [
      {
        key: "PRICE_CHANGE_CONTEXT_ALERT",
        label: "Alerta de alteração de preço",
        description: "Exibe pop-up contextual ao detectar mudança de preço no marketplace.",
      },
      {
        key: "FEE_SHIPPING_REVIEW_MODAL",
        label: "Revisão de tarifa e frete",
        description: "Mostra aviso para revisar tarifa e frete quando houver variação relevante.",
      },
    ],
  },
  {
    id: "popup-account-health",
    title: "Saúde da conta e operação",
    category: NOTIFICATION_CATEGORIES.accountHealth,
    items: [
      {
        key: "SALES_DROP_RECOVERY_GUIDE",
        label: "Guia para queda de vendas",
        description: "Exibe guia rápido com próximos passos quando houver queda brusca de vendas.",
      },
      {
        key: "ACCOUNT_HEALTH_CHECKLIST",
        label: "Checklist de saúde da conta",
        description: "Mostra checklist operacional para manter conta e anúncios saudáveis.",
      },
    ],
  },
];

export const POPUP_ALERTS_CATALOG_BY_VIEW = POPUP_ALERTS_CATEGORY_TABS.reduce((acc, tab) => {
  const group = POPUP_ALERTS_CATALOG.find((item) => item.category === tab.category) ?? null;
  acc[tab.key] = group;
  return acc;
}, {});

