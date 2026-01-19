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
  const handleSubmit = ({ product, variations }) => {
    console.log("✅ CREATE | produto:", product);
    console.log("✅ CREATE | variações:", variations);

    // Futuro:
    // - chamar backend
    // - ao salvar, navegar para /produtos ou abrir edição
    // navigate("/produtos");
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
