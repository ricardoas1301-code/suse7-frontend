// ======================================================================
// COMPONENTE: MLCallback
// Objetivo: Capturar o "code" da URL e enviar para o backend
// ======================================================================

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function MLCallback() {

  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(null);
  const [tokenResponse, setTokenResponse] = useState(null);

  useEffect(() => {
    // ---------------------------------------------------------
    // 1. Capturar o CODE da URL
    // ---------------------------------------------------------
    const codeFromURL = searchParams.get("code");
    setCode(codeFromURL);

    if (codeFromURL) {
      console.log("📌 CODE RECEBIDO DO ML:", codeFromURL);

      // ---------------------------------------------------------
      // 2. Enviar o code para o backend (trocar por token)
      // ---------------------------------------------------------
      fetch("http://localhost:3001/ml/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: codeFromURL })
      })
        .then(res => res.json())
        .then(data => {
          console.log("📌 TOKEN RECEBIDO DO BACKEND:", data);
          setTokenResponse(data);
        })
        .catch(err => console.error("Erro ao enviar o code:", err));
    }

  }, []);

  return (
    <div style={{ padding: 30, textAlign: "center" }}>
      <h2>Processando autorização...</h2>

      {code && (
        <p style={{ marginTop: 20 }}>Code recebido: <b>{code}</b></p>
      )}

      {tokenResponse && (
        <div style={{ marginTop: 30 }}>
          <h3>Token recebido com sucesso!</h3>
          <pre style={{ textAlign: "left", fontSize: 13, marginTop: 10 }}>
            {JSON.stringify(tokenResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
