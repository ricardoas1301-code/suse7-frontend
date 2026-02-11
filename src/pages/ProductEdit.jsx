// ======================================================================
// PÁGINA: ProductEdit
// Objetivo:
// - Página de edição de produto
// - Reutiliza o ProductForm
// - (UI only agora) preparado para carregar do backend depois
// ======================================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import "./ProductEdit.css";

export default function ProductEdit() {
  // ------------------------------------------------------
  // PARAMS / NAV
  // ------------------------------------------------------
  const { id } = useParams();
  const navigate = useNavigate();

  // ------------------------------------------------------
  // STATE: LOAD (placeholder)
  // ------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [initialProduct, setInitialProduct] = useState(null);
  const [initialVariations, setInitialVariations] = useState(null);

  // ------------------------------------------------------
  // LOAD PRODUCT (placeholder — backend depois)
  // ------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Futuro:
        // - buscar produto no Supabase/Backend pelo id
        // - buscar variações do produto
        // - setInitialProduct(...)
        // - setInitialVariations(...)

        // Placeholder para não quebrar:
        setInitialProduct({
          id: parseInt(id, 10) || id,
          product_name: `Produto #${id}`,
        });

        setInitialVariations([
          {
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
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
  const handleSubmit = ({ product, variations }) => {
    console.log("✅ EDIT | id:", id);
    console.log("✅ EDIT | produto:", product);
    console.log("✅ EDIT | variações:", variations);

    // Futuro:
    // - chamar backend para salvar
    // navigate("/produtos");
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
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
