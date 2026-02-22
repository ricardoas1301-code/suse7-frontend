// ======================================================================
// PÁGINA: ProductEdit
// Objetivo:
// - Página de edição de produto
// - Reutiliza o ProductForm
// - Para carregar do Supabase: usar listVariants(productId) para variações ordenadas por sort_order
// ======================================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { upsertProduct } from "../services/products/productRepository";
import "./ProductEdit.css";

export default function ProductEdit() {
  // ------------------------------------------------------
  // PARAMS / NAV
  // ------------------------------------------------------
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || null;

  // ------------------------------------------------------
  // STATE: LOAD (placeholder)
  // ------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [initialProduct, setInitialProduct] = useState(null);
  const [initialVariations, setInitialVariations] = useState(null);

  // ------------------------------------------------------
  // LOAD PRODUCT (placeholder — integrar Supabase depois)
  // Quando integrar: listVariants(id) retorna variantes ordenadas por sort_order asc
  // ------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Placeholder: id vem da URL (UUID string)
        setInitialProduct({
          id: id,
          product_name: `Produto #${id}`,
        });

        // Placeholder: dados mock. Ao integrar Supabase:
        // const variants = await listVariants(id);
        // setInitialVariations(variants);
        setInitialVariations([
          {
            id: `var-${id}`,
            variation_name: "Cor",
            attribute: "Cor",
            value: "Preto",
            sku: "",
            ean: "",
            stock: "",
            price: "",
            active: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ------------------------------------------------------
  // CANCELAR
  // ------------------------------------------------------
  const handleCancel = () => {
    navigate("/produtos");
  };

  // ------------------------------------------------------
  // SUBMIT (chama API; 409 SKU duplicado → ProductForm exibe toast)
  // ------------------------------------------------------
  const handleSubmit = async ({ product, mode, draftKey, variants }) => {
    const result = await upsertProduct({ product, mode, draftKey, variants });
    if (result?.error) return { error: result.error };
    return { productId: result?.productId ?? product?.id ?? null };
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-loading">Carregando produto...</div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <ProductForm
        title="Editar produto"
        mode="edit"
        initialProduct={initialProduct}
        initialVariations={initialVariations}
        initialTab={initialTab}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onSuccess={() => navigate("/produtos")}
      />
    </div>
  );
}
