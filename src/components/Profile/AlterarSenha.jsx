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
  // STATES — FORM
  // ------------------------------------------------------------------
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------------
  // STATES — VISIBILIDADE DAS SENHAS
  // ------------------------------------------------------------------
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // ------------------------------------------------------------------
  // STATES — FEEDBACK MODAL (PADRÃO SUSE7)
  // ------------------------------------------------------------------
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",     // "success" | "error" | "warning" (depende do seu modal)
    title: "",
    message: "",
  });

  // ------------------------------------------------------------------
  // HELPERS — ABRIR / FECHAR MODAL
  // ------------------------------------------------------------------
  const openFeedback = ({ type, title, message }) => {
    setFeedback({ type, title, message });
    setShowFeedback(true);
  };

  const closeFeedback = () => {
    setShowFeedback(false);

    // Limpa o conteúdo para evitar comportamento estranho do modal ao montar
    setFeedback({
      type: "",
      title: "",
      message: "",
    });
  };

  // ------------------------------------------------------------------
  // HANDLE SAVE
  // ------------------------------------------------------------------
  const handleChangePassword = async () => {
    try {
      // ------------------------------------------------------------
      // Validações (Front-end UX)
      // ------------------------------------------------------------
      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        openFeedback({
          type: "error",
          title: "Campos obrigatórios",
          message: "Preencha todos os campos para alterar sua senha.",
        });
        return;
      }

      if (novaSenha.length < 6) {
        openFeedback({
          type: "error",
          title: "Senha inválida",
          message: "A nova senha deve ter no mínimo 6 caracteres.",
        });
        return;
      }

      if (novaSenha !== confirmarSenha) {
        openFeedback({
          type: "error",
          title: "Senhas não conferem",
          message: "A confirmação da senha está diferente da nova senha.",
        });
        return;
      }

      setLoading(true);

      // ------------------------------------------------------------
      // Identifica usuário logado
      // ------------------------------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        openFeedback({
          type: "error",
          title: "Erro de sessão",
          message: "Não foi possível identificar seu usuário. Faça login novamente.",
        });
        return;
      }

      // ------------------------------------------------------------
      // Reautenticação obrigatória (senha atual)
      // ------------------------------------------------------------
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });

      if (signInError) {
        openFeedback({
          type: "error",
          title: "Senha incorreta",
          message: "A senha atual informada está incorreta.",
        });
        return;
      }

      // ------------------------------------------------------------
      // Atualiza senha
      // ------------------------------------------------------------
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        openFeedback({
          type: "error",
          title: "Erro ao atualizar",
          message: "Não foi possível atualizar sua senha. Tente novamente.",
        });
        return;
      }

      // ------------------------------------------------------------
      // Sucesso: limpa formulário + feedback
      // ------------------------------------------------------------
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      openFeedback({
        type: "success",
        title: "Senha atualizada",
        message: "Sua senha foi alterada com sucesso.",
      });
    } catch (err) {
      // ------------------------------------------------------------
      // Fallback de erro inesperado
      // ------------------------------------------------------------
      openFeedback({
        type: "error",
        title: "Erro inesperado",
        message: "Ocorreu um erro ao alterar sua senha. Tente novamente.",
      });
    } finally {
      // ------------------------------------------------------------
      // Garante que o loading sempre finalize
      // ------------------------------------------------------------
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="dados-empresa-container alterar-senha-page">
      <div className="profile-card">
        <div className="form-header">
          <h2>Alterar Senha</h2>
          <span className="required-hint">* Campos obrigatórios</span>
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
                title={showSenhaAtual ? "Ocultar senha" : "Mostrar senha"}
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
                title={showNovaSenha ? "Ocultar senha" : "Mostrar senha"}
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
                title={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmarSenha ? "✖" : "✔"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTÃO */}
        <button className="btn-primary" onClick={handleChangePassword} disabled={loading}>
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </button>

        {/* FEEDBACK MODAL — renderiza SOMENTE quando necessário */}
        {showFeedback && (
          <FeedbackModal
            show={showFeedback}
            onClose={closeFeedback}
            type={feedback.type}
            title={feedback.title}
            message={feedback.message}
          />
        )}
      </div>
    </div>
  );
}
