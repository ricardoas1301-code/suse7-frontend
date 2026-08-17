// ======================================================
// Perfil resumido do layout — via backend (evita CORS REST direto no Supabase)
// ======================================================

import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @returns {Promise<{ ok: boolean; nome_loja: string | null; photo_url: string | null; logo_url: string | null; display_name: string | null; error?: string }>}
 */
export async function fetchUserProfileSummary() {
  const url = buildApiUrl("/api/user/profile-summary");
  if (!url) {
    return {
      ok: false,
      nome_loja: null,
      photo_url: null,
      logo_url: null,
      display_name: null,
      error: "Configure VITE_API_BASE_URL.",
    };
  }

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      nome_loja: null,
      photo_url: null,
      logo_url: null,
      display_name: null,
      error: res.error ?? "Não foi possível carregar o perfil.",
    };
  }

  const data = res.data ?? {};
  return {
    ok: true,
    nome_loja: data.nome_loja != null ? String(data.nome_loja) : null,
    photo_url: data.photo_url != null ? String(data.photo_url) : null,
    logo_url: data.logo_url != null ? String(data.logo_url) : null,
    display_name: data.display_name != null ? String(data.display_name) : null,
  };
}
