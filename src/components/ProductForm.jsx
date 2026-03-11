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

import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { createPortal } from "react-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { useSaveStatus } from "../contexts/SaveStatusContext";
import {
  dispatchStockBelowMin,
  dispatchStockRealZero,
} from "../services/stockNotificationDispatch";
import { relinkDraftToProduct } from "../services/images/imageRepository";
import { updateVariantsSortOrder } from "../services/variants/variantRepository";
import ProductFormImagesTab from "./ProductFormImagesTab";
import "./FieldLabel.css";
import "./ProductAdTitlesTab.css";
import { Trash2 } from "lucide-react";
import { SeoKeywordsInput } from "./SeoKeywordsInput";
import ProductHealthProgress from "./ProductHealthProgress";
import ProductHealthDetailsModal from "./ProductHealthDetailsModal";
import { getProductHealth } from "../services/productHealthService";
import { changeStatus } from "../services/productStatusService";
import { getPreferences, setPreference } from "../services/userPreferencesService";
import ExitWithoutSavingModal from "./ExitWithoutSavingModal";
import ProductFormTabs from "./ProductFormTabs";
import ProductFormRightPanel from "./ProductFormRightPanel";
import { S7Button } from "./ui";
import "./ProductForm.css";
import { Repeat } from "lucide-react";
import { useFormProgress } from "../hooks/useFormProgress";

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
  initialProduct = null,
  initialVariants = null, // lista de product_variants (quando edit, ordenada por sort_order)
  initialVariations = null, // alias para initialVariants
  initialTab = null, // ex: "stock" para deep link ?tab=stock
  onCancel = null,
  onSubmit = null,
  onSuccess = null, // chamado após submit ok e relink (se create)
}) {
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
  const safeTab = availableTabIds.includes(activeTab) ? activeTab : availableTabIds[0];

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

  // Deep link: ?tab=stock (sincroniza quando initialTab muda)
  useEffect(() => {
    if (initialTab && availableTabIds.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab, availableTabIds]);

  // ------------------------------------------------------
  // STATE: ERROS (UX)
  // ------------------------------------------------------
  const [errors, setErrors] = useState({});

// ======================================================================
// STATE: Erros SKU por variação (UX)
// Regra: no formato variants, SKU é obrigatório em cada variação
// ======================================================================
const [skuErrorsById, setSkuErrorsById] = useState({});

  // ------------------------------------------------------
  // STATE: Erros da aba Estoque (apenas Estoque real obrigatório)
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

  // ======================================================================
// SUSE7 — VARIAÇÕES: CONTROLE DE UI (Builder vs Gerenciamento)
// Objetivo:
// - Builder (Nome do atributo + chips + botão "Adicionar variações")
// - Após gerar combinações: esconder builder e mostrar gerenciamento
// ======================================================================
const [showVariationsBuilder, setShowVariationsBuilder] = useState(true);

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

// ------------------------------------------------------
// SUSE7 — VARIAÇÕES
// Flag: já existem variações cadastradas?
// ------------------------------------------------------
const hasAnyVariation = variationAttributes.length > 0;

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

// ------------------------------------------------------
// HIDRATAR FORM (modo edição)
// ------------------------------------------------------
useEffect(() => {
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
    setProduct((prev) => ({ ...prev, ...toMerge }));

    // ------------------------------------------------------
    // HIDRATAR: custos globais (best effort)
    // - Se vier "4.50" ou "4,50", transforma em dígitos "450"
    // ------------------------------------------------------
    const toDigits = (v) =>
      String(v ?? "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
        .replace(".", "");

    setPackagingDigits(toDigits(initialProduct.packaging_cost));
    setOperationalDigits(toDigits(initialProduct.operational_cost));
    setSimpleCostDigits(toDigits(initialProduct.cost_price));
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

      const digits = String(v?.cost_price ?? "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
        .replace(".", "");

      map[id] = digits;
    });

    return map;
  });

  // ------------------------------------------------------
  // Se vierem variantes prontas (edit), carregamos no grid
  // Usar listVariants(productId) para carregar ordenado por sort_order
  // ------------------------------------------------------
  const variants = initialVariants ?? initialVariations;
  if (Array.isArray(variants) && variants.length > 0) {
    setVariantRows(
      variants.map((v) => ({
        id: v.id || createId(),
        sku: v.sku || "",
        gtin: v.gtin || "",

        // custo por variação
        cost_price: v.cost_price ?? "",

        // estoque por variação (strings para inputs)
        stock_real: String(v.stock_quantity ?? ""),
        stock_min: String(v.stock_minimum ?? ""),
        use_virtual_stock: !!v.use_virtual_stock,
        stock_virtual: String(v.virtual_stock_quantity ?? 0),

        active: typeof v.active === "boolean" ? v.active : true,
        attributes: v.attributes || {},
      }))
    );

    // ------------------------------------------------------
    // Reconstroi variationAttributes (best effort)
    // ------------------------------------------------------
    const attrMap = new Map();

    variants.forEach((v) => {
      const attrs = v.attributes || {};
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
      setShowVariationsBuilder(false); // ✅ se está editando com variações, já cai no modo gerenciamento
    }
  }

  // Snapshot inicial para dirty check (após hidratação)
  if (initialProduct) {
    const prod = { ...product, ...initialProduct };
    const vs = initialVariants ?? initialVariations;
    const rows = Array.isArray(vs) && vs.length > 0
      ? vs.map((v) => ({
          id: v.id || createId(),
          sku: v.sku || "",
          gtin: v.gtin || "",
          cost_price: v.cost_price ?? "",
          stock_real: String(v.stock_quantity ?? ""),
          stock_min: String(v.stock_minimum ?? ""),
          use_virtual_stock: !!v.use_virtual_stock,
          stock_virtual: String(v.virtual_stock_quantity ?? 0),
          active: typeof v.active === "boolean" ? v.active : true,
          attributes: v.attributes || {},
        }))
      : [];
    const attrMap = new Map();
    (Array.isArray(vs) ? vs : []).forEach((v) => {
      Object.entries(v?.attributes || {}).forEach(([k, val]) => {
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
}, [initialProduct, initialVariants, initialVariations]);

  // ------------------------------------------------------
  // GUARD: Sair sem salvar (dirty state + preferências)
  // ------------------------------------------------------
  const isDirty = useMemo(() => {
    const last = lastSavedSnapshotRef.current;
    if (last == null) return false;
    const current = getFormSnapshotForGuard(product, variantRows, variationAttributes);
    return current !== last;
  }, [product, variantRows, variationAttributes]);

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
  const skipExitGuardRef = useRef(false); // bypass quando usuário confirmou saída pelo botão Fechar
  const shouldBlockNav = isDirty && !exitWithoutSavingHidden && !skipExitGuardRef.current;
  const blocker = useBlocker(shouldBlockNav);

  // Modal "Sair sem salvar" (Fechar ou navegação interna bloqueada)
  const [showExitModal, setShowExitModal] = useState(false);
  const exitModalSourceRef = useRef("close"); // "close" = botão Fechar | "blocker" = navegação bloqueada

  // Quando o blocker intercepta uma navegação, abrir o modal
  useEffect(() => {
    if (blocker.state === "blocked") {
      exitModalSourceRef.current = "blocker";
      setShowExitModal(true);
    }
  }, [blocker.state]);

  const handleClose = () => {
    if (isDirty && !exitWithoutSavingHidden) {
      exitModalSourceRef.current = "close";
      setShowExitModal(true);
    } else {
      onCancel?.();
    }
  };

  const handleExitModalCancel = () => {
    setShowExitModal(false);
    if (blocker.state === "blocked") blocker.reset();
  };

  const handleExitModalConfirm = () => {
    const source = exitModalSourceRef.current;
    setShowExitModal(false);
    if (source === "blocker") {
      blocker.proceed();
    } else {
      // Fluxo "close": ativar bypass para a navegação via onCancel não ser bloqueada de novo
      skipExitGuardRef.current = true;
      onCancel?.();
    }
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
    setProduct((prev) => ({ ...prev, format: "simple" }));
    setVariationAttributes([]);
    setDraftAttrInput("");
    setDraftOptionInput("");
    setDraftOptions([]);
    setVariantRows([]);
    setShowVariationsBuilder(true);
    setFormatToSimpleModalOpen(false);
  };

  const handleFormatChange = (nextFormat) => {
    if (nextFormat === "variants") {
      setProduct((prev) => ({ ...prev, format: nextFormat, sku: "", gtin: "" }));
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

  // ------------------------------------------------------
  // PROGRESSO GLOBAL DO FORM (todas as abas, simple/variants)
  // ------------------------------------------------------
  const { percent: globalProgressPercent } = useFormProgress({
    product,
    variationAttributes,
    variantRows,
  });

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
  const normalizeOption = (raw) => String(raw || "").trim().replace(/\s+/g, " ");
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

  // ✅ limpa erro da aba variações, se houver
  setErrors((prev) => ({ ...prev, variants: undefined }));
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
      variants: "Digite o nome do atributo (ex: Cor) e depois adicione as opções (chips).",
    }));
    return;
  }

  // 2) precisa ter opções
  if (!draftOptions || draftOptions.length === 0) {
    setErrors((prev) => ({
      ...prev,
      variants: "Adicione ao menos 1 opção (chip) antes de cadastrar o atributo.",
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

  // 4) UI: builder some (mostra gerenciamento)
  setShowVariationsBuilder(false);

  // 5) limpa erros e drafts
  setErrors((prev) => ({ ...prev, variants: undefined }));
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

     // ------------------------------------------------------
     // UX: se removeu tudo, volta para o Builder
     // (evita sumir "+ Novo atributo")
     // ------------------------------------------------------
      if (next.length === 0) {
      setShowVariationsBuilder(true);
    }


    return next;
  });
};


  // ------------------------------------------------------
  // GERAR COMBINAÇÕES (cartesiano) e preservar dados digitados
  // ------------------------------------------------------
  const buildVariantKey = (attrsObj) => {
    // chave estável por atributos: "Cor=Azul|Tamanho=M"
    const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
  };

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
       // VARIANT ROWS: remover linha
       // - Se zerar as linhas, voltamos para o Builder (UX)
       // ------------------------------------------------------
       const handleRemoveVariantRow = (id) => {
       setVariantRows((prev) => {
       const next = (prev || []).filter((r) => r.id !== id);

        // ------------------------------------------------------
        // UX: se zerou tudo, volta o builder (e mantém fluxo vivo)
        // ------------------------------------------------------
       if (next.length === 0) {
        setShowVariationsBuilder(true);
       }

       return next;
      });
    };


  // ------------------------------------------------------
  // VALIDAR (UX)
  // ------------------------------------------------------
  const validateDataTab = () => {
    const nextErrors = {};

    if (!String(product.product_name || "").trim()) {
      nextErrors.product_name = "Nome do produto é obrigatório.";
    }

    // SKU obrigatório apenas no formato simples
    if (product.format === "simple") {
      if (!String(product.sku || "").trim()) {
        nextErrors.sku = "SKU é obrigatório no formato Simples.";
      }
    }

    // GTIN (se preenchido): números e até 13
    const gtin = String(product.gtin || "").trim();
    if (gtin) {
      if (!isDigitsOnly(gtin)) nextErrors.gtin = "EAN/GTIN deve conter apenas números.";
      else if (gtin.length > 13) nextErrors.gtin = "EAN/GTIN deve ter no máximo 13 dígitos.";
    }

    // NCM (se preenchido): 8 dígitos
    const ncmDigits = String(product.ncm || "").replace(/\D/g, "");
    if (ncmDigits) {
      if (ncmDigits.length !== 8) nextErrors.ncm = "NCM deve ter 8 dígitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

// ======================================================================
// VALIDAR: Variações (UX)
// Regras:
// - Somente quando format === "variants"
// - SKU obrigatório por variação
// ======================================================================
const validateVariantsTab = () => {
  // Se não está em variações, nada a validar aqui
  if (product.format !== "variants") {
    setSkuErrorsById({});
    return true;
  }

  // Se não tem linhas, deixamos passar (o formato variants pode estar “em construção”)
  if (!Array.isArray(variantRows) || variantRows.length === 0) {
    setSkuErrorsById({});
    return true;
  }

  const nextSkuErrors = {};

  (variantRows || []).forEach((r) => {
    const sku = String(r?.sku || "").trim();
    if (!sku) nextSkuErrors[r.id] = "SKU é obrigatório.";
  });

  setSkuErrorsById(nextSkuErrors);

  // Se tem erro, falha
  return Object.keys(nextSkuErrors).length === 0;
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
  // SIMPLE: custo obrigatório (zero não é válido)
  // - "R$ 0,00" gera digits "000" => 0
  // ------------------------------------------------------
  if (product.format === "simple") {
    const digits = String(simpleCostDigits || "").replace(/\D/g, "");
    const cents = Number(digits || "0");

    if (cents <= 0) {
      next.simpleCost = true;
    }
  }

  // ------------------------------------------------------
  // VARIANTS: todos obrigatórios (zero não é válido)
  // ------------------------------------------------------
  if (product.format === "variants") {
    const missing = (variantRows || [])
      .filter((r) => {
        const digits = String(variantCostDigitsById?.[r.id] || "").replace(/\D/g, "");
        const cents = Number(digits || "0");
        return cents <= 0;
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
  // VALIDAR: Estoque (apenas Estoque real obrigatório; Estoque mínimo opcional)
  // Vazio ("") inválido; zero ("0") válido
  // ------------------------------------------------------
  const SIMPLE_STOCK_KEY = "simple";
  const validateStockTab = () => {
    const nextStock = {};
    if (product.format === "simple") {
      if (String(product.stock_quantity ?? "") === "") nextStock[SIMPLE_STOCK_KEY] = true;
    } else if (product.format === "variants" && Array.isArray(variantRows)) {
      variantRows.forEach((r) => {
        if (String(r.stock_real ?? "") === "") nextStock[r.id] = true;
      });
    }
    setStockErrors(nextStock);
    return Object.keys(nextStock).length === 0;
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // - Alinha payload com banco:
  //   products: product
  //   product_variants: variantRows (quando format=variants)
  // ------------------------------------------------------
  const goToSeoKeywords = () => {
    setActiveTab("data");
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
  // ------------------------------------------------------
  // 1) DADOS (Nome do produto, SKU se simple, etc.)
  // ------------------------------------------------------
  const okData = validateDataTab();
  if (!okData) {
    setActiveTab("data");
    return;
  }

  // ------------------------------------------------------
  // 2) VARIAÇÕES (SKU se format === variants)
  // ------------------------------------------------------
  const okVariants = validateVariantsTab();
  if (!okVariants) {
    if (hasVariations) setActiveTab("variations");
    else setActiveTab("data");
    return;
  }

  // ------------------------------------------------------
  // 3) CUSTOS & PRECIFICAÇÃO
  // ------------------------------------------------------
  const okPricing = validatePricingTab();
  if (!okPricing) {
    setActiveTab("pricing");
    return;
  }

  // ------------------------------------------------------
  // 4) ESTOQUE (Estoque real obrigatório)
  // ------------------------------------------------------
  const okStock = validateStockTab();
  if (!okStock) {
    setActiveTab("stock");
    return;
  }

  const toInt = (v) => {
    const parsed = parseInt(String(v || "0"), 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const hasZeroStock = product.format === "simple"
    ? toInt(product.stock_quantity) === 0
    : (variantRows || []).some((r) => toInt(r.stock_real) === 0);

  if (hasZeroStock) {
    if (product.format === "variants" && Array.isArray(variantRows)) {
      const buildVariantLabel = (row) => {
        if (row?.attributes && Object.keys(row.attributes).length > 0) {
          return Object.entries(row.attributes)
            .map(([k, v]) => `${k} ${v}`)
            .join(" / ");
        }
        return row?.sku || "Variação";
      };
      const zeroStockVariants = variantRows.filter((r) => toInt(r.stock_real) === 0);
      const examples = zeroStockVariants
        .slice(0, 3)
        .map(buildVariantLabel)
        .join("; ");
      setZeroStockModalData({ count: zeroStockVariants.length, examples });
    } else {
      setZeroStockModalData(null);
    }
    setZeroStockModalOpen(true);
    return;
  }

  await executeSubmit();
};

  const executeSubmit = async () => {
    const toInt = (v) => {
      const parsed = parseInt(String(v || "0"), 10);
      return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    };
    const payload = {
      mode,
      draftKey: draftKeyRef.current,
      product: {
        ...product,
        ...(product.format === "variants" ? { sku: "", gtin: "" } : {}),
      },
      variants:
        product.format === "variants"
          ? (variantRows || []).map((r) => ({
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
          addNotification({ type: "error", title: "Erro ao salvar", message: result.error });
          return;
        }
        if (mode === "create" && result?.productId && draftKeyRef.current) {
          await relinkDraftToProduct(draftKeyRef.current, result.productId);
          setHealthProductId(result.productId);
          fetchHealth(result.productId);
        } else if (result?.productId || product?.id) {
          fetchHealth(result?.productId ?? product?.id);
        }
        lastSavedSnapshotRef.current = getFormSnapshotForGuard(product, variantRows, variationAttributes);
        if (typeof onSuccess === "function") onSuccess();
      } catch (err) {
        // 409 (variants→simple) ou outro erro: exibe mensagem do backend
        const msg = err?.message ?? err?.error ?? "Erro ao salvar produto.";
        addNotification({ type: "error", title: "Erro ao salvar", message: msg });
      }
      return;
    }
    console.log("Payload a salvar (UI):", payload);
  };


  // ------------------------------------------------------
  // Img1 Produto (preview) — best effort
  // - Se product_images vier como URL única, mostra.
  // - Se vier como JSON string, tenta parsear e pegar primeira.
  // ------------------------------------------------------
  const mainImageUrl = useMemo(() => {
    const v = product.product_images;
    if (!v) return "";

    // URL direta
    if (typeof v === "string" && v.startsWith("http")) return v;

    // JSON string de lista
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
        if (parsed?.[0]) return String(parsed[0]);
        } catch {
          return "";
        }
    }

    return "";
  }, [product.product_images]);

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
            onStepChange={setActiveTab}
            onSave={handleSubmit}
            saveLabel={mode === "edit" ? "Salvar alterações" : "Salvar produto"}
          />

          <div className="pf-card pf-card--primary">
      {/* ==================================================
         HEADER: botão Fechar no topo direito
      ================================================== */}
      <div className="pf-header-bar">
        <button type="button" className="pf-close" onClick={handleClose}>
          Fechar
        </button>
      </div>

        <div className="pf-form-area">
      {/* ==================================================
         NOME DO PRODUTO (sem título duplicado — título está no painel)
      ================================================== */}
<div className="pf-product-name-fixed">
  <div className="pf-product-name-line">
    {/* ------------------------------------------------------------
        IMG1 (preview) — apenas no modo edição
    ------------------------------------------------------------ */}
    {mode === "edit" && (
      <div
        className="pf-product-thumb"
        title={mainImageUrl ? "Imagem principal do produto" : "Sem imagem"}
        aria-label="Imagem principal do produto"
      >
        {mainImageUrl ? (
          <img src={mainImageUrl} alt="Imagem principal do produto" />
        ) : (
          <span className="pf-product-thumb__placeholder">IMG</span>
        )}
      </div>
    )}

    {/* ------------------------------------------------------------
        Nome do produto (label + input)
    ------------------------------------------------------------ */}
    <div className="pf-product-name-fields">
      <FieldLabel text="Nome do produto" required copyKey="product_name" copiedKey={copiedKey} onCopy={() => handleCopy(product.product_name, "product_name")} />

      <input
        className={`s7-input ${errors.product_name ? "s7-input--error" : ""}`}
        type="text"
        placeholder="Ex: Armário de cozinha 3 portas"
        value={product.product_name}
        onChange={(e) => handleChange("product_name", e.target.value)}
      />

      {errors.product_name && <div className="s7-error">{errors.product_name}</div>}
    </div>

    {/* ------------------------------------------------------------
        Progresso circular do cadastro (global, todas abas)
    ------------------------------------------------------------ */}
    <div className="pf-product-health-wrap">
      <ProductHealthProgress
        percent={globalProgressPercent}
        status=""
        blockingCount={0}
        warningsCount={0}
        hint={null}
        showLabel={false}
        onClick={undefined}
      />
    </div>
  </div>
</div>


      <ProductFormTabs
        steps={availableTabs}
        activeId={safeTab}
        onTabChange={setActiveTab}
      />

      <div className="pf-body" data-active-tab={safeTab}>
        <div className="pf-body-inner"></div>
        
        {/* =======================
            ABA: DADOS
        ======================= */}
        {safeTab === "data" && (
          <div className="pf-container">
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
                    copyKey="sku"
                    copiedKey={copiedKey}
                    onCopy={() => handleCopy(product.sku, "sku")}
                  />
                  <input
                    className={`s7-input ${errors.sku ? "s7-input--error" : ""}`}
                    placeholder="SKU interno"
                    value={product.sku}
                    onChange={(e) =>
                      handleChange("sku", e.target.value.replace(/\s+/g, " ").trimStart())
                    }
                  />
                  {errors.sku && <div className="s7-error">{errors.sku}</div>}
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

            {/* Linha 3: Marca + Modelo (mais compactos e alinhados com os de cima) */}
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

            {/* Linha 4: Palavras-chave SEO (mais estreito) */}
            <div className="pf-row">
              <div className="pf-group pf-group--full pf-group--seo">
                <FieldLabel
                  text="Palavras-chave SEO"
                  infoText="Separe por vírgulas. Isso ajuda no SEO de busca dos anuncios."
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
            {/* SIMPLE: campos em coluna */}
            {product.format === "simple" && (
              <div className="pf-pricing-simple-column">
                {/* Custo do produto */}
                <div className="pf-row">
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo do produto"
                      required
                      infoText="Custo do item (sem taxas). Isso alimenta os cálculos de margem/lucro no backend."
                      tipBottom={true}
                      wrap={true}
                    />
                    <input
                      className={`s7-input ${costErrors.simpleCost ? "s7-input--error" : ""}`}
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
                    />
                    {costErrors.simpleCost && (
                      <div className="s7-error" style={{ marginTop: 6 }}>
                        Custo do produto é obrigatório.
                      </div>
                    )}
                  </div>
                </div>

                {/* Custo Embalagem */}
                <div className="pf-row">
                  <div className="pf-group pf-pricing-global-group">
                    <FieldLabel
                      text="Custo Embalagem"
                      infoText="Embalagem do pedido: caixa/saco e materiais de proteção (ex: plástico bolha, papel kraft). Ajuda a calcular o custo real por venda."
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
                      infoText="Custo operacional por pedido: etiquetas, insumos diretos e tempo operacional (separação/embalo). Pequenos custos somados mudam o lucro no fim do mês."
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
                      infoText="Embalagem do pedido: caixa/saco e materiais de proteção (ex: plástico bolha, papel kraft). Ajuda a calcular o custo real por venda."
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
                      infoText="Custo operacional por pedido: etiquetas, insumos diretos e tempo operacional (separação/embalo). Pequenos custos somados mudam o lucro no fim do mês."
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
                <div
                  style={{
                    marginTop: 12,
                    overflowX: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
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
                                infoText="Custo do item para esta variação"
                                side="left"
                                tipBottom={true}
                                wrap={true}
                              />

                              <div className="pf-variant-cost-row">
                                <input
                                  className={`s7-input pf-variant-cost-input ${
                                    hasCostError ? "s7-input--error" : ""
                                  }`}
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
                                />

                                {idx === 0 && variantRows.length > 1 && (
                                  <button
                                    type="button"
                                    className="pf-apply-all-btn"
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
                                    <Repeat size={14} />
                                    Aplicar a todas
                                  </button>
                                )}
                              </div>

                              {hasCostError && (
                                <div className="s7-error" style={{ marginTop: 6 }}>
                                  Custo do produto é obrigatório.
                                </div>
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
                onSwitchToDataTab={() => setActiveTab("data")}
                onGoToSeo={goToSeoKeywords}
              />
            )}
          </div>
        )}

        {/* =======================
         ABA: VARIAÇÕES (novo fluxo)
         ======================= */}
        {safeTab === "variations" && hasVariations && (
          <div className="pf-container">
            {product.format !== "variants" ? (
              <div className="s7-alert s7-alert--warning">
                <strong>Formato atual:</strong> <strong>Simples</strong>. Para usar variações, altere o campo <strong>Formato</strong> na aba <strong>Dados</strong>.
              </div>
            ) : (
              <>
        {/* ======================================================
            MODO 1: BUILDER (ANTES DE GERAR)
        ====================================================== */}
        {showVariationsBuilder && (
          <div className="section">
            <div className="section-header">
              <h3>Variações</h3>
              <p className="section-subtitle">
                Cadastre atributos (ex: Cor, Tamanho) e opções (chips). Depois geramos as combinações automaticamente.
              </p>
            </div>

            {/* ======================================================
        BUILDER — CADASTRO DE ATRIBUTOS + OPÇÕES (CHIPS)
        ====================================================== */}
        <div className="pf-row" style={{ marginTop: 12 }}>
        {/* NOME DO ATRIBUTO (chips) */}
        <div className="pf-group pf-group--full">
        <FieldLabel
        text="Nome do atributo"
        required
        infoText="Digite o nome do atributo (ex: Cor, Tamanho, Voltagem) e pressione Enter/Tab para criar o chip."
        tipBottom={true}
        wrap={true}
        />

        <input
        className="s7-input"
        value={draftAttrInput}
        onChange={(e) => setDraftAttrInput(e.target.value)}
        onKeyDown={handleDraftAttrKeyDown}
        />

        {/* CHIP DO ATRIBUTO */}
        {draftAttrChips.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {draftAttrChips.map((attr) => (
        <span
        key={attr}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(37, 99, 235, 0.12)",
          color: "#1e40af",
          fontWeight: 800,
          fontSize: 12,
        }}
        >
        {attr}
        <button
          type="button"
          onClick={() => removeDraftAttrChip(attr)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 900,
            color: "#1e40af",
          }}
          title="Remover atributo"
        >
          ✕
        </button>
        </span>
        ))}
        </div>
        )}

        <div className="s7-hint" style={{ marginTop: 8 }}>
        Cadastre 1 atributo por vez (ex: Cor). Depois informe as opções e clique em “Adicionar variações”.
        </div>

       <div className="s7-hint" style={{ marginTop: 8 }}>
        Separe múltiplos atributos por vírgula (ex: Cor, Tamanho).
        </div>
        </div>
        </div>

        <div className="pf-row" style={{ marginTop: 12, alignItems: "flex-end" }}>
        {/* OPÇÕES (chips) */}
       <div className="pf-group pf-group--full">
       <FieldLabel
        text="Opções (chips)"
        required
        infoText="Digite as opções do atributo (ex: Branco, Preto, 127V) e pressione Enter/Tab/virgula."
        tipBottom={true}
        wrap={true}
       />

        <input
        className="s7-input"
        placeholder="Digite e pressione Enter/Tab (ex: Branco, Preto, 127V)"
        value={draftOptionInput}
        onChange={(e) => setDraftOptionInput(e.target.value)}
        onKeyDown={handleDraftOptionKeyDown}
       />

        {/* Chips de opções */}
        {draftOptions.length > 0 && (
       <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {draftOptions.map((opt) => (
          <span
            key={opt}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(107, 114, 128, 0.10)",
              color: "#334155",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {opt}
            <button
              type="button"
              onClick={() => removeDraftOption(opt)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#334155" }}
              aria-label="Remover opção"
              title="Remover"
            >
              ✕
            </button>
          </span>
        ))}
       </div>
       )}
 
       <div className="s7-hint" style={{ marginTop: 8 }}>
        Separe opções por vírgula (ex: Branco, Preto, Azul).
       </div>
       </div>

       {/* BOTÃO GERAR */}
        <div className="pf-group" style={{ flex: "0 0 auto", minWidth: 220, display: "flex", justifyContent: "flex-end" }}>
       <button
       type="button"
        className="s7-btn s7-btn--primary"
        onClick={handleAddVariationAttribute}
        style={{ minWidth: 200 }}
        >
        Adicionar variações
       </button>
       </div>
       </div>

            {(errors.variants || errors.variants_sku || errors.variants_gtin) && (
              <div style={{ marginTop: 10 }}>
                {errors.variants && <div className="s7-error">{errors.variants}</div>}
                {errors.variants_sku && <div className="s7-error">{errors.variants_sku}</div>}
                {errors.variants_gtin && <div className="s7-error">{errors.variants_gtin}</div>}
              </div>
            )}
          </div>
        )}

        {/* ======================================================
            MODO 2: GERENCIAMENTO (DEPOIS DE GERAR)
        ====================================================== */}
        {!showVariationsBuilder && variationAttributes.length > 0 && (
          <div className="section" style={{ marginTop: 12 }}>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <h3>Variações cadastradas</h3>
                <p className="section-subtitle">
                  Aqui você pode remover atributos e adicionar novas opções (chips). As combinações são atualizadas automaticamente.
                </p>
              </div>

              {/* ✅ Se um dia quiser reabrir o builder, deixa pronto */}
              <button
                type="button"
                className="s7-btn s7-btn--secondary"
                onClick={() => setShowVariationsBuilder(true)}
                title="Voltar ao cadastro de atributos"
              >
                + Novo atributo
              </button>
            </div>

            {variationAttributes.map((attr) => (
              <div key={attr.id} className="pf-row" style={{ marginTop: 12, marginBottom: 0, alignItems: "flex-end" }}>
                <div className="pf-group" style={{ maxWidth: 320 }}>
                  <label className="s7-label">Atributo</label>
                  <input className="s7-input" value={attr.name} disabled />
                </div>

                <div className="pf-group pf-group--full">
                  <label className="s7-label">Opções</label>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6 }}>
                    {(attr.options || []).map((opt) => (
                      <span
                        key={`${attr.id}_${opt}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "rgba(107, 114, 128, 0.10)",
                          color: "#334155",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {opt}

                        {/* 🗑️ remover opção (chip) */}
                        <button
                          type="button"
                          onClick={() => removeOptionFromAttribute(attr.id, opt)}
                          style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#334155" }}
                          aria-label="Remover opção"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* ➕ Adicionar chip (somente opção) */}
                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                    {addOptionAttrId === attr.id ? (
                      <>
                        <input
                          className="s7-input"
                          style={{ maxWidth: 260 }}
                          placeholder="Ex: Verde, Bege..."
                          value={addOptionInput}
                          onChange={(e) => {
                            setAddOptionInput(e.target.value);
                            if (addOptionError) setAddOptionError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Tab") {
                              e.preventDefault();
                              handleAddOptionToAttribute(attr.id);
                            }
                            if (e.key === "Escape") {
                              setAddOptionAttrId(null);
                              setAddOptionInput("");
                              setAddOptionError("");
                            }
                          }}
                          autoFocus
                        />

                        <button
                          type="button"
                          className="s7-btn s7-btn--secondary"
                          onClick={() => handleAddOptionToAttribute(attr.id)}
                        >
                          Adicionar chip
                        </button>

                        <button
                          type="button"
                          className="s7-btn s7-btn--secondary"
                          onClick={() => {
                            setAddOptionAttrId(null);
                            setAddOptionInput("");
                            setAddOptionError("");
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="s7-btn s7-btn--secondary"
                        onClick={() => {
                          setAddOptionAttrId(attr.id);
                          setAddOptionInput("");
                          setAddOptionError("");
                        }}
                      >
                        + Adicionar chip
                      </button>
                    )}
                  </div>

                  {addOptionAttrId === attr.id && addOptionError && (
                    <div className="s7-error" style={{ marginTop: 8 }}>
                      {addOptionError}
                    </div>
                  )}
                </div>
             </div>
            ))}
          </div>
        )}

        {/* ======================================================
            GRID: Combinações geradas (continua igual)
        ====================================================== */}
        {variantRows.length > 0 && (
          <div className="section" style={{ marginTop: 12 }}>
            <div className="section-header">
       <h3>Combinações geradas</h3>
        <p className="section-subtitle">
       Cada combinação representa uma variação do produto.
        </p>
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {variantRows.map((row) => (
        <div
        key={row.id}
        className="s7-card"
        style={{
        display: "grid",
        gridTemplateColumns: `repeat(${variantAttrColumns.length}, 1fr) 1fr 1fr 120px 60px`,
        gap: 12,
        alignItems: "center",
        padding: 12,
        }}
        >
        {/* VARIAÇÕES (Cor / Tamanho / etc) */}
        {variantAttrColumns.map((attr) => (
        <div key={attr}>
          <label className="s7-label">{attr}</label>
          <div style={{ fontWeight: 700 }}>
            {row.attributes?.[attr] || "-"}
          </div>
        </div>
        ))}

        {/* SKU */}
        <div className="pf-variant-field">
        <FieldLabel
          text="SKU"
          required
          onCopy={() => handleCopy(row.sku, `variant_sku_${row.id}`)}
          copyKey={`variant_sku_${row.id}`}
          copiedKey={copiedKey}
        />

        <input
          className={`s7-input pf-variant-sku-input ${
            skuErrorsById?.[row.id] ? "s7-input--error" : ""
          }`}
          value={row.sku}
          onChange={(e) => {
            // ------------------------------------------------------
            // Atualiza SKU
            // ------------------------------------------------------
            handleVariantRowChange(row.id, "sku", e.target.value);

            // ------------------------------------------------------
            // UX: limpa erro ao digitar
            // ------------------------------------------------------
            if (skuErrorsById?.[row.id]) {
              setSkuErrorsById((prev) => {
                const next = { ...(prev || {}) };
                delete next[row.id];
                return next;
              });
            }
          }}
        />

        {skuErrorsById?.[row.id] && <div className="s7-error">{skuErrorsById[row.id]}</div>}
        </div>


        {/* GTIN */}
        <div className="pf-variant-field">
        <FieldLabel
          text="EAN / GTIN"
          onCopy={() => handleCopy(row.gtin, `variant_gtin_${row.id}`)}
          copyKey={`variant_gtin_${row.id}`}
          copiedKey={copiedKey}
        />

        <input
          className="s7-input pf-variant-gtin-input"
          inputMode="numeric"
          value={row.gtin}
          onChange={(e) =>
            handleVariantRowChange(
              row.id,
              "gtin",
              e.target.value.replace(/\D/g, "").slice(0, 13)
            )
          }
        />
        </div>


        {/* SITUAÇÃO */}
        <div className="pf-variant-status">
        <label className="s7-label">Situação</label>

        <label className="pf-switch">
        <input
        type="checkbox"
        checked={row.active}
        onChange={(e) => handleVariantRowChange(row.id, "active", e.target.checked)}
        />
        Ativo
        </label>
        </div>

        {/* LIXEIRA */}
        <button
        type="button"
        className="s7-btn s7-btn--danger"
        title="Remover variação"
        onClick={() => handleRemoveVariantRow(row.id)}
        >
        🗑️
        </button>
        </div>
        ))}
        </div>

          </div>
        )}
        </>
        )}
        </div>
        )}


        {/* =======================
            ABA: DESCRIÇÃO (mantém)
        ======================= */}
        {safeTab === "description" && (
          <div className="pf-container">
            <div className="pf-description-section">
              <label className="s7-label">Descrição do produto</label>

              <div className="pf-description-wrapper">
                <textarea
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
                              infoText="Informe a quantidade disponível para venda. Se você não controla estoque, pode usar o Estoque virtual."
                              tipBottom={true}
                              wrap={true}
                              side="right"
                            />
                            <input
                              className={`s7-input ${((row.id === SIMPLE_STOCK_KEY ? stockErrors[SIMPLE_STOCK_KEY] : stockErrors[row.id]) || (zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) || (zeroStockAttention?.variants?.[row.id])) ? "s7-input--error" : ""}`}
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_real ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_real", e.target.value.replace(/\D/g, ""))
                              }
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
                              infoText="Limite de segurança: quando o estoque ficar igual ou abaixo desse valor, o Suse7 pode sinalizar risco de ruptura e ajudar você a evitar perder vendas."
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
                          <div className="pf-group" style={{ minWidth: 220 }}>
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
                                infoText="Quando ativado, o estoque virtual será usado para sincronização nos marketplaces. As regras finais ficam no backend."
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
                              infoText="Informe a quantidade disponível para venda. Se você não controla estoque, pode usar o Estoque virtual."
                              tipBottom={true}
                              wrap={true}
                              side="right"
                            />
                            <input
                              className={`s7-input ${((row.id === SIMPLE_STOCK_KEY ? stockErrors[SIMPLE_STOCK_KEY] : stockErrors[row.id]) || (zeroStockAttention?.simple && row.id === SIMPLE_STOCK_KEY) || (zeroStockAttention?.variants?.[row.id])) ? "s7-input--error" : ""}`}
                              inputMode="numeric"
                              maxLength={10}
                              value={row.stock_real ?? ""}
                              onChange={(e) =>
                                handleStockRowChange(row.id, "stock_real", e.target.value.replace(/\D/g, ""))
                              }
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
                              infoText="Limite de segurança: quando o estoque ficar igual ou abaixo desse valor, o Suse7 pode sinalizar risco de ruptura e ajudar você a evitar perder vendas."
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
                          <div className="pf-group" style={{ minWidth: 220 }}>
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
                                infoText="Quando ativado, o estoque virtual será usado para sincronização nos marketplaces. As regras finais ficam no backend."
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
            <div className="s7-card pf-dimensions-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas de envio</h3>
                <p className="s7-card__subtitle">Medidas usadas para cálculo de frete e logística.</p>
              </div>

              <div className="pf-row pf-dimensions-grid">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 30"
                    value={product.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 15"
                    value={product.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 45"
                    value={product.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 2.350"
                    value={product.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
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
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 32"
                    value={product.assembled_width}
                    onChange={(e) => handleChange("assembled_width", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 80"
                    value={product.assembled_height}
                    onChange={(e) => handleChange("assembled_height", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 42"
                    value={product.assembled_length}
                    onChange={(e) => handleChange("assembled_length", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="s7-input pf-dimension-input"
                    placeholder="Ex: 8.500"
                    value={product.assembled_weight}
                    onChange={(e) => handleChange("assembled_weight", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                    }}
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

              {/* =======================
              ABA: ANÚNCIOS (placeholder)
              ======================= */}
              {safeTab === "ads" && (
              <div className="pf-container">
             {!hasAnyVariation && (
             <div className="section">
              <div className="section-header">
                <h3>Anúncios do produto</h3>
                <p className="section-subtitle">Aqui vamos listar os anúncios vinculados a este produto em cada marketplace (ML primeiro).</p>
              </div>

              <p className="hint">Em breve: tabela com Marketplace, ID do anúncio, Status, Preço, Estoque e Ações.</p>

              <button className="s7-btn s7-btn--secondary" type="button">
                Importar anúncios (em breve)
              </button>
             </div>
             )}
             </div>
             )}

             {/* =======================
             ABA: VENDAS & DESEMPENHO (placeholder)
             ======================= */}
             {safeTab === "performance" && (
             <div className="pf-container">
              <div className="section">
              <div className="section-header">
                <h3>Vendas & desempenho</h3>
                <p className="section-subtitle">Painel do produto: histórico de vendas, desempenho por canal e indicadores.</p>
              </div>

              <p className="hint">Em breve: cards com Vendas, Receita, Lucro, Ticket médio, Conversão e Curva ABC.</p>

              <button className="s7-btn s7-btn--secondary" type="button">
                Ver relatório (em breve)
              </button>
             </div>
             </div>
             )}
             </div>
      
        </div>
      </div>
    </div>

{/* --------------------------------------------------
   FIM DO CARD PRINCIPAL
-------------------------------------------------- */}
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
              setActiveTab("stock");
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
    setActiveTab(tabId);
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