// ======================================================================
// PERFIL — DADOS DA EMPRESA
// Objetivo: Exibir e editar os dados cadastrais da empresa do usuário
// Obs: Somente layout (sem lógica / sem Supabase)
// ======================================================================

import "./DadosEmpresa.css";

export default function DadosEmpresa() {
  return (
    <div className="dados-empresa-container">

      {/* --------------------------------------------------
          Cabeçalho
      -------------------------------------------------- */}
      <div className="dados-empresa-header">
        <h1>Dados da Empresa</h1>
        <p>
          Essas informações serão utilizadas nos cálculos de precificação
          e integrações do Suse7.
        </p>
      </div>

      {/* --------------------------------------------------
          Card — Informações da Empresa
      -------------------------------------------------- */}
      <div className="dados-empresa-card">

        <h2>Informações da Empresa</h2>

        <div className="dados-empresa-grid">

          <div className="form-group">
            <label>Nome da Empresa</label>
            <input type="text" placeholder="Ex: Suse7 Tecnologia LTDA" />
          </div>

          <div className="form-group">
            <label>CPF / CNPJ</label>
            <input type="text" placeholder="Somente números" />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input type="email" placeholder="contato@suse7.com.br" />
          </div>

          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input type="text" placeholder="(00) 00000-0000" />
          </div>

        </div>
      </div>

      {/* --------------------------------------------------
          Card — Endereço
      -------------------------------------------------- */}
      <div className="dados-empresa-card">

        <h2>Endereço</h2>

        <div className="dados-empresa-grid">

          <div className="form-group">
            <label>CEP</label>
            <input type="text" placeholder="00000-000" />
          </div>

          <div className="form-group">
            <label>Endereço</label>
            <input type="text" placeholder="Rua, Avenida, etc." />
          </div>

          <div className="form-group">
            <label>Número</label>
            <input type="text" placeholder="Número" />
          </div>

          <div className="form-group">
            <label>Complemento</label>
            <input type="text" placeholder="Opcional" />
          </div>

          <div className="form-group">
            <label>Bairro</label>
            <input type="text" placeholder="Bairro" />
          </div>

          <div className="form-group">
            <label>Cidade / UF</label>
            <input type="text" placeholder="Cidade - UF" />
          </div>

        </div>
      </div>

      {/* --------------------------------------------------
          Card — Configurações Fiscais
      -------------------------------------------------- */}
      <div className="dados-empresa-card">

        <h2>Configurações Fiscais</h2>

        <div className="dados-empresa-grid">

          <div className="form-group">
            <label>Imposto (%)</label>
            <input type="number" placeholder="Ex: 1.00" />
          </div>

        </div>
      </div>

      {/* --------------------------------------------------
          Ações
      -------------------------------------------------- */}
      <div className="dados-empresa-actions">
        <button className="btn-primary">
          Salvar Alterações
        </button>
      </div>

    </div>
  );
}
