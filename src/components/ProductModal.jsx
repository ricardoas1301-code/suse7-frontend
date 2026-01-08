// ======================================================================
// COMPONENTE: ProductModal
// Objetivo: Modal para cadastro de novo produto (UI only)
// Padrão visual: Suse7
// ======================================================================

import "./ProductModal.css";

export default function ProductModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        {/* HEADER */}
        <div className="modal-header">
          <h2>Novo produto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="modal-body">

          <div className="form-group">
            <label>Nome do produto</label>
            <input type="text" placeholder="Ex: Armário de cozinha 3 portas" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <div className="input-copy">
                <input type="text" placeholder="SKU interno" />
                <span title="Copiar">📋</span>
              </div>
            </div>

            <div className="form-group">
              <label>EAN / GTIN</label>
              <div className="input-copy">
                <input type="text" placeholder="Código de barras" />
                <span title="Copiar">📋</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Marca</label>
              <input type="text" placeholder="Marca" />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input type="text" placeholder="Modelo" />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do produto</label>
            <textarea rows="4" placeholder="Descrição base do produto" />
            <button className="btn-ai">🤖 Gerar descrição com IA</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estoque inicial</label>
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

        </div>

        {/* FOOTER */}
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
