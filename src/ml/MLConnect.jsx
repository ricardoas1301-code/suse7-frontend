// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function MLConnect() {
  // ------------------------------------------------------------
  // Efeito: executa uma vez ao entrar na rota /ml/connect
  // ------------------------------------------------------------
  useEffect(() => {
    const iniciarOAuthML = async () => {
      // --------------------------------------------------------
      // 1. Obter usuário autenticado no Supabase
      // --------------------------------------------------------
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("❌ Usuário não autenticado. Faça login novamente.");
        return;
      }

      // --------------------------------------------------------
      // 2. Redirecionar para o backend com o user_id
      // --------------------------------------------------------
      window.location.href =
        `https://app.suse7.com.br/api/ml/connect?user_id=${user.id}`;
    };

    iniciarOAuthML();
  }, []);

  // --------------------------------------------------------------
  // Mensagem simples enquanto redireciona
  // --------------------------------------------------------------
  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
