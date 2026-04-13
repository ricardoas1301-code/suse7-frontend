// ======================================================================
// COMPONENTE: ProductFormRightPanel
// Objetivo:
// - Painel lateral direito com título, campos obrigatórios, progresso
//   das etapas e botão principal de salvar.
// - Apenas UI: usa mesma lógica de abas/submit existente via props.
// ======================================================================

import "./ProductFormRightPanel.css";
import ProductHealthProgress from "./ProductHealthProgress";

/**
 * Painel lateral: etapas, progresso e ações.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {{ id: string, label: string }[]} [props.steps]
 * @param {string} [props.activeId]
 * @param {(id: string) => void} [props.onStepChange]
 * @param {(stepId: string) => boolean} [props.isStepUnlocked]
 * @param {() => void} [props.onSave]
 * @param {() => void} [props.onClose]
 * @param {string} [props.saveLabel]
 * @param {boolean} [props.saving]
 * @param {string} [props.statusText]
 * @param {number} [props.progressPercent] — progresso detalhado do formulário (abas/campos)
 * @param {boolean} [props.stepsClickable]
 * @param {null | { src: string, title: string, ariaLabel: string, alt: string }} [props.panelProductThumb]
 */
export default function ProductFormRightPanel({
  title = "Novo produto",
  steps = [],
  activeId,
  onStepChange,
  isStepUnlocked,
  onSave,
  onClose,
  saveLabel = "Salvar produto",
  saving = false,
  statusText = "",
  progressPercent = 0,
  stepsClickable = true,
  panelProductThumb = null,
}) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  const rawIndex = steps.findIndex((s) => s.id === activeId);
  const activeIndex = rawIndex >= 0 ? rawIndex : 0;

  const checkUnlocked = (stepId) => {
    if (typeof isStepUnlocked === "function") return isStepUnlocked(stepId);
    return true;
  };

  const handleStepClick = (id) => {
    if (!stepsClickable) return;
    if (!checkUnlocked(id)) return;
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
        <span className="pf-right-required-hint">
          <span className="s7-required" aria-hidden="true">
            *
          </span>{" "}
          Campos obrigatórios
        </span>
      </div>

      {panelProductThumb ? (
        <div className="pf-right-progress-row pf-right-progress-row--with-thumb">
          <div
            className="pf-product-thumb pf-right-panel-product-thumb pf-product-thumb--data-inline"
            title={panelProductThumb.title}
            aria-label={panelProductThumb.ariaLabel}
          >
            {panelProductThumb.src ? (
              <img src={panelProductThumb.src} alt={panelProductThumb.alt} />
            ) : (
              <span className="pf-product-thumb__placeholder">IMG</span>
            )}
          </div>
          <div className="pf-right-progress-semi">
            <ProductHealthProgress
              percent={progressPercent}
              status=""
              blockingCount={0}
              warningsCount={0}
              hint={null}
              showLabel={false}
              variant="semi"
            />
          </div>
        </div>
      ) : (
        <div className="pf-right-progress-semi">
          <ProductHealthProgress
            percent={progressPercent}
            status=""
            blockingCount={0}
            warningsCount={0}
            hint={null}
            showLabel={false}
            variant="semi"
          />
        </div>
      )}

      <div className="pf-right-steps">
        <ol className="pf-right-steps-list">
          {steps.map((step, index) => {
            const isActive = step.id === activeId;
            const status = isActive ? "active" : "pending";
            const unlocked = checkUnlocked(step.id);
            const locked = stepsClickable && !unlocked && !isActive;
            return (
              <li
                key={step.id}
                className={`pf-right-step pf-right-step--${status}${locked ? " pf-right-step--locked" : ""}`}
              >
                <button
                  type="button"
                  className={`pf-right-step-button ${!stepsClickable ? "pf-right-step-button--static" : ""}`}
                  onClick={() => handleStepClick(step.id)}
                  aria-disabled={!stepsClickable || locked}
                  disabled={!stepsClickable || locked}
                  tabIndex={!stepsClickable || locked ? -1 : 0}
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

      {(statusText || typeof onSave === "function") && (
        <div className="pf-right-footer">
          {statusText && (
            <div className="pf-right-status">
              {statusText}
            </div>
          )}
          {typeof onSave === "function" && (
            <button
              type="button"
              className="s7-btn s7-btn--primary pf-right-save-btn"
              onClick={handleSaveClick}
              disabled={saving}
            >
              {saving ? "Salvando..." : saveLabel}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

