// ======================================================================
// COMPONENTE: ProductFormRightPanel
// Objetivo:
// - Painel lateral direito com título, campos obrigatórios, progresso
//   das etapas e botão principal de salvar.
// - Apenas UI: usa mesma lógica de abas/submit existente via props.
// ======================================================================

import "./ProductFormRightPanel.css";
import ProductHealthProgress from "./ProductHealthProgress";
import S7CatalogListingHeadline from "./catalog/S7CatalogListingHeadline.jsx";
import "./catalog/S7CatalogListingHeadline.css";

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
 * @param {null | { productId: string, productName?: string, productSku?: string }} [props.panelProductHeadline]
 * @param {boolean} [props.showFooterCancel]
 * @param {string} [props.cancelLabel]
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
  cancelLabel = "Cancelar",
  saving = false,
  statusText = "",
  progressPercent = 0,
  stepsClickable = true,
  panelProductThumb = null,
  panelProductHeadline = null,
  showFooterCancel = false,
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

  const headlineNome =
    panelProductHeadline?.productName != null ? String(panelProductHeadline.productName).trim() : "";
  const headlineSku =
    panelProductHeadline?.productSku != null ? String(panelProductHeadline.productSku).trim() : "";
  const showProductHeadline = Boolean(headlineNome || headlineSku);

  return (
    <aside
      className={`pf-right-panel${showProductHeadline ? " pf-right-panel--with-headline" : ""}`}
      aria-label="Resumo do cadastro de produto"
    >
      <div className="pf-right-header">
        <div className="pf-right-header-row">
          <h3 className="pf-right-title">{title}</h3>
          {typeof onClose === "function" && !showFooterCancel && (
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

      {showProductHeadline ? (
        <div className="pf-right-product-headline">
          <S7CatalogListingHeadline
            title={headlineNome || "Produto"}
            titleTooltip={headlineNome || undefined}
            sku={headlineSku}
            layout="stacked"
            className="s7-catalog-headline--product pf-right-product-headline__headline"
            copySkuFlashKey={`product-rayx-sku-${panelProductHeadline?.productId ?? "unknown"}`}
            skuEntityType="product"
          />
        </div>
      ) : null}

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

      {(statusText || typeof onSave === "function" || (showFooterCancel && typeof onClose === "function")) && (
        <div className="pf-right-footer">
          {statusText && (
            <div className="pf-right-status">
              {statusText}
            </div>
          )}
          {(typeof onSave === "function" || (showFooterCancel && typeof onClose === "function")) && (
            <div className="pf-right-footer-actions">
              {showFooterCancel && typeof onClose === "function" ? (
                <button
                  type="button"
                  className="s7-btn s7-btn--secondary pf-right-cancel-btn"
                  onClick={onClose}
                  disabled={saving}
                >
                  {cancelLabel}
                </button>
              ) : null}
              {typeof onSave === "function" ? (
                <button
                  type="button"
                  className="s7-btn s7-btn--primary pf-right-save-btn"
                  onClick={handleSaveClick}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : saveLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

