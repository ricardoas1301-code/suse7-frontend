// ======================================================================
// COMPONENTE: MLCallback (VERSÃO FINAL CERTA)
// Objetivo: Capturar o "code", identificar o usuário logado e enviar
//           para o backend trocar por token + salvar no Supabase
// ======================================================================

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MLCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const processMLCode = async () => {
      const code = params.get("code");

      if (!code) {
        alert("❌ Nenhum código recebido do Mercado Livre.");
        return;
      }

      console.log("🔑 Código recebido:", code);

      // ---------------------------------------------------------
      // 1. Obter usuário logado no Suse7
      // ---------------------------------------------------------
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("❌ Usuário não autenticado!");
        return;
      }

      console.log("👤 Usuário logado:", user.id);

      // ---------------------------------------------------------
      // 2. Enviar CODE + user_id para o backend
      // ---------------------------------------------------------
      try {
        const res = await fetch(`${API_BASE_URL}/ml/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            suse_user_id: user.id, // ESSENCIAL!
          }),
        });

        const data = await res.json();
        console.log("🔐 Resposta do backend:", data);

        if (data.error) {
          alert("❌ Erro ao conectar Mercado Livre: " + data.error);
          return;
        }

        alert("✔ Conta Mercado Livre conectada com sucesso!");
        window.location.href = "/dashboard";

      } catch (err) {
        console.error("Erro:", err);
        alert("❌ Erro ao comunicar com o servidor.");
      }
    };

    processMLCode();
  }, []);

  return (
    <div style={{ padding: 25, textAlign: "center" }}>
      <h2>Integrando Mercado Livre...</h2>
      <p>Aguarde alguns segundos...</p>
    </div>
  );
}
