import { apiFetch, buildApiUrl } from "../../../config/api";

/**
 * @param {string} listingId
 */
export async function fetchListingEditorDetail(listingId) {
  const id = String(listingId ?? "").trim();
  if (!id) {
    return { ok: false, error: "listing_id inválido", status: 400 };
  }
  const url = buildApiUrl(`/api/ml/listings/detail?listing_id=${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  const timeoutMs = import.meta.env.DEV ? 12000 : 15000;
  const controller = new AbortController();
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null;
  const timeoutResultPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve({
        ok: false,
        error: "Não foi possível carregar todos os dados oficiais agora.",
        status: 408,
        timedOut: true,
        connectionError: true,
      });
    }, timeoutMs);
  });
  const requestPromise = apiFetch(url, { method: "GET", signal: controller.signal });
  const res = await Promise.race([requestPromise, timeoutResultPromise]);
  if (timeoutId != null) clearTimeout(timeoutId);
  if (!res.ok) return res;
  return { ok: true, status: res.status, data: res.data };
}

/**
 * @param {{ listingId: string; title?: string; description?: string }} input
 */
export async function updateListingEditorContent(input) {
  const listingId = String(input?.listingId ?? "").trim();
  if (!listingId) return { ok: false, error: "listing_id inválido", status: 400 };
  const body = {
    listing_id: listingId,
    ...(input?.title != null ? { title: String(input.title) } : {}),
    ...(input?.description != null ? { description: String(input.description) } : {}),
  };
  const url = buildApiUrl("/api/ml/listings/content");
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

/**
 * @param {{ listingId: string; overrideEnabled: boolean; value: string | number | null }} input
 */
export async function updateListingEditorStockSettings(input) {
  const listingId = String(input?.listingId ?? "").trim();
  if (!listingId) return { ok: false, error: "listing_id inválido", status: 400 };
  const body = {
    listing_id: listingId,
    listing_virtual_stock_override_enabled: input?.overrideEnabled === true,
    listing_virtual_stock_value: input?.overrideEnabled === true ? input?.value : null,
  };
  const url = buildApiUrl("/api/ml/listings/stock-settings");
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

/**
 * @param {{
 *   listingId: string;
 *   primaryPictureKey?: string | null;
 *   primaryPictureId?: string | null;
 *   primaryPictureUrl?: string | null;
 * }} input
 */
export async function updateListingEditorPrimaryPictureSettings(input) {
  const listingId = String(input?.listingId ?? "").trim();
  if (!listingId) return { ok: false, error: "listing_id inválido", status: 400 };
  const orderedPictureKeys = Array.isArray(input?.orderedPictureKeys)
    ? input.orderedPictureKeys.map((key) => String(key ?? "").trim()).filter(Boolean)
    : [];
  const body = {
    listing_id: listingId,
    ordered_picture_keys: orderedPictureKeys,
  };
  const url = buildApiUrl("/api/ml/listings/primary-picture-settings");
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

/**
 * Persistência local da descrição do anúncio (sem escrita no marketplace).
 * @param {{ listingId: string; descriptionText: string }} input
 */
export async function updateListingEditorDescriptionSettings(input) {
  const listingId = String(input?.listingId ?? "").trim();
  if (!listingId) return { ok: false, error: "listing_id inválido", status: 400 };
  const body = {
    listing_id: listingId,
    description_text: String(input?.descriptionText ?? ""),
  };
  const url = buildApiUrl("/api/ml/listings/description-settings");
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

/**
 * Persistência local de pesos/medidas do anúncio (sem escrita no marketplace).
 * @param {{
 *   listingId: string;
 *   shipping_width_cm?: number | null;
 *   shipping_height_cm?: number | null;
 *   shipping_length_cm?: number | null;
 *   shipping_weight_kg?: number | null;
 *   product_width_cm?: number | null;
 *   product_height_cm?: number | null;
 *   product_length_cm?: number | null;
 *   product_weight_kg?: number | null;
 * }} input
 */
export async function updateListingEditorMeasurementSettings(input) {
  const listingId = String(input?.listingId ?? "").trim();
  if (!listingId) return { ok: false, error: "listing_id inválido", status: 400 };
  const body = {
    listing_id: listingId,
    shipping_width_cm: input?.shipping_width_cm ?? null,
    shipping_height_cm: input?.shipping_height_cm ?? null,
    shipping_length_cm: input?.shipping_length_cm ?? null,
    shipping_weight_kg: input?.shipping_weight_kg ?? null,
    product_width_cm: input?.product_width_cm ?? null,
    product_height_cm: input?.product_height_cm ?? null,
    product_length_cm: input?.product_length_cm ?? null,
    product_weight_kg: input?.product_weight_kg ?? null,
  };
  const url = buildApiUrl("/api/ml/listings/measurement-settings");
  if (!url) return { ok: false, error: "API indisponível", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

