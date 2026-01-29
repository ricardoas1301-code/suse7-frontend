// ======================================================================
// COMPONENTE: ProductModal
// Objetivo:
// - Cadastro / edição de produto
// - Modal (popup) com abas
// - Nome do produto fixo (fora das abas)
// - UI preparada para integração com Supabase e marketplaces
// - NOVO: Aba Variações (SKU + EAN por variação)
// - NOVO: Aba Anúncios (placeholder UI)
// - NOVO: Aba Vendas & desempenho (placeholder UI)
// ======================================================================

import { useState } from "react";
import "./ProductModal.css";

// ======================================================================
// HELPER: ID seguro (fora do componente)
// Objetivo: evitar Date.now/Math.random dentro do render (lint react-hooks/purity)
// ======================================================================
const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};


export default function ProductModal({ open, onClose }) {
  // ------------------------------------------------------
  // CONTROLE DE ABAS
  // ------------------------------------------------------
  const [activeTab, setActiveTab] = useState("basic");


  // ------------------------------------------------------
  // STATE DO PRODUTO (UI only por enquanto)
  // ------------------------------------------------------
  const [product, setProduct] = useState({
    product_name: "",
    sku: "",
    gtin: "",
    ncm: "",
    brand: "",
    model: "",
    description: "",
    stock_quantity: 0,
    stock_source: "manual",
    cost_price: "",
    fixed_costs: "",
    photos: [],

    // ======================================================
    // PESOS & MEDIDAS — ENVIO
    // ======================================================
    shipping_width: "",
    shipping_height: "",
    shipping_depth: "",
    shipping_weight: "",

    // ======================================================
    // PESOS & MEDIDAS — PRODUTO MONTADO
    // ======================================================
    mounted_width: "",
    mounted_height: "",
    mounted_depth: "",
    mounted_weight: "",
  });

  // ------------------------------------------------------
  // STATE: VARIAÇÕES (UI only)
  // Regras:
  // - Cada variação tem seu SKU e seu EAN próprio
  // - Mantemos simples por enquanto: atributo + valor
  // ------------------------------------------------------
  const [variations, setVariations] = useState([
    {
      id: createId(),
      variation_name: "Variação 1",
      attribute: "Cor",
      value: "Preto",
      sku: "",
      ean: "", // ✅ NOVO: EAN por variação
      stock: "",
      price: "",
      active: true,
    },
  ]);

  // ------------------------------------------------------
  // HANDLER GENÉRICO PARA INPUTS
  // ------------------------------------------------------
  const handleChange = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ------------------------------------------------------
  // VARIAÇÕES: CRUD UI
  // ------------------------------------------------------
  const handleAddVariation = () => {
    setVariations((prev) => [
      ...prev,
      {
        id: createId(),
        variation_name: `Variação ${prev.length + 1}`,
        attribute: "",
        value: "",
        sku: "",
        ean: "", // ✅ NOVO
        stock: "",
        price: "",
        active: true,
      },
    ]);
  };

  const handleRemoveVariation = (id) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
  };

  const handleVariationChange = (id, field, value) => {
    setVariations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // ------------------------------------------------------
  // COPIAR DESCRIÇÃO (UX)
  // ------------------------------------------------------
  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(product.description || "");
      // futuramente podemos colocar toast "Copiado!"
      console.log("✅ Descrição copiada");
    } catch (err) {
      console.error("❌ Falha ao copiar descrição:", err);
    }
  };

  // ------------------------------------------------------
  // SUBMIT (placeholder — backend depois)
  // ------------------------------------------------------
  const handleSubmit = () => {
    console.log("Produto a salvar:", product);
    console.log("Variações a salvar:", variations);
    // aqui entra Supabase depois
  };

  // ------------------------------------------------------
  // NÃO RENDERIZA SE MODAL FECHADO
  // ------------------------------------------------------
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* ==================================================
           HEADER
        ================================================== */}
        <div className="modal-header">
          <h2>Novo produto</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ==================================================
           NOME DO PRODUTO — FIXO
        ================================================== */}
        <div className="product-name-fixed">
          <label>Nome do produto</label>
          <input
            type="text"
            placeholder="Ex: Armário de cozinha 3 portas"
            value={product.product_name}
            onChange={(e) => handleChange("product_name", e.target.value)}
          />
        </div>

        {/* ==================================================
           ABAS
           NOVO:
           - Variações
           - Anúncios
           - Vendas & desempenho
        ================================================== */}
        <div className="tabs">
          <button
            className={activeTab === "basic" ? "active" : ""}
            onClick={() => setActiveTab("basic")}
            type="button"
          >
            Dados básicos
          </button>

          <button
            className={activeTab === "description" ? "active" : ""}
            onClick={() => setActiveTab("description")}
            type="button"
          >
            Descrição
          </button>

          <button
            className={activeTab === "stock" ? "active" : ""}
            onClick={() => setActiveTab("stock")}
            type="button"
          >
            Estoque & logística
          </button>

          <button
            className={activeTab === "pricing" ? "active" : ""}
            onClick={() => setActiveTab("pricing")}
            type="button"
          >
            Custos & precificação
          </button>

          <button
            className={activeTab === "photos" ? "active" : ""}
            onClick={() => setActiveTab("photos")}
            type="button"
          >
            Fotos
          </button>

          <button
            className={activeTab === "measures" ? "active" : ""}
            onClick={() => setActiveTab("measures")}
            type="button"
          >
            Pesos & medidas
          </button>

          {/* --------------------------------------------------
             NOVA ABA: VARIAÇÕES
          -------------------------------------------------- */}
          <button
            className={activeTab === "variations" ? "active" : ""}
            onClick={() => setActiveTab("variations")}
            type="button"
          >
            Variações
          </button>

          {/* --------------------------------------------------
             NOVA ABA: ANÚNCIOS
          -------------------------------------------------- */}
          <button
            className={activeTab === "ads" ? "active" : ""}
            onClick={() => setActiveTab("ads")}
            type="button"
          >
            Anúncios
          </button>

          {/* --------------------------------------------------
             NOVA ABA: VENDAS & DESEMPENHO
          -------------------------------------------------- */}
          <button
            className={activeTab === "performance" ? "active" : ""}
            onClick={() => setActiveTab("performance")}
            type="button"
          >
            Vendas & desempenho
          </button>
        </div>

        {/* ==================================================
           CONTEÚDO DAS ABAS
        ================================================== */}
        <div className="modal-body">
          {/* =======================
              DADOS BÁSICOS
              (sem descrição agora)
          ======================= */}
          {activeTab === "basic" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    placeholder="SKU interno"
                    value={product.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>EAN / GTIN</label>
                  <input
                    placeholder="Código de barras"
                    value={product.gtin}
                    onChange={(e) => handleChange("gtin", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>NCM</label>
                  <input
                    placeholder="Ex: 94036000"
                    value={product.ncm}
                    onChange={(e) => handleChange("ncm", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    value={product.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    value={product.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =======================
              DESCRIÇÃO (ABA EXCLUSIVA)
          ======================= */}
          {activeTab === "description" && (
            <>
              <div className="form-group">
                <label>Descrição do produto</label>

                <div className="description-wrapper">
                  <textarea
                    rows="8"
                    placeholder="Descrição base do produto. Esta descrição poderá ser usada em todos os anúncios."
                    value={product.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />

                  {/* ÍCONE COPIAR */}
                  <button
                    type="button"
                    className="copy-description"
                    title="Copiar descrição"
                    onClick={handleCopyDescription}
                  >
                    📋
                  </button>
                </div>

                <button className="btn-ai" type="button">
                  🤖 Gerar descrição com IA
                </button>
              </div>
            </>
          )}

          {/* =======================
              ESTOQUE & LOGÍSTICA
          ======================= */}
          {activeTab === "stock" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={product.stock_quantity}
                    onChange={(e) =>
                      handleChange("stock_quantity", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Origem do estoque</label>
                  <select
                    value={product.stock_source}
                    onChange={(e) => handleChange("stock_source", e.target.value)}
                  >
                    <option value="manual">Manual</option>
                    <option value="virtual">Virtual (avançado)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* =======================
              CUSTOS & PRECIFICAÇÃO
          ======================= */}
          {activeTab === "pricing" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Custo do produto</label>
                  <input
                    type="number"
                    value={product.cost_price}
                    onChange={(e) => handleChange("cost_price", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Custos fixos</label>
                  <input
                    type="number"
                    value={product.fixed_costs}
                    onChange={(e) => handleChange("fixed_costs", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =======================
              FOTOS
          ======================= */}
          {activeTab === "photos" && (
            <>
              <p className="hint">
                Adicione até <strong>7 fotos</strong>. Elas poderão ser usadas
                para atualizar anúncios em todos os canais.
              </p>

              <div className="photo-uploader">
                <button className="btn-secondary" type="button">
                  Adicionar fotos
                </button>
              </div>
            </>
          )}

          {/* =======================
              PESOS & MEDIDAS
          ======================= */}
          {activeTab === "measures" && (
            <>
              {/* ==================================================
                 GRUPO 1 — MEDIDAS DE ENVIO
              ================================================== */}
              <div className="section">
                <div className="section-header">
                  <h3>Medidas de envio</h3>
                  <p className="section-subtitle">
                    Medidas usadas para cálculo de frete e logística.
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Largura (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 30"
                      value={product.shipping_width}
                      onChange={(e) => handleChange("shipping_width", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 15"
                      value={product.shipping_height}
                      onChange={(e) => handleChange("shipping_height", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Profundidade (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 45"
                      value={product.shipping_depth}
                      onChange={(e) => handleChange("shipping_depth", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="Ex: 2.350"
                      value={product.shipping_weight}
                      onChange={(e) => handleChange("shipping_weight", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================
                 GRUPO 2 — MEDIDAS DO PRODUTO (MONTADO)
              ================================================== */}
              <div className="section">
                <div className="section-header">
                  <h3>Medidas do produto (montado)</h3>
                  <p className="section-subtitle">
                    Medidas reais do produto pronto/montado (referência interna).
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Largura (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 32"
                      value={product.mounted_width}
                      onChange={(e) => handleChange("mounted_width", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 80"
                      value={product.mounted_height}
                      onChange={(e) => handleChange("mounted_height", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Profundidade (cm)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 42"
                      value={product.mounted_depth}
                      onChange={(e) => handleChange("mounted_depth", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="Ex: 8.500"
                      value={product.mounted_weight}
                      onChange={(e) => handleChange("mounted_weight", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =======================
              VARIAÇÕES
              - Cada variação: SKU + EAN próprios
          ======================= */}
          {activeTab === "variations" && (
            <>
              {/* --------------------------------------------------
                 CABEÇALHO DA ABA
              -------------------------------------------------- */}
              <div className="section">
                <div className="section-header">
                  <h3>Variações</h3>
                  <p className="section-subtitle">
                    Crie variações como cor/tamanho. Cada variação pode ter SKU e EAN próprios.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn-secondary" type="button" onClick={handleAddVariation}>
                    + Adicionar variação
                  </button>
                </div>
              </div>

              {/* --------------------------------------------------
                 LISTA DE VARIAÇÕES
              -------------------------------------------------- */}
              {variations.map((v, index) => (
                <div className="section" key={v.id}>
                  <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>
                        {v.variation_name || `Variação ${index + 1}`}
                      </h3>
                      <p className="section-subtitle" style={{ marginTop: 6 }}>
                        Configure atributo, valor, SKU, EAN e estoque da variação.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={v.active}
                          onChange={(e) => handleVariationChange(v.id, "active", e.target.checked)}
                        />
                        Ativa
                      </label>

                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleRemoveVariation(v.id)}
                        disabled={variations.length === 1}
                        title={variations.length === 1 ? "Mantenha ao menos 1 variação" : "Remover variação"}
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Nome opcional da variação */}
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Nome da variação (opcional)</label>
                      <input
                        placeholder="Ex: Cor Preto"
                        value={v.variation_name}
                        onChange={(e) => handleVariationChange(v.id, "variation_name", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Atributo + Valor + SKU + EAN */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Atributo</label>
                      <input
                        placeholder="Ex: Cor"
                        value={v.attribute}
                        onChange={(e) => handleVariationChange(v.id, "attribute", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Valor</label>
                      <input
                        placeholder="Ex: Preto"
                        value={v.value}
                        onChange={(e) => handleVariationChange(v.id, "value", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>SKU da variação</label>
                      <input
                        placeholder="Ex: ARM-COZ-PT-01"
                        value={v.sku}
                        onChange={(e) => handleVariationChange(v.id, "sku", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>EAN</label>
                      <input
                        inputMode="numeric"
                        placeholder="Ex: 7891234567890"
                        value={v.ean}
                        onChange={(e) =>
                          handleVariationChange(v.id, "ean", e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                  </div>

                  {/* Estoque + Preço */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Estoque da variação</label>
                      <input
                        inputMode="numeric"
                        placeholder="Ex: 10"
                        value={v.stock}
                        onChange={(e) =>
                          handleVariationChange(v.id, "stock", e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Preço (opcional)</label>
                      <input
                        inputMode="decimal"
                        placeholder="Ex: 199,90"
                        value={v.price}
                        onChange={(e) => handleVariationChange(v.id, "price", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* =======================
              ANÚNCIOS (placeholder UI)
              Futuro:
              - Mostrar anúncios por marketplace
              - Linkar SKU/variação -> anúncio
          ======================= */}
          {activeTab === "ads" && (
            <>
              <div className="section">
                <div className="section-header">
                  <h3>Anúncios do produto</h3>
                  <p className="section-subtitle">
                    Aqui vamos listar os anúncios vinculados a este produto em cada marketplace (ML primeiro).
                  </p>
                </div>

                <p className="hint">
                  Em breve: tabela com <strong>Marketplace</strong>, <strong>ID do anúncio</strong>,{" "}
                  <strong>Status</strong>, <strong>Preço</strong>, <strong>Estoque</strong> e{" "}
                  <strong>Ações</strong>.
                </p>

                <button className="btn-secondary" type="button">
                  Importar anúncios (em breve)
                </button>
              </div>
            </>
          )}

          {/* =======================
              VENDAS & DESEMPENHO (placeholder UI)
              Futuro:
              - Histórico de vendas
              - Margem, ROI, conversão, etc.
          ======================= */}
          {activeTab === "performance" && (
            <>
              <div className="section">
                <div className="section-header">
                  <h3>Vendas & desempenho</h3>
                  <p className="section-subtitle">
                    Painel do produto: histórico de vendas, desempenho por canal e indicadores.
                  </p>
                </div>

                <p className="hint">
                  Em breve: cards com <strong>Vendas</strong>, <strong>Receita</strong>,{" "}
                  <strong>Lucro</strong>, <strong>Ticket médio</strong>, <strong>Conversão</strong> e{" "}
                  <strong>Curva ABC</strong>.
                </p>

                <button className="btn-secondary" type="button">
                  Ver relatório (em breve)
                </button>
              </div>
            </>
          )}
        </div>

        {/* ==================================================
           FOOTER
        ================================================== */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} type="button">
            Salvar produto
          </button>
        </div>
      </div>
    </div>
  );
}
