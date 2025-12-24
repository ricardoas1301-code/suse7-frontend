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
// Atualiza campos do formulário com regras de formatação
// --------------------------------------------------------------------
const handleChange = (e) => {
  const { name, value } = e.target;

  // Campos somente numéricos + formatação
  if (name === "whatsapp" || name === "telefone") {
    const onlyNumbers = value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      [name]: formatPhone(onlyNumbers),
    }));
    return;
  }

  if (name === "cpf_cnpj") {
    const onlyNumbers = value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      cpf_cnpj: formatCpfCnpj(onlyNumbers),
    }));
    return;
  }

  if (name === "cep") {
    setForm((prev) => ({
      ...prev,
      cep: value.replace(/\D/g, ""),
    }));
    return;
  }

  if (name === "imposto_percentual") {
    setForm((prev) => ({
      ...prev,
      imposto_percentual: value.replace(/[^0-9.,]/g, ""),
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
  if (!form.cpf_cnpj) newErrors.cpf_cnpj = "CPF ou CNPJ é obrigatório";
  if (!form.cep) newErrors.cep = "CEP é obrigatório";
  if (!form.numero) newErrors.numero = "Número é obrigatório";
  if (!form.imposto_percentual) newErrors.imposto_percentual = "Imposto é obrigatório";

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

  // --------------------------------------------------------------------
// Formatação de telefone / WhatsApp
// --------------------------------------------------------------------
const formatPhone = (value) => {
  const v = value.replace(/\D/g, "");

  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

// --------------------------------------------------------------------
// Formatação de CPF / CNPJ
// --------------------------------------------------------------------
const formatCpfCnpj = (value) => {
  const v = value.replace(/\D/g, "");

  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};


  return (
    <div className="profile-modal-backdrop">
      <div className="profile-modal">

        {/* ============================================================= */}
        {/* CABEÇALHO                                                     */}
        {/* ============================================================= */}
        <div className="profile-modal-header">
          <h2>Complete seu cadastro</h2>
          <p>Informações necessárias</p>
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
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} />
              {errors.whatsapp && <small>{errors.whatsapp}</small>}
            </label>

            <label>
              CPF / CNPJ *
              <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handleChange} />
              {errors.cpf_cnpj && <small>{errors.cpf_cnpj}</small>}
            </label>
          </div>

          <div className="profile-grid">
            <label>
              Telefone
              <input name="telefone" value={form.telefone} onChange={handleChange} />
            </label>

            <label>
              CEP
                <input
                name="cep"
                value={form.cep}
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
              <input name="numero" value={form.numero} onChange={handleChange} />
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
              value={form.imposto_percentual}
              onChange={handleChange}
              placeholder="Ex: 5 ou 5,5"
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
