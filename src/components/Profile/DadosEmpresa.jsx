// ======================================================================
// PERFIL — DADOS DA EMPRESA
// Objetivo: Exibir e editar dados cadastrais da empresa do usuário
// Regras:
// - CPF/CNPJ: VISÍVEL + READ-ONLY
// - Email: VISÍVEL + READ-ONLY
// - Nome do usuário: NÃO EXIBIR
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
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // ------------------------------------------------------------------
  // HANDLER INPUTS
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------------------------------------------------------
  // SALVAR DADOS
  // ------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);

    const {
      email,
      cpf_cnpj,
      ...dadosEditaveis
    } = form; // remove campos read-only

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

      {/* ================= IDENTIFICAÇÃO ================= */}
      <h4 className="profile-section-title">Identificação</h4>

      <div className="form-grid">
        <div>
          <label>Email</label>
          <input value={form.email} disabled />
        </div>

        <div>
          <label>CPF / CNPJ</label>
          <input value={form.cpf_cnpj} disabled />
        </div>

        <div>
          <label>Responsável</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do responsável"
          />
        </div>

        <div>
          <label>Nome da Loja</label>
          <input
            name="nome_loja"
            value={form.nome_loja}
            onChange={handleChange}
            placeholder="Nome da loja"
          />
        </div>
      </div>

      {/* ================= CONTATO ================= */}
      <h4 className="profile-section-title">Contato</h4>

      <div className="form-grid">
        <input
          name="whatsapp"
          value={form.whatsapp}
          onChange={handleChange}
          placeholder="WhatsApp"
        />
        <input
          name="telefone"
          value={form.telefone}
          onChange={handleChange}
          placeholder="Telefone"
        />
      </div>

      {/* ================= ENDEREÇO ================= */}
      <h4 className="profile-section-title">Endereço</h4>

      <div className="form-grid">
        <input name="cep" value={form.cep} onChange={handleChange} placeholder="CEP" />
        <input
          name="endereco"
          value={form.endereco}
          onChange={handleChange}
          placeholder="Endereço"
        />
        <input
          name="numero"
          value={form.numero}
          onChange={handleChange}
          placeholder="Número"
        />
        <input
          name="complemento"
          value={form.complemento}
          onChange={handleChange}
          placeholder="Complemento"
        />
        <input
          name="bairro"
          value={form.bairro}
          onChange={handleChange}
          placeholder="Bairro"
        />
        <input
          name="cidade"
          value={form.cidade}
          onChange={handleChange}
          placeholder="Cidade"
        />
        <input
          name="estado"
          value={form.estado}
          onChange={handleChange}
          placeholder="Estado"
        />
      </div>

      {/* ================= FISCAL ================= */}
      <h4 className="profile-section-title">Configuração Fiscal</h4>

      <div className="form-grid">
        <input
          name="imposto_percentual"
          value={form.imposto_percentual}
          onChange={handleChange}
          placeholder="Imposto (%)"
        />
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
