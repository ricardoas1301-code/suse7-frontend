/** @typedef {'financeiro'|'integracao'|'precificacao'|'vendas'|'anuncios'|'bugs'|'melhorias'|'duvidas'} SellerTicketCategory */
/** @typedef {'aberto'|'em_atendimento'|'aguardando_seller'|'resolvido'|'fechado'} SellerTicketStatus */
/** @typedef {'baixa'|'media'|'alta'|'critica'} SellerTicketPriority */

export const TICKET_CATEGORIES = [
  { value: "financeiro", label: "Financeiro" },
  { value: "integracao", label: "Integração" },
  { value: "precificacao", label: "Precificação" },
  { value: "vendas", label: "Vendas" },
  { value: "anuncios", label: "Anúncios" },
  { value: "bugs", label: "Bugs" },
  { value: "melhorias", label: "Melhorias" },
  { value: "duvidas", label: "Dúvidas" },
];

export const TICKET_STATUSES = [
  { value: "aberto", label: "Aberto" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "aguardando_seller", label: "Aguardando seller" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

export const TICKET_PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export const TICKET_MARKETPLACES = [
  { value: "mercado_livre", label: "Mercado Livre" },
  { value: "shopee", label: "Shopee" },
  { value: "amazon", label: "Amazon" },
  { value: "geral", label: "Geral" },
];

export const TICKET_ASSIGNEES = [
  { value: "ricardo@suse7.com.br", label: "Ricardo" },
  { value: "neo@suse7.com.br", label: "Neo" },
  { value: "pedro@suse7.com.br", label: "Pedro" },
  { value: "nao_atribuido", label: "Não atribuído" },
];

/** @param {string} value @param {{ value: string; label: string }[]} list */
export function ticketLabel(value, list) {
  const hit = list.find((x) => x.value === value);
  return hit?.label ?? value ?? "—";
}
