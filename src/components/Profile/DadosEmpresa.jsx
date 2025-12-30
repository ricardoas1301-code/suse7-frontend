// ======================================================================
// PERFIL — DADOS DA EMPRESA
// Objetivo: Exibir e editar os dados cadastrais da empresa
// Regras:
// - CPF/CNPJ: VISÍVEL + READ-ONLY
// - Email: VISÍVEL + READ-ONLY
// - Nome do usuário pessoal: NÃO EXIBIR
// - Logo: upload no Supabase Storage + salvar URL em photo_url
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./DadosEmpresa.css";

export default function DadosEmpresa() {
  // ------------------------------------------------------------------
  // STATES
  // ------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  // CARREGAR DADOS DO PERFIL
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
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
  // HANDLER GENÉRICO DE INPUT
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------------------------------------------------------
  // UPLOAD DA LOGO DA EMPRESA
  // ------------------------------------------------------------------
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `logos/${user.id}.${fileExt}`;

    // Upload no Supabase Storage
    const { error } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Erro ao enviar logo.");
      return;
    }

    // Gerar URL pública
    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    const logoUrl = data.publicUrl;

    // Salvar URL no perfil
    await supabase
      .from("profiles")
      .update({ photo_url: logoUrl })
      .eq("id", user.id);

    // Atualizar estado local
    setForm((prev) => ({ ...prev, photo_url: logoUrl }));
  };

  // ------------------------------------------------------------------
  // SALVAR DADOS EDITÁVEIS
  // ------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);

    const { email, cpf_cnpj, ...dadosEditaveis } = form;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update(dadosEditaveis)
      .eq("id", user.id);

    setSaving(false);
    alert("Dados atualizados com sucesso!");
  };

  // ------------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------------
  if (loading) {
    return <p>Carregando dados...</p>;
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="profile-card">
      <h2>Dados da Empresa</h2>

      {/* ================= DADOS DA EMPRESA ================= */}
      <div className="form-grid">
        <div>
          <label>Nome da Empresa *</label>
          <input
            name="nome_loja"
            value={form.nome_loja}
            onChange={handleChange}
            placeholder="Nome da empresa"
          />
        </div>

        <div>
          <label>CPF / CNPJ</label>
          <input value={form.cpf_cnpj} disabled />
        </div>

        <div>
          <label>Email</label>
          <input value={form.email} disabled />
        </div>

        <div>
          <label>Imposto (%) *</label>
          <input
            name="imposto_percentual"
            value={form.imposto_percentual}
            onChange={handleChange}
            placeholder="Ex: 1"
          />
        </div>

        <div className="full">
          <label>Site *</label>
          <input
            name="site"
            value={form.site}
            onChange={handleChange}
            placeholder="https://www.sualoja.com.br"
          />
        </div>
      </div>

      {/* ================= LOGO ================= */}
      <h4 className="profile-section-title">Identidade Visual</h4>

      <div className="form-grid">
        <div className="full">
          <label>Logo da Empresa</label>

          {form.photo_url && (
            <div className="logo-preview">
              <img src={form.photo_url} alt="Logo da empresa" />
            </div>
          )}

          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleLogoUpload}
          />

          <small>PNG ou JPG • Recomendado fundo transparente</small>
        </div>
      </div>

      {/* ================= CONTATO ================= */}
      <h4 className="profile-section-title">Contato</h4>

      <div className="form-grid">
        <div>
          <label>Responsável *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do responsável"
          />
        </div>

        <div>
          <label>WhatsApp *</label>
          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            placeholder="WhatsApp"
          />
        </div>

        <div>
          <label>Telefone *</label>
          <input
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="Telefone"
          />
        </div>
      </div>

      {/* ================= ENDEREÇO ================= */}
      <h4 className="profile-section-title">Endereço</h4>

      <div className="form-grid">
        <input name="cep" value={form.cep} onChange={handleChange} placeholder="CEP" />
        <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Endereço" />
        <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número" />
        <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento" />
        <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" />
        <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" />
        <input name="estado" value={form.estado} onChange={handleChange} placeholder="UF" />
      </div>

      {/* ================= AÇÕES ================= */}
      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Salvando..." : "Salvar Alterações"}
      </button>
    </div>
  );
}
