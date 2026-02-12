/**
 * ProductFormImagesTab — aba Imagens do ProductForm
 * - Upload, ordenação (drag & drop), definir principal, download, excluir
 * - Suporta produto simples e com variações
 * - Arquitetura modular pronta para expansão
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient";
import { useNotifications } from "../contexts/NotificationContext";
import {
  createImageRecord,
  deleteLink,
  listLinks,
  updateLink,
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

export default function ProductFormImagesTab({
  productId,
  draftKey,
  format = "simple",
  variantRows = [],
  buildVariantKey,
  initialProductImages = null,
}) {
  const variantKeyFn = buildVariantKey || buildVariantKeyFromAttrs;

  const [productLinks, setProductLinks] = useState([]);
  const [variantLinksMap, setVariantLinksMap] = useState({});
  const [selectedForDownload, setSelectedForDownload] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVariantKey, setSelectedVariantKey] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState(new Map());
  const [draggedId, setDraggedId] = useState(null);

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
          userId,
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

  const handleReorder = async (orderedIds, variantKey = null) => {
    if (!canOperate || !orderedIds?.length) return;
    const isProduct = variantKey === null || variantKey === undefined;
    const links = isProduct ? productLinks : (variantLinksMap[variantKey] || []);
    const normalized = normalizeSortOrder(links, orderedIds);
    for (const l of normalized) {
      await updateLink(l.id, { sort_order: l.sort_order });
    }
    await loadLinks();
  };

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
    const scopeLinks = selectedVariantKey
      ? (variantLinksMap[selectedVariantKey] || [])
      : productLinks;
    const toDownload = selectedForDownload.size > 0
      ? [...productLinks, ...Object.values(variantLinksMap).flat()].filter((l) => selectedForDownload.has(l.id))
      : scopeLinks;

    for (const link of toDownload) {
      const url = await getSignedUrl(link?.storage_path);
      if (url) window.open(url, "_blank");
    }
    setDownloadModalOpen(false);
  };

  const linksForCurrentScope = selectedVariantKey
    ? (variantLinksMap[selectedVariantKey] || [])
    : productLinks;

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
          {/* Seção 1: Imagens do produto */}
          <section className="pf-images-section">
            <h3 className="pf-images-section-title">Imagens do produto</h3>
            <ImageGrid
              links={productLinks}
              previewUrls={previewUrls}
              selectedForDownload={selectedForDownload}
              onUpload={(files) => handleUpload(files, null)}
              onSetPrimary={(id) => handleSetPrimary(id, null)}
              onDelete={(id) => handleDelete(id, null)}
              onReorder={(ids) => handleReorder(ids, null)}
              onToggleSelect={toggleSelectForDownload}
              uploading={uploading}
              maxImages={MAX_IMAGES}
              draggedId={draggedId}
              setDraggedId={setDraggedId}
            />
          </section>

          {/* Seção 2: Imagens por variação (apenas se format === variants) */}
          {format === "variants" && variantRows?.length > 0 && (
            <section className="pf-images-section">
              <h3 className="pf-images-section-title">Imagens por variação</h3>
              <div className="pf-images-variant-select">
                <label className="s7-label">Variação</label>
                <select
                  className="s7-select"
                  value={selectedVariantKey || ""}
                  onChange={(e) => setSelectedVariantKey(e.target.value || null)}
                >
                  <option value="">Selecione uma variação</option>
                  {variantRows.map((row) => {
                    const vk = variantKeyFn(row.attributes);
                    return (
                      <option key={vk} value={vk}>
                        {formatVariantLabel(row.attributes)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedVariantKey ? (
                <>
                  {variantLinksMap[selectedVariantKey]?.length > 0 ? (
                    <ImageGrid
                      links={variantLinksMap[selectedVariantKey] || []}
                      previewUrls={previewUrls}
                      selectedForDownload={selectedForDownload}
                      onUpload={(files) => handleUpload(files, selectedVariantKey)}
                      onSetPrimary={(id) => handleSetPrimary(id, selectedVariantKey)}
                      onDelete={(id) => handleDelete(id, selectedVariantKey)}
                      onReorder={(ids) => handleReorder(ids, selectedVariantKey)}
                      onToggleSelect={toggleSelectForDownload}
                      uploading={uploading}
                      maxImages={MAX_IMAGES}
                      draggedId={draggedId}
                      setDraggedId={setDraggedId}
                    />
                  ) : (
                    <>
                      <div className="pf-images-variant-empty">
                        <p>Esta variação não tem imagens próprias.</p>
                        <p className="pf-images-fallback-hint">
                          Esta variação usará a imagem principal do produto.
                        </p>
                      </div>
                      <ImageGrid
                        links={[]}
                        previewUrls={previewUrls}
                        selectedForDownload={selectedForDownload}
                        onUpload={(files) => handleUpload(files, selectedVariantKey)}
                        onSetPrimary={() => {}}
                        onDelete={() => {}}
                        onReorder={() => {}}
                        onToggleSelect={toggleSelectForDownload}
                        uploading={uploading}
                        maxImages={MAX_IMAGES}
                        draggedId={draggedId}
                        setDraggedId={setDraggedId}
                      />
                    </>
                  )}
                </>
              ) : (
                <p className="hint">Selecione uma variação para gerenciar suas imagens.</p>
              )}
            </section>
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

function ImageGrid({
  links,
  previewUrls,
  selectedForDownload,
  onUpload,
  onSetPrimary,
  onDelete,
  onReorder,
  onToggleSelect,
  uploading,
  maxImages,
  draggedId,
  setDraggedId,
}) {
  const inputRef = useRef(null);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragId = draggedId;
    setDraggedId(null);
    if (dragId == null || links.length === 0) return;
    const dragIdx = links.findIndex((l) => l.id === dragId);
    if (dragIdx < 0) return;
    const newOrder = [...links.map((l) => l.id)];
    newOrder.splice(dragIdx, 1);
    newOrder.splice(dropIndex, 0, dragId);
    onReorder(newOrder);
  };

  return (
    <div className="pf-images-grid">
      {links.map((link, idx) => (
        <div
          key={link.id}
          className="pf-images-card"
          draggable
          onDragStart={() => setDraggedId(link.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, idx)}
        >
          <div className="pf-images-card-preview">
            {previewUrls.get(link.id) ? (
              <img src={previewUrls.get(link.id)} alt="" />
            ) : (
              <div className="pf-images-card-placeholder">…</div>
            )}
          </div>
          <div className="pf-images-card-actions">
            {link.is_primary && <span className="pf-images-badge">Principal</span>}
            {!link.is_primary && (
              <button type="button" className="pf-images-btn-sm" onClick={() => onSetPrimary(link.id)}>
                Definir principal
              </button>
            )}
            <label className="pf-images-check">
              <input
                type="checkbox"
                checked={selectedForDownload.has(link.id)}
                onChange={() => onToggleSelect(link.id)}
              />
              Selecionar
            </label>
            <button type="button" className="pf-images-btn-sm pf-images-btn-delete" onClick={() => onDelete(link.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}

      {links.length < maxImages && (
        <div className="pf-images-upload-slot">
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
                if (files.length) {
                  onUpload(files);
                }
              } catch (err) {
                console.error("[ProductFormImagesTab] input onChange error:", err);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            className="s7-btn s7-btn--secondary"
            disabled={uploading}
            onClick={() => inputRef?.current?.click()}
          >
            {uploading ? "Enviando…" : "Adicionar fotos"}
          </button>
        </div>
      )}
    </div>
  );
}
