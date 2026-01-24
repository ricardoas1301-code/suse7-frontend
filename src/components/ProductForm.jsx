// ======================================================================
// COMPONENTE: ProductForm
// Objetivo:
// - Reutilizar a mesma UI do ProductModal em modo PÁGINA
// - Abas: Básico, Descrição, Estoque, Precificação, Fotos, Medidas,
//         Variações (SKU + EAN), Anúncios (placeholder), Vendas (placeholder)
// - UI only por enquanto (salvar/back-end depois)
// Correção aplicada:
// - Removemos classes genéricas (form-row/form-group) para evitar conflito
// - Agora usamos pf-row / pf-group (escopo do ProductForm)
// - Mantemos .s7-card nas seções de medidas
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import "./ProductForm.css";

export default function ProductForm({
  title = "Novo produto",
  mode = "create", // "create" | "edit"
  initialProduct = null,
  initialVariations = null,
  onCancel = null,
  onSubmit = null,
}) {
  // ------------------------------------------------------
  // CONTROLE DE ABAS
  // ------------------------------------------------------
  const [activeTab, setActiveTab] = useState("basic");

  // ------------------------------------------------------
  // HELPER: ID seguro para variações (evita quebrar em browsers)
  // ------------------------------------------------------
  const createId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  // ------------------------------------------------------
  // STATE: PRODUTO (UI only)
  // ------------------------------------------------------
  const [product, setProduct] = useState({
    // ======================================================
    // BÁSICO
    // ======================================================
    product_name: "",
    sku: "",
    gtin: "",
    ncm: "",
    brand: "",
    model: "",
    description: "",
    seo_keywords: "", // ✅ Palavras-chave SEO (separadas por vírgula)

    // ======================================================
    // CATEGORIA (ML)
    // ======================================================
    category_ml_id: "",

    // ======================================================
    // ESTOQUE & LOGÍSTICA
    // ======================================================
    stock_quantity: 0,
    stock_source: "manual",
    lead_time_days: "",
    origin: "",
    supplier_name: "",
    notes: "",

    // ======================================================
    // CUSTOS & PRECIFICAÇÃO
    // ======================================================
    cost_price: "",
    fixed_costs: "",
    min_profit_percentage: "",
    min_profit_value: "",

    // ======================================================
    // PESOS & MEDIDAS — ENVIO
    // ======================================================
    width: "",
    height: "",
    length: "",
    weight: "",

    // ======================================================
    // PESOS & MEDIDAS — PRODUTO MONTADO
    // ======================================================
    assembled_width: "",
    assembled_height: "",
    assembled_length: "",
    assembled_weight: "",

    // ======================================================
    // IMAGENS
    // ======================================================
    product_images: null,

    // ======================================================
    // CAMPOS DE SISTEMA
    // ======================================================
    active: true,
    imported_from_channel: "manual",
    parent_sku: null,
  });

  // ------------------------------------------------------
  // STATE: VALORES ORIGINAIS (alertas no modo EDIT)
  // ------------------------------------------------------
  const [originalSku, setOriginalSku] = useState("");
  const [originalGtin, setOriginalGtin] = useState("");

  // ------------------------------------------------------
  // STATE: VARIAÇÕES (UI only)
  // ------------------------------------------------------
  const [variations, setVariations] = useState([
    {
      id: createId(),
      variation_name: "Variação 1",
      attribute: "Cor",
      value: "Preto",
      sku: "",
      ean: "",
      stock: "",
      price: "",
      active: true,
    },
  ]);

  // ------------------------------------------------------
  // STATE: ERROS (UX somente)
  // ------------------------------------------------------
  const [errors, setErrors] = useState({});

  // ------------------------------------------------------
  // HIDRATAR FORM (modo edição)
  // ------------------------------------------------------
  useEffect(() => {
    // ------------------------------------------------------
    // Produto inicial
    // ------------------------------------------------------
    if (initialProduct) {
      setProduct((prev) => ({ ...prev, ...initialProduct }));
      setOriginalSku(initialProduct.sku || "");
      setOriginalGtin(initialProduct.gtin || "");
    } else {
      setOriginalSku("");
      setOriginalGtin("");
    }

    // ------------------------------------------------------
    // Variações iniciais
    // ------------------------------------------------------
    if (Array.isArray(initialVariations) && initialVariations.length > 0) {
      setVariations(
        initialVariations.map((v, idx) => ({
          id: v.id || createId(),
          variation_name: v.variation_name || `Variação ${idx + 1}`,
          attribute: v.attribute || "",
          value: v.value || "",
          sku: v.sku || "",
          ean: v.ean || "",
          stock: v.stock || "",
          price: v.price || "",
          active: typeof v.active === "boolean" ? v.active : true,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct, initialVariations]);

  // ------------------------------------------------------
  // ALERTA SKU/GTIN (modo edit)
  // ------------------------------------------------------
  const showSkuGtinAlert = useMemo(() => {
    if (mode !== "edit") return false;
    const skuChanged = (product.sku || "") !== (originalSku || "");
    const gtinChanged = (product.gtin || "") !== (originalGtin || "");
    return skuChanged || gtinChanged;
  }, [mode, product.sku, product.gtin, originalSku, originalGtin]);

  // ------------------------------------------------------
  // HANDLER GENÉRICO PARA INPUTS
  // ------------------------------------------------------
  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
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
        ean: "",
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
  // HELPER UI: Copiar conteúdo do campo (padrão ML)
  // ------------------------------------------------------
  const handleCopyField = async (value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      console.log("✅ Campo copiado");
    } catch (err) {
      console.error("❌ Falha ao copiar campo:", err);
    }
  };

  // ------------------------------------------------------
  // VALIDAR: Aba Dados Básicos (UX)
  // ------------------------------------------------------
  const validateBasicTab = () => {
    const nextErrors = {};

    if (!String(product.product_name || "").trim()) {
      nextErrors.product_name = "Nome do produto é obrigatório.";
    }

    if (!String(product.sku || "").trim()) {
      nextErrors.sku = "SKU é obrigatório.";
    }

    const gtin = String(product.gtin || "").trim();
    if (gtin) {
      if (!/^\d+$/.test(gtin)) nextErrors.gtin = "EAN/GTIN deve conter apenas números.";
      else if (gtin.length > 13) nextErrors.gtin = "EAN/GTIN deve ter no máximo 13 dígitos.";
    }

    const ncmDigits = String(product.ncm || "").replace(/\D/g, "");
    if (ncmDigits) {
      if (ncmDigits.length !== 8) nextErrors.ncm = "NCM deve ter 8 dígitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // ------------------------------------------------------
  // MÁSCARA: NCM (8 dígitos) -> 1234.56.78
  // ------------------------------------------------------
  const formatNcm = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
  const handleSubmit = () => {
    const okBasic = validateBasicTab();
    if (!okBasic) {
      setActiveTab("basic");
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit({ product, variations, mode });
      return;
    }

    console.log("Produto a salvar:", product);
    console.log("Variações a salvar:", variations);
  };

  // ======================================================================
  // COMPONENTE: FieldLabel
  // ======================================================================
  const FieldLabel = ({ text, required = false, onCopy }) => {
    return (
      <div className="pf-label-row">
        <span className="s7-label">
          {text} {required && <span className="s7-required">*</span>}
        </span>

        <button
          type="button"
          className="pf-copy-btn"
          onClick={onCopy ? onCopy : undefined}
          aria-label="Copiar"
        >
          ⧉
        </button>
      </div>
    );
  };

  return (
    <div className="pf-card pf-card--primary">
      {/* ==================================================
         HEADER
      ================================================== */}
      <div className="pf-header">
        <div className="pf-title-block">
          <h2 className="s7-title">{title}</h2>
          <div className="s7-hint">* Campos obrigatórios</div>
        </div>

        <button type="button" className="pf-close" onClick={onCancel}>
          Fechar
        </button>
      </div>

      {/* ==================================================
         NOME DO PRODUTO — FIXO
      ================================================== */}
      <div className="pf-product-name-fixed">
        <FieldLabel
          text="Nome do produto"
          required
          onCopy={() => handleCopyField(product.product_name)}
        />

        <input
          className={`s7-input ${errors.product_name ? "s7-input--error" : ""}`}
          type="text"
          placeholder="Ex: Armário de cozinha 3 portas"
          value={product.product_name}
          onChange={(e) => handleChange("product_name", e.target.value)}
        />

        {errors.product_name && <div className="s7-error">{errors.product_name}</div>}
      </div>

      {/* ==================================================
         ALERTA: SKU/GTIN alterado (modo edit)
      ================================================== */}
      {showSkuGtinAlert && (
        <div className="s7-alert s7-alert--warning">
          <strong>Atenção:</strong> alterar <strong>SKU</strong> ou <strong>GTIN</strong> pode
          impactar vínculos com anúncios e integrações.
        </div>
      )}

      {/* ==================================================
         ABAS
      ================================================== */}
      <div className="pf-tabs">
        <button className={activeTab === "basic" ? "active" : ""} onClick={() => setActiveTab("basic")} type="button">
          Dados básicos
        </button>
        <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")} type="button">
          Descrição
        </button>
        <button className={activeTab === "stock" ? "active" : ""} onClick={() => setActiveTab("stock")} type="button">
          Estoque & logística
        </button>
        <button className={activeTab === "pricing" ? "active" : ""} onClick={() => setActiveTab("pricing")} type="button">
          Custos & precificação
        </button>
        <button className={activeTab === "photos" ? "active" : ""} onClick={() => setActiveTab("photos")} type="button">
          Fotos
        </button>
        <button className={activeTab === "measures" ? "active" : ""} onClick={() => setActiveTab("measures")} type="button">
          Pesos & medidas
        </button>
        <button className={activeTab === "variations" ? "active" : ""} onClick={() => setActiveTab("variations")} type="button">
          Variações
        </button>
        <button className={activeTab === "ads" ? "active" : ""} onClick={() => setActiveTab("ads")} type="button">
          Anúncios
        </button>
        <button className={activeTab === "performance" ? "active" : ""} onClick={() => setActiveTab("performance")} type="button">
          Vendas & desempenho
        </button>
      </div>

      {/* ==================================================
         BODY
      ================================================== */}
      <div className="pf-body">
        {/* =======================
            DADOS BÁSICOS
        ======================= */}
        {activeTab === "basic" && (
          <div className="pf-container">
            <div className="pf-row">
              <div className="pf-group">
                <FieldLabel text="SKU" required onCopy={() => handleCopyField(product.sku)} />
                <input
                  className={`s7-input ${errors.sku ? "s7-input--error" : ""}`}
                  placeholder="SKU interno"
                  value={product.sku}
                  onChange={(e) => handleChange("sku", e.target.value.replace(/\s+/g, " ").trimStart())}
                />
                {errors.sku && <div className="s7-error">{errors.sku}</div>}
              </div>

              <div className="pf-group">
                <FieldLabel text="EAN / GTIN" onCopy={() => handleCopyField(product.gtin)} />
                <input
                  className={`s7-input ${errors.gtin ? "s7-input--error" : ""}`}
                  inputMode="numeric"
                  placeholder="Código de barras"
                  value={product.gtin}
                  onChange={(e) => handleChange("gtin", e.target.value.replace(/\D/g, "").slice(0, 13))}
                />
                {errors.gtin && <div className="s7-error">{errors.gtin}</div>}
              </div>

              <div className="pf-group">
                <FieldLabel text="NCM" onCopy={() => handleCopyField(product.ncm)} />
                <input
                  className={`s7-input ${errors.ncm ? "s7-input--error" : ""}`}
                  inputMode="numeric"
                  placeholder="Ex: 94036000"
                  value={product.ncm}
                  onChange={(e) => {
                    const masked = formatNcm(e.target.value);
                    handleChange("ncm", masked);

                    const digits = masked.replace(/\D/g, "");
                    if (digits.length === 8) setErrors((prev) => ({ ...prev, ncm: undefined }));
                  }}
                />
                {errors.ncm && <div className="s7-error">{errors.ncm}</div>}
              </div>
            </div>

            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Marca</label>
                <input className="s7-input" value={product.brand} onChange={(e) => handleChange("brand", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Modelo</label>
                <input className="s7-input" value={product.model} onChange={(e) => handleChange("model", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Categoria Mercado Livre (ID)</label>
                <input
                  className="s7-input"
                  placeholder="Ex: MLB1234"
                  value={product.category_ml_id}
                  onChange={(e) => handleChange("category_ml_id", e.target.value)}
                />
              </div>
            </div>

<div className="pf-row">
  <div className="pf-group pf-group--full">
    <FieldLabel
      text="Palavras-chave SEO"
      onCopy={() => handleCopyField(product.seo_keywords)}
    />

    <div className="pf-seo-wrapper">
      <textarea
        className="s7-textarea"
        rows="3"
        placeholder="Ex: armário cozinha, armário 3 portas, armário branco"
        value={product.seo_keywords}
        onChange={(e) => handleChange("seo_keywords", e.target.value)}
      />
    </div>

    <div className="s7-hint">
      Separe por vírgulas. Isso ajuda na busca interna e SEO futuro.
    </div>
  </div>
</div>


          </div>
        )}

        {/* =======================
            DESCRIÇÃO
        ======================= */}
        {activeTab === "description" && (
          <div className="pf-group">
            <FieldLabel text="Descrição do produto" onCopy={() => handleCopyField(product.description)} />
            <div className="description-wrapper pf-desc-wrapper">
              <textarea
                className="s7-textarea"
                rows="8"
                placeholder="Descrição base do produto. Esta descrição poderá ser usada em todos os anúncios."
                value={product.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* =======================
            ESTOQUE & LOGÍSTICA
        ======================= */}
        {activeTab === "stock" && (
          <>
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Estoque</label>
                <input className="s7-input" type="number" min="0" value={product.stock_quantity} onChange={(e) => handleChange("stock_quantity", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Origem do estoque</label>
                <select className="s7-select" value={product.stock_source} onChange={(e) => handleChange("stock_source", e.target.value)}>
                  <option value="manual">Manual</option>
                  <option value="virtual">Virtual (avançado)</option>
                </select>
              </div>

              <div className="pf-group">
                <label className="s7-label">Lead time (dias)</label>
                <input
                  className="s7-input"
                  inputMode="numeric"
                  placeholder="Ex: 2"
                  value={product.lead_time_days}
                  onChange={(e) => handleChange("lead_time_days", e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Origem (texto livre)</label>
                <input
                  className="s7-input"
                  placeholder="Ex: Nacional / Importado / SP / Fábrica própria..."
                  value={product.origin}
                  onChange={(e) => handleChange("origin", e.target.value)}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Fornecedor</label>
                <input
                  className="s7-input"
                  placeholder="Nome do fornecedor"
                  value={product.supplier_name}
                  onChange={(e) => handleChange("supplier_name", e.target.value)}
                />
              </div>
            </div>

            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Observações</label>
                <input
                  className="s7-input"
                  placeholder="Notas internas sobre estoque/logística"
                  value={product.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* =======================
            CUSTOS & PRECIFICAÇÃO
        ======================= */}
        {activeTab === "pricing" && (
          <>
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Custo do produto</label>
                <input className="s7-input" type="number" value={product.cost_price} onChange={(e) => handleChange("cost_price", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Custos fixos</label>
                <input className="s7-input" type="number" value={product.fixed_costs} onChange={(e) => handleChange("fixed_costs", e.target.value)} />
              </div>
            </div>

            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Lucro mínimo (%)</label>
                <input
                  className="s7-input"
                  inputMode="decimal"
                  placeholder="Ex: 10"
                  value={product.min_profit_percentage}
                  onChange={(e) => handleChange("min_profit_percentage", e.target.value)}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Lucro mínimo (R$)</label>
                <input
                  className="s7-input"
                  inputMode="decimal"
                  placeholder="Ex: 15,00"
                  value={product.min_profit_value}
                  onChange={(e) => handleChange("min_profit_value", e.target.value)}
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
              Adicione até <strong>7 fotos</strong>. Elas poderão ser usadas para atualizar anúncios
              em todos os canais.
            </p>

            <div className="photo-uploader">
              <button className="s7-btn s7-btn--secondary" type="button">
                Adicionar fotos
              </button>
            </div>

            <div className="hint" style={{ marginTop: 12 }}>
              Campo alvo no Supabase: <strong>product_images</strong>
            </div>
          </>
        )}

        {/* =======================
            PESOS & MEDIDAS
        ======================= */}
        {activeTab === "measures" && (
          <>
            <div className="s7-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas de envio</h3>
                <p className="s7-card__subtitle">Medidas usadas para cálculo de frete e logística.</p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 30" value={product.width} onChange={(e) => handleChange("width", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 15" value={product.height} onChange={(e) => handleChange("height", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 45" value={product.length} onChange={(e) => handleChange("length", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input className="s7-input" type="number" min="0" step="0.001" placeholder="Ex: 2.350" value={product.weight} onChange={(e) => handleChange("weight", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="s7-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas do produto (montado)</h3>
                <p className="s7-card__subtitle">Medidas reais do produto pronto/montado (referência interna).</p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 32" value={product.assembled_width} onChange={(e) => handleChange("assembled_width", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 80" value={product.assembled_height} onChange={(e) => handleChange("assembled_height", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input className="s7-input" type="number" min="0" placeholder="Ex: 42" value={product.assembled_length} onChange={(e) => handleChange("assembled_length", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input className="s7-input" type="number" min="0" step="0.001" placeholder="Ex: 8.500" value={product.assembled_weight} onChange={(e) => handleChange("assembled_weight", e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* =======================
            VARIAÇÕES
        ======================= */}
        {activeTab === "variations" && (
          <>
            <div className="section">
              <div className="section-header">
                <h3>Variações</h3>
                <p className="section-subtitle">
                  Crie variações como cor/tamanho. Cada variação pode ter SKU e EAN próprios.
                </p>
              </div>

              <div className="pf-actions-row">
                <button className="s7-btn s7-btn--secondary" type="button" onClick={handleAddVariation}>
                  + Adicionar variação
                </button>
              </div>
            </div>

            {variations.map((v, index) => (
              <div className="section" key={v.id}>
                <div className="pf-variation-head">
                  <div>
                    <h3 style={{ margin: 0 }}>{v.variation_name || `Variação ${index + 1}`}</h3>
                    <p className="section-subtitle" style={{ marginTop: 6 }}>
                      Configure atributo, valor, SKU, EAN e estoque da variação.
                    </p>
                  </div>

                  <div className="pf-variation-actions">
                    <label className="pf-switch">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => handleVariationChange(v.id, "active", e.target.checked)}
                      />
                      Ativa
                    </label>

                    <button
                      className="s7-btn s7-btn--secondary"
                      type="button"
                      onClick={() => handleRemoveVariation(v.id)}
                      disabled={variations.length === 1}
                      title={variations.length === 1 ? "Mantenha ao menos 1 variação" : "Remover variação"}
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="pf-row">
                  <div className="pf-group">
                    <label className="s7-label">Nome da variação (opcional)</label>
                    <input
                      className="s7-input"
                      placeholder="Ex: Cor Preto"
                      value={v.variation_name}
                      onChange={(e) => handleVariationChange(v.id, "variation_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="pf-row">
                  <div className="pf-group">
                    <label className="s7-label">Atributo</label>
                    <input
                      className="s7-input"
                      placeholder="Ex: Cor"
                      value={v.attribute}
                      onChange={(e) => handleVariationChange(v.id, "attribute", e.target.value)}
                    />
                  </div>

                  <div className="pf-group">
                    <label className="s7-label">Valor</label>
                    <input
                      className="s7-input"
                      placeholder="Ex: Preto"
                      value={v.value}
                      onChange={(e) => handleVariationChange(v.id, "value", e.target.value)}
                    />
                  </div>

                  <div className="pf-group">
                    <label className="s7-label">SKU da variação</label>
                    <input
                      className="s7-input"
                      placeholder="Ex: ARM-COZ-PT-01"
                      value={v.sku}
                      onChange={(e) => handleVariationChange(v.id, "sku", e.target.value)}
                    />
                  </div>

                  <div className="pf-group">
                    <label className="s7-label">EAN</label>
                    <input
                      className="s7-input"
                      inputMode="numeric"
                      placeholder="Ex: 7891234567890"
                      value={v.ean}
                      onChange={(e) => handleVariationChange(v.id, "ean", e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className="pf-row">
                  <div className="pf-group">
                    <label className="s7-label">Estoque da variação</label>
                    <input
                      className="s7-input"
                      inputMode="numeric"
                      placeholder="Ex: 10"
                      value={v.stock}
                      onChange={(e) => handleVariationChange(v.id, "stock", e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div className="pf-group">
                    <label className="s7-label">Preço (opcional)</label>
                    <input
                      className="s7-input"
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
            ANÚNCIOS (placeholder)
        ======================= */}
        {activeTab === "ads" && (
          <div className="section">
            <div className="section-header">
              <h3>Anúncios do produto</h3>
              <p className="section-subtitle">
                Aqui vamos listar os anúncios vinculados a este produto em cada marketplace (ML primeiro).
              </p>
            </div>

            <p className="hint">
              Em breve: tabela com Marketplace, ID do anúncio, Status, Preço, Estoque e Ações.
            </p>

            <button className="s7-btn s7-btn--secondary" type="button">
              Importar anúncios (em breve)
            </button>
          </div>
        )}

        {/* =======================
            VENDAS & DESEMPENHO (placeholder)
        ======================= */}
        {activeTab === "performance" && (
          <div className="section">
            <div className="section-header">
              <h3>Vendas & desempenho</h3>
              <p className="section-subtitle">
                Painel do produto: histórico de vendas, desempenho por canal e indicadores.
              </p>
            </div>

            <p className="hint">
              Em breve: cards com Vendas, Receita, Lucro, Ticket médio, Conversão e Curva ABC.
            </p>

            <button className="s7-btn s7-btn--secondary" type="button">
              Ver relatório (em breve)
            </button>
          </div>
        )}
      </div>

      {/* ==================================================
         FOOTER — sticky
      ================================================== */}
      <div className="pf-footer pf-footer-right">
        <button className="s7-btn s7-btn--primary" onClick={handleSubmit} type="button">
          {mode === "edit" ? "Salvar alterações" : "Salvar produto"}
        </button>
      </div>
    </div>
  );
}
