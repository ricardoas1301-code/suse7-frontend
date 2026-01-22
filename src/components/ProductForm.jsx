// ======================================================================
// COMPONENTE: ProductForm
// Objetivo:
// - Reutilizar a mesma UI do ProductModal em modo PÁGINA
// - Abas: Básico, Descrição, Estoque, Precificação, Fotos, Medidas,
//         Variações (SKU + EAN), Anúncios (placeholder), Vendas (placeholder)
// - UI only por enquanto (salvar/back-end depois)
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
  // IMPORTANTE:
  // - Campos abaixo estão alinhados com a tabela `products` do Supabase
  // - Evita duplicidade de colunas no banco e bugs no save futuro
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

    // ======================================================
    // CATEGORIA (ML)
    // ======================================================
    category_ml_id: "",

    // ======================================================
    // ESTOQUE & LOGÍSTICA
    // ======================================================
    stock_quantity: 0,
    stock_source: "manual",
    lead_time_days: "", // dias (pode ser vazio)
    origin: "", // texto livre (como você decidiu)
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
    // PESOS & MEDIDAS — ENVIO (Supabase: width/height/length/weight)
    // ======================================================
    width: "",
    height: "",
    length: "",
    weight: "",

    // ======================================================
    // PESOS & MEDIDAS — PRODUTO MONTADO (Supabase: assembled_*)
    // ======================================================
    assembled_width: "",
    assembled_height: "",
    assembled_length: "",
    assembled_weight: "",

    // ======================================================
    // IMAGENS (Supabase: product_images)
    // Observação: por enquanto UI only; depois podemos salvar como array JSON/string
    // ======================================================
    product_images: null,

    // ======================================================
    // CAMPOS DE SISTEMA (não mostrar por enquanto)
    // ======================================================
    active: true,
    imported_from_channel: "manual",
    parent_sku: null,
  });

  // ------------------------------------------------------
  // STATE: VALORES ORIGINAIS (para alertas no modo EDIT)
  // ------------------------------------------------------
  const [originalSku, setOriginalSku] = useState("");
  const [originalGtin, setOriginalGtin] = useState("");

  // ------------------------------------------------------
  // STATE: VARIAÇÕES (UI only)
  // - Cada variação tem SKU e EAN próprios
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
  // HIDRATAR FORM (modo edição)
  // ------------------------------------------------------
  useEffect(() => {
    // ------------------------------------------------------
    // Carrega dados iniciais do produto (quando edit)
    // ------------------------------------------------------
    if (initialProduct) {
      setProduct((prev) => ({
        ...prev,
        ...initialProduct,
      }));

      // ------------------------------------------------------
      // Guarda valores originais para alerta de mudança SKU/GTIN
      // ------------------------------------------------------
      setOriginalSku(initialProduct.sku || "");
      setOriginalGtin(initialProduct.gtin || "");
    } else {
      // ------------------------------------------------------
      // Modo create: mantém originais vazios
      // ------------------------------------------------------
      setOriginalSku("");
      setOriginalGtin("");
    }

    // ------------------------------------------------------
    // Carrega variações iniciais (quando edit)
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
  // - Se alterar sku/gtin, exibe aviso (UI only)
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
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
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
  // COPIAR DESCRIÇÃO (UX)
  // ------------------------------------------------------
  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(product.description || "");
      console.log("✅ Descrição copiada");
    } catch (err) {
      console.error("❌ Falha ao copiar descrição:", err);
    }
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
const handleSubmit = () => {
  // ------------------------------------------------------
  // VALIDAÇÃO UX — ABA DADOS BÁSICOS
  // ------------------------------------------------------
  const okBasic = validateBasicTab();

  // Se houver erro, volta automaticamente para a aba Básico
  if (!okBasic) {
    setActiveTab("basic");
    return;
  }

  // ------------------------------------------------------
  // Se o pai passou onSubmit, delega
  // ------------------------------------------------------
  if (typeof onSubmit === "function") {
    onSubmit({ product, variations, mode });
    return;
  }

  // ------------------------------------------------------
  // Placeholder padrão
  // ------------------------------------------------------
  console.log("Produto a salvar:", product);
  console.log("Variações a salvar:", variations);
};


// ======================================================================
// HELPER UI: Copiar conteúdo do campo (padrão ML)
// Objetivo:
// - Permitir copiar valor de Nome/SKU/EAN/NCM com 1 clique
// - Exibir feedback simples via console (por enquanto)
// ======================================================================
const handleCopyField = async (value) => {
  try {
    await navigator.clipboard.writeText(value || "");
    console.log("✅ Campo copiado");
  } catch (err) {
    console.error("❌ Falha ao copiar campo:", err);
  }
};

// ======================================================================
// HELPER UI: Render de Label com ícone de copiar (padrão Mercado Livre)
// Objetivo:
// - Reutilizar em vários campos sem repetir HTML
// - Mesmo ícone e mesma UX
// ======================================================================
const FieldLabel = ({ text, required = false, onCopy }) => {
  return (
    <div className="pf-label-row">
      <span className="pf-label-text">
        {text} {required && <span className="pf-required">*</span>}
      </span>

      <button
        type="button"
        className="pf-copy-btn"
        onClick={onCopy}
        title="Copiar"
        aria-label="Copiar"
      >
        ⧉
      </button>
    </div>
  );
};

// ======================================================================
// STATE: ERROS (UX somente)
// Regras agora:
// - Nome do produto: obrigatório
// - SKU: obrigatório
// - EAN/GTIN: somente números, até 13
// - NCM: somente números, até 8
// ======================================================================
const [errors, setErrors] = useState({});

// ======================================================================
// VALIDAR: Aba Dados Básicos (UX)
// ======================================================================
const validateBasicTab = () => {
  const nextErrors = {};

  // Nome do produto (obrigatório)
  if (!String(product.product_name || "").trim()) {
    nextErrors.product_name = "Nome do produto é obrigatório.";
  }

  // SKU (obrigatório)
  if (!String(product.sku || "").trim()) {
    nextErrors.sku = "SKU é obrigatório.";
  }

  // EAN/GTIN (opcional, mas se preencher valida)
  const gtin = String(product.gtin || "").trim();
  if (gtin) {
    if (!/^\d+$/.test(gtin)) nextErrors.gtin = "EAN/GTIN deve conter apenas números.";
    if (gtin.length > 13) nextErrors.gtin = "EAN/GTIN deve ter no máximo 13 dígitos.";
  }

// NCM (opcional, mas se preencher valida)
const ncmDigits = String(product.ncm || "").replace(/\D/g, "");

if (ncmDigits) {
  if (ncmDigits.length !== 8) {
    nextErrors.ncm = "NCM deve ter 8 dígitos.";
  }
}


  setErrors(nextErrors);
  return Object.keys(nextErrors).length === 0;
};


// ======================================================================
// MÁSCARA: NCM (8 dígitos) -> 1234.56.78
// Regras:
// - Aceita apenas números
// - Limita em 8 dígitos
// - Exibe com pontos
// ======================================================================
const formatNcm = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);

  // 1234.56.78
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
};



  return (
    <div className="pf-card pf-card--primary">
      {/*// ======================================================================
        // HEADER — PADRÃO PÁGINA (ERP)
        // - Remove botão X (modal)
        // - Adiciona "Voltar"
        // ======================================================================*/}

<div className="pf-header">
  <div className="pf-title-block">
    <h2>{title}</h2>
    <div className="pf-required-hint">* Campos obrigatórios</div>
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
  className={errors.product_name ? "pf-input-error" : ""}
  type="text"
  placeholder="Ex: Armário de cozinha 3 portas"
  value={product.product_name}
  onChange={(e) => handleChange("product_name", e.target.value)}
/>
      </div>

      {/* ==================================================
         ALERTA: SKU/GTIN alterado (modo edit)
      ================================================== */}
      {showSkuGtinAlert && (
        <div className="pf-alert">
          <strong>Atenção:</strong> alterar <strong>SKU</strong> ou{" "}
          <strong>GTIN</strong> pode impactar vínculos com anúncios e integrações.
        </div>
      )}

      {/* ==================================================
         ABAS
      ================================================== */}
      <div className="pf-tabs">
        <button
          className={activeTab === "basic" ? "active" : ""}
          onClick={() => setActiveTab("basic")}
          type="button"
        >
          Dados básicos
        </button>

        <button
          className={activeTab === "description" ? "active" : ""}
          onClick={() => setActiveTab("description")}
          type="button"
        >
          Descrição
        </button>

        <button
          className={activeTab === "stock" ? "active" : ""}
          onClick={() => setActiveTab("stock")}
          type="button"
        >
          Estoque & logística
        </button>

        <button
          className={activeTab === "pricing" ? "active" : ""}
          onClick={() => setActiveTab("pricing")}
          type="button"
        >
          Custos & precificação
        </button>

        <button
          className={activeTab === "photos" ? "active" : ""}
          onClick={() => setActiveTab("photos")}
          type="button"
        >
          Fotos
        </button>

        <button
          className={activeTab === "measures" ? "active" : ""}
          onClick={() => setActiveTab("measures")}
          type="button"
        >
          Pesos & medidas
        </button>

        <button
          className={activeTab === "variations" ? "active" : ""}
          onClick={() => setActiveTab("variations")}
          type="button"
        >
          Variações
        </button>

        <button
          className={activeTab === "ads" ? "active" : ""}
          onClick={() => setActiveTab("ads")}
          type="button"
        >
          Anúncios
        </button>

        <button
          className={activeTab === "performance" ? "active" : ""}
          onClick={() => setActiveTab("performance")}
          type="button"
        >
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
          <>
            <div className="form-row">
              <div className="form-group">
                <FieldLabel
  text="SKU"
  required
  onCopy={() => handleCopyField(product.sku)}
/>

<input
  className={errors.sku ? "pf-input-error" : ""}
  placeholder="SKU interno"
  value={product.sku}
  onChange={(e) =>
    handleChange("sku", e.target.value.replace(/\s+/g, " ").trimStart())
  }
/>

{errors.sku && <div className="pf-error">{errors.sku}</div>}
              </div>

              <div className="form-group">
                <FieldLabel
  text="EAN / GTIN"
  onCopy={() => handleCopyField(product.gtin)}
/>


<input
  className={errors.gtin ? "pf-input-error" : ""}
  inputMode="numeric"
  placeholder="Código de barras"
  value={product.gtin}
  onChange={(e) =>
    handleChange("gtin", e.target.value.replace(/\D/g, "").slice(0, 13))
  }
/>

{errors.gtin && <div className="pf-error">{errors.gtin}</div>}


              </div>

              <div className="form-group">
                <FieldLabel
  text="NCM"
  onCopy={() => handleCopyField(product.ncm)}
/>


<input
  className={errors.ncm ? "pf-input-error" : ""}
  inputMode="numeric"
  placeholder="Ex: 94036000"
  value={product.ncm}
onChange={(e) => {
  const masked = formatNcm(e.target.value);
  handleChange("ncm", masked);

  const digits = masked.replace(/\D/g, "");
  if (digits.length === 8) {
    setErrors((prev) => ({ ...prev, ncm: undefined }));
  }
}}


/>

{errors.ncm && <div className="pf-error">{errors.ncm}</div>}


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

              <div className="form-group">
                <label>Categoria Mercado Livre (ID)</label>
                <input
                  placeholder="Ex: MLB1234"
                  value={product.category_ml_id}
                  onChange={(e) => handleChange("category_ml_id", e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* =======================
            DESCRIÇÃO
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
            - Origem (texto livre)
            - Fornecedor
            - Observações
            - Lead time (dias)
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
                  onChange={(e) => handleChange("stock_quantity", e.target.value)}
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

              <div className="form-group">
                <label>Lead time (dias)</label>
                <input
                  inputMode="numeric"
                  placeholder="Ex: 2"
                  value={product.lead_time_days}
                  onChange={(e) =>
                    handleChange("lead_time_days", e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Origem (texto livre)</label>
                <input
                  placeholder="Ex: Nacional / Importado / SP / Fábrica própria..."
                  value={product.origin}
                  onChange={(e) => handleChange("origin", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Fornecedor</label>
                <input
                  placeholder="Nome do fornecedor"
                  value={product.supplier_name}
                  onChange={(e) => handleChange("supplier_name", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Observações</label>
                <input
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
            - Inclui lucro mínimo (por % e por R$)
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

            <div className="form-row">
              <div className="form-group">
                <label>Lucro mínimo (%)</label>
                <input
                  inputMode="decimal"
                  placeholder="Ex: 10"
                  value={product.min_profit_percentage}
                  onChange={(e) => handleChange("min_profit_percentage", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Lucro mínimo (R$)</label>
                <input
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
            - Campo do Supabase: product_images
        ======================= */}
        {activeTab === "photos" && (
          <>
            <p className="hint">
              Adicione até <strong>7 fotos</strong>. Elas poderão ser usadas para
              atualizar anúncios em todos os canais.
            </p>

            <div className="photo-uploader">
              <button className="btn-secondary" type="button">
                Adicionar fotos
              </button>
            </div>

            {/* ------------------------------------------------------
               Placeholder técnico: por enquanto não há upload real
               Quando integrar, salvamos URLs/paths em product_images
            ------------------------------------------------------ */}
            <div className="hint" style={{ marginTop: 12 }}>
              Campo alvo no Supabase: <strong>product_images</strong>
            </div>
          </>
        )}

        {/* =======================
            PESOS & MEDIDAS
            - Alinhado com Supabase
            - ENVIO: width / height / length / weight
            - MONTADO: assembled_*
        ======================= */}
        {activeTab === "measures" && (
          <>
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
                    value={product.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Altura (cm)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 15"
                    value={product.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Comprimento (cm)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 45"
                    value={product.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Ex: 2.350"
                    value={product.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
              </div>
            </div>

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
                    value={product.assembled_width}
                    onChange={(e) => handleChange("assembled_width", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Altura (cm)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 80"
                    value={product.assembled_height}
                    onChange={(e) => handleChange("assembled_height", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Comprimento (cm)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 42"
                    value={product.assembled_length}
                    onChange={(e) => handleChange("assembled_length", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Ex: 8.500"
                    value={product.assembled_weight}
                    onChange={(e) => handleChange("assembled_weight", e.target.value)}
                  />
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
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleAddVariation}
                >
                  + Adicionar variação
                </button>
              </div>
            </div>

            {variations.map((v, index) => (
              <div className="section" key={v.id}>
                <div className="pf-variation-head">
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {v.variation_name || `Variação ${index + 1}`}
                    </h3>
                    <p className="section-subtitle" style={{ marginTop: 6 }}>
                      Configure atributo, valor, SKU, EAN e estoque da variação.
                    </p>
                  </div>

                  <div className="pf-variation-actions">
                    <label className="pf-switch">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) =>
                          handleVariationChange(v.id, "active", e.target.checked)
                        }
                      />
                      Ativa
                    </label>

                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => handleRemoveVariation(v.id)}
                      disabled={variations.length === 1}
                      title={
                        variations.length === 1
                          ? "Mantenha ao menos 1 variação"
                          : "Remover variação"
                      }
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Nome da variação (opcional)</label>
                    <input
                      placeholder="Ex: Cor Preto"
                      value={v.variation_name}
                      onChange={(e) =>
                        handleVariationChange(v.id, "variation_name", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Atributo</label>
                    <input
                      placeholder="Ex: Cor"
                      value={v.attribute}
                      onChange={(e) =>
                        handleVariationChange(v.id, "attribute", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor</label>
                    <input
                      placeholder="Ex: Preto"
                      value={v.value}
                      onChange={(e) =>
                        handleVariationChange(v.id, "value", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>SKU da variação</label>
                    <input
                      placeholder="Ex: ARM-COZ-PT-01"
                      value={v.sku}
                      onChange={(e) =>
                        handleVariationChange(v.id, "sku", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>EAN</label>
                    <input
                      inputMode="numeric"
                      placeholder="Ex: 7891234567890"
                      value={v.ean}
                      onChange={(e) =>
                        handleVariationChange(
                          v.id,
                          "ean",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Estoque da variação</label>
                    <input
                      inputMode="numeric"
                      placeholder="Ex: 10"
                      value={v.stock}
                      onChange={(e) =>
                        handleVariationChange(
                          v.id,
                          "stock",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Preço (opcional)</label>
                    <input
                      inputMode="decimal"
                      placeholder="Ex: 199,90"
                      value={v.price}
                      onChange={(e) =>
                        handleVariationChange(v.id, "price", e.target.value)
                      }
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

            <button className="btn-secondary" type="button">
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

            <button className="btn-secondary" type="button">
              Ver relatório (em breve)
            </button>
          </div>
        )}
      </div>

      {/* ==================================================
         FOOTER
      ================================================== */}
      <div className="pf-footer pf-footer-right">
        <button className="btn-primary" onClick={handleSubmit} type="button">
          {mode === "edit" ? "Salvar alterações" : "Salvar produto"}
        </button>
      </div>
    </div>
  );
}
