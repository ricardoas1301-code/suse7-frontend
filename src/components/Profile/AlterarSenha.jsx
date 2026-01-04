// ======================================================================
// PERFIL — ALTERAR SENHA
// Objetivo: Permitir que o usuário altere sua senha com segurança
// ======================================================================

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./AlterarSenha.css";
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
// FEEDBACK MODAL (PADRÃO SUSE7)
// ------------------------------------------------------------------
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    title: "",
    message: "",
   });

  // ------------------------------------------------------------------
  // HANDLE SAVE
  // ------------------------------------------------------------------
const handleChangePassword = async () => {
  // ------------------------------
  // Validação de campos obrigatórios
  // ------------------------------
  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    setFeedback({
      type: "error",
      title: "Campos obrigatórios",
      message: "Preencha todos os campos para alterar sua senha.",
    });
    setShowFeedback(true);
    return;
  }

  if (novaSenha.length < 6) {
    setFeedback({
      type: "error",
      title: "Senha inválida",
      message: "A nova senha deve ter no mínimo 6 caracteres.",
    });
    setShowFeedback(true);
    return;
  }

  if (novaSenha !== confirmarSenha) {
    setFeedback({
      type: "error",
      title: "Senhas não conferem",
      message: "A confirmação da senha está diferente da nova senha.",
    });
    setShowFeedback(true);
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
      setFeedback({
  type: "error",
  title: "Senha incorreta",
  message: "A senha atual informada está incorreta.",
});
setShowFeedback(true);

      return;
    }

    // 🔒 Atualiza senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setLoading(false);

    if (updateError) {
      setFeedback({
  type: "error",
  title: "Erro ao atualizar",
  message: "Não foi possível atualizar sua senha. Tente novamente.",
});
setShowFeedback(true);

      return;
    }

    // Limpa formulário + sucesso
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setFeedback({
  type: "success",
  title: "Senha atualizada",
  message: "Sua senha foi alterada com sucesso.",
});
setShowFeedback(true);

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
          <div className="field-full password-field">
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

      </div>
    </div>
  );
}
