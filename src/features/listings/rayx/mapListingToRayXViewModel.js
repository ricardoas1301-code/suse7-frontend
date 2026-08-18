import {
  DASH,
  formatBrlFromApiString,
  formatMoneyOrDash,
  formatPercentFromApiString,
} from "../utils/catalogFormatters.js";

function textoOuDash(valor) {
  if (valor == null) return DASH;
  const texto = String(valor).trim();
  return texto !== "" ? texto : DASH;
}

function formatarPreco(row) {
  if (row?.listingPriceBrl != null && String(row.listingPriceBrl).trim() !== "") {
    return formatBrlFromApiString(row.listingPriceBrl);
  }
  if (Number.isFinite(Number(row?.price))) {
    return formatMoneyOrDash(Number(row.price));
  }
  return DASH;
}

function formatarSaude(row) {
  const label = textoOuDash(row?.healthLabel);
  const healthPercent =
    row?.healthPercent != null && Number.isFinite(Number(row.healthPercent))
      ? `${Math.round(Number(row.healthPercent))}%`
      : null;
  if (label === DASH && !healthPercent) return DASH;
  return healthPercent ? `${label} · ${healthPercent}` : label;
}

function formatarFreteLogistica(row) {
  const frete = row?.shippingCostBrl ? formatBrlFromApiString(row.shippingCostBrl) : null;
  const logistica = row?.shippingLogisticType ? String(row.shippingLogisticType).trim() : null;
  if (!frete && !logistica) return DASH;
  if (frete && logistica) return `${frete} · ${logistica}`;
  return frete ?? logistica ?? DASH;
}

function formatarVendas(row) {
  if (row?.salesCount == null || !Number.isFinite(Number(row.salesCount))) return DASH;
  return Number(row.salesCount).toLocaleString("pt-BR");
}

function formatarComissao(row) {
  if (row?.commissionPercent == null || String(row.commissionPercent).trim() === "") return DASH;
  return formatPercentFromApiString(row.commissionPercent);
}

function normalizarLogoConta(url) {
  const texto = url != null ? String(url).trim() : "";
  if (!texto) return null;
  if (texto.startsWith("//")) return `https:${texto}`;
  if (/^http:\/\//i.test(texto)) {
    const lower = texto.toLowerCase();
    if (
      lower.includes("mercadolivre") ||
      lower.includes("mercadolibre") ||
      lower.includes("mlstatic") ||
      lower.includes("mlcdn")
    ) {
      return `https://${texto.slice(7)}`;
    }
  }
  return texto;
}

/**
 * @param {Record<string, unknown>} row
 */
function resolverLogoConta(row) {
  const nestedAccount =
    row.account && typeof row.account === "object"
      ? /** @type {Record<string, unknown>} */ (row.account)
      : null;
  const nestedMarketplaceAccount =
    row.marketplaceAccount && typeof row.marketplaceAccount === "object"
      ? /** @type {Record<string, unknown>} */ (row.marketplaceAccount)
      : null;

  const candidates = [
    row.accountLogoUrl,
    row.account_logo_url,
    row.marketplace_account_logo_url,
    row.accountLogo,
    row.mlAccountLogo,
    row.company_logo_url,
    row.seller_company_logo_url,
    nestedAccount?.logo_url,
    nestedAccount?.avatar_url,
    nestedAccount?.account_logo_url,
    nestedMarketplaceAccount?.logo_url,
    nestedMarketplaceAccount?.avatar_url,
    nestedMarketplaceAccount?.account_logo_url,
  ];

  for (const raw of candidates) {
    if (raw == null) continue;
    const normalized = normalizarLogoConta(raw);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * @param {string} status
 */
function resolverStatusTone(status) {
  const lower = String(status ?? "").trim().toLowerCase();
  if (!lower) return "inactive";
  if (lower.includes("paus")) return "paused";
  if (lower.includes("inativ") || lower.includes("desativ")) return "inactive";
  if (lower.includes("ativ")) return "active";
  return "inactive";
}

/**
 * View model inicial do Raio-X do Anúncio.
 * Preparado para múltiplos marketplaces (não acoplar apenas MLB no JSX).
 *
 * @param {Record<string, unknown> | null | undefined} listing
 */
export function mapListingToRayXViewModel(listing) {
  const row = listing ?? {};
  const marketplaceLabel =
    row.marketplaceLabelDisplay != null && String(row.marketplaceLabelDisplay).trim() !== ""
      ? String(row.marketplaceLabelDisplay).trim()
      : textoOuDash(row.marketplaceRaw ?? row.marketplaceSlug);

  const contaLabel =
    row.accountAlias != null && String(row.accountAlias).trim() !== ""
      ? String(row.accountAlias).trim()
      : row.mlAccountAlias != null && String(row.mlAccountAlias).trim() !== ""
        ? String(row.mlAccountAlias).trim()
        : DASH;
  const accountId =
    row.marketplaceAccountId != null && String(row.marketplaceAccountId).trim() !== ""
      ? String(row.marketplaceAccountId).trim()
      : row.marketplace_account_id != null && String(row.marketplace_account_id).trim() !== ""
        ? String(row.marketplace_account_id).trim()
        : null;

  const listingId = textoOuDash(row.listingNumberDisplay ?? row.externalId ?? row.listingNumber);
  const titulo = textoOuDash(row.adTitle);
  const sku = textoOuDash(row.sku);
  const status = textoOuDash(row.statusLabel);
  const tipoAnuncio = textoOuDash(row.listingTypeLabel);
  const preco = formatarPreco(row);
  const freteLogistica = formatarFreteLogistica(row);
  const vendas = formatarVendas(row);
  const saude = formatarSaude(row);
  const comissao = formatarComissao(row);
  const thumbnailUrl =
    row.coverThumbnailUrl != null && String(row.coverThumbnailUrl).trim() !== ""
      ? String(row.coverThumbnailUrl).trim()
      : null;
  const accountLogoUrl = resolverLogoConta(row);
  const marketplaceSlugRaw = row.marketplaceRaw ?? row.marketplaceSlug ?? row.marketplace ?? null;
  const marketplaceSlug =
    marketplaceSlugRaw != null && String(marketplaceSlugRaw).trim() !== ""
      ? String(marketplaceSlugRaw).trim().toLowerCase()
      : "";
  const statusTone = resolverStatusTone(status);

  return {
    id: textoOuDash(row.id),
    marketplaceRaw: textoOuDash(row.marketplaceRaw ?? row.marketplaceSlug),
    marketplaceSlug,
    marketplaceLabel,
    contaLabel,
    accountId,
    accountLogoUrl,
    listingId,
    titulo,
    sku,
    status,
    preco,
    tipoAnuncio,
    freteLogistica,
    vendas,
    saude,
    comissao,
    thumbnailUrl,
    statusTone,
    secoes: [
      { id: "vendas", label: "Vendas", enabled: true },
      { id: "historico-vendas", label: "Histórico de vendas", enabled: true },
      { id: "resumo", label: "Resumo", enabled: true },
      { id: "custos-estoque", label: "Custos e estoque", enabled: true },
      { id: "conteudo", label: "Imagens", enabled: true },
      { id: "configuracoes", label: "Descrição", enabled: true },
      { id: "pesos-medidas", label: "Pesos e medidas", enabled: true },
    ],
    camposVisaoGeral: [
      { label: "Marketplace", value: marketplaceLabel },
      { label: "Conta", value: contaLabel },
      { label: "ID do anúncio", value: listingId },
      { label: "Título do anúncio", value: titulo },
      { label: "SKU", value: sku },
      { label: "Status", value: status },
      { label: "Preço", value: preco },
      { label: "Tipo de anúncio", value: tipoAnuncio },
      { label: "Frete / logística", value: freteLogistica },
      { label: "Vendas", value: vendas },
      { label: "Saúde do anúncio", value: saude },
      { label: "Comissão (%)", value: comissao },
    ],
  };
}

