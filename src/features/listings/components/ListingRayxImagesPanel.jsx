import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import "../../../components/ProductForm.css";
import "../../../components/ProductFormImagesTab.css";
import "./ListingRayxImagesPanel.css";

const IMAGES_LIMIT_TIP = "Número de imagens permitidas pelo Mercado Livre para a categoria";

/**
 * @param {Record<string, unknown>} pic
 */
function pictureStableKey(pic) {
  const pictureId =
    pic.picture_id != null && String(pic.picture_id).trim() !== ""
      ? String(pic.picture_id).trim()
      : pic.id != null && String(pic.id).trim() !== ""
        ? String(pic.id).trim()
        : null;
  if (pictureId) return `id:${pictureId}`;
  const url = pic.url != null ? String(pic.url).trim() : "";
  return url ? `url:${url}` : null;
}

/**
 * @param {{
 *   imagesSummary?: {
 *     pictures?: Array<{ url?: string | null; position?: number | null; picture_id?: string | null; stable_key?: string | null }>;
 *     pictures_count?: number | null;
 *     images_policy?: { maxPictures?: number | null };
 *   } | null;
 *   picturesFallback?: Array<{ url?: string | null; position?: number | null; picture_id?: string | null; stable_key?: string | null }>;
 *   orderedPictureKeys?: string[];
 *   onReorder?: (keys: string[]) => void;
 * }} props
 */
export default function ListingRayxImagesPanel({
  imagesSummary,
  picturesFallback = [],
  orderedPictureKeys = [],
  onReorder,
}) {
  const picturesByKey = useMemo(() => {
    const fromSummary = Array.isArray(imagesSummary?.pictures) ? imagesSummary.pictures : [];
    const source = fromSummary.length > 0 ? fromSummary : picturesFallback;
    /** @type {Map<string, { picture_id: string | null; url: string; position: number; stable_key: string }>} */
    const map = new Map();
    source.forEach((pic, index) => {
      const url = pic?.url != null ? String(pic.url).trim() : "";
      if (!url) return;
      const normalized = {
        picture_id: pic?.picture_id != null ? String(pic.picture_id) : null,
        url,
        position: pic?.position ?? index,
        stable_key: pic?.stable_key ?? pictureStableKey({ ...pic, url }),
      };
      if (normalized.stable_key) map.set(normalized.stable_key, normalized);
    });
    return map;
  }, [imagesSummary?.pictures, picturesFallback]);

  const orderedPictures = useMemo(() => {
    const keys =
      orderedPictureKeys.length > 0
        ? orderedPictureKeys
        : [...picturesByKey.keys()];
    return keys
      .map((key) => picturesByKey.get(key) ?? null)
      .filter(Boolean);
  }, [orderedPictureKeys, picturesByKey]);

  const picturesCount = orderedPictures.length;
  const maxPictures = imagesSummary?.images_policy?.maxPictures ?? null;
  const hasLimit = maxPictures != null && maxPictures > 0;
  const subtituloSecao = hasLimit ? `Adicione até ${maxPictures} fotos` : "Imagens do anúncio";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const currentKeys = orderedPictures.map((pic) => pic.stable_key).filter(Boolean);
    const oldIndex = currentKeys.indexOf(String(active.id));
    const newIndex = currentKeys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(currentKeys, oldIndex, newIndex));
  };

  return (
    <div className="listing-rayx-images" aria-label="Imagens do anúncio">
      <header className="listing-rayx-images__header listing-rayx-images__header--tip-safe">
        <div className="listing-rayx-images__subtitle s7-local-section-title pf-images-heading-with-tip">
          <span className="pf-images-heading-title-text">{subtituloSecao}</span>
          {hasLimit ? (
            <S7Tooltip content={IMAGES_LIMIT_TIP} placement="top-start" offset={6} wrap>
              <span className="listing-rayx-images__tip-wrap">
                <button
                  type="button"
                  className="pf-info-btn pf-images-section-tip-btn listing-rayx-images__tip-trigger"
                  aria-label="Informações sobre limite de fotos da categoria no Mercado Livre"
                >
                  i
                </button>
              </span>
            </S7Tooltip>
          ) : null}
        </div>
        {picturesCount > 0 ? (
          <span className="listing-rayx-images__count">
            {picturesCount} foto{picturesCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </header>

      {picturesCount > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedPictures.map((pic) => pic.stable_key).filter(Boolean)}
            strategy={rectSortingStrategy}
          >
            <div className="listing-rayx-images__grid">
              {orderedPictures.map((pic, index) => (
                <SortableListingImageCard
                  key={pic.stable_key}
                  id={pic.stable_key}
                  url={pic.url}
                  isPrincipal={index === 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="listing-rayx-images__empty">
          <p className="listing-rayx-images__empty-title">Nenhuma imagem sincronizada neste anúncio.</p>
          <p className="listing-rayx-images__empty-hint">Sincronize imagens a partir do Raio-X do Produto.</p>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{ id: string; url: string; isPrincipal: boolean }} props
 */
function SortableListingImageCard({ id, url, isPrincipal }) {
  const [broken, setBroken] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "pf-images-card",
        "listing-rayx-images__card",
        isDragging ? "pf-images-card--dragging listing-rayx-images__card--dragging" : "",
        isPrincipal ? "listing-rayx-images__card--primary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="listing-rayx-images__preview pf-images-card-preview">
        {isPrincipal ? <span className="pf-images-badge pf-images-badge--primary">Principal</span> : null}
        {broken ? (
          <span className="listing-rayx-images__placeholder" aria-hidden="true">
            🖼
          </span>
        ) : (
          <img src={url} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
        )}
        <S7Tooltip content="Arrastar para ordenar" placement="top-start" offset={4}>
          <span className="listing-rayx-images__drag-wrap">
            <button
              type="button"
              ref={setActivatorNodeRef}
              className="pf-images-drag-handle listing-rayx-images__drag-handle"
              aria-label="Arrastar para ordenar"
              {...attributes}
              {...listeners}
            >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
            </button>
          </span>
        </S7Tooltip>
      </div>
    </div>
  );
}
