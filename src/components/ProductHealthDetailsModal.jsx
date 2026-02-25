// ======================================================================
// SUSE7 — Product Health Details Modal
// Exibe pendências (blocking) e sugestões (warnings) do health report
// ======================================================================

import "./ProductHealthDetailsModal.css";

// Mapa field -> tab (para botão "Ir para aba X")
const FIELD_TO_TAB = {
  product_name: "data",
  sku: "data",
  gtin: "data",
  ncm: "data",
  brand: "data",
  model: "data",
  variants: "variations",
  cost_price: "pricing",
  stock: "stock",
  stock_quantity: "stock",
  images: "images",
  product_images: "images",
  description: "description",
  ad_titles: "ad_titles",
};

const TAB_LABELS = {
  data: "Dados",
  variations: "Variações",
  pricing: "Custos & precificação",
  stock: "Estoque",
  images: "Imagens",
  description: "Descrição",
  ad_titles: "Título do anúncio",
  ads: "Anúncios",
};

export default function ProductHealthDetailsModal({
  open = false,
  onClose,
  health = null,
  onGoToTab = null,
  bannerMessage = null, // ex: "Antes de marcar como pronto, resolva as pendências abaixo."
}) {
  if (!open) return null;

  const blocking = health?.blocking ?? [];
  const warnings = health?.warnings ?? [];
  const meta = health?.meta ?? {};

  const getTabForField = (field) => FIELD_TO_TAB[field] ?? null;
  const getTabLabel = (tabId) => TAB_LABELS[tabId] ?? tabId;

  return (
    <div className="phdm-bg" onClick={onClose} role="presentation">
      <div
        className="phdm-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="phdm-title"
        aria-modal="true"
      >
        <div className="phdm-header">
          <h2 id="phdm-title">Detalhes do cadastro</h2>
          <button
            type="button"
            className="phdm-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="phdm-body">
          {bannerMessage && (
            <div className="phdm-banner" role="alert">
              {bannerMessage}
            </div>
          )}
          {/* Meta */}
          {Object.keys(meta).length > 0 && (
            <div className="phdm-section">
              <h3 className="phdm-section-title">Resumo</h3>
              <div className="phdm-meta">
                {meta.format && (
                  <span className="phdm-meta-item">Formato: {meta.format}</span>
                )}
                {meta.titlesCount != null && (
                  <span className="phdm-meta-item">Títulos: {meta.titlesCount}</span>
                )}
                {meta.imagesCount != null && (
                  <span className="phdm-meta-item">Imagens: {meta.imagesCount}</span>
                )}
                {meta.variantsCount != null && (
                  <span className="phdm-meta-item">Variações: {meta.variantsCount}</span>
                )}
              </div>
            </div>
          )}

          {/* Pendências (blocking) */}
          <div className="phdm-section">
            <h3 className="phdm-section-title phdm-section-title--blocking">
              Pendências ({blocking.length})
            </h3>
            {blocking.length === 0 ? (
              <p className="phdm-empty">Nenhuma pendência.</p>
            ) : (
              <ul className="phdm-list">
                {blocking.map((item, idx) => {
                  const tabId = getTabForField(item?.field);
                  return (
                    <li key={idx} className="phdm-list-item phdm-list-item--blocking">
                      <span className="phdm-message">{item?.message ?? "—"}</span>
                      {item?.field && (
                        <span className="phdm-field">Campo: {item.field}</span>
                      )}
                      {tabId && typeof onGoToTab === "function" && (
                        <button
                          type="button"
                          className="phdm-goto-tab"
                          onClick={() => {
                            onGoToTab(tabId);
                            onClose();
                          }}
                        >
                          Ir para aba {getTabLabel(tabId)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Sugestões (warnings) */}
          <div className="phdm-section">
            <h3 className="phdm-section-title phdm-section-title--warning">
              Sugestões ({warnings.length})
            </h3>
            {warnings.length === 0 ? (
              <p className="phdm-empty">Nenhuma sugestão.</p>
            ) : (
              <ul className="phdm-list">
                {warnings.map((item, idx) => {
                  const tabId = getTabForField(item?.field);
                  return (
                    <li key={idx} className="phdm-list-item phdm-list-item--warning">
                      <span className="phdm-message">{item?.message ?? "—"}</span>
                      {item?.field && (
                        <span className="phdm-field">Campo: {item.field}</span>
                      )}
                      {tabId && typeof onGoToTab === "function" && (
                        <button
                          type="button"
                          className="phdm-goto-tab"
                          onClick={() => {
                            onGoToTab(tabId);
                            onClose();
                          }}
                        >
                          Ir para aba {getTabLabel(tabId)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="phdm-footer">
          <button type="button" className="phdm-btn-close" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
