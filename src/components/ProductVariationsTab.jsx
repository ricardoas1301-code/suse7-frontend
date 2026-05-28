// ======================================================================
// ProductVariationsTab
// Aba: Variações (UI reorganizada em componente dedicado)
// - Toda lógica continua no ProductForm; aqui só consumimos via props.
// - Usa componentes do Design System S7 para estrutura básica.
// ======================================================================

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { S7Section, S7FormField, S7Input, S7Button } from "./ui";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "./ui/S7CopyButton";
import { PvLabelWithTooltip } from "./PvLocalTooltip";
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
  skuErrorsById,
  /** Exibir erros de SKU após Avançar/Salvar/painel ou blur no campo */
  variationsSubmitAttempted = false,
  /** @type {Record<string, boolean>} chaves `sku:${rowId}` */
  variationsTouchedFields = {},
  onVariantSkuBlur,
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
  handleVariantRowChange,
  isVariantLinkedToMarketplaces,
  setSkuManualIntegratedModal,
  handleGenerateSkuForRow,
  setDeleteVariantRowId,
  initialConfigCollapsed = false,
  /** ref.current = () => void — expande o card de configuração (Raiz do SKU) */
  expandVariationsConfigRef,
}) {
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(
    Boolean(initialConfigCollapsed) && variantRows.length > 0
  );
  const prevVariantCountRef = useRef(variantRows.length);
  const configCardRef = useRef(null);
  const draftAttrInputRef = useRef(null);
  const draftOptionInputRef = useRef(null);

  // Regra 1: quando não há variações, o card fica sempre aberto
  // e não sofre recolhimento automático.
  useEffect(() => {
    if (variantRows.length === 0) {
      setIsConfigCollapsed(false);
    }
  }, [variantRows.length]);

  useEffect(() => {
    if (variantRows.length > 0) {
      setIsConfigCollapsed(Boolean(initialConfigCollapsed));
    }
  }, [initialConfigCollapsed, variantRows.length]);

  // Regra 2 (ajustada): não recolher automaticamente ao criar a primeira variação.
  // Mantemos apenas o tracking do total para possíveis comportamentos futuros,
  // mas sem alterar isConfigCollapsed aqui.
  useEffect(() => {
    prevVariantCountRef.current = variantRows.length;
  }, [variantRows.length]);

  // Registra expansão do card para o ProductForm (UX: guiar até a Raiz do SKU)
  useEffect(() => {
    if (!expandVariationsConfigRef) return;
    expandVariationsConfigRef.current = () => setIsConfigCollapsed(false);
    return () => {
      expandVariationsConfigRef.current = null;
    };
  }, [expandVariationsConfigRef]);

  // Regra 3: quando já existem variações, clicar fora do card recolhe.
  useEffect(() => {
    if (variantRows.length === 0) {
      return;
    }
    if (isConfigCollapsed) {
      return;
    }

    function handleClickOutside(event) {
      // Botões de gerar SKU na lista de variações ficam fora do card; não recolher ao usá-los (evita flicker).
      if (event.target.closest?.("[data-pf-variation-sku-generate]")) return;
      if (!configCardRef.current) return;
      if (!configCardRef.current.contains(event.target)) {
        setIsConfigCollapsed(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [variantRows.length, isConfigCollapsed]);
  if (product.format !== "variants") {
    return (
      <div className="pf-container">
        <h2 className="pf-tab-title">Variações</h2>
        <div className="s7-alert s7-alert--warning">
          <strong>Formato atual:</strong> <strong>Simples</strong>. Para usar variações, altere o campo{" "}
          <strong>Formato</strong> na aba <strong>Dados</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      <h2 className="pf-tab-title">Variações</h2>
      {/* Bloco 1 — Configuração das variações (card recolhível) */}
      <S7Section>
        <div className="pf-variations-config-card" ref={configCardRef} tabIndex={-1}>
          <button
            type="button"
            className="pf-variations-config-header"
            onClick={() => {
              if (variantRows.length === 0) return; // fase de criação: não recolhe
              setIsConfigCollapsed((prev) => !prev);
            }}
          >
            <div className="pf-variations-config-header-left">
              <span className="pf-variations-config-title">Configuração de variações</span>
              <span className="pf-variations-config-summary">
                {variationAttributes.length} atributo
                {variationAttributes.length === 1 ? "" : "s"} • {variantRows.length} variação
                {variantRows.length === 1 ? "" : "es"} gerada
              </span>
            </div>
            <div className="pf-variations-config-header-icon">
              <ChevronDown
                size={18}
                className={
                  isConfigCollapsed
                    ? "pf-variations-config-chevron pf-variations-config-chevron--collapsed"
                    : "pf-variations-config-chevron"
                }
              />
            </div>
          </button>

          <div
            className={
              isConfigCollapsed
                ? "pf-variations-config-body pf-variations-config-body--collapsed"
                : "pf-variations-config-body pf-variations-config-body--expanded"
            }
          >
            {variationsSubmitAttempted && errors.variants && (
              <div className="s7-error pf-variations-general-error">{errors.variants}</div>
            )}
            <div className="pf-variations-content">
              <div className="pf-variation-builder-card">
                <div className="pvt-builder-row">
                {/* Nome do atributo */}
                <div className="pvt-builder-col">
                  <S7FormField
                    label={
                      <PvLabelWithTooltip
                        required
                        tooltipText="Digite o nome do atributo (ex: Cor, Tamanho, Voltagem) e pressione Enter/Tab para criar o chip."
                      >
                        Nome do atributo
                      </PvLabelWithTooltip>
                    }
                    required={false}
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
                        ref={draftAttrInputRef}
                        className="pf-chipbox-input pf-variation-input"
                        value={draftAttrInput}
                        onChange={(e) => setDraftAttrInput(e.target.value)}
                        onKeyDown={handleDraftAttrKeyDown}
                      />
                    </div>
                  </S7FormField>
                  {errors.variants_attr && (
                    <div className="s7-error" style={{ marginTop: 4 }}>
                      {errors.variants_attr}
                    </div>
                  )}
                </div>

                {/* Opções (chips) */}
                <div className="pvt-builder-col">
                  <S7FormField
                    label={
                      <PvLabelWithTooltip
                        required
                        tooltipText="Digite as opções do atributo (ex: Branco, Preto, 127V) e pressione Enter/Tab/virgula."
                      >
                        Opções (chips)
                      </PvLabelWithTooltip>
                    }
                    required={false}
                  >
                    <div className="pf-chipbox pf-variation-chipbox pf-variation-chipbox--with-clear">
                      {draftOptions.map((opt) => (
                        <span key={opt} className="pf-chip pf-chip--soft pf-variation-chip">
                          {opt}
                          <button
                            type="button"
                            className="pf-chip-x"
                            onClick={() => removeDraftOption(opt)}
                            aria-label={`Remover opção ${opt}`}
                            title="Remover"
                          >
                            ✕
                          </button>
                        </span>
                      ))}

                      <input
                        ref={draftOptionInputRef}
                        className="pf-chipbox-input pf-variation-input"
                        placeholder={
                          draftOptions.length === 0 && !draftOptionInput
                            ? "Digite e pressione Enter/Tab (ex: Branco, Preto, 127V)"
                            : ""
                        }
                        value={draftOptionInput}
                        onChange={(e) => setDraftOptionInput(e.target.value)}
                        onKeyDown={handleDraftOptionKeyDown}
                      />

                      {draftOptionInput && (
                        <button
                          type="button"
                          className="pf-variation-chipbox-clear"
                          onClick={() => {
                            setDraftOptionInput("");
                            draftOptionInputRef.current?.focus?.();
                          }}
                          aria-label="Limpar texto digitado"
                          title="Limpar"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </S7FormField>
                  {errors.variants_options && (
                    <div className="s7-error" style={{ marginTop: 4 }}>
                      {errors.variants_options}
                    </div>
                  )}
                </div>

                {/* Botão Adicionar variação */}
                <div className="pvt-builder-col pvt-builder-col--action">
                  <button
                    type="button"
                    className="pf-ghost-btn pvt-add-variation-btn"
                    onClick={handleAddVariationAttribute}
                  >
                    Adicionar variação
                  </button>
                </div>
                </div>
              </div>

              {/* Atributos já cadastrados */}
              {variationAttributes.length > 0 && (
                <div className="pf-variation-attribute-list">
                  {variationAttributes.map((attr) => (
                    <div key={attr.id} className="pf-variation-attribute-card">
                      <div className="pf-variation-row">
                        <div className="pf-variation-attr">
                          <label className="s7-label pf-variation-chip-label">Nome do atributo</label>
                          <div className="pf-variation-attr-value" title={attr.name}>
                            {attr.name}
                          </div>
                        </div>

                        <div className="pf-variation-options">
                          <label className="s7-label pf-variation-chip-label">Opções</label>

                          <div className="pf-variation-chips">
                            {(attr.options || []).map((opt) => (
                              <span
                                key={`${attr.id}_${opt}`}
                                className="pf-chip pf-chip--soft pf-variation-chip"
                              >
                                {opt}
                              </span>
                            ))}

                            {addOptionAttrId === attr.id ? (
                              <div className="pf-variation-add-chip-inline">
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
                                  className="pf-ghost-btn pf-variation-add-chip-btn"
                                  onClick={() => {
                                    setAddOptionAttrId(null);
                                    setAddOptionInput("");
                                    setAddOptionError("");
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="pf-ghost-btn pf-variation-add-chip-btn"
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
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(errors.variants_sku || errors.variants_gtin) && (
                <div style={{ marginTop: 6 }}>
                  {errors.variants_sku && <div className="s7-error">{errors.variants_sku}</div>}
                  {errors.variants_gtin && <div className="s7-error">{errors.variants_gtin}</div>}
                </div>
              )}

              {/* Configuração de SKU global (dentro do card) */}
              {variantRows.length > 0 && (
                <div className="pf-sku-base-card">
                  <div className="pf-variants-generated-actions pf-variants-generated-actions--inside-card">
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
                        label={
                          <PvLabelWithTooltip
                            required
                            tooltipText="Define a base do SKU usada para gerar automaticamente os SKUs das variações combinando os atributos (ex: camisa_preta_P)."
                          >
                            Raiz do SKU
                          </PvLabelWithTooltip>
                        }
                        required={false}
                      >
                        <div className="s7-field pf-sku-base-field-block">
                          <div
                            className={`pf-chipbox pf-variation-chipbox ${
                              skuBaseError ? "s7-input--error" : ""
                            }`}
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

                          <div className="s7-field-error pf-sku-base-error-slot">
                            {skuBaseError || ""}
                          </div>
                        </div>
                      </S7FormField>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </S7Section>

      {/* Bloco 2 — Lista de variações geradas */}
      {variantRows.length > 0 && (
        <S7Section>
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
                    {/* Campo SKU */}
                    <div className="pv-card__field">
                      <div className="pv-card-field">
                        <div className="pv-card-field__header">
                          <label className="pv-card-field__label">
                            SKU <span className="pv-card-field__required">*</span>
                          </label>
                          <div className="pv-card-field__actions">
                            {String(row.sku ?? "").trim() !== "" ? (
                              <S7CopyButton
                                value={row.sku}
                                ariaLabel="Copiar SKU"
                                tooltipText="Copiar SKU"
                                toastLabel="SKU"
                                showToast={true}
                                iconMode="unicode"
                                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                flashKey={`variant_sku_${row.id}`}
                                toastEventType="LISTING_SKU_COPIED"
                                toastFailEventType="LISTING_SKU_COPY_FAILED"
                                toastEntityType="product"
                                className="pv-card-field__copy-btn"
                              />
                            ) : null}
                          </div>
                        </div>

                        <div className="pv-card-field__control">
                          <div className="pv-card-field__control-row">
                            <S7Input
                              value={row.sku}
                              onFocus={() => {
                                skuAtFocusRef.current[row.id] = row.sku;
                              }}
                              onChange={(e) =>
                                handleVariantRowChange(row.id, "sku", e.target.value)
                              }
                              onBlur={() => {
                                onVariantSkuBlur?.(row.id);
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
                              error={
                                (variationsSubmitAttempted ||
                                  !!variationsTouchedFields[`sku:${row.id}`]) &&
                                skuErrorsById?.[row.id]
                                  ? skuErrorsById[row.id]
                                  : false
                              }
                            />

                            <button
                              type="button"
                              className="s7-btn s7-btn--secondary pv-card-field__generate-btn s7-tip s7-tip-bottom s7-tip-left"
                              data-pf-variation-sku-generate
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
                      </div>
                    </div>

                    {/* Campo EAN / GTIN */}
                    <div className="pv-card__field">
                      <div className="pv-card-field">
                        <div className="pv-card-field__header">
                          <label className="pv-card-field__label">EAN / GTIN</label>
                          <div className="pv-card-field__actions">
                            {String(row.gtin ?? "").trim() !== "" ? (
                              <S7CopyButton
                                value={row.gtin}
                                ariaLabel="Copiar EAN/GTIN"
                                tooltipText="Copiar GTIN"
                                toastLabel="GTIN"
                                showToast={true}
                                iconMode="unicode"
                                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                flashKey={`variant_gtin_${row.id}`}
                                toastEntityType="product"
                                className="pv-card-field__copy-btn"
                              />
                            ) : null}
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

                  {/* Botão de exclusão */}
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

