// ======================================================================
// Detecção de URL de imagem externa vs caminho interno do Supabase Storage.
// Mantido isolado para evitar import circular (imageStorageService ↔ productImageDisplayUrl).
// ======================================================================

/**
 * @param {unknown} s
 * @returns {boolean}
 */
export function isExternalAbsoluteImageUrl(s) {
  const t = String(s ?? "").trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (t.startsWith("//")) return true;
  if (t.startsWith("blob:") || t.startsWith("data:")) return true;
  return false;
}

/**
 * Evidência textual de URL/host externo (legado ML, JSON malformado, URL encoded, etc.).
 * Caminhos reais do bucket `userId/productId/arquivo.jpg` não contêm estes padrões.
 *
 * @param {unknown} s
 * @returns {boolean}
 */
export function stringShowsExternalImageEvidence(s) {
  const t = String(s ?? "").trim();
  if (!t) return false;
  if (isExternalAbsoluteImageUrl(t)) return true;
  const lower = t.toLowerCase();
  if (lower.includes("http://") || lower.includes("https://")) return true;
  if (lower.includes("mlstatic.com")) return true;
  if (lower.includes("//http")) return true;
  return false;
}

/**
 * @param {string} s
 * @param {number} maxPasses
 * @returns {string[]}
 */
function expandUriDecodedVariants(s, maxPasses = 4) {
  const out = [];
  let cur = s;
  for (let i = 0; i < maxPasses; i += 1) {
    out.push(cur);
    try {
      const next = decodeURIComponent(cur);
      if (next === cur) break;
      cur = next;
    } catch {
      break;
    }
  }
  return out;
}

/**
 * Legado (importação ML): `storage_path` pode vir serializado como JSON com URL absoluta,
 * ex.: `{"url":"https://http2.mlstatic.com/..."}`. Isso não é chave do bucket — não assinar.
 *
 * @param {unknown} raw
 * @returns {string} URL externa absoluta ou "".
 */
export function tryExternalImageUrlFromJsonLike(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (isExternalAbsoluteImageUrl(s)) return s;
  if (!s.startsWith("{") && !s.startsWith("[")) return "";
  try {
    const p = JSON.parse(s);
    const candidates = Array.isArray(p) ? p : [p];
    for (const item of candidates) {
      if (!item || typeof item !== "object") continue;
      const o = /** @type {Record<string, unknown>} */ (item);
      for (const k of ["url", "src", "secure_url", "picture", "storage_path"]) {
        const v = o[k];
        if (isExternalAbsoluteImageUrl(v)) return String(v).trim();
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * `true` → não chamar Supabase `createSignedUrl` com este valor (legado sujo/serializado).
 *
 * @param {unknown} raw
 * @param {number} depth — limite anti-recursão
 * @returns {boolean}
 */
export function isUnsafeToSignAsProductImageStoragePath(raw, depth = 0) {
  if (depth > 14) return false;
  const s0 = String(raw ?? "").trim();
  if (!s0) return false;

  const variants = expandUriDecodedVariants(s0);
  for (const t of variants) {
    if (stringShowsExternalImageEvidence(t)) return true;
    if (tryExternalImageUrlFromJsonLike(t)) return true;
  }

  let s = variants[variants.length - 1] ?? s0;
  for (let d = 0; d < 12; d += 1) {
    if (stringShowsExternalImageEvidence(s) || tryExternalImageUrlFromJsonLike(s)) return true;
    try {
      const p = JSON.parse(s);
      if (typeof p === "string") {
        s = p.trim();
        continue;
      }
      if (p && typeof p === "object" && !Array.isArray(p)) {
        const o = /** @type {Record<string, unknown>} */ (p);
        for (const v of Object.values(o)) {
          if (v == null) continue;
          if (typeof v === "string") {
            if (isUnsafeToSignAsProductImageStoragePath(v, depth + 1)) return true;
          } else if (typeof v === "object") {
            try {
              if (isUnsafeToSignAsProductImageStoragePath(JSON.stringify(v), depth + 1)) return true;
            } catch {
              /* ignore */
            }
          }
        }
        return false;
      }
      if (Array.isArray(p)) {
        for (const item of p) {
          if (typeof item === "string" && isUnsafeToSignAsProductImageStoragePath(item, depth + 1)) return true;
          if (item != null && typeof item === "object") {
            try {
              if (isUnsafeToSignAsProductImageStoragePath(JSON.stringify(item), depth + 1)) return true;
            } catch {
              /* referência circular etc. */
            }
          }
        }
        return false;
      }
      break;
    } catch {
      if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
        try {
          const inner = JSON.parse(s);
          if (typeof inner === "string") {
            s = inner.trim();
            continue;
          }
        } catch {
          s = s
            .slice(1, -1)
            .replace(/\\"/g, '"')
            .trim();
          continue;
        }
      }
      break;
    }
  }
  return false;
}

const LOOSE_HTTPS_IN_TEXT = /https?:\/\/[^\s"'<>)\]}\],;]+/i;

/**
 * Extrai URL usável em `<img src>` a partir de legado (JSON aninhado, percent-encode, ML sem scheme, lixo).
 *
 * @param {unknown} raw
 * @param {number} depth
 * @returns {string}
 */
export function tryExtractLegacyExternalImageUrl(raw, depth = 0) {
  if (depth > 14) return "";
  const s0 = String(raw ?? "").trim();
  if (!s0) return "";

  const variants = expandUriDecodedVariants(s0);
  for (const t of variants) {
    const j = tryExternalImageUrlFromJsonLike(t);
    if (j) return j;
    if (isExternalAbsoluteImageUrl(t)) return t.trim();
    const m = t.match(LOOSE_HTTPS_IN_TEXT);
    if (m) return m[0].replace(/[,;.)]+$/, "");
  }

  let s = variants[variants.length - 1] ?? s0;
  for (let d = 0; d < 12; d += 1) {
    const j = tryExternalImageUrlFromJsonLike(s);
    if (j) return j;
    const m0 = s.match(LOOSE_HTTPS_IN_TEXT);
    if (m0) return m0[0].replace(/[,;.)]+$/, "");
    try {
      const p = JSON.parse(s);
      if (typeof p === "string") {
        s = p.trim();
        continue;
      }
      if (p && typeof p === "object" && !Array.isArray(p)) {
        const o = /** @type {Record<string, unknown>} */ (p);
        for (const v of Object.values(o)) {
          const ext = tryExtractLegacyExternalImageUrl(v, depth + 1);
          if (ext) return ext;
        }
        return "";
      }
      if (Array.isArray(p) && p.length > 0) {
        for (const item of p) {
          const ext = tryExtractLegacyExternalImageUrl(item, depth + 1);
          if (ext) return ext;
        }
        return "";
      }
      break;
    } catch {
      if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
        try {
          const inner = JSON.parse(s);
          if (typeof inner === "string") {
            s = inner.trim();
            continue;
          }
        } catch {
          s = s
            .slice(1, -1)
            .replace(/\\"/g, '"')
            .trim();
          continue;
        }
      }
      break;
    }
  }

  if (/\bmlstatic\.com\b/i.test(s0)) {
    const m = s0.match(/(?:https?:\/\/)?[\w.-]*mlstatic\.com[^\s"'<>)\]}\],;]*/i);
    if (m) {
      let u = m[0].replace(/[,;.)]+$/, "");
      if (!/^https?:\/\//i.test(u)) u = `https://${u.replace(/^\/+/, "")}`;
      return u;
    }
  }

  return "";
}
