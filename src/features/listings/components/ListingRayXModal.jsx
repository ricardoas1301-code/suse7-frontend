import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Decimal from "decimal.js";
import S7Icon from "../../../components/ui/S7Icon";
import S7Button from "../../../components/ui/S7Button";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7CatalogListingHeadline from "../../../components/catalog/S7CatalogListingHeadline.jsx";
import "../../../components/catalog/S7CatalogListingHeadline.css";
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
import { formatPercentFromApiString, formatBrlFromApiString } from "../utils/catalogFormatters.js";
import {
  fetchListingEditorDetail,
  updateListingEditorContent,
  updateListingEditorStockSettings,
  updateListingEditorPrimaryPictureSettings,
  updateListingEditorDescriptionSettings,
  updateListingEditorMeasurementSettings,
} from "../rayx/listingEditorApi.js";
import {
  buildEmptyListingMeasurementsDraft,
  listingMeasurementsDraftToSavePayload,
  listingMeasurementsSummaryToDraft,
} from "../rayx/listingMeasurementsDraft.js";
import { normalizeListingQualitySummary } from "../rayx/normalizeListingQualitySummary.js";
import { normalizeListingPurchaseExperience } from "../rayx/normalizeListingPurchaseExperience.js";
import {
  buildListingDetailFallbackFromRow,
  normalizeListingEditorDetailResponse,
} from "../rayx/normalizeListingEditorDetailResponse.js";
import { formatarTipoAnuncioMl } from "../utils/formatarTipoAnuncioMl.js";
import "../../../components/ProductForm.css";
import "../../../components/ProductFormRightPanel.css";
import "../../../styles/tokens/s7-operational-thumb.css";
import "./ListingRayXModal.css";
import ListingResumoSemiMeter from "./ListingResumoSemiMeter.jsx";
import ListingResumoKpiShell from "./ListingResumoKpiShell.jsx";
import ListingRayxCostsStockPanel from "./ListingRayxCostsStockPanel.jsx";
import ListingRayxImagesPanel from "./ListingRayxImagesPanel.jsx";
import ListingRayxDescriptionPanel from "./ListingRayxDescriptionPanel.jsx";
import ListingRayxMeasurementsPanel from "./ListingRayxMeasurementsPanel.jsx";
import {
  resolverPriceSummary,
  resolverShippingSummaryLogistica,
  resolverWholesaleSummary,
} from "../rayx/normalizeListingShippingSummary.js";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";

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

function hasResumoPriceValue(value) {
  return value != null && String(value).trim() !== "";
}

function formatResumoPriceValue(value) {
  return hasResumoPriceValue(value) ? formatBrlFromApiString(String(value).trim()) : null;
}

function resolveResumoSalePriceDisplay(listing, priceSummary) {
  const promotionalRaw =
    listing?.promotionActive && hasResumoPriceValue(listing?.promotionSalePriceBrl)
      ? listing.promotionSalePriceBrl
      : hasResumoPriceValue(listing?.effectiveSalePriceBrl)
        ? listing.effectiveSalePriceBrl
        : null;
  const originalRaw =
    listing?.promotionActive && hasResumoPriceValue(listing?.listingSalePriceBrl)
      ? listing.listingSalePriceBrl
      : listing?.promotionActive && hasResumoPriceValue(listing?.listOrOriginalPriceBrl)
        ? listing.listOrOriginalPriceBrl
        : null;

  const promotionalLabel = formatResumoPriceValue(promotionalRaw);
  const originalLabel = formatResumoPriceValue(originalRaw);

  if (promotionalLabel && originalLabel && promotionalLabel !== originalLabel) {
    return {
      value: promotionalLabel,
      secondaryValue: originalLabel,
    };
  }

  return {
    value:
      priceSummary?.sale_price_label != null && String(priceSummary.sale_price_label).trim() !== ""
        ? String(priceSummary.sale_price_label).trim()
        : "—",
    secondaryValue: null,
  };
}

function textoDescricaoSeguro(value) {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw || raw === "—") return "";
  const withoutScripts = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  const withBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const decoded = withBreaks
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return decoded
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizarInteiroEstoqueVirtual(value) {
  const text = value != null ? String(value).trim() : "";
  if (!text) return { ok: false, value: null, error: "Informe o estoque virtual deste anúncio." };
  if (!/^\d+$/.test(text)) {
    return { ok: false, value: null, error: "Use apenas número inteiro, sem decimal ou sinal." };
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return { ok: false, value: null, error: "Use um número inteiro válido maior ou igual a zero." };
  }
  return { ok: true, value: parsed, error: "" };
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

/**
 * @param {string | null | undefined} rawStatus
 */
function formatarStatusAnuncio(rawStatus) {
  const s = String(rawStatus ?? "").trim().toLowerCase();
  if (!s) return "—";
  if (s === "active" || s === "ativo") return "Ativo";
  if (s === "paused" || s === "pausado") return "Pausado";
  if (s === "closed" || s === "finalizado") return "Finalizado";
  if (s === "under_review" || s === "em revisão" || s === "em revisao") return "Em revisão";
  if (s === "inactive" || s === "not_yet_active" || s === "inativo") return "Inativo";
  const humanized = s.replace(/_/g, " ");
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

/**
 * @param {string | null | undefined} statusLabel
 */
function toneBadgeStatus(statusLabel) {
  const s = String(statusLabel ?? "").trim().toLowerCase();
  if (s === "ativo") return "success";
  if (s === "pausado") return "warning";
  if (s === "em revisão") return "info";
  if (s === "finalizado") return "neutral";
  if (s === "inativo") return "danger";
  return "neutral";
}

/**
 * Encurta o texto longo de comparação ML para uma linha no Resumo.
 * @param {string} description
 */
function encurtarRodapeExperiencia(description) {
  const text = String(description ?? "").trim();
  if (!text) return text;
  if (/^comparamos\s+seu\s+desempenho/i.test(text)) {
    return "Comparamos seu desempenho com outros vendedores";
  }
  return text;
}

/**
 * @param {string | null | undefined} label
 * @param {string | null | undefined} description
 */
function textoRodapeExperiencia(label, description) {
  const l = label != null ? String(label).trim() : "";
  const d = description != null ? String(description).trim() : "";
  if (!l && !d) return "Ainda não podemos calculá-la";
  if (l && d && l.toLowerCase() === d.toLowerCase()) return l;
  if (d) return encurtarRodapeExperiencia(d);
  return l;
}

/**
 * @param {unknown} value
 */
function textoResumoOuTraco(value) {
  if (value == null || String(value).trim() === "") return "—";
  return String(value).trim();
}

/**
 * @param {unknown} qty
 */
function formatarQuantidadeResumo(qty) {
  if (qty == null || !Number.isFinite(Number(qty))) return "—";
  return Math.trunc(Number(qty)).toLocaleString("pt-BR");
}

/**
 * Estoque mínimo do produto: ausência cadastral exibe 0 (nunca traço).
 * @param {unknown} qty
 */
function formatarEstoqueMinimoProduto(qty) {
  if (qty == null || String(qty).trim() === "" || !Number.isFinite(Number(qty))) {
    return "0";
  }
  return Math.max(0, Math.trunc(Number(qty))).toLocaleString("pt-BR");
}

/**
 * @param {string | null | undefined} tipoLabel
 */
function classeBadgeTipoAnuncioSidebar(tipoLabel) {
  const text = tipoLabel != null ? String(tipoLabel).trim().toLowerCase() : "";
  if (text === "premium") return "premium";
  if (text === "clássico" || text === "classico") return "classic";
  if (text === "grátis" || text === "gratis") return "free";
  return "neutral";
}

/**
 * @param {string | null | undefined} objectivesLabel
 * @param {number | null | undefined} objectivesCount
 */
function objetivosQualidadeSaoClicaveis(objectivesLabel, objectivesCount) {
  if (objectivesCount != null && Number.isFinite(Number(objectivesCount)) && Number(objectivesCount) > 0) {
    return true;
  }
  const text = objectivesLabel != null ? String(objectivesLabel).trim().toLowerCase() : "";
  if (!text) return false;
  if (text === "objetivos alcançados") return false;
  if (text.includes("ainda não há dados")) return false;
  if (text.includes("sem calcular")) return false;
  return /\d+\s+objetivos?\s+para\s+alcançar/.test(text);
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} [payload]
 */
function logRayxDetail(event, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7_LISTING_RAYX_DETAIL] ${event}`, payload);
}

export default function ListingRayXModal({ open, listing, onClose }) {
  const { addNotification } = useNotifications();
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

  useEffect(() => {
    if (!open) return;
    const validIds = new Set(vm.secoes.filter((secao) => secao.enabled).map((secao) => secao.id));
    if (!validIds.has(secaoAtivaId)) {
      setSecaoAtivaId(validIds.has("resumo") ? "resumo" : (vm.secoes.find((s) => s.enabled)?.id ?? "vendas"));
    }
  }, [open, vm.secoes, secaoAtivaId]);
  const vendasAtiva = secaoAtiva?.id === "vendas";
  const historicoAtivo = secaoAtiva?.id === "historico-vendas";

  const listingChaveSessao = useMemo(() => {
    const bruto =
      listing?.id ??
      listing?.listing_id ??
      listing?.external_listing_id ??
      listing?.listingId;
    return bruto != null && String(bruto).trim() !== "" ? String(bruto).trim() : "";
  }, [listing?.id, listing?.listing_id, listing?.external_listing_id, listing?.listingId]);

  const [sessaoFinanceira, setSessaoFinanceira] = useState({
    listingKey: "",
    vendas: false,
    historico: false,
  });

  useEffect(() => {
    if (!open) {
      setSessaoFinanceira({ listingKey: "", vendas: false, historico: false });
      return;
    }
    setSessaoFinanceira({ listingKey: listingChaveSessao, vendas: false, historico: false });
  }, [open, listingChaveSessao]);

  useEffect(() => {
    if (!open || listingChaveSessao === "") return;
    setSessaoFinanceira((prev) => {
      if (prev.listingKey !== listingChaveSessao) return prev;
      const vendas = prev.vendas || vendasAtiva;
      const historico = prev.historico || historicoAtivo;
      if (vendas === prev.vendas && historico === prev.historico) return prev;
      return { ...prev, vendas, historico };
    });
  }, [open, listingChaveSessao, vendasAtiva, historicoAtivo]);

  const listingFinancial = useListingFinancialRayX(listing, {
    executiveEnabled:
      open && sessaoFinanceira.listingKey === listingChaveSessao && sessaoFinanceira.vendas,
    historyEnabled:
      open && sessaoFinanceira.listingKey === listingChaveSessao && sessaoFinanceira.historico,
  });

  useEffect(() => {
    if (!open) return;
    setSecaoAtivaId(secaoInicialId);
  }, [open, secaoInicialId, listing?.id, listing?.external_listing_id, listing?.listingId]);

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
  const [editorDetail, setEditorDetail] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorDetailResolved, setEditorDetailResolved] = useState(false);
  const resumoCarregando =
    secaoAtivaId === "resumo" && editorDetail == null && !editorDetailResolved;
  const [editorError, setEditorError] = useState("");
  const [editorNotice, setEditorNotice] = useState("");
  const editorRequestInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaveMsg, setContentSaveMsg] = useState("");
  const [tituloEdicao, setTituloEdicao] = useState("");
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [stockOverrideEnabled, setStockOverrideEnabled] = useState(false);
  const [stockOverrideValue, setStockOverrideValue] = useState("");
  const [stockFieldError, setStockFieldError] = useState("");
  const [stockSettingsSaving, setStockSettingsSaving] = useState(false);
  const [stockSettingsBaseline, setStockSettingsBaseline] = useState({ enabled: false, value: null });
  const [orderedPictureKeysBaseline, setOrderedPictureKeysBaseline] = useState([]);
  const [orderedPictureKeysDraft, setOrderedPictureKeysDraft] = useState([]);
  const [pictureOrderSaving, setPictureOrderSaving] = useState(false);
  const [descriptionBaseline, setDescriptionBaseline] = useState("");
  const [descriptionSaving, setDescriptionSaving] = useState(false);
  const [measurementsBaseline, setMeasurementsBaseline] = useState(() => buildEmptyListingMeasurementsDraft());
  const [measurementsDraft, setMeasurementsDraft] = useState(() => buildEmptyListingMeasurementsDraft());
  const [measurementsSaving, setMeasurementsSaving] = useState(false);
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
  const skuDisplay = vm.sku && vm.sku !== "—" ? String(vm.sku).trim() : "";
  const skuCopy = listing?.sku != null && String(listing.sku).trim() !== "" ? String(listing.sku).trim() : "";
  const tituloSidebar =
    vm.titulo != null && String(vm.titulo).trim() !== "" ? String(vm.titulo).trim() : "—";
  const precisaCarregarEditor =
    open && ["resumo", "conteudo", "custos-estoque", "pesos-medidas", "configuracoes"].includes(secaoAtivaId);
  const detailFallbackFromRow = useMemo(
    () => buildListingDetailFallbackFromRow(listing),
    [
      listing?.id,
      listing?.status,
      listing?.statusKey,
      listing?.visitCount,
      listing?.visits,
      listing?.visitsText,
      listing?.sku,
      listing?.availableQuantity,
      listing?.stockQuantity,
      listing?.categoryName,
      listing?.categoryId,
      listing?.brand,
      listing?.brandName,
      listing?.gtin,
      listing?.ean,
      listing?.upc,
    ],
  );
  const resumoDetail = useMemo(() => {
    if (editorDetail == null) return detailFallbackFromRow;
    return normalizeListingEditorDetailResponse(editorDetail, listing);
  }, [editorDetail, detailFallbackFromRow, listing]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open || !listing?.id) return;
    setEditorDetail(null);
    setEditorDetailResolved(false);
    setEditorError("");
    setEditorNotice("");
    setContentSaveMsg("");
    editorRequestInFlightRef.current = false;
  }, [open, listing?.id]);

  useEffect(() => {
    if (!precisaCarregarEditor || !listing?.id || editorDetail != null || editorRequestInFlightRef.current) return;
    let cancelled = false;
    const listingId = String(listing.id);
    const listingSnapshot = listing;
    void (async () => {
      editorRequestInFlightRef.current = true;
      setEditorLoading(true);
      setEditorError("");
      setEditorNotice("Atualizando dados oficiais...");
      if (secaoAtivaId === "resumo") {
        logRayxDetail("fallback_rendered", { listing_id: listingId, reason: "request_in_progress" });
      }
      logRayxDetail("request_start", { listing_id: listingId, secao: secaoAtivaId });
      try {
        const res = await fetchListingEditorDetail(listingId);
        if (cancelled) {
          logRayxDetail("request_error", { listing_id: listingId, error: "request_cancelled" });
          return;
        }
        if (!res.ok) {
          const isTimeout = res.timedOut === true || Number(res.status) === 408;
          const recoverableMsg = isTimeout
            ? "Não foi possível carregar todos os dados oficiais agora."
            : "Não foi possível carregar todos os dados oficiais agora. Exibindo dados disponíveis no SUS7.";
          setEditorError(res.error || "Não foi possível carregar os dados de edição do anúncio.");
          setEditorNotice(recoverableMsg);
          logRayxDetail(isTimeout ? "request_timeout" : "request_error", {
            listing_id: listingId,
            status: res.status ?? null,
            error: res.error ?? "request_failed",
          });
          logRayxDetail("fallback_rendered", {
            listing_id: listingId,
            reason: isTimeout ? "request_timeout" : "request_error",
          });
          logRayxDetail("normalized_payload", {
            listing_id: listingId,
            summary_keys: Object.keys(detailFallbackFromRow?.summary ?? {}),
            quality_source: detailFallbackFromRow?.quality?.source ?? null,
            purchase_experience_source: detailFallbackFromRow?.purchase_experience?.source ?? null,
          });
          return;
        }
        const normalized = normalizeListingEditorDetailResponse(res.data, listingSnapshot);
        const warningCount = Array.isArray(res.data?.warnings) ? res.data.warnings.length : 0;
        setEditorDetail(normalized);
        logRayxDetail("request_success", {
          listing_id: listingId,
          status: res.status ?? 200,
          warnings: warningCount,
        });
        logRayxDetail("normalized_payload", {
          listing_id: listingId,
          summary_keys: Object.keys(normalized?.summary ?? {}),
          quality_source: normalized?.quality?.source ?? null,
          purchase_experience_source: normalized?.purchase_experience?.source ?? null,
        });
      } catch (err) {
        if (cancelled) {
          logRayxDetail("request_error", { listing_id: listingId, error: "request_cancelled" });
          return;
        }
        setEditorError("Não foi possível carregar os dados de edição do anúncio.");
        setEditorNotice("Não foi possível carregar todos os dados oficiais agora. Exibindo dados disponíveis no SUS7.");
        logRayxDetail("request_error", {
          listing_id: listingId,
          error: err instanceof Error ? err.message : String(err),
        });
        logRayxDetail("fallback_rendered", {
          listing_id: listingId,
          reason: "request_exception",
        });
        logRayxDetail("normalized_payload", {
          listing_id: listingId,
          summary_keys: Object.keys(detailFallbackFromRow?.summary ?? {}),
          quality_source: detailFallbackFromRow?.quality?.source ?? null,
          purchase_experience_source: detailFallbackFromRow?.purchase_experience?.source ?? null,
        });
      } finally {
        editorRequestInFlightRef.current = false;
        if (isMountedRef.current) {
          setEditorLoading(false);
          if (!cancelled) {
            setEditorDetailResolved(true);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [precisaCarregarEditor, listing?.id, editorDetail, secaoAtivaId]);

  const editorCapabilities =
    editorDetail?.listing_edit_capabilities && typeof editorDetail.listing_edit_capabilities === "object"
      ? editorDetail.listing_edit_capabilities
      : null;

  const contentPayload = editorDetail?.content && typeof editorDetail.content === "object" ? editorDetail.content : null;
  const contentTitle = contentPayload?.title != null && String(contentPayload.title).trim() !== "" ? String(contentPayload.title) : vm.titulo;
  const contentDescription =
    contentPayload?.description != null && String(contentPayload.description).trim() !== ""
      ? String(contentPayload.description)
      : "—";
  const contentPictures = Array.isArray(contentPayload?.pictures) ? contentPayload.pictures : [];

  const podeEditarTitulo = editorCapabilities?.content?.title?.editable === true;
  const podeEditarDescricao = editorCapabilities?.content?.description?.editable === true;
  const podeEditarConteudo = podeEditarTitulo || podeEditarDescricao;

  useEffect(() => {
    setTituloEdicao(contentTitle && contentTitle !== "—" ? contentTitle : "");
  }, [contentTitle, listing?.id]);

  const logisticaPayload =
    editorDetail?.logistics && typeof editorDetail.logistics === "object" ? editorDetail.logistics : null;
  const listingSummaryKpis =
    editorDetail?.listing_summary_kpis && typeof editorDetail.listing_summary_kpis === "object"
      ? editorDetail.listing_summary_kpis
      : null;
  const shippingSummary = useMemo(
    () => resolverShippingSummaryLogistica(listingSummaryKpis?.shipping ?? logisticaPayload),
    [listingSummaryKpis?.shipping, logisticaPayload],
  );
  const priceSummary = useMemo(
    () => resolverPriceSummary(listingSummaryKpis?.price ?? editorDetail?.price_summary),
    [listingSummaryKpis?.price, editorDetail?.price_summary],
  );
  const resumoSalePriceDisplay = useMemo(
    () => resolveResumoSalePriceDisplay(listing, priceSummary),
    [
      listing?.effectiveSalePriceBrl,
      listing?.listOrOriginalPriceBrl,
      listing?.listingSalePriceBrl,
      listing?.promotionActive,
      listing?.promotionSalePriceBrl,
      priceSummary,
    ],
  );
  const wholesaleSummary = useMemo(
    () => resolverWholesaleSummary(listingSummaryKpis?.wholesale ?? editorDetail?.wholesale_summary),
    [listingSummaryKpis?.wholesale, editorDetail?.wholesale_summary],
  );
  const configuracoesPayload =
    editorDetail?.settings && typeof editorDetail.settings === "object" ? editorDetail.settings : null;

  const configuracoesCards = useMemo(
    () => [
      { id: "item-id", label: "Item ID", value: configuracoesPayload?.item_id ?? "—" },
      { id: "seller-id", label: "Seller ID", value: configuracoesPayload?.seller_id ?? "—" },
      { id: "marketplace", label: "Marketplace", value: configuracoesPayload?.marketplace ?? vm.marketplaceLabel },
      {
        id: "categoria",
        label: "Categoria",
        value: configuracoesPayload?.category_name ?? "—",
      },
      {
        id: "codigo-categoria",
        label: "Código da categoria",
        value: configuracoesPayload?.category_id ?? "—",
      },
      { id: "listing-type-id", label: "Tipo de anúncio", value: configuracoesPayload?.listing_type_id ?? "—" },
      { id: "buying-mode", label: "Buying mode", value: configuracoesPayload?.buying_mode ?? "—" },
      { id: "status", label: "Status", value: configuracoesPayload?.status ?? vm.status },
      {
        id: "sub-status",
        label: "Substatus",
        value:
          Array.isArray(configuracoesPayload?.sub_status) && configuracoesPayload.sub_status.length > 0
            ? configuracoesPayload.sub_status.join(", ")
            : "—",
      },
      {
        id: "channels",
        label: "Channels",
        value:
          Array.isArray(configuracoesPayload?.channels) && configuracoesPayload.channels.length > 0
            ? configuracoesPayload.channels.join(", ")
            : "—",
      },
      {
        id: "tags",
        label: "Tags relevantes",
        value:
          Array.isArray(configuracoesPayload?.tags) && configuracoesPayload.tags.length > 0
            ? configuracoesPayload.tags.join(", ")
            : "—",
      },
      {
        id: "catalog-product-id",
        label: "Catalog product ID",
        value: configuracoesPayload?.catalog_product_id ?? "—",
      },
      {
        id: "is-catalog",
        label: "É catálogo",
        value: configuracoesPayload?.is_catalog_listing === true ? "Sim" : "Não",
      },
      {
        id: "last-updated",
        label: "Última atualização",
        value: configuracoesPayload?.last_updated ?? "—",
      },
    ],
    [configuracoesPayload, vm.marketplaceLabel, vm.status],
  );
  const resumoPayload =
    resumoDetail?.summary && typeof resumoDetail.summary === "object" ? resumoDetail.summary : null;
  const qualitySummary = useMemo(
    () => normalizeListingQualitySummary(listing, resumoDetail?.quality),
    [listing, resumoDetail?.quality],
  );
  const purchaseExperienceSummary = useMemo(
    () => normalizeListingPurchaseExperience(listing, resumoDetail?.purchase_experience),
    [listing, resumoDetail?.purchase_experience],
  );
  const marketplaceEditUrlResumo = useMemo(() => {
    const url = resumoDetail?.marketplace_edit_url ?? resumoDetail?.external_edit_url;
    if (url == null || String(url).trim() === "") return null;
    const text = String(url).trim();
    return /^https?:\/\//i.test(text) ? text : null;
  }, [resumoDetail?.marketplace_edit_url, resumoDetail?.external_edit_url]);
  const objetivosQualidadeClicaveis = useMemo(
    () =>
      objetivosQualidadeSaoClicaveis(
        qualitySummary.objectives_label,
        qualitySummary.objectives_count,
      ),
    [qualitySummary.objectives_label, qualitySummary.objectives_count],
  );
  const objetivosQualidadeLinkHref = useMemo(
    () => (objetivosQualidadeClicaveis ? marketplaceEditUrlResumo : null),
    [objetivosQualidadeClicaveis, marketplaceEditUrlResumo],
  );
  const experienciaRodapeResumo = useMemo(
    () => textoRodapeExperiencia(purchaseExperienceSummary.label, purchaseExperienceSummary.description),
    [purchaseExperienceSummary.label, purchaseExperienceSummary.description],
  );
  const statusSidebarLabel = useMemo(() => {
    const summary =
      editorDetail?.summary && typeof editorDetail.summary === "object" ? editorDetail.summary : null;
    return formatarStatusAnuncio(
      summary?.status_label ??
        summary?.status ??
        resumoPayload?.status_label ??
        resumoPayload?.status ??
        listing?.statusKey ??
        vm.status,
    );
  }, [editorDetail?.summary, resumoPayload, listing?.statusKey, vm.status]);
  const statusSidebarTone = useMemo(() => toneBadgeStatus(statusSidebarLabel), [statusSidebarLabel]);
  const tipoAnuncioSidebarLabel = useMemo(() => {
    const fromVm = vm.tipoAnuncio != null && String(vm.tipoAnuncio).trim() !== "" && vm.tipoAnuncio !== "—"
      ? String(vm.tipoAnuncio).trim()
      : null;
    if (fromVm) return fromVm;
    const settings =
      editorDetail?.settings && typeof editorDetail.settings === "object" ? editorDetail.settings : null;
    const typeId =
      settings?.listing_type_id ??
      listing?.listingTypeId ??
      listing?.listing_type_id ??
      listing?.listingTypeRaw;
    const formatted = formatarTipoAnuncioMl(typeId);
    return formatted ?? "—";
  }, [vm.tipoAnuncio, editorDetail?.settings, listing]);
  const tipoAnuncioSidebarTone = useMemo(
    () => classeBadgeTipoAnuncioSidebar(tipoAnuncioSidebarLabel),
    [tipoAnuncioSidebarLabel],
  );
  const conversaoResumoDisplay = useMemo(() => {
    const fromBackend = resumoPayload?.conversion_percent;
    if (fromBackend != null && Number.isFinite(Number(fromBackend))) {
      return formatPercentFromApiString(Number(fromBackend).toFixed(2));
    }
    const visitsAvailable = resumoPayload?.visits_available === true;
    const visits =
      visitsAvailable && resumoPayload?.visits != null && Number.isFinite(Number(resumoPayload.visits))
        ? Number(resumoPayload.visits)
        : null;
    const sold =
      resumoPayload?.sold_quantity != null && Number.isFinite(Number(resumoPayload.sold_quantity))
        ? Number(resumoPayload.sold_quantity)
        : null;
    if (visits != null && visits > 0 && sold != null && sold >= 0) {
      const conversion = new Decimal(sold).div(visits).times(100);
      return formatPercentFromApiString(conversion.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2));
    }
    return "—";
  }, [resumoPayload?.conversion_percent, resumoPayload?.sold_quantity, resumoPayload?.visits, resumoPayload?.visits_available]);

  const visitasResumoDisplay = useMemo(() => {
    const visitsAvailable = resumoPayload?.visits_available === true;
    if (!visitsAvailable) return "—";
    if (resumoPayload?.visits == null || !Number.isFinite(Number(resumoPayload.visits))) return "—";
    return Math.trunc(Number(resumoPayload.visits)).toLocaleString("pt-BR");
  }, [resumoPayload?.visits, resumoPayload?.visits_available]);

  const productSummary =
    resumoDetail?.product_summary && typeof resumoDetail.product_summary === "object"
      ? resumoDetail.product_summary
      : null;
  const costsSummary =
    resumoDetail?.costs_summary && typeof resumoDetail.costs_summary === "object"
      ? resumoDetail.costs_summary
      : null;
  const stockSummary =
    resumoDetail?.stock_summary && typeof resumoDetail.stock_summary === "object"
      ? resumoDetail.stock_summary
      : null;
  const imagesSummary =
    resumoDetail?.images_summary && typeof resumoDetail.images_summary === "object"
      ? resumoDetail.images_summary
      : null;
  const descriptionSummary =
    resumoDetail?.description_summary && typeof resumoDetail.description_summary === "object"
      ? resumoDetail.description_summary
      : null;
  const measurementsSummary =
    resumoDetail?.measurements_summary && typeof resumoDetail.measurements_summary === "object"
      ? resumoDetail.measurements_summary
      : null;

  const effectiveDescriptionText = useMemo(() => {
    if (descriptionSummary?.effective_description != null) {
      return String(descriptionSummary.effective_description);
    }
    return contentDescription !== "—" ? contentDescription : "";
  }, [descriptionSummary?.effective_description, contentDescription]);

  useEffect(() => {
    if (!open) return;
    const text = effectiveDescriptionText ?? "";
    setDescriptionBaseline(text);
    setDescricaoEdicao(text);
  }, [open, listing?.id, effectiveDescriptionText]);

  useEffect(() => {
    if (!open) return;
    const draft = listingMeasurementsSummaryToDraft(measurementsSummary);
    setMeasurementsBaseline(draft);
    setMeasurementsDraft(draft);
  }, [open, listing?.id, measurementsSummary]);

  useEffect(() => {
    if (!open) return;
    const keys = Array.isArray(imagesSummary?.ordered_picture_keys)
      ? imagesSummary.ordered_picture_keys
          .map((key) => (key != null ? String(key).trim() : ""))
          .filter(Boolean)
      : Array.isArray(imagesSummary?.pictures)
        ? imagesSummary.pictures
            .slice()
            .sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
            .map((pic) => {
              if (pic?.stable_key != null && String(pic.stable_key).trim() !== "") {
                return String(pic.stable_key).trim();
              }
              if (pic?.picture_id != null && String(pic.picture_id).trim() !== "") {
                return `id:${String(pic.picture_id).trim()}`;
              }
              if (pic?.url != null && String(pic.url).trim() !== "") {
                return `url:${String(pic.url).trim()}`;
              }
              return "";
            })
            .filter(Boolean)
        : [];
    setOrderedPictureKeysBaseline(keys);
    setOrderedPictureKeysDraft(keys);
  }, [open, listing?.id, imagesSummary?.ordered_picture_keys, imagesSummary?.pictures]);

  useEffect(() => {
    if (!open) return;
    const enabled =
      stockSummary?.listing_virtual_stock_override_enabled === true ||
      stockSummary?.listing_virtual_stock_enabled === true;
    const valueRaw = stockSummary?.listing_virtual_stock_value ?? stockSummary?.listing_virtual_stock;
    const mlStockRaw = stockSummary?.marketplace_listing_stock ?? stockSummary?.listing_stock ?? null;
    const mlStock =
      mlStockRaw != null && Number.isFinite(Number(mlStockRaw)) ? Math.trunc(Number(mlStockRaw)) : null;
    let value = "";
    if (enabled) {
      if (valueRaw != null) {
        value = String(valueRaw);
      } else if (mlStock != null) {
        value = String(mlStock);
      }
    }
    setStockOverrideEnabled(enabled);
    setStockOverrideValue(value);
    setStockFieldError("");
    setStockSettingsBaseline({ enabled, value: enabled ? valueRaw : null });
  }, [
    open,
    listing?.id,
    stockSummary?.listing_virtual_stock_override_enabled,
    stockSummary?.listing_virtual_stock_enabled,
    stockSummary?.listing_virtual_stock_value,
    stockSummary?.listing_virtual_stock,
    stockSummary?.marketplace_listing_stock,
    stockSummary?.listing_stock,
  ]);

  const resumoMetricas = useMemo(
    () => [
      {
        id: "visitas",
        label: "Visitas",
        value: visitasResumoDisplay,
        tone: "revenue",
      },
      {
        id: "conversao",
        label: "Conversão",
        value: conversaoResumoDisplay,
        tone: "conversion",
      },
    ],
    [visitasResumoDisplay, conversaoResumoDisplay],
  );

  const resumoKpiColunas = useMemo(
    () => [
      {
        id: "precos",
        ariaLabel: "Preços do anúncio",
        cards: [
          {
            id: "preco-venda",
            label: "Preço de venda",
            value: resumoSalePriceDisplay.value,
            secondaryValue: resumoSalePriceDisplay.secondaryValue,
            accent: "revenue",
          },
          {
            id: "preco-atacado",
            label: "Preço atacado",
            value: wholesaleSummary.label,
            accent: "orange",
            compactValue: true,
          },
        ],
      },
      {
        id: "performance",
        ariaLabel: "Visitas e conversão",
        cards: resumoMetricas.map((campo) => ({
          ...campo,
          accent: campo.id === "conversao" ? "orange" : "quantity",
        })),
      },
      {
        id: "envio-flex-frete",
        ariaLabel: "Envio Flex e frete grátis",
        cards: [
          {
            id: "envio-flex",
            label: "Envio Flex",
            value: shippingSummary.flex_label,
            accent: "quantity",
          },
          {
            id: "frete-gratis",
            label: "Frete grátis",
            value: shippingSummary.free_shipping_label,
            accent: "quantity",
          },
        ],
      },
      {
        id: "modalidade-servicos",
        ariaLabel: "Modalidade e serviços de entrega",
        cards: [
          {
            id: "modalidade-envio",
            label: "Envio",
            value: shippingSummary.mode_label,
            accent: "revenue",
          },
          {
            id: "servicos-entrega",
            label: "Entrega",
            value: shippingSummary.delivery_service_label ?? shippingSummary.delivery_program_label,
            accent: "orange",
          },
        ],
      },
    ],
    [resumoSalePriceDisplay, resumoMetricas, shippingSummary, wholesaleSummary.label],
  );

  const resumoDadosProduto = useMemo(() => {
    const brand =
      productSummary?.brand ??
      resumoPayload?.brand ??
      listing?.brand ??
      listing?.brandName ??
      null;
    const model = productSummary?.model ?? resumoPayload?.model ?? null;
    const eanGtin =
      productSummary?.ean_gtin ??
      resumoPayload?.ean_gtin ??
      resumoPayload?.universal_code ??
      listing?.gtin ??
      listing?.ean ??
      listing?.upc ??
      null;
    const ncm = productSummary?.ncm ?? resumoPayload?.ncm ?? null;

    return [
      { id: "marca", label: "Marca", value: textoResumoOuTraco(brand) },
      { id: "modelo", label: "Modelo", value: textoResumoOuTraco(model) },
      { id: "ean-gtin", label: "EAN / GTIN", value: textoResumoOuTraco(eanGtin) },
      { id: "ncm", label: "NCM", value: textoResumoOuTraco(ncm) },
    ];
  }, [productSummary, resumoPayload, listing?.brand, listing?.brandName, listing?.gtin, listing?.ean, listing?.upc]);

  const custosTabFields = useMemo(
    () => [
      {
        id: "custo-produto",
        label: "Custo do produto",
        value: formatBrlFromApiString(costsSummary?.product_cost_brl),
      },
      {
        id: "custo-embalagem",
        label: "Custo embalagem",
        value: formatBrlFromApiString(costsSummary?.packaging_cost_brl),
      },
      {
        id: "custo-operacional",
        label: "Custo operacional",
        value: formatBrlFromApiString(costsSummary?.operational_cost_brl),
      },
    ],
    [costsSummary],
  );

  const marketplaceListingStockRaw = useMemo(() => {
    const raw =
      stockSummary?.marketplace_listing_stock ??
      stockSummary?.listing_stock ??
      (resumoPayload?.available_quantity != null && Number.isFinite(Number(resumoPayload.available_quantity))
        ? Number(resumoPayload.available_quantity)
        : null);
    return raw != null && Number.isFinite(Number(raw)) ? Math.trunc(Number(raw)) : null;
  }, [stockSummary?.marketplace_listing_stock, stockSummary?.listing_stock, resumoPayload?.available_quantity]);

  const readonlyStockFields = useMemo(
    () => [
      {
        id: "estoque-produto",
        label: "Estoque do produto",
        value: formatarQuantidadeResumo(stockSummary?.product_stock),
      },
      {
        id: "estoque-minimo",
        label: "Estoque mínimo do produto",
        value: formatarEstoqueMinimoProduto(stockSummary?.product_min_stock),
      },
    ],
    [stockSummary?.product_stock, stockSummary?.product_min_stock],
  );

  const stockSettingsDraft = useMemo(() => {
    const enabled = stockOverrideEnabled === true;
    const normalized = enabled ? normalizarInteiroEstoqueVirtual(stockOverrideValue) : { ok: true, value: null, error: "" };
    return {
      enabled,
      value: enabled && normalized.ok ? normalized.value : null,
      valid: !enabled || normalized.ok,
    };
  }, [stockOverrideEnabled, stockOverrideValue]);

  const stockSettingsDirty = useMemo(() => {
    return (
      stockSettingsBaseline.enabled !== stockSettingsDraft.enabled ||
      String(stockSettingsBaseline.value ?? "") !== String(stockSettingsDraft.value ?? "")
    );
  }, [stockSettingsBaseline, stockSettingsDraft]);

  const pictureOrderDirty = useMemo(() => {
    return JSON.stringify(orderedPictureKeysBaseline) !== JSON.stringify(orderedPictureKeysDraft);
  }, [orderedPictureKeysBaseline, orderedPictureKeysDraft]);

  const descriptionDirty = useMemo(() => {
    return String(descriptionBaseline ?? "") !== String(descricaoEdicao ?? "");
  }, [descriptionBaseline, descricaoEdicao]);

  const measurementsDirty = useMemo(() => {
    return JSON.stringify(measurementsBaseline) !== JSON.stringify(measurementsDraft);
  }, [measurementsBaseline, measurementsDraft]);

  const podeSalvarAlteracoes =
    !stockSettingsSaving &&
    !pictureOrderSaving &&
    !descriptionSaving &&
    !measurementsSaving &&
    ((secaoAtiva?.id === "custos-estoque" &&
      stockSettingsDirty &&
      stockSettingsDraft.valid) ||
      (secaoAtiva?.id === "conteudo" && pictureOrderDirty) ||
      (secaoAtiva?.id === "configuracoes" && descriptionDirty) ||
      (secaoAtiva?.id === "pesos-medidas" && measurementsDirty));

  const handleSaveChanges = useCallback(async () => {
    if (!listing?.id) return;

    if (secaoAtiva?.id === "custos-estoque") {
      if (!stockSettingsDirty || !stockSettingsDraft.valid || stockSettingsSaving) return;

    const enabled = stockSettingsDraft.enabled;
    const nextValue = stockSettingsDraft.value;
    setStockFieldError("");

    if (enabled && nextValue == null) {
      const msg = "Informe o estoque virtual deste anúncio.";
      setStockFieldError(msg);
      addNotification({
        event_type: "LISTING_RAYX_SAVE_VALIDATION",
        entity_type: "listing",
        title: "Não foi possível salvar",
        message: msg,
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }

    setStockSettingsSaving(true);
    const res = await updateListingEditorStockSettings({
      listingId: String(listing.id),
      overrideEnabled: enabled,
      value: nextValue,
    });
    if (!res.ok) {
      addNotification({
        event_type: "LISTING_RAYX_SAVE_FAILED",
        entity_type: "listing",
        title: "Não foi possível salvar as alterações",
        message: res.error || "Tente novamente.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      setStockSettingsSaving(false);
      return;
    }

    setStockSettingsBaseline({ enabled, value: nextValue });
    addNotification({
      event_type: "LISTING_RAYX_SAVE_SUCCESS",
      entity_type: "listing",
      title: "Alterações salvas com sucesso",
      message: "A configuração de estoque virtual deste anúncio foi atualizada.",
      severity: NOTIFICATION_SEVERITY.INFO,
    });

    const refreshed = await fetchListingEditorDetail(String(listing.id));
    if (refreshed.ok) {
      setEditorDetail(normalizeListingEditorDetailResponse(refreshed.data, listing));
    }
    setStockSettingsSaving(false);
      return;
    }

    if (secaoAtiva?.id === "conteudo") {
      if (!pictureOrderDirty || pictureOrderSaving || orderedPictureKeysDraft.length === 0) return;

      setPictureOrderSaving(true);
      const res = await updateListingEditorPrimaryPictureSettings({
        listingId: String(listing.id),
        orderedPictureKeys: orderedPictureKeysDraft,
      });
      if (!res.ok) {
        addNotification({
          event_type: "LISTING_RAYX_PICTURE_ORDER_SAVE_FAILED",
          entity_type: "listing",
          title: "Não foi possível salvar as alterações",
          message: res.error || "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
        setPictureOrderSaving(false);
        return;
      }

      setOrderedPictureKeysBaseline([...orderedPictureKeysDraft]);
      addNotification({
        event_type: "LISTING_RAYX_PICTURE_ORDER_SAVE_SUCCESS",
        entity_type: "listing",
        title: "Alterações salvas com sucesso",
        message: "Ordem das imagens salva com sucesso.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });

      const refreshed = await fetchListingEditorDetail(String(listing.id));
      if (refreshed.ok) {
        setEditorDetail(normalizeListingEditorDetailResponse(refreshed.data, listing));
      }
      setPictureOrderSaving(false);
      return;
    }

    if (secaoAtiva?.id === "configuracoes") {
      if (!descriptionDirty || descriptionSaving) return;

      setDescriptionSaving(true);
      const res = await updateListingEditorDescriptionSettings({
        listingId: String(listing.id),
        descriptionText: descricaoEdicao,
      });
      if (!res.ok) {
        addNotification({
          event_type: "LISTING_RAYX_DESCRIPTION_SAVE_FAILED",
          entity_type: "listing",
          title: "Não foi possível salvar as alterações",
          message: res.error || "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
        setDescriptionSaving(false);
        return;
      }

      setDescriptionBaseline(descricaoEdicao);
      addNotification({
        event_type: "LISTING_RAYX_DESCRIPTION_SAVE_SUCCESS",
        entity_type: "listing",
        title: "Alterações salvas com sucesso",
        message: "A descrição deste anúncio foi salva no SUS7.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });

      const refreshed = await fetchListingEditorDetail(String(listing.id));
      if (refreshed.ok) {
        setEditorDetail(normalizeListingEditorDetailResponse(refreshed.data, listing));
      }
      setDescriptionSaving(false);
      return;
    }

    if (secaoAtiva?.id === "pesos-medidas") {
      if (!measurementsDirty || measurementsSaving) return;

      setMeasurementsSaving(true);
      const payload = listingMeasurementsDraftToSavePayload(measurementsDraft);
      const res = await updateListingEditorMeasurementSettings({
        listingId: String(listing.id),
        ...payload,
      });
      if (!res.ok) {
        addNotification({
          event_type: "LISTING_RAYX_MEASUREMENT_SAVE_FAILED",
          entity_type: "listing",
          title: "Não foi possível salvar as alterações",
          message: res.error || "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
        setMeasurementsSaving(false);
        return;
      }

      setMeasurementsBaseline({ ...measurementsDraft });
      addNotification({
        event_type: "LISTING_RAYX_MEASUREMENT_SAVE_SUCCESS",
        entity_type: "listing",
        title: "Alterações salvas com sucesso",
        message: "As medidas deste anúncio foram salvas no SUS7.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });

      const refreshed = await fetchListingEditorDetail(String(listing.id));
      if (refreshed.ok) {
        setEditorDetail(normalizeListingEditorDetailResponse(refreshed.data, listing));
      }
      setMeasurementsSaving(false);
    }
  }, [
    addNotification,
    descricaoEdicao,
    descriptionDirty,
    descriptionSaving,
    listing,
    measurementsDirty,
    measurementsDraft,
    measurementsSaving,
    orderedPictureKeysDraft,
    pictureOrderDirty,
    pictureOrderSaving,
    secaoAtiva?.id,
    stockSettingsDirty,
    stockSettingsDraft.valid,
    stockSettingsSaving,
    stockSettingsDraft.enabled,
    stockSettingsDraft.value,
  ]);

  const marketplaceStockLine = useMemo(() => {
    const productEnabled = stockSummary?.product_virtual_stock_enabled === true;
    const productValue = stockSummary?.product_virtual_stock_value ?? stockSummary?.product_virtual_stock ?? null;
    const productLabel = productValue != null ? formatarQuantidadeResumo(productValue) : "—";
    const readonlyValue =
      marketplaceListingStockRaw != null
        ? formatarQuantidadeResumo(marketplaceListingStockRaw)
        : formatarEstoque(listing);
    const inheritedLabel =
      productEnabled && productValue != null
        ? `Herdando estoque virtual do produto: ${productLabel}`
        : "Produto sem estoque virtual padrão";

    return {
      label: "Estoque no Mercado Livre",
      readonlyValue,
      virtualStock: {
        enabled: stockOverrideEnabled,
        value: stockOverrideValue,
        inheritedLabel,
        tooltipText:
          "O estoque virtual define a quantidade exibida/sincronizada no anúncio. O estoque real do produto continua sendo a fonte oficial para controle interno. Se o estoque real zerar futuramente, o sistema deverá pausar os anúncios para evitar venda sem produto disponível. Quando desmarcado, este anúncio herda o estoque virtual padrão do produto, se existir.",
        helperText: "Este valor será usado como estoque virtual estratégico deste anúncio.",
        error: stockFieldError,
        onEnabledChange: (checked) => {
          setStockOverrideEnabled(checked);
          if (checked) {
            setStockOverrideValue(
              marketplaceListingStockRaw != null ? String(marketplaceListingStockRaw) : "",
            );
          } else {
            setStockOverrideValue("");
          }
          setStockFieldError("");
        },
        onValueChange: (value) => {
          setStockOverrideValue(String(value ?? ""));
          setStockFieldError("");
        },
      },
    };
  }, [
    stockSummary?.product_virtual_stock_enabled,
    stockSummary?.product_virtual_stock_value,
    stockSummary?.product_virtual_stock,
    marketplaceListingStockRaw,
    listing,
    stockOverrideEnabled,
    stockOverrideValue,
    stockFieldError,
  ]);

  const salvarConteudo = useCallback(async () => {
    if (!listing?.id || !podeEditarConteudo) return;
    setContentSaving(true);
    setContentSaveMsg("");
    const res = await updateListingEditorContent({
      listingId: String(listing.id),
      ...(podeEditarTitulo ? { title: tituloEdicao } : {}),
      ...(podeEditarDescricao ? { description: descricaoEdicao } : {}),
    });
    if (!res.ok) {
      setContentSaveMsg(res.error || "Não foi possível salvar as alterações.");
      setContentSaving(false);
      return;
    }
    setContentSaveMsg("Alterações salvas com sucesso.");
    const refreshed = await fetchListingEditorDetail(String(listing.id));
    if (refreshed.ok) {
      const normalized = normalizeListingEditorDetailResponse(refreshed.data, listing);
      setEditorDetail(normalized);
      logRayxDetail("request_success", {
        listing_id: String(listing.id),
        status: refreshed.status ?? 200,
        reason: "content_refresh",
      });
      logRayxDetail("normalized_payload", {
        listing_id: String(listing.id),
        summary_keys: Object.keys(normalized?.summary ?? {}),
        quality_source: normalized?.quality?.source ?? null,
      });
    }
    setContentSaving(false);
  }, [descricaoEdicao, listing, listing?.id, podeEditarConteudo, podeEditarDescricao, podeEditarTitulo, tituloEdicao]);

  if (!open || listing == null || typeof document === "undefined") return null;

  const mainScrollClassName =
    secaoAtiva?.id === "configuracoes"
      ? "listing-rayx-modal__main-scroll listing-rayx-modal__main-scroll--description"
      : secaoAtiva?.id === "conteudo"
        ? "listing-rayx-modal__main-scroll listing-rayx-modal__main-scroll--images"
        : secaoAtiva?.id === "historico-vendas"
          ? "listing-rayx-modal__main-scroll listing-rayx-modal__main-scroll--scrollable-list"
          : secaoAtiva?.id === "vendas"
            ? "listing-rayx-modal__main-scroll listing-rayx-modal__main-scroll--vendas"
            : "listing-rayx-modal__main-scroll";

  const renderSecaoPrincipal = () => {
    if (vendasAtiva) {
      return (
        <div className="s7-rayx-sales-host">
          <ProductFinancialRayXPanel
            compact360
            tabTitle="Vendas"
            financialData={listingFinancial}
            sideIllustrationSrc="/listing-rayx/vendas-ecommerce-avatar.png"
            sideIllustrationAlt=""
          />
        </div>
      );
    }

    if (historicoAtivo) {
      return (
        <div className="listing-rayx-modal__scrollable-tab">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">Histórico de vendas</h3>
          <ProductSalesHistorySection
            embedded
            hideSectionTitle
            alwaysShowCount
            rows={listingFinancial.salesHistoryRows}
            total={listingFinancial.salesHistoryTotal}
            salesCount={
              listingFinancial.salesHistoryResolved ? listingFinancial.salesHistoryTotal : 0
            }
            page={listingFinancial.salesHistoryPage}
            totalPages={listingFinancial.salesHistoryTotalPages}
            loading={listingFinancial.salesHistoryLoading && !listingFinancial.salesHistoryResolved}
            error={listingFinancial.salesHistoryError}
            onPageChange={listingFinancial.goSalesHistoryPage}
          />
        </div>
      );
    }

    if (["resumo", "conteudo", "custos-estoque", "pesos-medidas", "configuracoes"].includes(secaoAtiva?.id ?? "")) {
      if (editorLoading && (secaoAtiva?.id ?? "") !== "resumo") {
        return (
          <div className="listing-rayx-modal__placeholder-tab" role="status" aria-live="polite">
            <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Aba"}</h3>
            <p className="hint">Carregando dados oficiais do anúncio...</p>
          </div>
        );
      }
      if (editorError && (secaoAtiva?.id ?? "") !== "resumo") {
        return (
          <div className="listing-rayx-modal__placeholder-tab" role="status" aria-live="polite">
            <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Aba"}</h3>
            <p className="hint">{editorError}</p>
          </div>
        );
      }
    }

    if (secaoAtiva?.id === "resumo") {
      return (
        <div className="listing-rayx-modal__overview-executive">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Resumo"}</h3>
          {resumoCarregando ? (
            <p className="hint listing-rayx-modal__tab-loading" role="status" aria-live="polite">
              Carregando informações...
            </p>
          ) : (
            <>
          <div className="listing-rayx-modal__resumo-top">
            <div className="listing-rayx-modal__resumo-meters">
              <ListingResumoKpiShell title="Qualidade do anúncio" accent="revenue">
                <ListingResumoSemiMeter
                  compact
                  inShell
                  displayValue={qualitySummary.display_value ?? "—"}
                  scorePercent={qualitySummary.score_percent}
                  levelLabel={qualitySummary.level_label}
                  footerText={qualitySummary.objectives_label}
                  footerLinkHref={objetivosQualidadeLinkHref}
                  tone={qualitySummary.tone ?? qualitySummary.status_tone ?? "neutral"}
                />
              </ListingResumoKpiShell>
              <ListingResumoKpiShell title="Experiência de compra" accent="revenue">
                <ListingResumoSemiMeter
                  compact
                  inShell
                  displayValue={purchaseExperienceSummary.display_value ?? "—"}
                  scorePercent={purchaseExperienceSummary.score_percent}
                  levelLabel={purchaseExperienceSummary.label}
                  footerText={experienciaRodapeResumo}
                  tone={purchaseExperienceSummary.tone ?? "neutral"}
                />
              </ListingResumoKpiShell>
            </div>
            {resumoKpiColunas.map((coluna) => (
              <div key={coluna.id} className="listing-rayx-modal__resumo-metric-col" aria-label={coluna.ariaLabel}>
                {coluna.cards.map((campo) => (
                  <ListingResumoKpiShell
                    key={campo.id}
                    title={campo.label}
                    accent={campo.accent ?? "neutral"}
                    titleCompact={campo.titleCompact === true}
                  >
                    <div className="listing-rayx-modal__resumo-metric-card listing-rayx-modal__resumo-metric-card--in-shell">
                      <span
                        className={[
                          "listing-rayx-modal__resumo-metric-value",
                          "listing-rayx-modal__resumo-metric-value--compact",
                          campo.compactValue || String(campo.value ?? "").length > 12
                            ? "listing-rayx-modal__resumo-metric-value--tight"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={campo.value}
                      >
                        {campo.value}
                      </span>
                      {campo.secondaryValue ? (
                        <span
                          className="listing-rayx-modal__resumo-metric-secondary listing-rayx-modal__resumo-metric-secondary--price-original"
                          title={campo.secondaryValue}
                        >
                          {campo.secondaryValue}
                        </span>
                      ) : null}
                    </div>
                  </ListingResumoKpiShell>
                ))}
              </div>
            ))}
          </div>

          <section className="listing-rayx-modal__resumo-section" aria-label="Dados do produto">
            <h4 className="listing-rayx-modal__resumo-section-title">Dados do produto</h4>
            <dl className="listing-rayx-modal__overview-grid">
              {resumoDadosProduto.map((campo) => (
                <div key={campo.id} className="listing-rayx-modal__overview-card">
                  <dt className="listing-rayx-modal__overview-label">{campo.label}</dt>
                  <dd className="listing-rayx-modal__overview-value" title={campo.value}>
                    {campo.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
            </>
          )}
        </div>
      );
    }

    if (secaoAtiva?.id === "conteudo") {
      return (
        <div className="listing-rayx-modal__overview-executive listing-rayx-modal__overview-executive--images">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Imagens"}</h3>
          <ListingRayxImagesPanel
            imagesSummary={imagesSummary}
            picturesFallback={contentPictures}
            orderedPictureKeys={orderedPictureKeysDraft}
            onReorder={setOrderedPictureKeysDraft}
          />
        </div>
      );
    }

    if (secaoAtiva?.id === "custos-estoque") {
      return (
        <div className="listing-rayx-modal__overview-executive">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Custos e estoque"}</h3>
          <ListingRayxCostsStockPanel
            costsFields={custosTabFields}
            readonlyStockFields={readonlyStockFields}
            marketplaceStock={marketplaceStockLine}
          />
        </div>
      );
    }

    if (secaoAtiva?.id === "pesos-medidas") {
      return (
        <div className="listing-rayx-modal__overview-executive">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Pesos e medidas"}</h3>
          <ListingRayxMeasurementsPanel draft={measurementsDraft} onChange={setMeasurementsDraft} />
        </div>
      );
    }

    if (secaoAtiva?.id === "configuracoes") {
      return (
        <div className="listing-rayx-modal__overview-executive listing-rayx-modal__overview-executive--description">
          <h3 className="pf-tab-title listing-rayx-modal__tab-title">{secaoAtiva?.label ?? "Descrição"}</h3>
          <ListingRayxDescriptionPanel value={descricaoEdicao} onChange={setDescricaoEdicao} />
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
              <div className="pf-product-thumb pf-right-panel-product-thumb pf-product-thumb--data-inline s7-operational-thumb-frame s7-operational-thumb-frame--circle">
                {vm.thumbnailUrl ? (
                  <img
                    src={vm.thumbnailUrl}
                    alt=""
                    className="s7-operational-thumb"
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

            <div className="listing-rayx-modal__sidebar-identity pf-right-product-headline">
              <S7CatalogListingHeadline
                className="pf-right-product-headline__headline s7-catalog-headline--product"
                layout="stacked"
                title={tituloSidebar}
                titleHref={listingPublicUrl}
                titleTooltip={tituloSidebar !== "—" ? tituloSidebar : ""}
                titleCopyValue={tituloSidebar !== "—" ? tituloSidebar : ""}
                listingId={listingIdDisplay !== "—" ? listingIdDisplay : ""}
                listingIdCopyValue={listingIdCopy}
                sku={skuDisplay}
                skuCopyValue={skuCopy}
                showSkuWhenEmpty
                skuEmptyLabel="—"
                copyTitleFlashKey="listing-rayx-title"
                copyListingFlashKey="listing-rayx-id"
                copySkuFlashKey="listing-rayx-sku"
              />

              <div className="listing-rayx-modal__sidebar-meta">
                <div className="listing-rayx-modal__sidebar-meta-top">
                  <span className="listing-rayx-modal__sidebar-channel">
                    <MarketplaceBadge
                      marketplace={vm.marketplaceSlug || vm.marketplaceRaw}
                      label={marketplaceFooterLabel}
                      size={16}
                      className="listing-rayx-modal__sidebar-marketplace-badge"
                    />
                    <span className="listing-rayx-modal__sidebar-channel-text">{marketplaceFooterLabel}</span>
                  </span>
                  <span className="listing-rayx-modal__sidebar-badges-row">
                    <span
                      className={`listing-rayx-modal__sidebar-listing-type listing-rayx-modal__sidebar-listing-type--${tipoAnuncioSidebarTone}`}
                    >
                      {tipoAnuncioSidebarLabel}
                    </span>
                    <span
                      className={`listing-rayx-modal__sidebar-status-badge listing-rayx-modal__sidebar-status-badge--${statusSidebarTone}`}
                      title={statusSidebarLabel}
                    >
                      {statusSidebarLabel}
                    </span>
                  </span>
                </div>
                <div className="listing-rayx-modal__sidebar-meta-bottom">
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
                    <span
                      role="button"
                      tabIndex={0}
                      className="listing-rayx-modal__share-action-btn"
                      aria-label={S7_MODAL_SHARE_ACTION_LABELS[actionId] ?? `Ação ${actionId}`}
                      onClick={handleSharePlaceholder}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSharePlaceholder();
                        }
                      }}
                    >
                      <S7ModalShareActionIcon actionId={actionId} />
                    </span>
                  </S7Tooltip>
                ))}
              </div>
            </div>

            <section className="listing-rayx-modal__main" aria-label="Visão geral do anúncio">
              <div className={mainScrollClassName}>
                {renderSecaoPrincipal()}
              </div>
              <footer className="listing-rayx-modal__main-footer pf-body-footer pf-body-footer--save-only pf-body-footer--modal-actions">
                <S7Button
                  type="button"
                  variant="primary"
                  className="pf-body-footer-btn"
                  onClick={handleSaveChanges}
                  loading={stockSettingsSaving || pictureOrderSaving || descriptionSaving || measurementsSaving}
                  loadingLabel="Salvando..."
                  disabled={!podeSalvarAlteracoes}
                >
                  Salvar alterações
                </S7Button>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

