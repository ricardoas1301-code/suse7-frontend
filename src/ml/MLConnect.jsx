// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { buildApiUrl } from "../config/api";

export default function MLConnect() {
  useEffect(() => {
    let mounted = true;

    const iniciarOAuthML = async () => {
      // --------------------------------------------------------
      // 1. Buscar usuário autenticado no Supabase ok
      // --------------------------------------------------------
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      // --------------------------------------------------------
      // 2. Validação de sessão
      // --------------------------------------------------------
      if (error || !data?.user) {
        console.warn("Usuário não autenticado para integração ML");
        window.location.href = "/login";
        return;
      }

      const userId = data.user.id;

      // --------------------------------------------------------
      // 3. Redirecionar para o backend (OAuth ML) — path /api/ml/connect
      // --------------------------------------------------------
      const connectUrl = buildApiUrl(
        `/api/ml/connect?user_id=${encodeURIComponent(userId)}`
      );
      if (!connectUrl) {
        console.error("[ML] Defina VITE_API_BASE_URL (ex.: https://suse7-backend-dev.vercel.app)");
        window.location.href = "/perfil/integracoes/mercado-livre";
        return;
      }
      window.location.href = connectUrl;
    };

    iniciarOAuthML();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------------------------------------
  // Tela de transição
  // --------------------------------------------------------------
  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
