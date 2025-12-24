// ======================================================================
//  COMPLETE PROFILE MODAL — SUSE7
//  Modal de onboarding exibido quando primeiro_login = true
// ======================================================================

import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./CompleteProfileModal.css";

export default function CompleteProfileModal({ show, profileId, onClose }) {

  // --------------------------------------------------------------------
  // State do formulário (campos da tabela profiles)
  // --------------------------------------------------------------------
  const [form, setForm] = useState({
    nome: "",
    nome_loja: "",
    whatsapp: "",
    cpf_cnpj: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    imposto_percentual: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------------------------
  // Atualiza campos do formulário
  // --------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Campos que aceitam somente números
    const onlyNumbers = [
      "whatsapp",
      "telefone",
      "cpf_cnpj",
      "cep",
    ];

    if (onlyNumbers.includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, ""),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --------------------------------------------------------------------
  // Validação simples de CPF / CNPJ (frontend)
  // --------------------------------------------------------------------
  const isValidCpfCnpj = (value) => {
    return value.length === 11 || value.length === 14;
  };

  // --------------------------------------------------------------------
  // Busca endereço pelo CEP (ViaCEP)
  // --------------------------------------------------------------------
  const handleCepBlur = async () => {
    if (form.cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${form.cep}/json/`);
      const data = await res.json();

      if (data.erro) return;

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    }
  };

  // --------------------------------------------------------------------
  // Validação dos campos obrigatórios
  // --------------------------------------------------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!form.nome) newErrors.nome = "Nome é obrigatório";
    if (!form.nome_loja) newErrors.nome_loja = "Nome da loja é obrigatório";
    if (!form.whatsapp) newErrors.whatsapp = "WhatsApp é obrigatório";
    if (!form.cpf_cnpj) newErrors.cpf_cnpj = "CPF/CNPJ é obrigatório";

    if (form.whatsapp && form.whatsapp.length < 10) {
      newErrors.whatsapp = "WhatsApp inválido";
    }

    if (form.cpf_cnpj && !isValidCpfCnpj(form.cpf_cnpj)) {
      newErrors.cpf_cnpj = "CPF ou CNPJ inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------------------------
  // Salvar dados no Supabase
  // --------------------------------------------------------------------
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          primeiro_login: false,
          last_login: new Date(),
        })
        .eq("id", profileId);

      if (error) throw error;

      onClose();

    } catch (err) {
      console.error("Erro ao salvar perfil:", err.message);
      alert("Erro ao salvar cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------
  // Não renderiza se não for para mostrar
  // --------------------------------------------------------------------
  if (!show) return null;

  return (
    <div className="profile-modal-backdrop">
      <div className="profile-modal">

        {/* ============================================================= */}
        {/* CABEÇALHO                                                     */}
        {/* ============================================================= */}
        <div className="profile-modal-header">
          <h2>Complete seu cadastro</h2>
          <p>Precisamos dessas informações para liberar o uso do Suse7</p>
        </div>

        {/* ============================================================= */}
        {/* FORMULÁRIO                                                    */}
        {/* ============================================================= */}
        <form className="profile-modal-form">

          <div className="profile-grid">
            <label>
              Nome *
              <input name="nome" onChange={handleChange} />
              {errors.nome && <small>{errors.nome}</small>}
            </label>

            <label>
              Nome da loja *
              <input name="nome_loja" onChange={handleChange} />
              {errors.nome_loja && <small>{errors.nome_loja}</small>}
            </label>
          </div>

          <div className="profile-grid">
            <label>
              WhatsApp *
              <input name="whatsapp" onChange={handleChange} />
              {errors.whatsapp && <small>{errors.whatsapp}</small>}
            </label>

            <label>
              CPF / CNPJ *
              <input name="cpf_cnpj" onChange={handleChange} />
              {errors.cpf_cnpj && <small>{errors.cpf_cnpj}</small>}
            </label>
          </div>

          <div className="profile-grid">
            <label>
              Telefone
              <input name="telefone" onChange={handleChange} />
            </label>

            <label>
              CEP
              <input
                name="cep"
                onChange={handleChange}
                onBlur={handleCepBlur}
              />
            </label>
          </div>

          <div className="profile-grid">
            <label>
              Endereço
              <input name="endereco" value={form.endereco} readOnly />
            </label>

            <label>
              Número
              <input name="numero" onChange={handleChange} />
            </label>
          </div>

          <div className="profile-grid-3">
            <label>
              Complemento
              <input name="complemento" onChange={handleChange} />
            </label>

            <label>
              Bairro
              <input name="bairro" value={form.bairro} readOnly />
            </label>

            <label>
              Estado
              <input name="estado" value={form.estado} readOnly />
            </label>
          </div>

          <div className="profile-grid">
            <label>
              Cidade
              <input name="cidade" value={form.cidade} readOnly />
            </label>

            <label>
              Imposto (%)
              <input
                name="imposto_percentual"
                type="number"
                step="0.01"
                onChange={handleChange}
              />
            </label>
          </div>

          {/* ============================================================= */}
          {/* BOTÃO SALVAR                                                 */}
          {/* ============================================================= */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>

        </form>

      </div>
    </div>
  );
}
