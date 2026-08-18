// ======================================================================
// ProductEditContent — edição/completar produto (página ou modal)
// Carrega produto + variações; reutiliza ProductForm (navigationMode="free").
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import ProductForm from "../ProductForm";
import { fetchProductForEdit, upsertProduct } from "../../services/products/productRepository";
import { pickProductFieldsForForm } from "../../utils/productFormHydration";
import { S7Button, S7LoadingPanel } from "../ui";
import {
  ProductEditFinancialProvider,
} from "./ProductEditFinancialContext.jsx";
import ProductEditShareBar from "./ProductEditShareBar.jsx";
import "../../styles/VendasPage.css";

/**
 * @param {{
 *   productId: string;
 *   initialTab?: string | null;
 *   presentation?: "page" | "modal";
 *   onCancel?: () => void;
 *   onSaved?: (productId: string) => void;
 *   onBindCloseController?: (controller: { requestClose: () => void; isDirty: () => boolean } | null) => void;
 * }} props
 */
export default function ProductEditContent({
  productId,
  initialTab = null,
  presentation = "page",
  onCancel,
  onSaved,
  onBindCloseController,
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));
  const [initialProduct, setInitialProduct] = useState(null);
  const [initialVariations, setInitialVariations] = useState(null);
  const [editLoadNotice, setEditLoadNotice] = useState(/** @type {{ type: string; message: string } | null} */ (null));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      setInitialProduct(null);
      setInitialVariations(null);
      setEditLoadNotice(null);

      const { error, product, variants, variantsLoadError } = await fetchProductForEdit(productId);

      if (cancelled) return;

      if (error || !product) {
        setLoadError(error || "Não foi possível carregar o produto.");
        setLoading(false);
        return;
      }

      const variantList = Array.isArray(variants) ? variants : [];
      const fmt = String(product.format || "").toLowerCase();

      let notice = null;
      if (variantsLoadError) {
        notice = {
          type: "error",
          message: `Erro ao listar product_variants no Supabase (fallback): ${variantsLoadError}. Confira o console (F12) e se VITE_API_BASE_URL aponta para o backend com GET /api/products/for-edit.`,
        };
      } else if (fmt === "variants" && variantList.length === 0) {
        notice = {
          type: "warn",
          message:
            'Formato "Com variações", mas não há linhas em product_variants para este produto. Confira no Supabase (tabela product_variants, filtro product_id) ou salve de novo com a aba Variações preenchida. No console (F12) procure [fetchProductForEdit] para variantCount.',
        };
      }

      setEditLoadNotice(notice);
      setInitialProduct(pickProductFieldsForForm(product));
      setInitialVariations(variantList);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = useCallback(async ({ product, mode, draftKey, variants }) => {
    const result = await upsertProduct({ product, mode, draftKey, variants });
    if (result?.error) {
      return { error: result.error, code: result.code ?? null };
    }
    return { productId: result?.productId ?? product?.id ?? null };
  }, []);

  const handleSuccess = useCallback(
    (result) => {
      const savedId = result?.productId ?? productId;
      if (savedId) onSaved?.(String(savedId));
    },
    [onSaved, productId],
  );

  const shellClass =
    presentation === "modal"
      ? "product-edit-content product-edit-content--modal"
      : "product-page";

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="product-edit-loading-card" aria-busy="true" aria-label="Carregando dados do produto">
          <S7LoadingPanel message="Carregando produto" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={shellClass}>
        <div className="product-loading">
          <p style={{ margin: "0 0 16px" }}>{loadError}</p>
          {onCancel ? (
            <S7Button type="button" variant="secondary" onClick={onCancel}>
              Fechar
            </S7Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <ProductEditFinancialProvider productId={productId} enabled={Boolean(productId)}>
      <div className={shellClass}>
        {presentation === "modal" && initialProduct ? (
          <ProductEditShareBar
            productId={productId}
            productName={initialProduct.product_name ?? null}
            productSku={initialProduct.sku ?? null}
          />
        ) : null}
        {editLoadNotice ? (
        <div
          className={
            editLoadNotice.type === "error" ? "s7-alert s7-alert--error" : "s7-alert s7-alert--warning"
          }
          style={
            presentation === "modal"
              ? { margin: "0 0 12px" }
              : { margin: "0 0 16px", maxWidth: 960, marginLeft: "auto", marginRight: "auto" }
          }
          role="status"
        >
          {editLoadNotice.message}
        </div>
      ) : null}
      <ProductForm
        title="Editar produto"
        mode="edit"
        navigationMode="free"
        presentation={presentation}
        initialProduct={initialProduct}
        initialVariations={initialVariations}
        initialTab={initialTab ?? (presentation === "modal" ? "performance" : null)}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onBindCloseController={onBindCloseController}
      />
      </div>
    </ProductEditFinancialProvider>
  );
}
