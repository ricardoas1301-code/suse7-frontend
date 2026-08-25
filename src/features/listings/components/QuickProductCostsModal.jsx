import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../supabaseClient";
import S7Input from "../../../components/ui/S7Input";
import S7Button from "../../../components/ui/S7Button.jsx";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import {
  PRODUCT_EXPEDITION_SUPPLIES_LABEL,
  PRODUCT_EXPEDITION_SUPPLIES_TOOLTIP,
} from "../../../domain/costs/costSemanticsPresentation.js";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../../../components/ui/S7CopyButton.jsx";
import quickProductCostsIllustration from "../../../assets/modals/quick-product-costs-illustration.png";
import BulkProductCostsModal from "../../products/costs/BulkProductCostsModal.jsx";
import {
  formatBrlFromApiValue,
  formatBrlTypingWithSymbol,
  validateProductCostsDraft,
} from "../../products/costs/productCostsDomain.js";
import { saveSingleProductCosts } from "../../products/costs/productCostsApi.js";
import { refreshOperationalTasksAfterProductCostsSaved } from "../../dashboard/operationalTasks/refreshOperationalTasksAfterProductCostsSaved.js";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import {
  clearSignupFieldValidityForField,
  showSignupFieldValidation,
} from "../../../components/signupFormPresentation.js";
import "../../../styles/tokens/s7-operational-thumb.css";

const PRODUCT_COST_FIELD_NAME = "quick-product-cost-price";
const PRODUCT_COST_REQUIRED_MSG = "Informe o custo do produto.";

/**
 * @param {{
 *   open: boolean;
 *   productId: string | null;
 *   sku: string | null;
 *   productTitle: string;
 *   productImageUrl: string | null;
 *   onClose: () => void;
 *   onSaved?: () => void | Promise<void>;
 * }} props
 */
export default function QuickProductCostsModal({
  open,
  productId,
  sku,
  productTitle,
  productImageUrl,
  onClose,
  onSaved,
}) {
  const { addNotification } = useNotifications();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [operationalCost, setOperationalCost] = useState("");
  const [resolvedSku, setResolvedSku] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    costPrice: false,
    packagingCost: false,
    operationalCost: false,
  });
  const modalRef = useRef(null);
  const formRef = useRef(null);

  const title = useMemo(() => {
    const t = String(productTitle || "").trim();
    return t || "Produto sem título";
  }, [productTitle]);

  useEffect(() => {
    if (!open) {
      setBulkOpen(false);
      return;
    }
    if (!productId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, sku, cost_price, packaging_cost, operational_cost")
        .eq("id", productId)
        .maybeSingle();
      if (cancelled) return;
      setLoading(false);
      if (fetchError) {
        setError(fetchError.message || "Não foi possível carregar os custos atuais.");
        return;
      }
      setResolvedSku(data?.sku != null ? String(data.sku).trim() : "");
      setCostPrice(formatBrlFromApiValue(data?.cost_price));
      setPackagingCost(formatBrlFromApiValue(data?.packaging_cost));
      setOperationalCost(formatBrlFromApiValue(data?.operational_cost));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  if (bulkOpen) {
    return <BulkProductCostsModal open onClose={onClose} onSaved={onSaved} />;
  }

  const handleSave = async () => {
    if (!productId) return;
    setError("");
    setFieldErrors({ costPrice: false, packagingCost: false, operationalCost: false });

    const validation = validateProductCostsDraft({
      cost_price: costPrice,
      packaging_cost: packagingCost,
      operational_cost: operationalCost,
    });

    if (!validation.ok) {
      const costMissing = Boolean(validation.fieldErrors?.cost_price);
      setFieldErrors({
        costPrice: costMissing,
        packagingCost: false,
        operationalCost: false,
      });
      const firstMsg = costMissing
        ? PRODUCT_COST_REQUIRED_MSG
        : validation.fieldErrors?.cost_price || PRODUCT_COST_REQUIRED_MSG;
      addNotification({
        event_type: "PRODUCT_COSTS_REQUIRED",
        entity_type: "product",
        entity_id: productId != null ? String(productId) : null,
        title: "Campos obrigatórios",
        message: firstMsg,
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      showSignupFieldValidation(formRef.current, PRODUCT_COST_FIELD_NAME, firstMsg);
      return;
    }

    setSaving(true);
    const result = await saveSingleProductCosts({
      product_id: String(productId),
      ...validation.costs,
    });
    setSaving(false);

    if (!result.ok || (result.failed || []).length > 0) {
      const failMsg =
        result.failed?.[0]?.message ||
        result.error ||
        "Não foi possível salvar os custos.";
      setError(failMsg);
      return;
    }

    onClose();
    await refreshOperationalTasksAfterProductCostsSaved();
    void onSaved?.();
  };

  const skuText = String(resolvedSku || sku || "").trim();
  const skuCopyFlashKey = `quick-product-costs-sku-${productId || "unknown"}`;

  const modalNode = (
    <div className="anuncios-quick-cost-modal__overlay" onMouseDown={() => (!saving ? onClose() : undefined)} role="presentation">
      <div
        ref={modalRef}
        className="anuncios-quick-cost-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="anuncios-quick-cost-modal__header">
          <h3 className="anuncios-quick-cost-modal__title">Cadastrar os custos do produto</h3>
          <S7Button
            type="button"
            variant="warning"
            size="sm"
            className="anuncios-quick-cost-modal__bulk-btn vendas-page__complete-product-btn"
            onClick={() => setBulkOpen(true)}
            disabled={loading || saving}
          >
            Cadastrar custos em lote
          </S7Button>
        </div>
        <div className="anuncios-quick-cost-modal__footer-summary">
          <div className="anuncios-quick-cost-modal__product anuncios-quick-cost-modal__product--footer">
            {productImageUrl ? (
              <div className="anuncios-quick-cost-modal__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle">
                <img
                  src={productImageUrl}
                  alt=""
                  className="anuncios-quick-cost-modal__thumb s7-operational-thumb"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div
                className="anuncios-quick-cost-modal__thumb-wrap anuncios-quick-cost-modal__thumb--placeholder s7-operational-thumb-frame s7-operational-thumb-frame--circle"
                aria-hidden
              />
            )}
            <div className="anuncios-quick-cost-modal__identity-text">
              <p className="anuncios-quick-cost-modal__name" title={title}>
                {title}
              </p>
              <div
                className="s7-copy-group anuncios-quick-cost-modal__sku-row"
                role="presentation"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <span className="anuncios-ad-sku-label">SKU</span>
                <span className="anuncios-ad-sku-value">{skuText || "não informado"}</span>
                {skuText ? (
                  <S7CopyButton
                    value={skuText}
                    ariaLabel={`Copiar SKU ${skuText}`}
                    tooltipText="Copiar SKU"
                    toastLabel="SKU"
                    showToast={true}
                    iconMode="unicode"
                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                    flashKey={skuCopyFlashKey}
                    toastEventType="LISTING_SKU_COPIED"
                    toastFailEventType="LISTING_SKU_COPY_FAILED"
                    toastEntityType="product"
                    className="anuncios-quick-cost-modal__sku-copy"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <form
          ref={formRef}
          className="anuncios-quick-cost-modal__body"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <div className="anuncios-quick-cost-modal__body-row">
            <div className="anuncios-quick-cost-modal__costs-col">
              <S7Input
                label="Custo do produto"
                required
                name={PRODUCT_COST_FIELD_NAME}
                value={costPrice}
                onChange={(e) => {
                  clearSignupFieldValidityForField(formRef.current, PRODUCT_COST_FIELD_NAME);
                  setCostPrice(formatBrlTypingWithSymbol(e.target.value));
                  setFieldErrors((prev) => ({ ...prev, costPrice: false }));
                }}
                placeholder="R$ 0,00"
                disabled={loading || saving}
                error={Boolean(fieldErrors.costPrice)}
              />
              <S7Input
                label="Custo embalagem"
                name="quick-product-packaging-cost"
                value={packagingCost}
                onChange={(e) => {
                  setPackagingCost(formatBrlTypingWithSymbol(e.target.value));
                  setFieldErrors((prev) => ({ ...prev, packagingCost: false }));
                }}
                placeholder="R$ 0,00"
                disabled={loading || saving}
                error={Boolean(fieldErrors.packagingCost)}
              />
              <div className="anuncios-quick-cost-modal__field-with-tip">
                <label className="s7-input__label" htmlFor="quick-product-operational-cost">
                  <span>{PRODUCT_EXPEDITION_SUPPLIES_LABEL}</span>
                  <S7Tooltip content={PRODUCT_EXPEDITION_SUPPLIES_TOOLTIP} placement="top-start" offset={6} wrap>
                    <button
                      type="button"
                      className="anuncios-quick-cost-modal__info-btn"
                      aria-label={`Informações sobre ${PRODUCT_EXPEDITION_SUPPLIES_LABEL}`}
                    >
                      <S7Icon name="info" size={12} strokeWidth={2} />
                    </button>
                  </S7Tooltip>
                </label>
                <S7Input
                  name="quick-product-operational-cost"
                  value={operationalCost}
                  onChange={(e) => {
                    setOperationalCost(formatBrlTypingWithSymbol(e.target.value));
                    setFieldErrors((prev) => ({ ...prev, operationalCost: false }));
                  }}
                  placeholder="R$ 0,00"
                  disabled={loading || saving}
                  error={Boolean(fieldErrors.operationalCost)}
                />
              </div>
            </div>
            <div className="anuncios-quick-cost-modal__illustration" aria-hidden="true">
              <img
                src={quickProductCostsIllustration}
                alt=""
                className="anuncios-quick-cost-modal__illustration-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          {error ? <p className="anuncios-quick-cost-modal__error">{error}</p> : null}
        </form>
        <div className="anuncios-quick-cost-modal__actions">
          <button
            type="button"
            className="anuncios-quick-cost-modal__btn anuncios-quick-cost-modal__btn--primary"
            onClick={() => void handleSave()}
            disabled={loading || saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
}
