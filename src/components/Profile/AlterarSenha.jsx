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

  // Estados para mostrar / ocultar senha
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

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

    // 🔐 Identifica usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setLoading(false);
      alert("Erro ao identificar usuário.");
      return;
    }

    // 🔁 Reautenticação obrigatória
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senhaAtual,
    });

    if (signInError) {
      setLoading(false);
      alert("Senha atual incorreta.");
      return;
    }

    // 🔒 Atualiza senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setLoading(false);

    if (updateError) {
      alert("Erro ao atualizar a senha.");
      return;
    }

    // Limpa formulário + sucesso
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
        

        <div className="form-header">
  <h2>Alterar Senha</h2>
  <span className="required-hint"> Campos obrigatórios</span>
</div>

        {/* FORMULÁRIO */}
        <div className="form-grid form-single-column">

          {/* SENHA ATUAL */}
          <div className="field-lg password-field">
            <label>Senha atual *</label>

            <div className="password-wrapper">
              <input
                type={showSenhaAtual ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />

              <span
                className="toggle-password"
                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
              >
                {showSenhaAtual ? "✖" : "✔"}
              </span>
            </div>
          </div>

          {/* NOVA SENHA */}
          <div className="field-lg password-field">
            <label>Nova senha *</label>

            <div className="password-wrapper">
              <input
                type={showNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              <span
                className="toggle-password"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
              >
                {showNovaSenha ? "✖" : "✔"}
              </span>
            </div>
           </div>

          {/* CONFIRMAR SENHA */}
          <div className="field-lg password-field">
            <label>Confirmar nova senha *</label>

            <div className="password-wrapper">
              <input
                type={showConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />

              <span
                className="toggle-password"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
              >
                {showConfirmarSenha ? "✖" : "✔"}
              </span>
            </div>
          </div>

        </div>

        {/* BOTÃO */}
        <button
          className="btn-primary"
          onClick={handleChangePassword}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </button>

        {/* POPUP SUCESSO — PADRÃO SUSE7 */}
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
