// ======================================================================
// COMPONENTE: ProductForm (v2)
// Objetivo:
// - Cadastro/edição de produtos (modo página)
// - Abas (nova ordem):
//   Dados | Custos & precificação | Imagens | Variações | Descrição |
//   Estoque | Pesos & Medidas | Título do anúncio | Anúncios | Vendas & desempenho
//
// Regras (Suse7):
// - Frontend: UI/UX apenas (sem regra sensível).
// - Backend: validações definitivas, integrações e cálculos.
// - Precisão financeira: campos de valores seguem numeric no banco;
//   aqui (UI) mantemos strings onde o usuário digita.
// ======================================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { createPortal } from "react-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { useSaveStatus } from "../contexts/SaveStatusContext";
import {
  dispatchStockBelowMin,
  dispatchStockRealZero,
} from "../services/stockNotificationDispatch";
import { listLinks, relinkDraftToProduct } from "../services/images/imageRepository";
import { updateVariantsSortOrder } from "../services/variants/variantRepository";
import ProductFormImagesTab from "./ProductFormImagesTab";
import "./FieldLabel.css";
import "./ProductAdTitlesTab.css";
import { Trash2 } from "lucide-react";
import { SeoKeywordsInput } from "./SeoKeywordsInput";
import ProductHealthDetailsModal from "./ProductHealthDetailsModal";
import { fetchProductMarketplaceListings } from "../services/productListingsService";
import { fetchProductPerformance } from "../services/productPerformanceService";
import { getProductHealth } from "../services/productHealthService";
import { changeStatus } from "../services/productStatusService";
import { getPreferences, setPreference } from "../services/userPreferencesService";
import ExitWithoutSavingModal from "./ExitWithoutSavingModal";
import ProductFormRightPanel from "./ProductFormRightPanel";
import ProductVariationsTab from "./ProductVariationsTab";
import { S7Button, S7FormSavingOverlay, S7Input } from "./ui";
import { useFormValidation } from "../hooks/useFormValidation";
import "./ProductForm.css";
import { useFormProgress } from "../hooks/useFormProgress";
import {
  buildImageProgressSnapshot,
  normalizeImageProgress,
  variantProgressRowId,
} from "../utils/formProgress";
import {
  PRODUCT_FORM_MSG,
  isCostPositiveFromBrlDigits,
  isCostPositive,
  isVariantLineCostPositive,
} from "../utils/productReadiness";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import {
  pickFirstImageLinkStoragePath,
  resolveProductImageSrc,
  useProductMainImageSrc,
} from "../utils/productImageDisplayUrl";
import {
  normalizeProductImagesForPayload,
  persistProductImagesAfterCreate,
  resolvePrimaryImageFromLinks,
} from "../utils/productImagesPersistence";
import { formatMarketplaceListingDisplayId } from "../utils/marketplaceListingId";
import { formatCatalogBRL, marketplaceChipLabel } from "../utils/productCatalogRow";
import { computeVariantSkuErrors } from "../utils/variantSkuValidation";
import {
  PRODUCT_CM_FIELDS,
  PRODUCT_DECIMAL_MEASURE_FIELDS,
  formatCmInput,
  formatKgInput,
  measureDecimalOnKeyDown,
  parseDecimalBR,
  toCmInputValue,
  toKgInputValue,
  validateProductMeasureFields,
} from "../utils/numberFormat";
import { apiMoneyValueToDigits } from "../utils/currencyDigits";

const PF_MEASURES_TAB_TOOLTIP =
  "O comprimento mede a dimensão mais longa de um objeto (geralmente da frente para trás), enquanto a largura mede a dimensão mais curta, perpendicular ao comprimento (geralmente de um lado a outro). Ambas são medidas horizontais, enquanto a altura é a vertical.";

/** Campos derivados da API (GET for-edit) — não enviar no upsert. */
const READ_ONLY_PRODUCT_API_FIELDS = /** @type {const} */ ([
  "is_product_ready",
  "missing_fields",
  "product_completeness_score",
]);

/**
 * @param {Record<string, unknown> | null | undefined} obj
 */
function omitReadOnlyProductFields(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = { ...obj };
  for (const k of READ_ONLY_PRODUCT_API_FIELDS) {
    delete out[k];
  }
  return out;
}

// ======================================================================
// SUSE7 — HELPERS: Currency BRL (UI)
// Objetivo:
// - Input com máscara "R$" e aceitando somente números
// - Digitação estilo maquininha: 1234 => R$ 12,34
// - Frontend apenas UX (cálculo sensível continua no backend)
// ======================================================================

// ------------------------------------------------------------
// Converte string de dígitos ("1234") para string BRL "R$ 12,34"
// ------------------------------------------------------------
function s7FormatBRLFromDigits(digitsOnly) {
  const digits = (digitsOnly || "").replace(/\D/g, ""); // ✅ só números
  if (!digits) return "R$ 0,00";

  const cents = parseInt(digits, 10);
  const value = cents / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ------------------------------------------------------------
// Extrai dígitos de um valor exibido (ex: "R$ 12,34" => "1234")
// ------------------------------------------------------------
function s7ExtractDigits(value) {
  return (value || "").replace(/\D/g, "");
}

// ======================================================================
// HELPER: dígitos ("450") => decimal string ("4.50")
// Objetivo: manter precisão e evitar float no frontend
// ======================================================================
function s7DigitsToDecimalStr(digitsOnly) {
  const digits = (digitsOnly || "").replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toFixed(2);
}

/** Custo vindo da API (reais) → string decimal do form ("89.90"), alinhado à máscara por dígitos */
function normalizeCostPriceFromApi(cp) {
  if (cp == null || cp === "") return "";
  const d = apiMoneyValueToDigits(cp);
  return d === "" ? "" : s7DigitsToDecimalStr(d);
}


// ======================================================================
// HELPER: ID seguro (fora do componente)
// Objetivo: gerar ids estáveis para rows de UI sem recriar função a cada render
// ======================================================================
const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

// ----------------------------------------------------------------------
// Health: cálculo de percentual (MVP simples, backend é fonte de verdade)
// percent = 100 - min(blocking*15, 70) - min(warnings*5, 30)
// Se readyToPublish => 100
// ----------------------------------------------------------------------
function calcPercentFromHealth(health) {
  if (!health) return 0;
  if (health.readyToPublish === true) return 100;
  const blocking = Math.max(0, parseInt(health.blocking?.length ?? 0, 10));
  const warnings = Math.max(0, parseInt(health.warnings?.length ?? 0, 10));
  let percent = 100 - Math.min(blocking * 15, 70) - Math.min(warnings * 5, 30);
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export default function ProductForm({
  title = "Novo produto",
  mode = "create", // "create" | "edit"
  /** "guided" = cadastro com validação por etapa e desbloqueio progressivo; "free" = edição, qualquer aba */
  navigationMode = "guided",
  initialProduct = null,
  initialVariants = null, // lista de product_variants (quando edit, ordenada por sort_order)
  initialVariations = null, // alias para initialVariants
  initialTab = null, // ex: "stock" para deep link ?tab=stock
  onCancel = null,
  onSubmit = null,
  onSuccess = null, // opcional: após salvar + toast + redirect (ex.: analytics)
}) {
  const navigate = useNavigate();

  const draftIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const draftKeyRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  // ------------------------------------------------------
  // STATE: PRODUTO (alinhado com tabela products)
  // Deve vir antes de hasVariations/availableTabs que dependem dele
  // ------------------------------------------------------
  const [product, setProduct] = useState({
    // =========================
    // DADOS
    // =========================
    product_name: "",
    format: "simple", // "simple" | "variants"
    sku: "",
    sku_base: "", // raiz persistida (variants); mesma base para novas variações no edit
    gtin: "",
    ncm: "",
    brand: "",
    model: "",
    seo_keywords: "",

    // =========================
    // CUSTOS & PRECIFICAÇÃO
    // =========================
    cost_price: "",
    packaging_cost: "",
    operational_cost: "",

    // =========================
    // DESCRIÇÃO
    // =========================
    description: "",

    // =========================
    // ESTOQUE
    // =========================
    stock_quantity: "",
    stock_minimum: "",
    use_virtual_stock: false,
    virtual_stock_quantity: 0,
    notes: "",

    // =========================
    // PESOS & MEDIDAS
    // =========================
    width: "",
    height: "",
    length: "",
    weight: "",
    assembled_width: "",
    assembled_height: "",
    assembled_length: "",
    assembled_weight: "",

    // =========================
    // IMAGENS (UI only por enquanto)
    // - hoje seu banco está text; pode ser URL única ou serializado.
    // - aqui a gente só exibe preview (Img1) se vier.
    // =========================
    product_images: null,

    // =========================
    // TÍTULOS DO ANÚNCIO (até 10 por produto)
    // - Formato: [{ id, value }]
    // - Backend valida duplicidade e regras por marketplace
    // =========================
    ad_titles: [{ id: createId(), value: "" }],

    // =========================
    // SISTEMA
    // =========================
    active: true,
  });

  // ------------------------------------------------------
  // CONTROLE DE ABAS (nova ordem)
  // Variações só existe quando format=variants
  // ------------------------------------------------------
  const [activeTab, setActiveTab] = useState(initialTab || "data");
  const hasVariations = product?.format === "variants";

  // ======================================================
  // CONTROLE DE ABAS DESBLOQUEADAS (Suse7)
  // Índice máximo alcançado em availableTabIds; abas com index <= max podem ser abertas pelo painel.
  // ======================================================
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const prevAvailableTabIdsRef = useRef(null);

  const availableTabs = useMemo(() => {
    const base = [
      { id: "data", label: "Dados" },
      ...(hasVariations ? [{ id: "variations", label: "Variações" }] : []),
      { id: "pricing", label: "Custos & precificação" },
      { id: "stock", label: "Estoque" },
      { id: "images", label: "Imagens" },
      { id: "ad_titles", label: "Título do anúncio" },
      { id: "description", label: "Descrição" },
      { id: "measures", label: "Pesos & medidas" },
      { id: "ads", label: "Anúncios" },
      { id: "performance", label: "Vendas & desempenho" },
    ];
    return base;
  }, [hasVariations]);

  const availableTabIds = useMemo(() => availableTabs.map((t) => t.id), [availableTabs]);
  const allStepsUnlocked = navigationMode === "free";
  const safeTab = availableTabIds.includes(activeTab) ? activeTab : availableTabIds[0];
  const safeTabIndex = Math.max(0, availableTabIds.indexOf(safeTab));
  const isFirstStep = safeTabIndex === 0;
  const isLastStep = safeTabIndex === availableTabIds.length - 1;

  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const productSubmitInFlightRef = useRef(false);

  /** Navegação programática: garante que a aba de destino fique acessível no painel (validação, modais, SEO). */
  const navigateToTabWithUnlock = useCallback(
    (tabId) => {
      const idx = availableTabIds.indexOf(tabId);
      if (idx < 0) return;
      setMaxReachedIndex((prev) => Math.max(prev, idx));
      setActiveTab(tabId);
    },
    [availableTabIds]
  );
  const hasVisitedVariationsTabRef = useRef(false);
  const [collapseVariationsConfigOnEnter, setCollapseVariationsConfigOnEnter] = useState(false);
  const prevSafeTabRef = useRef(safeTab);

  useEffect(() => {
    if (!availableTabIds.includes(activeTab)) {
      if (import.meta.env?.DEV) {
        console.error("[ProductForm] activeTab inválido (aba indisponível), corrigindo:", {
          activeTab,
          hasVariations,
          availableTabIds,
        });
      }
      setActiveTab(availableTabIds[0]);
    }
  }, [activeTab, availableTabIds, hasVariations]);

  // Deep link ?tab=… — abre a aba e desbloqueia o percurso até ela (antes da pintura, evita passo ativo “travado”)
  useLayoutEffect(() => {
    if (initialTab && availableTabIds.includes(initialTab)) {
      setActiveTab(initialTab);
      const idx = availableTabIds.indexOf(initialTab);
      setMaxReachedIndex((prev) => Math.max(prev, idx));
    }
  }, [initialTab, availableTabIds]);

  // Edição: todas as abas acessíveis no painel (sem progressão)
  useLayoutEffect(() => {
    if (!allStepsUnlocked) return;
    const last = availableTabIds.length - 1;
    if (last >= 0) setMaxReachedIndex(last);
  }, [allStepsUnlocked, availableTabIds]);

  // Formato simples ↔ variações: realinha índice máximo ao mudar a lista de abas
  useEffect(() => {
    const oldIds = prevAvailableTabIdsRef.current;
    const newIds = availableTabIds;

    if (allStepsUnlocked) {
      prevAvailableTabIdsRef.current = newIds;
      return;
    }

    if (oldIds != null && oldIds.join() === newIds.join()) return;

    if (oldIds == null) {
      prevAvailableTabIdsRef.current = newIds;
      return;
    }

    setMaxReachedIndex((prev) => {
      const idAtMax = oldIds[prev];
      if (idAtMax == null) return Math.min(prev, newIds.length - 1);
      const newIdx = newIds.indexOf(idAtMax);
      if (newIdx >= 0) return newIdx;
      return Math.min(prev, newIds.length - 1);
    });
    prevAvailableTabIdsRef.current = newIds;
  }, [availableTabIds, allStepsUnlocked]);

  const goToPreviousStep = () => {
    if (isSavingProduct) return;
    if (isFirstStep) return;
    const prevId = availableTabIds[safeTabIndex - 1];
    if (prevId) setActiveTab(prevId);
  };

  const focusFirstInvalidField = (tabId) => {
    if (typeof document === "undefined") return;
    requestAnimationFrame(() => {
      const root = document.querySelector(".pf-body");
      if (!root) return;

      if (tabId === "variations" && product.format === "variants" && (!Array.isArray(variantRows) || variantRows.length === 0)) {
        const variationsCard = root.querySelector(".pf-variations-config-card");
        if (variationsCard) {
          if (typeof variationsCard.focus === "function") {
            variationsCard.focus({ preventScroll: true });
          }
          if (typeof variationsCard.scrollIntoView === "function") {
            variationsCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      }

      const invalid = root.querySelector(
        ".s7-input--error, .s7-select.s7-input--error, .pf-chipbox.s7-input--error, [aria-invalid='true']"
      );
      if (!invalid) return;

      const focusTarget =
        invalid.matches("input, select, textarea, button, [tabindex]") ? invalid : invalid.querySelector("input, select, textarea, button, [tabindex]");
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus({ preventScroll: true });
      }

      if (typeof invalid.scrollIntoView === "function") {
        invalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };

  const validateCurrentStep = () => {
    switch (safeTab) {
      case "data":
        return validateDataTabEssentials();
      case "variations":
        return validateVariantsTab();
      case "pricing":
        return validatePricingTab();
      case "stock":
        return validateStockTab();
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (isSavingProduct) return;
    if (!allStepsUnlocked) {
      if (safeTab === "variations") {
        setVariationsSubmitAttempted(true);
      }
      const isStepValid = validateCurrentStep();
      if (!isStepValid) {
        focusFirstInvalidField(safeTab);
        return;
      }
    }
    if (isLastStep) return;
    const nextIdx = safeTabIndex + 1;
    const nextId = availableTabIds[nextIdx];
    if (!nextId) return;
    setMaxReachedIndex((prev) => Math.max(prev, nextIdx));
    setActiveTab(nextId);
  };

  // ------------------------------------------------------
  // STATE: ERROS (UX)
  // ------------------------------------------------------
  const [errors, setErrors] = useState({});

// ======================================================================
// STATE: Erros SKU por variação (UX)
// Regra: no formato variants, SKU é obrigatório em cada variação
// ======================================================================
const [skuErrorsById, setSkuErrorsById] = useState({});

  // Variações: SKU — erro visível só após blur no campo ou Avançar/Salvar/painel (não ao gerar linhas)
  const [variationsTouchedFields, setVariationsTouchedFields] = useState({});
  const [variationsSubmitAttempted, setVariationsSubmitAttempted] = useState(false);

  // ------------------------------------------------------
  // STATE: Erros da aba Estoque (feedback opcional em blur — não bloqueia wizard)
  // ------------------------------------------------------
  const [stockErrors, setStockErrors] = useState({});

  // ------------------------------------------------------
  // MODAL: confirmação ao salvar com estoque zerado
  // ------------------------------------------------------
  const [zeroStockModalOpen, setZeroStockModalOpen] = useState(false);
  const [zeroStockModalData, setZeroStockModalData] = useState(null); // { count, examples } quando format === "variants"
  const [zeroStockAttention, setZeroStockAttention] = useState(null); // { simple: boolean, variants: { [rowId]: true } } ao voltar do modal

  // ======================================================================
// STATE: Erros da aba Custos & Precificação (UX) — obrigatório
// ======================================================================
const [costErrors, setCostErrors] = useState({
  simpleCost: false,
  variantsMissingIds: [],
});

// ------------------------------------------------------
// MODAL: confirmação estoque virtual (ativar/desativar)
// ------------------------------------------------------
const [virtualModalOpen, setVirtualModalOpen] = useState(false);
const [virtualModalMode, setVirtualModalMode] = useState("enable"); // "enable" | "disable"
const [pendingVariantId, setPendingVariantId] = useState(null);
const [pendingNextChecked, setPendingNextChecked] = useState(false);

  // ------------------------------------------------------
  // MODAL: confirmação ao voltar para Simples (draft com variações)
  // Regra: se draft tem variações e usuário quer Simples, pedir confirmação
  // ------------------------------------------------------
  const [formatToSimpleModalOpen, setFormatToSimpleModalOpen] = useState(false);

  // ------------------------------------------------------
  // MODAL: confirmação exclusão de título do anúncio (padrão Suse7)
  // ------------------------------------------------------
  const [adTitleDeleteId, setAdTitleDeleteId] = useState(null);

  // ------------------------------------------------------
  // HEALTH: progresso circular do cadastro (backend como fonte de verdade)
  // ------------------------------------------------------
  const [productHealth, setProductHealth] = useState(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthModalBannerMessage, setHealthModalBannerMessage] = useState(null); // ex: PRODUCT_NOT_READY
  const [healthProductId, setHealthProductId] = useState(null); // para create: id após save
  const [markReadyLoading, setMarkReadyLoading] = useState(false);
  const [exitWithoutSavingHidden, setExitWithoutSavingHidden] = useState(false);
  const healthLastFetchRef = useRef(0);
  const lastSavedSnapshotRef = useRef(null);

  // ------------------------------------------------------
  // VARIAÇÕES (estilo Bling)
  // 1) variationAttributes: lista de atributos cadastrados (Cor, Tamanho)
  // 2) draft: inputs para cadastrar novo atributo + opções (chips)
  // 3) variantRows: combinações geradas (cada uma vira product_variants)
  // ------------------------------------------------------
  const { addNotification } = useNotifications();
  const saveStatus = useSaveStatus();

  const [variationAttributes, setVariationAttributes] = useState([]);
  const [draftAttrInput, setDraftAttrInput] = useState("");
  const [draftOptionInput, setDraftOptionInput] = useState("");
  const [draftOptions, setDraftOptions] = useState([]);

// ------------------------------------------------------
// CHIP DO ATRIBUTO (ex: Cor, Tamanho)
// Regra: apenas 1 ativo por vez
// ------------------------------------------------------
const [draftAttrChips, setDraftAttrChips] = useState([]);


  const [variantRows, setVariantRows] = useState([]);

  useEffect(() => {
    const prevTab = prevSafeTabRef.current;
    if (prevTab === "variations" && safeTab !== "variations") {
      setVariationsTouchedFields({});
      setVariationsSubmitAttempted(false);
    }

    if (safeTab === "variations") {
      hasVisitedVariationsTabRef.current = true;
    }

    if (
      prevTab === "variations" &&
      safeTab !== "variations" &&
      product.format === "variants" &&
      Array.isArray(variantRows) &&
      variantRows.length > 0
    ) {
      setCollapseVariationsConfigOnEnter(true);
    }

    if (product.format !== "variants" || !Array.isArray(variantRows) || variantRows.length === 0) {
      setCollapseVariationsConfigOnEnter(false);
      hasVisitedVariationsTabRef.current = false;
    }

    prevSafeTabRef.current = safeTab;
  }, [safeTab, product.format, variantRows]);

  // SKU por variação: obrigatório + duplicidade em tempo real (sincroniza com variantRows)
  useEffect(() => {
    if (product.format !== "variants") {
      setSkuErrorsById({});
      setVariationsTouchedFields({});
      setVariationsSubmitAttempted(false);
      return;
    }
    setSkuErrorsById(computeVariantSkuErrors(variantRows));
  }, [product.format, variantRows]);

  // ======================================================================
// SUSE7 — VARIAÇÕES: Modal de confirmação ao excluir variação
// - deleteVariantRowId: id da linha em confirmação (null = modal fechado)
// ======================================================================
const [deleteVariantRowId, setDeleteVariantRowId] = useState(null);

// ------------------------------------------------------
// SUSE7 — VARIAÇÕES: Modais da geração de SKU (global, regeração, individual, integrada)
// - skuSuccessModal: após geração global (X gerados, Y mantidos)
// - skuRegenerateModalOpen: super alerta quando já existem SKUs (3 ações)
// - skuIndividualModal: confirmação ao gerar SKU em linha que já tem SKU
// - skuManualIntegratedModal: alerta ao alterar SKU manualmente em variação integrada (backend: row.linked_to_marketplaces)
// - skuAtFocusRef: SKU ao focar no input (para fluxo de alteração manual integrada)
// ------------------------------------------------------
const [skuSuccessModal, setSkuSuccessModal] = useState({ show: false, generated: 0, kept: 0 });
const [skuRegenerateModalOpen, setSkuRegenerateModalOpen] = useState(false);
const [skuIndividualModal, setSkuIndividualModal] = useState(null); // { rowId, currentSku, newSku }
const [skuManualIntegratedModal, setSkuManualIntegratedModal] = useState(null); // { rowId, nextSku }
const skuAtFocusRef = useRef({});

// ------------------------------------------------------
// SUSE7 — Raiz do SKU (aba Variações)
// Origem oficial: product.sku_base. Formato persistido: chave1_chave2 (uma ou duas chaves com "_").
// Chips na UI (máx. 2 chaves, 6 caracteres cada); leitura ao abrir, escrita ao editar, enviado no payload do save.
// ------------------------------------------------------
const [skuBaseChips, setSkuBaseChips] = useState([]);
const [skuBaseInput, setSkuBaseInput] = useState("");
const [skuBaseError, setSkuBaseError] = useState("");
const skuBaseInputRef = useRef(null);
/** ProductVariationsTab registra aqui função para expandir o card "Configuração de variações" (Raiz do SKU). */
const expandVariationsConfigRef = useRef(null);

// ------------------------------------------------------
// Adicionar chip (opção) em atributo existente
// - Controla qual atributo está "em modo adicionar opção"
// ------------------------------------------------------
const [addOptionAttrId, setAddOptionAttrId] = useState(null);
const [addOptionInput, setAddOptionInput] = useState("");
const [addOptionError, setAddOptionError] = useState("");


  // ======================================================================
// STATE: Custos (UI) com máscara BRL
// Regra:
// - Guardamos "somente dígitos" no state (ex: "450" => R$ 4,50)
// - Exibimos formatado com Intl
// - No submit, convertemos para string decimal "4.50"
// ======================================================================
const [packagingDigits, setPackagingDigits] = useState("");     // embalagem
const [operationalDigits, setOperationalDigits] = useState(""); // operacional
const [simpleCostDigits, setSimpleCostDigits] = useState("");   // custo simples


// Custos por variação (id => dígitos)
const [variantCostDigitsById, setVariantCostDigitsById] = useState({});

/** Imagens no progresso: 1 flag produto (simples) ou 1 flag por chave de variação */
const [imageProgress, setImageProgress] = useState(() => ({
  productHasImage: false,
  variantHasImageByKey: {},
}));

const buildVariantKey = useCallback((attrsObj) => {
  const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
}, []);

// ------------------------------------------------------
// SUSE7 — VARIAÇÕES
// Flag: já existem variações cadastradas?
// ------------------------------------------------------
const hasAnyVariation = variationAttributes.length > 0;

const [productAdsListings, setProductAdsListings] = useState(/** @type {unknown[]} */ ([]));
const [productAdsListingsLoading, setProductAdsListingsLoading] = useState(false);
const [productAdsListingsError, setProductAdsListingsError] = useState(/** @type {string | null} */ (null));
const [productPerformance, setProductPerformance] = useState(null);
const [productPerformanceLoading, setProductPerformanceLoading] = useState(false);
const [productPerformanceError, setProductPerformanceError] = useState(/** @type {string | null} */ (null));

// ----------------------------------------------------------------------
// Guard: snapshot determinístico (evitar falso dirty)
// stableStringify ordena chaves recursivamente para serialização estável
// ----------------------------------------------------------------------
function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    const arr = obj.map((v) => {
      const s = stableStringify(v);
      return typeof v === "object" && v !== null && !Array.isArray(v) && "id" in v
        ? { k: String(v?.id ?? ""), s }
        : { k: s, s };
    });
    arr.sort((a, b) => a.k.localeCompare(b.k));
    return "[" + arr.map((x) => x.s).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]));
  return "{" + pairs.join(",") + "}";
}

function getFormSnapshotForGuard(p, rows, attrs) {
  const prod = { ...(p || {}), product_images: null };
  const sortedRows = [...(rows || [])].sort((a, b) => String(a?.id ?? "").localeCompare(String(b?.id ?? "")));
  const sortedAttrs = [...(attrs || [])].map((a) => ({
    ...a,
    options: [...(a?.options || [])].sort((x, y) => String(x).localeCompare(String(y))),
  })).sort((a, b) => String(a?.id ?? "").localeCompare(String(b?.id ?? "")));
  return stableStringify({ product: prod, variantRows: sortedRows, variationAttributes: sortedAttrs });
}

/** JSONB/API pode devolver objeto, string JSON ou formato inesperado — grid espera objeto plano. */
function normalizeVariantAttributesFromApi(raw) {
  if (raw == null) return {};
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return {};
    try {
      const p = JSON.parse(t);
      return p && typeof p === "object" && !Array.isArray(p) ? { ...p } : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return { ...raw };
  }
  return {};
}

// ------------------------------------------------------
// HIDRATAR FORM (modo edição)
// ------------------------------------------------------
useLayoutEffect(() => {
  let snapshotProductMerge = null;

  // ------------------------------------------------------
  // Produto base
  // ------------------------------------------------------
  if (initialProduct) {
    const toMerge = { ...initialProduct };
    // Normalizar ad_titles: backend pode retornar { id, title } ou { id, value }
    // Regra: sempre iniciar com pelo menos 1 título
    if (!toMerge.ad_titles || !Array.isArray(toMerge.ad_titles) || toMerge.ad_titles.length === 0) {
      toMerge.ad_titles = [{ id: createId(), value: "" }];
    } else {
      toMerge.ad_titles = toMerge.ad_titles.map((t) => ({
        id: t.id || createId(),
        value: t.title !== undefined ? t.title : (t.value ?? ""),
      }));
    }
    // Pesos & medidas: string mascarada (nunca number no state vindo da API)
    for (const k of PRODUCT_DECIMAL_MEASURE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(toMerge, k)) {
        const v = toMerge[k];
        if (v == null || String(v).trim() === "") {
          toMerge[k] = "";
        } else {
          toMerge[k] = PRODUCT_CM_FIELDS.includes(k)
            ? toCmInputValue(v)
            : toKgInputValue(v);
        }
      }
    }
    // Custos: normalizar para string decimal (igual ao fluxo do cadastro) — API pode mandar number 89.9
    for (const key of ["cost_price", "packaging_cost", "operational_cost"]) {
      if (!Object.prototype.hasOwnProperty.call(toMerge, key)) continue;
      const raw = toMerge[key];
      if (raw == null || raw === "") {
        toMerge[key] = "";
      } else {
        const d = apiMoneyValueToDigits(raw);
        toMerge[key] = d === "" ? "" : s7DigitsToDecimalStr(d);
      }
    }

    // Variantes: raiz persistida em products.sku_base; legado sem coluna usa SKU pai
    const fmtMerge = String(toMerge.format || "").toLowerCase();
    if (fmtMerge === "variants") {
      const sb =
        toMerge.sku_base != null && String(toMerge.sku_base).trim() !== ""
          ? String(toMerge.sku_base).trim()
          : "";
      const parentSku = toMerge.sku != null ? String(toMerge.sku).trim() : "";
      if (!sb && parentSku) {
        toMerge.sku_base = parentSku;
      }
    }

    snapshotProductMerge = toMerge;
    setProduct((prev) => ({ ...prev, ...toMerge }));

    // ------------------------------------------------------
    // HIDRATAR: dígitos da máscara BRL (mesma regra que apiMoneyValueToDigits)
    // ------------------------------------------------------
    setPackagingDigits(apiMoneyValueToDigits(initialProduct.packaging_cost));
    setOperationalDigits(apiMoneyValueToDigits(initialProduct.operational_cost));
    setSimpleCostDigits(apiMoneyValueToDigits(initialProduct.cost_price));
  }

  // ------------------------------------------------------
  // HIDRATAR: custos por variação (id => dígitos) — SAFE
  // ------------------------------------------------------
  setVariantCostDigitsById(() => {
    const map = {};
    const vs = initialVariants ?? initialVariations;
    (Array.isArray(vs) ? vs : []).forEach((v) => {
      const id = v?.id || null;
      if (!id) return;

      map[id] = apiMoneyValueToDigits(v?.cost_price);
    });

    return map;
  });

  // ------------------------------------------------------
  // Se vierem variantes prontas (edit), carregamos no grid
  // Usar listVariants(productId) para carregar ordenado por sort_order
  // ------------------------------------------------------
  const variants = initialVariants ?? initialVariations;
  const variantList = Array.isArray(variants) ? variants : [];

  if (variantList.length > 0) {
    setVariantRows(
      variantList.map((v) => ({
        id: v.id || createId(),
        sku: v.sku || "",
        gtin: v.gtin || "",

        cost_price: normalizeCostPriceFromApi(v.cost_price),

        // estoque por variação (strings para inputs)
        stock_real: String(v.stock_quantity ?? ""),
        stock_min: String(v.stock_minimum ?? ""),
        use_virtual_stock: !!v.use_virtual_stock,
        stock_virtual: String(v.virtual_stock_quantity ?? 0),

        active: typeof v.active === "boolean" ? v.active : true,
        attributes: normalizeVariantAttributesFromApi(v.attributes),
      }))
    );

    // ------------------------------------------------------
    // Reconstroi variationAttributes (best effort)
    // ------------------------------------------------------
    const attrMap = new Map();

    variantList.forEach((v) => {
      const attrs = normalizeVariantAttributesFromApi(v.attributes);
      Object.entries(attrs).forEach(([k, val]) => {
        if (!attrMap.has(k)) attrMap.set(k, new Set());
        attrMap.get(k).add(String(val));
      });
    });

    const reconstructed = Array.from(attrMap.entries()).map(([name, setVals]) => ({
      id: createId(),
      name,
      options: Array.from(setVals),
    }));

    if (reconstructed.length > 0) {
      setVariationAttributes(reconstructed);
      setProduct((prev) => ({ ...prev, format: "variants" }));
    }
  } else if (
    mode === "edit" &&
    snapshotProductMerge &&
    String(snapshotProductMerge.format || "").toLowerCase() === "variants"
  ) {
    setVariantRows([]);
    setVariationAttributes([]);
  }

  // Snapshot inicial para dirty check (após hidratação)
  if (initialProduct) {
    const prod = snapshotProductMerge ? { ...product, ...snapshotProductMerge } : { ...product, ...initialProduct };
    const vs = variantList;
    const rows =
      vs.length > 0
        ? vs.map((v) => ({
            id: v.id || createId(),
            sku: v.sku || "",
            gtin: v.gtin || "",
            cost_price: normalizeCostPriceFromApi(v.cost_price),
            stock_real: String(v.stock_quantity ?? ""),
            stock_min: String(v.stock_minimum ?? ""),
            use_virtual_stock: !!v.use_virtual_stock,
            stock_virtual: String(v.virtual_stock_quantity ?? 0),
            active: typeof v.active === "boolean" ? v.active : true,
            attributes: normalizeVariantAttributesFromApi(v.attributes),
          }))
        : [];
    const attrMap = new Map();
    vs.forEach((v) => {
      const attrsNorm = normalizeVariantAttributesFromApi(v.attributes);
      Object.entries(attrsNorm).forEach(([k, val]) => {
        if (!attrMap.has(k)) attrMap.set(k, new Set());
        attrMap.get(k).add(String(val));
      });
    });
    const attrs = Array.from(attrMap.entries()).map(([name, setVals]) => ({
      id: createId(),
      name,
      options: Array.from(setVals),
    }));
    lastSavedSnapshotRef.current = getFormSnapshotForGuard(prod, rows, attrs);
  } else {
    lastSavedSnapshotRef.current = getFormSnapshotForGuard(product, variantRows, variationAttributes);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hidrata só a partir das props iniciais; `product` no snapshot usa closure do 1º paint (estado default + merge)
}, [initialProduct, initialVariants, initialVariations, mode]);

  // ------------------------------------------------------
  // GUARD: Sair sem salvar (dirty state + preferências)
  // formGuardEpoch: incrementa após salvar com sucesso para forçar recálculo de isDirty
  // (lastSavedSnapshotRef muda sem alterar product/rows — o useMemo precisaria disso).
  // ------------------------------------------------------
  const [formGuardEpoch, setFormGuardEpoch] = useState(0);
  const isDirty = useMemo(() => {
    const last = lastSavedSnapshotRef.current;
    if (last == null) return false;
    const current = getFormSnapshotForGuard(product, variantRows, variationAttributes);
    return current !== last;
  }, [product, variantRows, variationAttributes, formGuardEpoch]);

  // Carregar preferência "modal.exit_without_saving" no mount
  useEffect(() => {
    let cancelled = false;
    getPreferences("modal.").then(({ ok, data }) => {
      if (cancelled) return;
      const val = data?.["modal.exit_without_saving"];
      setExitWithoutSavingHidden(val?.hidden === true);
    });
    return () => { cancelled = true; };
  }, []);

  // beforeunload: aviso nativo ao fechar/recarregar (F5/fechar aba)
  useBeforeUnload(isDirty);

  // Bloqueio de navegação interna (menu, links, rota): exibe modal "Sair sem salvar?"
  const skipExitGuardRef = useRef(false); // bypass quando usuário confirmou saída
  /** Só após submit com redirect: evita race onde o blocker reabre o modal no mesmo tick */
  const suppressNextBlockerModalRef = useRef(false);
  const shouldBlockNav = isDirty && !exitWithoutSavingHidden && !skipExitGuardRef.current;
  const blocker = useBlocker(shouldBlockNav);

  // Modal "Sair sem salvar" (Fechar ou navegação interna bloqueada)
  const [showExitModal, setShowExitModal] = useState(false);
  /** Ref espelha o modal imediatamente (evita reabrir ao cancelar: effect não pode depender de showExitModal). */
  const exitModalOpenRef = useRef(false);
  const exitModalSourceRef = useRef("close"); // "close" = botão Fechar | "blocker" = navegação bloqueada

  // Quando o blocker intercepta uma navegação, abrir o modal (guardado)
  // Depende só de blocker.state: se showExitModal estivesse nas deps, ao Cancelar o effect rodaria com
  // blocked ainda true + showExitModal false e chamaria setShowExitModal(true) de novo (modal duplicado).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- blocker + deps: só blocker.state (não showExitModal)
  useEffect(() => {
    if (blocker.state !== "blocked") return;

    // Sair confirmado ou redirect pós-save: seguir sem reabrir modal
    if (skipExitGuardRef.current || suppressNextBlockerModalRef.current) {
      suppressNextBlockerModalRef.current = false;
      blocker.proceed();
      return;
    }

    // Modal já aberto (Fechar ou clique no menu com aviso visível): não duplicar
    if (exitModalOpenRef.current) return;

    exitModalSourceRef.current = "blocker";
    exitModalOpenRef.current = true;
    setShowExitModal(true);
  }, [blocker.state]);

  const handleClose = () => {
    if (isSavingProduct) return;
    if (isDirty && !exitWithoutSavingHidden) {
      exitModalSourceRef.current = "close";
      exitModalOpenRef.current = true;
      setShowExitModal(true);
    } else {
      onCancel?.();
    }
  };

  const handleExitModalCancel = () => {
    suppressNextBlockerModalRef.current = false;
    skipExitGuardRef.current = false;
    exitModalOpenRef.current = false;
    setShowExitModal(false);
    if (blocker.state === "blocked") blocker.reset();
  };

  const handleExitModalConfirm = () => {
    exitModalOpenRef.current = false;
    setShowExitModal(false);
    suppressNextBlockerModalRef.current = false;

    skipExitGuardRef.current = true;
    const source = exitModalSourceRef.current;

    if (source === "blocker" && blocker?.state === "blocked") {
      blocker.proceed();
      return;
    }

    // Fechar: descarta destino pendente do menu (modal já estava aberto) e volta à lista
    if (blocker?.state === "blocked") {
      blocker.reset();
    }
    onCancel?.();
  };

  // ------------------------------------------------------
  // HEALTH: buscar e atualizar (mount, após save, opcional: troca de aba 1x/10s)
  // ------------------------------------------------------
  const productIdForHealth = product?.id ?? healthProductId;

  const fetchHealth = async (pid) => {
    if (!pid) return;
    const { ok, data } = await getProductHealth(pid);
    if (ok && data) {
      setProductHealth(data);
      healthLastFetchRef.current = Date.now();
    } else {
      setProductHealth(null);
    }
  };

  useEffect(() => {
    if (productIdForHealth) {
      fetchHealth(productIdForHealth);
    } else {
      setProductHealth(null);
    }
  }, [productIdForHealth]);

  // Opcional: ao trocar aba, buscar health no máximo 1x a cada 10s
  useEffect(() => {
    if (!productIdForHealth) return;
    if (Date.now() - healthLastFetchRef.current < 10000) return;
    fetchHealth(productIdForHealth);
  }, [safeTab]);

  useEffect(() => {
    if (safeTab !== "ads") return;
    const pid = product?.id != null ? String(product.id).trim() : "";
    if (!pid) {
      setProductAdsListings([]);
      setProductAdsListingsError(null);
      setProductAdsListingsLoading(false);
      return;
    }
    let cancelled = false;
    setProductAdsListingsLoading(true);
    setProductAdsListingsError(null);
    void (async () => {
      const res = await fetchProductMarketplaceListings(pid);
      if (cancelled) return;
      setProductAdsListingsLoading(false);
      if (!res.ok) {
        setProductAdsListings([]);
        setProductAdsListingsError(res.error ?? "Erro ao carregar anúncios");
        return;
      }
      setProductAdsListings(Array.isArray(res.listings) ? res.listings : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [safeTab, product?.id]);

  useEffect(() => {
    if (safeTab !== "performance") return;
    const pid = product?.id != null ? String(product.id).trim() : "";
    if (!pid) {
      setProductPerformance(null);
      setProductPerformanceError(null);
      setProductPerformanceLoading(false);
      return;
    }
    let cancelled = false;
    setProductPerformanceLoading(true);
    setProductPerformanceError(null);
    void (async () => {
      const res = await fetchProductPerformance(pid);
      if (cancelled) return;
      setProductPerformanceLoading(false);
      if (!res.ok) {
        setProductPerformance(null);
        setProductPerformanceError(res.error ?? "Erro ao carregar desempenho");
        return;
      }
      setProductPerformance(res.data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [safeTab, product?.id]);

  // ------------------------------------------------------
  // MARCAR COMO PRONTO (Ready)
  // Backend é fonte de verdade; frontend apenas dispara e exibe feedback
  // ------------------------------------------------------
  const handleMarkReady = async () => {
    const pid = product?.id ?? healthProductId;
    if (!pid) return;
    setMarkReadyLoading(true);
    setHealthModalBannerMessage(null);
    try {
      const result = await changeStatus(pid, "ready");
      if (result.ok) {
        const nextProduct = { ...product, status: "ready" };
        setProduct((prev) => ({ ...prev, status: "ready" }));
        lastSavedSnapshotRef.current = getFormSnapshotForGuard(nextProduct, variantRows, variationAttributes);
        await fetchHealth(pid);
        addNotification({ type: "success", title: "Sucesso", message: "Produto marcado como pronto ✅" });
      } else {
        if (result.code === "PRODUCT_NOT_READY") {
          await fetchHealth(pid);
          setHealthModalBannerMessage("Antes de marcar como pronto, resolva as pendências abaixo.");
          setHealthModalOpen(true);
        } else if (result.code === "INVALID_STATUS_TRANSITION") {
          addNotification({ type: "error", title: "Erro", message: result.error ?? "Transição de status inválida." });
        } else {
          addNotification({ type: "error", title: "Erro", message: result.error ?? "Não foi possível marcar como pronto. Tente novamente." });
        }
      }
    } catch (err) {
      addNotification({ type: "error", title: "Erro", message: "Não foi possível marcar como pronto. Tente novamente." });
    } finally {
      setMarkReadyLoading(false);
    }
  };

  // ------------------------------------------------------
  // HANDLER GENÉRICO
  // ------------------------------------------------------
  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // ------------------------------------------------------
  // MÁSCARAS / VALIDADORES (UX)
  // ------------------------------------------------------
  const formatNcm = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  };

  const isDigitsOnly = (v) => /^\d+$/.test(String(v || ""));

  // ------------------------------------------------------
  // FORMATO: SIMPLE x VARIANTS (UX alinhada ao backend)
  // - Produto salvo como "variants" → select desabilitado (formatLocked)
  // - Backend é fonte de verdade; UI apenas impede tentativa desnecessária
  // - Draft: pode alternar; se tem variações e quer simple, pedir confirmação
  // ------------------------------------------------------
  const formatLocked = mode === "edit" && product?.id && product.format === "variants";

  const applyFormatToSimple = () => {
    // Fechar o modal primeiro: evita overlay preso se algo abaixo lançar erro
    setFormatToSimpleModalOpen(false);
    setSkuBaseChips([]);
    setProduct((prev) => ({ ...prev, format: "simple", sku_base: "" }));
    setVariationAttributes([]);
    setDraftAttrChips([]);
    setDraftAttrInput("");
    setDraftOptionInput("");
    setDraftOptions([]);
    setVariantRows([]);
    setSkuErrorsById({});
    productDataForm.setValues({ sku: "" });
  };

  const handleFormatChange = (nextFormat) => {
    if (nextFormat === "variants") {
      setSkuBaseChips([]);
      setProduct((prev) => ({ ...prev, format: nextFormat, sku: "", gtin: "", sku_base: "" }));
      productDataForm.setValues({ sku: "" });
      return;
    }
    if (nextFormat === "simple") {
      if (formatLocked) return;
      const hasVariations = Array.isArray(variantRows) && variantRows.length > 0;
      if (hasVariations) {
        setFormatToSimpleModalOpen(true);
        return;
      }
      applyFormatToSimple();
    }
  };

  // ------------------------------------------------------
  // UI: Copiar campo com feedback ✓ por 5s
  // ------------------------------------------------------
  const { copiedKey, handleCopy } = useCopyFeedback();

  // ------------------------------------------------------
  // TÍTULOS DO ANÚNCIO (até 10 por produto)
  // - Frontend: UI apenas (sem validação de duplicidade)
  // - Backend: fonte de verdade para duplicados e regras por marketplace
  // ------------------------------------------------------
  const handleAddTitle = () => {
    const list = product?.ad_titles ?? [];
    if (list.length >= 10) return;
    setProduct((prev) => ({
      ...prev,
      ad_titles: [...(prev.ad_titles ?? []), { id: createId(), value: "" }],
    }));
  };

  const handleRemoveTitle = (id) => {
    const list = product?.ad_titles ?? [];
    if (list.length <= 1) return;
    setProduct((prev) => ({
      ...prev,
      ad_titles: (prev.ad_titles ?? []).filter((t) => t.id !== id),
    }));
  };

  const handleChangeTitle = (id, value) => {
    setProduct((prev) => ({
      ...prev,
      ad_titles: (prev.ad_titles ?? []).map((t) =>
        t.id === id ? { ...t, value } : t
      ),
    }));
  };

  const handleImageProgressChange = useCallback((snapshot) => {
    setImageProgress(normalizeImageProgress(snapshot));
  }, []);

  const handleProductImageLinksSnapshot = useCallback((links) => {
    setProduct((prev) => ({
      ...prev,
      product_image_links: Array.isArray(links) ? links : [],
    }));
  }, []);

  // Ao trocar de produto, zera até recarregar links
  useEffect(() => {
    setImageProgress({ productHasImage: false, variantHasImageByKey: {} });
  }, [product?.id]);

  // ------------------------------------------------------
  // PROGRESSO GLOBAL DO FORM (todas as abas, simple/variants)
  // ------------------------------------------------------
  const { percent: formProgressDetailPercent } = useFormProgress({
    product,
    variantRows,
    variationAttributes,
    simpleCostDigits,
    variantCostDigitsById,
    packagingDigits,
    operationalDigits,
    skuBaseChips,
    imageProgress,
    buildVariantKey,
  });

  /** Medidor lateral: só o progresso detalhado do formulário (abas/campos); independente do trio mínimo de readiness. */
  const sidePanelProgressPercent = Math.max(0, Math.min(100, formProgressDetailPercent));

// ======================================================
// COMPONENTE: FieldLabel (label + info + copiar)
// Objetivo:
// - Padronizar label dentro do ProductForm (inline)
// - Tooltip via Design System: .s7-tip + data-tip
// - copyKey/copiedKey: mostra ✓ por 5s após copiar
// Regras:
// - wrap: permite tooltip longo quebrar linha
// - tipBottom: força tooltip aparecer para baixo
// - side: left | right | center (alinhamento lateral do tooltip)
// - copyBottom: tooltip do copiar para baixo (padrão true)
// ======================================================
const FieldLabel = ({
  text,
  required = false,
  onCopy,
  copyKey,
  copiedKey,
  infoText,
  wrap = false,
  tipBottom = false,
  side = "left",
  copyBottom = true,
}) => {
  const showCopyCheck = copyKey != null && copiedKey === copyKey;
  const effectiveOnCopy = showCopyCheck ? undefined : onCopy;
  // ------------------------------------------------------
  // Classes do tooltip INFO
  // ------------------------------------------------------
  const infoTipClass = [
    "s7-tip",
    tipBottom ? "s7-tip-bottom" : "",
    wrap ? "s7-tip-wrap" : "",
    side === "right" ? "s7-tip-right" : "",
    side === "left" ? "s7-tip-left" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ------------------------------------------------------
  // Classes do tooltip COPIAR
  // ------------------------------------------------------
  const copyTipClass = [
    "s7-tip",
    copyBottom ? "s7-tip-bottom" : "s7-tip-right",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pf-label-row">
      <div className="pf-label-left">
        <span className="s7-label">
          {text}
          {required && <span className="s7-required">*</span>}
        </span>

        {!!infoText && (
          <button
            type="button"
            className={`pf-info-btn ${infoTipClass}`}
            data-tip={infoText}
            aria-label={`Informações sobre ${text}`}
          >
            i
          </button>
        )}
      </div>

      {!!onCopy && (
        <button
          type="button"
          className={`pf-copy-btn ${copyTipClass}`}
          data-tip={showCopyCheck ? "Copiado!" : "Copiar"}
          onClick={effectiveOnCopy}
          aria-label={`Copiar ${text}`}
        >
          {showCopyCheck ? "✓" : "⧉"}
        </button>
      )}
    </div>
  );
};

  // ------------------------------------------------------
  // CHIPS (opções) — adiciona via Enter/Tab/virgula
  // ------------------------------------------------------
  /** Normalização de opção de variação: trim, colapsar espaços, lowercase (evita Preto/preto/PRETO) */
  const normalizeOption = (raw) => String(raw || "").trim().replace(/\s+/g, " ").toLowerCase();
  const normalizeAttr   = (raw) => String(raw || "").trim().replace(/\s+/g, " ");

// ------------------------------------------------------
// CHIPS (atributo) — cria chip com Enter/Tab/Vírgula
// Regra: 1 atributo por vez (Cor OU Tamanho)
// ------------------------------------------------------
const handleDraftAttrKeyDown = (e) => {
  const isCommitKey = e.key === "Enter" || e.key === "Tab" || e.key === ",";
  if (!isCommitKey) return;

  const value = normalizeAttr(draftAttrInput);

  // ✅ se não digitou nada, só bloqueia submit/Tab
  if (!value) {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  // ✅ 1 atributo por vez (substitui o chip anterior)
  setDraftAttrChips([value]);

  // ✅ limpa input
  setDraftAttrInput("");

  // ✅ limpa erro do nome do atributo, se houver
  setErrors((prev) => ({ ...prev, variants_attr: undefined }));
};

// ------------------------------------------------------
// Remover chip do atributo
// ------------------------------------------------------
const removeDraftAttrChip = (attr) => {
  setDraftAttrChips((prev) => prev.filter((x) => x !== attr));
};


    // ------------------------------------------------------
// CHIPS (opções): remover chip individual
// ------------------------------------------------------
const removeDraftOption = (opt) => {
  setDraftOptions((prev) => prev.filter((x) => x !== opt));
};


  const addDraftOptionsFromText = (text) => {
    const cleaned = String(text || "");
    const parts = cleaned
      .split(",")
      .map((p) => normalizeOption(p))
      .filter(Boolean);

    if (parts.length === 0) return;

    setDraftOptions((prev) => {
      const set = new Set(prev.map((x) => x.toLowerCase()));
      const next = [...prev];

      parts.forEach((p) => {
        if (!set.has(p.toLowerCase())) {
          next.push(p);
          set.add(p.toLowerCase());
        }
      });

      return next;
    });

    // Ao criar pelo menos 1 opção válida, limpa erro de opções do builder
    setErrors((prev) => ({ ...prev, variants_options: undefined }));
  };

  const handleDraftOptionKeyDown = (e) => {
    // Enter ou Tab cria chip
    if (e.key === "Enter" || e.key === "Tab") {
      const value = normalizeOption(draftOptionInput);
      if (value) {
        e.preventDefault();
        addDraftOptionsFromText(value);
        setDraftOptionInput("");
      }
      return;
    }

    // Vírgula cria chip
    if (e.key === ",") {
      const value = normalizeOption(draftOptionInput);
      if (value) {
        e.preventDefault();
        addDraftOptionsFromText(value);
        setDraftOptionInput("");
      }
      return;
    }
  };


// ------------------------------------------------------
// VARIAÇÕES: adicionar 1 atributo + suas opções (chips)
// - adiciona/mescla atributo
// - gera combinações imediatamente
// - esconde builder e mostra gerenciamento
// ------------------------------------------------------
const handleAddVariationAttribute = () => {
  const attrName = normalizeAttr(draftAttrChips?.[0] || "");

  // 1) precisa ter nome do atributo
  if (!attrName) {
    setErrors((prev) => ({
      ...prev,
      variants_attr: "Digite o nome do atributo (ex: Cor).",
      variants_options: undefined,
    }));
    return;
  }

  // 2) precisa ter opções
  if (!draftOptions || draftOptions.length === 0) {
    setErrors((prev) => ({
      ...prev,
      variants_attr: undefined,
      variants_options: "Adicione ao menos 1 opção (chip) antes de cadastrar o atributo.",
    }));
    return;
  }

  // 3) adiciona/mescla e já gera combinações com base no "next"
  setVariationAttributes((prev) => {
    const next = [...prev];

    const existingIndex = next.findIndex(
      (a) => String(a.name).toLowerCase() === attrName.toLowerCase()
    );

    // Se já existir atributo, mescla opções (sem duplicar)
    if (existingIndex >= 0) {
      const current = next[existingIndex];
      const set = new Set((current.options || []).map((x) => String(x).toLowerCase()));

      const merged = [...(current.options || [])];
      (draftOptions || []).forEach((opt) => {
        const k = String(opt).toLowerCase();
        if (!set.has(k)) {
          merged.push(opt);
          set.add(k);
        }
      });

      next[existingIndex] = { ...current, options: merged };
    } else {
      // Se não existir, cria novo atributo
      next.push({
        id: createId(),
        name: attrName,
        options: [...draftOptions],
      });
    }

    // ✅ gera combinações usando a lista "next" (estado futuro)
    regenerateVariantRowsFromAttributes(next);

    return next;
  });

  // 4) Linha de criação permanece visível; novo atributo aparece abaixo (fluxo contínuo)
  // 5) limpa erros e drafts
  setErrors((prev) => ({
    ...prev,
    variants: undefined,
    variants_attr: undefined,
    variants_options: undefined,
  }));
  setDraftAttrInput("");
  setDraftAttrChips([]);
  setDraftOptionInput("");
  setDraftOptions([]);
};



// ======================================================================
// SUSE7 — VARIAÇÕES: ADICIONAR OPÇÃO (CHIP) EM ATRIBUTO EXISTENTE
// Objetivo:
// - Adiciona opção no atributo
// - Regera combinações com o estado novo (next)
// ======================================================================
const handleAddOptionToAttribute = (attrId) => {
  const opt = normalizeOption(addOptionInput);

  // ------------------------------------------------------
  // Validações (UX)
  // ------------------------------------------------------
  if (!opt) {
    setAddOptionError("Digite uma opção válida.");
    return;
  }

  // ------------------------------------------------------
  // Atualiza atributo + regenera combinações com o estado novo
  // ------------------------------------------------------
  setVariationAttributes((prev) => {
    const next = prev.map((a) => {
      if (a.id !== attrId) return a;

      const options = Array.isArray(a.options) ? a.options : [];
      const exists = options.some((x) => String(x).toLowerCase() === opt.toLowerCase());
      if (exists) return a;

      return { ...a, options: [...options, opt] };
    });

    // 🔥 gera combinações COM O ESTADO NOVO
    regenerateVariantRowsFromAttributes(next);

    return next;
  });

  // ------------------------------------------------------
  // Reset UI
  // ------------------------------------------------------
  setAddOptionInput("");
  setAddOptionError("");
  setAddOptionAttrId(null);
};

// ======================================================================
// SUSE7 — VARIAÇÕES: EDITAR NOME DO ATRIBUTO
// - Atualiza o nome no atributo e regenera combinações (preservando dados por chave)
// ======================================================================
const handleChangeAttributeName = (attrId, newName) => {
  const normalized = normalizeAttr(newName || "");
  if (!normalized) return;

  setVariationAttributes((prev) => {
    const next = prev.map((a) =>
      a.id === attrId ? { ...a, name: normalized } : a
    );
    regenerateVariantRowsFromAttributes(next);
    return next;
  });
};

// ======================================================================
// SUSE7 — VARIAÇÕES: REMOVER OPÇÃO (CHIP) DE UM ATRIBUTO
// Objetivo:
// - Remove opção do atributo
// - Regera combinações com estado novo
// ======================================================================
const removeOptionFromAttribute = (attrId, optToRemove) => {
  setVariationAttributes((prev) => {
    const next = prev
      .map((a) => {
        if (a.id !== attrId) return a;

        const filtered = (a.options || []).filter(
          (x) => String(x).toLowerCase() !== String(optToRemove).toLowerCase()
        );

        return { ...a, options: filtered };
      })
      // ✅ remove atributos que ficaram sem opções (opcional, mas saudável)
      .filter((a) => Array.isArray(a.options) && a.options.length > 0);

      regenerateVariantRowsFromAttributes(next);
    return next;
  });
};


  // Progresso: pré-carrega slots de imagem quando a aba Imagens não está aberta
  useEffect(() => {
    if (safeTab === "images") return;

    let cancelled = false;
    const pid = product?.id;
    const hasProductId = pid && typeof pid === "string" && !String(pid).startsWith("draft:");
    const dk = draftKeyRef.current;
    const canOperate = hasProductId || (dk && typeof dk === "string");

    if (!canOperate) {
      setImageProgress({ productHasImage: false, variantHasImageByKey: {} });
      return undefined;
    }

    const opts = hasProductId ? { productId: pid } : { draftKey: dk };

    (async () => {
      try {
        const general = await listLinks({ ...opts, variantKey: null });
        const variantLinksMap = {};
        if (product.format === "variants" && Array.isArray(variantRows) && variantRows.length > 0) {
          const uniqueKeys = [
            ...new Set(variantRows.map((r) => buildVariantKey(r.attributes)).filter(Boolean)),
          ];
          await Promise.all(
            uniqueKeys.map(async (vk) => {
              variantLinksMap[vk] = await listLinks({ ...opts, variantKey: vk });
            })
          );
        }
        const variantLinksByRowId = {};
        if (Array.isArray(variantRows)) {
          variantRows.forEach((r, idx) => {
            const rowId = String(variantProgressRowId(r, idx));
            const vk = buildVariantKey(r.attributes);
            variantLinksByRowId[rowId] = (vk && variantLinksMap[vk]) || [];
          });
        }
        const snap = buildImageProgressSnapshot({
          format: product.format,
          variantRows,
          productLinks: general,
          variantLinksByRowId,
          buildVariantKey,
        });
        if (!cancelled) setImageProgress(snap);
      } catch {
        /* mantém último snapshot da aba, se houver */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [safeTab, product?.id, product?.format, variantRows, buildVariantKey]);

  const cartesian = (arrays) => {
    // arrays = [[{name,val}...], [{name,val}...]]
    return arrays.reduce((acc, curr) => {
      const next = [];
      acc.forEach((a) => {
        curr.forEach((b) => {
          next.push([...a, b]);
        });
      });
      return next;
    }, [[]]);
  };

  // ------------------------------------------------------
// GERAR COMBINAÇÕES a partir de uma lista (evita setTimeout)
// ------------------------------------------------------
const regenerateVariantRowsFromAttributes = (attrsList) => {
  const attrs = (attrsList || [])
    .filter((a) => a.name && Array.isArray(a.options) && a.options.length > 0)
    .map((a) => ({ name: a.name, options: a.options }));

  if (attrs.length === 0) {
    setVariantRows([]);
    return;
  }

  const arrays = attrs.map((a) => a.options.map((opt) => ({ k: a.name, v: opt })));
  const combos = cartesian(arrays);

  const currentIndex = new Map();
  variantRows.forEach((row) => {
    currentIndex.set(buildVariantKey(row.attributes), row);
  });

  // Preservar sku, ean_gtin (gtin), active nas combinações que continuam existindo (chave determinística)
  const nextRows = combos.map((combo) => {
    const attributesObj = combo.reduce((obj, item) => {
      obj[item.k] = item.v;
      return obj;
    }, {});

    const key = buildVariantKey(attributesObj);
    const existing = currentIndex.get(key);

    return {
      id: existing?.id || key,
      attributes: attributesObj,
      sku: existing?.sku || "",
      gtin: existing?.gtin || "", // ean_gtin no backend
      cost_price: existing?.cost_price ?? "",
      stock_real: String(existing?.stock_real ?? existing?.stock_quantity ?? ""),
      stock_min: String(existing?.stock_min ?? existing?.stock_minimum ?? ""),
      use_virtual_stock: !!existing?.use_virtual_stock,
      stock_virtual: String(existing?.stock_virtual ?? existing?.virtual_stock_quantity ?? "0"),
      active: typeof existing?.active === "boolean" ? existing.active : true,
    };
  });

  setVariantRows(nextRows);
};


  const regenerateVariantRows = () => {
    // Se não tiver atributos completos, limpa
    const attrs = variationAttributes
      .filter((a) => a.name && Array.isArray(a.options) && a.options.length > 0)
      .map((a) => ({
        name: a.name,
        options: a.options,
       }));

    if (attrs.length === 0) {
      setVariantRows([]);
      return;
    }

    // Monta pares para cartesiano: [[{k,v}...], ...]
    const arrays = attrs.map((a) => a.options.map((opt) => ({ k: a.name, v: opt })));
    const combos = cartesian(arrays);

    // Index atual para preservar dados
    const currentIndex = new Map();
    variantRows.forEach((row) => {
      currentIndex.set(buildVariantKey(row.attributes), row);
    });

    const nextRows = combos.map((combo) => {
      const attributesObj = combo.reduce((obj, item) => {
        obj[item.k] = item.v;
        return obj;
      }, {});

      const key = buildVariantKey(attributesObj);
      const existing = currentIndex.get(key);

      return {
  id: existing?.id || key,
  attributes: attributesObj,
  sku: existing?.sku || "",
  gtin: existing?.gtin || "",

  // custo por variação
  cost_price: existing?.cost_price ?? "",

  // estoque por variação (strings para inputs)
  stock_real: String(existing?.stock_real ?? existing?.stock_quantity ?? ""),
  stock_min: String(existing?.stock_min ?? existing?.stock_minimum ?? ""),
  use_virtual_stock: !!existing?.use_virtual_stock,
  stock_virtual: String(existing?.stock_virtual ?? existing?.virtual_stock_quantity ?? "0"),

  active: typeof existing?.active === "boolean" ? existing.active : true,
};

    });

    setVariantRows(nextRows);
  };

  // ------------------------------------------------------
  // VARIANT ROWS: reorder (drag vertical na aba Imagens)
  // Persiste em product_variants quando em modo edit
  // ------------------------------------------------------
  const handleVariantReorder = async (newOrderedRows) => {
    const previousSnapshot = [...variantRows];
    setVariantRows(newOrderedRows);
    const pid = product?.id;
    if (!pid || typeof pid !== "string" || pid.startsWith("draft:")) return;
    const updates = newOrderedRows
      .map((r, idx) => (r?.id ? { id: r.id, sort_order: idx } : null))
      .filter(Boolean);
    if (updates.length === 0) return;
    const opId = saveStatus.saving("variants-reorder");
    try {
      await updateVariantsSortOrder(pid, updates);
      saveStatus.success("variants-reorder", opId);
    } catch (err) {
      saveStatus.error("variants-reorder", opId, {
        message: err?.message || "Falha ao salvar ordem",
        retry: () => handleVariantReorder(newOrderedRows),
      });
      addNotification({ type: "error", title: "Reorder", message: err?.message || "Erro ao salvar ordem das variações" });
      setVariantRows(previousSnapshot);
    }
  };

  // ------------------------------------------------------
  // VARIANT ROWS: edição inline
  // ------------------------------------------------------
  const handleVariantRowChange = (id, field, value) => {
    setVariantRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ------------------------------------------------------
  // VARIANT ROWS: toggle estoque virtual
  // Ao desmarcar: use_virtual_stock = false e stock_virtual = "0"
  // Suporta id === "simple" para produto sem variações
  // ------------------------------------------------------
  const handleStockVirtualToggle = (id, checked) => {
    if (id === "simple") {
      setProduct((prev) => ({
        ...prev,
        use_virtual_stock: !!checked,
        virtual_stock_quantity: checked ? prev.virtual_stock_quantity : 0,
      }));
      return;
    }
    setVariantRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              use_virtual_stock: !!checked,
              stock_virtual: checked ? r.stock_virtual : "0",
            }
          : r
      )
    );
  };

  // ------------------------------------------------------
  // ESTOQUE: handler unificado (variantes + produto simples)
  // Limpa erro ao digitar
  // ------------------------------------------------------
  const handleStockRowChange = (id, field, value) => {
    const key = id === "simple" ? "simple" : id;
    if (field === "stock_real") {
      setStockErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      // Limpar zeroStockAttention quando usuário digita valor > 0
      const parsed = parseInt(String(value || "0"), 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setZeroStockAttention((prev) => {
          if (!prev) return null;
          if (key === "simple") {
            const next = { ...prev, simple: false };
            return (prev.variants && Object.keys(prev.variants).length > 0) ? next : null;
          }
          const nextVariants = { ...(prev.variants || {}) };
          delete nextVariants[key];
          return (prev.simple || Object.keys(nextVariants).length > 0)
            ? { ...prev, variants: nextVariants }
            : null;
        });
      }
    }
    if (id === "simple") {
      const productField =
        field === "stock_real"
          ? "stock_quantity"
          : field === "stock_min"
            ? "stock_minimum"
            : field === "stock_virtual"
              ? "virtual_stock_quantity"
              : null;
      if (productField) {
        setProduct((prev) => ({ ...prev, [productField]: value }));
      }
      return;
    }
    handleVariantRowChange(id, field, value);
  };

  // ------------------------------------------------------
  // VARIANT ROWS: remover linha / opção via lixeira
  // Regra:
  // - Lixeira é a ação oficial de exclusão
  // - Se a opção de um atributo não for usada em nenhuma outra variação,
  //   ela também é removida de variationAttributes (e as combinações são
  //   regeneradas a partir daí).
  // - Se ainda houver outras variações usando aquela opção, removemos
  //   apenas a combinação atual.
  // ------------------------------------------------------
  const handleRemoveVariantRow = (id) => {
    const rows = variantRows || [];
    const rowToDelete = rows.find((r) => r.id === id);

    if (!rowToDelete) {
      setVariantRows((prev) => (prev || []).filter((r) => r.id !== id));
      setDeleteVariantRowId(null);
      return;
    }

    let removedViaAttributes = false;

    Object.entries(rowToDelete.attributes || {}).forEach(([attrName, value]) => {
      const attr = (variationAttributes || []).find(
        (a) => String(a.name).toLowerCase() === String(attrName).toLowerCase()
      );
      if (!attr) return;

      const isValueUsedElsewhere = rows.some(
        (r) =>
          r.id !== id &&
          r.attributes &&
          String(r.attributes[attrName]).toLowerCase() === String(value).toLowerCase()
      );

      // Se mais nenhuma variação usar esta opção, removemos a opção do atributo.
      if (!isValueUsedElsewhere) {
        removedViaAttributes = true;
        removeOptionFromAttribute(attr.id, value);
      }
    });

    // Se nenhuma opção foi removida dos atributos (ex.: opção ainda usada em outras linhas),
    // removemos apenas esta combinação específica.
    if (!removedViaAttributes) {
      setVariantRows((prev) => (prev || []).filter((r) => r.id !== id));
    }

    setDeleteVariantRowId(null);
  };

  // ------------------------------------------------------
  // SUSE7 — Geração de SKU (base + atributos, separador "_")
  // Formato: sku_base + "_" + atributos; apenas letras, números e "_"; máx. 24 caracteres.
  // Anti-colisão: sufixo incremental _2, _3... quando SKU já existir no produto ou no lote.
  // ------------------------------------------------------
  /** Normalização para SKU gerado: remove acentos; mantém letras, números e "_"; preserva maiúsc./minúsc. */
  const sanitizeSku = (str) => {
    let t = String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    t = t.replace(/[\s.\-]+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").replace(/_+/g, "_");
    if (t.startsWith("_")) t = t.slice(1);
    if (t.endsWith("_")) t = t.slice(0, -1);
    return t;
  };

  /** Retorna o próximo SKU disponível evitando colisão: base, base_2, base_3... até não estar em usedSet; respeita maxLen */
  const getNextAvailableSku = (baseSku, usedSet, maxLen) => {
    const baseTruncated = baseSku.slice(0, maxLen);
    let candidate = baseTruncated;
    let n = 1;
    while (usedSet.has(candidate) || candidate.length > maxLen) {
      const suffix = "_" + n;
      candidate = (baseTruncated.slice(0, maxLen - suffix.length) + suffix).replace(/_+/g, "_");
      n += 1;
    }
    return candidate;
  };

  const abbreviateOptionForSku = (str) => {
    const s = String(str).trim().replace(/\s+/g, "");
    const raw = s.length > 3 ? s.substring(0, 3) : s || "";
    return sanitizeSku(raw) || raw;
  };

  /** Chave da raiz do SKU: remove acentos; máx. 6 caracteres; preserva capitalização. */
  const normalizeSkuBaseKey = (str) => {
    const s = String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    return s.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
  };

  /** Converte product.sku_base (string com "_") em chips da UI. Aceita também "." para compatibilidade. */
  const parseSkuBaseToChips = (str) => {
    if (str == null || String(str).trim() === "") return [];
    return String(str)
      .split(/[_.]/)
      .slice(0, 2)
      .map(normalizeSkuBaseKey)
      .filter(Boolean);
  };

  /** Converte chips da UI em string para persistir em product.sku_base. Formato oficial: chave1_chave2 */
  const buildSkuBaseFromChips = (chips) => {
    if (!Array.isArray(chips) || chips.length === 0) return "";
    return chips.join("_");
  };

  /**
   * Base para geração: 1º sku_base persistido no produto (edit/API), 2º chips da UI,
   * 3º fallback SKU pai/nome. Prioriza a raiz salva para consistência ao incluir novas variações.
   */
  const getSkuBase = () => {
    const fromPersisted = String(product.sku_base ?? "").trim();
    if (fromPersisted) return fromPersisted;
    if (skuBaseChips.length > 0) {
      return buildSkuBaseFromChips(skuBaseChips);
    }
    const fallback = String(product.sku || product.product_name || "PROD").trim();
    return sanitizeSku(fallback) || fallback.replace(/\s+/g, "_");
  };

  // Sincroniza chips com product.sku_base (inclui hidratação do edit e limpeza)
  useEffect(() => {
    const chips = parseSkuBaseToChips(product.sku_base);
    setSkuBaseChips(chips);
  }, [product.sku_base]);

  /** Adiciona uma chave à raiz do SKU (máx. 2 chaves, 6 caracteres cada); persiste em product.sku_base com "_" */
  const addSkuBaseChip = () => {
    const key = normalizeSkuBaseKey(skuBaseInput);
    if (!key) return;
    if (skuBaseChips.length >= 2) return;
    if (skuBaseChips.some((c) => c === key)) {
      setSkuBaseInput("");
      return;
    }
    const next = [...skuBaseChips, key];
    setSkuBaseChips(next);
    handleChange("sku_base", buildSkuBaseFromChips(next));
    setSkuBaseInput("");
    setSkuBaseError("");
  };

  /** Remove uma chave da raiz do SKU; persiste em product.sku_base */
  const removeSkuBaseChip = (key) => {
    const next = skuBaseChips.filter((c) => c !== key);
    setSkuBaseChips(next);
    handleChange("sku_base", buildSkuBaseFromChips(next));
    setSkuBaseError("");
  };

  /** Enter/Tab no input da raiz: adiciona chip */
  const handleSkuBaseKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addSkuBaseChip();
    }
  };

  /** Após expandir o card da Raiz do SKU, scroll suave + foco (DOM precisa renderizar). */
  const focusSkuRootAfterExpand = useCallback(() => {
    const run = () => {
      skuBaseInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      skuBaseInputRef.current?.focus({ preventScroll: true });
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(run, 120);
      });
    });
  }, []);

  /**
   * Raiz do SKU obrigatória para geração automática.
   * Expande o card se estiver recolhido, aplica erro no campo, scroll+foco.
   * @param {{ showToast?: boolean }} options — toast apenas no fluxo "gerar SKU desta variação"
   * @returns {boolean} true se há pelo menos uma chave na raiz
   */
  const ensureSkuRootChipsOrGuide = useCallback(
    (options = {}) => {
      const { showToast = false } = options;
      if (String(product.sku_base ?? "").trim() !== "") {
        setSkuBaseError("");
        return true;
      }
      if (skuBaseChips.length > 0) {
        setSkuBaseError("");
        return true;
      }
      setSkuBaseError("Informe pelo menos uma chave. Você pode usar até duas palavras curtas.");
      expandVariationsConfigRef.current?.();
      if (showToast) {
        addNotification({
          event_type: "GENERIC",
          title: "Raiz do SKU",
          message: "Preencha a Raiz do SKU para gerar automaticamente.",
          severity: NOTIFICATION_SEVERITY.INFO,
        });
      }
      focusSkuRootAfterExpand();
      return false;
    },
    [skuBaseChips, product.sku_base, addNotification, focusSkuRootAfterExpand]
  );

  /** Valida se há pelo menos uma chave na raiz; se não, destaca campo, expande card, scroll e foco. */
  const validateSkuBase = () => ensureSkuRootChipsOrGuide({ showToast: false });

  /**
   * Gera o SKU para uma linha (não aplica no state). Formato: base_attr1_attr2; sanitizado; anti-colisão com _2, _3...
   * Usado por geração individual e por exibição no modal. Limite 24 caracteres.
   */
  const generateSkuForRow = (row) => {
    const base = getSkuBase();
    const parts = Object.entries(row.attributes || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => abbreviateOptionForSku(String(v)));
    const baseSku = sanitizeSku(base + (parts.length ? "_" + parts.join("_") : ""));
    const used = new Set((variantRows || []).filter((r) => r.id !== row.id).map((r) => r.sku).filter(Boolean));
    return getNextAvailableSku(baseSku.slice(0, 24), used, 24);
  };

  /**
   * Aplica geração global de SKU. Formato "_"; anti-colisão no lote e com SKUs já existentes.
   * @param {boolean} onlyEmpty - true = só preenche vazios; false = substitui todos
   * @returns {{ generated: number, kept: number }}
   */
  const applyGenerateSkuGlobal = (onlyEmpty) => {
    const rows = variantRows || [];
    const emptyCount = rows.filter((r) => !String(r.sku || "").trim()).length;
    const keptCount = onlyEmpty ? rows.length - emptyCount : 0;
    const generatedCount = onlyEmpty ? emptyCount : rows.length;

    const base = getSkuBase();
    const used = new Set(rows.map((r) => r.sku).filter(Boolean));
    const nextRows = rows.map((row) => {
      const hasSku = row.sku != null && String(row.sku).trim() !== "";
      if (onlyEmpty && hasSku) return row;
      const parts = Object.entries(row.attributes || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => abbreviateOptionForSku(String(v)));
      const baseSku = sanitizeSku(base + (parts.length ? "_" + parts.join("_") : ""));
      const sku = getNextAvailableSku(baseSku.slice(0, 24), used, 24);
      used.add(sku);
      return { ...row, sku };
    });
    setVariantRows(nextRows);
    return { generated: generatedCount, kept: keptCount };
  };

  /** Conta quantas variações têm SKU preenchido vs vazio */
  const getSkuCounts = () => {
    const rows = variantRows || [];
    const withSku = rows.filter((r) => String(r.sku || "").trim() !== "").length;
    return { empty: rows.length - withSku, filled: withSku };
  };

  /**
   * Botão principal "Gerar SKU automaticamente":
   * - Valida raiz (pelo menos uma chave); se inválido, destaca campo e foca.
   * - Se todos vazios → geração global, modal sucesso (X gerados, 0 mantidos)
   * - Se algum preenchido → abre modal de regeração (3 ações)
   */
  const handleGenerateSkuAuto = () => {
    if (!validateSkuBase()) return;
    const { empty, filled } = getSkuCounts();
    if (filled === 0) {
      const { generated, kept } = applyGenerateSkuGlobal(true);
      setSkuSuccessModal({ show: true, generated, kept });
      return;
    }
    setSkuRegenerateModalOpen(true);
  };

  /**
   * Regeração: apenas vazios. Fecha modal regeração e abre sucesso. Valida raiz antes.
   */
  const handleSkuRegenerateOnlyEmpty = () => {
    if (!validateSkuBase()) return;
    const { generated, kept } = applyGenerateSkuGlobal(true);
    setSkuRegenerateModalOpen(false);
    setSkuSuccessModal({ show: true, generated, kept });
  };

  /**
   * Regeração: substituir todos. Fecha modal regeração e abre sucesso. Valida raiz antes.
   */
  const handleSkuRegenerateAll = () => {
    if (!validateSkuBase()) return;
    const total = (variantRows || []).length;
    applyGenerateSkuGlobal(false);
    setSkuRegenerateModalOpen(false);
    setSkuSuccessModal({ show: true, generated: total, kept: 0 });
  };

  /**
   * Geração individual por linha. Valida raiz; se SKU vazio → aplica direto. Se preenchido → abre modal.
   */
  const handleGenerateSkuForRow = (row) => {
    if (!ensureSkuRootChipsOrGuide({ showToast: true })) return;
    const newSku = generateSkuForRow(row);
    const hasSku = row.sku != null && String(row.sku).trim() !== "";
    if (!hasSku) {
      handleVariantRowChange(row.id, "sku", newSku);
      return;
    }
    setSkuIndividualModal({ rowId: row.id, currentSku: row.sku, newSku });
  };

  /** Confirma substituição de SKU no modal individual */
  const handleConfirmIndividualSkuReplace = () => {
    if (!skuIndividualModal) return;
    handleVariantRowChange(skuIndividualModal.rowId, "sku", skuIndividualModal.newSku);
    setSkuIndividualModal(null);
  };

  /**
   * Placeholder para backend: variação já vinculada a marketplaces.
   * Quando true, ao alterar SKU manualmente exibe modal de alerta.
   * Frontend não implementa lógica por marketplace; backend informará row.linked_to_marketplaces.
   */
  const isVariantLinkedToMarketplaces = (row) => Boolean(row?.linked_to_marketplaces);

  /** Confirma alteração manual de SKU em variação integrada (após modal de alerta) */
  const handleConfirmManualSkuIntegrated = () => {
    if (!skuManualIntegratedModal) return;
    handleVariantRowChange(skuManualIntegratedModal.rowId, "sku", skuManualIntegratedModal.nextSku);
    setSkuManualIntegratedModal(null);
  };

  // ------------------------------------------------------
  // UX: Nome + SKU — validação leve centralizada (useFormValidation)
  // Backend continua sendo a autoridade nas regras definitivas.
  // ------------------------------------------------------
  const productDataFieldsInitial = useMemo(
    () => ({ product_name: "", sku: "" }),
    []
  );

  const productDataValidators = useMemo(
    () => ({
      product_name: (value) =>
        !String(value ?? "").trim() ? PRODUCT_FORM_MSG.PRODUCT_NAME_REQUIRED : "",
      ...(product.format === "simple"
        ? {
            sku: (value) => (!String(value ?? "").trim() ? PRODUCT_FORM_MSG.SKU_REQUIRED : ""),
          }
        : {}),
    }),
    [product.format]
  );

  const productDataForm = useFormValidation({
    initialValues: productDataFieldsInitial,
    validators: productDataValidators,
  });

  useEffect(() => {
    if (!initialProduct?.id) return;
    productDataForm.resetForm({
      product_name: initialProduct.product_name ?? "",
      sku: initialProduct.sku ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync só ao carregar produto para edição
  }, [initialProduct?.id]);

  // ------------------------------------------------------
  // VALIDAR (UX) — essenciais = nome + SKU (simples); opcionais = formato EAN/NCM se preenchidos
  // ------------------------------------------------------
  const validateDataTabEssentials = () => {
    const { isValid: nameSkuOk } = productDataForm.validateAll();
    return nameSkuOk;
  };

  const validateDataTabOptionalFormats = () => {
    let gtinErr = "";
    const gtin = String(product.gtin || "").trim();
    if (gtin) {
      if (!isDigitsOnly(gtin)) gtinErr = "EAN/GTIN deve conter apenas números.";
      else if (gtin.length > 13) gtinErr = "EAN/GTIN deve ter no máximo 13 dígitos.";
    }
    let ncmErr = "";
    const ncmDigits = String(product.ncm || "").replace(/\D/g, "");
    if (ncmDigits && ncmDigits.length !== 8) ncmErr = "NCM deve ter 8 dígitos.";

    setErrors((prev) => {
      const next = { ...prev };
      if (gtinErr) next.gtin = gtinErr;
      else delete next.gtin;
      if (ncmErr) next.ncm = ncmErr;
      else delete next.ncm;
      return next;
    });
    return !gtinErr && !ncmErr;
  };

  const validateDataTab = () => {
    if (!validateDataTabEssentials()) return false;
    return validateDataTabOptionalFormats();
  };

// ======================================================================
// VALIDAR: Variações (UX)
// Regras:
// - Somente quando format === "variants"
// - SKU obrigatório por variação; SKU único entre variações (não vazios, trim)
// ======================================================================
const validateVariantsTab = () => {
  // Se não está em variações, nada a validar aqui
  if (product.format !== "variants") {
    setSkuErrorsById({});
    setErrors((prev) => ({ ...prev, variants: undefined }));
    return true;
  }

  // Formato com variações exige ao menos 1 variação criada para avançar no wizard
  if (!Array.isArray(variantRows) || variantRows.length === 0) {
    setSkuErrorsById({});
    setErrors((prev) => ({
      ...prev,
      variants: "Crie ao menos uma variação para continuar.",
    }));
    return false;
  }

  const nextSkuErrors = computeVariantSkuErrors(variantRows || []);

  setSkuErrorsById(nextSkuErrors);
  setErrors((prev) => ({ ...prev, variants: undefined }));

  // Se tem erro, falha
  return Object.keys(nextSkuErrors).length === 0;
};

  /** Painel lateral: ao ir para aba após Variações, exige variações válidas (SKU único, etc.) */
  const handlePanelStepChange = (id) => {
    if (isSavingProduct) return;
    if (id === safeTab) return;
    const toIdx = availableTabIds.indexOf(id);
    if (toIdx < 0) return;

    if (allStepsUnlocked) {
      setActiveTab(id);
      setMaxReachedIndex((prev) => Math.max(prev, toIdx));
      return;
    }

    const variationsIdx = availableTabIds.indexOf("variations");
    if (product.format === "variants" && variationsIdx >= 0 && toIdx > variationsIdx) {
      setVariationsSubmitAttempted(true);
      if (!validateVariantsTab()) {
        if (safeTab !== "variations") {
          setActiveTab("variations");
          setMaxReachedIndex((prev) => Math.max(prev, variationsIdx));
        }
        requestAnimationFrame(() => focusFirstInvalidField("variations"));
        return;
      }
    }

    setActiveTab(id);
    setMaxReachedIndex((prev) => Math.max(prev, toIdx));
  };



// ======================================================================
// VALIDAR: Custos obrigatórios (UX)
// Regras:
// - Simples: custo do produto obrigatório (R$ 0,00 NÃO é válido)
// - Variações: todas as variações precisam ter custo > 0
// ======================================================================
const validatePricingTab = () => {
  const next = { simpleCost: false, variantsMissingIds: [] };

  // ------------------------------------------------------
  // SIMPLE: custo > 0 (mesma regra que computeProductReadiness + máscara BRL)
  // ------------------------------------------------------
  if (product.format === "simple") {
    const fromMask = isCostPositiveFromBrlDigits(simpleCostDigits);
    const fromField = !fromMask && isCostPositive(product.cost_price);
    if (!fromMask && !fromField) {
      next.simpleCost = true;
    }
  }

  // ------------------------------------------------------
  // VARIANTS: cada linha com custo > 0 (readiness do formulário)
  // ------------------------------------------------------
  if (product.format === "variants") {
    const missing = (variantRows || [])
      .filter((r) => {
        const id = r?.id != null ? String(r.id) : "";
        const digits = id ? variantCostDigitsById?.[r.id] ?? variantCostDigitsById?.[String(r.id)] : "";
        return !isVariantLineCostPositive(digits, r?.cost_price);
      })
      .map((r) => r.id);

    if (missing.length > 0) {
      next.variantsMissingIds = missing;
    }
  }

  setCostErrors(next);
  return !(next.simpleCost || next.variantsMissingIds.length > 0);
};

  // ------------------------------------------------------
  // VALIDAR: Estoque — não bloqueia Avançar (estoque opcional no fluxo mínimo)
  // ------------------------------------------------------
  const SIMPLE_STOCK_KEY = "simple";
  const validateStockTab = () => {
    setStockErrors({});
    return true;
  };

  // ------------------------------------------------------
  // BLUR — Custos / Estoque: igual à aba Dados (erro ao sair do campo)
  // ------------------------------------------------------
  const handleSimpleCostBlur = () => {
    const ok =
      isCostPositiveFromBrlDigits(simpleCostDigits) || isCostPositive(product.cost_price);
    setCostErrors((prev) => ({ ...prev, simpleCost: !ok }));
  };

  const handleVariantCostBlur = (rowId) => {
    const row = (variantRows || []).find((r) => r.id === rowId);
    const digits = variantCostDigitsById?.[rowId] ?? variantCostDigitsById?.[String(rowId)];
    const ok = row ? isVariantLineCostPositive(digits, row.cost_price) : false;
    setCostErrors((prev) => {
      const missing = new Set(prev.variantsMissingIds || []);
      if (!ok) missing.add(rowId);
      else missing.delete(rowId);
      return { ...prev, variantsMissingIds: Array.from(missing) };
    });
  };

  const handleStockRealBlur = (row) => {
    const key = row.id === SIMPLE_STOCK_KEY ? SIMPLE_STOCK_KEY : row.id;
    const raw =
      row.id === SIMPLE_STOCK_KEY
        ? product.stock_quantity
        : (variantRows || []).find((r) => r.id === row.id)?.stock_real;
    const empty = String(raw ?? "") === "";
    setStockErrors((prev) => {
      const next = { ...prev };
      if (empty) next[key] = true;
      else delete next[key];
      return next;
    });
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // - Alinha payload com banco:
  //   products: product
  //   product_variants: variantRows (quando format=variants)
  // ------------------------------------------------------
  const goToSeoKeywords = () => {
    navigateToTabWithUnlock("data");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("pf-seo-keywords-input");
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input");
        if (input) input.focus();
      });
    });
  };

  const handleSubmit = async () => {
  if (productSubmitInFlightRef.current) return;

  // ------------------------------------------------------
  // 1) DADOS (Nome do produto, SKU se simple, etc.)
  // ------------------------------------------------------
  const okData = validateDataTab();
  if (!okData) {
    navigateToTabWithUnlock("data");
    return;
  }

  // ------------------------------------------------------
  // 2) VARIAÇÕES (SKU se format === variants)
  // ------------------------------------------------------
  if (product.format === "variants") {
    setVariationsSubmitAttempted(true);
  }
  const okVariants = validateVariantsTab();
  if (!okVariants) {
    if (hasVariations) navigateToTabWithUnlock("variations");
    else navigateToTabWithUnlock("data");
    focusFirstInvalidField("variations");
    return;
  }

  // ------------------------------------------------------
  // 3) CUSTOS & PRECIFICAÇÃO
  // ------------------------------------------------------
  const okPricing = validatePricingTab();
  if (!okPricing) {
    navigateToTabWithUnlock("pricing");
    return;
  }

  const measureErr = validateProductMeasureFields(product);
  if (measureErr) {
    addNotification({
      type: "error",
      title: "Pesos & medidas",
      message: measureErr,
    });
    navigateToTabWithUnlock("measures");
    return;
  }

  await executeSubmit();
};

  const executeSubmit = async () => {
    if (productSubmitInFlightRef.current) return;

    const measureErrSubmit = validateProductMeasureFields(product);
    if (measureErrSubmit) {
      addNotification({
        type: "error",
        title: "Pesos & medidas",
        message: measureErrSubmit,
      });
      return;
    }

    if (mode === "edit" && !product?.id) {
      addNotification({
        type: "error",
        title: "Erro ao salvar",
        message: "Produto sem identificador. Recarregue a página e tente novamente.",
      });
      return;
    }

    productSubmitInFlightRef.current = true;
    setIsSavingProduct(true);

    try {
      const nameFromForm = productDataForm.values?.product_name;
      const skuFromForm = productDataForm.values?.sku;
      const productBase = {
        ...omitReadOnlyProductFields(product),
        ...(nameFromForm !== undefined ? { product_name: nameFromForm } : {}),
        ...(product.format === "simple" && skuFromForm !== undefined ? { sku: skuFromForm } : {}),
      };

      let resolvedImages = normalizeProductImagesForPayload(productBase.product_images);
      if (!resolvedImages?.length) {
        resolvedImages = await resolvePrimaryImageFromLinks({
          productId: productBase.id,
          draftKey: draftKeyRef.current,
        });
      }
      const productWithImages = {
        ...productBase,
        product_images: resolvedImages ?? null,
      };

      const toInt = (v) => {
        const parsed = parseInt(String(v || "0"), 10);
        return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
      };
      const measureOverrides = Object.fromEntries(
        PRODUCT_DECIMAL_MEASURE_FIELDS.map((key) => [key, parseDecimalBR(productWithImages[key])])
      );
      const payload = {
        mode,
        draftKey: draftKeyRef.current,
        product: {
          ...productWithImages,
          // Variações: sku_base explícito no payload; products.sku = raiz (alinhado à base persistida).
          ...(product.format === "variants"
            ? {
                sku:
                  String(product.sku_base ?? "").trim() ||
                  String(product.sku ?? "").trim(),
                sku_base: String(product.sku_base ?? "").trim() || null,
                gtin: "",
              }
            : {
                sku_base: null,
              }),
          ...measureOverrides,
        },
        variants:
          product.format === "variants"
            ? (variantRows || []).map((r) => ({
                id: r.id,
                sku: r.sku,
                gtin: r.gtin || null,
                cost_price: r.cost_price === "" ? null : r.cost_price,
                stock_quantity: toInt(r.stock_real),
                stock_minimum: toInt(r.stock_min),
                use_virtual_stock: !!r.use_virtual_stock,
                virtual_stock_quantity: r.use_virtual_stock ? toInt(r.stock_virtual) : 0,
                active: !!r.active,
                attributes: r.attributes || {},
              }))
            : [],
      };
      const productId = product?.id ?? `draft:${draftIdRef.current}`;
      if (product.format === "variants" && Array.isArray(payload.variants)) {
        const zeroStock = payload.variants
          .map((v, idx) => ({ v, row: variantRows[idx] }))
          .filter(({ v }) => v.stock_quantity === 0)
          .map(({ row }) => ({
            label: row?.attributes ? Object.values(row.attributes).join(" / ") : row?.sku ?? "Variação",
          }));
        const belowMin = payload.variants
          .map((v, idx) => ({ v, row: variantRows[idx] }))
          .filter(({ v }) => v.stock_quantity > 0 && v.stock_quantity < v.stock_minimum)
          .map(({ row }) => ({
            label: row?.attributes ? Object.values(row.attributes).join(" / ") : row?.sku ?? "Variação",
          }));
        const atLimit = payload.variants
          .map((v, idx) => ({ v, row: variantRows[idx] }))
          .filter(({ v }) => v.stock_quantity > 0 && v.stock_quantity === v.stock_minimum)
          .map(({ row }) => ({
            label: row?.attributes ? Object.values(row.attributes).join(" / ") : row?.sku ?? "Variação",
          }));
        if (zeroStock.length > 0) {
          dispatchStockRealZero(addNotification, { variants: zeroStock, productId });
        }
        if (belowMin.length > 0) {
          dispatchStockBelowMin(addNotification, { variants: belowMin, severity: "warning", productId });
        }
        if (atLimit.length > 0) {
          dispatchStockBelowMin(addNotification, { variants: atLimit, severity: "info", productId });
        }
      } else if (product.format === "simple") {
        const sq = toInt(product.stock_quantity);
        const sm = toInt(product.stock_minimum);
        const simpleLabel = { label: "Produto" };
        if (sq === 0) {
          dispatchStockRealZero(addNotification, { variants: [simpleLabel], productId });
        } else if (sq > 0 && sq < sm) {
          dispatchStockBelowMin(addNotification, { variants: [simpleLabel], severity: "warning", productId });
        } else if (sq > 0 && sq === sm) {
          dispatchStockBelowMin(addNotification, { variants: [simpleLabel], severity: "info", productId });
        }
      }
      if (typeof onSubmit === "function") {
        try {
          const result = await Promise.resolve(onSubmit(payload));
          if (result?.error) {
            const errText = String(result.error);
            const skuDup =
              result.code === "SKU_DUPLICATE" ||
              errText.includes("SKU já existe") ||
              errText.includes("este seller");
            addNotification({
              type: "error",
              title: skuDup ? "Não foi possível salvar" : "Erro ao salvar",
              message: skuDup ? "Já existe um produto com este SKU" : result.error,
            });
            return;
          }
          if (mode === "create" && result?.productId && draftKeyRef.current) {
            await relinkDraftToProduct(draftKeyRef.current, result.productId);
            await persistProductImagesAfterCreate(result.productId);
            setHealthProductId(result.productId);
            fetchHealth(result.productId);
          } else if (result?.productId || product?.id) {
            fetchHealth(result?.productId ?? product?.id);
          }

          lastSavedSnapshotRef.current = getFormSnapshotForGuard(
            product,
            variantRows,
            variationAttributes
          );
          setFormGuardEpoch((n) => n + 1);
          addNotification({
            title:
              mode === "edit"
                ? "Alteração realizada com sucesso"
                : "Cadastro realizado com sucesso",
            message:
              mode === "edit"
                ? "Produto atualizado e salvo com sucesso."
                : "Produto salvo e pronto para uso.",
            severity: NOTIFICATION_SEVERITY.INFO,
          });
          skipExitGuardRef.current = true;
          suppressNextBlockerModalRef.current = true;
          navigate("/produtos");
          if (typeof onSuccess === "function") onSuccess();
        } catch (err) {
          const msg = err?.message ?? err?.error ?? "Erro ao salvar produto.";
          addNotification({ type: "error", title: "Erro ao salvar", message: msg });
        }
        return;
      }
      console.log("Payload a salvar (UI):", payload);
    } finally {
      productSubmitInFlightRef.current = false;
      setIsSavingProduct(false);
    }
  };


  // ------------------------------------------------------
  // Img1 Produto (preview) — mesma resolução assíncrona que listagem (storage_path → URL assinada)
  // Com variações: miniatura na aba Dados = imagem principal da 1ª linha (sort_order nos links da variante)
  // ------------------------------------------------------
  const mainImageUrl = useProductMainImageSrc(product);
  const [firstVariantThumbUrl, setFirstVariantThumbUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (product.format !== "variants" || !Array.isArray(variantRows) || variantRows.length === 0) {
      setFirstVariantThumbUrl("");
      return undefined;
    }
    const row0 = variantRows[0];
    const vk = buildVariantKey(row0?.attributes || {});
    if (!vk) {
      setFirstVariantThumbUrl("");
      return undefined;
    }
    const pid = product?.id;
    const hasProductId = pid && typeof pid === "string" && !String(pid).startsWith("draft:");
    const dk = draftKeyRef.current;
    const canOperate = hasProductId || (dk && typeof dk === "string");
    if (!canOperate) {
      setFirstVariantThumbUrl("");
      return undefined;
    }
    const opts = hasProductId ? { productId: pid } : { draftKey: dk };
    (async () => {
      try {
        const links = await listLinks({ ...opts, variantKey: vk });
        const path = pickFirstImageLinkStoragePath(links);
        const u = path ? await resolveProductImageSrc({ storage_path: path }) : "";
        if (!cancelled) setFirstVariantThumbUrl(u);
      } catch {
        if (!cancelled) setFirstVariantThumbUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.format, product?.id, variantRows, buildVariantKey]);

  const dataTabThumbUrl =
    product.format === "variants" ? firstVariantThumbUrl || mainImageUrl : mainImageUrl;

  const panelProductThumb = useMemo(() => {
    if (mode !== "edit") return null;
    const variantThumb = product.format === "variants" && firstVariantThumbUrl;
    return {
      src: dataTabThumbUrl || "",
      title: dataTabThumbUrl
        ? variantThumb
          ? "Imagem principal da primeira variação"
          : "Imagem principal do produto"
        : "Sem imagem",
      ariaLabel: variantThumb
        ? "Imagem principal da primeira variação"
        : "Imagem principal do produto",
      alt: variantThumb
        ? "Imagem principal da primeira variação"
        : "Imagem principal do produto",
    };
  }, [mode, dataTabThumbUrl, product.format, firstVariantThumbUrl]);

  // ------------------------------------------------------
  // Layout: helper para exibir atributos do variant row
  // ------------------------------------------------------
  const variantAttrColumns = useMemo(() => {
    const names = (variationAttributes || [])
      .map((a) => a.name)
      .filter(Boolean);

    // Se vierem variantes do banco (edit) sem variationAttributes reconstruído,
    // a gente tenta inferir do primeiro row.
    if (names.length === 0 && variantRows.length > 0) {
      return Object.keys(variantRows[0].attributes || {});
    }

    return names;
  }, [variationAttributes, variantRows]);

  // ------------------------------------------------------
  // ESTOQUE: linhas para render (variantes ou 1 linha "simple")
  // Unifica UI para produto com/sem variações
  // ------------------------------------------------------
  const stockRowsForRender = useMemo(() => {
    if (product.format === "variants") return variantRows;
    return [
      {
        id: SIMPLE_STOCK_KEY,
        stock_real: String(product.stock_quantity ?? ""),
        stock_min: String(product.stock_minimum ?? ""),
        use_virtual_stock: !!product.use_virtual_stock,
        stock_virtual: String(product.virtual_stock_quantity ?? 0),
        attributes: {},
      },
    ];
  }, [
    product.format,
    product.stock_quantity,
    product.stock_minimum,
    product.use_virtual_stock,
    product.virtual_stock_quantity,
    variantRows,
  ]);

  return (
    <>
    <div className="pf-page pf-page--bleed">
      <div className="pf-wrap">
        {/* ==================================================
           LAYOUT PRINCIPAL: painel à esquerda + formulário à direita (Bling-like)
        ================================================== */}
        <div className="pf-layout">
          <ProductFormRightPanel
            title={mode === "edit" ? "Editar produto" : "Novo produto"}
            steps={availableTabs}
            activeId={safeTab}
            stepsClickable={!isSavingProduct}
            isStepUnlocked={(stepId) => {
              if (allStepsUnlocked) return true;
              const i = availableTabIds.indexOf(stepId);
              return i >= 0 && i <= maxReachedIndex;
            }}
            onStepChange={handlePanelStepChange}
            progressPercent={sidePanelProgressPercent}
            panelProductThumb={panelProductThumb}
          />

          <div className="pf-card pf-card--primary">
      {/* ==================================================
         HEADER: botão Fechar no topo direito
      ================================================== */}
      <div className="pf-header-bar">
        <div className="pf-header-actions">
          <button type="button" className="pf-close" onClick={handleClose}>
            Fechar
          </button>
        </div>
      </div>

        <div className="pf-form-area">
      <div
        className={`pf-body${isSavingProduct ? " pf-body--saving" : ""}`}
        data-active-tab={safeTab}
      >
        <S7FormSavingOverlay show={isSavingProduct} message="Salvando produto..." />
        <div className="pf-body-inner"></div>
        
        {/* =======================
            ABA: DADOS
        ======================= */}
        {safeTab === "data" && (
          <div className="pf-container">
            <h2 className="pf-tab-title">Dados</h2>
            <div className="pf-product-name-fixed pf-product-name-fixed--in-data">
              <div className="pf-product-name-fields">
                <FieldLabel
                  text="Nome do produto"
                  required
                  copyKey="product_name"
                  copiedKey={copiedKey}
                  onCopy={() => handleCopy(product.product_name, "product_name")}
                />
                <S7Input
                  name="product_name"
                  placeholder="Ex: Armário de cozinha 3 portas"
                  value={productDataForm.values.product_name}
                  onChange={(e) => {
                    const v = e.target.value;
                    productDataForm.setValue("product_name", v);
                    setProduct((p) => ({ ...p, product_name: v }));
                  }}
                  onBlur={() => productDataForm.handleBlur("product_name")}
                  error={productDataForm.getFieldState("product_name").hasError}
                  success={false}
                  message=""
                  helperText=""
                  hint=""
                />
                {productDataForm.getFieldState("product_name").hasError && (
                  <div className="s7-error">
                    {productDataForm.getFieldState("product_name").message}
                  </div>
                )}
              </div>
            </div>

            {/* Linha 1: Formato + SKU */}
            <div className="pf-row">
              <div className="pf-group pf-data-col">
                <FieldLabel
                  text="Formato"
                  infoText={
                    formatLocked
                      ? "Produto com variações não pode voltar para simples após salvo."
                      : product.format === "simple"
                        ? "Produto simples (sem variação de características)"
                        : "Produto com variação (Ex: Cor ou Voltagem)"
                  }
                  tipBottom={true}
                  wrap={true}
                  side="left"
                />
                <select
                  className="s7-select s7-input"
                  value={product.format}
                  onChange={(e) => handleFormatChange(e.target.value)}
                  disabled={formatLocked}
                  title={formatLocked ? "Produto com variações não pode voltar para simples após salvo." : undefined}
                >
                  <option value="simple">Simples</option>
                  <option value="variants">Com variações</option>
                </select>
              </div>

              {product.format === "simple" && (
                <div className="pf-group pf-data-col">
                  <FieldLabel
                    text="SKU"
                    required
                    infoText="O SKU é o identificador do produto e faz a ligação com seus anúncios nos marketplaces. Use um padrão consistente para manter controle e evitar erros."
                    tipBottom={true}
                    wrap={true}
                    side="left"
                    copyKey="sku"
                    copiedKey={copiedKey}
                    onCopy={() => handleCopy(product.sku, "sku")}
                  />
                  <S7Input
                    name="sku"
                    placeholder="SKU interno"
                    value={productDataForm.values.sku}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s+/g, " ").trimStart();
                      productDataForm.setValue("sku", v);
                      setProduct((p) => ({ ...p, sku: v }));
                    }}
                    onBlur={() => productDataForm.handleBlur("sku")}
                    error={productDataForm.getFieldState("sku").hasError}
                    success={false}
                    message=""
                    helperText=""
                    hint=""
                  />
                  {productDataForm.getFieldState("sku").hasError && (
                    <div className="s7-error">
                      {productDataForm.getFieldState("sku").message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linha 2: EAN/GTIN + NCM */}
            <div className="pf-row">
              {product.format === "simple" && (
                <div className="pf-group pf-data-col">
                  <FieldLabel
                    text="EAN / GTIN"
                    copyKey="gtin"
                    copiedKey={copiedKey}
                    onCopy={() => handleCopy(product.gtin, "gtin")}
                  />
                  <input
                    className={`s7-input ${errors.gtin ? "s7-input--error" : ""}`}
                    inputMode="numeric"
                    placeholder="Código de barras"
                    value={product.gtin}
                    onChange={(e) =>
                      handleChange(
                        "gtin",
                        e.target.value.replace(/\D/g, "").slice(0, 13)
                      )
                    }
                  />
                  {errors.gtin && <div className="s7-error">{errors.gtin}</div>}
                </div>
              )}

              <div className="pf-group pf-data-col">
                <FieldLabel
                  text="NCM"
                  copyKey="ncm"
                  copiedKey={copiedKey}
                  onCopy={() => handleCopy(product.ncm, "ncm")}
                />
                <input
                  className={`s7-input ${errors.ncm ? "s7-input--error" : ""}`}
                  inputMode="numeric"
                  placeholder="Ex: 94036000"
                  value={product.ncm}
                  onChange={(e) => {
                    const masked = formatNcm(e.target.value);
                    handleChange("ncm", masked);

                    const digits = masked.replace(/\D/g, "");
                    if (digits.length === 8)
                      setErrors((prev) => ({ ...prev, ncm: undefined }));
                  }}
                />
                {errors.ncm && <div className="s7-error">{errors.ncm}</div>}
              </div>
            </div>

            {/* Linha 3: Marca + Modelo */}
            <div className="pf-row">
              <div className="pf-group pf-data-col">
                <label className="s7-label">Marca</label>
                <input
                  className="s7-input"
                  value={product.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>

              <div className="pf-group pf-data-col">
                <label className="s7-label">Modelo</label>
                <input
                  className="s7-input"
                  value={product.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>
            </div>

            {/* Linha 4: Palavras-chave SEO */}
            <div className="pf-row">
              <div className="pf-group pf-group--full pf-group--seo">
                <FieldLabel
                  text="Palavras-chave SEO"
                  infoText="Palavras-chave são a ponte entre o comprador e seu produto. Use termos precisos para renomear suas imagens e otimizar o título: isso ajuda o algoritmo do Mercado Livre e o Google a darem prioridade e relevância ao seu anúncio."
                  tipBottom={true}
                  wrap={true}
                  side="left"
                  copyKey="seo_keywords"
                  copiedKey={copiedKey}
                  onCopy={() => handleCopy(product.seo_keywords, "seo_keywords")}
                />

                <div className="pf-seo-wrapper">
                  <SeoKeywordsInput
                    id="pf-seo-keywords-input"
                    value={product.seo_keywords}
                    onChange={(v) => handleChange("seo_keywords", v)}
                    placeholder="Ex: armário cozinha, armário 3 portas, armário branco"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            ABA: Custos & precificação (padrão premium)
            Objetivo:
            - Mesma pegada visual do “Combinações geradas” (cards)
            - Consistência SaaS premium
        ================================================================== */}
        {safeTab === "pricing" && (
          <div className="pf-container">
            <h2 className="pf-tab-title">Custos & precificação</h2>
            {/* SIMPLE: campos em coluna */}
            {product.format === "simple" && (
              <div className="pf-pricing-simple-column">
                {/* Custo do produto */}
                <div className="pf-row">
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo do produto"
                      required
                      infoText="Este é o principal custo da sua operação. Ele impacta diretamente sua margem de lucro e a precificação ideal do produto."
                      tipBottom={true}
                      wrap={true}
                      side="left"
                    />
                    <S7Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={s7FormatBRLFromDigits(simpleCostDigits)}
                      onChange={(e) => {
                        const digits = s7ExtractDigits(e.target.value);
                        setSimpleCostDigits(digits);
                        handleChange("cost_price", s7DigitsToDecimalStr(digits));

                        if (costErrors.simpleCost) {
                          setCostErrors((prev) => ({ ...prev, simpleCost: false }));
                        }
                      }}
                      onBlur={handleSimpleCostBlur}
                      error={costErrors.simpleCost}
                      success={false}
                      message=""
                      helperText=""
                      hint=""
                    />
                    {costErrors.simpleCost && (
                      <div className="s7-error">{PRODUCT_FORM_MSG.COST_MUST_BE_POSITIVE}</div>
                    )}
                  </div>
                </div>

                {/* Custo Embalagem */}
                <div className="pf-row">
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo Embalagem"
                      infoText="Inclua caixa, saco, plástico bolha e outros materiais. Esses custos somados influenciam o lucro final de cada venda."
                      tipBottom={true}
                      wrap={true}
                    />
                    <input
                      className="s7-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={s7FormatBRLFromDigits(packagingDigits)}
                      onChange={(e) => {
                        const digits = s7ExtractDigits(e.target.value);
                        setPackagingDigits(digits);
                        handleChange("packaging_cost", s7DigitsToDecimalStr(digits));
                      }}
                    />
                  </div>
                </div>

                {/* Custo Operacional */}
                <div className="pf-row">
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo Operacional"
                      infoText="Inclui etiquetas, insumos, mão de obra e tempo operacional. Pequenos valores acumulados podem reduzir seu lucro no final do mês."
                      tipBottom={true}
                      wrap={true}
                    />
                    <input
                      className="s7-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={s7FormatBRLFromDigits(operationalDigits)}
                      onChange={(e) => {
                        const digits = s7ExtractDigits(e.target.value);
                        setOperationalDigits(digits);
                        handleChange("operational_cost", s7DigitsToDecimalStr(digits));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VARIANTS: globais lado a lado + cards */}
            {product.format === "variants" && (
              <>
                {/* Custos globais (sempre visíveis) */}
                <div className="pf-row pf-pricing-costs-row">
                  {/* Custo Embalagem */}
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo Embalagem"
                      infoText="Inclua caixa, saco, plástico bolha e outros materiais. Esses custos somados influenciam o lucro final de cada venda."
                      tipBottom={true}
                      wrap={true}
                    />
                    <input
                      className="s7-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={s7FormatBRLFromDigits(packagingDigits)}
                      onChange={(e) => {
                        const digits = s7ExtractDigits(e.target.value);
                        setPackagingDigits(digits);
                        handleChange("packaging_cost", s7DigitsToDecimalStr(digits));
                      }}
                    />
                  </div>

                  {/* Custo Operacional */}
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo Operacional"
                      infoText="Inclui etiquetas, insumos, mão de obra e tempo operacional. Pequenos valores acumulados podem reduzir seu lucro no final do mês."
                      tipBottom={true}
                      wrap={true}
                    />
                    <input
                      className="s7-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={s7FormatBRLFromDigits(operationalDigits)}
                      onChange={(e) => {
                        const digits = s7ExtractDigits(e.target.value);
                        setOperationalDigits(digits);
                        handleChange("operational_cost", s7DigitsToDecimalStr(digits));
                      }}
                    />
                  </div>
                </div>

                {/* VARIANTS: custo por variação (cards como “Combinações geradas”) */}
                <div className="pf-pricing-variants-outer">
                  {variantRows.length === 0 ? (
                    <div className="s7-alert s7-alert--warning" style={{ marginTop: 10 }}>
                      Gere as variações na aba <strong>Variações</strong> para preencher os custos por combinação.
                    </div>
                  ) : (
                    <div className="pf-pricing-variants-list">
                      {variantRows.map((row, idx) => {
                        const hasCostError = (costErrors.variantsMissingIds || []).includes(row.id);

                        return (
                          <div key={row.id} className="s7-card pf-pricing-variant-card pf-variant-row">
                            <div className="pf-pricing-attrs">
                              {variantAttrColumns.map((attr) => (
                                <div key={`${row.id}_${attr}`} className="pf-variant-attr">
                                  <span className="pf-variant-attr-label">{attr}</span>
                                  <span className="pf-variant-attr-value">
                                    {row.attributes?.[attr] || "-"}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="pf-pricing-cost">
                              <FieldLabel
                                text="Custo do produto"
                                required
                                infoText="Este é o principal custo da sua operação. Ele impacta diretamente sua margem de lucro e a precificação ideal do produto."
                                side="left"
                                tipBottom={true}
                                wrap={true}
                              />

                              <div
                                className={
                                  idx === 0 && variantRows.length > 1
                                    ? "pf-variant-cost-row pf-variant-cost-row--with-apply"
                                    : "pf-variant-cost-row"
                                }
                              >
                                <S7Input
                                  inputClassName="pf-variant-cost-input"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="R$ 0,00"
                                  value={s7FormatBRLFromDigits(variantCostDigitsById[row.id] || "")}
                                  onChange={(e) => {
                                    const digits = s7ExtractDigits(e.target.value);

                                    setVariantCostDigitsById((prev) => ({ ...prev, [row.id]: digits }));
                                    handleVariantRowChange(row.id, "cost_price", s7DigitsToDecimalStr(digits));

                                    if (hasCostError) {
                                      setCostErrors((prev) => ({
                                        ...prev,
                                        variantsMissingIds: (prev.variantsMissingIds || []).filter(
                                          (id) => id !== row.id
                                        ),
                                      }));
                                    }
                                  }}
                                  onBlur={() => handleVariantCostBlur(row.id)}
                                  error={hasCostError}
                                  success={false}
                                  message=""
                                  helperText=""
                                  hint=""
                                />

                                {idx === 0 && variantRows.length > 1 && (
                                  <button
                                    type="button"
                                    className="s7-btn s7-btn--secondary pf-pricing-apply-all-btn s7-tip s7-tip-bottom s7-tip-left"
                                    style={{
                                      padding: "4px 10px",
                                      minWidth: "auto",
                                      fontSize: 12,
                                    }}
                                    data-tip="Aplicar este valor para todas as variações"
                                    aria-label="Aplicar este valor para todas as variações"
                                    onClick={() => {
                                      const baseDigits = variantCostDigitsById[row.id] || "";

                                      setVariantCostDigitsById((prev) => {
                                        const next = { ...prev };
                                        (variantRows || []).forEach((r) => {
                                          next[r.id] = baseDigits;
                                        });
                                        return next;
                                      });

                                      const baseDecimal = s7DigitsToDecimalStr(baseDigits);
                                      setVariantRows((prev) =>
                                        prev.map((r) => ({ ...r, cost_price: baseDecimal }))
                                      );

                                      setCostErrors((prev) => ({ ...prev, variantsMissingIds: [] }));
                                    }}
                                  >
                                    {/* Mesmo padrão visual do botão do SKU (Variações): emoji, não Lucide */}
                                    {variantCostDigitsById[row.id] ? "🔄" : "⚡"}
                                  </button>
                                )}
                              </div>

                              {hasCostError && (
                                <div className="s7-error">{PRODUCT_FORM_MSG.COST_MUST_BE_POSITIVE}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* =======================
            ABA: IMAGENS (mantém)
        ======================= */}
        {safeTab === "images" && (
          <div className="pf-container">
            <h2 className="pf-tab-title">Imagens</h2>
            {product.format === "variants" && variantRows.length === 0 ? (
              <div className="s7-alert s7-alert--warning" style={{ marginTop: 10 }}>
                Gere as variações na aba <strong>Variações</strong> para adicionar imagens por combinação.
              </div>
            ) : (
              <ProductFormImagesTab
                productId={product?.id}
                draftKey={draftKeyRef.current}
                format={product.format}
                variantRows={variantRows}
                buildVariantKey={buildVariantKey}
                onVariantReorder={handleVariantReorder}
                seoKeywords={product?.seo_keywords ?? ""}
                productName={product?.product_name ?? ""}
                onSwitchToDataTab={() => navigateToTabWithUnlock("data")}
                onGoToSeo={goToSeoKeywords}
                onImageProgressChange={handleImageProgressChange}
                onProductImageLinksSnapshot={handleProductImageLinksSnapshot}
              />
            )}
          </div>
        )}

        {/* =======================
         ABA: VARIAÇÕES (novo fluxo — via ProductVariationsTab)
         ======================= */}
        {safeTab === "variations" && hasVariations && (
          <ProductVariationsTab
            product={product}
            errors={errors}
            hasVariations={hasVariations}
            variationAttributes={variationAttributes}
            draftAttrChips={draftAttrChips}
            draftAttrInput={draftAttrInput}
            setDraftAttrInput={setDraftAttrInput}
            draftOptions={draftOptions}
            draftOptionInput={draftOptionInput}
            setDraftOptionInput={setDraftOptionInput}
            addOptionAttrId={addOptionAttrId}
            addOptionInput={addOptionInput}
            addOptionError={addOptionError}
            skuBaseChips={skuBaseChips}
            skuBaseInput={skuBaseInput}
            setSkuBaseInput={setSkuBaseInput}
            skuBaseInputRef={skuBaseInputRef}
            skuBaseError={skuBaseError}
            variantRows={variantRows}
            variantAttrColumns={variantAttrColumns}
            copiedKey={copiedKey}
            skuErrorsById={skuErrorsById}
            variationsSubmitAttempted={variationsSubmitAttempted}
            variationsTouchedFields={variationsTouchedFields}
            onVariantSkuBlur={(rowId) => {
              setVariationsTouchedFields((prev) => ({
                ...prev,
                [`sku:${rowId}`]: true,
              }));
            }}
            skuAtFocusRef={skuAtFocusRef}
            removeDraftAttrChip={removeDraftAttrChip}
            handleDraftAttrKeyDown={handleDraftAttrKeyDown}
            removeDraftOption={removeDraftOption}
            handleDraftOptionKeyDown={handleDraftOptionKeyDown}
            handleAddVariationAttribute={handleAddVariationAttribute}
            handleChangeAttributeName={handleChangeAttributeName}
            removeOptionFromAttribute={removeOptionFromAttribute}
            handleAddOptionToAttribute={handleAddOptionToAttribute}
            setAddOptionAttrId={setAddOptionAttrId}
            setAddOptionInput={setAddOptionInput}
            setAddOptionError={setAddOptionError}
            handleGenerateSkuAuto={handleGenerateSkuAuto}
            removeSkuBaseChip={removeSkuBaseChip}
            handleSkuBaseKeyDown={handleSkuBaseKeyDown}
            handleCopy={handleCopy}
            handleVariantRowChange={handleVariantRowChange}
            isVariantLinkedToMarketplaces={isVariantLinkedToMarketplaces}
            setSkuManualIntegratedModal={setSkuManualIntegratedModal}
            handleGenerateSkuForRow={handleGenerateSkuForRow}
            setDeleteVariantRowId={setDeleteVariantRowId}
            initialConfigCollapsed={collapseVariationsConfigOnEnter}
            expandVariationsConfigRef={expandVariationsConfigRef}
          />
        )}


        {/* =======================
            ABA: DESCRIÇÃO (mantém)
        ======================= */}
        {safeTab === "description" && (
          <div className="pf-container pf-container--description">
            <h2 className="pf-tab-title">Descrição</h2>
            <div className="pf-description-section">
              <div className="pf-label-row">
                <div className="pf-label-left">
                  <label className="s7-label" htmlFor="pf-description-textarea">
                    Descrição do produto
                  </label>
                </div>
                <button
                  type="button"
                  className="pf-copy-btn s7-tip s7-tip-bottom s7-tip-right"
                  data-tip={copiedKey === "description" ? "Copiado!" : "Copiar"}
                  aria-label="Copiar descrição"
                  onClick={() => {
                    const raw = product?.description ?? "";
                    if (!String(raw).trim()) return;
                    handleCopy(raw, "description");
                  }}
                >
                  {copiedKey === "description" ? "✓" : "⧉"}
                </button>
              </div>

              <div className="pf-description-wrapper">
                <textarea
                  id="pf-description-textarea"
                  className="s7-input pf-description-textarea"
                  placeholder="Descreva o produto destacando benefícios, materiais, dimensões, diferenciais e informações importantes para o cliente."
                  value={product.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <span className="pf-description-count">
                {(product?.description ?? "").length} caracteres
              </span>
            </div>
          </div>
        )}

          {/* =======================
            ABA: ESTOQUE (v2)
          ======================= */}
        {safeTab === "stock" && (
          <div className="pf-container">
            <h2 className="pf-tab-title">Estoque</h2>
            {/* ===============================
                ESTOQUE — FORMATO SIMPLES
               =============================== */}
            {product.format === "variants" && variantRows.length === 0 ? (
              <div className="s7-alert s7-alert--warning" style={{ marginTop: 10 }}>
                Gere as variações na aba <strong>Variações</strong> para preencher o estoque
                por combinação.
              </div>
            ) : null}
            {(product.format === "variants" && variantRows.length > 0) || product.format === "simple" ? (
              <div className="pf-stock-variants-list">
                {stockRowsForRender.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`pf-stock-variant-card ${product.format === "simple" ? "pf-stock-simple" : "s7-card"}`}
                  >
                    {product.format === "simple" ? (
                      /* Modo simples: só Estoque, Estoque mínimo, Estoque virtual (empilhados, sem nome do produto) */
                      <div className="pf-stock-simple-column">
                        <div className="pf-row">
                          <div className="pf-group">
                            <FieldLabel
                              text="Estoque"
                              required
                              infoText="Quantidade disponível para venda. Manter o estoque atualizado evita cancelamentos e melhora a reputação nos marketplaces."
                              tipBottom={true}
                              wrap={true}
                              side="left"
                            />
                            <S7Input
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_real ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_real", e.target.value.replace(/\D/g, ""))
                              }
                              onBlur={() => handleStockRealBlur(row)}
                              error={Boolean(
                                (row.id === SIMPLE_STOCK_KEY
                                  ? stockErrors[SIMPLE_STOCK_KEY]
                                  : stockErrors[row.id]) ||
                                  (zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) ||
                                  zeroStockAttention?.variants?.[row.id]
                              )}
                              success={false}
                              message=""
                              helperText=""
                              hint=""
                            />
                            {(row.id === SIMPLE_STOCK_KEY ? stockErrors[SIMPLE_STOCK_KEY] : stockErrors[row.id]) && (
                              <div className="s7-error">Estoque é obrigatório.</div>
                            )}
                            {!stockErrors[row.id === SIMPLE_STOCK_KEY ? SIMPLE_STOCK_KEY : row.id] && ((zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) || zeroStockAttention?.variants?.[row.id]) && (
                              <div className="s7-error">Ajuste o estoque para continuar.</div>
                            )}
                          </div>
                        </div>
                        <div className="pf-row">
                          <div className="pf-group">
                            <FieldLabel
                              text="Estoque mínimo"
                              infoText="Quando o estoque atinge esse valor, você pode ser alertado para reabastecer e evitar perder vendas por ruptura."
                              tipBottom={true}
                              wrap={true}
                              side="right"
                            />
                            <input
                              className="s7-input"
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_min ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_min", e.target.value.replace(/\D/g, ""))
                              }
                            />
                          </div>
                        </div>
                        <div className="pf-row">
                          <div className="pf-group">
                            <div className="pf-stock-virtual-header">
                              <label className="pf-switch pf-stock-virtual-switch">
                                <input
                                  type="checkbox"
                                  checked={!!row.use_virtual_stock}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setPendingVariantId(row.id);
                                    setPendingNextChecked(checked);
                                    setVirtualModalMode(checked ? "enable" : "disable");
                                    setVirtualModalOpen(true);
                                  }}
                                  aria-label="Usar estoque virtual"
                                />
                              </label>
                              <FieldLabel
                                text="Estoque virtual"
                                infoText="Este estoque será sincronizado com os marketplaces. O estoque real do produto será controlado automaticamente para evitar vendas acima do disponível."
                                tipBottom={true}
                                wrap={true}
                                side="right"
                              />
                            </div>
                            <input
                              className="s7-input"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Ex: 200"
                              value={row.stock_virtual === "0" ? "" : row.stock_virtual}
                              disabled={!row.use_virtual_stock}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_virtual", e.target.value.replace(/\D/g, ""))
                              }
                              onBlur={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val === "") handleStockRowChange(row.id, "stock_virtual", "0");
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modo variações: card com atributos + controles (igual ao atual) */
                      <>
                        <div className="pf-stock-attrs">
                          {variantAttrColumns.map((attr) => (
                            <div key={`${row.id}_${attr}`} className="pf-stock-attr">
                              <label className="s7-label">{attr}</label>
                              <div className="pf-pricing-attr-value">{row.attributes?.[attr] || "-"}</div>
                            </div>
                          ))}
                        </div>
                        <div className="pf-stock-controls">
                          <div className="pf-group">
                            <FieldLabel
                              text="Estoque"
                              required
                              infoText="Quantidade disponível para venda. Manter o estoque atualizado evita cancelamentos e melhora a reputação nos marketplaces."
                              tipBottom={true}
                              wrap={true}
                              side="left"
                            />
                            <S7Input
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_real ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_real", e.target.value.replace(/\D/g, ""))
                              }
                              onBlur={() => handleStockRealBlur(row)}
                              error={Boolean(
                                (row.id === SIMPLE_STOCK_KEY
                                  ? stockErrors[SIMPLE_STOCK_KEY]
                                  : stockErrors[row.id]) ||
                                  (zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) ||
                                  zeroStockAttention?.variants?.[row.id]
                              )}
                              success={false}
                              message=""
                              helperText=""
                              hint=""
                            />
                            {(row.id === SIMPLE_STOCK_KEY ? stockErrors[SIMPLE_STOCK_KEY] : stockErrors[row.id]) && (
                              <div className="s7-error">Estoque é obrigatório.</div>
                            )}
                            {!stockErrors[row.id === SIMPLE_STOCK_KEY ? SIMPLE_STOCK_KEY : row.id] && ((zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) || zeroStockAttention?.variants?.[row.id]) && (
                              <div className="s7-error">Ajuste o estoque para continuar.</div>
                            )}
                          </div>
                          <div className="pf-group">
                            <FieldLabel
                              text="Estoque mínimo"
                              infoText="Quando o estoque atinge esse valor, você pode ser alertado para reabastecer e evitar perder vendas por ruptura."
                              tipBottom={true}
                              wrap={true}
                              side="right"
                            />
                            <input
                              className="s7-input"
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_min ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_min", e.target.value.replace(/\D/g, ""))
                              }
                            />
                          </div>
                          <div className="pf-group">
                            <div className="pf-stock-virtual-header">
                              <label className="pf-switch pf-stock-virtual-switch">
                                <input
                                  type="checkbox"
                                  checked={!!row.use_virtual_stock}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setPendingVariantId(row.id);
                                    setPendingNextChecked(checked);
                                    setVirtualModalMode(checked ? "enable" : "disable");
                                    setVirtualModalOpen(true);
                                  }}
                                  aria-label="Usar estoque virtual"
                                />
                              </label>
                              <FieldLabel
                                text="Estoque virtual"
                                infoText="Este estoque será sincronizado com os marketplaces. O estoque real do produto será controlado automaticamente para evitar vendas acima do disponível."
                                tipBottom={true}
                                wrap={true}
                                side="right"
                              />
                            </div>
                            <input
                              className="s7-input"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Ex: 200"
                              value={row.stock_virtual === "0" ? "" : row.stock_virtual}
                              disabled={!row.use_virtual_stock}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_virtual", e.target.value.replace(/\D/g, ""))
                              }
                              onBlur={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val === "") handleStockRowChange(row.id, "stock_virtual", "0");
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* =======================
            ABA: PESOS & MEDIDAS (mantém)
        ======================= */}
        {safeTab === "measures" && (
          <div className="pf-container">
            <div className="pf-tab-title-row pf-tab-title-row--measures-tip">
              <h2 className="pf-tab-title">Pesos & medidas</h2>
              <button
                type="button"
                className="pf-info-btn pf-measures-tab-tip-trigger s7-tip s7-tip-wrap"
                data-tip={PF_MEASURES_TAB_TOOLTIP}
                aria-label="Informações sobre largura, comprimento e altura"
              >
                i
              </button>
            </div>
            <div className="s7-card pf-dimensions-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas de envio</h3>
                <p className="s7-card__subtitle">Medidas usadas para cálculo de frete e logística.</p>
              </div>

              <div className="pf-row pf-dimensions-grid">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.width) || ""}
                    onChange={(e) =>
                      handleChange("width", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.height) || ""}
                    onChange={(e) =>
                      handleChange("height", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.length) || ""}
                    onChange={(e) =>
                      handleChange("length", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 8,450"
                    value={toKgInputValue(product.weight) || ""}
                    onChange={(e) =>
                      handleChange("weight", formatKgInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
             </div>

             <div className="s7-card pf-dimensions-card" style={{ marginTop: 12 }}>
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas do produto (montado)</h3>
                <p className="s7-card__subtitle">Medidas reais do produto pronto/montado (referência interna).</p>
              </div>

              <div className="pf-row pf-dimensions-grid">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.assembled_width) || ""}
                    onChange={(e) =>
                      handleChange("assembled_width", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.assembled_height) || ""}
                    onChange={(e) =>
                      handleChange("assembled_height", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 10,00"
                    value={toCmInputValue(product.assembled_length) || ""}
                    onChange={(e) =>
                      handleChange("assembled_length", formatCmInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 8,450"
                    value={toKgInputValue(product.assembled_weight) || ""}
                    onChange={(e) =>
                      handleChange("assembled_weight", formatKgInput(e.target.value))
                    }
                    onKeyDown={measureDecimalOnKeyDown}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
              </div>
             </div>
             )}

              {/* =======================
              ABA: TÍTULO DO ANÚNCIO
              Títulos alternativos para marketplaces (ML, etc.)
              Até 10 títulos por produto. Backend valida duplicidade e regras.
              FUTURE V2:
              Aqui será integrado gerador de títulos, descrições e palavras-chave via IA.
              Backend será responsável por gerar sugestões contextualizadas por marketplace.
              ======================= */}
              {safeTab === "ad_titles" && (
                <div className="pf-container">
                  <h2 className="pf-tab-title">Título do anúncio</h2>
                  <div className="s7-local-section-header">
                    <div className="s7-local-section-header-left">
                      <span className="s7-local-section-title">
                        Crie até 10 títulos por produto
                      </span>

                      <span
                        className="s7-local-section-count"
                        aria-label="Quantidade de títulos"
                      >
                        {(product?.ad_titles ?? []).length}/10
                      </span>
                    </div>

                    <div className="s7-local-section-actions">
                      {(product?.ad_titles ?? []).length < 10 && (
                        <button
                          type="button"
                          className="s7-btn s7-btn--secondary s7-ad-titles-add-btn s7-ad-title-add-btn"
                          onClick={handleAddTitle}
                        >
                          + Adicionar título
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de cards (um por título) */}
                  <div className="s7-ad-titles-cards">
                    {(product?.ad_titles ?? []).map((item, idx) => (
                      <div key={item.id} className="s7-card s7-ad-titles-card">
                        {/* Título N e ícone copiar na mesma linha; copiar no final (direita), acima do input */}
                        <div className="s7-ad-title-copy-row">
                          <span className="s7-label s7-ad-titles-card-label">Título {idx + 1}</span>
                          <div className="s7-ad-title-copy-wrap">
                            <button
                              type="button"
                              className="pf-copy-btn s7-tip s7-tip-bottom"
                              onClick={() => handleCopy(item.value, `ad_title_${item.id}`)}
                              aria-label="Copiar título"
                              data-tip={copiedKey === `ad_title_${item.id}` ? "Copiado!" : "Copiar"}
                            >
                              {copiedKey === `ad_title_${item.id}` ? "✓" : "⧉"}
                            </button>
                          </div>
                        </div>
                        <div className="s7-ad-title-row">
                          <div className="s7-ad-title-input-wrap">
                            <input
                              type="text"
                              className="s7-input s7-ad-title-input"
                              placeholder="Ex: Produto XYZ - Marca - Modelo"
                              value={item.value}
                              onChange={(e) => handleChangeTitle(item.id, e.target.value)}
                            />
                            <span className="s7-ad-title-count">
                              {item.value?.length ?? 0} caracteres
                            </span>
                          </div>
                          {(product?.ad_titles ?? []).length > 1 && (
                            <button
                              type="button"
                              className="s7-title-delete-btn"
                              onClick={() => setAdTitleDeleteId(item.id)}
                              aria-label="Excluir título"
                            >
                              <Trash2 size={18} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal confirmação exclusão título do anúncio (padrão Suse7) */}
              {adTitleDeleteId != null &&
                createPortal(
                  <div
                    className="s7-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="s7-ad-title-delete-modal-title"
                  >
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--warning">!</div>
                      </div>
                      <h2 id="s7-ad-title-delete-modal-title" className="s7-modal-title">
                        Excluir título
                      </h2>
                      <p className="s7-modal-text">
                        Deseja realmente excluir este título?
                      </p>
                      <div className="s7-modal-actions">
                        <button
                          type="button"
                          className="s7-modal-btn-secondary"
                          onClick={() => setAdTitleDeleteId(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="s7-modal-btn-danger"
                          onClick={() => {
                            handleRemoveTitle(adTitleDeleteId);
                            setAdTitleDeleteId(null);
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* Modal confirmação exclusão de variação (aba Variações) */}
              {deleteVariantRowId != null &&
                createPortal(
                  <div
                    className="s7-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="s7-delete-variant-modal-title"
                  >
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--warning">!</div>
                      </div>
                      <h2 id="s7-delete-variant-modal-title" className="s7-modal-title">
                        Excluir variação
                      </h2>
                      <p className="s7-modal-text">
                        Tem certeza que deseja excluir esta variação?
                        <br />
                        Esta ação removerá o SKU e todas as informações associadas a esta combinação.
                      </p>
                      {(() => {
                        const row = (variantRows || []).find((r) => r.id === deleteVariantRowId);
                        return row && row.attributes && Object.keys(row.attributes).length > 0 ? (
                          <p className="s7-modal-text" style={{ marginTop: 8, fontWeight: 700 }}>
                            Exemplo: {Object.entries(row.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        ) : null;
                      })()}
                      <div className="s7-modal-actions">
                        <button
                          type="button"
                          className="s7-modal-btn-secondary"
                          onClick={() => setDeleteVariantRowId(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="s7-modal-btn-danger"
                          onClick={() => {
                            handleRemoveVariantRow(deleteVariantRowId);
                          }}
                        >
                          Excluir variação
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* Modal sucesso: SKUs gerados (global) */}
              {skuSuccessModal.show &&
                createPortal(
                  <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-sku-success-title">
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--success">✓</div>
                      </div>
                      <h2 id="s7-sku-success-title" className="s7-modal-title">SKUs gerados com sucesso</h2>
                      <p className="s7-modal-text">
                        {skuSuccessModal.generated} SKU(s) foram gerados automaticamente. {skuSuccessModal.kept} variação(ões) já possuíam SKU e foram mantidas.
                      </p>
                      <div className="s7-modal-actions">
                        <button type="button" className="s7-modal-btn-primary" onClick={() => setSkuSuccessModal({ show: false, generated: 0, kept: 0 })}>
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* Modal regeração: já existem SKUs — 3 ações */}
              {skuRegenerateModalOpen &&
                createPortal(
                  <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-sku-regen-title">
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--warning">!</div>
                      </div>
                      <h2 id="s7-sku-regen-title" className="s7-modal-title">Regerar SKUs das variações</h2>
                      <p className="s7-modal-text">
                        Já existem variações com SKU preenchido. Regerar SKUs pode alterar identificadores já usados no sistema e nas integrações com marketplaces.
                      </p>
                      <p className="s7-modal-text" style={{ marginTop: 8 }}>
                        Essa ação deve ser usada com cuidado. Alterar SKUs pode exigir atualização automática dos anúncios integrados.
                      </p>
                      <div className="s7-modal-actions">
                        <button type="button" className="s7-modal-btn-secondary" onClick={() => setSkuRegenerateModalOpen(false)}>
                          Cancelar
                        </button>
                        <button type="button" className="s7-modal-btn-secondary" onClick={handleSkuRegenerateOnlyEmpty}>
                          Gerar apenas para SKUs vazios
                        </button>
                        <button type="button" className="s7-modal-btn-danger" onClick={handleSkuRegenerateAll}>
                          Substituir todos os SKUs
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* Modal individual: substituir SKU desta variação (já possui SKU) */}
              {skuIndividualModal != null &&
                createPortal(
                  <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-sku-individual-title">
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--warning">!</div>
                      </div>
                      <h2 id="s7-sku-individual-title" className="s7-modal-title">Alterar SKU desta variação</h2>
                      <p className="s7-modal-text">
                        Esta variação já possui um SKU preenchido. Deseja substituir pelo SKU gerado automaticamente?
                      </p>
                      {(() => {
                        const r = (variantRows || []).find((x) => x.id === skuIndividualModal.rowId);
                        return r && r.attributes && Object.keys(r.attributes).length > 0 ? (
                          <p className="s7-modal-text" style={{ marginTop: 8, fontWeight: 700 }}>
                            Variação: {Object.entries(r.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        ) : null;
                      })()}
                      <p className="s7-modal-text" style={{ marginTop: 8 }}>
                        <strong>SKU atual:</strong> {skuIndividualModal.currentSku}
                        <br />
                        <strong>Novo SKU:</strong> {skuIndividualModal.newSku}
                      </p>
                      <div className="s7-modal-actions">
                        <button type="button" className="s7-modal-btn-secondary" onClick={() => setSkuIndividualModal(null)}>
                          Cancelar
                        </button>
                        <button type="button" className="s7-modal-btn-danger" onClick={handleConfirmIndividualSkuReplace}>
                          Substituir SKU
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* Modal alteração manual de SKU em variação integrada (placeholder: row.linked_to_marketplaces) */}
              {skuManualIntegratedModal != null &&
                createPortal(
                  <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-sku-integrated-title">
                    <div className="s7-modal-card">
                      <div className="s7-modal-icon-wrap">
                        <div className="s7-modal-icon s7-modal-icon--warning">!</div>
                      </div>
                      <h2 id="s7-sku-integrated-title" className="s7-modal-title">Alterar SKU de variação integrada</h2>
                      <p className="s7-modal-text">
                        Esta variação já está vinculada a um ou mais marketplaces. Alterar o SKU fará com que o Suse7 atualize automaticamente essa identificação nas integrações compatíveis.
                      </p>
                      <p className="s7-modal-text" style={{ marginTop: 8 }}>
                        Use essa ação com cuidado para evitar inconsistências em estoque, anúncios e relatórios.
                      </p>
                      <div className="s7-modal-actions">
                        <button type="button" className="s7-modal-btn-secondary" onClick={() => setSkuManualIntegratedModal(null)}>
                          Cancelar
                        </button>
                        <button type="button" className="s7-modal-btn-primary" onClick={handleConfirmManualSkuIntegrated}>
                          Alterar SKU
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* =======================
              ABA: ANÚNCIOS (placeholder)
              ======================= */}
              {safeTab === "ads" && (
                <div className="pf-container">
                  <h2 className="pf-tab-title">Anúncios</h2>
                  <div className="section">
                    <div className="section-header">
                      <h3>Anúncios vinculados</h3>
                      <p className="section-subtitle">
                        Dados consolidados no servidor para cada anúncio associado a este produto (multi-marketplace).
                      </p>
                    </div>
                    {!product?.id ? (
                      <p className="hint">Salve o produto para listar os anúncios vinculados.</p>
                    ) : productAdsListingsLoading ? (
                      <p className="hint">Carregando anúncios…</p>
                    ) : productAdsListingsError ? (
                      <p className="hint" role="alert">
                        {productAdsListingsError}
                      </p>
                    ) : productAdsListings.length === 0 ? (
                      <p className="hint">Nenhum anúncio vinculado a este produto ainda.</p>
                    ) : (
                      <div className="pf-product-ads-table-wrap">
                        <table className="pf-product-ads-table">
                          <thead>
                            <tr>
                              <th scope="col">Marketplace</th>
                              <th scope="col">Anúncio</th>
                              <th scope="col">Título</th>
                              <th scope="col">SKU</th>
                              <th scope="col">Status</th>
                              <th scope="col">Preço</th>
                              <th scope="col">Promoção</th>
                              <th scope="col">Última sync</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productAdsListings.map((raw) => {
                              const L = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
                              const m = L.marketplace != null ? String(L.marketplace) : "";
                              const extRaw = L.external_listing_id != null ? String(L.external_listing_id) : "";
                              const adNo = formatMarketplaceListingDisplayId(m, extRaw) || extRaw || "—";
                              const title = L.title != null && String(L.title).trim() !== "" ? String(L.title) : "—";
                              const sku = L.sku != null && String(L.sku).trim() !== "" ? String(L.sku) : "—";
                              const status = L.status != null && String(L.status).trim() !== "" ? String(L.status) : "—";
                              const priceBrl = L.price_brl != null ? String(L.price_brl).trim() : "";
                              const priceNum = priceBrl !== "" ? Number(priceBrl.replace(",", ".")) : NaN;
                              const priceDisplay = Number.isFinite(priceNum) ? formatCatalogBRL(priceNum) : "—";
                              const onPromo = Boolean(L.is_on_promotion);
                              const syncRaw = L.last_sync_at != null ? String(L.last_sync_at) : "";
                              let syncDisplay = "—";
                              if (syncRaw) {
                                const d = new Date(syncRaw);
                                syncDisplay = Number.isNaN(d.getTime()) ? syncRaw : d.toLocaleString("pt-BR");
                              }
                              const rowKey =
                                L.id != null && String(L.id).trim() !== ""
                                  ? String(L.id)
                                  : `${m || "mkt"}-${extRaw || "ad"}`;
                              return (
                                <tr key={rowKey}>
                                  <td>{marketplaceChipLabel(m || "—")}</td>
                                  <td>{adNo}</td>
                                  <td className="pf-product-ads-table__title" title={title}>
                                    {title}
                                  </td>
                                  <td>{sku}</td>
                                  <td>{status}</td>
                                  <td>{priceDisplay}</td>
                                  <td>{onPromo ? "Sim" : "Não"}</td>
                                  <td>{syncDisplay}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

             {/* =======================
             ABA: VENDAS & DESEMPENHO (placeholder)
             ======================= */}
             {safeTab === "performance" && (
             <div className="pf-container">
              <h2 className="pf-tab-title">Vendas & desempenho</h2>
              <div className="section">
              <div className="section-header">
                <h3>Vendas & desempenho</h3>
                <p className="section-subtitle">Painel do produto: histórico de vendas, desempenho por canal e indicadores.</p>
              </div>
              {productPerformanceLoading ? (
                <p className="hint">Carregando desempenho…</p>
              ) : productPerformanceError ? (
                <p className="hint pf-performance-error">{productPerformanceError}</p>
              ) : (
                <>
                  <div className="pf-performance-cards">
                    <div className="pf-performance-card">
                      <span>Vendas</span>
                      <strong>{productPerformance?.total_orders ?? 0}</strong>
                    </div>
                    <div className="pf-performance-card">
                      <span>Receita</span>
                      <strong>{formatCatalogBRL(Number(productPerformance?.total_revenue ?? 0))}</strong>
                    </div>
                    <div className="pf-performance-card">
                      <span>Ticket médio</span>
                      <strong>{formatCatalogBRL(Number(productPerformance?.avg_ticket ?? 0))}</strong>
                    </div>
                  </div>

                  <div className="pf-performance-timeseries">
                    <h4>Vendas no tempo</h4>
                    {Array.isArray(productPerformance?.sales_over_time) &&
                    productPerformance.sales_over_time.length > 0 ? (
                      <div className="pf-performance-table-wrap">
                        {(() => {
                          const series = productPerformance.sales_over_time;
                          const maxY = Math.max(1, ...series.map((p) => Number(p.value || 0)));
                          const w = 640;
                          const h = 180;
                          const stepX = series.length > 1 ? (w - 24) / (series.length - 1) : 0;
                          const points = series
                            .map((p, idx) => {
                              const x = 12 + idx * stepX;
                              const y = h - 12 - (Math.max(0, Number(p.value || 0)) / maxY) * (h - 24);
                              return `${x},${y}`;
                            })
                            .join(" ");
                          return (
                            <svg className="pf-performance-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Linha temporal de vendas">
                              <line x1="12" y1={h - 12} x2={w - 12} y2={h - 12} className="pf-performance-chart-axis" />
                              <polyline points={points} className="pf-performance-chart-line" />
                            </svg>
                          );
                        })()}
                        <table className="pf-performance-table" aria-label="Série temporal de desempenho">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Vendas</th>
                              <th>Receita</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productPerformance.sales_over_time.map((pt, idx) => {
                              const rev = Array.isArray(productPerformance?.revenue_over_time)
                                ? productPerformance.revenue_over_time[idx]
                                : null;
                              return (
                                <tr key={`${pt.date}-${idx}`}>
                                  <td>{pt.date}</td>
                                  <td>{pt.value ?? 0}</td>
                                  <td>{formatCatalogBRL(Number(rev?.value ?? 0))}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="hint">Sem snapshots suficientes para exibir série temporal.</p>
                    )}
                  </div>
                </>
              )}
             </div>
             </div>
             )}

             </div>
      
        </div>
        <div
          className={
            allStepsUnlocked ? "pf-body-footer pf-body-footer--save-only" : "pf-body-footer"
          }
        >
          {allStepsUnlocked ? (
            <S7Button
              type="button"
              variant="primary"
              className="pf-body-footer-btn"
              loading={isSavingProduct}
              loadingLabel="Salvando..."
              disabled={isSavingProduct}
              onClick={handleSubmit}
            >
              {mode === "edit" ? "Salvar alterações" : "Salvar produto"}
            </S7Button>
          ) : (
            <>
              <div>
                {!isFirstStep && (
                  <button
                    type="button"
                    className="s7-btn s7-btn--secondary pf-body-footer-btn"
                    onClick={goToPreviousStep}
                    disabled={isSavingProduct}
                  >
                    Voltar
                  </button>
                )}
              </div>
              <div>
                {isLastStep ? (
                  <S7Button
                    type="button"
                    variant="primary"
                    className="pf-body-footer-btn"
                    loading={isSavingProduct}
                    loadingLabel="Salvando..."
                    disabled={isSavingProduct}
                    onClick={handleSubmit}
                  >
                    {mode === "edit" ? "Salvar alterações" : "Salvar produto"}
                  </S7Button>
                ) : (
                  <button
                    type="button"
                    className="s7-btn s7-btn--primary pf-body-footer-btn"
                    onClick={handleNextStep}
                    disabled={isSavingProduct}
                  >
                    Avançar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
        </div>
      </div>

{/* --------------------------------------------------
   MODAL: confirmação estoque virtual (padrão Suse7)
   Renderizado via Portal em document.body para overlay global
   (evita transform/filter de ancestrais que quebram position: fixed)
-------------------------------------------------- */}
{virtualModalOpen &&
  createPortal(
    <div
      className="s7-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s7-modal-title"
    >
      <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="s7-modal-icon-wrap">
          <div className="s7-modal-icon s7-modal-icon--success">✓</div>
        </div>
        <h2 id="s7-modal-title" className="s7-modal-title">
          {virtualModalMode === "enable" ? "Estoque Virtual ativo" : "Estoque virtual desativado"}
        </h2>
        <p className="s7-modal-text">
          {virtualModalMode === "enable"
            ? "O estoque virtual define a quantidade exibida no anúncio. O sistema continuará monitorando o Estoque real como fonte oficial.\n\nSe o estoque real zerar, o anúncio será pausado automaticamente para evitar vendas sem produto disponível.\n\nMantenha seu estoque real sempre atualizado para evitar pausas inesperadas e perda de vendas."
            : "A partir de agora, o estoque que será sincronizado com os anúncios será o Estoque real desta variação.\n\nO valor do Estoque virtual será zerado e deixará de ser utilizado pelo sistema.\n\nMantenha o estoque real sempre atualizado para evitar pausas automáticas nos anúncios."}
        </p>
        <div className="s7-modal-actions">
          <button
            type="button"
            className="s7-modal-btn-secondary"
            onClick={() => {
              setVirtualModalOpen(false);
              setPendingVariantId(null);
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="s7-modal-btn-primary"
            onClick={() => {
              handleStockVirtualToggle(pendingVariantId, pendingNextChecked);
              setVirtualModalOpen(false);
              setPendingVariantId(null);
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

{/* --------------------------------------------------
   MODAL: confirmação ao salvar com estoque zerado
-------------------------------------------------- */}
{zeroStockModalOpen &&
  createPortal(
    <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-modal-zero-title">
      <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="s7-modal-icon-wrap">
          <div className="s7-modal-icon s7-modal-icon--success">✓</div>
        </div>
        <h2 id="s7-modal-zero-title" className="s7-modal-title">Estoque zerado</h2>
        <div className="s7-modal-text">
          {zeroStockModalData ? (
            <>
              {zeroStockModalData.count === 1 ? (
                <>
                  <p>A variação abaixo está com estoque zerado:</p>
                  <p>{zeroStockModalData.examples}</p>
                </>
              ) : (
                <>
                  <p>{zeroStockModalData.count} variações estão com estoque zerado.</p>
                  <p>Ex: {zeroStockModalData.examples}</p>
                </>
              )}
          <p>
            Na próxima sincronização, o Suse7 poderá pausar o anúncio automaticamente para evitar vendas sem produto e proteger a saúde da sua conta.
          </p>
            </>
          ) : (
            <p>
              Você está salvando com estoque real igual a 0.
              {"\n\n"}
              Na próxima sincronização, o Suse7 poderá pausar o anúncio automaticamente para evitar vendas sem produto e proteger a saúde da sua conta.
            </p>
          )}
        </div>
        <div className="s7-modal-actions">
          <button
            type="button"
            className="s7-modal-btn-secondary"
            onClick={() => {
              setZeroStockModalOpen(false);
              setZeroStockModalData(null);
              if (product.format === "simple") {
                setZeroStockAttention({ simple: true, variants: {} });
              } else if (Array.isArray(variantRows)) {
                const toInt = (v) => {
                  const parsed = parseInt(String(v || "0"), 10);
                  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
                };
                const variants = {};
                variantRows.forEach((r) => {
                  if (toInt(r.stock_real) === 0) variants[r.id] = true;
                });
                setZeroStockAttention(Object.keys(variants).length > 0 ? { simple: false, variants } : null);
              }
              navigateToTabWithUnlock("stock");
            }}
          >
            Voltar e ajustar
          </button>
          <button
            type="button"
            className="s7-modal-btn-primary"
            onClick={() => {
              setZeroStockModalOpen(false);
              setZeroStockModalData(null);
              setZeroStockAttention(null);
              executeSubmit().catch(console.error);
            }}
          >
            Salvar mesmo assim
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

{/* --------------------------------------------------
   MODAL: confirmação ao voltar para Simples (draft com variações)
   Regra: remove variações criadas neste rascunho
-------------------------------------------------- */}
{formatToSimpleModalOpen &&
  createPortal(
    <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-modal-format-title">
      <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="s7-modal-icon-wrap">
          <div className="s7-modal-icon s7-modal-icon--success">?</div>
        </div>
        <h2 id="s7-modal-format-title" className="s7-modal-title">Voltar para Simples</h2>
        <p className="s7-modal-text">
          Isso removerá as variações criadas neste rascunho. Deseja continuar?
        </p>
        <div className="s7-modal-actions">
          <button
            type="button"
            className="s7-modal-btn-secondary"
            onClick={() => setFormatToSimpleModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="s7-modal-btn-primary"
            onClick={applyFormatToSimple}
          >
            Sim, remover variações
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

{/* --------------------------------------------------
   MODAL: detalhes do health (pendências e sugestões)
-------------------------------------------------- */}
<ProductHealthDetailsModal
  open={healthModalOpen}
  onClose={() => {
    setHealthModalOpen(false);
    setHealthModalBannerMessage(null);
  }}
  health={productHealth}
  bannerMessage={healthModalBannerMessage}
  onGoToTab={(tabId) => {
    navigateToTabWithUnlock(tabId);
    setHealthModalOpen(false);
    setHealthModalBannerMessage(null);
  }}
/>

{/* --------------------------------------------------
   MODAL: Sair sem salvar (Fechar ou navegação interna bloqueada)
   Só fecha com Cancelar ou Sair; não fecha ao clicar fora nem com ESC.
-------------------------------------------------- */}
{showExitModal &&
  createPortal(
    <ExitWithoutSavingModal
      open={true}
      onCancel={handleExitModalCancel}
      onConfirm={handleExitModalConfirm}
      onDontShowAgainChange={(checked) => {
        if (checked) {
          setExitWithoutSavingHidden(true);
          setPreference("modal.exit_without_saving", { hidden: true }).catch(() => {});
        }
      }}
    />,
    document.body
  )}
</>
);
}
