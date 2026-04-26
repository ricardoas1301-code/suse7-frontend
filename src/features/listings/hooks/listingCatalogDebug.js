/**
 * Diagnóstico: comparar payload real de capa antes/depois do F5.
 * No console do browser: `sessionStorage.setItem("suse7_debug_ml_listings_cover","1"); location.reload()`
 * Desligar: `sessionStorage.removeItem("suse7_debug_ml_listings_cover")`
 */
const SESSION_DEBUG_ML_LISTINGS_COVER = "suse7_debug_ml_listings_cover";

/**
 * @param {unknown[]} rawListings — `res.data.listings` antes do `mapGridApiToCatalogRow`
 */
export function debugLogMlListingsCoverFromApi(rawListings) {
  if (typeof sessionStorage === "undefined") return;
  if (sessionStorage.getItem(SESSION_DEBUG_ML_LISTINGS_COVER) !== "1") return;
  const rows = Array.isArray(rawListings) ? rawListings : [];
  const iso = new Date().toISOString();
  console.log(`[Suse7] GET /api/ml/listings — capa · galeria (${rows.length} linhas) @ ${iso}`);
  console.table(
    rows.map((g) => {
      const rec = g && typeof g === "object" ? /** @type {Record<string, unknown>} */ (g) : {};
      const cover = rec.cover_thumbnail_url ?? rec.cover_image_url ?? null;
      const coverStr = cover != null ? String(cover) : "";
      const gUrls = Array.isArray(rec.gallery_image_urls) ? rec.gallery_image_urls : [];
      return {
        external_listing_id: rec.external_listing_id != null ? String(rec.external_listing_id) : "",
        cover_len: coverStr.length,
        cover_preview: coverStr ? `${coverStr.slice(0, 72)}${coverStr.length > 72 ? "…" : ""}` : null,
        gallery_urls_len: gUrls.length,
        gallery_image_source: rec.gallery_image_source != null ? String(rec.gallery_image_source) : null,
      };
    }),
  );
}
