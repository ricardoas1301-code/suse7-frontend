// ======================================================
// DB DIAGRAM REPOSITORY — MODEL LOCAL
// ------------------------------------------------------
// Guarda comandos, blocos, notas e trechos usados no
// dbdiagram.io. Local/mock nesta fase, formato preparado
// para futura persistência no Supabase
// (tabela: s7_db_diagram_snippets).
// ======================================================

/**
 * @typedef {"ativo" | "rascunho" | "arquivado"} DbDiagramStatus
 */

/**
 * @typedef {Object} DbDiagramEntry
 * @property {string} entry_id
 * @property {string} title       Título do bloco
 * @property {string} category    Categoria (ver DB_DIAGRAM_CATEGORIAS)
 * @property {string} content     Conteúdo (DBML / SQL / texto)
 * @property {string} notes       Observações livres
 * @property {DbDiagramStatus} status
 * @property {string} updated_at  ISO date
 */

/** Status oficiais de um snippet do repositório. */
export const DB_DIAGRAM_STATUS = Object.freeze({
  ATIVO: "ativo",
  RASCUNHO: "rascunho",
  ARQUIVADO: "arquivado",
});

const DB_DIAGRAM_STATUS_META = Object.freeze({
  [DB_DIAGRAM_STATUS.ATIVO]: { label: "Ativo", tone: "sucesso" },
  [DB_DIAGRAM_STATUS.RASCUNHO]: { label: "Rascunho", tone: "alerta" },
  [DB_DIAGRAM_STATUS.ARQUIVADO]: { label: "Arquivado", tone: "neutro" },
});

/**
 * @param {DbDiagramStatus} status
 * @returns {{ label: string; tone: string }}
 */
export function metaStatusDbDiagram(status) {
  return DB_DIAGRAM_STATUS_META[status] ?? { label: status, tone: "neutro" };
}

/** Categorias sugeridas para organizar os blocos do dbdiagram.io. */
export const DB_DIAGRAM_CATEGORIAS = Object.freeze([
  "Tabelas",
  "Relacionamentos",
  "Notes",
  "Blocos por domínio",
  "Multi-tenant",
  "Multi-marketplace",
  "Multi-CNPJ",
  "Histórico",
]);

const HOJE = "2026-06-01";

/**
 * Seed local de blocos do repositório.
 * @returns {DbDiagramEntry[]}
 */
export function listarBlocosDbDiagram() {
  return [
    {
      entry_id: "dbd_sales_orders",
      title: "Tabela sales_orders",
      category: "Tabelas",
      content:
        "Table sales_orders {\n  id uuid [pk]\n  seller_id uuid\n  marketplace varchar\n  customer_ingested_at timestamp\n  created_at timestamp\n}",
      notes: "Fonte da verdade da Página Vendas. Marcador de ingestão idempotente.",
      status: DB_DIAGRAM_STATUS.ATIVO,
      updated_at: HOJE,
    },
    {
      entry_id: "dbd_rel_customers",
      title: "Relacionamento vendas → clientes",
      category: "Relacionamentos",
      content:
        "Ref: sales_orders.id < marketplace_customers.last_order_id\nRef: sales_orders.id < s7_global_customers.last_order_id",
      notes: "Pipeline customerIngestionService alimenta seller e admin.",
      status: DB_DIAGRAM_STATUS.ATIVO,
      updated_at: HOJE,
    },
    {
      entry_id: "dbd_multi_cnpj",
      title: "Nota multi-CNPJ (futuro)",
      category: "Multi-CNPJ",
      content:
        "Note multi_cnpj {\n  'Estrutura preparada para múltiplos CNPJs por seller. Ainda não ativa.'\n}",
      notes: "Preservar arquitetura para suporte futuro multi-CNPJ.",
      status: DB_DIAGRAM_STATUS.RASCUNHO,
      updated_at: HOJE,
    },
  ];
}
