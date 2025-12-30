// ======================================================================
//  COMPLETE PROFILE MODAL — SUSE7
//  Modal de onboarding exibido quando primeiro_login = true
// ======================================================================

import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./CompleteProfileModal.css";
import suse7Logo from "../assets/suse7-logo-redonda.png";

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
  const onlyNumbers = value.replace(/\D/g, "").slice(0, 8); // 👈 LIMITE AQUI

  setForm((prev) => ({
    ...prev,
    cep: onlyNumbers.replace(/(\d{5})(\d)/, "$1-$2"), // 👈 MÁSCARA
  }));
  return;
}


// --------------------------------------------------------------------
// Formatação do campo Imposto (%)
// Aceita de 0 até 99,99
// Formato BR: xx,xx
// Exemplos válidos: 5 | 18 | 18,5 | 18,50
// --------------------------------------------------------------------
if (name === "imposto_percentual") {
  let v = value.replace(/[^0-9,]/g, "");

  // Permite apenas uma vírgula
  if ((v.match(/,/g) || []).length > 1) return;

  // Se tiver vírgula, valida partes
  if (v.includes(",")) {
    const [inteiro, decimal] = v.split(",");

    // Máx. 2 dígitos antes da vírgula
    if (inteiro.length > 2) return;

    // Máx. 2 casas decimais
    if (decimal.length > 2) return;
  } else {
    // Sem vírgula → limita a 2 dígitos
    if (v.length > 2) return;
  }

  setForm((prev) => ({
    ...prev,
    imposto_percentual: v,
  }));
  return;
}


  setForm((prev) => ({ ...prev, [name]: value }));
};

  // --------------------------------------------------------------------
  // Validação simples de CPF / CNPJ (frontend)
  // --------------------------------------------------------------------
// --------------------------------------------------------------------
// Validação real de CPF
// --------------------------------------------------------------------
const isValidCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false; // todos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }

  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;

  return check2 === parseInt(cpf.charAt(10));
};

// --------------------------------------------------------------------
// Validação real de CNPJ
// --------------------------------------------------------------------
const isValidCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calcCheckDigit = (base, factors) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i++) {
      sum += base[i] * factors[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const numbers = cnpj.split("").map(Number);

  const digit1 = calcCheckDigit(numbers.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
  if (digit1 !== numbers[12]) return false;

  const digit2 = calcCheckDigit(numbers.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return digit2 === numbers[13];
};


// --------------------------------------------------------------------
// Validação unificada CPF / CNPJ
// --------------------------------------------------------------------
const isValidCpfCnpj = (value) => {
  const clean = value.replace(/\D/g, "");

  if (clean.length === 11) return isValidCPF(clean);
  if (clean.length === 14) return isValidCNPJ(clean);

  return false;
};


// --------------------------------------------------------------------
// Busca endereço pelo CEP (ViaCEP)
// --------------------------------------------------------------------
const handleCepBlur = async () => {
  const cepLimpo = form.cep.replace(/\D/g, ""); // 👈 remove o hífen

  if (cepLimpo.length !== 8) return;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
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
  
  if (!form.cpf_cnpj) {
  newErrors.cpf_cnpj = "CPF ou CNPJ é obrigatório";
  } else if (!isValidCpfCnpj(form.cpf_cnpj)) {
  newErrors.cpf_cnpj = "CPF ou CNPJ inválido";
  }

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

        // --------------------------------------------------------
        // Converte imposto para número (ex: "18,50" → 18.5)
        // --------------------------------------------------------
        const impostoNumerico = form.imposto_percentual
        ? parseFloat(form.imposto_percentual.replace(",", "."))
        : 0;

      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          imposto_percentual: impostoNumerico, // 👈 AQUI
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
// Formatação de telefone / WhatsApp (limite 11 números)
// --------------------------------------------------------------------
const formatPhone = (value) => {
  const v = value.replace(/\D/g, "").slice(0, 11); // 👈 LIMITE AQUI

  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

// --------------------------------------------------------------------
// Formatação de CPF / CNPJ (limite 14 números)
// --------------------------------------------------------------------
const formatCpfCnpj = (value) => {
  const v = value.replace(/\D/g, "").slice(0, 14); // 👈 LIMITE AQUI

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
        {/* CABEÇALHO COM LOGO                                            */}
        {/* ============================================================= */}
        <div className="profile-modal-header">

        {/* ============================================================= */}
        {/* LOGO SUSE7                                                    */}
        {/* ============================================================= */}
          <img
            src={suse7Logo}
            alt="Suse7"
            className="profile-modal-logo"
          />

          <h2>Complete seu cadastro</h2>
          <p>* Informações necessárias</p>
        </div>

        {/* ============================================================= */}
        {/* FORMULÁRIO                                                    */}
        {/* ============================================================= */}
        <form className="profile-modal-form">

          <div className="profile-grid">
            <label>
              Nome *
             <input name="nome" onChange={handleChange} />
              { errors.nome && (
             <small className="error-text">{errors.nome}</small>
            )}

            </label>

            <label>
              Nome da Empresa *
              <input name="nome_loja" onChange={handleChange} />
               {errors.nome_loja && (
              <small className="error-text">{errors.nome_loja}</small>
            )}

            </label>
          </div>

          <div className="profile-grid">
            <label>
              WhatsApp *
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} />
                {errors.whatsapp && (
              <small className="error-text">{errors.whatsapp}</small>
            )}

            </label>

            <label>
              CPF / CNPJ *
              <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handleChange} />
                 {errors.cpf_cnpj && (
              <small className="error-text">{errors.cpf_cnpj}</small>
            )}

            </label>
          </div>

          <div className="profile-grid">
            <label>
              Telefone
              <input name="telefone" value={form.telefone} onChange={handleChange} />
            </label>

            <label>
              CEP *
                <input
                name="cep"
                value={form.cep}
                onChange={handleChange}
                onBlur={handleCepBlur}
              />
              {errors.cep && <small className="error-text">{errors.cep}</small>}
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
              Imposto (%) *
              <input
              name="imposto_percentual"
              value={form.imposto_percentual}
              onChange={handleChange}
              placeholder="Ex: 6 ou 13,28"
            />
            {errors.imposto_percentual && (
            <small className="error-text">{errors.imposto_percentual}</small>
              )}
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
