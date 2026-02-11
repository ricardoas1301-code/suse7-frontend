// ======================================================================
// PÁGINA: ProductCreate
// Objetivo:
// - Página de criação de produto (substitui o modal "apertado")
// - Reutiliza o ProductForm
// ======================================================================

import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
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
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
  const handleSubmit = async ({ product, draftKey, variants }) => {
    console.log("✅ CREATE | produto:", product);
    console.log("✅ CREATE | variações:", variants);
    console.log("✅ CREATE | draftKey (imagens):", draftKey);

    // Futuro:
    // - chamar backend para criar produto
    // - retornar { productId: newProduct.id } para vincular imagens do draft
    // - relinkDraftToProduct é chamado automaticamente pelo ProductForm
    // navigate("/produtos");
    return { productId: null }; // placeholder: retornar productId real após salvar
  };

  return (
    <div className="product-page">
      <ProductForm
        title="Novo produto"
        mode="create"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
