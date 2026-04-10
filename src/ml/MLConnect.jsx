// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { buildApiUrl } from "../config/api";

const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";

export default function MLConnect() {
  const navigate = useNavigate();

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
        console.error(
          "[ML] Defina VITE_API_BASE_URL (dev local: http://localhost:3001; produção: URL do backend deployado)"
        );
        navigate("/perfil/integracoes/mercado-livre");
        return;
      }

      const probeUrl = buildApiUrl("/api/ml/oauth-config");
      if (probeUrl) {
        try {
          const pr = await fetch(probeUrl);
          const probe = await pr.json().catch(() => ({}));
          if (probe && probe.ok === false && Array.isArray(probe.errors) && probe.errors.length) {
            try {
              sessionStorage.setItem(ML_OAUTH_CONFIG_ERR_KEY, JSON.stringify(probe.errors));
            } catch {
              /* ignore */
            }
            navigate("/perfil/integracoes/mercado-livre");
            return;
          }
        } catch {
          /* segue para o connect */
        }
      }

      window.location.href = connectUrl;
    };

    iniciarOAuthML();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // --------------------------------------------------------------
  // Tela de transição
  // --------------------------------------------------------------
  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
