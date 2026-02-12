/**
 * ProductFormImagesTab — aba Imagens do ProductForm
 * - Upload, ordenação (drag & drop), definir principal, download, excluir
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
import {
  createImageRecord,
  deleteLink,
  listLinks,
  updateLink,
  updateLinksSortOrder,
} from "../services/images/imageRepository";
import { ensureSinglePrimary, normalizeSortOrder } from "../services/images/imageRules";
import { getSignedUrl, uploadAssets } from "../services/images/imageStorageService";
import "./ProductFormImagesTab.css";

const MAX_IMAGES = 7;

function buildVariantKeyFromAttrs(attrsObj) {
  const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
}

function formatVariantLabel(attrsObj) {
  if (!attrsObj || Object.keys(attrsObj).length === 0) return "Geral";
  return Object.entries(attrsObj)
    .map(([k, v]) => `${k} ${v}`)
    .join(" / ");
}

/** Título para variação: "Cor: Vermelho" ou "Cor: Vermelho / Tamanho: P" */
function formatVariantTitle(attrsObj) {
  if (!attrsObj || Object.keys(attrsObj).length === 0) return "Geral";
  return Object.entries(attrsObj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" / ");
}

/** Bloco de variação sortable (drag vertical) */
function SortableVariantBlock({ row, variantKeyFn, variantLinksMap, previewUrls, selectedForDownload, onUpload, onSetPrimary, onDelete, onReorder, onToggleSelect, uploading }) {
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
        <h4 className="pf-images-variant-title">{title}</h4>
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
        onSetPrimary={(id) => onSetPrimary(id, vk)}
        onDelete={(id) => onDelete(id, vk)}
        onReorder={(ids) => onReorder(ids, vk)}
        onToggleSelect={onToggleSelect}
        uploading={uploading}
        maxSlots={7}
        scopeId={vk}
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
  selectedForDownload,
  onUpload,
  onSetPrimary,
  onDelete,
  onReorder,
  onToggleSelect,
  onVariantReorder,
  uploading,
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleVariantDragEnd}
      >
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <div className="pf-images-variants-list">
            {variantRows.map((row) => (
              <SortableVariantBlock
                key={row.id || variantKeyFn(row.attributes)}
                row={row}
                variantKeyFn={variantKeyFn}
                variantLinksMap={variantLinksMap}
                previewUrls={previewUrls}
                selectedForDownload={selectedForDownload}
                onUpload={onUpload}
                onSetPrimary={onSetPrimary}
                onDelete={onDelete}
                onReorder={onReorder}
                onToggleSelect={onToggleSelect}
                uploading={uploading}
              />
            ))}
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
  initialProductImages = null,
  onVariantReorder = null,
}) {
  const variantKeyFn = buildVariantKey || buildVariantKeyFromAttrs;

  const [productLinks, setProductLinks] = useState([]);
  const [variantLinksMap, setVariantLinksMap] = useState({});
  const [selectedForDownload, setSelectedForDownload] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState(new Map());

  const { addNotification } = useNotifications();

  const hasProductId = !!productId && typeof productId === "string" && !productId.startsWith("draft:");
  const hasDraftKey = !!draftKey && typeof draftKey === "string";
  const canOperate = hasProductId || hasDraftKey;

  useEffect(() => {
    console.log("[ProductFormImagesTab] mount/update", { productId, draftKey: draftKey?.slice?.(0, 8) + "...", hasProductId, hasDraftKey, canOperate });
  }, [productId, draftKey, hasProductId, hasDraftKey, canOperate]);

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
        const map = {};
        for (const vk of uniqueKeys) {
          map[vk] = await listLinks({ ...opts, variantKey: vk });
        }
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

    setUploading(true);
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

      const fileList = Array.isArray(files) ? files : Array.from(files || []).slice(0, MAX_IMAGES);
      if (!fileList.length) {
        console.warn("[ProductFormImagesTab] handleUpload: nenhum arquivo após normalização");
        return;
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

      const isProduct = variantKey === null || variantKey === undefined;
      const currentLinks = isProduct ? productLinks : (variantLinksMap[variantKey] || []);

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
      addNotification({ type: "success", title: "Upload", message: `${metas.length} imagem(ns) adicionada(s)` });
    } catch (err) {
      const msg = err?.message || String(err) || "Erro no upload";
      console.error("[ProductFormImagesTab] handleUpload erro:", err);
      setError(msg);
      addNotification({ type: "error", title: "Upload", message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (linkId, variantKey = null) => {
    if (!canOperate) return;
    const isProduct = variantKey === null || variantKey === undefined;
    const links = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
    const updated = ensureSinglePrimary(links, linkId);
    const primary = updated.find((l) => l.id === linkId);
    if (primary) {
      await updateLink(linkId, { is_primary: true });
      for (const l of links) {
        if (l.id !== linkId && l.is_primary) await updateLink(l.id, { is_primary: false });
      }
      await loadLinks();
    }
  };

  const handleDelete = async (linkId, variantKey = null) => {
    if (!canOperate) return;
    await deleteLink(linkId);
    setSelectedForDownload((prev) => {
      const next = new Set(prev);
      next.delete(linkId);
      return next;
    });
    await loadLinks();
  };

  const handleReorder = useCallback(async (orderedIds, variantKey = null) => {
    if (!canOperate || !orderedIds?.length) return;
    const isProduct = variantKey === null || variantKey === undefined;
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

    try {
      await updateLinksSortOrder(updates);
    } catch (err) {
      addNotification({ type: "error", title: "Reorder", message: err?.message || "Erro ao salvar ordem" });
      await loadLinks();
    }
  }, [canOperate, productLinks, variantLinksMap, addNotification, loadLinks]);

  const toggleSelectForDownload = (linkId) => {
    setSelectedForDownload((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  };

  const getPreviewUrl = useCallback(async (link) => {
    if (!link?.storage_path) return null;
    return getSignedUrl(link.storage_path);
  }, []);

  useEffect(() => {
    const urls = new Map();
    const allLinks = [
      ...productLinks,
      ...Object.values(variantLinksMap).flat(),
    ];
    let cancelled = false;
    allLinks.forEach(async (link) => {
      const url = await getPreviewUrl(link);
      if (!cancelled && url) setPreviewUrls((prev) => new Map(prev).set(link.id, url));
    });
    return () => { cancelled = true; };
  }, [productLinks, variantLinksMap, getPreviewUrl]);

  const handleDownloadSelected = async () => {
    const allLinks = [...productLinks, ...Object.values(variantLinksMap).flat()];
    const toDownload = selectedForDownload.size > 0
      ? allLinks.filter((l) => selectedForDownload.has(l.id))
      : allLinks;

    for (const link of toDownload) {
      const url = await getSignedUrl(link?.storage_path);
      if (url) window.open(url, "_blank");
    }
    setDownloadModalOpen(false);
  };

  const hasImages = productLinks.length > 0 || Object.values(variantLinksMap).some((arr) => arr?.length > 0);

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
          {/* Seção 1: Imagens do produto (7 slots fixos) */}
          <section className="pf-images-section">
            <h3 className="pf-images-section-title">Imagens do produto</h3>
            <ImageSlotRow
              links={productLinks}
              previewUrls={previewUrls}
              selectedForDownload={selectedForDownload}
              onUpload={(files) => handleUpload(files, null)}
              onSetPrimary={(id) => handleSetPrimary(id, null)}
              onDelete={(id) => handleDelete(id, null)}
              onReorder={(ids) => handleReorder(ids, null)}
              onToggleSelect={toggleSelectForDownload}
              uploading={uploading}
              maxSlots={MAX_IMAGES}
              scopeId="product"
            />
          </section>

          {/* Seção 2: Imagens por variação (cada variação com título + 7 slots, drag vertical) */}
          {format === "variants" && variantRows?.length > 0 && (
            <VariationBlocksSection
              variantRows={variantRows}
              variantKeyFn={variantKeyFn}
              variantLinksMap={variantLinksMap}
              previewUrls={previewUrls}
              selectedForDownload={selectedForDownload}
              onUpload={handleUpload}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onToggleSelect={toggleSelectForDownload}
              onVariantReorder={onVariantReorder}
              uploading={uploading}
            />
          )}
        </>
      )}

      {/* Botão Baixar imagens */}
      {hasImages && (
        <div className="pf-images-actions">
          <button
            type="button"
            className="s7-btn s7-btn--secondary"
            onClick={() => setDownloadModalOpen(true)}
          >
            Baixar imagens
          </button>
        </div>
      )}

      {/* Modal Download */}
      {downloadModalOpen &&
        createPortal(
          <div className="s7-modal-overlay" role="dialog" aria-modal="true" onClick={() => setDownloadModalOpen(false)}>
            <div className="s7-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="s7-modal-title">Baixar imagens</h2>
              <p className="s7-modal-text">
                {selectedForDownload.size > 0
                  ? `Baixar ${selectedForDownload.size} imagem(ns) selecionada(s)?`
                  : "Baixar todas as imagens do escopo atual? (uma por vez em nova aba)"}
              </p>
              <div className="s7-modal-actions">
                <button type="button" className="s7-modal-btn-secondary" onClick={() => setDownloadModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="s7-modal-btn-primary" onClick={handleDownloadSelected}>
                  {selectedForDownload.size > 0 ? "Baixar selecionadas" : "Baixar todas"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/** Card de imagem sortable (drag handle no ícone) */
function SortableImageCard({ link, previewUrls, selectedForDownload, onSetPrimary, onDelete, onToggleSelect }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pf-images-card ${isDragging ? "pf-images-card--dragging" : ""}`}
    >
      <div className="pf-images-card-preview">
        {previewUrls.get(link.id) ? (
          <img src={previewUrls.get(link.id)} alt="" />
        ) : (
          <div className="pf-images-card-placeholder">…</div>
        )}
      </div>
      <div className="pf-images-card-actions">
        {link.is_primary && <span className="pf-images-badge pf-images-badge--primary">Principal</span>}
        {!link.is_primary && (
          <button type="button" className="pf-images-btn-sm" onClick={() => onSetPrimary(link.id)}>
            Definir principal
          </button>
        )}
        <span
          className="pf-images-drag-icon"
          {...attributes}
          {...listeners}
          aria-hidden
          title="Arrastar para reordenar"
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
        <label className="pf-images-check">
          <input
            type="checkbox"
            checked={selectedForDownload.has(link.id)}
            onChange={() => onToggleSelect(link.id)}
          />
          Selecionar
        </label>
        <button
          type="button"
          className="pf-images-btn-delete"
          onClick={() => onDelete(link.id)}
          title="Excluir"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Linha com 7 slots fixos: imagem (sortable) ou placeholder tracejado */
function ImageSlotRow({
  links,
  previewUrls,
  selectedForDownload,
  onUpload,
  onSetPrimary,
  onDelete,
  onReorder,
  onToggleSelect,
  uploading,
  maxSlots,
  scopeId,
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
    onReorder(newOrder);
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
              return (
                <SortableImageCard
                  key={link.id}
                  link={link}
                  previewUrls={previewUrls}
                  selectedForDownload={selectedForDownload}
                  onSetPrimary={onSetPrimary}
                  onDelete={onDelete}
                  onToggleSelect={onToggleSelect}
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
      </SortableContext>
    </DndContext>
  );
}
