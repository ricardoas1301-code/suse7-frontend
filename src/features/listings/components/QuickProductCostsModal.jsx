import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import S7Input from "../../../components/ui/S7Input";

function formatBrlTypingWithSymbol(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return `R$ ${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBrlFromApiValue(raw) {
  if (raw == null || raw === "") return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return `R$ ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeDecimalInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [operationalCost, setOperationalCost] = useState("");
  const [resolvedSku, setResolvedSku] = useState("");
  const [skuCopied, setSkuCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    costPrice: "",
    packagingCost: "",
    operationalCost: "",
  });
  const modalRef = useRef(null);

  const title = useMemo(() => {
    const t = String(productTitle || "").trim();
    return t || "Produto sem título";
  }, [productTitle]);

  useEffect(() => {
    if (!open || !productId) return;
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

  if (!open) return null;

  const handleSave = async () => {
    if (!productId) return;
    setError("");
    setFieldErrors({ costPrice: "", packagingCost: "", operationalCost: "" });
    const productCostNorm = normalizeDecimalInput(costPrice);
    const packagingCostNorm = normalizeDecimalInput(packagingCost);
    const operationalCostNorm = normalizeDecimalInput(operationalCost);
    const nextFieldErrors = {
      costPrice: productCostNorm ? "" : "Custo do produto deve ser maior que zero",
      packagingCost: packagingCostNorm ? "" : "Custo embalagem é obrigatório",
      operationalCost: operationalCostNorm ? "" : "Custo operacional é obrigatório",
    };
    if (nextFieldErrors.costPrice || nextFieldErrors.packagingCost || nextFieldErrors.operationalCost) {
      setFieldErrors(nextFieldErrors);
      const firstMissingFieldName = !productCostNorm
        ? "quick-product-cost-price"
        : !packagingCostNorm
          ? "quick-product-packaging-cost"
          : "quick-product-operational-cost";
      const firstMissingInput = modalRef.current?.querySelector(`input[name="${firstMissingFieldName}"]`);
      firstMissingInput?.focus();
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setSaving(false);
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload = {
      cost_price: productCostNorm,
      packaging_cost: packagingCostNorm,
      operational_cost: operationalCostNorm,
    };

    const trimmedSku = String(resolvedSku || sku || "").trim();
    let updateQuery = supabase.from("products").update(payload).eq("user_id", user.id);
    if (trimmedSku) {
      updateQuery = updateQuery.eq("sku", trimmedSku);
    } else {
      updateQuery = updateQuery.eq("id", productId);
    }

    const { error: saveError } = await updateQuery;
    if (saveError) {
      setSaving(false);
      setError(saveError.message || "Não foi possível salvar os custos.");
      return;
    }

    setSaving(false);
    // Fecha imediatamente após sucesso. O recarregamento da lista roda em
    // background (não bloqueamos o fechamento, que antes travava ~10s).
    onClose();
    void onSaved?.();
  };

  const handleCopySku = async () => {
    const text = String(resolvedSku || sku || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setSkuCopied(true);
      window.setTimeout(() => setSkuCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar o SKU.");
    }
  };

  return (
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
        </div>
        <div className="anuncios-quick-cost-modal__footer-summary">
          <div className="anuncios-quick-cost-modal__product anuncios-quick-cost-modal__product--footer">
            {productImageUrl ? (
              <img src={productImageUrl} alt="" className="anuncios-quick-cost-modal__thumb" loading="lazy" decoding="async" />
            ) : (
              <div className="anuncios-quick-cost-modal__thumb anuncios-quick-cost-modal__thumb--placeholder" />
            )}
            <div className="anuncios-quick-cost-modal__identity-text">
              <p className="anuncios-quick-cost-modal__name" title={title}>
                {title}
              </p>
              <div className="anuncios-quick-cost-modal__sku-row">
                <span className="anuncios-ad-sku-label">SKU</span>
                <span className="anuncios-ad-sku-value">{String(resolvedSku || sku || "não informado")}</span>
                <button
                  type="button"
                  className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-quick-cost-modal__sku-copy${
                    skuCopied ? " products-catalog__copy-btn--ok" : ""
                  }`}
                  data-tip={skuCopied ? "Copiado!" : "Copiar SKU"}
                  onClick={handleCopySku}
                  aria-label="Copiar SKU"
                  disabled={saving}
                >
                  {skuCopied ? "✓" : "⧉"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="anuncios-quick-cost-modal__body">
          <div className="anuncios-quick-cost-modal__costs-col">
            <S7Input
              label="Custo do produto"
              required
              name="quick-product-cost-price"
              value={costPrice}
              onChange={(e) => {
                setCostPrice(formatBrlTypingWithSymbol(e.target.value));
                setFieldErrors((prev) => ({ ...prev, costPrice: "" }));
              }}
              placeholder="R$ 0,00"
              disabled={loading || saving}
              error={fieldErrors.costPrice}
            />
            <S7Input
              label="Custo embalagem"
              required
              name="quick-product-packaging-cost"
              value={packagingCost}
              onChange={(e) => {
                setPackagingCost(formatBrlTypingWithSymbol(e.target.value));
                setFieldErrors((prev) => ({ ...prev, packagingCost: "" }));
              }}
              placeholder="R$ 0,00"
              disabled={loading || saving}
              error={fieldErrors.packagingCost}
            />
            <S7Input
              label="Custo operacional"
              required
              name="quick-product-operational-cost"
              value={operationalCost}
              onChange={(e) => {
                setOperationalCost(formatBrlTypingWithSymbol(e.target.value));
                setFieldErrors((prev) => ({ ...prev, operationalCost: "" }));
              }}
              placeholder="R$ 0,00"
              disabled={loading || saving}
              error={fieldErrors.operationalCost}
            />
          </div>
          {error ? <p className="anuncios-quick-cost-modal__error">{error}</p> : null}
        </div>
        <div className="anuncios-quick-cost-modal__actions">
          <button type="button" className="anuncios-quick-cost-modal__btn anuncios-quick-cost-modal__btn--primary" onClick={handleSave} disabled={loading || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
