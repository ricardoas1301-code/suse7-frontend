// ======================================================================
// ProductEditForm — edição dedicada (carrega produto + variações, navegação livre)
// Reutiliza ProductForm com navigationMode="free"; submit = upsert em modo edit.
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductForm from "./ProductForm";
import { fetchProductForEdit, upsertProduct } from "../services/products/productRepository";
import { pickProductFieldsForForm } from "../utils/productFormHydration";
import { S7Button, S7LoadingPanel } from "./ui";

export default function ProductEditForm() {
  const { id: productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [initialProduct, setInitialProduct] = useState(null);
  const [initialVariations, setInitialVariations] = useState(null);
  /** Aviso após carregar: erro em listVariants (fallback) ou produto variants sem linhas no banco */
  const [editLoadNotice, setEditLoadNotice] = useState(null);

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

  const handleCancel = useCallback(() => {
    navigate("/produtos");
  }, [navigate]);

  const handleSubmit = useCallback(
    async ({ product, mode, draftKey, variants }) => {
      const result = await upsertProduct({ product, mode, draftKey, variants });
      if (result?.error) return { error: result.error };
      return { productId: result?.productId ?? product?.id ?? null };
    },
    []
  );

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-edit-loading-card" aria-busy="true" aria-label="Carregando dados do produto">
          <S7LoadingPanel message="Carregando produto" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="product-page">
        <div className="product-loading">
          <p style={{ margin: "0 0 16px" }}>{loadError}</p>
          <S7Button type="button" variant="secondary" onClick={() => navigate("/produtos")}>
            Voltar para produtos
          </S7Button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      {editLoadNotice && (
        <div
          className={
            editLoadNotice.type === "error"
              ? "s7-alert s7-alert--error"
              : "s7-alert s7-alert--warning"
          }
          style={{ margin: "0 0 16px", maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}
          role="status"
        >
          {editLoadNotice.message}
        </div>
      )}
      <ProductForm
        title="Editar produto"
        mode="edit"
        navigationMode="free"
        initialProduct={initialProduct}
        initialVariations={initialVariations}
        initialTab={initialTab}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
