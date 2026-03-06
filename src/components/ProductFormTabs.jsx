// ======================================================================
// COMPONENTE: ProductFormTabs
// Objetivo:
// - Tabs horizontais premium (estilo Bling) para o ProductForm
// - Apenas UI: recebe steps, activeId, onTabChange
// ======================================================================

import "./ProductFormTabs.css";

/**
 * @param {{ id: string, label: string }[]} steps
 * @param {string} activeId
 * @param {(id: string) => void} onTabChange
 */
export default function ProductFormTabs({ steps = [], activeId, onTabChange }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const handleClick = (id) => {
    if (typeof onTabChange === "function") {
      onTabChange(id);
    }
  };

  return (
    <nav className="pf-tabs-bar" aria-label="Abas do cadastro de produto">
      <div className="pf-tabs-bar-inner">
        {steps.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              className={`pf-tab-item ${isActive ? "pf-tab-item--active" : ""}`}
              onClick={() => handleClick(tab.id)}
            >
              <span className="pf-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

