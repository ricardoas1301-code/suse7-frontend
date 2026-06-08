// ======================================================
// DOCUMENTAÇÃO VIVA — MODEL LOCAL (Source Of Truth Center)
// ------------------------------------------------------
// Centraliza a estrutura de dados da documentação viva dos
// domínios do Suse7. Formato preparado para persistência no
// Supabase (devcenter_doc_domains / _sections / _items).
//
// S1_1.9C: cada domínio carrega uma ESTRUTURA OPERACIONAL
// padronizada (6 seções), tratada como parte do domínio.
// A normalização migra domínios antigos sem perder dados.
//
// REGRA: nenhum componente visual deve hardcodar conteúdo de
// domínio — tudo vem deste model/helpers.
// ======================================================

/**
 * @typedef {"rascunho" | "em_documentacao" | "em_revisao" | "homologado" | "futuro" | "arquivado"} DocDomainStatus
 */

/**
 * @typedef {Object} DocItem
 * @property {string} item_title    Título do campo/documento
 * @property {string} item_content  Conteúdo textual (pode ser multilinha)
 * @property {string} item_notes    Observações livres
 * @property {DocDomainStatus} item_status Status individual do item
 * @property {string} updated_at    ISO date da última atualização
 */

/**
 * @typedef {Object} DocSection
 * @property {string} section_id    Slug estável da seção
 * @property {string} section_title Rótulo exibido
 * @property {string} [section_hint] Texto auxiliar curto
 * @property {DocItem[]} items
 */

/**
 * @typedef {"mvp" | "beta" | "producao" | "legado"} DocMaturidade
 */

/**
 * @typedef {Object} DocDomain
 * @property {string} domain_id
 * @property {string} domain_name
 * @property {string} domain_slug
 * @property {DocDomainStatus} status
 * @property {string} description
 * @property {string} owner            Responsável documental (catálogo DOC_OWNERS)
 * @property {DocMaturidade} maturity  Maturidade documental
 * @property {string} next_review_at   Próxima revisão (YYYY-MM-DD) — vazio = sem data
 * @property {string} homologated_at   Data/hora da última homologação (ISO) — vazio = nunca
 * @property {string} homologated_by   Operador da última homologação
 * @property {string} last_operator    Último operador que alterou o domínio
 * @property {string} updated_at
 * @property {DocSection[]} sections
 */

// ------------------------------------------------------
// CATÁLOGO CENTRAL DE STATUS (S1_1.9A.4)
// Valores controlados — nenhum valor livre é permitido.
// ------------------------------------------------------

/** Status oficiais da documentação viva. */
export const DOC_STATUS = Object.freeze({
  RASCUNHO: "rascunho",
  EM_DOCUMENTACAO: "em_documentacao",
  EM_REVISAO: "em_revisao",
  HOMOLOGADO: "homologado",
  FUTURO: "futuro",
  ARQUIVADO: "arquivado",
});

/**
 * Catálogo ordenado (fonte única para selects e badges).
 * @type {ReadonlyArray<{ value: DocDomainStatus; label: string; tone: string }>}
 */
export const DOC_STATUS_CATALOGO = Object.freeze([
  { value: DOC_STATUS.RASCUNHO, label: "Rascunho", tone: "neutro" },
  { value: DOC_STATUS.EM_DOCUMENTACAO, label: "Em documentação", tone: "info" },
  { value: DOC_STATUS.EM_REVISAO, label: "Em revisão", tone: "alerta" },
  { value: DOC_STATUS.HOMOLOGADO, label: "Homologado", tone: "sucesso" },
  { value: DOC_STATUS.FUTURO, label: "Futuro", tone: "neutro" },
  { value: DOC_STATUS.ARQUIVADO, label: "Arquivado", tone: "neutro" },
]);

/**
 * Fluxo de homologação (S1_1.9A.7). Mudança manual — sem automação.
 * @type {ReadonlyArray<DocDomainStatus>}
 */
export const DOC_FLUXO_HOMOLOGACAO = Object.freeze([
  DOC_STATUS.RASCUNHO,
  DOC_STATUS.EM_DOCUMENTACAO,
  DOC_STATUS.EM_REVISAO,
  DOC_STATUS.HOMOLOGADO,
]);

/**
 * @param {DocDomainStatus} status
 * @returns {{ label: string; tone: string }}
 */
export function metaStatusDocumentacao(status) {
  const item = DOC_STATUS_CATALOGO.find((entry) => entry.value === status);
  return item ? { label: item.label, tone: item.tone } : { label: status, tone: "neutro" };
}

/**
 * Próxima etapa do fluxo de homologação (ou null se já no fim / fora do fluxo).
 * @param {DocDomainStatus} status
 * @returns {DocDomainStatus | null}
 */
export function proximaEtapaHomologacao(status) {
  const idx = DOC_FLUXO_HOMOLOGACAO.indexOf(status);
  if (idx === -1 || idx >= DOC_FLUXO_HOMOLOGACAO.length - 1) return null;
  return DOC_FLUXO_HOMOLOGACAO[idx + 1];
}

// ------------------------------------------------------
// OWNERSHIP DOCUMENTAL (S1_1.9B.1)
// ------------------------------------------------------

/** Responsáveis documentais disponíveis. */
export const DOC_OWNERS = Object.freeze(["Rico", "Pedro", "João", "Simão", "Time Suse7"]);

/** Owner padrão quando não definido. */
export const DOC_OWNER_PADRAO = "Time Suse7";

/**
 * Operador local padrão (S1_1.11A.4). No modo local existe um único operador;
 * no modo remoto, o backend registra o usuário autenticado real.
 * Arquitetura preparada para multi-admin.
 */
export const DOC_OPERADOR_LOCAL = "Rico";

// ------------------------------------------------------
// MATURIDADE DOCUMENTAL (S1_1.9B.3)
// ------------------------------------------------------

/** Maturidade documental oficial. */
export const DOC_MATURIDADE = Object.freeze({
  MVP: "mvp",
  BETA: "beta",
  PRODUCAO: "producao",
  LEGADO: "legado",
});

/**
 * @type {ReadonlyArray<{ value: DocMaturidade; label: string; tone: string }>}
 */
export const DOC_MATURIDADE_CATALOGO = Object.freeze([
  { value: DOC_MATURIDADE.MVP, label: "MVP", tone: "neutro" },
  { value: DOC_MATURIDADE.BETA, label: "Beta", tone: "info" },
  { value: DOC_MATURIDADE.PRODUCAO, label: "Produção", tone: "sucesso" },
  { value: DOC_MATURIDADE.LEGADO, label: "Legado", tone: "alerta" },
]);

/**
 * @param {DocMaturidade} maturidade
 * @returns {{ label: string; tone: string }}
 */
export function metaMaturidade(maturidade) {
  const item = DOC_MATURIDADE_CATALOGO.find((entry) => entry.value === maturidade);
  return item ? { label: item.label, tone: item.tone } : { label: "—", tone: "neutro" };
}

// ------------------------------------------------------
// ALERTAS DE REVISÃO (S1_1.9B.2 + S1_1.9B.7)
// ------------------------------------------------------

/** Estados possíveis da revisão documental. */
export const DOC_REVISAO_ESTADO = Object.freeze({
  SEM_DATA: "sem_data",
  EM_DIA: "em_dia",
  PROXIMA: "proxima",
  VENCIDA: "vencida",
});

/** Janela (em dias) em que a revisão é considerada "próxima". */
const DOC_REVISAO_JANELA_DIAS = 14;

/**
 * Situação da revisão de um domínio a partir da próxima revisão prevista.
 * Cálculo 100% local — sem chamadas externas.
 * @param {string} nextReviewAt YYYY-MM-DD (vazio = sem data)
 * @returns {{ estado: string; label: string; tone: string; dias: number | null }}
 */
export function situacaoRevisao(nextReviewAt) {
  if (!nextReviewAt) {
    return { estado: DOC_REVISAO_ESTADO.SEM_DATA, label: "Sem data", tone: "neutro", dias: null };
  }
  const alvo = new Date(`${nextReviewAt}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) {
    return { estado: DOC_REVISAO_ESTADO.SEM_DATA, label: "Sem data", tone: "neutro", dias: null };
  }
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);

  if (dias < 0) {
    return { estado: DOC_REVISAO_ESTADO.VENCIDA, label: "Revisão vencida", tone: "alerta", dias };
  }
  if (dias <= DOC_REVISAO_JANELA_DIAS) {
    return { estado: DOC_REVISAO_ESTADO.PROXIMA, label: "Revisão próxima", tone: "info", dias };
  }
  return { estado: DOC_REVISAO_ESTADO.EM_DIA, label: "Em dia", tone: "sucesso", dias };
}

// ------------------------------------------------------
// ESTRUTURA OPERACIONAL DOS DOMÍNIOS (S1_1.9C)
// 6 seções padronizadas. Cada seção define "campos mínimos"
// que nascem como itens editáveis (a preencher), em rascunho.
// ------------------------------------------------------

/**
 * Seções operacionais oficiais. Ordem fixa.
 * @type {ReadonlyArray<{ section_id: string; section_title: string; section_hint: string; campos: string[] }>}
 */
export const DOC_SECOES_OPERACIONAIS = Object.freeze([
  {
    section_id: "escopo_dominio",
    section_title: "Escopo do Domínio",
    section_hint: "O que esta página/domínio representa dentro do Suse7.",
    campos: [
      "Escopo",
      "Objetivo operacional",
      "Responsabilidade do domínio",
      "Limites do domínio",
      "O que este domínio NÃO cobre",
    ],
  },
  {
    section_id: "fonte_da_verdade",
    section_title: "Fonte da Verdade",
    section_hint: "Qual fonte manda em cada informação (marketplace = sync, Suse7 = memória).",
    campos: [
      "Fonte primária",
      "Fontes auxiliares",
      "Dados live",
      "Dados snapshot",
      "Observações sobre origem dos dados",
    ],
  },
  {
    section_id: "estrutura_dados",
    section_title: "Estrutura de Dados",
    section_hint: "Tabelas, endpoints, APIs e campos que sustentam o domínio.",
    campos: [
      "Tabelas relacionadas",
      "APIs relacionadas",
      "Campos persistidos",
      "Campos derivados",
      "Dependências técnicas",
    ],
  },
  {
    section_id: "regras_operacionais",
    section_title: "Regras Operacionais",
    section_hint: "Regras de negócio. Cálculo financeiro sensível só no backend, com precisão decimal.",
    campos: [
      "Regras financeiras",
      "Regras de cálculo",
      "Regras de lucro",
      "Regras de margem",
      "Regras de ranking",
      "Regras de filtros",
      "Regras de sincronização",
      "Regras de consistência",
    ],
  },
  {
    section_id: "agrupamentos_operacionais",
    section_title: "Agrupamentos Operacionais",
    section_hint: "Chaves de agrupamento — preparado para multi-CNPJ / multi-conta / multi-marketplace.",
    campos: [
      "SKU",
      "Anúncio/Listing",
      "Pedido",
      "Conta marketplace",
      "Empresa/CNPJ",
      "Marketplace",
      "Cliente",
      "Produto",
    ],
  },
  {
    section_id: "decisoes_arquiteturais",
    section_title: "Decisões Arquiteturais",
    section_hint: "Memória técnica e operacional do domínio.",
    campos: [
      "Decisões tomadas",
      "Motivo da decisão",
      "Impacto técnico",
      "Impacto operacional",
      "Riscos conhecidos",
      "Pontos futuros",
    ],
  },
]);

/**
 * Mapa de migração: seções legadas (antes da S1_1.9C) → seção operacional.
 * Usado na normalização para reaproveitar conteúdo sem perder dados.
 */
const DOC_SECOES_LEGADO_MAP = Object.freeze({
  estrutura_dominio: "escopo_dominio",
  fonte_oficial_dados: "fonte_da_verdade",
  regras_calculo: "regras_operacionais",
  agrupamentos: "agrupamentos_operacionais",
  consistencia_operacional: "regras_operacionais",
  aprovacao_operacional: "decisoes_arquiteturais",
  atualizacao_arquitetural: "decisoes_arquiteturais",
});

/** Data de hoje em formato ISO curto (YYYY-MM-DD). */
export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Timestamp completo (ISO) — usado na trilha histórica/homologação. */
export function agoraISO() {
  return new Date().toISOString();
}

/** Item vazio padronizado (nasce em Rascunho). */
export function criarItemVazio() {
  return {
    item_title: "",
    item_content: "",
    item_notes: "",
    item_status: DOC_STATUS.RASCUNHO,
    updated_at: hojeISO(),
  };
}

/**
 * Cria as 6 seções operacionais com seus campos como itens.
 * @param {Record<string, Record<string, { content?: string; notes?: string; status?: DocDomainStatus }>>} [preenchidos]
 *   Conteúdo opcional por section_id → título do campo.
 * @returns {DocSection[]}
 */
export function criarSecoesTemplate(preenchidos = {}) {
  return DOC_SECOES_OPERACIONAIS.map((sec) => ({
    section_id: sec.section_id,
    section_title: sec.section_title,
    section_hint: sec.section_hint,
    items: sec.campos.map((campo) => {
      const fill = preenchidos?.[sec.section_id]?.[campo];
      return {
        item_title: campo,
        item_content: fill?.content ?? "",
        item_notes: fill?.notes ?? "",
        item_status: fill?.status ?? DOC_STATUS.RASCUNHO,
        updated_at: hojeISO(),
      };
    }),
  }));
}

const HOJE = "2026-06-01";

// Conteúdo já homologado da Página Vendas, encaixado nos campos operacionais.
const VENDAS_CONTEUDO = {
  escopo_dominio: {
    Escopo: {
      content: "Página de Vendas: lista consolidada de pedidos multi-marketplace com Raio-X por venda.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Objetivo operacional": {
      content: "Dar ao seller a visão fiel dos pedidos e da saúde comercial de cada venda.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Responsabilidade do domínio": {
      content:
        "Exibir pedidos, agrupamentos, filtros e o detalhe (Raio-X). Não recalcula finanças no frontend.",
      status: DOC_STATUS.HOMOLOGADO,
    },
  },
  fonte_da_verdade: {
    "Fonte primária": {
      content: "sales_orders + sales_order_items (pedidos e itens).",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Fontes auxiliares": {
      content: "marketplace_customers e s7_global_customers (pipeline de clientes).",
      status: DOC_STATUS.EM_DOCUMENTACAO,
    },
    "Observações sobre origem dos dados": {
      content:
        "Marketplace = fonte de sincronização do estado atual. Suse7 = memória histórica: persiste, versiona e analisa ao longo do tempo.",
      status: DOC_STATUS.HOMOLOGADO,
    },
  },
  estrutura_dados: {
    "Tabelas relacionadas": {
      content: "sales_orders, sales_order_items, marketplace_customers, s7_global_customers.",
      status: DOC_STATUS.HOMOLOGADO,
    },
  },
  regras_operacionais: {
    "Regras financeiras": {
      content:
        "Cálculo financeiro só no backend, com precisão decimal. Proibido float. Frontend apenas exibe valores tratados.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Regras de cálculo": {
      content: "Lucro, margem e totais calculados no backend.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Regras de consistência": {
      content:
        "Idempotência por sales_order.id: reprocessar não duplica agregados (write marca, read recomputa).",
      status: DOC_STATUS.HOMOLOGADO,
    },
  },
  agrupamentos_operacionais: {
    Pedido: {
      content: "Pedido (sales_order) é a unidade base da lista.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    Marketplace: {
      content: "Suporta múltiplos marketplaces; arquitetura preparada para multi-conta e multi-CNPJ.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Empresa/CNPJ": {
      content: "Estrutura preparada para multi-CNPJ (ainda não ativo).",
      status: DOC_STATUS.EM_DOCUMENTACAO,
    },
  },
  decisoes_arquiteturais: {
    "Decisões tomadas": {
      content:
        "Copy padronizado via S7CopyButton; a paleta neutra da lista de Vendas virou referência global.",
      status: DOC_STATUS.HOMOLOGADO,
    },
    "Motivo da decisão": {
      content: "Consistência de UX e manutenção mais simples em todo o sistema.",
      status: DOC_STATUS.HOMOLOGADO,
    },
  },
};

/**
 * Documentação viva — Página Vendas (domínio piloto, S1_1.9C.8).
 * Já nasce com a estrutura operacional completa.
 */
const DOMINIO_VENDAS = {
  domain_id: "dom_vendas",
  domain_name: "Página Vendas",
  domain_slug: "vendas",
  status: DOC_STATUS.HOMOLOGADO,
  description:
    "Primeiro domínio com Source Of Truth completa. Consolida pedidos de venda multi-marketplace com regras de cálculo no backend.",
  owner: "Rico",
  maturity: DOC_MATURIDADE.PRODUCAO,
  next_review_at: "2026-09-01",
  homologated_at: "2026-06-01T12:00:00.000Z",
  homologated_by: "Rico",
  last_operator: "Rico",
  updated_at: HOJE,
  sections: criarSecoesTemplate(VENDAS_CONTEUDO),
};

/**
 * Cria um domínio placeholder com a estrutura operacional padrão (campos a preencher).
 * @param {Object} [governanca] owner / maturity / next_review_at opcionais (demo do dashboard).
 */
function dominioPlaceholder(domain_id, domain_name, domain_slug, status, description, governanca = {}) {
  return {
    domain_id,
    domain_name,
    domain_slug,
    status,
    description,
    owner: governanca.owner ?? DOC_OWNER_PADRAO,
    maturity: governanca.maturity ?? DOC_MATURIDADE.MVP,
    next_review_at: governanca.next_review_at ?? "",
    updated_at: HOJE,
    sections: criarSecoesTemplate(),
  };
}

/** Slug simples e estável a partir de um nome. */
export function slugificar(nome) {
  return String(nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cria um novo domínio em modo RASCUNHO (S1_1.9A.6 + template S1_1.9C.7).
 * Nenhum domínio nasce homologado.
 */
export function criarDominioRascunho(domain_name, description = "") {
  const slug = slugificar(domain_name) || `dominio-${Date.now()}`;
  return {
    domain_id: `dom_${slug}_${Date.now()}`,
    domain_name,
    domain_slug: slug,
    status: DOC_STATUS.RASCUNHO,
    description,
    owner: DOC_OWNER_PADRAO,
    maturity: DOC_MATURIDADE.MVP,
    next_review_at: "",
    homologated_at: "",
    homologated_by: "",
    last_operator: DOC_OPERADOR_LOCAL,
    updated_at: hojeISO(),
    sections: criarSecoesTemplate(),
  };
}

/**
 * Normaliza um domínio garantindo a estrutura operacional completa (S1_1.9C).
 *
 * - Migra seções legadas para as operacionais (sem perder itens).
 * - Garante que as 6 seções operacionais existam (na ordem oficial).
 * - Seções sem itens nascem com os campos do template (a preencher).
 * - Seções customizadas desconhecidas são preservadas ao final.
 * - NÃO sobrescreve conteúdo já existente.
 *
 * Usado no seed, ao hidratar do localStorage e ao carregar do backend.
 */
export function normalizarDominio(dominio) {
  const base = {
    owner: DOC_OWNER_PADRAO,
    maturity: DOC_MATURIDADE.MVP,
    next_review_at: "",
    homologated_at: "",
    homologated_by: "",
    last_operator: "",
    ...dominio,
  };
  const incoming = Array.isArray(base.sections) ? base.sections : [];

  // Mapa canônico das seções operacionais (ordem fixa).
  const mapa = new Map();
  for (const sec of DOC_SECOES_OPERACIONAIS) {
    mapa.set(sec.section_id, {
      section_id: sec.section_id,
      section_title: sec.section_title,
      section_hint: sec.section_hint,
      items: [],
      _temItens: false,
      _db_id: undefined,
    });
  }
  const extras = [];

  for (const sec of incoming) {
    const itens = (sec.items ?? []).map((item) => ({ item_notes: "", ...item }));
    const key = mapa.has(sec.section_id)
      ? sec.section_id
      : DOC_SECOES_LEGADO_MAP[sec.section_id] ?? null;

    if (key && mapa.has(key)) {
      const alvo = mapa.get(key);
      // Match exato operacional: preserva db id / título / hint vindos do dado.
      if (sec.section_id === key) {
        if (sec.section_db_id) alvo._db_id = sec.section_db_id;
        if (sec.section_title) alvo.section_title = sec.section_title;
        if (sec.section_hint) alvo.section_hint = sec.section_hint;
      }
      if (itens.length > 0) {
        alvo.items.push(...itens);
        alvo._temItens = true;
      }
    } else {
      // Seção customizada desconhecida: preserva (não perder dados).
      extras.push({ ...sec, items: itens });
    }
  }

  const sections = [];
  for (const sec of DOC_SECOES_OPERACIONAIS) {
    const alvo = mapa.get(sec.section_id);
    let items = alvo.items;
    if (!alvo._temItens) {
      // Seção sem conteúdo migrado nasce com os campos do template (a preencher).
      items = sec.campos.map((campo) => ({
        item_title: campo,
        item_content: "",
        item_notes: "",
        item_status: DOC_STATUS.RASCUNHO,
        updated_at: hojeISO(),
      }));
    }
    const out = {
      section_id: alvo.section_id,
      section_title: alvo.section_title,
      section_hint: alvo.section_hint,
      items,
    };
    if (alvo._db_id) out.section_db_id = alvo._db_id;
    sections.push(out);
  }
  for (const ex of extras) sections.push(ex);

  return { ...base, sections };
}

/**
 * Seed local dos domínios da documentação viva.
 * Página Vendas aparece primeiro (homologado).
 * @returns {DocDomain[]}
 */
export function listarDominiosDocumentacao() {
  return [
    DOMINIO_VENDAS,
    dominioPlaceholder(
      "dom_precificacoes",
      "Precificações",
      "precificacoes",
      DOC_STATUS.EM_DOCUMENTACAO,
      "Inteligência de preços e Raio-X de precificação.",
      { owner: "Pedro", maturity: DOC_MATURIDADE.BETA, next_review_at: "2026-06-10" },
    ),
    dominioPlaceholder(
      "dom_produtos",
      "Produtos",
      "produtos",
      DOC_STATUS.RASCUNHO,
      "Catálogo de produtos e formulário de cadastro.",
      { owner: "João", maturity: DOC_MATURIDADE.MVP },
    ),
    dominioPlaceholder(
      "dom_anuncios",
      "Anúncios",
      "anuncios",
      DOC_STATUS.RASCUNHO,
      "Anúncios sincronizados com os marketplaces.",
      { owner: "Time Suse7", maturity: DOC_MATURIDADE.MVP, next_review_at: "2026-05-20" },
    ),
    dominioPlaceholder(
      "dom_clientes360",
      "Clientes 360",
      "clientes-360",
      DOC_STATUS.RASCUNHO,
      "Visão 360 dos compradores do seller.",
      { owner: "Simão", maturity: DOC_MATURIDADE.MVP },
    ),
    dominioPlaceholder(
      "dom_dashboard",
      "Dashboard",
      "dashboard",
      DOC_STATUS.FUTURO,
      "Painel consolidado de indicadores operacionais.",
      { owner: "Time Suse7", maturity: DOC_MATURIDADE.MVP },
    ),
    dominioPlaceholder(
      "dom_notificacoes",
      "Notificações",
      "notificacoes",
      DOC_STATUS.FUTURO,
      "Central de notificações e entrega multicanal.",
      { owner: "Time Suse7", maturity: DOC_MATURIDADE.MVP },
    ),
  ].map(normalizarDominio);
}

/**
 * @param {string} slug
 * @returns {DocDomain | undefined}
 */
export function obterDominioPorSlug(slug) {
  return listarDominiosDocumentacao().find((dominio) => dominio.domain_slug === slug);
}
