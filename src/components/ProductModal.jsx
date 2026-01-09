// ======================================================================
// COMPONENTE: ProductModal
// Objetivo: Modal de cadastro / edição de produto
// Padrão visual: Suse7
// Regra: Nome do produto FIXO fora das abas
// ======================================================================

import { useState } from "react";
import "./ProductModal.css";

export default function ProductModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("dados");

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-lg">

        {/* ======================================================
           HEADER
        ====================================================== */}
        <div className="modal-header">
          <h2>Novo produto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ======================================================
           NOME DO PRODUTO — FIXO
        ====================================================== */}
        <div className="product-name-fixed">
          <label>Nome do produto</label>
          <input
            type="text"
            placeholder="Ex: Armário de cozinha 3 portas"
          />
        </div>

        {/* ======================================================
           ABAS
        ====================================================== */}
        <div className="modal-tabs">
          <button
            className={activeTab === "dados" ? "active" : ""}
            onClick={() => setActiveTab("dados")}
          >
            Dados básicos
          </button>

          <button
            className={activeTab === "estoque" ? "active" : ""}
            onClick={() => setActiveTab("estoque")}
          >
            Estoque & logística
          </button>

          <button
            className={activeTab === "custos" ? "active" : ""}
            onClick={() => setActiveTab("custos")}
          >
            Custos & precificação
          </button>

          <button
            className={activeTab === "fotos" ? "active" : ""}
            onClick={() => setActiveTab("fotos")}
          >
            Fotos
          </button>
        </div>

        {/* ======================================================
           BODY
        ====================================================== */}
        <div className="modal-body">

          {/* =======================
             ABA: DADOS BÁSICOS
          ======================= */}
          {activeTab === "dados" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input type="text" placeholder="SKU interno" />
                </div>

                <div className="form-group">
                  <label>EAN / GTIN</label>
                  <input type="text" placeholder="Código de barras" />
                </div>

                <div className="form-group">
                  <label>NCM</label>
                  <input type="text" placeholder="Ex: 94036000" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Marca</label>
                  <input type="text" />
                </div>

                <div className="form-group">
                  <label>Modelo</label>
                  <input type="text" />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do produto</label>
                <textarea rows="4" />
                <button className="btn-ai">🤖 Gerar descrição com IA</button>
              </div>
            </>
          )}

          {/* =======================
             ABA: ESTOQUE
          ======================= */}
          {activeTab === "estoque" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantidade em estoque</label>
                  <input type="number" min="0" />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* =======================
             ABA: CUSTOS
          ======================= */}
          {activeTab === "custos" && (
            <>
              <p className="tab-placeholder">
                Configurações de custo e lucro (próximo passo 🚀)
              </p>
            </>
          )}

          {/* =======================
             ABA: FOTOS
          ======================= */}
          {activeTab === "fotos" && (
            <>
              <p className="tab-placeholder">
                Upload de até 7 fotos do produto
              </p>
            </>
          )}

        </div>

        {/* ======================================================
           FOOTER
        ====================================================== */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary">
            Salvar produto
          </button>
        </div>

      </div>
    </div>
  );
}
