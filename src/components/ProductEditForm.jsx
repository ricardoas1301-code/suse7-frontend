// ======================================================================
// ProductEditForm — rota /produtos/:id/editar (shell fino sobre ProductEditContent)
// ======================================================================

import { useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductEditContent from "./products/ProductEditContent.jsx";
import "../pages/ProductEdit.css";

export default function ProductEditForm() {
  const { id: productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || null;

  const handleCancel = useCallback(() => {
    navigate("/produtos");
  }, [navigate]);

  if (!productId) {
    return null;
  }

  return (
    <ProductEditContent
      productId={productId}
      initialTab={initialTab}
      presentation="page"
      onCancel={handleCancel}
    />
  );
}
