// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Redirecionar o usuário para a autorização oficial do
// Mercado Livre (OAuth 2.0), usando o client_id e o redirect_uri.
// ======================================================================

// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";

export default function MLConnect() {
  // ------------------------------------------------------------
  // Efeito: executa uma vez ao entrar na rota /ml/connect
  // Redireciona o usuário para o backend iniciar o OAuth
  // ------------------------------------------------------------
  useEffect(() => {
    window.location.href = "https://app.suse7.com.br/api/ml/connect";
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

