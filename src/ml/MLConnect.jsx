// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Redirecionar o usuário para a autorização oficial do
// Mercado Livre (OAuth 2.0), usando o client_id e o redirect_uri.
// ======================================================================

import { useEffect } from "react";

export default function MLConnect() {
  // ------------------------------------------------------------
  // EFEITO: roda uma vez ao abrir a rota /ml/connect
  // ------------------------------------------------------------
  useEffect(() => {
    // ------------------------------------------------------------
    // 1. CONFIGURAÇÕES DO APLICATIVO ML
    //  - CLIENT_ID: ID do app no Mercado Livre
    //  - REDIRECT_URI: rota do frontend que receberá o "code"
    //    (precisa ser a mesma cadastrada no painel do ML)
    // ------------------------------------------------------------
    const CLIENT_ID = "5102529405183816";
    const REDIRECT_URI = "https://app.suse7.com.br/ml/callback";

    // ------------------------------------------------------------
    // 2. MONTAR A URL OFICIAL DE AUTORIZAÇÃO DO MERCADO LIVRE
    // ------------------------------------------------------------
    const authURL =
      "https://auth.mercadolivre.com.br/authorization" +
      `?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // ------------------------------------------------------------
    // 3. REDIRECIONAR AUTOMATICAMENTE PARA O ML
    // ------------------------------------------------------------
    window.location.href = authURL;
  }, []);

  // --------------------------------------------------------------
  // MENSAGEM SIMPLES NA TELA (caso o usuário veja rapidamente)
  // --------------------------------------------------------------
  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
