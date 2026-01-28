// ======================================================================
// COMPONENTE: ProductForm (v2)
// Objetivo:
// - Cadastro/edição de produtos (modo página)
// - Abas (nova ordem):
//   Dados | Custos & precificação | Imagens | Variações | Descrição |
//   Estoque | Pesos & Medidas | Anúncios | Vendas & desempenho
//
// Regras (Suse7):
// - Frontend: UI/UX apenas (sem regra sensível).
// - Backend: validações definitivas, integrações e cálculos.
// - Precisão financeira: campos de valores seguem numeric no banco;
//   aqui (UI) mantemos strings onde o usuário digita.
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import "./ProductForm.css";


export default function ProductForm({
  title = "Novo produto",
  mode = "create", // "create" | "edit"
  initialProduct = null,
  initialVariants = null, // lista de product_variants (quando edit)
  onCancel = null,
  onSubmit = null,
}) {
  // ------------------------------------------------------
  // CONTROLE DE ABAS (nova ordem)
  // ------------------------------------------------------
  const [activeTab, setActiveTab] = useState("data");

  // ------------------------------------------------------
  // HELPER: ID seguro (evita quebrar em browsers)
  // ------------------------------------------------------
  const createId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  // ------------------------------------------------------
  // STATE: PRODUTO (alinhado com tabela products)
  // ------------------------------------------------------
  const [product, setProduct] = useState({
    // =========================
    // DADOS
    // =========================
    product_name: "",
    format: "simple", // "simple" | "variants"
    sku: "",
    gtin: "",
    ncm: "",
    brand: "",
    model: "",
    seo_keywords: "",

    // =========================
    // CUSTOS & PRECIFICAÇÃO
    // =========================
    cost_price: "",
    packaging_cost: "",
    operational_cost: "",
    min_profit_percentage: "",
    min_profit_value: "",

    // =========================
    // DESCRIÇÃO
    // =========================
    description: "",

    // =========================
    // ESTOQUE
    // =========================
    stock_quantity: 0,
    stock_minimum: 0,
    use_virtual_stock: false,
    virtual_stock_quantity: 0,
    notes: "",

    // =========================
    // PESOS & MEDIDAS
    // =========================
    width: "",
    height: "",
    length: "",
    weight: "",
    assembled_width: "",
    assembled_height: "",
    assembled_length: "",
    assembled_weight: "",

    // =========================
    // IMAGENS (UI only por enquanto)
    // - hoje seu banco está text; pode ser URL única ou serializado.
    // - aqui a gente só exibe preview (Img1) se vier.
    // =========================
    product_images: null,

    // =========================
    // SISTEMA
    // =========================
    active: true,
  });

  // ------------------------------------------------------
  // STATE: ERROS (UX)
  // ------------------------------------------------------
  const [errors, setErrors] = useState({});

  // ------------------------------------------------------
  // VARIAÇÕES (estilo Bling)
  // 1) variationAttributes: lista de atributos cadastrados (Cor, Tamanho)
  // 2) draft: inputs para cadastrar novo atributo + opções (chips)
  // 3) variantRows: combinações geradas (cada uma vira product_variants)
  // ------------------------------------------------------
  const [variationAttributes, setVariationAttributes] = useState([]);
  const [draftAttrName, setDraftAttrName] = useState("");
  const [draftOptionInput, setDraftOptionInput] = useState("");
  const [draftOptions, setDraftOptions] = useState([]);

  const [variantRows, setVariantRows] = useState([]);

  // ------------------------------------------------------
  // HIDRATAR FORM (modo edição)
  // ------------------------------------------------------
  useEffect(() => {
    if (initialProduct) {
      setProduct((prev) => ({ ...prev, ...initialProduct }));
    }

    // Se vierem variantes prontas (edit), carregamos no grid
    // Esperado: [{ sku, gtin, price, stock_quantity, active, attributes }]
    if (Array.isArray(initialVariants) && initialVariants.length > 0) {
      setVariantRows(
        initialVariants.map((v) => ({
          id: v.id || createId(),
          sku: v.sku || "",
          gtin: v.gtin || "",
          price: v.price ?? "",
          stock_quantity: v.stock_quantity ?? 0,
          active: typeof v.active === "boolean" ? v.active : true,
          attributes: v.attributes || {},
        }))
      );

      // Tenta reconstruir variationAttributes a partir de attributes existentes (best effort)
      const attrMap = new Map();
      initialVariants.forEach((v) => {
        const attrs = v.attributes || {};
        Object.entries(attrs).forEach(([k, val]) => {
          if (!attrMap.has(k)) attrMap.set(k, new Set());
          attrMap.get(k).add(String(val));
        });
      });

      const reconstructed = Array.from(attrMap.entries()).map(([name, setVals]) => ({
        id: createId(),
        name,
        options: Array.from(setVals),
      }));

      if (reconstructed.length > 0) {
        setVariationAttributes(reconstructed);
        setProduct((prev) => ({ ...prev, format: "variants" }));
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct, initialVariants]);

  // ------------------------------------------------------
  // HANDLER GENÉRICO
  // ------------------------------------------------------
  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // ------------------------------------------------------
  // MÁSCARAS / VALIDADORES (UX)
  // ------------------------------------------------------
  const formatNcm = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  };

  const isDigitsOnly = (v) => /^\d+$/.test(String(v || ""));

  // ------------------------------------------------------
  // FORMATO: SIMPLE x VARIANTS (regra de UX)
  // - simple: SKU/GTIN no products
  // - variants: SKU/GTIN por variação (product_variants)
  // ------------------------------------------------------
  const handleFormatChange = (nextFormat) => {
    setProduct((prev) => {
      // Se mudou para variants, limpamos SKU/GTIN do produto para evitar duplicidade/confusão
      if (nextFormat === "variants") {
        return { ...prev, format: nextFormat, sku: "", gtin: "" };
      }

      // Se voltou para simple, limpamos estrutura de variações (UI)
      return { ...prev, format: nextFormat };
    });

    if (nextFormat === "simple") {
      setVariationAttributes([]);
      setDraftAttrName("");
      setDraftOptionInput("");
      setDraftOptions([]);
      setVariantRows([]);
    }
  };

  // ------------------------------------------------------
  // UI: Copiar campo
  // ------------------------------------------------------
  const handleCopyField = async (value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      console.log("✅ Campo copiado");
    } catch (err) {
      console.error("❌ Falha ao copiar campo:", err);
    }
  };

// ======================================================
// COMPONENTE: FieldLabel (label + info + copiar)
// Objetivo:
// - Tooltip via Design System: .s7-tip + data-tip
// - infoBottom: tooltip do "i" aparece abaixo
// - infoWrap: tooltip do "i" pode quebrar linha (texto longo)
// - copyBottom: tooltip do copiar aparece abaixo (padrão true)
// - side: posicionamento lateral do tooltip (left/right)
// ======================================================
const FieldLabel = ({
  text,
  required = false,
  onCopy = null,
  infoText = "",
  infoWrap = false,
  infoBottom = false,
  copyBottom = true,
  side = "left", // "left" | "right"
}) => {
  // ------------------------------------------------------
  // Helper: classes do tooltip
  // ------------------------------------------------------
  const buildTipClass = ({ bottom = false, wrap = false, side = "left" }) => {
    return [
      "s7-tip",
      bottom ? "s7-tip-bottom" : "",
      wrap ? "s7-tip-wrap" : "",
      side === "right" ? "s7-tip-right" : "s7-tip-left",
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="pf-label-row">
      <div className="pf-label-left">
        <span className="s7-label">
          {text}
          {required && <span className="s7-required">*</span>}
        </span>

        {!!infoText && (
          <button
            type="button"
            className={["pf-info-btn", buildTipClass({ bottom: infoBottom, wrap: infoWrap, side })].join(" ")}
            data-tip={infoText}
            aria-label={`Informações sobre ${text}`}
          >
            i
          </button>
        )}
      </div>

      {!!onCopy && (
        <button
          type="button"
          className={["pf-copy-btn", buildTipClass({ bottom: copyBottom, wrap: false, side: "right" })].join(" ")}
          data-tip="Copiar"
          onClick={onCopy}
          aria-label={`Copiar ${text}`}
        >
          ⧉
        </button>
      )}
    </div>
  );
};

  // ------------------------------------------------------
  // CHIPS (opções) — adiciona via Enter/Tab/virgula
  // ------------------------------------------------------
  const normalizeOption = (raw) => String(raw || "").trim().replace(/\s+/g, " ");

  const addDraftOptionsFromText = (text) => {
    const cleaned = String(text || "");
    const parts = cleaned
      .split(",")
      .map((p) => normalizeOption(p))
      .filter(Boolean);

    if (parts.length === 0) return;

    setDraftOptions((prev) => {
      const set = new Set(prev.map((x) => x.toLowerCase()));
      const next = [...prev];

      parts.forEach((p) => {
        if (!set.has(p.toLowerCase())) {
          next.push(p);
          set.add(p.toLowerCase());
        }
      });

      return next;
    });
  };

  const handleDraftOptionKeyDown = (e) => {
    // Enter ou Tab cria chip
    if (e.key === "Enter" || e.key === "Tab") {
      const value = normalizeOption(draftOptionInput);
      if (value) {
        e.preventDefault();
        addDraftOptionsFromText(value);
        setDraftOptionInput("");
      }
      return;
    }

    // Vírgula cria chip
    if (e.key === ",") {
      const value = normalizeOption(draftOptionInput);
      if (value) {
        e.preventDefault();
        addDraftOptionsFromText(value);
        setDraftOptionInput("");
      }
      return;
    }
  };

  const removeDraftOption = (opt) => {
    setDraftOptions((prev) => prev.filter((x) => x !== opt));
  };

  // ------------------------------------------------------
  // VARIAÇÕES: adicionar atributo (ex: Cor) + opções (chips)
  // ------------------------------------------------------
  const handleAddVariationAttribute = () => {
    const name = normalizeOption(draftAttrName);
    if (!name) return;

    if (!draftOptions || draftOptions.length === 0) return;

    setVariationAttributes((prev) => {
      const exists = prev.some((a) => a.name.toLowerCase() === name.toLowerCase());
      if (exists) return prev;

      const next = [...prev, { id: createId(), name, options: draftOptions }];
      return next;
    });

    // Reset draft
    setDraftAttrName("");
    setDraftOptionInput("");
    setDraftOptions([]);

    // Após adicionar, regenerar combinações
    setTimeout(() => {
      regenerateVariantRows();
    }, 0);
  };

  const handleRemoveVariationAttribute = (attrId) => {
    setVariationAttributes((prev) => prev.filter((a) => a.id !== attrId));
    setTimeout(() => {
      regenerateVariantRows(attrId);
    }, 0);
  };

  const removeOptionFromAttribute = (attrId, option) => {
    setVariationAttributes((prev) =>
      prev.map((a) => {
        if (a.id !== attrId) return a;
        return { ...a, options: a.options.filter((o) => o !== option) };
      })
    );

    setTimeout(() => {
      regenerateVariantRows();
    }, 0);
  };

  // ------------------------------------------------------
  // GERAR COMBINAÇÕES (cartesiano) e preservar dados digitados
  // ------------------------------------------------------
  const buildVariantKey = (attrsObj) => {
    // chave estável por atributos: "Cor=Azul|Tamanho=M"
    const entries = Object.entries(attrsObj || {}).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}=${String(v)}`).join("|");
  };

  const cartesian = (arrays) => {
    // arrays = [[{name,val}...], [{name,val}...]]
    return arrays.reduce((acc, curr) => {
      const next = [];
      acc.forEach((a) => {
        curr.forEach((b) => {
          next.push([...a, b]);
        });
      });
      return next;
    }, [[]]);
  };

  const regenerateVariantRows = () => {
    // Se não tiver atributos completos, limpa
    const attrs = variationAttributes
      .filter((a) => a.name && Array.isArray(a.options) && a.options.length > 0)
      .map((a) => ({
        name: a.name,
        options: a.options,
      }));

    if (attrs.length === 0) {
      setVariantRows([]);
      return;
    }

    // Monta pares para cartesiano: [[{k,v}...], ...]
    const arrays = attrs.map((a) => a.options.map((opt) => ({ k: a.name, v: opt })));
    const combos = cartesian(arrays);

    // Index atual para preservar dados
    const currentIndex = new Map();
    variantRows.forEach((row) => {
      currentIndex.set(buildVariantKey(row.attributes), row);
    });

    const nextRows = combos.map((combo) => {
      const attributesObj = combo.reduce((obj, item) => {
        obj[item.k] = item.v;
        return obj;
      }, {});

      const key = buildVariantKey(attributesObj);
      const existing = currentIndex.get(key);

      return {
        id: existing?.id || createId(),
        attributes: attributesObj,
        sku: existing?.sku || "",
        gtin: existing?.gtin || "",
        price: existing?.price ?? "",
        stock_quantity: existing?.stock_quantity ?? 0,
        active: typeof existing?.active === "boolean" ? existing.active : true,
      };
    });

    setVariantRows(nextRows);
  };

  // ------------------------------------------------------
  // VARIANT ROWS: edição inline
  // ------------------------------------------------------
  const handleVariantRowChange = (id, field, value) => {
    setVariantRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleRemoveVariantRow = (id) => {
    // Remover linha específica é permitido (ex: seller não quer uma combinação)
    setVariantRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ------------------------------------------------------
  // VALIDAR (UX)
  // ------------------------------------------------------
  const validateDataTab = () => {
    const nextErrors = {};

    if (!String(product.product_name || "").trim()) {
      nextErrors.product_name = "Nome do produto é obrigatório.";
    }

    // SKU obrigatório apenas no formato simples
    if (product.format === "simple") {
      if (!String(product.sku || "").trim()) {
        nextErrors.sku = "SKU é obrigatório no formato Simples.";
      }
    }

    // GTIN (se preenchido): números e até 13
    const gtin = String(product.gtin || "").trim();
    if (gtin) {
      if (!isDigitsOnly(gtin)) nextErrors.gtin = "EAN/GTIN deve conter apenas números.";
      else if (gtin.length > 13) nextErrors.gtin = "EAN/GTIN deve ter no máximo 13 dígitos.";
    }

    // NCM (se preenchido): 8 dígitos
    const ncmDigits = String(product.ncm || "").replace(/\D/g, "");
    if (ncmDigits) {
      if (ncmDigits.length !== 8) nextErrors.ncm = "NCM deve ter 8 dígitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateVariantsTab = () => {
    const nextErrors = {};

    if (product.format !== "variants") return true;

    if (!Array.isArray(variationAttributes) || variationAttributes.length === 0) {
      nextErrors.variants = "Adicione ao menos 1 atributo (ex: Cor) com opções.";
    }

    if (!Array.isArray(variantRows) || variantRows.length === 0) {
      nextErrors.variants = "Nenhuma combinação gerada. Verifique os atributos/opções.";
    }

    // SKU por variação (recomendado)
    const missingSku = (variantRows || []).some((r) => !String(r.sku || "").trim());
    if (missingSku) {
      nextErrors.variants_sku = "Preencha o SKU em todas as variações (evita erro na integração).";
    }

    // GTIN por variação (opcional), mas se tiver: numérico e até 13
    const badGtin = (variantRows || []).some((r) => {
      const v = String(r.gtin || "").trim();
      if (!v) return false;
      return !isDigitsOnly(v) || v.length > 13;
    });
    if (badGtin) {
      nextErrors.variants_gtin = "GTIN das variações deve ser numérico e ter até 13 dígitos.";
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  // ------------------------------------------------------
  // SUBMIT (UI only por enquanto)
  // - Alinha payload com banco:
  //   products: product
  //   product_variants: variantRows (quando format=variants)
  // ------------------------------------------------------
  const handleSubmit = () => {
    const okData = validateDataTab();
    if (!okData) {
      setActiveTab("data");
      return;
    }

    const okVariants = validateVariantsTab();
    if (!okVariants) {
      setActiveTab("variations");
      return;
    }

    const payload = {
      mode,
      product: {
        ...product,
        // Segurança de UX: se variants, SKU/GTIN do produto ficam vazios
        ...(product.format === "variants" ? { sku: "", gtin: "" } : {}),
      },
      variants:
        product.format === "variants"
          ? (variantRows || []).map((r) => ({
              sku: r.sku,
              gtin: r.gtin || null,
              price: r.price === "" ? null : r.price,
              stock_quantity: Number(r.stock_quantity || 0),
              active: !!r.active,
              attributes: r.attributes || {},
            }))
          : [],
    };

    if (typeof onSubmit === "function") {
      onSubmit(payload);
      return;
    }

    console.log("Payload a salvar (UI):", payload);
  };

  // ------------------------------------------------------
  // Img1 Produto (preview) — best effort
  // - Se product_images vier como URL única, mostra.
  // - Se vier como JSON string, tenta parsear e pegar primeira.
  // ------------------------------------------------------
  const mainImageUrl = useMemo(() => {
    const v = product.product_images;
    if (!v) return "";

    // URL direta
    if (typeof v === "string" && v.startsWith("http")) return v;

    // JSON string de lista
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
        if (parsed?.[0]) return String(parsed[0]);
      } catch (_) {
        return "";
      }
    }

    return "";
  }, [product.product_images]);

  // ------------------------------------------------------
  // Layout: helper para exibir atributos do variant row
  // ------------------------------------------------------
  const variantAttrColumns = useMemo(() => {
    const names = (variationAttributes || [])
      .map((a) => a.name)
      .filter(Boolean);

    // Se vierem variantes do banco (edit) sem variationAttributes reconstruído,
    // a gente tenta inferir do primeiro row.
    if (names.length === 0 && variantRows.length > 0) {
      return Object.keys(variantRows[0].attributes || {});
    }

    return names;
  }, [variationAttributes, variantRows]);

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
   NOME FIXO (mantemos premium)
   - IMG1 à esquerda do nome (preview)
================================================== */}
<div className="pf-product-name-fixed">
  <div className="pf-product-name-line">
    {/* ------------------------------------------------------------
        IMG1 (preview) — usa mainImageUrl (já existe)
    ------------------------------------------------------------ */}
    <div
      className="pf-product-thumb"
      title={mainImageUrl ? "Imagem principal do produto" : "Sem imagem"}
      aria-label="Imagem principal do produto"
    >
      {mainImageUrl ? (
        <img src={mainImageUrl} alt="Imagem principal do produto" />
      ) : (
        <span className="pf-product-thumb__placeholder">IMG</span>
      )}
    </div>

    {/* ------------------------------------------------------------
        Nome do produto (label + input)
    ------------------------------------------------------------ */}
    <div className="pf-product-name-fields">
      <FieldLabel text="Nome do produto" required onCopy={() => handleCopyField(product.product_name)} />

      <input
        className={`s7-input ${errors.product_name ? "s7-input--error" : ""}`}
        type="text"
        placeholder="Ex: Armário de cozinha 3 portas"
        value={product.product_name}
        onChange={(e) => handleChange("product_name", e.target.value)}
      />

      {errors.product_name && <div className="s7-error">{errors.product_name}</div>}
    </div>
  </div>
</div>


      {/* ==================================================
         TABS (nova ordem e nomes)
      ================================================== */}
      <div className="pf-tabs">
        <button className={activeTab === "data" ? "active" : ""} onClick={() => setActiveTab("data")} type="button">
          Dados
        </button>
        <button className={activeTab === "pricing" ? "active" : ""} onClick={() => setActiveTab("pricing")} type="button">
          Custos & precificação
        </button>
        <button className={activeTab === "images" ? "active" : ""} onClick={() => setActiveTab("images")} type="button">
          Imagens
        </button>
        <button className={activeTab === "variations" ? "active" : ""} onClick={() => setActiveTab("variations")} type="button">
          Variações
        </button>
        <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")} type="button">
          Descrição
        </button>
        <button className={activeTab === "stock" ? "active" : ""} onClick={() => setActiveTab("stock")} type="button">
          Estoque
        </button>
        <button className={activeTab === "measures" ? "active" : ""} onClick={() => setActiveTab("measures")} type="button">
          Pesos & medidas
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
      <div className="pf-body" data-active-tab={activeTab}>
        <div className="pf-body-inner"></div>
        
        {/* =======================
            ABA: DADOS
        ======================= */}
        {activeTab === "data" && (
          <div className="pf-container">

            <div className="pf-row">
  {/* ------------------------------------------------------
      FORMATO (sempre visível)
  ------------------------------------------------------ */}
<div className="pf-group pf-group--xs">
<FieldLabel
  text="Formato"
  infoText={
    product.format === "simple"
      ? "Produto simples (sem variação de características)"
      : "Produto com variação de características (ex: Cor / Voltagem)"
  }
  tipBottom={true}  // ✅ agora funciona
  wrap={true}       // ✅ agora funciona
  side="left"
/>


  <select
    className="s7-select"
    value={product.format}
    onChange={(e) => handleFormatChange(e.target.value)}
  >
    <option value="simple">Simples</option>
    <option value="variants">Com variações</option>
  </select>
</div>


  {/* ------------------------------------------------------
      SKU / GTIN (apenas no formato simples)
  ------------------------------------------------------ */}
  {product.format === "simple" && (
    <>
      <div className="pf-group pf-group--sm">
        <FieldLabel text="SKU" required onCopy={() => handleCopyField(product.sku)} />
        <input
          className={`s7-input ${errors.sku ? "s7-input--error" : ""}`}
          placeholder="SKU interno"
          value={product.sku}
          onChange={(e) => handleChange("sku", e.target.value.replace(/\s+/g, " ").trimStart())}
        />
        {errors.sku && <div className="s7-error">{errors.sku}</div>}
      </div>

      <div className="pf-group pf-group--sm">
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
    </>
  )}

  {/* ------------------------------------------------------
      NCM (sempre visível)
  ------------------------------------------------------ */}
  <div className="pf-group pf-group--sm">
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
            </div>

            <div className="pf-row">
              <div className="pf-group pf-group--full">
<FieldLabel
  text="Palavras-chave SEO"
  infoText="Separe por vírgulas. Isso ajuda no SEO de busca dos anuncios."
  wrap={true}
  side="left"
  onCopy={() => handleCopyField(product.seo_keywords)}
/>



                <div className="pf-seo-wrapper">
                  <textarea
                    className="s7-textarea"
                    rows="4"
                    placeholder="Ex: armário cozinha, armário 3 portas, armário branco"
                    value={product.seo_keywords}
                    onChange={(e) => handleChange("seo_keywords", e.target.value)}
                  />
                </div>

              </div>
            </div>


          </div>
        )}

        {/* =======================
            ABA: CUSTOS & PRECIFICAÇÃO
        ======================= */}
        {activeTab === "pricing" && (
          <div className="pf-container">
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Custo do produto</label>
                <input className="s7-input" inputMode="decimal" placeholder="Ex: 59,90" value={product.cost_price} onChange={(e) => handleChange("cost_price", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Custo Embalagem</label>
                <input className="s7-input" inputMode="decimal" placeholder="Ex: 4,50" value={product.packaging_cost} onChange={(e) => handleChange("packaging_cost", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Custo Operacional</label>
                <input className="s7-input" inputMode="decimal" placeholder="Ex: 6,90" value={product.operational_cost} onChange={(e) => handleChange("operational_cost", e.target.value)} />
              </div>
            </div>

            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Lucro mínimo (%)</label>
                <input className="s7-input" inputMode="decimal" placeholder="Ex: 10" value={product.min_profit_percentage} onChange={(e) => handleChange("min_profit_percentage", e.target.value)} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Lucro mínimo (R$)</label>
                <input className="s7-input" inputMode="decimal" placeholder="Ex: 15,00" value={product.min_profit_value} onChange={(e) => handleChange("min_profit_value", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* =======================
            ABA: IMAGENS (mantém)
        ======================= */}
        {activeTab === "images" && (
          <div className="pf-container">
            <p className="hint">
              Adicione até <strong>7 fotos</strong>. Elas poderão ser usadas para atualizar anúncios em todos os canais.
            </p>

            <div className="photo-uploader">
              <button className="s7-btn s7-btn--secondary" type="button">
                Adicionar fotos
              </button>
            </div>

            <div className="hint" style={{ marginTop: 12 }}>
              Campo alvo no Supabase: <strong>product_images</strong>
            </div>
          </div>
        )}

        {/* =======================
            ABA: VARIAÇÕES (Bling-style)
        ======================= */}
        {activeTab === "variations" && (
          <div className="pf-container">
            {product.format !== "variants" ? (
              <div className="s7-alert s7-alert--warning">
                <strong>Formato atual:</strong> <strong>Simples</strong>. Para usar variações, altere o campo <strong>Formato</strong> na aba <strong>Dados</strong>.
              </div>
            ) : (
              <>
                <div className="section">
                  <div className="section-header">
                    <h3>Variações</h3>
                    <p className="section-subtitle">
                      Cadastre atributos (ex: Cor, Tamanho) e opções (chips). Depois geramos as combinações automaticamente.
                    </p>
                  </div>

                  <div className="pf-row" style={{ marginTop: 12 }}>
                    <div className="pf-group">
                      <label className="s7-label">Nome do atributo *</label>
                      <input
                        className="s7-input"
                        placeholder="Ex: Cor, Tamanho, Voltagem..."
                        value={draftAttrName}
                        onChange={(e) => setDraftAttrName(e.target.value)}
                      />
                    </div>

                    <div className="pf-group pf-group--full">
                      <label className="s7-label">Opções *</label>
                      <input
                        className="s7-input"
                        placeholder="Digite e pressione Enter ou Tab (ex: Azul, Preto, Laranja)"
                        value={draftOptionInput}
                        onChange={(e) => setDraftOptionInput(e.target.value)}
                        onKeyDown={handleDraftOptionKeyDown}
                      />

                      {/* Chips draft */}
                      {draftOptions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                          {draftOptions.map((opt) => (
                            <span
                              key={opt}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "rgba(37, 99, 235, 0.10)",
                                color: "var(--s7-primary)",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              {opt}
                              <button
                                type="button"
                                onClick={() => removeDraftOption(opt)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                  color: "var(--s7-primary)",
                                }}
                                aria-label="Remover opção"
                                title="Remover"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="s7-hint" style={{ marginTop: 8 }}>
                        Separe opções com Enter/Tab/virgula.
                      </div>
                    </div>

                    <div className="pf-group" style={{ flex: "0 0 auto", minWidth: 200, alignSelf: "flex-end" }}>
                      <button className="s7-btn s7-btn--secondary" type="button" onClick={handleAddVariationAttribute}>
                        Adicionar variação
                      </button>
                    </div>
                  </div>

                  {(errors.variants || errors.variants_sku || errors.variants_gtin) && (
                    <div style={{ marginTop: 10 }}>
                      {errors.variants && <div className="s7-error">{errors.variants}</div>}
                      {errors.variants_sku && <div className="s7-error">{errors.variants_sku}</div>}
                      {errors.variants_gtin && <div className="s7-error">{errors.variants_gtin}</div>}
                    </div>
                  )}
                </div>

                {/* Variações cadastradas */}
                {variationAttributes.length > 0 && (
                  <div className="section" style={{ marginTop: 12 }}>
                    <div className="section-header">
                      <h3>Variações cadastradas</h3>
                      <p className="section-subtitle">Remova opções/atributos e regenere combinações automaticamente.</p>
                    </div>

                    {variationAttributes.map((attr) => (
                      <div key={attr.id} className="pf-row" style={{ marginTop: 12, marginBottom: 0 }}>
                        <div className="pf-group" style={{ maxWidth: 320 }}>
                          <label className="s7-label">Atributo</label>
                          <input className="s7-input" value={attr.name} disabled />
                        </div>

                        <div className="pf-group pf-group--full">
                          <label className="s7-label">Opções</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6 }}>
                            {attr.options.map((opt) => (
                              <span
                                key={`${attr.id}_${opt}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  background: "rgba(107, 114, 128, 0.10)",
                                  color: "#334155",
                                  fontWeight: 800,
                                  fontSize: 12,
                                }}
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => removeOptionFromAttribute(attr.id, opt)}
                                  style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#334155" }}
                                  aria-label="Remover opção"
                                  title="Remover"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pf-group" style={{ flex: "0 0 auto", minWidth: 160, alignSelf: "flex-end" }}>
                          <button className="s7-btn s7-btn--secondary" type="button" onClick={() => handleRemoveVariationAttribute(attr.id)}>
                            Remover atributo
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pf-actions-row" style={{ marginTop: 14 }}>
                      <button className="s7-btn s7-btn--secondary" type="button" onClick={regenerateVariantRows}>
                        Regerar combinações
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid de combinações */}
                {variantRows.length > 0 && (
                  <div className="section" style={{ marginTop: 12 }}>
                    <div className="section-header">
                      <h3>Combinações geradas</h3>
                      <p className="section-subtitle">Cada linha vira um registro em <strong>product_variants</strong>.</p>
                    </div>

                    <div style={{ marginTop: 12, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>#</th>

                            {variantAttrColumns.map((c) => (
                              <th key={c} style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>
                                {c}
                              </th>
                            ))}

                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>SKU *</th>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>GTIN</th>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>Preço</th>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>Estoque</th>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>Ativo</th>
                            <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, color: "var(--s7-muted)" }}>Ações</th>
                          </tr>
                        </thead>

                        <tbody>
                          {variantRows.map((row, idx) => (
                            <tr key={row.id}>
                              <td style={{ padding: "10px 10px", fontWeight: 800, color: "#334155" }}>{idx + 1}</td>

                              {variantAttrColumns.map((c) => (
                                <td key={`${row.id}_${c}`} style={{ padding: "10px 10px", color: "#334155", fontWeight: 700 }}>
                                  {row.attributes?.[c] ?? "-"}
                                </td>
                              ))}

                              <td style={{ padding: "10px 10px", minWidth: 180 }}>
                                <input
                                  className="s7-input"
                                  placeholder="SKU da variação"
                                  value={row.sku}
                                  onChange={(e) => handleVariantRowChange(row.id, "sku", e.target.value)}
                                />
                              </td>

                              <td style={{ padding: "10px 10px", minWidth: 160 }}>
                                <input
                                  className="s7-input"
                                  inputMode="numeric"
                                  placeholder="GTIN"
                                  value={row.gtin}
                                  onChange={(e) => handleVariantRowChange(row.id, "gtin", e.target.value.replace(/\D/g, "").slice(0, 13))}
                                />
                              </td>

                              <td style={{ padding: "10px 10px", minWidth: 140 }}>
                                <input
                                  className="s7-input"
                                  inputMode="decimal"
                                  placeholder="Ex: 199,90"
                                  value={row.price}
                                  onChange={(e) => handleVariantRowChange(row.id, "price", e.target.value)}
                                />
                              </td>

                              <td style={{ padding: "10px 10px", minWidth: 120 }}>
                                <input
                                  className="s7-input"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={row.stock_quantity}
                                  onChange={(e) => handleVariantRowChange(row.id, "stock_quantity", e.target.value.replace(/\D/g, ""))}
                                />
                              </td>

                              <td style={{ padding: "10px 10px", minWidth: 120 }}>
                                <label className="pf-switch">
                                  <input
                                    type="checkbox"
                                    checked={row.active}
                                    onChange={(e) => handleVariantRowChange(row.id, "active", e.target.checked)}
                                  />
                                  Ativa
                                </label>
                              </td>

                              <td style={{ padding: "10px 10px", minWidth: 120 }}>
                                <button className="s7-btn s7-btn--secondary" type="button" onClick={() => handleRemoveVariantRow(row.id)}>
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="s7-hint" style={{ marginTop: 10 }}>
                      Dica: se você remover uma linha (combinação), ela não será criada no banco.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* =======================
            ABA: DESCRIÇÃO (mantém)
        ======================= */}
        {activeTab === "description" && (
          <div className="pf-container">
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
          </div>
        )}

        {/* =======================
            ABA: ESTOQUE (v2)
        ======================= */}
        {activeTab === "stock" && (
          <div className="pf-container">
            <div className="pf-row">
              <div className="pf-group">
                <label className="s7-label">Estoque</label>
                <input className="s7-input" inputMode="numeric" value={product.stock_quantity} onChange={(e) => handleChange("stock_quantity", e.target.value.replace(/\D/g, ""))} />
              </div>

              <div className="pf-group">
                <label className="s7-label">Estoque mínimo</label>
                <input className="s7-input" inputMode="numeric" value={product.stock_minimum} onChange={(e) => handleChange("stock_minimum", e.target.value.replace(/\D/g, ""))} />
              </div>

              <div className="pf-group" style={{ minWidth: 260 }}>
                <label className="s7-label">Usar estoque virtual?</label>
                <label className="pf-switch" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!product.use_virtual_stock}
                    onChange={(e) => handleChange("use_virtual_stock", e.target.checked)}
                  />
                  Ativar
                </label>
                <div className="s7-hint" style={{ marginTop: 6 }}>
                  Quando ativado, este valor será sincronizado nos marketplaces (regra fica no backend).
                </div>
              </div>
            </div>

            {product.use_virtual_stock && (
              <div className="pf-row">
                <div className="pf-group" style={{ maxWidth: 320 }}>
                  <label className="s7-label">Estoque virtual</label>
                  <input
                    className="s7-input"
                    inputMode="numeric"
                    placeholder="Ex: 200"
                    value={product.virtual_stock_quantity}
                    onChange={(e) => handleChange("virtual_stock_quantity", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
            )}

            <div className="pf-row">
              <div className="pf-group pf-group--full">
                <label className="s7-label">Observações</label>
                <input className="s7-input" placeholder="Notas internas sobre estoque" value={product.notes} onChange={(e) => handleChange("notes", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* =======================
            ABA: PESOS & MEDIDAS (mantém)
        ======================= */}
        {activeTab === "measures" && (
          <div className="pf-container">
            <div className="s7-card">
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas de envio</h3>
                <p className="s7-card__subtitle">Medidas usadas para cálculo de frete e logística.</p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 30" value={product.width} onChange={(e) => handleChange("width", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 15" value={product.height} onChange={(e) => handleChange("height", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 45" value={product.length} onChange={(e) => handleChange("length", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 2.350" value={product.weight} onChange={(e) => handleChange("weight", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="s7-card" style={{ marginTop: 12 }}>
              <div className="s7-card__header">
                <h3 className="s7-card__title">Medidas do produto (montado)</h3>
                <p className="s7-card__subtitle">Medidas reais do produto pronto/montado (referência interna).</p>
              </div>

              <div className="pf-row">
                <div className="pf-group">
                  <label className="s7-label">Largura (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 32" value={product.assembled_width} onChange={(e) => handleChange("assembled_width", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Altura (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 80" value={product.assembled_height} onChange={(e) => handleChange("assembled_height", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Comprimento (cm)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 42" value={product.assembled_length} onChange={(e) => handleChange("assembled_length", e.target.value)} />
                </div>

                <div className="pf-group">
                  <label className="s7-label">Peso (kg)</label>
                  <input className="s7-input" inputMode="decimal" placeholder="Ex: 8.500" value={product.assembled_weight} onChange={(e) => handleChange("assembled_weight", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            ABA: ANÚNCIOS (placeholder)
        ======================= */}
        {activeTab === "ads" && (
          <div className="pf-container">
            <div className="section">
              <div className="section-header">
                <h3>Anúncios do produto</h3>
                <p className="section-subtitle">Aqui vamos listar os anúncios vinculados a este produto em cada marketplace (ML primeiro).</p>
              </div>

              <p className="hint">Em breve: tabela com Marketplace, ID do anúncio, Status, Preço, Estoque e Ações.</p>

              <button className="s7-btn s7-btn--secondary" type="button">
                Importar anúncios (em breve)
              </button>
            </div>
          </div>
        )}

        {/* =======================
            ABA: VENDAS & DESEMPENHO (placeholder)
        ======================= */}
        {activeTab === "performance" && (
          <div className="pf-container">
            <div className="section">
              <div className="section-header">
                <h3>Vendas & desempenho</h3>
                <p className="section-subtitle">Painel do produto: histórico de vendas, desempenho por canal e indicadores.</p>
              </div>

              <p className="hint">Em breve: cards com Vendas, Receita, Lucro, Ticket médio, Conversão e Curva ABC.</p>

              <button className="s7-btn s7-btn--secondary" type="button">
                Ver relatório (em breve)
              </button>
            </div>
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
