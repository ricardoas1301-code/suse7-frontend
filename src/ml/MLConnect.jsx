// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Redirecionar o usuário para a autorização oficial do
// Mercado Livre (OAuth 2.0), usando o client_id e o redirect_uri.
// ======================================================================

import { useEffect } from "react";

export default function MLConnect() {

  useEffect(() => {

    // ------------------------------------------------------------
    // 1. CONFIGURAÇÕES DO APLICATIVO ML
    // Coloque aqui temporariamente o client_id e o redirect_uri.
    // Depois vamos mover tudo isso para o backend (Passo 3).
    // ------------------------------------------------------------
    const CLIENT_ID = "5102529405183816";
    const REDIRECT_URI = "https://app.suse7.com.br/ml/callback";


    // ------------------------------------------------------------
    // 2. MONTAR A URL OFICIAL DE AUTORIZAÇÃO DO MERCADO LIVRE
    // ------------------------------------------------------------
    const authURL =
      `https://auth.mercadolivre.com.br/authorization` +
      `?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // ------------------------------------------------------------
    // 3. REDIRECIONAR AUTOMATICAMENTE PARA O ML
    // ------------------------------------------------------------
    window.location.href = authURL;

  }, []);

  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
