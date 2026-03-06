// ======================================================================
// COMPONENTE: WizardTabs
// Objetivo:
// - Navegação em etapas (wizard) para o ProductForm
// - Apenas UI/UX: recebe steps, activeId e callback onStepChange
// - Estados visuais: completed (antes), active (atual), pending (depois)
// ======================================================================

import "./WizardTabs.css";

/**
 * @param {{ id: string, label: string }[]} steps
 * @param {string} activeId
 * @param {(id: string) => void} onStepChange
 */
export default function WizardTabs({ steps = [], activeId, onStepChange }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === activeId)
  );

  return (
    <nav className="wizard-tabs" aria-label="Etapas do cadastro de produto">
      <ol className="wizard-tabs-track">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const status = isActive ? "active" : isCompleted ? "completed" : "pending";

          const handleClick = () => {
            if (typeof onStepChange === "function") {
              onStepChange(step.id);
            }
          };

          return (
            <li key={step.id} className={`wizard-step wizard-step--${status}`}>
              <button
                type="button"
                className="wizard-step-button"
                onClick={handleClick}
              >
                <span className="wizard-step-pill">
                  <span className="wizard-step-number">
                    {isCompleted ? "✓" : index + 1}
                  </span>
                </span>
                <span className="wizard-step-label">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <span className="wizard-step-connector" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

