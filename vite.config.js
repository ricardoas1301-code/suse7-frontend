import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Auth/REST Supabase: chamada direta ao projeto (sem proxy Vite).
// Proxy local causava HTML/522 quando o dev server não repassava corretamente.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
