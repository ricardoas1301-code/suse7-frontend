// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function MLConnect() {
  useEffect(() => {
    let mounted = true;

    const iniciarOAuthML = async () => {
      // --------------------------------------------------------
      // 1. Buscar usuário autenticado no Supabase
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
      // 3. Redirecionar para o backend (OAuth ML)
      // --------------------------------------------------------
      window.location.href =
        `${import.meta.env.VITE_API_URL}/ml/connect?user_id=${userId}`;
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
