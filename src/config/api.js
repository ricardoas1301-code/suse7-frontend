// ======================================================
// CONFIGURAÇÃO BASE DA API — SUSE7
// Fonte única da URL do backend
// ======================================================

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
