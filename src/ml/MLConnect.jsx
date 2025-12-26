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
  let mounted = true;

  const iniciarOAuthML = async () => {
    // --------------------------------------------------------
    // 1. Buscar usuário autenticado no Supabase
    // --------------------------------------------------------
    const { data, error } = await supabase.auth.getUser();

    if (!mounted) return;

    // --------------------------------------------------------
    // 2. Se não houver sessão válida, volta para login
    // --------------------------------------------------------
    if (error || !data?.user) {
      console.warn("Usuário não autenticado para integração ML");
      window.location.href = "/login";
      return;
    }

    // --------------------------------------------------------
    // 3. Redireciona para o backend com o UUID do Supabase
    // --------------------------------------------------------
    window.location.href =
      `https://app.suse7.com.br/api/ml/connect?user_id=${data.user.id}`;
  };

  iniciarOAuthML();

  return () => {
    mounted = false;
  };
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
