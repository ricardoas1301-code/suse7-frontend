// ======================================================================
// PÁGINA: ProductEdit
// Objetivo:
// - Página de edição de produto
// - Reutiliza o ProductForm
// - Para carregar do Supabase: usar listVariants(productId) para variações ordenadas por sort_order
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
  // SUBMIT (UI only por enquanto)
  // ------------------------------------------------------
  const handleSubmit = async ({ product, draftKey, variants }) => {
    console.log("✅ EDIT | id:", id);
    console.log("✅ EDIT | produto:", product);
    console.log("✅ EDIT | variações:", variants);

    // Futuro:
    // - chamar backend para salvar
    // - em modo edit não precisa retornar productId (imagens já vinculadas)
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
