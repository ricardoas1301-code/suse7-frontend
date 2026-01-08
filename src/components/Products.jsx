// ======================================================================
// PÁGINA: Produtos
// Objetivo: Central de gerenciamento dos produtos (Suse7)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductModal from "./ProductModal";
import "./Products.css";

export default function Products() {
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [openModal, setOpenModal] = useState(false);

  // ------------------------------------------------------------
  // LOAD PRODUCTS
  // ------------------------------------------------------------
  useEffect(() => {
    const loadProducts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setProducts(data || []);
      setLoading(false);
    };

    loadProducts();
  }, []);

  // ------------------------------------------------------------
  // COPY TO CLIPBOARD
  // ------------------------------------------------------------
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="products-container">
      {/* HEADER */}
      <div className="products-header">
        <div>
          <h1>Produtos</h1>
          <p>Gerencie seus produtos e prepare-os para anúncios e precificação.</p>

          <ProductModal
  open={openModal}
  onClose={() => setOpenModal(false)}
/>

        </div>

        
<button
  className="btn-primary"
  onClick={() => setOpenModal(true)}
>
  + Novo produto
</button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : products.length === 0 ? (
        <div className="products-empty">
          <p>Você ainda não cadastrou nenhum produto.</p>
<button
  className="btn-primary"
  onClick={() => setOpenModal(true)}
>
  Cadastrar primeiro produto
</button>

        </div>
      ) : (
        <div className="products-table">
          <div className="products-row header">
            <span>Produto</span>
            <span>Estoque</span>
            <span>Anúncios</span>
            <span>Vendas</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {products.map((product) => (
            <div className="products-row" key={product.id}>
              <div className="product-info">
                <strong>{product.product_name}</strong>
                <div className="product-meta">
                  SKU: {product.sku}
                  <button
                    className="copy-btn"
                    onClick={() => copyText(product.sku)}
                    title="Copiar SKU"
                  >
                    📋
                  </button>
                </div>
              </div>

              <span>{product.stock_quantity}</span>
              <span>—</span>
              <span>—</span>

              <span className={product.active ? "status-active" : "status-inactive"}>
                {product.active ? "Ativo" : "Inativo"}
              </span>

              <span className="actions">
                👁️ ✏️
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
