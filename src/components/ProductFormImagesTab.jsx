/**
 * ProductFormImagesTab — aba Imagens do ProductForm
 * - Upload (limite 14/escopo), ordenação (drag & drop), Principal = sort_order 0
 * - Download em lote via seleção (signed URL 60s), excluir com confirmação
 * - Suporta produto simples e com variações
 * - Drag imagens (horizontal) e variações (vertical) com persistência
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../supabaseClient";
import { useNotifications } from "../contexts/NotificationContext";
import { useSaveStatus } from "../contexts/SaveStatusContext";
import {
  createImageRecord,
  deleteLink,
  listLinks,
  updateLinksSortOrder,
} from "../services/images/imageRepository";
import { normalizeSortOrder } from "../services/images/imageRules";
import { deleteAsset, downloadAsBlob, uploadAssets } from "../services/images/imageStorageService";
import { resolveProductImageSrc } from "../utils/productImageDisplayUrl";
import { API_BASE_URL } from "../config/api";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import { buildImageProgressSnapshot, variantProgressRowId } from "../utils/formProgress";
import S7Button from "./ui/S7Button";
import S7Tooltip from "./ui/S7Tooltip";
import ProductImageSyncModal from "./products/ProductImageSyncModal.jsx";
import "./ProductFormImagesTab.css";

/** Mensagem de sucesso do SEO rename (plural/singular) — toast global */
function seoRenameSuccessMessage(count) {
  if (count <= 0) return "Nenhuma imagem no escopo para renomear.";
  if (count === 1) return "1 imagem renomeada com sucesso.";
  return `${count} imagens renomeadas com sucesso.`;
}

const SEO_RENAME_TOOLTIP =
  "Renomeie suas imagens com as palavras-chave certas do produto em um clique. Isso garante que os algoritmos dos marketplaces indexem seus anúncios corretamente, colocando você muito à frente da concorrência.";

function bulkDeleteButtonLabel(count) {
  return count === 1 ? "Excluir imagem" : "Excluir imagens";
}

/** Botão dinâmico: Selecionar todas ↔ Desmarcar seleção (por escopo) */
function SelectionScopeToggleButton({ selectedCount, imageCount, onSelectAll, onClearSelection }) {
  const hasSelection = selectedCount > 0;
  return (
    <S7Button
      variant="secondary"
      size="sm"
      iconName={hasSelection ? "filter_clear" : "billing_check"}
      onClick={hasSelection ? onClearSelection : onSelectAll}
      disabled={imageCount === 0}
    >
      {hasSelection ? "Desmarcar seleção" : "Selecionar todas"}
    </S7Button>
  );
}

const MAX_IMAGES = 14;
const EMPTY_SELECTION = new Set();
/** Modo silencioso: reorder/delete não disparam SaveStatus nem toasts de sucesso */
const SILENT_AUTOSAVE = true;

/** Texto único do (i) nos títulos de seção (simples e variações) — fora da grid */
const IMAGES_SECTION_QUALITY_TIP =
  "Imagens de qualidade aumentam a conversão. Use fotos claras, mostrando detalhes, variações e o uso do produto.";

function ImagesSectionQualityTipIcon({ className = "" }) {
  return (
    <button
      type="button"
      className={`pf-info-btn s7-tip s7-tip-bottom s7-tip-right s7-tip-wrap pf-images-section-tip-btn ${className}`.trim()}
      data-tip={IMAGES_SECTION_QUALITY_TIP}
      aria-label="Informações sobre fotos do produto"
    >
      i
    </button>
  );
}

/** Garante storage_path string válida (sem vírgulas, espaços, undefined, etc.) */
function sanitizeStoragePath(p) {
  if (p == null || typeof p !== "string") return null;
  let raw = String(p).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  if (raw.includes(",")) raw = raw.split(",")[0].trim();
  if (!raw || raw.includes(" ") || raw.includes("undefined") || raw.includes("null")) return null;
  return raw;
}

/** Normaliza link para evitar mismatch storage_path/storagePath, variant_key/variantKey */
function normalizeLink(link) {
  if (!link) return null;
  const p = sanitizeStoragePath(link.storage_path ?? link.storagePath);
  return {
    ...link,
    storage_path: p ?? null,
    variant_key: link.variant_key ?? link.variantKey,
    sort_order: link.sort_order ?? link.sortOrder,
  };
}

/** Chave estável do path para comparar antes/depois do SEO rename */
function storagePathKey(link) {
  return sanitizeStoragePath(link?.storage_path ?? link?.storagePath) || "";
}

/** Formato alinhado ao join do catálogo / for-edit — para thumbnail principal no ProductForm */
function flattenLinksForProductSnapshot(productLinks, variantLinksMap) {
  const push = (out, l) => {
    const p = sanitizeStoragePath(l?.storage_path ?? l?.storagePath);
    if (!p) return;
    const vk = l.variant_key ?? l.variantKey;
    out.push({
      storage_path: p,
      variant_key: vk == null || vk === "" ? null : vk,
      sort_order: l.sort_order ?? l.sortOrder ?? 0,
      is_primary: !!l.is_primary,
    });
  };
  const out = [];
  for (const l of productLinks || []) push(out, l);
  for (const arr of Object.values(variantLinksMap || {})) {
    for (const l of arr || []) push(out, l);
  }
  return out;
}

/**
 * IDs de links cujo storage mudou (ou entrou/saiu da lista) — só estes precisam refetch de preview.
 * Evita limpar toda a grade e reduz piscar após renomeação SEO.
 */
function previewIdsToInvalidate(prevFlat, nextFlat) {
  const prevById = new Map((prevFlat || []).filter(Boolean).map((l) => [l.id, l]));
  const nextById = new Map((nextFlat || []).filter(Boolean).map((l) => [l.id, l]));
  const ids = new Set();
  for (const [id, p] of prevById) {
    const n = nextById.get(id);
    if (!n || storagePathKey(p) !== storagePathKey(n)) ids.add(id);
  }
  for (const [id] of nextById) {
    if (!prevById.has(id)) ids.add(id);
  }
  return ids;
}

function buildVariantKeyFromAttrs(attrsObj) {
  const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
}

/** Bloco de variação sortable (drag vertical) */
function SortableVariantBlock({ row, variantKeyFn, variantLinksMap, previewUrls, selectedImageIds, onUpload, onReorder, onToggleSelect, onOpenPreview, onPreviewError, uploading, recentSavedKey, onShowSavedBadge, hasSeoKeywords, onBulkSeoRename, onGoToSeo, seoOptimizing, onDownloadSelected, onBulkDeleteRequest, onSelectAll, onClearSelection, downloadingSelected, deletingBatch, isDirty = false }) {
  const vk = variantKeyFn(row.attributes);
  const variantLinks = variantLinksMap[vk] || [];
  const rowId = row.id || vk;
  const hasImages = (variantLinks?.length ?? 0) > 0;
  const selectedCount = selectedImageIds?.size ?? 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasKeywords = !!hasSeoKeywords;
  const seoButtonLabel = hasKeywords
    ? (seoOptimizing ? "Renomeando…" : "Renomear imagens (SEO)")
    : "Definir palavras-chave (SEO)";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pf-images-variant-block s7-card ${isDragging ? "pf-images-variant-block--dragging" : ""}`}
    >
      <div className="pf-images-variant-block-title-row">
        <h4 className="pf-images-variant-title">
          {row.attributes && Object.keys(row.attributes).length > 0 ? (
            <>
              {Object.entries(row.attributes).map(([k, v], i) => (
                <span key={k}>
                  {i > 0 && <span className="pf-images-attr-sep"> / </span>}
                  <span className="pf-images-attr-label">{k}</span>
                  <span className="pf-images-attr-sep"> </span>
                  <span className="pf-images-attr-value">{v}</span>
                </span>
              ))}
            </>
          ) : (
            "Geral"
          )}
          {!SILENT_AUTOSAVE && isDirty && (
            <span className="pf-dirty-dot" aria-hidden title="Alterações não salvas">
              •
            </span>
          )}
        </h4>
        <span
          className="pf-images-variant-drag-handle"
          {...attributes}
          {...listeners}
          title="Arrastar para reordenar variações"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </span>
      </div>

      {hasImages && (
        <div className="pf-images-variant-actions pf-images-top-actions">
          {hasKeywords ? (
            <S7Tooltip content={SEO_RENAME_TOOLTIP} placement="top-start" offset={4}>
              <span className="pf-images-action-tooltip-wrap">
                <S7Button
                  variant="secondary"
                  size="sm"
                  iconName="image"
                  onClick={() => onBulkSeoRename?.(vk)}
                  disabled={selectedCount === 0 || seoOptimizing}
                >
                  {seoButtonLabel}
                </S7Button>
              </span>
            </S7Tooltip>
          ) : (
            <S7Button
              variant="secondary"
              size="sm"
              iconName="image"
              onClick={() => onGoToSeo?.()}
            >
              {seoButtonLabel}
            </S7Button>
          )}
          <S7Button
            variant="secondary"
            size="sm"
            iconName="download"
            onClick={() => onDownloadSelected(vk)}
            disabled={selectedCount === 0 || downloadingSelected}
          >
            {downloadingSelected ? "Baixando…" : "Baixar imagens"}
          </S7Button>
          <S7Button
            variant="secondary"
            size="sm"
            iconName="trash"
            onClick={() => onBulkDeleteRequest(vk)}
            disabled={selectedCount === 0 || deletingBatch}
          >
            {bulkDeleteButtonLabel(selectedCount)}
          </S7Button>
          <SelectionScopeToggleButton
            selectedCount={selectedCount}
            imageCount={variantLinks.length}
            onSelectAll={() => onSelectAll(vk)}
            onClearSelection={() => onClearSelection(vk)}
          />
        </div>
      )}
      <ImageSlotRow
        links={variantLinks}
        previewUrls={previewUrls}
        selectedImageIds={selectedImageIds}
        onUpload={(files) => onUpload(files, vk)}
        onReorder={(ids, slotIndex, movedLinkId) => onReorder(ids, vk, slotIndex, movedLinkId)}
        onToggleSelect={onToggleSelect}
        onOpenPreview={onOpenPreview}
        onPreviewError={onPreviewError}
        uploading={uploading}
        recentSavedKey={recentSavedKey}
        onShowSavedBadge={onShowSavedBadge}
        maxSlots={7}
        scopeId={vk}
        showToolbar={false}
      />
    </div>
  );
}

/** Seção de blocos de variação com drag vertical */
function VariationBlocksSection({
  variantRows,
  variantKeyFn,
  variantLinksMap,
  previewUrls,
  selectedImageIdsByScope,
  onUpload,
  onReorder,
  toggleSelectImage,
  onOpenPreview,
  onPreviewError,
  onVariantReorder,
  onShowSavedBadge,
  hasSeoKeywords = false,
  onBulkSeoRename = null,
  onGoToSeo = null,
  seoOptimizing = false,
  uploadingScopeId,
  recentSavedKey,
  onDownloadSelected,
  onBulkDeleteRequest,
  onSelectAll,
  onClearSelection,
  downloadingSelected,
  deletingBatch,
  dirtyVariants = new Set(),
}) {
  const rowIds = variantRows.map((r) => r.id || variantKeyFn(r.attributes));

  const handleVariantDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onVariantReorder) return;
    const oldIndex = rowIds.indexOf(active.id);
    const newIndex = rowIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrderedRows = arrayMove(variantRows, oldIndex, newIndex);
    onVariantReorder(newOrderedRows);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  return (
    <section className="pf-images-section pf-images-section--variants">
      <div className="pf-images-section-heading pf-images-section-heading--variants">
        <h3 className="pf-images-section-title pf-images-heading-with-tip">
          <span className="pf-images-heading-title-text">Imagens por variação</span>
          <ImagesSectionQualityTipIcon />
        </h3>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleVariantDragEnd}
      >
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <div className="pf-images-variants-list">
            {variantRows.map((row) => {
              const vk = variantKeyFn(row.attributes);
              return (
                <SortableVariantBlock
                  key={row.id || vk}
                  row={row}
                  variantKeyFn={variantKeyFn}
                  variantLinksMap={variantLinksMap}
                  isDirty={dirtyVariants.has(vk)}
                  previewUrls={previewUrls}
                  selectedImageIds={selectedImageIdsByScope[vk] ?? EMPTY_SELECTION}
                  onUpload={onUpload}
                  onReorder={onReorder}
                  onToggleSelect={(linkId) => toggleSelectImage(linkId, vk)}
                  onOpenPreview={onOpenPreview}
                  onPreviewError={onPreviewError}
                  onShowSavedBadge={onShowSavedBadge}
                  recentSavedKey={recentSavedKey}
                  hasSeoKeywords={hasSeoKeywords}
                  onBulkSeoRename={onBulkSeoRename}
                  onGoToSeo={onGoToSeo}
                  seoOptimizing={seoOptimizing}
                  uploading={uploadingScopeId != null && uploadingScopeId === vk}
                  onDownloadSelected={onDownloadSelected}
                  onBulkDeleteRequest={onBulkDeleteRequest}
                  onSelectAll={onSelectAll}
                  onClearSelection={onClearSelection}
                  downloadingSelected={downloadingSelected}
                  deletingBatch={deletingBatch}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export default function ProductFormImagesTab({
  productId,
  draftKey,
  format = "simple",
  variantRows = [],
  buildVariantKey,
  onVariantReorder = null,
  seoKeywords = "",
  productName = "",
  onSwitchToDataTab = null,
  onGoToSeo = null,
  /** @type {((snapshot: { productHasImage: boolean; variantHasImageByKey: Record<string, boolean> }) => void) | null} */
  onImageProgressChange = null,
  /** Atualiza `product.product_image_links` no pai (miniatura painel / useProductMainImageSrc) */
  onProductImageLinksSnapshot = null,
}) {
  const variantKeyFn = buildVariantKey || buildVariantKeyFromAttrs;

  const [productLinks, setProductLinks] = useState([]);
  const [variantLinksMap, setVariantLinksMap] = useState({});
  /** Evita sobrescrever links vindos do for-edit com [] antes do primeiro listLinks */
  const [didLoadLinksOnce, setDidLoadLinksOnce] = useState(false);
  const [selectedImageIdsByScope, setSelectedImageIdsByScope] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrls, setPreviewUrls] = useState(new Map());
  const previewFetchedRef = useRef(new Set());
  const previewContextRef = useRef(null);
  const [refreshPreviewSeed, setRefreshPreviewSeed] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, title: null });
  const [uploadingScopeId, setUploadingScopeId] = useState(null);
  const [recentSavedKey, setRecentSavedKey] = useState(null);
  const recentSavedTimeoutRef = useRef(null);
  const [seoKeywordsModalOpen, setSeoKeywordsModalOpen] = useState(false);
  const [seoOptimizing, setSeoOptimizing] = useState(false);
  const [dirtyVariants, setDirtyVariants] = useState(() => new Set());
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const productSelectedImageIds = selectedImageIdsByScope["product"] ?? EMPTY_SELECTION;
  const productSelectedCount = productSelectedImageIds.size;

  const selectedSyncLinkIds = useMemo(() => {
    return [...(productLinks || [])]
      .filter((link) => link?.id && productSelectedImageIds.has(link.id))
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map((link) => String(link.id));
  }, [productLinks, productSelectedImageIds]);

  const toggleSelectImage = useCallback((linkId, scopeId) => {
    setSelectedImageIdsByScope((prev) => {
      const set = new Set(prev[scopeId] || []);
      if (set.has(linkId)) set.delete(linkId);
      else set.add(linkId);
      return { ...prev, [scopeId]: set };
    });
  }, []);

  const clearSelection = useCallback((scopeId) => {
    setSelectedImageIdsByScope((prev) => {
      const next = { ...prev };
      delete next[scopeId];
      return next;
    });
  }, []);

  const selectAllInScope = useCallback((scopeId) => {
    const links =
      scopeId === "product"
        ? productLinks
        : (variantLinksMap[scopeId] || []);
    const ids = (links || []).map((l) => l?.id).filter(Boolean);
    if (!ids.length) return;
    setSelectedImageIdsByScope((prev) => ({
      ...prev,
      [scopeId]: new Set(ids),
    }));
  }, [productLinks, variantLinksMap]);

  const markVariantDirty = useCallback((variantKey) => {
    if (!variantKey) return;
    setDirtyVariants((prev) => new Set(prev).add(variantKey));
  }, []);

  const clearVariantDirty = useCallback((variantKey) => {
    if (!variantKey) return;
    setDirtyVariants((prev) => {
      const next = new Set(prev);
      next.delete(variantKey);
      return next;
    });
  }, []);

  const showSavedBadge = useCallback((scopeId, linkId) => {
    if (!scopeId || !linkId) return;
    const key = `${scopeId}:${linkId}`;
    if (recentSavedTimeoutRef.current) clearTimeout(recentSavedTimeoutRef.current);
    setRecentSavedKey(key);
    recentSavedTimeoutRef.current = setTimeout(() => {
      setRecentSavedKey(null);
      recentSavedTimeoutRef.current = null;
    }, 1000);
  }, []);

  const { addNotification } = useNotifications();
  const saveStatus = useSaveStatus();

  const hasProductId = !!productId && typeof productId === "string" && !productId.startsWith("draft:");
  const hasDraftKey = !!draftKey && typeof draftKey === "string";
  const canOperate = hasProductId || hasDraftKey;

  /** createImageRecord / uploadAssets exigem productId OU draftKey, nunca os dois. No edit existe productId e o form ainda tem draftKey — prioriza productId. */
  const recordProductId = hasProductId ? productId : undefined;
  const recordDraftKey = hasProductId ? undefined : hasDraftKey ? draftKey : undefined;

  const seoKeywordsArray = useMemo(() => {
    if (Array.isArray(seoKeywords)) return seoKeywords.filter(Boolean);
    return (seoKeywords || "").split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }, [seoKeywords]);
  const hasSeoKeywords = seoKeywordsArray.length > 0;

  useEffect(() => {
    return () => {
      if (recentSavedTimeoutRef.current) clearTimeout(recentSavedTimeoutRef.current);
    };
  }, []);

  const loadLinks = useCallback(async (loadOptions = {}) => {
    const silent = loadOptions.silent === true;
    if (!canOperate) return null;
    const opts = hasProductId ? { productId } : { draftKey };
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    let mappedGeneral = [];
    /** undefined = não alteramos variantLinksMap nesta rodada (ex.: formato simples) */
    let variantMapResult = undefined;
    try {
      const generalLinks = await listLinks({ ...opts, variantKey: null });
      mappedGeneral = (generalLinks || []).map(normalizeLink).filter(Boolean);
      setProductLinks(mappedGeneral);

      if (format === "variants" && variantRows?.length > 0) {
        const uniqueKeys = [...new Set(variantRows.map((r) => variantKeyFn(r.attributes)).filter(Boolean))];
        const results = await Promise.all(
          uniqueKeys.map(async (vk) => ({ vk, links: await listLinks({ ...opts, variantKey: vk }) }))
        );
        const map = {};
        results.forEach(({ vk, links }) => {
          map[vk] = (links || []).map(normalizeLink).filter(Boolean);
        });
        variantMapResult = map;
        setVariantLinksMap(map);
      }
    } catch (err) {
      setError(err.message || "Erro ao carregar imagens");
      return null;
    } finally {
      if (!silent) setLoading(false);
      setDidLoadLinksOnce(true);
    }
    return { productLinks: mappedGeneral, variantLinksMap: variantMapResult };
  }, [canOperate, hasProductId, productId, draftKey, format, variantRows, variantKeyFn]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (!didLoadLinksOnce || typeof onProductImageLinksSnapshot !== "function") return;
    onProductImageLinksSnapshot(flattenLinksForProductSnapshot(productLinks, variantLinksMap));
  }, [didLoadLinksOnce, productLinks, variantLinksMap, onProductImageLinksSnapshot]);

  useEffect(() => {
    if (typeof onImageProgressChange !== "function") return;
    const variantLinksByRowId = {};
    if (Array.isArray(variantRows)) {
      variantRows.forEach((r, idx) => {
        const rowId = String(variantProgressRowId(r, idx));
        const vk = variantKeyFn(r.attributes);
        variantLinksByRowId[rowId] = (vk && variantLinksMap[vk]) || [];
      });
    }
    const snap = buildImageProgressSnapshot({
      format,
      variantRows,
      productLinks,
      variantLinksByRowId,
      buildVariantKey: variantKeyFn,
    });
    onImageProgressChange(snap);
  }, [format, variantRows, variantKeyFn, productLinks, variantLinksMap, onImageProgressChange]);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || "anon";
  };

  const handleUpload = async (files, variantKey = null) => {
    if (!files?.length) {
      console.warn("[ProductFormImagesTab] handleUpload: nenhum arquivo");
      return;
    }
    if (!canOperate) {
      const msg = "Escopo inválido: informe productId ou draftKey";
      console.error("[ProductFormImagesTab] handleUpload:", msg);
      setError(msg);
      addNotification({ type: "error", title: "Upload", message: msg });
      return;
    }

    const storageKey = hasProductId ? productId : draftKey;
    if (!storageKey || (typeof storageKey === "string" && !storageKey.trim())) {
      const msg = "productId/draftKey vazio - não é possível fazer upload";
      console.error("[ProductFormImagesTab] handleUpload:", msg, { productId, draftKey });
      setError(msg);
      addNotification({ type: "error", title: "Upload", message: msg });
      return;
    }

    const scopeId = variantKey ?? "product";
    setUploadingScopeId(scopeId);
    setError(null);
    try {
      const userId = await getUserId();
      if (!userId || userId === "anon") {
        const msg = "Faça login para fazer upload de imagens";
        console.error("[ProductFormImagesTab] handleUpload:", msg);
        setError(msg);
        addNotification({ type: "error", title: "Upload", message: msg });
        return;
      }

      const isProduct = variantKey === null || variantKey === undefined;
      const currentLinks = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
      const currentCount = currentLinks.length;
      const remaining = MAX_IMAGES - currentCount;
      if (remaining <= 0) {
        addNotification({
          type: "error",
          title: "Upload",
          message: `Limite máximo de ${MAX_IMAGES} imagens atingido.`,
        });
        return;
      }
      let fileList = Array.isArray(files) ? files : Array.from(files || []);
      if (!fileList.length) {
        console.warn("[ProductFormImagesTab] handleUpload: nenhum arquivo após normalização");
        return;
      }
      if (fileList.length > remaining) {
        fileList = fileList.slice(0, remaining);
        const imagemLabel = remaining === 1 ? "imagem" : "imagens";
        const enviadaLabel = remaining === 1 ? "enviada" : "enviadas";
        addNotification({
          type: "warning",
          title: "Upload",
          message: `Apenas ${remaining} ${imagemLabel} foram ${enviadaLabel}. Limite máximo de ${MAX_IMAGES}.`,
        });
      }

      const metas = await uploadAssets(fileList, {
        userId,
        productId: recordProductId,
        draftKey: recordDraftKey,
      });

      if (!metas?.length) {
        const msg = "Upload retornou vazio (bucket ou storageKey inválido?)";
        console.error("[ProductFormImagesTab] handleUpload:", msg);
        setError(msg);
        addNotification({ type: "error", title: "Upload", message: msg });
        return;
      }

      for (let i = 0; i < metas.length; i++) {
        const meta = metas[i];
        const raw = meta?.storage_path;
        const storagePath =
          typeof raw === "string"
            ? raw.trim().split(",")[0].trim().replace(/\s+/g, "")
            : Array.isArray(raw)
              ? raw.map((s) => String(s ?? "").trim()).filter(Boolean).join("/")
              : null;
        if (!storagePath || storagePath.includes(",") || storagePath.includes(" ")) {
          throw new Error("storage_path inválido após upload");
        }
        const sortOrder = (currentLinks.length + i) || 0;
        const isPrimary = currentLinks.length === 0 && i === 0;
        await createImageRecord({
          productId: recordProductId,
          draftKey: recordDraftKey,
          variantKey: variantKey ?? null,
          storage_path: storagePath,
          file_name: meta.file_name,
          mime_type: meta.mime_type,
          size_bytes: meta.size_bytes,
          sortOrder,
          isPrimary,
        });
      }
      await loadLinks();
      if (!SILENT_AUTOSAVE) {
        const uploadedCount = metas.length;
        addNotification({
          type: "success",
          title: "Upload",
          message: `${uploadedCount} imagem(ns) adicionada(s)`,
        });
      }
    } catch (err) {
      const msg = err?.message || String(err) || "Erro no upload";
      console.error("[ProductFormImagesTab] handleUpload erro:", err);
      setError(msg);
      addNotification({ type: "error", title: "Upload", message: msg });
    } finally {
      setUploadingScopeId(null);
    }
  };

  const handleBulkDeleteRequest = useCallback((scopeId) => {
    const selected = selectedImageIdsByScope[scopeId] ?? EMPTY_SELECTION;
    if (selected.size === 0) return;
    setDeleteConfirm({
      scopeId,
      linkIds: [...selected],
    });
  }, [selectedImageIdsByScope]);

  const handleDeleteConfirm = useCallback(async () => {
    const payload = deleteConfirm;
    if (!payload?.linkIds?.length || !canOperate) return;

    const { scopeId, linkIds } = payload;
    const variantKey = scopeId === "product" ? null : scopeId;
    const isProduct = variantKey === null;
    const links = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
    const idsToDelete = new Set(linkIds);
    const toDelete = links.filter((l) => idsToDelete.has(l.id));
    if (!toDelete.length) {
      setDeleteConfirm(null);
      return;
    }

    setDeleteConfirm(null);
    setDeletingBatch(true);

    const runBatchDelete = async () => {
      for (const linkToDelete of toDelete) {
        const path = sanitizeStoragePath(linkToDelete.storage_path ?? linkToDelete.storagePath);
        if (path) await deleteAsset(path);
        await deleteLink(linkToDelete.id);
      }

      const remaining = links.filter((l) => !idsToDelete.has(l.id));
      const normalized = normalizeSortOrder(remaining, remaining.map((l) => l.id));
      const updates = normalized.map((l) => ({ id: l.id, sort_order: l.sort_order }));

      if (updates.length > 0) {
        await updateLinksSortOrder(updates);
      }

      clearSelection(scopeId);

      if (isProduct) {
        setProductLinks(normalized);
      } else {
        setVariantLinksMap((prev) => ({ ...prev, [variantKey]: normalized }));
      }
    };

    try {
      if (SILENT_AUTOSAVE) {
        await runBatchDelete();
      } else {
        const opId = saveStatus.saving("images-delete");
        try {
          await runBatchDelete();
          saveStatus.success("images-delete", opId);
          addNotification({
            type: "success",
            title: "Imagens",
            message: toDelete.length === 1 ? "1 imagem excluída." : `${toDelete.length} imagens excluídas.`,
          });
        } catch (err) {
          saveStatus.error("images-delete", opId, {
            message: err?.message || "Falha ao excluir",
            retry: () => setDeleteConfirm(payload),
          });
          throw err;
        }
      }
    } catch (err) {
      addNotification({ type: "error", title: "Excluir", message: err?.message || "Erro ao excluir imagens" });
      setDeleteConfirm(payload);
      await loadLinks();
    } finally {
      setDeletingBatch(false);
    }
  }, [
    deleteConfirm,
    canOperate,
    productLinks,
    variantLinksMap,
    saveStatus,
    addNotification,
    loadLinks,
    clearSelection,
  ]);

  const handleReorder = useCallback(
    async (orderedIds, variantKey = null, affectedSlotIndex = null, movedLinkId = null) => {
    if (!canOperate || !orderedIds?.length) return;
    const isProduct = variantKey === null || variantKey === undefined;
    if (!isProduct) markVariantDirty(variantKey);
    const links = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
    const normalized = normalizeSortOrder(links, orderedIds);

    const toUpdate = normalized.filter((l) => {
      const orig = links.find((x) => x.id === l.id);
      return !orig || orig.sort_order !== l.sort_order;
    });

    if (toUpdate.length === 0) return;

    const updates = toUpdate.map((l) => ({ id: l.id, sort_order: l.sort_order }));

    if (isProduct) {
      setProductLinks(normalized);
    } else {
      setVariantLinksMap((prev) => ({ ...prev, [variantKey]: normalized }));
    }

    if (SILENT_AUTOSAVE) {
      try {
        await updateLinksSortOrder(updates);

        if (!isProduct) clearVariantDirty(variantKey);
      } catch (err) {
        addNotification({ type: "error", title: "Ordem", message: err?.message || "Erro ao salvar ordem" });
        await loadLinks();
      }
    } else {
      const opId = saveStatus.saving("images-reorder");
      try {
        await updateLinksSortOrder(updates);
        if (!isProduct) clearVariantDirty(variantKey);
        saveStatus.success("images-reorder", opId);
      } catch (err) {
        saveStatus.error("images-reorder", opId, {
          message: err?.message || "Falha ao salvar ordem",
          retry: () => handleReorder(orderedIds, variantKey, null, movedLinkId),
        });
        addNotification({ type: "error", title: "Ordem", message: err?.message || "Erro ao salvar ordem" });
        await loadLinks();
      }
    }
  }, [canOperate, productLinks, variantLinksMap, addNotification, loadLinks, saveStatus, markVariantDirty, clearVariantDirty]);

  const getPreviewUrl = useCallback(async (link) => {
    const path = sanitizeStoragePath(link?.storage_path ?? link?.storagePath);
    if (!path) return null;
    const url = await resolveProductImageSrc(link);
    return url || null;
  }, []);

  const previewRefetchCountRef = useRef(new Map());

  const handlePreviewError = useCallback((linkId) => {
    if (seoOptimizing) return;
    const count = previewRefetchCountRef.current.get(linkId) ?? 0;
    if (count >= 1) return;
    previewRefetchCountRef.current.set(linkId, count + 1);
    previewFetchedRef.current.delete(linkId);
    setPreviewUrls((prev) => {
      const next = new Map(prev);
      next.delete(linkId);
      return next;
    });
    setRefreshPreviewSeed((s) => s + 1);
  }, [seoOptimizing]);

  useEffect(() => {
    const contextKey = `${productId ?? ""}_${draftKey ?? ""}`;
    if (previewContextRef.current !== contextKey) {
      previewContextRef.current = contextKey;
      previewFetchedRef.current.clear();
      previewRefetchCountRef.current.clear();
      setPreviewUrls(new Map());
    }

    const allLinks = [
      ...productLinks,
      ...Object.values(variantLinksMap).flat(),
    ];
    const linkIds = new Set(allLinks.map((l) => l.id));
    let cancelled = false;
    const CONCURRENCY = 4;

    setPreviewUrls((prev) => {
      const next = new Map(prev);
      prev.forEach((_, id) => {
        if (!linkIds.has(id)) {
          next.delete(id);
          previewFetchedRef.current.delete(id);
        }
      });
      return next;
    });

    const toFetch = allLinks.filter((l) => {
      if (loading) return false;
      if (previewFetchedRef.current.has(l.id)) return false;
      const path = sanitizeStoragePath(l.storage_path ?? l.storagePath);
      return !!path;
    });

    const runBatch = async (batch) => {
      const results = await Promise.all(
        batch.map(async (link) => ({ link, url: await getPreviewUrl(link) }))
      );
      if (cancelled) return;
      setPreviewUrls((prev) => {
        const next = new Map(prev);
        results.forEach(({ link, url }) => {
          if (url) {
            next.set(link.id, url);
            previewFetchedRef.current.add(link.id);
            previewRefetchCountRef.current.delete(link.id);
          }
        });
        return next;
      });
    };

    (async () => {
      for (let i = 0; i < toFetch.length && !cancelled; i += CONCURRENCY) {
        const batch = toFetch.slice(i, i + CONCURRENCY);
        await runBatch(batch);
      }
    })();

    return () => { cancelled = true; };
  }, [productId, draftKey, productLinks, variantLinksMap, getPreviewUrl, refreshPreviewSeed, loading]);

  const handleOpenPreview = async (link) => {
    try {
      const path = sanitizeStoragePath(link?.storage_path ?? link?.storagePath);
      const url = path ? await resolveProductImageSrc(link) : "";
      if (!url) {
        addNotification({
          event_type: "IMAGE_UNAVAILABLE",
          title: "Imagens",
          message: "Imagem indisponível — atualize ou reabra.",
          severity: NOTIFICATION_SEVERITY.INFO,
        });
        return;
      }
      setPreviewModal({ open: true, url, title: link?.file_name || "Imagem" });
    } catch (err) {
      console.error("Erro ao abrir imagem:", err);
      addNotification({ type: "error", title: "Abrir", message: err?.message || "Erro ao abrir imagem" });
    }
  };

  const handleOpenInNewTab = async (link) => {
    try {
      const path = sanitizeStoragePath(link?.storage_path ?? link?.storagePath);
      const url = path ? await resolveProductImageSrc(link) : "";
      if (!url) {
        addNotification({
          event_type: "IMAGE_UNAVAILABLE",
          title: "Imagens",
          message: "Imagem indisponível — atualize ou reabra.",
          severity: NOTIFICATION_SEVERITY.INFO,
        });
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Erro ao abrir imagem:", err);
      addNotification({ type: "error", title: "Abrir", message: err?.message || "Erro ao abrir imagem" });
    }
  };

  const handleDownloadSelected = async (scopeId) => {
    const links = scopeId === "product" || scopeId === null
      ? productLinks
      : (variantLinksMap[scopeId] || []);
    const selectedInScope = selectedImageIdsByScope[scopeId];
    const toDownload = selectedInScope?.size > 0
      ? links.filter((l) => selectedInScope.has(l.id))
      : [];
    if (toDownload.length === 0) return;

    setDownloadingSelected(true);
    const CONCURRENCY = 2;
    const errors = [];

    try {
      for (let i = 0; i < toDownload.length; i += CONCURRENCY) {
        const chunk = toDownload.slice(i, i + CONCURRENCY);
        await Promise.all(
          chunk.map(async (link) => {
            try {
              const path = sanitizeStoragePath(link?.storage_path ?? link?.storagePath);
              if (!path) {
                errors.push("Imagem indisponível");
                return;
              }
              await downloadAsBlob(path, link?.file_name || "imagem");
            } catch (err) {
              errors.push(err?.message || "Erro ao baixar");
            }
          })
        );
      }
    } finally {
      setDownloadingSelected(false);
    }

    if (errors.length > 0) {
      addNotification({ type: "error", title: "Download", message: `${errors.length} falha(s): ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? "…" : ""}` });
    }
  };

  const totalImages = format === "simple"
    ? productLinks.length
    : Object.values(variantLinksMap).flat().length;

  const handleBulkSeoRename = useCallback(async (variantKey = null) => {
    if (!canOperate) return;
    if (!hasSeoKeywords) {
      setSeoKeywordsModalOpen(true);
      return;
    }
    if (!hasProductId && !hasDraftKey) {
      addNotification({
        event_type: "SEO_RENAME_BLOCKED",
        title: "Renomear imagens (SEO)",
        message: "Informe produto ou rascunho para renomear imagens (SEO).",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
      return;
    }
    if (!API_BASE_URL) {
      const msg = "API não configurada (VITE_API_BASE_URL)";
      addNotification({ type: "error", title: "SEO", message: msg });
      return;
    }
    setSeoOptimizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        const msg = "Sessão expirada. Faça login novamente.";
        addNotification({ type: "error", title: "SEO", message: msg });
        return;
      }

      const base = API_BASE_URL.replace(/\/+$/, "");
      const path = base.endsWith("/api") ? "/images/seo-rename" : "/api/images/seo-rename";
      const url = `${base}${path}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scope: hasProductId ? { product_id: productId } : { draft_key: draftKey },
          variant_key: variantKey ?? null,
          mode: "ALL",
          ...(hasDraftKey && {
            seo_keywords: seoKeywordsArray,
            product_name: (productName || "").trim() || "draft",
          }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.code || `Erro ${res.status}` || "Falha ao renomear";
        addNotification({ type: "error", title: "Renomear imagens (SEO)", message: msg });
        console.error("[ProductFormImagesTab] seo-rename error", { status: res.status, data });
        return;
      }

      const totalRenamed = data.renamed ?? 0;
      setPreviewModal({ open: false, url: null, title: null });

      const prevFlat = [...productLinks, ...Object.values(variantLinksMap).flat()];
      const fetchResult = await loadLinks({ silent: true });
      if (fetchResult) {
        const { productLinks: nextProduct, variantLinksMap: nextVariantMaybe } = fetchResult;
        const nextVariant = nextVariantMaybe !== undefined ? nextVariantMaybe : variantLinksMap;
        const nextFlat = [...nextProduct, ...Object.values(nextVariant).flat()];
        const invalidateIds = previewIdsToInvalidate(prevFlat, nextFlat);
        if (invalidateIds.size > 0) {
          setPreviewUrls((prev) => {
            const next = new Map(prev);
            invalidateIds.forEach((id) => next.delete(id));
            return next;
          });
          invalidateIds.forEach((id) => previewFetchedRef.current.delete(id));
        }
      }

      addNotification({
        event_type: "SEO_RENAME_OK",
        title: "Renomear imagens (SEO)",
        message: seoRenameSuccessMessage(totalRenamed),
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } catch (err) {
      const msg = err?.message || "Erro ao renomear imagens.";
      addNotification({ type: "error", title: "Renomear imagens (SEO)", message: msg });
      console.error("[ProductFormImagesTab] seo-rename exception", err);
    } finally {
      setSeoOptimizing(false);
    }
  }, [
    seoKeywordsArray,
    hasSeoKeywords,
    productName,
    canOperate,
    hasProductId,
    hasDraftKey,
    productId,
    draftKey,
    productLinks,
    variantLinksMap,
    addNotification,
    loadLinks,
  ]);

  const handleSeoModalGoToData = useCallback(() => {
    setSeoKeywordsModalOpen(false);
    (onGoToSeo ?? onSwitchToDataTab)?.();
  }, [onGoToSeo, onSwitchToDataTab]);

  if (!canOperate) {
    return (
      <div className="pf-images-container">
        <div className="s7-alert s7-alert--warning">
          Não foi possível carregar o escopo de imagens. Verifique a conexão.
        </div>
      </div>
    );
  }

  return (
    <div className="pf-images-container">
      {format === "simple" && (
        <div className="s7-local-section-header">
          <div className="s7-local-section-header-left">
            <span className="s7-local-section-title pf-images-heading-with-tip">
              Adicione até {MAX_IMAGES} fotos
              <ImagesSectionQualityTipIcon className="s7-local-info-icon" />
            </span>
          </div>

          {totalImages > 0 && (
            <div className="s7-local-section-actions pf-images-top-actions">
              {hasSeoKeywords ? (
                <S7Tooltip content={SEO_RENAME_TOOLTIP} placement="top-start" offset={4} wrap>
                  <span className="pf-images-action-tooltip-wrap">
                    <S7Button
                      variant="secondary"
                      size="sm"
                      iconName="image"
                      onClick={() => handleBulkSeoRename(null)}
                      disabled={productSelectedCount === 0 || seoOptimizing}
                    >
                      {seoOptimizing ? "Renomeando…" : "Renomear imagens (SEO)"}
                    </S7Button>
                  </span>
                </S7Tooltip>
              ) : (
                <S7Button
                  variant="secondary"
                  size="sm"
                  iconName="image"
                  onClick={onGoToSeo ?? handleSeoModalGoToData}
                >
                  Definir palavras chaves (SEO)
                </S7Button>
              )}

              <S7Button
                variant="secondary"
                size="sm"
                iconName="download"
                onClick={() => handleDownloadSelected("product")}
                disabled={productSelectedCount === 0 || downloadingSelected}
              >
                {downloadingSelected ? "Baixando…" : "Baixar imagens"}
              </S7Button>

              {productId && format === "simple" ? (
                <S7Button
                  variant="secondary"
                  size="sm"
                  iconName="image"
                  onClick={() => setSyncModalOpen(true)}
                  disabled={productSelectedCount === 0}
                >
                  Sincronizar em anúncios
                </S7Button>
              ) : null}

              <S7Button
                variant="secondary"
                size="sm"
                iconName="trash"
                onClick={() => handleBulkDeleteRequest("product")}
                disabled={productSelectedCount === 0 || deletingBatch}
              >
                {bulkDeleteButtonLabel(productSelectedCount)}
              </S7Button>

              <SelectionScopeToggleButton
                selectedCount={productSelectedCount}
                imageCount={productLinks.length}
                onSelectAll={() => selectAllInScope("product")}
                onClearSelection={() => clearSelection("product")}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="s7-alert s7-alert--danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="pf-images-loading">Carregando imagens...</div>
      ) : (
        <>
          {/* Produto simples: apenas grid de Imagens do produto (sem título redundante) */}
          {format === "simple" && (
            <section className="pf-images-section">
              <ImageSlotRow
                links={productLinks}
                previewUrls={previewUrls}
                selectedImageIds={productSelectedImageIds}
                onUpload={(files) => handleUpload(files, null)}
                onReorder={(ids, slotIndex, movedLinkId) => handleReorder(ids, null, slotIndex, movedLinkId)}
                onToggleSelect={(linkId) => toggleSelectImage(linkId, "product")}
                onOpenPreview={handleOpenPreview}
                onPreviewError={handlePreviewError}
                uploading={uploadingScopeId === "product"}
                maxSlots={MAX_IMAGES}
                scopeId="product"
                recentSavedKey={recentSavedKey}
                onShowSavedBadge={showSavedBadge}
                showToolbar={false}
              />
            </section>
          )}

          {/* Produto com variações: apenas Imagens por variação (sem seção global) */}
          {format === "variants" && variantRows?.length > 0 && (
            <VariationBlocksSection
              seoOptimizing={seoOptimizing}
              hasSeoKeywords={hasSeoKeywords}
              onBulkSeoRename={handleBulkSeoRename}
              onGoToSeo={onGoToSeo ?? handleSeoModalGoToData}
              dirtyVariants={dirtyVariants}
              variantRows={variantRows}
              variantKeyFn={variantKeyFn}
              variantLinksMap={variantLinksMap}
              previewUrls={previewUrls}
              selectedImageIdsByScope={selectedImageIdsByScope}
              onUpload={handleUpload}
              onReorder={handleReorder}
              toggleSelectImage={toggleSelectImage}
              onOpenPreview={handleOpenPreview}
              onPreviewError={handlePreviewError}
              onVariantReorder={onVariantReorder}
              onShowSavedBadge={showSavedBadge}
              uploadingScopeId={uploadingScopeId}
              recentSavedKey={recentSavedKey}
              onDownloadSelected={handleDownloadSelected}
              onBulkDeleteRequest={handleBulkDeleteRequest}
              onSelectAll={selectAllInScope}
              onClearSelection={clearSelection}
              downloadingSelected={downloadingSelected}
              deletingBatch={deletingBatch}
            />
          )}
        </>
      )}

      {/* Modal palavras-chave necessárias (SEO) */}
      {seoKeywordsModalOpen &&
        createPortal(
          <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-modal-seo-title">
            <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="s7-modal-icon-wrap">
                <div className="s7-modal-icon s7-modal-icon--success">✓</div>
              </div>
              <h2 id="s7-modal-seo-title" className="s7-modal-title">Palavras-chave necessárias</h2>
              <p className="s7-modal-text">
                Cadastre as palavras-chave na aba Dados para otimizar o nome das imagens.
              </p>
              <div className="s7-modal-actions">
                <button type="button" className="s7-modal-btn-secondary" onClick={() => setSeoKeywordsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="s7-modal-btn-primary" onClick={handleSeoModalGoToData}>
                  Ir para Dados
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal confirmação exclusão em lote */}
      {deleteConfirm &&
        createPortal(
          <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-modal-delete-title">
            <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="s7-modal-icon-wrap">
                <div className="s7-modal-icon s7-modal-icon--warning">!</div>
              </div>
              <h2 id="s7-modal-delete-title" className="s7-modal-title">
                {deleteConfirm.linkIds.length === 1 ? "Excluir imagem" : "Excluir imagens"}
              </h2>
              <p className="s7-modal-text">
                {`Tem certeza que deseja excluir ${deleteConfirm.linkIds.length} imagem${deleteConfirm.linkIds.length === 1 ? "" : "ns"} selecionada${deleteConfirm.linkIds.length === 1 ? "" : "s"}? Esta ação não poderá ser desfeita.`}
              </p>
              <div className="s7-modal-actions">
                <button type="button" className="s7-modal-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deletingBatch}>
                  Cancelar
                </button>
                <button type="button" className="s7-modal-btn-danger" onClick={() => handleDeleteConfirm()} disabled={deletingBatch}>
                  {deletingBatch ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal preview imagem (abrir dentro da página — não fecha ao clicar fora, apenas no botão Fechar) */}
      {previewModal.open && previewModal.url &&
        createPortal(
          <div className="s7-modal-overlay pf-images-preview-overlay" role="dialog" aria-modal="true">
            <div className="pf-images-preview-modal">
              <div className="pf-images-preview-header">
                <span className="pf-images-preview-title">{previewModal.title || "Imagem"}</span>
                <button type="button" className="pf-close" onClick={() => setPreviewModal({ open: false, url: null, title: null })}>
                  Fechar
                </button>
              </div>
              <div className="pf-images-preview-body">
                <img src={previewModal.url} alt="" />
              </div>
            </div>
          </div>,
          document.body
        )}

      <ProductImageSyncModal
        open={syncModalOpen}
        productId={productId != null ? String(productId) : null}
        selectedImageLinkIds={selectedSyncLinkIds}
        onClose={() => setSyncModalOpen(false)}
      />
    </div>
  );
}

/** Card de imagem sortable (Principal = sort_order 0, selecionar, arrastar, abrir) */
function SortableImageCard({
  link,
  previewUrls,
  selectedImageIds,
  onToggleSelect,
  onOpenPreview,
  onPreviewError,
  showRecentSaved,
}) {
  const isPrimary = (link?.sort_order ?? 0) === 0; /* link normalizado: sort_order ou sortOrder */

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleOpenClick = (e) => {
    e.stopPropagation();
    onOpenPreview?.(link);
  };

  const isSelected = selectedImageIds?.has(link.id) ?? false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`pf-images-card ${isDragging ? "pf-images-card--dragging" : ""}`}
    >
      <div className="pf-images-card-preview">
        {previewUrls.get(link.id) ? (
          <img
            src={previewUrls.get(link.id)}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => onPreviewError?.(link.id)}
          />
        ) : (
          <div className="pf-images-card-placeholder">…</div>
        )}
        {isPrimary && <span className="pf-images-badge pf-images-badge--primary">Principal</span>}
      </div>
      <div className="pf-images-card-actions">
        <S7Tooltip content="Arrastar para ordenar" placement="top-start" offset={4}>
          <span className="pf-images-drag-handle" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </span>
        </S7Tooltip>
        <S7Tooltip content="Selecionar imagem" placement="top-start" offset={4}>
          <button
            type="button"
            className={[
              "pf-images-btn-select",
              isSelected ? "pf-images-btn-select--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(link.id);
            }}
            aria-pressed={isSelected}
            aria-label="Selecionar imagem"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              {isSelected ? (
                <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </svg>
          </button>
        </S7Tooltip>
        {showRecentSaved ? <span className="pf-images-saved-badge" aria-hidden title="Salvo" /> : null}
        <S7Tooltip content="Abrir imagem" placement="top-start" offset={4}>
          <button
            type="button"
            className="pf-images-btn-open"
            onClick={handleOpenClick}
            aria-label="Abrir imagem"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </S7Tooltip>
      </div>
    </div>
  );
}

/** Linha com até 14 slots fixos (2×7): imagem (sortable) ou placeholder tracejado */
function ImageSlotRow({
  links,
  previewUrls,
  selectedImageIds,
  onUpload,
  onReorder,
  onToggleSelect,
  onOpenPreview,
  onPreviewError,
  uploading,
  recentSavedKey = null,
  onShowSavedBadge,
  maxSlots,
  scopeId,
  showToolbar = false,
}) {
  const inputRef = useRef(null);
  // ======================================================
  // S7 — Ordem de render das imagens
  // Regra: a UI respeita a ordem do array de links vindo
  // do estado (fonte de verdade), e o backend já garante
  // listagem por sort_order. Evita “voltar” visualmente
  // durante o drag & drop.
  // ======================================================
  const sortedLinks = useMemo(() => (links ? [...links] : []), [links]);
  const linkIds = useMemo(() => sortedLinks.map((l) => l.id), [sortedLinks]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = linkIds.indexOf(active.id);
    const newIndex = linkIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(linkIds, oldIndex, newIndex);
    const movedLink = sortedLinks.find((l) => l.id === active.id);
    const badgeScopeId =
      scopeId === "product"
        ? "product"
        : (movedLink?.variant_key || movedLink?.variantKey || scopeId);
    onShowSavedBadge?.(badgeScopeId, active.id);
    onReorder(newOrder, newIndex, active.id);
  };

  const triggerUpload = () => {
    if (!uploading && sortedLinks.length < maxSlots) inputRef?.current?.click();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={linkIds} strategy={horizontalListSortingStrategy}>
        <div className="pf-images-slot-row-wrap">
        <div className="pf-images-slot-row">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="pf-images-input-hidden"
            onChange={(e) => {
              try {
                const raw = e.target.files;
                const files = raw ? Array.from(raw) : [];
                e.target.value = "";
                if (files.length) onUpload(files);
              } catch (err) {
                console.error("[ProductFormImagesTab] input onChange error:", err);
                e.target.value = "";
              }
            }}
          />
          {Array.from({ length: maxSlots }, (_, index) => {
            const link = sortedLinks[index];
            if (link) {
              const normalizedLink = normalizeLink(link);
              const badgeScopeId =
                scopeId === "product"
                  ? "product"
                  : (normalizedLink.variant_key ?? scopeId);
              const match = recentSavedKey === `${badgeScopeId}:${link.id}`;
              return (
                <SortableImageCard
                  key={link.id}
                  link={normalizedLink}
                  previewUrls={previewUrls}
                  selectedImageIds={selectedImageIds}
                  onToggleSelect={onToggleSelect}
                  onOpenPreview={onOpenPreview}
                  onPreviewError={onPreviewError}
                  showRecentSaved={recentSavedKey != null && match}
                />
              );
            }
            const isFirstEmpty = index === sortedLinks.length;
            return (
              <div
                key={`empty-${scopeId}-${index}`}
                className={`pf-images-slot-empty ${isFirstEmpty ? "pf-images-slot-empty--upload" : ""}`}
                onClick={isFirstEmpty ? triggerUpload : undefined}
                role={isFirstEmpty ? "button" : undefined}
                tabIndex={isFirstEmpty ? 0 : undefined}
                onKeyDown={isFirstEmpty ? (e) => e.key === "Enter" && triggerUpload() : undefined}
              >
                {isFirstEmpty && (
                  <span className="pf-images-slot-empty-label">
                    {uploading ? "Enviando…" : "+ Adicionar"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
