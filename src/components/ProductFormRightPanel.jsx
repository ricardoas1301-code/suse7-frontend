// ======================================================================
// COMPONENTE: ProductFormRightPanel
// Objetivo:
// - Painel lateral direito com título, campos obrigatórios, progresso
//   das etapas e botão principal de salvar.
// - Apenas UI: usa mesma lógica de abas/submit existente via props.
// ======================================================================

import "./ProductFormRightPanel.css";

/**
 * @param {{
 *   title: string;
 *   steps: { id: string, label: string }[];
 *   activeId: string;
 *   onStepChange?: (id: string) => void;
 *   onSave?: () => void;
 *   onClose?: () => void;
 *   saveLabel?: string;
 *   saving?: boolean;
 *   statusText?: string;
 * }} props
 */
export default function ProductFormRightPanel({
  title = "Novo produto",
  steps = [],
  activeId,
  onStepChange,
  onSave,
  onClose,
  saveLabel = "Salvar produto",
  saving = false,
  statusText = "",
}) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  const rawIndex = steps.findIndex((s) => s.id === activeId);
  const activeIndex = rawIndex >= 0 ? rawIndex : 0;

  const handleStepClick = (id) => {
    if (typeof onStepChange === "function") {
      onStepChange(id);
    }
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveClick = () => {
    if (!saving && typeof onSave === "function") {
      onSave();
    }
  };

  return (
    <aside className="pf-right-panel" aria-label="Resumo do cadastro de produto">
      <div className="pf-right-header">
        <div className="pf-right-header-row">
          <h3 className="pf-right-title">{title}</h3>
          {typeof onClose === "function" && (
            <button type="button" className="pf-close" onClick={onClose}>
              Fechar
            </button>
          )}
        </div>
        <span className="pf-right-required-hint">* Campos obrigatórios</span>
      </div>

      <div className="pf-right-steps">
        <ol className="pf-right-steps-list">
          {steps.map((step, index) => {
            const isActive = step.id === activeId;
            const status = isActive ? "active" : "pending";
            return (
              <li
                key={step.id}
                className={`pf-right-step pf-right-step--${status}`}
              >
                <button
                  type="button"
                  className="pf-right-step-button"
                  onClick={() => handleStepClick(step.id)}
                >
                  <span className="pf-right-step-icon">
                    {index + 1}
                  </span>
                  <span className="pf-right-step-label">{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="pf-right-footer">
        {statusText && (
          <div className="pf-right-status">
            {statusText}
          </div>
        )}
        <button
          type="button"
          className="s7-btn s7-btn--primary pf-right-save-btn"
          onClick={handleSaveClick}
          disabled={saving}
        >
          {saving ? "Salvando..." : saveLabel}
        </button>
      </div>
    </aside>
  );
}

