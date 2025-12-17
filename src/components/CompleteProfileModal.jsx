// ======================================================
// CompleteProfileModal.jsx
// Modal para completar cadastro do usuário
// ======================================================

import { supabase } from "../supabaseClient";

export default function CompleteProfileModal({
  show,
  onClose,
  profileId,
}) {
  if (!show) return null;

  async function handleSalvar() {
    const nome = document.getElementById("nome").value;
    const whatsapp = document.getElementById("whatsapp").value;
    const loja = document.getElementById("loja").value;

    await supabase
      .from("profiles")
      .update({
        nome,
        whatsapp,
        loja,
        primeiro_login: false,
      })
      .eq("id", profileId);

    onClose();
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h2>Complete seu cadastro</h2>

        <input type="text" placeholder="Nome" id="nome" />
        <input type="text" placeholder="WhatsApp" id="whatsapp" />
        <input type="text" placeholder="Nome da loja" id="loja" />

        <button onClick={handleSalvar}>Salvar</button>
      </div>
    </div>
  );
}
