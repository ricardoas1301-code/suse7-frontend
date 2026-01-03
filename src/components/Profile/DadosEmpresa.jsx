// ======================================================================
// PERFIL — DADOS DA EMPRESA
// Objetivo: Exibir e editar os dados cadastrais da empresa
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./DadosEmpresa.css";
import "../Avatar/Avatar.css";
import FeedbackModal from "../FeedbackModal/FeedbackModal";


export default function DadosEmpresa() {
  // ------------------------------------------------------------------
  // STATES
  // ------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    email: "",
    cpf_cnpj: "",
    nome: "",
    nome_loja: "",
    site: "",
    whatsapp: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    imposto_percentual: "",
    photo_url: "",
  });

  // ------------------------------------------------------------------
  // LOAD PROFILE
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("(*)")
        .eq("id", user.id)
        .single();

      if (data) {
        setForm({
          email: data.email || user.email || "",
          cpf_cnpj: data.cpf_cnpj || "",
          nome: data.nome || "",
          nome_loja: data.nome_loja || "",
          site: data.site || "",
          whatsapp: data.whatsapp || "",
          telefone: data.telefone || "",
          cep: data.cep || "",
          endereco: data.endereco || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          imposto_percentual: data.imposto_percentual || "",
          photo_url: data.photo_url || "",
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

// ------------------------------------------------------------------
// WHATSAPP — (99) 99999-9999
// ------------------------------------------------------------------
const handleWhatsappChange = (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);

  if (value.length >= 11) {
    value = value.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  } else if (value.length >= 7) {
    value = value.replace(
      /^(\d{2})(\d{4,5})(\d{0,4})$/,
      "($1) $2-$3"
    );
  } else if (value.length >= 3) {
    value = value.replace(/^(\d{2})(\d+)/, "($1) $2");
  }

  setForm((prev) => ({ ...prev, whatsapp: value }));
};

// ------------------------------------------------------------------
// TELEFONE — aceita 10 ou 11 dígitos
// (99) 9999-9999 | (99) 99999-9999
// ------------------------------------------------------------------
const handleTelefoneChange = (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);

  if (value.length === 11) {
    // Celular
    value = value.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  } else if (value.length === 10) {
    // Fixo
    value = value.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  } else if (value.length >= 3) {
    value = value.replace(/^(\d{2})(\d+)/, "($1) $2");
  }

  setForm((prev) => ({ ...prev, telefone: value }));
};


  // ------------------------------------------------------------------
  // GENERIC HANDLER
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

// ------------------------------------------------------------------
// IMPOSTO (%) — aceita: 6 | 6,33 | 19,28
// ------------------------------------------------------------------
const handleImpostoChange = (e) => {
  let value = e.target.value;

  // Remove tudo que não for número ou vírgula
  value = value.replace(/[^0-9,]/g, "");

  // Impede mais de uma vírgula
  if ((value.match(/,/g) || []).length > 1) {
    return;
  }

  // Limita casas decimais em 2
  if (value.includes(",")) {
    const [int, dec] = value.split(",");
    value = `${int.slice(0, 2)},${dec.slice(0, 2)}`;
  } else {
    value = value.slice(0, 2);
  }

  setForm((prev) => ({ ...prev, imposto_percentual: value }));
};


  // ------------------------------------------------------------------
  // CEP MASK + VIA CEP
  // ------------------------------------------------------------------
  const handleCepChange = async (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 8);

    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
    }

    setForm((prev) => ({ ...prev, cep: value }));

    if (value.length === 9) {
      const cepClean = value.replace("-", "");

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await res.json();

        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            endereco: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  // ------------------------------------------------------------------
  // LOGO UPLOAD
  // ------------------------------------------------------------------
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, photo_url: previewUrl }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `logos/${user.id}.${ext}`;

    await supabase.storage.from("profiles").upload(path, file, { upsert: true });

    const { data } = supabase.storage.from("profiles").getPublicUrl(path);
    const logoUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ photo_url: logoUrl }).eq("id", user.id);

    setForm((prev) => ({ ...prev, photo_url: logoUrl }));
    window.dispatchEvent(new Event("logoUpdated"));
  };

  // ------------------------------------------------------------------
  // SAVE
  // ------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);

    const { email, cpf_cnpj, ...dadosEditaveis } = form;
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("profiles").update(dadosEditaveis).eq("id", user.id);

    setSaving(false);
    setShowSuccess(true);
  };

  if (loading) return <p>Carregando dados...</p>;

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="dados-empresa-container">
      <div className="profile-card">

        <div className="form-header">
          <h2>Perfil da Empresa</h2>
          <span className="required-hint"> Campos obrigatórios</span>
        </div>

        {/* LOGO */}
        <div className="form-grid">
          <div className="field-full logo-field">
            <label>Logo da Empresa</label>

<div className="logo-preview">
  <div className="suse7-avatar logo-lg">
    {form.photo_url ? (
      <img src={form.photo_url} alt="Logo da empresa" />
    ) : (
      <span className="avatar-placeholder">
        {form.nome_loja?.charAt(0)?.toUpperCase() || "?"}
      </span>
    )}
  </div>
</div>

            <label className="logo-upload-btn">
              <span className="alterar-imagem">Alterar imagem</span>
              <input type="file" accept="image/png, image/jpeg" onChange={handleLogoUpload} hidden />
            </label>
          </div>
        </div>

        {/* DADOS */}
<div className="form-grid">
  <div className="field-lg">
    <label>Nome da Empresa *</label>
    <input
      name="nome_loja"
      value={form.nome_loja}
      onChange={handleChange}
    />
  </div>

  <div className="field-md">
    <label>CPF / CNPJ</label>
    <div className="readonly-field">
      <input value={form.cpf_cnpj} disabled />
      <span className="readonly-icon"></span>
    </div>
  </div>

  <div className="field-lg">
    <label>Email</label>
    <div className="readonly-field">
      <input value={form.email} disabled />
      <span className="readonly-icon"></span>
    </div>
  </div>

  <div className="field-full site-field">
    <label>Site</label>
    <input
      name="site"
      value={form.site}
      onChange={handleChange}
    />
  </div>
</div>

{/* IMPOSTO — LINHA SEPARADA */}
<div className="form-grid">
  <div className="field-sm">
    <label>Imposto (%) *</label>
    <input
      name="imposto_percentual"
      value={form.imposto_percentual}
      onChange={handleImpostoChange}
      placeholder="6,33"
    />
  </div>
</div>


        {/* CONTATO */}
        <h4 className="profile-section-title">Contato</h4>
        <div className="form-grid">
          <div className="field-lg">
            <label>Responsável *</label>
            <input name="nome" value={form.nome} onChange={handleChange} />
          </div>

          <div className="field-md">
            <label>WhatsApp *</label>
            <input
  name="whatsapp"
  value={form.whatsapp}
  onChange={handleWhatsappChange}
  placeholder="(17) 99933-2833"
/>
          </div>

          <div className="field-md">
            <label>Telefone *</label>
            <input
  name="telefone"
  value={form.telefone}
  onChange={handleTelefoneChange}
  placeholder="(17) 93399-3328"
/>

          </div>
        </div>

        {/* ENDEREÇO */}
        <h4 className="profile-section-title">Endereço</h4>
        <div className="form-grid">
          <div className="field-sm">
            <label>CEP *</label>
            <input value={form.cep} onChange={handleCepChange} />
          </div>

          <div className="field-sm">
            <label>UF</label>
            <input value={form.estado} disabled />
          </div>

          <div className="field-md">
            <label>Cidade</label>
            <input value={form.cidade} disabled />
          </div>

          <div className="field-lg">
            <label>Endereço</label>
            <input name="endereco" value={form.endereco} onChange={handleChange} />
          </div>

          <div className="field-sm">
            <label>Número</label>
            <input name="numero" value={form.numero} onChange={handleChange} />
          </div>

          <div className="field-md">
            <label>Complemento</label>
            <input name="complemento" value={form.complemento} onChange={handleChange} />
          </div>

          <div className="field-md">
            <label>Bairro</label>
            <input value={form.bairro} disabled />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      {/* POPUP SUCESSO — PADRÃO SUSE7 */}
{showSuccess && (
  <FeedbackModal
    title="Dados atualizados!"
    message="As informações da empresa foram salvas com sucesso."
    onClose={() => setShowSuccess(false)}
  />
)}
</div>
</div>
);
}
