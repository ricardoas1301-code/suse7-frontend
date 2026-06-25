// ======================================================================
// S7 — Concorrência: formatação compartilhada (lista, modais)
// ======================================================================

export function formatPrice(value, currency = "BRL") {
  if (value == null || value === "") return "—";
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: currency || "BRL" });
}

export function displayCompetitorTitle(title) {
  const t = String(title || "").trim();
  return t || "Anúncio sem título disponível";
}

export function abbreviateCompetitorName(title, maxLen = 22) {
  const t = displayCompetitorTitle(title);
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(8, maxLen - 1)).trim()}…`;
}

export function formatSalesHint(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.trunc(n)} vendas`;
}

export function formatSalesCountShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.trunc(n)} vendas`;
}

/** Vendas do anúncio próprio — sempre exibe, inclusive zero. */
export function formatSalesCountProprio(value) {
  const n = Number(value);
  const count = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
  return `${count} vendas`;
}

/** Frete grátis no card de concorrente (mesma regra da aba Concorrentes da PI). */
export function isFreteGratisConcorrente(shipping) {
  if (!shipping || typeof shipping !== "object") return false;
  if (shipping.free_shipping === true) return true;
  const cost = shipping.cost ?? shipping.shipping_cost;
  if (cost != null && String(cost).trim() !== "") {
    const n = Number(String(cost).replace(",", "."));
    return Number.isFinite(n) && n === 0;
  }
  return false;
}

/** Converte preço bruto (API/string) em número positivo para exibição/comparativo. */
export function parsePrecoMonetario(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Rótulo de frete para o card padrão S7.
 * @returns {{ texto: string; tom: "gratis" | "pago" } | null}
 */
export function formatFreteConcorrenteLabel(shipping, currency = "BRL") {
  if (isFreteGratisConcorrente(shipping)) {
    return { texto: "Frete grátis", tom: "gratis" };
  }
  if (!shipping || typeof shipping !== "object") return null;
  const cost = shipping.cost ?? shipping.shipping_cost;
  if (cost == null || String(cost).trim() === "") return null;
  const n = Number(String(cost).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const valor = formatPrice(n, currency);
  if (valor === "—") return null;
  return { texto: `Frete ${valor}`, tom: "pago" };
}

/**
 * Comparativo visual nosso preço × concorrente (somente apresentação).
 * @returns {{ tipo: "acima" | "abaixo" | "equivalente" | "indisponivel"; rotulo: string | null; classe: string }}
 */
export function calcularComparativoPrecoConcorrente(precoNosso, precoConcorrente, currency = "BRL") {
  const nosso = parsePrecoMonetario(precoNosso);
  const deles = parsePrecoMonetario(precoConcorrente);
  if (nosso == null || deles == null) {
    return {
      tipo: "indisponivel",
      rotulo: null,
      classe: "s7-concorrente-card__compare--indisponivel",
    };
  }

  const diff = nosso - deles;
  const abs = Math.abs(diff);
  if (abs < 0.005) {
    return {
      tipo: "equivalente",
      rotulo: "Preço equivalente",
      classe: "s7-concorrente-card__compare--neutral",
    };
  }

  const diffFmt = abs.toLocaleString("pt-BR", { style: "currency", currency: currency || "BRL" });
  if (diff > 0) {
    return {
      tipo: "acima",
      rotulo: `↑ ${diffFmt} acima`,
      classe: "s7-concorrente-card__compare--acima",
    };
  }
  return {
    tipo: "abaixo",
    rotulo: `↓ ${diffFmt} abaixo`,
    classe: "s7-concorrente-card__compare--abaixo",
  };
}

const TIPOS_ANUNCIO_PREMIUM = new Set(["gold_special", "gold_pro", "gold_premium"]);
const TIPOS_ANUNCIO_CLASSICO = new Set(["gold", "classic", "bronze", "free"]);

/** Tipo de anúncio amigável para o seller (sem códigos técnicos ML). */
export function formatFriendlyListingType(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  if (TIPOS_ANUNCIO_PREMIUM.has(s) || s.includes("premium") || s.endsWith("_pro")) return "Premium";
  if (TIPOS_ANUNCIO_CLASSICO.has(s)) return "Clássico";
  if (s.startsWith("gold_")) return "Premium";
  return "Clássico";
}

export function formatListingType(value) {
  return formatFriendlyListingType(value);
}

export function formatPowerSeller(reputation) {
  const s = String(reputation?.power_seller_status || "").trim().toLowerCase();
  if (!s) return null;
  if (s === "platinum") return "MercadoLíder Platinum";
  if (s === "gold") return "MercadoLíder Gold";
  if (s === "silver") return "MercadoLíder";
  return null;
}

export function formatCapturedAt(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseIsoTimestamp(value) {
  if (!value) return null;
  const iso = String(value).trim();
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return { iso, ms };
}

export function pickCandidatePermalink(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  for (const key of ["competitor_permalink", "permalink", "url", "item_permalink"]) {
    const v = candidate[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

/** Conta ML do anúncio próprio (alias/nickname), quando disponível na API. */
export function extrairContaAnuncioProprio(ownListing) {
  if (!ownListing || typeof ownListing !== "object") return null;
  for (const key of [
    "account_alias",
    "account_name",
    "seller_nickname",
    "store_name",
    "nickname",
    "ml_account_alias",
  ]) {
    const raw = ownListing[key];
    const valor = raw != null ? String(raw).trim() : "";
    if (valor) return valor;
  }
  return null;
}

/** Tipo amigável do anúncio próprio (Premium / Clássico) para pill do card. */
export function extrairTipoAnuncioProprio(ownListing) {
  if (!ownListing || typeof ownListing !== "object") return null;
  for (const key of ["listing_type", "listing_type_id", "listingTypeLabel", "listing_type_label"]) {
    const rotulo = formatFriendlyListingType(ownListing[key]);
    if (rotulo) return rotulo;
  }
  return null;
}

/** ID do anúncio próprio (MLB…) para exibição e cópia no modal. */
export function extrairIdAnuncioProprio(ownListing) {
  if (!ownListing || typeof ownListing !== "object") return "";
  for (const key of ["listing_id", "own_listing_id", "external_listing_id", "item_id", "competitor_listing_id"]) {
    const raw = ownListing[key];
    const id = raw != null ? String(raw).trim() : "";
    if (id) return id;
  }
  return "";
}

/** Formata MLB123… para exibição e cópia (normaliza prefixo). */
export function formatarIdAnuncioMlbParaCopia(rawId) {
  const idCompleto = rawId != null ? String(rawId).trim() : "";
  if (!idCompleto) return "";
  const semPrefixo = idCompleto.replace(/^MLB\s*/i, "");
  return semPrefixo ? `MLB${semPrefixo.replace(/^MLB/i, "")}` : "";
}

/** MLB do concorrente cadastrado — exibição e cópia. */
export function extrairIdConcorrenteParaCopia(competitor) {
  return formatarIdAnuncioMlbParaCopia(competitor?.competitor_listing_id);
}

/** Link do anúncio próprio do seller (coluna own_listing / contexto do produto). */
export function resolverLinkAnuncioProprio(ownListing) {
  if (!ownListing || typeof ownListing !== "object") return null;
  const permalink = pickCandidatePermalink(ownListing);
  if (permalink) return permalink;
  for (const key of ["listing_id", "own_listing_id", "external_listing_id", "item_id", "competitor_listing_id"]) {
    const raw = ownListing[key];
    const id = raw != null ? String(raw).trim() : "";
    if (!id) continue;
    const m = id.match(/ML([ABCU])(\d{6,})/i);
    if (m) return `https://produto.mercadolivre.com.br/ML${m[1].toUpperCase()}-${m[2]}`;
  }
  return null;
}

export function resolveRegisteredCompetitorHref(competitor) {
  const permalink = pickCandidatePermalink(competitor);
  if (permalink) return permalink;
  const id = String(competitor?.competitor_listing_id || "").trim();
  const m = id.match(/ML([ABCU])(\d{6,})/i);
  if (m) return `https://produto.mercadolivre.com.br/ML${m[1].toUpperCase()}-${m[2]}`;
  return null;
}

export function pickCompetitorThumbnail(c) {
  if (!c || typeof c !== "object") return null;
  for (const key of ["competitor_thumbnail", "thumbnail", "picture_url"]) {
    const v = c[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  for (const arr of [c.competitor_pictures, c.pictures]) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const first = arr[0];
    if (typeof first === "string" && first.trim() !== "") return first.trim();
    if (first && typeof first === "object") {
      const url = first.secure_url || first.url;
      if (url != null && String(url).trim() !== "") return String(url).trim();
    }
  }
  return null;
}

/** Galeria do concorrente — ordem preservada; capa (thumbnail) sempre primeiro. */
export function pickCompetitorPictures(c) {
  if (!c || typeof c !== "object") return [];
  const urls = [];
  const seen = new Set();
  const push = (raw) => {
    const url = raw != null ? String(raw).trim() : "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };
  const appendFromArray = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const entry of arr) {
      if (typeof entry === "string") push(entry);
      else if (entry && typeof entry === "object") push(entry.secure_url || entry.url);
    }
  };

  const capa = pickCompetitorThumbnail(c);
  if (capa) push(capa);

  if (Array.isArray(c.competitor_pictures) && c.competitor_pictures.length > 0) {
    appendFromArray(c.competitor_pictures);
    return urls;
  }
  if (Array.isArray(c.pictures) && c.pictures.length > 0) {
    appendFromArray(c.pictures);
    return urls;
  }

  return urls;
}

export function pickCompetitorPrice(c) {
  if (!c || typeof c !== "object") return { value: null, currency: "BRL" };
  const currency = c.last_seen_currency || c.currency || "BRL";
  for (const key of ["last_seen_price", "competitor_price", "price"]) {
    const v = c[key];
    if (v != null && String(v).trim() !== "") return { value: v, currency };
  }
  return { value: null, currency };
}

export function pickCompetitorSellerName(c) {
  if (!c || typeof c !== "object") return null;
  for (const key of ["competitor_store_name", "competitor_seller_name", "seller_nickname", "store_name", "seller_name"]) {
    const v = c[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  const seller = c.seller;
  if (seller && typeof seller === "object") {
    for (const key of ["nickname", "nick_name"]) {
      const v = seller[key];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return null;
}

/** Normaliza quantidade de vendas a partir dos aliases do candidato/concorrente. */
export function pickSalesHint(c) {
  if (!c || typeof c !== "object") return null;
  for (const key of ["sales_hint", "sold_quantity", "sold_quantity_value", "total_sold", "sales"]) {
    const n = Number(c[key]);
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  const soldText = c.sold_quantity_text;
  if (soldText != null && String(soldText).trim() !== "") {
    const m = String(soldText).match(/(\d[\d.\s]*)/);
    if (m) {
      const n = Number(m[1].replace(/\./g, "").replace(/\s/g, ""));
      if (Number.isFinite(n) && n > 0) return Math.trunc(n);
    }
  }
  return null;
}

/** Cópia imutável do candidato no momento do clique (fila em lote). */
export function snapshotCandidatoParaFila(candidate) {
  const c = candidate && typeof candidate === "object" ? candidate : {};
  const priceInfo = pickCompetitorPrice(c);
  return {
    competitor_listing_id: c.competitor_listing_id,
    competitor_title: c.competitor_title ?? null,
    competitor_seller_id: c.competitor_seller_id ?? null,
    competitor_store_name: pickCompetitorSellerName(c),
    competitor_permalink: pickCandidatePermalink(c),
    competitor_thumbnail: pickCompetitorThumbnail(c),
    competitor_price: priceInfo.value,
    currency: priceInfo.currency,
    source_strategy: c.source_strategy ?? null,
    sales_hint: pickSalesHint(c),
    shipping: c.shipping && typeof c.shipping === "object" ? { ...c.shipping } : null,
    listing_type: c.listing_type ?? null,
    reputation: c.reputation && typeof c.reputation === "object" ? { ...c.reputation } : null,
    category_id: c.category_id ?? null,
    category_path: c.category_path ?? null,
    listing_updated_at: c.listing_updated_at ?? null,
  };
}

/** Mensagem neutra quando enrich ainda não trouxe todos os campos (sem citar ação manual). */
export const MENSAGEM_ENRICH_PARCIAL = "Dados complementares em atualização.";

export const MENSAGEM_ENRICH_FALHA = "Dados complementares em atualização.";

/** Monta payload de cadastro a partir de candidato discover/link (campos completos). */
export function candidateToSavePayload(candidate, product, options = {}) {
  const snap = snapshotCandidatoParaFila(candidate);
  const payload = {
    marketplace: "mercado_livre",
    sku: product?.sku ?? null,
    competitor_listing_id: snap.competitor_listing_id,
    competitor_title: snap.competitor_title,
    competitor_seller_id: snap.competitor_seller_id,
    competitor_store_name: snap.competitor_store_name,
    competitor_permalink: snap.competitor_permalink,
    competitor_thumbnail: snap.competitor_thumbnail,
    source_strategy: snap.source_strategy ?? "manual_placeholder",
    last_seen_price: snap.competitor_price ?? null,
    last_seen_currency: snap.currency ?? "BRL",
    sales_hint: snap.sales_hint,
    shipping: snap.shipping,
    listing_type: snap.listing_type,
    reputation: snap.reputation,
    category_id: snap.category_id ?? null,
    category_path: snap.category_path ?? null,
    listing_updated_at: snap.listing_updated_at ?? null,
  };
  const linkUrl = options?.linkUrl != null ? String(options.linkUrl).trim() : "";
  if (linkUrl) payload.link_url = linkUrl;
  return payload;
}

/** Rastreio ponta a ponta no frontend (lista/modal/card). */
export function logSalesFrontTrace(stage, competitor, extra = {}) {
  if (!import.meta.env.DEV) return;
  const c = competitor && typeof competitor === "object" ? competitor : {};
  const picked = pickSalesHint(c);
  console.info("[S7_COMPETITION_SALES_FRONT_TRACE]", {
    stage,
    competitor_id: c.id ?? null,
    item_id: c.competitor_listing_id ?? null,
    title: c.competitor_title ?? null,
    price: c.last_seen_price ?? c.competitor_price ?? null,
    sales_hint: c.sales_hint ?? null,
    sales_hint_source: c.sales_hint_source ?? null,
    sales_hint_confidence: c.sales_hint_confidence ?? null,
    pick_sales_hint_result: picked,
    will_show_sales: picked != null,
    ...extra,
  });
}

/** Auditoria DEV — rastreio de vendas por camada (sem dados sensíveis). */
export function logSalesAuditDev(stage, entity, layer = "frontend") {
  if (!import.meta.env.DEV) return;
  const e = entity && typeof entity === "object" ? entity : {};
  console.info("[S7_COMPETITION_SALES_AUDIT]", {
    stage,
    layer,
    item_id: e.competitor_listing_id ?? e.item_id ?? null,
    candidate_sales_hint: pickSalesHint(e),
    candidate_sold_quantity: e.sold_quantity ?? null,
    response_sales_hint: e.sales_hint ?? null,
    snapshot_sales_hint: e.snapshot_sales_hint ?? null,
  });
}

/** Log DEV seguro do payload de cadastro em lote. */
export function logBatchSavePayloadDev(payload) {
  if (!import.meta.env.DEV) return;
  const listingId = String(payload?.competitor_listing_id || "").trim();
  console.info("[S7_COMPETITION_BATCH_SAVE_PAYLOAD]", {
    item_id: listingId || null,
    has_title: Boolean(payload?.competitor_title),
    has_price: payload?.last_seen_price != null,
    has_thumbnail: Boolean(payload?.competitor_thumbnail),
    has_store_name: Boolean(payload?.competitor_store_name),
    has_sales_hint: payload?.sales_hint != null && Number(payload.sales_hint) > 0,
    has_shipping: Boolean(
      payload?.shipping?.free_shipping === true ||
        payload?.shipping?.mode ||
        payload?.shipping?.logistic_type
    ),
    has_listing_type: Boolean(payload?.listing_type),
    has_reputation: Boolean(
      payload?.reputation?.level_id || payload?.reputation?.power_seller_status
    ),
  });
}

/**
 * Linha compacta do concorrente.
 * Com vendas: "R$ 147,88 · 324 vendas". Sem sales_hint (null/zero): só "R$ 147,88".
 * Limitação ML: concorrentes costumam não ter sales_hint com token do seller logado.
 */
export function formatCompactPriceSales(price, sales, currency = "BRL", opts = {}) {
  const { incluirZeroVendas = false } = opts;
  const priceTxt = formatPrice(price, currency);
  const salesTxt = incluirZeroVendas
    ? formatSalesCountProprio(sales)
    : formatSalesCountShort(sales);
  if (priceTxt === "—" && !salesTxt) return "—";
  if (!salesTxt) return priceTxt;
  if (priceTxt === "—") return salesTxt;
  return `${priceTxt} · ${salesTxt}`;
}

const ROTULOS_NIVEL_REPUTACAO_ML = {
  "5_green": "Nível máximo (verde)",
  "4_light_green": "Bom (verde claro)",
  "3_yellow": "Médio (amarelo)",
  "2_orange": "Baixo (laranja)",
  "1_red": "Muito baixo (vermelho)",
};

const ROTULOS_STATUS_ANUNCIO_ML = {
  active: "Ativo",
  paused: "Pausado",
  closed: "Encerrado",
  inactive: "Inativo",
  under_review: "Em revisão",
  forbidden: "Indisponível",
  not_found: "Indisponível",
};

/** Status oficiais que exibem badge INATIVO (demais valores ausentes/desconhecidos = neutro). */
const STATUS_ANUNCIO_CONCORRENTE_INATIVO = new Set([
  "paused",
  "closed",
  "inactive",
  "not_found",
  "under_review",
  "forbidden",
  "unavailable",
]);

/** Indica se o anúncio concorrente está ativo no marketplace (contrato API). */
export function isConcorrenteAnuncioAtivo(competitor) {
  const c = competitor && typeof competitor === "object" ? competitor : {};
  const status =
    c.competitor_listing_status != null ? String(c.competitor_listing_status).trim().toLowerCase() : "";
  if (!status) return true;
  if (status === "active") return true;
  if (STATUS_ANUNCIO_CONCORRENTE_INATIVO.has(status)) return false;
  return true;
}

/** Rótulo do status oficial do anúncio (PT-BR). */
export function rotuloStatusAnuncioConcorrente(competitor) {
  const c = competitor && typeof competitor === "object" ? competitor : {};
  const label = c.competitor_listing_status_label;
  if (label != null && String(label).trim() !== "") return String(label).trim();
  const status =
    c.competitor_listing_status != null ? String(c.competitor_listing_status).trim().toLowerCase() : "";
  if (!status) return null;
  return ROTULOS_STATUS_ANUNCIO_ML[status] ?? status.replace(/_/g, " ");
}

/** Texto do painel de detalhe quando o anúncio não está ativo. */
export function rotuloStatusAnuncioDetalheConcorrente(competitor) {
  if (isConcorrenteAnuncioAtivo(competitor)) return null;
  const rotulo = rotuloStatusAnuncioConcorrente(competitor);
  if (!rotulo) return "Inativo no Mercado Livre";
  if (rotulo === "Indisponível" || rotulo === "Inativo") return `${rotulo} no Mercado Livre`;
  return rotulo;
}

/** Badge discreto para lista e cards de gerenciamento. */
export function rotuloBadgeAnuncioInativo(competitor) {
  if (isConcorrenteAnuncioAtivo(competitor)) return null;
  return "Inativo";
}

/** Produto com ao menos um concorrente com anúncio não ativo (campo oficial normalizado). */
export function produtoTemConcorrenteInativo(competitors) {
  const list = Array.isArray(competitors) ? competitors : [];
  return list.some((c) => !isConcorrenteAnuncioAtivo(c));
}

/** Marketplace amigável para exibição oficial. */
export function rotuloMarketplaceConcorrente(marketplace) {
  const key = String(marketplace || "mercado_livre").trim().toLowerCase();
  if (key === "mercado_livre" || key === "ml" || key === "mercadolivre") return "Mercado Livre";
  if (key === "shopee" || key === "shopping") return "Shopee";
  return null;
}

/** Nível de reputação oficial ML (level_id) — só exibe mapeamento conhecido. */
export function formatNivelReputacaoMl(reputation) {
  const level = String(reputation?.level_id || "").trim().toLowerCase();
  if (!level) return null;
  return ROTULOS_NIVEL_REPUTACAO_ML[level] ?? null;
}

/** Classe CSS do tom de reputação ML (verde / laranja / vermelho). */
export function resolverClasseCssReputacaoMl(reputation) {
  const level = String(reputation?.level_id || "").trim().toLowerCase();
  if (!level) return "";
  if (level === "5_green" || level === "4_light_green") {
    return "concorrencia-oficial-meta__valor--rep-verde";
  }
  if (level === "3_yellow") return "concorrencia-oficial-meta__valor--rep-amarelo";
  if (level === "2_orange") return "concorrencia-oficial-meta__valor--rep-laranja";
  if (level === "1_red") return "concorrencia-oficial-meta__valor--rep-vermelho";
  return "";
}

/** Vendas históricas do vendedor (não do anúncio). */
export function formatVendasHistoricasVendedor(reputation) {
  const n = Number(reputation?.transactions_completed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.trunc(n).toLocaleString("pt-BR")} vendas`;
}

/** Atualização relativa a partir de ISO oficial (ML ou captura S7). */
export function formatAtualizacaoRelativa(iso, { prefixo = "Atualizado" } = {}) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return null;
  const min = Math.floor(diffMs / 60000);
  if (min < 60) {
    if (min < 1) return `${prefixo} há menos de 1 min`;
    if (min === 1) return `${prefixo} há 1 min`;
    return `${prefixo} há ${min} min`;
  }
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) {
    if (hours === 1) return `${prefixo} há 1 hora`;
    return `${prefixo} há ${hours} horas`;
  }
  const days = Math.floor(diffMs / 86400000);
  if (days === 1) return `${prefixo} há 1 dia`;
  return `${prefixo} há ${days} dias`;
}

/**
 * Monta metadados oficiais para painel analítico — omite campos sem origem confiável.
 * @param {object | null | undefined} competitor
 */
export function montarMetaOficialConcorrente(competitor) {
  const c = competitor && typeof competitor === "object" ? competitor : {};
  const reputation = c.reputation && typeof c.reputation === "object" ? c.reputation : null;
  const frete = formatFreteConcorrenteLabel(c.shipping, c.last_seen_currency ?? c.currency ?? "BRL");
  const verificacao = parseIsoTimestamp(c.last_captured_at);
  const capturaPreco =
    parseIsoTimestamp(c.price_captured_at) ||
    parseIsoTimestamp(c.snapshot_captured_at) ||
    parseIsoTimestamp(c.last_price_captured_at);
  const diferencaVerificacaoVsPrecoMs =
    verificacao && capturaPreco ? Math.abs(verificacao.ms - capturaPreco.ms) : null;
  const separarVerificacaoCaptura =
    Number.isFinite(diferencaVerificacaoVsPrecoMs) && diferencaVerificacaoVsPrecoMs > 5 * 60 * 1000;
  const listingUpdated = separarVerificacaoCaptura
    ? null
    : formatCapturedAt((verificacao?.iso ?? capturaPreco?.iso ?? c.listing_updated_at) || null);

  return {
    marketplace: rotuloMarketplaceConcorrente(c.marketplace),
    tipoAnuncio: formatFriendlyListingType(c.listing_type),
    categoria: c.category_path != null && String(c.category_path).trim() !== "" ? String(c.category_path).trim() : null,
    idAnuncio: extrairIdConcorrenteParaCopia(c) || null,
    atualizacao: listingUpdated,
    ultimaVerificacao: formatCapturedAt(verificacao?.iso ?? null),
    precoCapturadoEm: formatCapturedAt(capturaPreco?.iso ?? null),
    exibirSeparadoVerificacaoCaptura: separarVerificacaoCaptura,
    frete: frete?.texto ?? null,
    freteTom: frete?.tom ?? null,
    nomeLoja: pickCompetitorSellerName(c),
    sellerId: c.competitor_seller_id != null && String(c.competitor_seller_id).trim() !== "" ? String(c.competitor_seller_id).trim() : null,
    reputacao: formatNivelReputacaoMl(reputation),
    reputacaoClasse: resolverClasseCssReputacaoMl(reputation),
    mercadoLider: formatPowerSeller(reputation),
    vendasVendedor: formatVendasHistoricasVendedor(reputation),
    permalink: resolveRegisteredCompetitorHref(c) ?? pickCandidatePermalink(c),
    anuncioAtivo: isConcorrenteAnuncioAtivo(c),
    statusAnuncio: rotuloStatusAnuncioConcorrente(c),
    statusAnuncioDetalhe: rotuloStatusAnuncioDetalheConcorrente(c),
  };
}
