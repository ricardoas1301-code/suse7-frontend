// ======================================================================
// COMPONENTE: ProductForm
// Objetivo:
// - Cadastro / edição de produto em modo PÁGINA (Suse7)
// - Abas (nova ordem): Dados, Custos & precificação, Imagens, Variações,
//                      Descrição, Estoque, Pesos & Medidas, Anúncios,
//                      Vendas & desempenho
// - Variações no padrão Bling: atributo + opções (chips) -> gerar combinações
// - UI only por enquanto (salvar/back-end depois)
// Regras do projeto:
// - Sem lógica sensível no frontend (validações fortes irão para backend)
// - Código comentado por bloco/purpose (padrão Suse7)
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
  // CONTROLE DE ABAS (nova ordem)
  // ------------------------------------------------------
  const TABS = useMemo(
    () => [
      { key: "data", label: "Dados" },
      { key: "costs", label: "Custos & precificação" },
      { key: "images", label: "Imagens" },
      { key: "variations", label: "Variações" },
      { key: "description", label: "Descrição" },
      { key: "stock", label: "Estoque" },
      { key: "measures", label: "Pesos & Medidas" },
      { key: "ads", label: "Anúncios" },
      { key: "performance", label: "Vendas & desempenho" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("data");

  // ------------------------------------------------------
  // HELPER: ID seguro (evita quebrar em browsers)
  // ------------------------------------------------------
  const createId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  // ------------------------------------------------------
  // STATE: PRODUTO (UI only)
  // Observação: mantemos campos antigos para compatibilidade,
  // mas a UI reflete o novo desenho (mais enxuto e seller-friendly).
  // ------------------------------------------------------
  const [product, setProduct] = useState({
    // ======================================================
    // DADOS
    // ======================================================
    product_name: "",
    format: "simple", // "simple" | "variations" | "bundle"
    sku: "",
    gtin: "",
    ncm: "",
    brand: "",
    model: "",
    seo_keywords: "",

    // Imagem principal (opcional: se vier do banco, exibimos)
    // Pode ser URL, key de storage, etc. (depende do seu backend/storage)
    main_image_url: "",

    // ======================================================
    // DESCRIÇÃO
    // ======================================================
    description: "",

    // ======================================================
    // CUSTOS & PRECIFICAÇÃO (novos campos)
    // ======================================================
    cost_price: "",
    packaging_cost: "",
    operational_cost: "",
    min_profit_percentage: "",
    min_profit_value: "",

    // Compatibilidade (campo antigo)
    fixed_costs: "",

    // ======================================================
    // ESTOQUE (novo desenho)
    // ======================================================
    stock_quantity: 0, // estoque real
    stock_min_quantity: "",
    use_virtual_stock: false,
    virtual_stock_value: "",
    notes: "",

    // Compatibilidade (campos antigos)
    stock_source: "manual",
    lead_time_days: "",
    origin: "",
    supplier_name: "",

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
    // IMAGENS (compatibilidade / futuro)
    // ======================================================
    product_images: null,

    // ======================================================
    // SISTEMA
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
  // STATE: ERROS (UX only)
  // ------------------------------------------------------
  const [errors, setErrors] = useState({});

  // ------------------------------------------------------
  // VARIAÇÕES (novo padrão Bling)
  // ------------------------------------------------------
  const [varAttrName, setVarAttrName] = useState(""); // Nome do atributo (ex: Cor)
  const [varOptionInput, setVarOptionInput] = useState(""); // Input das opções (chips)
  const [varOptionChips, setVarOptionChips] = useState([]); // ["Preto","Azul"]

  // Lista de atributos adicionados (definições)
  const [variationDefinitions, setVariationDefinitions] = useState([]);
  // Combinações finais (itens gerados)
  const [variations, setVariations] = useState([]);

  // ------------------------------------------------------
  // HIDRATAR FORM (modo edição)
  // ------------------------------------------------------
  useEffect(() => {
    // Produto inicial
    if (initialProduct) {
      setProduct((prev) => ({
        ...prev,
        ...initialProduct,

        // Back-compat: se vier fixed_costs, cair em operational_cost se vazio
        operational_cost:
          initialProduct.operational_cost ??
          prev.operational_cost ??
          initialProduct.fixed_costs ??
          "",
      }));

      setOriginalSku(initialProduct.sku || "");
      setOriginalGtin(initialProduct.gtin || "");
    } else {
      setOriginalSku("");
      setOriginalGtin("");
    }

    // Variações iniciais (suporta legado e novo formato)
    if (Array.isArray(initialVariations) && initialVariations.length > 0) {
      const mapped = initialVariations.map((v) => {
        // Novo formato: já vem com attributes {}
        if (v.attributes && typeof v.attributes === "object") {
          return {
            id: v.id || createId(),
            attributes: v.attributes || {},
            sku: v.sku || "",
            ean: v.ean || "",
            stock: v.stock || "",
            price: v.price || "",
            image_url: v.image_url || "",
            active: typeof v.active === "boolean" ? v.active : true,
          };
        }

        // Legado: attribute + value
        const attr = v.attribute || "Atributo";
        const val = v.value || "";
        return {
          id: v.id || createId(),
          attributes: { [attr]: val },
          sku: v.sku || "",
          ean: v.ean || "",
          stock: v.stock || "",
          price: v.price || "",
          image_url: v.image_url || "",
          active: typeof v.active === "boolean" ? v.active : true,
        };
      });

      setVariations(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct, initialVariations]);

  // ------------------------------------------------------
  // ALERTA SKU/GTIN (modo edit)
  // - Em modo variações, o SKU do produto vira SKU Pai (interno)
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
  // HELPER UI: copiar conteúdo do campo
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
  // HELPER: imagem principal (Img1) vindo do próprio product
  // - Prioridade: main_image_url > primeira de product_images (se array) > null
  // ------------------------------------------------------
  const mainImage = useMemo(() => {
    if (String(product.main_image_url || "").trim()) return product.main_image_url;

    // Se no futuro product_images virar array (urls/keys)
    if (Array.isArray(product.product_images) && product.product_images.length > 0) {
      return product.product_images[0];
    }

    // Se vier como string JSON (caso backend salve assim), tentativa safe
    if (typeof product.product_images === "string") {
      try {
        const parsed = JSON.parse(product.product_images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {
        // ignora
      }
    }

    return "";
  }, [product.main_image_url, product.product_images]);

  // ------------------------------------------------------
  // VALIDAR: Aba Dados (UX)
  // Obs.: validações fortes vão pro backend depois.
  // ------------------------------------------------------
  const validateDataTab = () => {
    const nextErrors = {};

    if (!String(product.product_name || "").trim()) {
      nextErrors.product_name = "Nome do produto é obrigatório.";
    }

    if (!String(product.sku || "").trim()) {
      nextErrors.sku =
        product.format === "variations"
          ? "SKU Pai (interno) é obrigatório."
          : "SKU é obrigatório.";
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
  // VARIAÇÕES: CHIP INPUT (Enter/Tab/Comma)
  // ------------------------------------------------------
  const normalizeChip = (raw) =>
    String(raw || "")
      .replace(/\s+/g, " ")
      .trim();

  const addChip = (raw) => {
    const val = normalizeChip(raw);
    if (!val) return;

    // Evita duplicado (case-insensitive)
    const exists = varOptionChips.some((c) => c.toLowerCase() === val.toLowerCase());
    if (exists) return;

    setVarOptionChips((prev) => [...prev, val]);
    setVarOptionInput("");
  };

  const removeChip = (chip) => {
    setVarOptionChips((prev) => prev.filter((c) => c !== chip));
  };

  const handleOptionKeyDown = (e) => {
    const key = e.key;

    // Separadores: Enter, Tab e vírgula
    if (key === "Enter" || key === "Tab" || key === ",") {
      e.preventDefault();
      addChip(varOptionInput);
      return;
    }

    // Backspace com input vazio remove o último chip
    if (key === "Backspace" && !varOptionInput && varOptionChips.length > 0) {
      const last = varOptionChips[varOptionChips.length - 1];
      removeChip(last);
    }
  };

  // ------------------------------------------------------
  // VARIAÇÕES: adicionar definição (atributo + opções)
  // ------------------------------------------------------
  const handleAddVariationDefinition = () => {
    const attr = normalizeChip(varAttrName);
    if (!attr) return;

    if (varOptionInput) addChip(varOptionInput);

    const options = [...varOptionChips].filter(Boolean);
    if (options.length === 0) return;

    // Evita duplicar atributo
    const already = variationDefinitions.some(
      (d) => String(d.attribute_name || "").toLowerCase() === attr.toLowerCase()
    );
    if (already) return;

    const nextDefs = [...variationDefinitions, { attribute_name: attr, options }];
    setVariationDefinitions(nextDefs);

    // Reset builder
    setVarAttrName("");
    setVarOptionInput("");
    setVarOptionChips([]);

    // Gerar combinações
    const nextRows = buildCombinations(nextDefs, variations, createId);
    setVariations(nextRows);
  };

  // ------------------------------------------------------
  // VARIAÇÕES: remover uma definição
  // ------------------------------------------------------
  const handleRemoveVariationDefinition = (attribute_name) => {
    const nextDefs = variationDefinitions.filter((d) => d.attribute_name !== attribute_name);
    setVariationDefinitions(nextDefs);

    const nextRows = buildCombinations(nextDefs, variations, createId);
    setVariations(nextRows);
  };

  // ------------------------------------------------------
  // VARIAÇÕES: atualizar um item gerado (grid)
  // ------------------------------------------------------
  const handleVariationRowChange = (id, field, value) => {
    setVariations((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleToggleVariationActive = (id, checked) => {
    setVariations((prev) =>
      prev.map((row) => (row.id === id ? { ...row, active: checked } : row))
    );
  };

  const handleRemoveVariationRow = (id) => {
    setVariations((prev) => prev.filter((row) => row.id !== id));
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
  const handleSubmit = () => {
    const okData = validateDataTab();
    if (!okData) {
      setActiveTab("data");
      return;
    }

    // Se formato for "variations", mas não tem combinações, alerta suave
    if (product.format === "variations" && variations.length === 0) {
      setActiveTab("variations");
      setErrors((prev) => ({
        ...prev,
        variations: "Cadastre ao menos 1 variação para produtos com variações.",
      }));
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit({
        product,
        variation_definitions: variationDefinitions,
        variations,
        mode,
      });
      return;
    }

    console.log("Produto a salvar:", product);
    console.log("Defs variações:", variationDefinitions);
    console.log("Variações (combinações) a salvar:", variations);
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

  // ------------------------------------------------------
  // Labels dinâmicos conforme Formato
  // ------------------------------------------------------
  const skuLabel = product.format === "variations" ? "SKU Pai (interno)" : "SKU";
  const gtinLabel =
    product.format === "variations" ? "EAN / GTIN (opcional no Pai)" : "EAN / GTIN";

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
        {TABS.map((t) => {
          // Se não for produto com variações, desabilita aba "Variações"
          const disabled = t.key === "variations" && product.format !== "variations";

          return (
            <button
              key={t.key}
              className={activeTab === t.key ? "active" : ""}
              onClick={() => setActiveTab(t.key)}
              type="button"
              disabled={disabled}
              title={
                disabled
                  ? "Ative o formato 'Com variações' na aba Dados para usar esta aba."
                  : undefined
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ==================================================
         BODY
      ================================================== */}
      <div className="pf-body">
        {/* =======================
            DADOS
        ======================= */}
        {activeTab === "data" && (
          <div className="pf-container">
            {/* Img1 produto (preview) */}
            <div className="pf-row pf-row--tight">
              <div className="pf-group pf-group--full">
                <div className="pf-image-row">
                  <div className="pf-image-preview">
                    {mainImage ? (
                      <img src={mainImage} alt="Imagem principal do produto" />
                    ) : (
                      <div className="pf-image-placeholder">Img1 produto</div>
                    )}
                  </div>

                  <div className="pf-image-info">
                    <div className="s7-label">Img1 produto</div>
                    <div className="s7-hint">
                      Exibimos a imagem principal do produto a partir da tabela <strong>products</strong>.
                    </div>
                    <div className="s7-hint">
                      (Campo sugerido: <strong>main_image_url</strong> ou 1ª imagem de{" "}
                      <strong>product_images</strong>)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formato + SKU + GTIN + NCM */}
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Formato</label>
                <select
                  className="s7-select"
                  value={product.format}
                  onChange={(e) => handleChange("format", e.target.value)}
                >
                  <option value="simple">Simples</option>
                  <option value="variations">Com variações</option>
                  <option value="bundle">Com composição</option>
                </select>

                {product.format === "variations" && (
                  <div className="s7-hint">
                    SKU/EAN serão cadastrados por variação. Aqui você define o <strong>SKU Pai</strong>.
                  </div>
                )}
              </div>

              <div className="pf-group">
                <FieldLabel text={skuLabel} required onCopy={() => handleCopyField(product.sku)} />
                <input
                  className={`s7-input ${errors.sku ? "s7-input--error" : ""}`}
                  placeholder={product.format === "variations" ? "SKU pai (interno)" : "SKU interno"}
                  value={product.sku}
                  onChange={(e) =>
                    handleChange("sku", e.target.value.replace(/\s+/g, " ").trimStart())
                  }
                />
                {errors.sku && <div className="s7-error">{errors.sku}</div>}
              </div>

              <div className="pf-group">
                <FieldLabel text={gtinLabel} onCopy={() => handleCopyField(product.gtin)} />
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

            {/* Marca / Modelo */}
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Marca</label>
                <input
                  className="s7-input"
                  value={product.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Modelo</label>
                <input
                  className="s7-input"
                  value={product.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>
            </div>

            {/* SEO Keywords (maior e mais “encostado”) */}
            <div className="pf-row pf-row--tight">
              <div className="pf-group pf-group--full">
                <FieldLabel
                  text="Palavras-chave SEO"
                  onCopy={() => handleCopyField(product.seo_keywords)}
                />

                <div className="pf-seo-wrapper">
                  <textarea
                    className="s7-textarea pf-seo-textarea"
                    rows="5"
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
            CUSTOS & PRECIFICAÇÃO
        ======================= */}
        {activeTab === "costs" && (
          <>
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Custo do produto</label>
                <input
                  className="s7-input"
                  inputMode="decimal"
                  placeholder="Ex: 49,90"
                  value={product.cost_price}
                  onChange={(e) => handleChange("cost_price", e.target.value)}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Custo Embalagem</label>
                <input
                  className="s7-input"
                  inputMode="decimal"
                  placeholder="Ex: 3,50"
                  value={product.packaging_cost}
                  onChange={(e) => handleChange("packaging_cost", e.target.value)}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Custo Operacional</label>
                <input
                  className="s7-input"
                  inputMode="decimal"
                  placeholder="Ex: 8,00"
                  value={product.operational_cost}
                  onChange={(e) => handleChange("operational_cost", e.target.value)}
                />
                <div className="s7-hint">
                  (Frete interno, etiquetas, perdas, custo de operação, etc.)
                </div>
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
            IMAGENS
        ======================= */}
        {activeTab === "images" && (
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
            VARIAÇÕES (padrão Bling)
        ======================= */}
        {activeTab === "variations" && (
          <>
            <div className="section">
              <div className="section-header">
                <h3>Variações</h3>
                <p className="section-subtitle">
                  Cadastre atributos (ex: Cor, Tamanho) e opções. Ao adicionar, o Suse7 gera as
                  combinações abaixo.
                </p>
              </div>

              {errors.variations && <div className="s7-error">{errors.variations}</div>}

              {/* Builder: Nome do atributo + opções (chips) */}
              <div className="pf-row pf-row--tight" style={{ marginTop: 12 }}>
                <div className="pf-group">
                  <label className="s7-label">Nome do atributo</label>
                  <input
                    className="s7-input"
                    placeholder="Ex: Cor, tamanho, voltagem..."
                    value={varAttrName}
                    onChange={(e) => setVarAttrName(e.target.value)}
                  />
                </div>

                <div className="pf-group pf-group--wide">
                  <label className="s7-label">Opções</label>

                  <div className="pf-chipbox">
                    {varOptionChips.map((chip) => (
                      <span className="pf-chip" key={chip}>
                        {chip}
                        <button
                          type="button"
                          className="pf-chip-x"
                          onClick={() => removeChip(chip)}
                          aria-label={`Remover ${chip}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      className="pf-chipbox-input"
                      placeholder={varOptionChips.length === 0 ? "Digite e pressione Enter..." : ""}
                      value={varOptionInput}
                      onChange={(e) => setVarOptionInput(e.target.value)}
                      onKeyDown={handleOptionKeyDown}
                    />
                  </div>

                  <div className="s7-hint" style={{ marginTop: 6 }}>
                    Separe as opções pressionando <strong>Enter</strong> ou <strong>Tab</strong>.
                  </div>
                </div>

                <div className="pf-group pf-group--btn">
                  <label className="s7-label" style={{ opacity: 0 }}>
                    Ação
                  </label>
                  <button
                    className="s7-btn s7-btn--secondary"
                    type="button"
                    onClick={handleAddVariationDefinition}
                    title="Adicionar variação"
                  >
                    Adicionar variação
                  </button>
                </div>
              </div>

              {/* Variações cadastradas (definições) */}
              {variationDefinitions.length > 0 && (
                <div className="pf-var-defs">
                  <div className="s7-label" style={{ marginBottom: 8 }}>
                    Variações cadastradas
                  </div>

                  {variationDefinitions.map((d) => (
                    <div className="pf-var-def" key={d.attribute_name}>
                      <div className="pf-var-def-left">
                        <div className="pf-var-def-name">{d.attribute_name}</div>
                        <div className="pf-var-def-chips">
                          {d.options.map((opt) => (
                            <span className="pf-chip pf-chip--muted" key={`${d.attribute_name}-${opt}`}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="s7-btn s7-btn--secondary"
                        onClick={() => handleRemoveVariationDefinition(d.attribute_name)}
                        title="Remover esta variação"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grid das combinações */}
            {variations.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h3>Combinações geradas</h3>
                  <p className="section-subtitle">
                    Preencha SKU/EAN/Preço/Estoque por variação. (No futuro: validações no backend)
                  </p>
                </div>

                <div className="pf-var-table">
                  <div className="pf-var-table-head">
                    <div>#</div>
                    <div>Combinação</div>
                    <div>SKU</div>
                    <div>EAN</div>
                    <div>Preço</div>
                    <div>Estoque</div>
                    <div>Situação</div>
                    <div>Ações</div>
                  </div>

                  {variations.map((row, idx) => (
                    <div className="pf-var-table-row" key={row.id}>
                      <div className="pf-var-idx">{idx + 1}</div>

                      <div className="pf-var-combo">
                        {Object.entries(row.attributes || {}).map(([k, v]) => (
                          <span className="pf-chip pf-chip--muted" key={`${row.id}-${k}-${v}`}>
                            <strong>{k}:</strong>&nbsp;{v}
                          </span>
                        ))}
                      </div>

                      <div>
                        <input
                          className="s7-input"
                          placeholder="SKU variação"
                          value={row.sku}
                          onChange={(e) => handleVariationRowChange(row.id, "sku", e.target.value)}
                        />
                      </div>

                      <div>
                        <input
                          className="s7-input"
                          inputMode="numeric"
                          placeholder="EAN"
                          value={row.ean}
                          onChange={(e) =>
                            handleVariationRowChange(row.id, "ean", e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>

                      <div>
                        <input
                          className="s7-input"
                          inputMode="decimal"
                          placeholder="Ex: 199,90"
                          value={row.price}
                          onChange={(e) => handleVariationRowChange(row.id, "price", e.target.value)}
                        />
                      </div>

                      <div>
                        <input
                          className="s7-input"
                          inputMode="numeric"
                          placeholder="Ex: 10"
                          value={row.stock}
                          onChange={(e) =>
                            handleVariationRowChange(row.id, "stock", e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>

                      <div className="pf-var-status">
                        <label className="pf-switch">
                          <input
                            type="checkbox"
                            checked={!!row.active}
                            onChange={(e) => handleToggleVariationActive(row.id, e.target.checked)}
                          />
                          Ativo
                        </label>
                      </div>

                      <div className="pf-var-actions">
                        <button
                          className="s7-btn s7-btn--secondary"
                          type="button"
                          onClick={() => handleRemoveVariationRow(row.id)}
                          title="Remover combinação"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* =======================
            DESCRIÇÃO
        ======================= */}
        {activeTab === "description" && (
          <div className="pf-group">
            <FieldLabel
              text="Descrição do produto"
              onCopy={() => handleCopyField(product.description)}
            />
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
            ESTOQUE
        ======================= */}
        {activeTab === "stock" && (
          <>
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Estoque (real)</label>
                <input
                  className="s7-input"
                  inputMode="numeric"
                  placeholder="Ex: 25"
                  value={product.stock_quantity}
                  onChange={(e) => handleChange("stock_quantity", e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="pf-group">
                <label className="s7-label">Estoque mínimo (real)</label>
                <input
                  className="s7-input"
                  inputMode="numeric"
                  placeholder="Ex: 5"
                  value={product.stock_min_quantity}
                  onChange={(e) =>
                    handleChange("stock_min_quantity", e.target.value.replace(/\D/g, ""))
                  }
                />
                <div className="s7-hint">
                  Quando o real atingir o mínimo, enviaremos alerta ao seller.
                </div>
              </div>

              <div className="pf-group">
                <label className="s7-label">Usar estoque virtual?</label>

                <label className="pf-switch">
                  <input
                    type="checkbox"
                    checked={!!product.use_virtual_stock}
                    onChange={(e) => handleChange("use_virtual_stock", e.target.checked)}
                  />
                  Ativar
                </label>

                <div className="s7-hint">
                  Quando ativo, é o estoque virtual que será sincronizado nos marketplaces.
                </div>
              </div>
            </div>

            {product.use_virtual_stock && (
              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Estoque virtual (publicado)</label>
                  <input
                    className="s7-input"
                    inputMode="numeric"
                    placeholder="Ex: 200"
                    value={product.virtual_stock_value}
                    onChange={(e) =>
                      handleChange("virtual_stock_value", e.target.value.replace(/\D/g, ""))
                    }
                  />

                  <div className="s7-hint">
                    Regras futuras:
                    <br />• Venda decrementa real e virtual
                    <br />• Se real acabar, anúncio pausa mesmo que virtual &gt; 0
                    <br />• Aviso quando virtual chegar em 40% do valor configurado
                  </div>
                </div>
              </div>
            )}

            <div className="pf-row pf-row--tight">
              <div className="pf-group pf-group--full">
                <label className="s7-label">Observações</label>
                <input
                  className="s7-input"
                  placeholder="Notas internas sobre estoque"
                  value={product.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
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
                <p className="s7-card__subtitle">
                  Medidas usadas para cálculo de frete e logística.
                </p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 30"
                    value={product.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 15"
                    value={product.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 45"
                    value={product.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 2.350"
                    value={product.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="s7-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas do produto (montado)</h3>
                <p className="s7-card__subtitle">
                  Medidas reais do produto pronto/montado (referência interna).
                </p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 32"
                    value={product.assembled_width}
                    onChange={(e) => handleChange("assembled_width", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 80"
                    value={product.assembled_height}
                    onChange={(e) => handleChange("assembled_height", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
                    placeholder="Ex: 42"
                    value={product.assembled_length}
                    onChange={(e) => handleChange("assembled_length", e.target.value)}
                  />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input
                    className="s7-input"
                    inputMode="decimal"
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

/* ======================================================================
   FUNÇÃO: buildCombinations
   Objetivo:
   - A partir das definições (atributos + opções), gerar as combinações
   - Preservar dados já preenchidos (SKU/EAN/preço/estoque/ativo) quando possível
====================================================================== */
function buildCombinations(defs, previousRows, createId) {
  // Sem definições -> sem combinações
  if (!Array.isArray(defs) || defs.length === 0) return [];

  // Produto cartesiano das opções
  const cartesian = (arrs) =>
    arrs.reduce((acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])), [[]]);

  const attrNames = defs.map((d) => d.attribute_name);
  const optionsMatrix = defs.map((d) => d.options || []);

  const combos = cartesian(optionsMatrix).map((values) => {
    const attributes = {};
    values.forEach((v, idx) => (attributes[attrNames[idx]] = v));
    return attributes;
  });

  // Map de preservação (chave determinística)
  const makeKey = (attributes) =>
    Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");

  const prevMap = new Map();
  (previousRows || []).forEach((row) => {
    const key = makeKey(row.attributes || {});
    prevMap.set(key, row);
  });

  return combos.map((attributes) => {
    const key = makeKey(attributes);
    const prev = prevMap.get(key);

    return {
      id: prev?.id || createId(),
      attributes,
      sku: prev?.sku || "",
      ean: prev?.ean || "",
      stock: prev?.stock || "",
      price: prev?.price || "",
      image_url: prev?.image_url || "",
      active: typeof prev?.active === "boolean" ? prev.active : true,
    };
  });
}
