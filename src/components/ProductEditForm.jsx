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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      setInitialProduct(null);
      setInitialVariations(null);

      const { error, product, variants } = await fetchProductForEdit(productId);

      if (cancelled) return;

      if (error || !product) {
        setLoadError(error || "Não foi possível carregar o produto.");
        setLoading(false);
        return;
      }

      setInitialProduct(pickProductFieldsForForm(product));
      setInitialVariations(Array.isArray(variants) ? variants : []);
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
