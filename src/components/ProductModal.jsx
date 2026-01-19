// ======================================================================
// COMPONENTE: ProductModal
// Objetivo:
// - Cadastro / edição de produto
// - Modal (popup) com abas
// - Nome do produto fixo (fora das abas)
// - UI preparada para integração com Supabase e marketplaces
// ======================================================================

import { useState } from "react";
import "./ProductModal.css";

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
  // HANDLER GENÉRICO PARA INPUTS
  // ------------------------------------------------------
  const handleChange = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        ================================================== */}
        <div className="tabs">
          <button
            className={activeTab === "basic" ? "active" : ""}
            onClick={() => setActiveTab("basic")}
          >
            Dados básicos
          </button>

          <button
            className={activeTab === "description" ? "active" : ""}
            onClick={() => setActiveTab("description")}
          >
            Descrição
          </button>

          <button
            className={activeTab === "stock" ? "active" : ""}
            onClick={() => setActiveTab("stock")}
          >
            Estoque & logística
          </button>

          <button
            className={activeTab === "pricing" ? "active" : ""}
            onClick={() => setActiveTab("pricing")}
          >
            Custos & precificação
          </button>

          <button
            className={activeTab === "photos" ? "active" : ""}
            onClick={() => setActiveTab("photos")}
          >
            Fotos
          </button>
        </div>

          <button
            className={activeTab === "measures" ? "active" : ""}
            onClick={() => setActiveTab("measures")}
          >
            Pesos & medidas
          </button>


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
        </div>

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
