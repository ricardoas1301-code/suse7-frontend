/**
 * ProductFormImagesTab — aba Imagens do ProductForm
 * - Upload (limite 7/escopo), ordenação (drag & drop), Principal = sort_order 0
 * - Download individual e em lote (signed URL 60s), excluir com confirmação
 * - Suporta produto simples e com variações
 * - Drag imagens (horizontal) e variações (vertical) com persistência
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
import { deleteAsset, downloadAsBlob, getSignedUrl, uploadAssets } from "../services/images/imageStorageService";
import { API_BASE_URL } from "../config/api";
import "./ProductFormImagesTab.css";

const MAX_IMAGES = 7;
const EMPTY_SELECTION = new Set();
/** Modo silencioso: reorder/delete não disparam SaveStatus nem toasts de sucesso */
const SILENT_AUTOSAVE = true;

/** Normaliza link para evitar mismatch storage_path/storagePath, variant_key/variantKey */
function normalizeLink(link) {
  if (!link) return null;
  return {
    ...link,
    storage_path: link.storage_path ?? link.storagePath,
    variant_key: link.variant_key ?? link.variantKey,
    sort_order: link.sort_order ?? link.sortOrder,
  };
}

function buildVariantKeyFromAttrs(attrsObj) {
  const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
}

/** Título para variação: "Cor: Vermelho" ou "Cor: Vermelho / Tamanho: P" */
function formatVariantTitle(attrsObj) {
  if (!attrsObj || Object.keys(attrsObj).length === 0) return "Geral";
  return Object.entries(attrsObj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" / ");
}

/** Bloco de variação sortable (drag vertical) */
function SortableVariantBlock({ row, variantKeyFn, variantLinksMap, previewUrls, selectedForDownload, onUpload, onDelete, onReorder, onToggleSelect, onDownload, onOpenPreview, onPreviewError, uploading, recentSavedKey, onShowSavedBadge, hasSeoKeywords, onSeoRename, onGoToSeo, seoOptimizing, seoJustOptimizedIds, selectModeActive, onToggleSelectMode, onDownloadSelected, downloadingSelected, isDirty = false }) {
  const vk = variantKeyFn(row.attributes);
  const title = formatVariantTitle(row.attributes);
  const variantLinks = variantLinksMap[vk] || [];
  const rowId = row.id || vk;

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pf-images-variant-block ${isDragging ? "pf-images-variant-block--dragging" : ""}`}
    >
      <div className="pf-images-variant-block-header">
        <h4 className="pf-images-variant-title">
          {title}
          {!SILENT_AUTOSAVE && isDirty && <span className="pf-dirty-dot" aria-hidden title="Alterações não salvas">•</span>}
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
      <ImageSlotRow
        links={variantLinks}
        previewUrls={previewUrls}
        selectedForDownload={selectedForDownload}
        onUpload={(files) => onUpload(files, vk)}
        onDelete={(id) => onDelete(id, vk)}
        onReorder={(ids, slotIndex, movedLinkId) => onReorder(ids, vk, slotIndex, movedLinkId)}
        onToggleSelect={onToggleSelect}
        onDownload={onDownload}
        onOpenPreview={onOpenPreview}
        onPreviewError={onPreviewError}
        uploading={uploading}
        recentSavedKey={recentSavedKey}
        onShowSavedBadge={onShowSavedBadge}
        hasSeoKeywords={hasSeoKeywords}
        onSeoRename={onSeoRename}
        onGoToSeo={onGoToSeo}
        seoOptimizing={seoOptimizing}
        seoJustOptimizedIds={seoJustOptimizedIds}
        maxSlots={7}
        scopeId={vk}
        selectModeActive={selectModeActive}
        onToggleSelectMode={() => onToggleSelectMode(vk)}
        onDownloadSelected={() => onDownloadSelected(vk)}
        downloadingSelected={downloadingSelected}
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
  selectedForDownloadByScope,
  onUpload,
  onDelete,
  onReorder,
  toggleSelectForDownload,
  onDownload,
  onOpenPreview,
  onPreviewError,
  onVariantReorder,
  onShowSavedBadge,
  hasSeoKeywords = false,
  onSeoRename = null,
  onSeoRenameClick = null,
  onGoToSeo = null,
  seoOptimizing = false,
  seoJustOptimizedIds = new Set(),
  downloadingSelected,
  uploadingScopeId,
  recentSavedKey,
  selectMode,
  activeSelectScope,
  onToggleSelectMode,
  onDownloadSelected,
  totalImages = 0,
  seoOptimizedBadge = false,
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
    <section className="pf-images-section">
      <h3 className="pf-images-section-title">Imagens por variação</h3>
      {totalImages > 0 && onSeoRenameClick && (
        <div className="pf-images-section-toolbar">
          <button
            type="button"
            className="s7-btn s7-btn--secondary"
            onClick={() => onSeoRenameClick?.()}
            disabled={seoOptimizing}
            title="Padronize o nome dos arquivos usando suas palavras-chave para organização e melhor desempenho em SEO/catálogos."
          >
            {seoOptimizing ? "Otimizando…" : "Otimizar nomes (SEO)"}
          </button>
          {seoOptimizedBadge && <span className="pf-images-seo-badge" aria-hidden>Otimizado</span>}
        </div>
      )}
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
                  selectedForDownload={selectedForDownloadByScope[vk] ?? EMPTY_SELECTION}
                  onUpload={onUpload}
                  onDelete={onDelete}
                  onReorder={onReorder}
                  onToggleSelect={(linkId) => toggleSelectForDownload(linkId, vk)}
                  onDownload={onDownload}
                  onOpenPreview={onOpenPreview}
                  onPreviewError={onPreviewError}
                  onShowSavedBadge={onShowSavedBadge}
                  recentSavedKey={recentSavedKey}
                  hasSeoKeywords={hasSeoKeywords}
                  onSeoRename={onSeoRename}
                  onGoToSeo={onGoToSeo}
                  seoOptimizing={seoOptimizing}
                  seoJustOptimizedIds={seoJustOptimizedIds}
                  uploading={uploadingScopeId != null && uploadingScopeId === vk}
                  selectModeActive={selectMode && activeSelectScope === vk}
                  onToggleSelectMode={onToggleSelectMode}
                  onDownloadSelected={onDownloadSelected}
                  downloadingSelected={downloadingSelected}
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
}) {
  const variantKeyFn = buildVariantKey || buildVariantKeyFromAttrs;

  const [productLinks, setProductLinks] = useState([]);
  const [variantLinksMap, setVariantLinksMap] = useState({});
  const [selectedForDownloadByScope, setSelectedForDownloadByScope] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrls, setPreviewUrls] = useState(new Map());
  const previewFetchedRef = useRef(new Set());
  const previewContextRef = useRef(null);
  const [refreshPreviewSeed, setRefreshPreviewSeed] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [activeSelectScope, setActiveSelectScope] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, title: null });
  const [uploadingScopeId, setUploadingScopeId] = useState(null);
  const [recentSavedKey, setRecentSavedKey] = useState(null);
  const recentSavedTimeoutRef = useRef(null);
  const [seoKeywordsModalOpen, setSeoKeywordsModalOpen] = useState(false);
  const [seoOptimizing, setSeoOptimizing] = useState(false);
  const [seoOptimizedBadge, setSeoOptimizedBadge] = useState(false);
  const seoOptimizedTimeoutRef = useRef(null);
  const [seoJustOptimizedIds, setSeoJustOptimizedIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const [dirtyVariants, setDirtyVariants] = useState(() => new Set());

  const showToast = useCallback((message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const markJustOptimized = useCallback((idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : (idOrIds ? [idOrIds] : []);
    if (!ids.length) return;
    setSeoJustOptimizedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setTimeout(() => {
      setSeoJustOptimizedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, 3500);
  }, []);

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

  useEffect(() => {
    console.log("[ProductFormImagesTab] mount/update", { productId, draftKey: draftKey?.slice?.(0, 8) + "...", hasProductId, hasDraftKey, canOperate });
  }, [productId, draftKey, hasProductId, hasDraftKey, canOperate]);

  useEffect(() => {
    return () => {
      if (recentSavedTimeoutRef.current) clearTimeout(recentSavedTimeoutRef.current);
      if (seoOptimizedTimeoutRef.current) clearTimeout(seoOptimizedTimeoutRef.current);
    };
  }, []);

  const loadLinks = useCallback(async () => {
    if (!canOperate) return;
    const opts = hasProductId ? { productId } : { draftKey };
    setLoading(true);
    setError(null);
    try {
      const generalLinks = await listLinks({ ...opts, variantKey: null });
      setProductLinks(generalLinks);

      if (format === "variants" && variantRows?.length > 0) {
        const uniqueKeys = [...new Set(variantRows.map((r) => variantKeyFn(r.attributes)).filter(Boolean))];
        const results = await Promise.all(
          uniqueKeys.map(async (vk) => ({ vk, links: await listLinks({ ...opts, variantKey: vk }) }))
        );
        const map = {};
        results.forEach(({ vk, links }) => { map[vk] = links; });
        setVariantLinksMap(map);
      }
    } catch (err) {
      setError(err.message || "Erro ao carregar imagens");
    } finally {
      setLoading(false);
    }
  }, [canOperate, hasProductId, productId, draftKey, format, variantRows, variantKeyFn]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

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
        addNotification({ type: "error", title: "Upload", message: "Limite máximo de 7 imagens atingido." });
        return;
      }
      let fileList = Array.isArray(files) ? files : Array.from(files || []);
      if (!fileList.length) {
        console.warn("[ProductFormImagesTab] handleUpload: nenhum arquivo após normalização");
        return;
      }
      if (fileList.length > remaining) {
        fileList = fileList.slice(0, remaining);
        addNotification({
          type: "warning",
          title: "Upload",
          message: `Apenas ${remaining} imagens foram enviadas. Limite máximo de 7 por variação.`,
        });
      }
      console.log("[ProductFormImagesTab] handleUpload: iniciando", { fileCount: fileList.length, userId, storageKey: storageKey?.slice?.(0, 8) + "..." });

      const metas = await uploadAssets(fileList, {
        userId,
        productId: hasProductId ? productId : undefined,
        draftKey: hasDraftKey ? draftKey : undefined,
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
        if (!meta?.storage_path?.trim()) {
          console.error("[ProductFormImagesTab] handleUpload: storage_path vazio", meta);
          throw new Error("storage_path vazio após upload");
        }
        const sortOrder = (currentLinks.length + i) || 0;
        const isPrimary = currentLinks.length === 0 && i === 0;
        await createImageRecord({
          productId: hasProductId ? productId : undefined,
          draftKey: hasDraftKey ? draftKey : undefined,
          variantKey: variantKey ?? null,
          storage_path: meta.storage_path,
          file_name: meta.file_name,
          mime_type: meta.mime_type,
          size_bytes: meta.size_bytes,
          sortOrder,
          isPrimary,
        });
      }
      await loadLinks();
      if (!SILENT_AUTOSAVE) {
        addNotification({ type: "success", title: "Upload", message: `${metas.length} imagem(ns) adicionada(s)` });
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

  const handleDeleteRequest = (linkId, variantKey = null) => {
    setDeleteConfirm({ linkId, variantKey });
  };

  const handleDeleteConfirm = useCallback(async (overrideConfirm) => {
    const payload = overrideConfirm ?? deleteConfirm;
    if (!payload || !canOperate) return;
    const { linkId, variantKey } = payload;
    if (!overrideConfirm) setDeleteConfirm(null);

    const scopeId = variantKey === null || variantKey === undefined ? "product" : variantKey;
    const isProduct = variantKey === null || variantKey === undefined;
    const links = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
    const linkToDelete = links.find((l) => l.id === linkId);
    if (!linkToDelete) return;

    const runDelete = async () => {
      await deleteAsset(linkToDelete.storage_path);
      await deleteLink(linkId);

      const remaining = links.filter((l) => l.id !== linkId);
      const normalized = normalizeSortOrder(remaining, remaining.map((l) => l.id));
      const updates = normalized.map((l) => ({ id: l.id, sort_order: l.sort_order }));

      if (updates.length > 0) {
        await updateLinksSortOrder(updates);
      }

      setSelectedForDownloadByScope((prev) => {
        const next = { ...prev };
        if (next[scopeId]) {
          const set = new Set(next[scopeId]);
          set.delete(linkId);
          next[scopeId] = set;
        }
        return next;
      });

      if (isProduct) {
        setProductLinks(normalized);
      } else {
        setVariantLinksMap((prev) => ({ ...prev, [variantKey]: normalized }));
      }
    };

    if (SILENT_AUTOSAVE) {
      try {
        await runDelete();
      } catch (err) {
        addNotification({ type: "error", title: "Excluir", message: err?.message || "Erro ao excluir" });
        if (!overrideConfirm) setDeleteConfirm({ linkId, variantKey });
        await loadLinks();
      }
    } else {
      const opId = saveStatus.saving("images-delete");
      try {
        await runDelete();
        saveStatus.success("images-delete", opId);
        addNotification({ type: "success", title: "Imagem", message: "Imagem excluída" });
      } catch (err) {
        saveStatus.error("images-delete", opId, {
          message: err?.message || "Erro ao excluir",
          retry: () => handleDeleteConfirm({ linkId, variantKey }),
        });
        addNotification({ type: "error", title: "Excluir", message: err?.message || "Erro ao excluir" });
        if (!overrideConfirm) setDeleteConfirm({ linkId, variantKey });
        await loadLinks();
      }
    }
  }, [deleteConfirm, canOperate, productLinks, variantLinksMap, saveStatus, addNotification, loadLinks]);

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

  const toggleSelectForDownload = (linkId, scopeId) => {
    setSelectedForDownloadByScope((prev) => {
      const set = new Set(prev[scopeId] || []);
      if (set.has(linkId)) set.delete(linkId);
      else set.add(linkId);
      return { ...prev, [scopeId]: set };
    });
  };

  const getPreviewUrl = useCallback(async (link) => {
    if (!link?.storage_path) return null;
    return getSignedUrl(link.storage_path);
  }, []);

  const previewRefetchCountRef = useRef(new Map());

  const handlePreviewError = useCallback((linkId) => {
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
  }, []);

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

    const toFetch = allLinks.filter((l) => !previewFetchedRef.current.has(l.id));

    const runBatch = async (batch) => {
      const results = await Promise.all(
        batch.map((link) => getPreviewUrl(link).then((url) => ({ link, url })))
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
  }, [productId, draftKey, productLinks, variantLinksMap, getPreviewUrl, refreshPreviewSeed]);

  const handleDownload = async (link) => {
    try {
      await downloadAsBlob(link?.storage_path, link?.file_name || "imagem");
    } catch (err) {
      console.error("Erro ao baixar imagem:", err);
      addNotification({ type: "error", title: "Download", message: err?.message || "Erro ao baixar imagem" });
    }
  };

  const handleOpenPreview = async (link) => {
    try {
      const url = await getSignedUrl(link?.storage_path, 60);
      if (url) {
        setPreviewModal({ open: true, url, title: link?.file_name || "Imagem" });
      }
    } catch (err) {
      console.error("Erro ao abrir imagem:", err);
      addNotification({ type: "error", title: "Abrir", message: err?.message || "Erro ao abrir imagem" });
    }
  };

  const handleOpenInNewTab = async (link) => {
    try {
      const url = await getSignedUrl(link?.storage_path, 60);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Erro ao abrir imagem:", err);
      addNotification({ type: "error", title: "Abrir", message: err?.message || "Erro ao abrir imagem" });
    }
  };

  const handleDownloadSelected = async (scopeId) => {
    const links = scopeId === "product" || scopeId === null
      ? productLinks
      : (variantLinksMap[scopeId] || []);
    const selectedInScope = selectedForDownloadByScope[scopeId];
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
              await downloadAsBlob(link?.storage_path, link?.file_name || "imagem");
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

  const handleSeoRenameClick = useCallback(async (linkOrNull = null) => {
    /* Backend exige productId (produto salvo); draft não suportado */
    if (!hasProductId) {
      showToast("Salve o produto para renomear imagens (SEO)");
      return;
    }
    const keywords = (seoKeywords || "").trim();
    if (!keywords) {
      setSeoKeywordsModalOpen(true);
      return;
    }
    if (!API_BASE_URL) {
      const msg = "API não configurada (VITE_API_BASE_URL)";
      addNotification({ type: "error", title: "SEO", message: msg });
      showToast(msg);
      return;
    }
    setSeoOptimizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        const msg = "Sessão expirada. Faça login novamente.";
        addNotification({ type: "error", title: "SEO", message: msg });
        showToast(msg);
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
          productId,
          variantKey: "__ALL__",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.code || `Erro ${res.status}` || "Falha ao renomear";
        addNotification({ type: "error", title: "Otimizar nomes (SEO)", message: msg });
        showToast("Falha ao renomear — verifique conexão/SEO");
        console.error("[ProductFormImagesTab] seo-rename error", { status: res.status, data });
        return;
      }

      const totalRenamed = data.renamed ?? 0;
      if (totalRenamed > 0) {
        setSeoOptimizedBadge(true);
        if (seoOptimizedTimeoutRef.current) clearTimeout(seoOptimizedTimeoutRef.current);
        seoOptimizedTimeoutRef.current = setTimeout(() => {
          setSeoOptimizedBadge(false);
          seoOptimizedTimeoutRef.current = null;
        }, 1000);
        setRefreshPreviewSeed((s) => s + 1);
        previewFetchedRef.current.clear();
        await loadLinks();
        const idsToMark = linkOrNull?.id
          ? [linkOrNull.id]
          : [
              ...productLinks.map((l) => l.id),
              ...Object.values(variantLinksMap).flat().map((l) => l.id),
            ];
        markJustOptimized(idsToMark);
        showToast("Nomes otimizados ✅");
      } else {
        showToast("Nenhuma imagem no escopo para renomear");
      }
    } catch (err) {
      const msg = err?.message || "Erro ao renomear imagens.";
      addNotification({ type: "error", title: "Otimizar nomes (SEO)", message: msg });
      showToast("Falha ao renomear — verifique conexão/SEO");
      console.error("[ProductFormImagesTab] seo-rename exception", err);
    } finally {
      setSeoOptimizing(false);
    }
  }, [seoKeywords, hasProductId, productId, productLinks, variantLinksMap, addNotification, loadLinks, markJustOptimized, showToast]);

  const handleSeoModalGoToData = useCallback(() => {
    setSeoKeywordsModalOpen(false);
    (onGoToSeo ?? onSwitchToDataTab)?.();
  }, [onGoToSeo, onSwitchToDataTab]);

  const toggleSelectMode = (scopeId) => {
    if (selectMode && activeSelectScope === scopeId) {
      setSelectMode(false);
      setActiveSelectScope(null);
      setSelectedForDownloadByScope((prev) => {
        const next = { ...prev };
        delete next[scopeId];
        return next;
      });
    } else {
      const scopeToClear = activeSelectScope && activeSelectScope !== scopeId ? activeSelectScope : null;
      setSelectMode(true);
      setActiveSelectScope(scopeId);
      setSelectedForDownloadByScope((prev) => {
        const next = { ...prev };
        if (scopeToClear) delete next[scopeToClear];
        return next;
      });
    }
  };

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
      {toast?.message && (
        <div className="pf-toast" role="status">{toast.message}</div>
      )}
      <p className="hint">
        Adicione até <strong>{MAX_IMAGES}</strong> fotos. Elas poderão ser usadas para atualizar anúncios em todos os canais.
      </p>

      {error && (
        <div className="s7-alert s7-alert--danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="pf-images-loading">Carregando imagens...</div>
      ) : (
        <>
          {/* Produto simples: apenas Imagens do produto */}
          {format === "simple" && (
            <section className="pf-images-section">
              <h3 className="pf-images-section-title">Imagens do produto</h3>
              {hasProductId && totalImages > 0 && (
                <div className="pf-images-section-toolbar">
                  <button
                    type="button"
                    className="s7-btn s7-btn--secondary"
                    onClick={handleSeoRenameClick}
                    disabled={seoOptimizing}
                    title="Padronize o nome dos arquivos usando suas palavras-chave para organização e melhor desempenho em SEO/catálogos."
                  >
                    {seoOptimizing ? "Otimizando…" : "Otimizar nomes (SEO)"}
                  </button>
                  {seoOptimizedBadge && <span className="pf-images-seo-badge" aria-hidden>Otimizado</span>}
                </div>
              )}
              <ImageSlotRow
                links={productLinks}
                previewUrls={previewUrls}
                selectedForDownload={selectedForDownloadByScope["product"] ?? EMPTY_SELECTION}
                onUpload={(files) => handleUpload(files, null)}
                onDelete={(id) => handleDeleteRequest(id, null)}
                onReorder={(ids, slotIndex, movedLinkId) => handleReorder(ids, null, slotIndex, movedLinkId)}
                onToggleSelect={(linkId) => toggleSelectForDownload(linkId, "product")}
                onDownload={handleDownload}
                onOpenPreview={handleOpenPreview}
                onPreviewError={handlePreviewError}
                uploading={uploadingScopeId === "product"}
                maxSlots={MAX_IMAGES}
                scopeId="product"
                recentSavedKey={recentSavedKey}
                onShowSavedBadge={showSavedBadge}
                hasSeoKeywords={(seoKeywords || "").trim().length > 0}
                onSeoRename={handleSeoRenameClick}
                onGoToSeo={onGoToSeo ?? handleSeoModalGoToData}
                seoOptimizing={seoOptimizing}
                seoJustOptimizedIds={seoJustOptimizedIds}
                selectModeActive={selectMode && activeSelectScope === "product"}
                onToggleSelectMode={() => toggleSelectMode("product")}
                onDownloadSelected={() => handleDownloadSelected("product")}
                downloadingSelected={downloadingSelected}
              />
            </section>
          )}

          {/* Produto com variações: apenas Imagens por variação (sem seção global) */}
          {format === "variants" && variantRows?.length > 0 && (
            <VariationBlocksSection
              totalImages={totalImages}
              seoOptimizing={seoOptimizing}
              onSeoRenameClick={handleSeoRenameClick}
              seoOptimizedBadge={seoOptimizedBadge}
              hasSeoKeywords={(seoKeywords || "").trim().length > 0}
              onSeoRename={handleSeoRenameClick}
              onGoToSeo={onGoToSeo ?? handleSeoModalGoToData}
              seoJustOptimizedIds={seoJustOptimizedIds}
              dirtyVariants={dirtyVariants}
              variantRows={variantRows}
              variantKeyFn={variantKeyFn}
              variantLinksMap={variantLinksMap}
              previewUrls={previewUrls}
              selectedForDownloadByScope={selectedForDownloadByScope}
              onUpload={handleUpload}
              onDelete={handleDeleteRequest}
              onReorder={handleReorder}
              toggleSelectForDownload={toggleSelectForDownload}
              onDownload={handleDownload}
              onOpenPreview={handleOpenPreview}
              onPreviewError={handlePreviewError}
              onVariantReorder={onVariantReorder}
              onShowSavedBadge={showSavedBadge}
              uploadingScopeId={uploadingScopeId}
              recentSavedKey={recentSavedKey}
              selectMode={selectMode}
              activeSelectScope={activeSelectScope}
              onToggleSelectMode={toggleSelectMode}
              onDownloadSelected={handleDownloadSelected}
              downloadingSelected={downloadingSelected}
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

      {/* Modal confirmação exclusão */}
      {deleteConfirm &&
        createPortal(
          <div className="s7-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-modal-delete-title">
            <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="s7-modal-icon-wrap">
                <div className="s7-modal-icon s7-modal-icon--success">✓</div>
              </div>
              <h2 id="s7-modal-delete-title" className="s7-modal-title">Excluir imagem</h2>
              <p className="s7-modal-text">
                Deseja excluir esta imagem?
              </p>
              <div className="s7-modal-actions">
                <button type="button" className="s7-modal-btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancelar
                </button>
                <button type="button" className="s7-modal-btn-danger" onClick={() => handleDeleteConfirm()}>
                  Excluir
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
    </div>
  );
}

/**
 * Card de imagem sortable (Principal = sort_order 0, download, abrir, delete, CTA SEO).
 * CTA SEO: "Renomear (SEO)" se keywords existem; "Definir palavras-chave (SEO)" caso contrário.
 */
function SortableImageCard({
  link,
  previewUrls,
  selectedForDownload,
  onDelete,
  onToggleSelect,
  onDownload,
  onOpenPreview,
  onPreviewError,
  selectModeActive,
  showRecentSaved,
  hasSeoKeywords = false,
  onSeoRename,
  onGoToSeo,
  seoOptimizing = false,
  seoJustOptimized = false,
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

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(link.id);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (import.meta.env.DEV && !onDownload) console.warn("[ImagesTab] onDownload missing");
    onDownload?.(link);
  };

  const handleOpenClick = (e) => {
    e.stopPropagation();
    onOpenPreview?.(link);
  };

  const handleSeoRenameClick = (e) => {
    e.stopPropagation();
    onSeoRename?.(link);
  };

  const handleGoToSeoClick = (e) => {
    e.stopPropagation();
    onGoToSeo?.();
  };

  const showSeoCta = Boolean(link?.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pf-images-card ${isDragging ? "pf-images-card--dragging" : ""}`}
    >
      <div className="pf-images-card-preview">
        {previewUrls.get(link.id) ? (
          <img
            src={previewUrls.get(link.id)}
            alt=""
            onError={() => onPreviewError?.(link.id)}
          />
        ) : (
          <div className="pf-images-card-placeholder">…</div>
        )}
        {isPrimary && <span className="pf-images-badge pf-images-badge--primary">Principal</span>}
        {seoJustOptimized && (
          <span className="pf-images-badge-seo-ok" aria-hidden>SEO ✅</span>
        )}
      </div>
      <div className="pf-images-card-actions">
        <div className="pf-images-card-actions__left">
          {selectModeActive && (
            <label className="pf-images-check" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedForDownload.has(link.id)}
                onChange={() => onToggleSelect(link.id)}
              />
            </label>
          )}
          {showRecentSaved && <span className="pf-images-saved-badge" aria-hidden title="Salvo" />}
        </div>
        <div className="pf-images-card-actions__right">
          <button
            type="button"
            className="pf-images-btn-download"
            onClick={handleDownloadClick}
            title="Baixar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            type="button"
            className="pf-images-btn-open"
            onClick={handleOpenClick}
            title="Abrir"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <span
            className="pf-images-drag-handle"
            {...attributes}
            {...listeners}
            aria-hidden
            title="Arraste para ordenar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </span>
          <button
            type="button"
            className="pf-images-btn-delete"
            onClick={handleDeleteClick}
            title="Excluir"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
      {/* CTA SEO: exibido quando há link (upload concluído) e produto salvo */}
      {showSeoCta && (
        <div className="pf-images-card-seo">
          {hasSeoKeywords ? (
            <button
              type="button"
              className="pf-images-btn-seo"
              onClick={handleSeoRenameClick}
              disabled={seoOptimizing}
              title="Padronize o nome do arquivo usando palavras-chave (SEO)"
            >
              {seoOptimizing ? "Otimizando…" : "Renomear (SEO)"}
            </button>
          ) : (
            <button
              type="button"
              className="pf-images-btn-seo"
              onClick={handleGoToSeoClick}
              title="Cadastre palavras-chave na aba Dados para otimizar nomes"
            >
              Definir palavras-chave (SEO)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Linha com 7 slots fixos: imagem (sortable) ou placeholder tracejado */
function ImageSlotRow({
  links,
  previewUrls,
  selectedForDownload,
  onUpload,
  onDelete,
  onReorder,
  onToggleSelect,
  onDownload,
  onOpenPreview,
  onPreviewError,
  uploading,
  recentSavedKey = null,
  onShowSavedBadge,
  hasSeoKeywords = false,
  onSeoRename,
  onGoToSeo,
  seoOptimizing = false,
  seoJustOptimizedIds = new Set(),
  maxSlots,
  scopeId,
  selectModeActive,
  onToggleSelectMode,
  onDownloadSelected,
  downloadingSelected = false,
}) {
  const inputRef = useRef(null);
  const sortedLinks = [...(links || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || 0);
  const linkIds = sortedLinks.map((l) => l.id);

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
          {sortedLinks.length > 0 && (
            <div className="pf-images-slot-row-toolbar">
              <button
                type="button"
                className={`s7-btn s7-btn--secondary pf-images-toggle-select ${selectModeActive ? "pf-images-toggle-select--active" : ""}`}
                onClick={onToggleSelectMode}
              >
                {selectModeActive ? "Desmarcar seleção" : "Baixar várias"}
              </button>
              {selectModeActive && (
                <button
                  type="button"
                  className="s7-btn s7-btn--secondary"
                  onClick={onDownloadSelected}
                  disabled={selectedForDownload.size === 0 || downloadingSelected}
                  title={selectedForDownload.size === 0 ? "Selecione ao menos 1 imagem" : undefined}
                >
                  {downloadingSelected ? "Baixando…" : "Baixar selecionadas"}
                </button>
              )}
            </div>
          )}
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
                  selectedForDownload={selectedForDownload}
                  onDelete={onDelete}
                  onToggleSelect={onToggleSelect}
                  onDownload={onDownload}
                  onOpenPreview={onOpenPreview}
                  onPreviewError={onPreviewError}
                  selectModeActive={selectModeActive}
                  showRecentSaved={recentSavedKey != null && match}
                  hasSeoKeywords={hasSeoKeywords}
                  onSeoRename={onSeoRename}
                  onGoToSeo={onGoToSeo}
                  seoOptimizing={seoOptimizing}
                  seoJustOptimized={seoJustOptimizedIds.has(link.id)}
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
