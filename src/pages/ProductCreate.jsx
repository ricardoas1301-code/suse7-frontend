// ======================================================================
// PÁGINA: ProductCreate
// Objetivo:
// - Página de criação de produto (substitui o modal "apertado")
// - Reutiliza o ProductForm
// ======================================================================

import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { upsertProduct } from "../services/products/productRepository";
import "./ProductCreate.css";

export default function ProductCreate() {
  // ------------------------------------------------------
  // NAV
  // ------------------------------------------------------
  const navigate = useNavigate();

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
    return { productId: result?.productId ?? null };
  };

  return (
    <div className="product-page">
      <ProductForm
        title="Novo produto"
        mode="create"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onSuccess={() => navigate("/produtos")}
      />
    </div>
  );
}
