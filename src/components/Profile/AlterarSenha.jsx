// ======================================================================
// PERFIL — ALTERAR SENHA
// Objetivo: Permitir que o usuário altere sua senha com segurança
// ======================================================================

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import FeedbackModal from "../FeedbackModal/FeedbackModal";

export default function AlterarSenha() {
  // ------------------------------------------------------------------
  // STATES
  // ------------------------------------------------------------------
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ------------------------------------------------------------------
  // HANDLE SAVE
  // ------------------------------------------------------------------
  const handleChangePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("As senhas não conferem.");
      return;
    }

    setLoading(true);

    // 🔐 Reautentica o usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setLoading(false);
      alert("Erro ao identificar usuário.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senhaAtual,
    });

    if (signInError) {
      setLoading(false);
      alert("Senha atual incorreta.");
      return;
    }

    // 🔁 Atualiza senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setLoading(false);

    if (updateError) {
      alert("Erro ao atualizar a senha.");
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setShowSuccess(true);
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="dados-empresa-container">
      <div className="profile-card">

        <h2>Alterar Senha</h2>

        <div className="form-grid">
          <div className="field-lg">
            <label>Senha atual *</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </div>

          <div className="field-lg">
            <label>Nova senha *</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>

          <div className="field-lg">
            <label>Confirmar nova senha *</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleChangePassword}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </button>

        {/* POPUP SUCESSO */}
        {showSuccess && (
          <FeedbackModal
            title="Senha atualizada!"
            message="Sua senha foi alterada com sucesso."
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}
