import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Decimal from "decimal.js";
import S7Icon from "../../../components/ui/S7Icon";
import S7Button from "../../../components/ui/S7Button";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../../../components/ui/S7CopyButton.jsx";
import ProductHealthProgress from "../../../components/ProductHealthProgress.jsx";
import MarketplaceBadge from "../../../components/MarketplaceBadge.jsx";
import S7CatalogAccountCell, { pickCatalogAccountFields } from "../../../components/catalog/S7CatalogAccountCell.jsx";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import { S7_MODAL_SHARE_ACTION_LABELS } from "../../../shared/modalActions/s7ModalShareActions.js";
import ProductFinancialRayXPanel from "../../../components/products/ProductFinancialRayXPanel.jsx";
import ProductSalesHistorySection from "../../../components/products/ProductSalesHistorySection.jsx";
import { mapListingToRayXViewModel } from "../rayx/mapListingToRayXViewModel.js";
import { useListingFinancialRayX } from "../rayx/useListingFinancialRayX.js";
import { resolverListingIdCompleto } from "../rayx/listingIdentity.js";
import { formatBrlFromApiString, formatPercentFromApiString } from "../utils/catalogFormatters.js";
import { openPricingIntelligenceInNewTab } from "../../../utils/openPricingIntelligenceInNewTab.js";
import "../../../components/ProductForm.css";
import "../../../components/ProductFormRightPanel.css";
import "./ListingRayXModal.css";

/**
 * S1 — Raio-X do Anúncio.
 * Modal isolado, sem alterar o Raio-X/edição de Produto.
 *
 * @param {{
 *   open: boolean;
 *   listing: Record<string, unknown> | null;
 *   onClose: () => void;
 * }} props
 */
function resolveListingPublicUrl(listing) {
  const candidates = [
    listing?.permalink,
    listing?.listingPermalink,
    listing?.marketplacePermalink,
    listing?.listingUrl,
    listing?.externalUrl,
    listing?.url,
  ];
  for (const rawUrl of candidates) {
    if (typeof rawUrl !== "string") continue;
    const normalized = rawUrl.trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
  }
  return null;
}

/**
 * @param {string} rawLabel
 */
function formatarMarketplaceLabel(rawLabel) {
  const texto = String(rawLabel ?? "").trim();
  if (!texto) return "Marketplace";
  const semSeparador = texto.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const lower = semSeparador.toLowerCase();
  if (lower === "mercado livre" || lower === "mercadolivre") return "Mercado Livre";
  return semSeparador
    .split(" ")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ""))
    .join(" ");
}

/**
 * @param {unknown} raw
 */
function parseDecimalSafe(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  let normalized = text.replace(/\s+/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }
  try {
    const parsed = new Decimal(normalized);
    if (!parsed.isFinite()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} raw
 */
function formatarTipoBadge(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "—";
  const lower = text.toLowerCase();
  if (lower.includes("premium") || lower.includes("gold") || lower.includes("pro")) return "PREMIUM";
  if (lower.includes("classico") || lower.includes("clássico") || lower.includes("classic")) return "CLÁSSICO";
  return text.toUpperCase();
}

/**
 * @param {unknown} raw
 */
function formatarRecebido(raw) {
  const val = String(raw ?? "").trim();
  if (!val) return "—";
  const parsed = parseDecimalSafe(val);
  if (!parsed) return "—";
  return formatBrlFromApiString(parsed.toDecimalPlaces(2).toFixed(2));
}

/**
 * @param {Record<string, unknown> | null | undefined} listing
 */
function formatarEstoque(listing) {
  const candidates = [
    listing?.availableQuantity,
    listing?.available_quantity,
    listing?.stockQuantity,
    listing?.stock_quantity,
  ];
  for (const raw of candidates) {
    if (raw == null || String(raw).trim() === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.trunc(n).toLocaleString("pt-BR");
  }
  return "—";
}

export default function ListingRayXModal({ open, listing, onClose }) {
  const vm = useMemo(() => mapListingToRayXViewModel(listing), [listing]);
  const contaFromListagem = useMemo(() => pickCatalogAccountFields(listing), [listing]);
  const listingPublicUrl = useMemo(() => resolveListingPublicUrl(listing), [listing]);
  const marketplaceFooterLabel = useMemo(() => formatarMarketplaceLabel(vm.marketplaceLabel), [vm.marketplaceLabel]);
  const totalSecoes = vm.secoes.length;
  const secoesAtivas = vm.secoes.filter((s) => s.enabled).length;
  const progresso = totalSecoes > 0 ? Math.round((secoesAtivas / totalSecoes) * 100) : 0;
  const secaoInicialId = vm.secoes[0]?.id ?? "vendas";
  const [secaoAtivaId, setSecaoAtivaId] = useState(secaoInicialId);
  const secaoAtiva = vm.secoes.find((s) => s.id === secaoAtivaId) ?? vm.secoes[0] ?? null;
  const vendasAtiva = secaoAtiva?.id === "vendas";
  const historicoAtivo = secaoAtiva?.id === "historico-vendas";
  const listingFinancial = useListingFinancialRayX(listing, {
    enabled: open && (vendasAtiva || historicoAtivo),
  });

  useEffect(() => {
    if (!open) return;
    setSecaoAtivaId(secaoInicialId);
  }, [open, secaoInicialId, listing?.id, listing?.external_listing_id, listing?.listingId]);

  const handleSaveChanges = () => undefined;
  const handleSharePlaceholder = () => undefined;
  const shareActions = ["whatsapp", "email", "copy", "print", "csv"];
  const listingIdDisplay = useMemo(() => {
    const resolved = resolverListingIdCompleto(
      listing,
      vm.listingId && vm.listingId !== "—" ? String(vm.listingId) : "",
    );
    return resolved || "—";
  }, [listing, vm.listingId]);
  const listingIdCopy = listingIdDisplay !== "—" ? listingIdDisplay : "";
  const listingInternalId = listing?.id != null ? String(listing.id).trim() : "";
  const priceSidebarMeta = useMemo(() => {
    const promoCandidatesRaw = [
      listing?.promotionSalePriceBrl,
      listing?.promotionPriceBrl,
      listing?.promotional_price_brl,
      listing?.effectiveSalePriceBrl,
      listing?.effective_sale_price_brl,
    ];
    const baseCandidatesRaw = [
      listing?.listingSalePriceBrl,
      listing?.listingPriceBrl,
      listing?.listing_price_brl,
      listing?.listOrOriginalPriceBrl,
      listing?.list_or_original_price_brl,
      listing?.price,
    ];

    const promoCandidates = promoCandidatesRaw
      .map((raw) => parseDecimalSafe(raw))
      .filter((v) => v != null);
    const baseCandidates = baseCandidatesRaw.map((raw) => parseDecimalSafe(raw)).filter((v) => v != null);

    let precoAtual = null;
    let precoOriginal = null;

    if (promoCandidates.length > 0) {
      precoAtual = promoCandidates.reduce((acc, cur) => (cur.lessThan(acc) ? cur : acc));
      if (baseCandidates.length > 0) {
        precoOriginal = baseCandidates.reduce((acc, cur) => (cur.greaterThan(acc) ? cur : acc));
      }
    } else if (baseCandidates.length > 0) {
      precoAtual = baseCandidates[0];
      precoOriginal = null;
    }

    if (!precoAtual && vm.preco && vm.preco !== "—") {
      const vmPreco = parseDecimalSafe(vm.preco);
      if (vmPreco) precoAtual = vmPreco;
    }

    const precoAtualDisplay =
      precoAtual != null ? formatBrlFromApiString(precoAtual.toDecimalPlaces(2).toFixed(2)) : "—";
    const precoOriginalDisplay =
      precoOriginal != null ? formatBrlFromApiString(precoOriginal.toDecimalPlaces(2).toFixed(2)) : null;

    const mostrarTooltipPromocao =
      precoAtual != null &&
      precoOriginal != null &&
      precoOriginal.greaterThan(precoAtual) &&
      (promoCandidates.length > 0 || Boolean(listing?.promotionActive));

    return {
      precoAtualDisplay,
      precoOriginalDisplay,
      mostrarTooltipPromocao,
    };
  }, [
    listing?.promotionSalePriceBrl,
    listing?.promotionPriceBrl,
    listing?.promotional_price_brl,
    listing?.effectiveSalePriceBrl,
    listing?.effective_sale_price_brl,
    listing?.listingSalePriceBrl,
    listing?.listingPriceBrl,
    listing?.listing_price_brl,
    listing?.listOrOriginalPriceBrl,
    listing?.list_or_original_price_brl,
    listing?.price,
    listing?.promotionActive,
    vm.preco,
  ]);

  const tipoAnuncioBadge = useMemo(() => formatarTipoBadge(vm.tipoAnuncio), [vm.tipoAnuncio]);
  const metricasVisitasConversao = useMemo(() => {
    const salesCountRaw =
      listingFinancial.summary?.items_quantity_sold ?? listingFinancial.summary?.orders_count ?? null;
    const salesCount =
      salesCountRaw != null && Number.isFinite(Number(salesCountRaw))
        ? Math.trunc(Number(salesCountRaw))
        : null;

    const visitsCandidates = [
      listingFinancial.summary?.visits_count,
      listing?.visitCount,
      listing?.visits,
      listing?.visitsText,
    ];
    /** @type {number | null} */
    let visitasPositivas = null;
    /** @type {number | null} */
    let visitasFallback = null;
    for (const raw of visitsCandidates) {
      if (raw == null || String(raw).trim() === "") continue;
      const n = Number(String(raw).replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(n) && n >= 0) {
        const parsed = Math.trunc(n);
        if (parsed > 0) {
          visitasPositivas = parsed;
          break;
        }
        if (visitasFallback == null) visitasFallback = parsed;
      }
    }
    const visitas = visitasPositivas ?? visitasFallback;
    const visitsValue = visitas != null && Number.isFinite(visitas) ? visitas.toLocaleString("pt-BR") : "—";
    const visitsDisplay = visitsValue;

    const conversionFromSummaryRaw = listingFinancial.summary?.sales_conversion_rate_percent;
    const conversionFromSummaryDisplay =
      conversionFromSummaryRaw != null && String(conversionFromSummaryRaw).trim() !== ""
        ? formatPercentFromApiString(String(conversionFromSummaryRaw))
        : null;
    if (conversionFromSummaryDisplay) {
      const conversionValue = conversionFromSummaryDisplay;
      const conversionDisplay = conversionValue;
      return {
        visitsValue: visitsDisplay,
        conversionValue: conversionDisplay,
      };
    }

    let conversionValue = "—";
    if (visitas != null && visitas > 0 && salesCount != null && salesCount > 0) {
      const conversion = new Decimal(salesCount).div(visitas).times(100);
      conversionValue = formatPercentFromApiString(
        conversion.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      );
    }
    const conversionDisplay = conversionValue;

    return {
      salesCount,
      visitsValue: visitsDisplay,
      conversionValue: conversionDisplay,
    };
  }, [
    listingFinancial.summary?.visits_count,
    listingFinancial.summary?.sales_conversion_rate_percent,
    listingFinancial.summary?.items_quantity_sold,
    listingFinancial.summary?.orders_count,
    listing?.visitCount,
    listing?.visits,
    listing?.visitsText,
  ]);
  const skuDisplay = vm.sku && vm.sku !== "—" ? String(vm.sku).trim() : "—";
  const skuCopy = listing?.sku != null && String(listing.sku).trim() !== "" ? String(listing.sku).trim() : "";
  const visaoGeralCards = useMemo(
    () => [
      { id: "preco-atual", label: "Preço atual efetivo", value: priceSidebarMeta.precoAtualDisplay, isBadge: false },
      {
        id: "preco-original",
        label: "Preço original",
        value: priceSidebarMeta.mostrarTooltipPromocao ? priceSidebarMeta.precoOriginalDisplay ?? "—" : "—",
        isBadge: false,
      },
      { id: "voce-recebe", label: "Você recebe", value: formatarRecebido(listing?.netReceiveBrl), isBadge: false },
      { id: "tipo", label: "Tipo do anúncio", value: tipoAnuncioBadge, isBadge: true },
      { id: "visitas", label: "Visitas", value: metricasVisitasConversao.visitsValue ?? "—", isBadge: false },
      { id: "conversao", label: "Conversão", value: metricasVisitasConversao.conversionValue ?? "—", isBadge: false },
      { id: "estoque", label: "Estoque", value: formatarEstoque(listing), isBadge: false },
      { id: "sku", label: "SKU", value: skuDisplay, isBadge: false },
      { id: "status", label: "Status do anúncio", value: vm.status && vm.status !== "—" ? vm.status : "—", isBadge: false },
      {
        id: "qualidade",
        label: "Qualidade do anúncio",
        value:
          listing?.listingQualityStatus != null && String(listing.listingQualityStatus).trim() !== ""
            ? String(listing.listingQualityStatus).trim()
            : "—",
        isBadge: false,
      },
      {
        id: "experiencia",
        label: "Experiência de compra",
        value:
          listing?.experienceStatus != null && String(listing.experienceStatus).trim() !== ""
            ? String(listing.experienceStatus).trim()
            : "—",
        isBadge: false,
      },
    ],
    [
      listing?.netReceiveBrl,
      listing?.listingQualityStatus,
      listing?.experienceStatus,
      priceSidebarMeta.precoAtualDisplay,
      priceSidebarMeta.precoOriginalDisplay,
      priceSidebarMeta.mostrarTooltipPromocao,
      tipoAnuncioBadge,
      metricasVisitasConversao.visitsValue,
      metricasVisitasConversao.conversionValue,
      skuDisplay,
      vm.status,
      listing,
    ],
  );

  if (!open || listing == null || typeof document === "undefined") return null;

  const handleOpenPricingIntelligence = () => {
    if (!listingInternalId) return;
    openPricingIntelligenceInNewTab(listingInternalId, listing);
  };

  const renderSecaoPrincipal = () => {
    if (vendasAtiva) {
      return (
        <ProductFinancialRayXPanel
          tabTitle="Vendas"
          financialData={listingFinancial}
          sideIllustrationSrc="/listing-rayx/vendas-ecommerce-avatar.png"
          sideIllustrationAlt=""
        />
      );
    }

    if (historicoAtivo) {
      return (
        <div className="listing-rayx-modal__history-wrap">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">Histórico de vendas</h3>
          <ProductSalesHistorySection
            rows={listingFinancial.salesHistoryRows}
            total={listingFinancial.salesHistoryTotal}
            salesCount={listingFinancial.salesCountCanonical}
            page={listingFinancial.salesHistoryPage}
            totalPages={listingFinancial.salesHistoryTotalPages}
            loading={listingFinancial.salesHistoryLoading}
            error={listingFinancial.salesHistoryError}
            onPageChange={listingFinancial.goSalesHistoryPage}
          />
        </div>
      );
    }

    if (secaoAtiva?.id === "visao-geral") {
      return (
        <div className="listing-rayx-modal__overview-executive">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Visão geral"}</h3>
          <dl className="listing-rayx-modal__overview-grid">
            {visaoGeralCards.map((campo) => (
              <div key={campo.id} className="listing-rayx-modal__overview-card">
                <dt className="listing-rayx-modal__overview-label">{campo.label}</dt>
                <dd className="listing-rayx-modal__overview-value" title={campo.value}>
                  {campo.isBadge && campo.value !== "—" ? (
                    <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
                      {campo.value}
                    </span>
                  ) : (
                    campo.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="listing-rayx-modal__overview-cta-row">
            <S7Button
              type="button"
              variant="secondary"
              className="listing-rayx-modal__overview-cta-btn"
              onClick={handleOpenPricingIntelligence}
              disabled={!listingInternalId}
            >
              Editar na Precificação Inteligente
            </S7Button>
          </div>
        </div>
      );
    }

    return (
      <div className="listing-rayx-modal__placeholder-tab" role="status" aria-live="polite">
        <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Aba"}</h3>
        <p className="hint">Esta aba segue o padrão oficial do Raio-X e será habilitada progressivamente.</p>
      </div>
    );
  };

  return createPortal(
    <div className="listing-rayx-modal__backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="listing-rayx-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-rayx-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="listing-rayx-modal">
          <div className="listing-rayx-modal__body">
            <aside className="listing-rayx-modal__sidebar pf-right-panel" aria-label="Seções do Raio-X do Anúncio">
              <div className="listing-rayx-modal__sidebar-header pf-right-header">
                <h2 id="listing-rayx-modal-title" className="listing-rayx-modal__sidebar-title pf-right-title">
                  Raio-X do Anúncio
                </h2>
                <p className="listing-rayx-modal__sidebar-subtitle pf-right-required-hint">
                  <span className="listing-rayx-modal__required">*</span> Campos obrigatórios
                </p>
              </div>

            <div className="listing-rayx-modal__thumb-progress-row pf-right-progress-row pf-right-progress-row--with-thumb">
              <div className="pf-product-thumb pf-right-panel-product-thumb pf-product-thumb--data-inline">
                {vm.thumbnailUrl ? (
                  <img
                    src={vm.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="listing-rayx-modal__thumb-fallback" aria-hidden>
                    <S7Icon name="image" size={22} strokeWidth={1.7} />
                  </span>
                )}
              </div>
              <div className="listing-rayx-modal__thermometer pf-right-progress-semi">
                <ProductHealthProgress
                  percent={progresso}
                  status=""
                  blockingCount={0}
                  warningsCount={0}
                  hint={null}
                  showLabel={false}
                  variant="semi"
                />
              </div>
            </div>

            <div className="listing-rayx-modal__sidebar-identity">
              {listingPublicUrl ? (
                <a
                  className="listing-rayx-modal__sidebar-title-link"
                  href={listingPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={vm.titulo}
                >
                  {vm.titulo}
                </a>
              ) : (
                <span className="listing-rayx-modal__sidebar-title-link" title={vm.titulo}>
                  {vm.titulo}
                </span>
              )}

              <div className="listing-rayx-modal__sidebar-ids">
                <span className="s7-copy-group listing-rayx-modal__sidebar-id-group">
                  <span className="listing-rayx-modal__sidebar-id-text">{listingIdDisplay}</span>
                  {listingIdCopy ? (
                    <S7CopyButton
                      value={listingIdCopy}
                      ariaLabel="Copiar ID do anúncio"
                      tooltipText="Copiar ID do anúncio"
                      toastLabel="ID do anúncio"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="listing-rayx-id"
                      toastEventType="LISTING_ID_COPIED"
                      toastFailEventType="LISTING_ID_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                    />
                  ) : null}
                </span>
                <span className="listing-rayx-modal__sidebar-ids-sep" aria-hidden>
                  |
                </span>
                <span className="s7-copy-group listing-rayx-modal__sidebar-id-group">
                  <span className="listing-rayx-modal__sidebar-id-label">SKU:</span>
                  <span className="listing-rayx-modal__sidebar-id-text">{skuDisplay}</span>
                  {skuCopy ? (
                    <S7CopyButton
                      value={skuCopy}
                      ariaLabel="Copiar SKU"
                      tooltipText="Copiar SKU"
                      toastLabel="SKU"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="listing-rayx-sku"
                      toastEventType="LISTING_SKU_COPIED"
                      toastFailEventType="LISTING_SKU_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                    />
                  ) : null}
                </span>
              </div>

              <div className="listing-rayx-modal__sidebar-channel-account-line">
                <span className="listing-rayx-modal__sidebar-channel">
                  <MarketplaceBadge
                    marketplace={vm.marketplaceSlug || vm.marketplaceRaw}
                    label={marketplaceFooterLabel}
                    size={16}
                    className="listing-rayx-modal__sidebar-marketplace-badge"
                  />
                  <span className="listing-rayx-modal__sidebar-channel-text">{marketplaceFooterLabel}</span>
                </span>
                <span className="listing-rayx-modal__sidebar-channel-account-sep" aria-hidden>
                  |
                </span>
                <S7Tooltip
                  content={contaFromListagem.accountAlias ?? vm.contaLabel ?? "Conta"}
                  placement="top-start"
                  offset={6}
                  wrap
                >
                  <span className="listing-rayx-modal__sidebar-account">
                    <S7CatalogAccountCell
                      marketplaceAccountId={contaFromListagem.marketplaceAccountId ?? vm.accountId ?? null}
                      accountAlias={contaFromListagem.accountAlias ?? vm.contaLabel}
                      accountLogoUrl={contaFromListagem.accountLogoUrl ?? vm.accountLogoUrl}
                    />
                  </span>
                </S7Tooltip>
              </div>

              <div className="listing-rayx-modal__sidebar-price-meta" aria-label="Preço atual e tipo do anúncio">
                <div className="listing-rayx-modal__sidebar-price-meta-item">
                  <span className="listing-rayx-modal__sidebar-price-meta-label">Preço atual</span>
                  <span className="listing-rayx-modal__sidebar-price-meta-value-wrap">
                    <span className="listing-rayx-modal__sidebar-price-meta-value">
                      {priceSidebarMeta.precoAtualDisplay}
                    </span>
                    {priceSidebarMeta.mostrarTooltipPromocao ? (
                      <S7Tooltip
                        content={`Preço original ${priceSidebarMeta.precoOriginalDisplay}`}
                        placement="top-start"
                        offset={6}
                      >
                        <button
                          type="button"
                          className="listing-rayx-modal__sidebar-price-info-btn"
                          aria-label="Preço original"
                        >
                          <S7Icon name="info" size={12} strokeWidth={1.9} />
                        </button>
                      </S7Tooltip>
                    ) : null}
                  </span>
                </div>
                <div className="listing-rayx-modal__sidebar-price-meta-item">
                  <span className="listing-rayx-modal__sidebar-price-meta-label">Tipo do anúncio</span>
                  {tipoAnuncioBadge !== "—" ? (
                    <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
                      {tipoAnuncioBadge}
                    </span>
                  ) : (
                    <span className="listing-rayx-modal__sidebar-price-meta-value">—</span>
                  )}
                </div>
              </div>
            </div>

              <div className="listing-rayx-modal__nav-wrap pf-right-steps">
              <ul className="listing-rayx-modal__nav pf-right-steps-list">
                {vm.secoes.map((secao, index) => (
                  <li key={secao.id} className={secao.id === secaoAtivaId ? "pf-right-step--active" : "pf-right-step--pending"}>
                    <button
                      type="button"
                      className={`listing-rayx-modal__nav-item pf-right-step-button ${secao.id === secaoAtivaId ? "listing-rayx-modal__nav-item--active" : ""}`}
                      onClick={() => setSecaoAtivaId(secao.id)}
                    >
                      <span className="listing-rayx-modal__nav-index pf-right-step-icon">{String(index + 1).padStart(2, "0")}</span>
                      <span className="listing-rayx-modal__nav-label pf-right-step-label">{secao.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              </div>
            </aside>

            <div className="listing-rayx-modal__main-toolbar">
              <div className="listing-rayx-modal__share-actions" role="toolbar" aria-label="Ações de compartilhamento">
                {shareActions.map((actionId) => (
                  <S7Tooltip key={actionId} content="Em breve" placement="bottom-start" offset={6}>
                    <button
                      type="button"
                      className="listing-rayx-modal__share-action-btn"
                      aria-label={S7_MODAL_SHARE_ACTION_LABELS[actionId] ?? `Ação ${actionId}`}
                      onClick={handleSharePlaceholder}
                    >
                      <S7ModalShareActionIcon actionId={actionId} />
                    </button>
                  </S7Tooltip>
                ))}
              </div>
            </div>

            <section className="listing-rayx-modal__main" aria-label="Visão geral do anúncio">
              <div className="listing-rayx-modal__main-scroll">
                {renderSecaoPrincipal()}
              </div>
              <footer className="listing-rayx-modal__main-footer pf-body-footer pf-body-footer--save-only pf-body-footer--modal-actions">
                <div className="pf-body-footer-actions listing-rayx-modal__footer-actions">
                  <button type="button" className="s7-btn s7-btn--primary pf-body-footer-btn" onClick={onClose}>
                    Cancelar
                  </button>
                  <S7Button type="button" variant="primary" className="pf-body-footer-btn" onClick={handleSaveChanges}>
                    Salvar alterações
                  </S7Button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

