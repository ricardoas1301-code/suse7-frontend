// ======================================================================
// ProductVariationsTab
// Aba: Variações (UI reorganizada em componente dedicado)
// - Toda lógica continua no ProductForm; aqui só consumimos via props.
// - Usa componentes do Design System S7 para estrutura básica.
// ======================================================================

import { Trash2 } from "lucide-react";
import { S7Section, S7FormField, S7Input, S7Button } from "./ui";
import "./ProductVariationsTab.css";

export default function ProductVariationsTab({
  product,
  errors,
  hasVariations,
  // builder state
  variationAttributes,
  draftAttrChips,
  draftAttrInput,
  setDraftAttrInput,
  draftOptions,
  draftOptionInput,
  setDraftOptionInput,
  addOptionAttrId,
  addOptionInput,
  addOptionError,
  // sku raiz
  skuBaseChips,
  skuBaseInput,
  setSkuBaseInput,
  skuBaseInputRef,
  skuBaseError,
  // variants
  variantRows,
  variantAttrColumns,
  copiedKey,
  skuErrorsById,
  skuAtFocusRef,
  // handlers
  removeDraftAttrChip,
  handleDraftAttrKeyDown,
  removeDraftOption,
  handleDraftOptionKeyDown,
  handleAddVariationAttribute,
  handleChangeAttributeName,
  removeOptionFromAttribute,
  handleAddOptionToAttribute,
  setAddOptionAttrId,
  setAddOptionInput,
  setAddOptionError,
  handleGenerateSkuAuto,
  removeSkuBaseChip,
  handleSkuBaseKeyDown,
  handleCopy,
  handleVariantRowChange,
  isVariantLinkedToMarketplaces,
  setSkuManualIntegratedModal,
  handleGenerateSkuForRow,
  setDeleteVariantRowId,
}) {
  if (product.format !== "variants") {
    return (
      <div className="pf-container">
        <div className="s7-alert s7-alert--warning">
          <strong>Formato atual:</strong> <strong>Simples</strong>. Para usar variações, altere o campo{" "}
          <strong>Formato</strong> na aba <strong>Dados</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      {/* Bloco 1 — Configuração das variações */}
      <S7Section title="Variações">
        <div className="pvt-builder-row">
          {/* Nome do atributo */}
          <div className="pvt-builder-col">
            <S7FormField
              label="Nome do atributo"
              required
              tooltip="Digite o nome do atributo (ex: Cor, Tamanho, Voltagem) e pressione Enter/Tab para criar o chip."
            >
              <div className="pf-chipbox pf-variation-chipbox">
                {draftAttrChips.map((attr) => (
                  <span key={attr} className="pf-chip pf-variation-chip">
                    {attr}
                    <button
                      type="button"
                      className="pf-chip-x"
                      onClick={() => removeDraftAttrChip(attr)}
                      title="Remover atributo"
                      aria-label="Remover atributo"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                <input
                  className="pf-chipbox-input pf-variation-input"
                  value={draftAttrInput}
                  onChange={(e) => setDraftAttrInput(e.target.value)}
                  onKeyDown={handleDraftAttrKeyDown}
                />
              </div>
            </S7FormField>
          </div>

          {/* Opções (chips) */}
          <div className="pvt-builder-col">
            <S7FormField
              label="Opções (chips)"
              required
              tooltip="Digite as opções do atributo (ex: Branco, Preto, 127V) e pressione Enter/Tab/virgula."
            >
              <div className="pf-chipbox pf-variation-chipbox">
                {draftOptions.map((opt) => (
                  <span key={opt} className="pf-chip pf-chip--soft pf-variation-chip">
                    {opt}
                    <button
                      type="button"
                      className="pf-chip-x"
                      onClick={() => removeDraftOption(opt)}
                      aria-label="Remover opção"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                <input
                  className="pf-chipbox-input pf-variation-input"
                  placeholder="Digite e pressione Enter/Tab (ex: Branco, Preto, 127V)"
                  value={draftOptionInput}
                  onChange={(e) => setDraftOptionInput(e.target.value)}
                  onKeyDown={handleDraftOptionKeyDown}
                />
              </div>
            </S7FormField>
          </div>

          {/* Botão Adicionar variação */}
          <div className="pvt-builder-col pvt-builder-col--action">
            <S7Button variant="primary" onClick={handleAddVariationAttribute}>
              Adicionar variação
            </S7Button>
          </div>
        </div>

        {/* Atributos já cadastrados — mantidos com layout original, dentro da Section */}
        {variationAttributes.length > 0 &&
          variationAttributes.map((attr) => (
            <div key={attr.id} className="pf-variation-create-row" style={{ marginTop: 12 }}>
              <div className="pf-variation-create-col pf-variation-create-col--attribute">
                <label className="s7-label pf-variation-chip-label">Nome do atributo</label>
                <S7Input
                  className="pf-variation-input"
                  value={attr.name}
                  onChange={(e) => handleChangeAttributeName(attr.id, e.target.value)}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== attr.name) handleChangeAttributeName(attr.id, v);
                  }}
                  placeholder="Ex: Cor, Tamanho"
                />
              </div>
              <div className="pf-variation-create-col pf-variation-create-col--options">
                <label className="s7-label pf-variation-chip-label">Opções</label>
                <div className="pf-chipbox pf-variation-chipbox">
                  {(attr.options || []).map((opt) => (
                    <span key={`${attr.id}_${opt}`} className="pf-chip pf-chip--soft pf-variation-chip">
                      {opt}
                      <button
                        type="button"
                        className="pf-chip-x"
                        onClick={() => removeOptionFromAttribute(attr.id, opt)}
                        aria-label="Remover opção"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {addOptionAttrId === attr.id ? (
                    <>
                      <input
                        className="pf-chipbox-input pf-variation-input"
                        placeholder="Ex: Verde, Bege..."
                        value={addOptionInput}
                        onChange={(e) => {
                          setAddOptionInput(e.target.value);
                          if (addOptionError) setAddOptionError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            handleAddOptionToAttribute(attr.id);
                          }
                          if (e.key === "Escape") {
                            setAddOptionAttrId(null);
                            setAddOptionInput("");
                            setAddOptionError("");
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="s7-btn s7-btn--secondary"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleAddOptionToAttribute(attr.id)}
                      >
                        Adicionar chip
                      </button>
                      <button
                        type="button"
                        className="s7-btn s7-btn--secondary"
                        onClick={() => {
                          setAddOptionAttrId(null);
                          setAddOptionInput("");
                          setAddOptionError("");
                        }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="s7-btn s7-btn--secondary"
                      onClick={() => {
                        setAddOptionAttrId(attr.id);
                        setAddOptionInput("");
                        setAddOptionError("");
                      }}
                    >
                      + Adicionar chip
                    </button>
                  )}
                </div>
                {addOptionAttrId === attr.id && addOptionError && (
                  <div className="s7-error" style={{ marginTop: 8 }}>
                    {addOptionError}
                  </div>
                )}
              </div>
              <div className="pf-variation-create-col pf-variation-create-col--action" />
            </div>
          ))}

        {(errors.variants || errors.variants_sku || errors.variants_gtin) && (
          <div style={{ marginTop: 10 }}>
            {errors.variants && <div className="s7-error">{errors.variants}</div>}
            {errors.variants_sku && <div className="s7-error">{errors.variants_sku}</div>}
            {errors.variants_gtin && <div className="s7-error">{errors.variants_gtin}</div>}
          </div>
        )}
      </S7Section>

      {/* Bloco 2 — Configuração de SKU + lista de variações geradas */}
      {variantRows.length > 0 && (
        <S7Section
          title={`${variantRows.length} ${
            variantRows.length === 1 ? "Variação Gerada" : "Variações Geradas"
          }`}
        >
          <div className="pf-variants-generated-actions">
            <div className="pf-variants-generated-actions-left">
              <span className="s7-label">Gerar SKU</span>
              <S7Button variant="secondary" onClick={handleGenerateSkuAuto}>
                {variantRows.some((row) => row.sku)
                  ? "🔄 Regerar SKUs automaticamente"
                  : "⚡ Gerar SKU automaticamente"}
              </S7Button>
            </div>

            <div className="pf-variants-generated-actions-right">
              <S7FormField
                label="Raiz do SKU"
                required
                tooltip="Define a base do SKU usada para gerar automaticamente os SKUs das variações combinando os atributos (ex: camisa_preta_P)."
              >
                <div
                  className={`pf-chipbox pf-variation-chipbox ${
                    skuBaseError ? "s7-input--error" : ""
                  }`}
                  style={{ marginTop: 4 }}
                >
                  {skuBaseChips.map((key) => (
                    <span key={key} className="pf-chip pf-chip--soft pf-variation-chip">
                      {key}
                      <button
                        type="button"
                        className="pf-chip-x"
                        onClick={() => removeSkuBaseChip(key)}
                        aria-label="Remover chave"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {skuBaseChips.length < 2 && (
                    <input
                      ref={skuBaseInputRef}
                      className="pf-chipbox-input pf-variation-input"
                      value={skuBaseInput}
                      onChange={(e) => setSkuBaseInput(e.target.value)}
                      onKeyDown={handleSkuBaseKeyDown}
                      placeholder={
                        skuBaseChips.length === 0 ? "Ex: calca, churra" : "Ex: eletr"
                      }
                      maxLength={6}
                    />
                  )}
                </div>
              </S7FormField>
              {skuBaseError && (
                <div className="s7-error" style={{ marginTop: 6 }}>
                  {skuBaseError}
                </div>
              )}
            </div>
          </div>

          <div className="pf-variants-list">
            {variantRows.map((row) => (
              <div key={row.id} className="s7-card pf-variant-row">
                <div className="pv-card__left">
                  <div className="pv-card__attrs-inline">
                    {variantAttrColumns.map((attr) => (
                      <div key={attr} className="pv-card__attr">
                        <div className="pv-card__attr-label">{attr}</div>
                        <div className="pv-card__attr-value">
                          {row.attributes?.[attr] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pv-card__right">
                  <div className="pv-card__fields">
                    <div className="pv-card__field">
                        <div className="pv-card-field">
                          <div className="pv-card-field__header">
                            <label className="pv-card-field__label">
                              SKU <span className="pv-card-field__required">*</span>
                            </label>
                            <div className="pv-card-field__actions">
                              <button
                                type="button"
                                className="pf-copy-btn pv-card-field__copy-btn s7-tip s7-tip-bottom s7-tip-left"
                                onClick={() => handleCopy(row.sku, `variant_sku_${row.id}`)}
                                aria-label="Copiar SKU"
                                data-tip={copiedKey === `variant_sku_${row.id}` ? "Copiado!" : "Copiar"}
                              >
                                {copiedKey === `variant_sku_${row.id}` ? "✓" : "⧉"}
                              </button>
                            </div>
                          </div>

                          <div className="pv-card-field__control">
                            <div className="pv-card-field__control-row">
                              <S7Input
                                value={row.sku}
                                onFocus={() => {
                                  skuAtFocusRef.current[row.id] = row.sku;
                                }}
                                onChange={(e) => {
                                  handleVariantRowChange(row.id, "sku", e.target.value);
                                  if (skuErrorsById?.[row.id]) {
                                    setSkuErrorsById((prev) => {
                                      const next = { ...(prev || {}) };
                                      delete next[row.id];
                                      return next;
                                    });
                                  }
                                }}
                                onBlur={() => {
                                  const atFocus = skuAtFocusRef.current[row.id];
                                  const currentValue = row.sku;
                                  if (
                                    atFocus !== currentValue &&
                                    isVariantLinkedToMarketplaces(row)
                                  ) {
                                    handleVariantRowChange(row.id, "sku", atFocus ?? "");
                                    setSkuManualIntegratedModal({
                                      rowId: row.id,
                                      nextSku: currentValue,
                                    });
                                  }
                                  delete skuAtFocusRef.current[row.id];
                                }}
                                className={skuErrorsById?.[row.id] ? "s7-input--error" : ""}
                              />

                              <button
                                type="button"
                                className="s7-btn s7-btn--secondary pv-card-field__generate-btn s7-tip s7-tip-bottom s7-tip-left"
                                style={{
                                  padding: "4px 10px",
                                  minWidth: "auto",
                                  fontSize: 12,
                                }}
                                data-tip={
                                  row.sku
                                    ? "Regerar SKU desta variação"
                                    : "Gerar SKU automaticamente para esta variação"
                                }
                                onClick={() => handleGenerateSkuForRow(row)}
                                aria-label="Gerar SKU desta variação"
                              >
                                {row.sku ? "🔄" : "⚡"}
                              </button>

                            </div>
                          </div>
                          {skuErrorsById?.[row.id] && (
                            <div className="s7-error">{skuErrorsById[row.id]}</div>
                          )}
                        </div>
                    </div>

                    <div className="pv-card__field">
                        <div className="pv-card-field">
                          <div className="pv-card-field__header">
                            <label className="pv-card-field__label">EAN / GTIN</label>

                            <div className="pv-card-field__actions">
                              <button
                                type="button"
                                className="pf-copy-btn s7-tip s7-tip-bottom s7-tip-left"
                                onClick={() => handleCopy(row.gtin, `variant_gtin_${row.id}`)}
                                aria-label="Copiar EAN/GTIN"
                                data-tip={copiedKey === `variant_gtin_${row.id}` ? "Copiado!" : "Copiar"}
                              >
                                {copiedKey === `variant_gtin_${row.id}` ? "✓" : "⧉"}
                              </button>
                            </div>
                          </div>

                          <div className="pv-card-field__control">
                            <S7Input
                              inputMode="numeric"
                              value={row.gtin}
                              onChange={(e) =>
                                handleVariantRowChange(
                                  row.id,
                                  "gtin",
                                  e.target.value.replace(/\D/g, "").slice(0, 13)
                                )
                              }
                            />
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="pv-card__delete">
                    <button
                      type="button"
                                className={`pf-variant-delete-btn s7-tip s7-tip-bottom s7-tip-left`}
                      data-tip="Excluir variação"
                      onClick={() => setDeleteVariantRowId(row.id)}
                      aria-label="Excluir variação"
                    >
                      <Trash2 size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </S7Section>
      )}
    </div>
  );
}

