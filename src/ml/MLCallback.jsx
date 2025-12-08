// ======================================================================
// COMPONENTE: MLCallback
// Objetivo: Capturar o "code" da URL e enviar para o backend trocar por token
// ======================================================================

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function MLCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Processando...");
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    // ---------------------------------------------------------
    // 1. Capturar o CODE enviado pelo Mercado Livre na URL
    // ---------------------------------------------------------
    const codeFromURL = searchParams.get("code");

    if (!codeFromURL) {
      setStatus("❌ Nenhum código recebido do Mercado Livre.");
      return;
    }

    setStatus("🔄 Código recebido! Enviando para o servidor...");

    // ---------------------------------------------------------
    // 2. Enviar o CODE para o backend (trocar pelo token)
    // ---------------------------------------------------------
    fetch("https://suse7-backend.vercel.app/ml/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeFromURL }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("TOKEN RECEBIDO DO BACKEND:", data);

        if (data.error) {
          setStatus("❌ Erro ao trocar o code pelo token.");
        } else {
          setStatus("✔️ Conta Mercado Livre conectada com sucesso!");
          setTokenData(data);
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus("❌ Erro na comunicação com o backend.");
      });
  }, []);

  return (
    <div style={{ padding: 25, textAlign: "center" }}>
      <h2>Integração Mercado Livre</h2>
      <p>{status}</p>

      {tokenData && (
        <pre
          style={{
            background: "#f5f5f5",
            padding: 15,
            borderRadius: 10,
            marginTop: 20,
            textAlign: "left",
          }}
        >
{JSON.stringify(tokenData, null, 2)}
        </pre>
      )}
    </div>
  );
}
