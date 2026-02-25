// ======================================================================
// ProductAdTitlesTab — aba "Título do anúncio" do ProductForm
// Objetivo:
// - Gerenciar títulos alternativos para anúncios (até 10 por produto)
// - Salvar via backend /api/products/ad-titles (sem lógica sensível no frontend)
// - Estrutura escalável para múltiplos marketplaces (Strategy/Adapter no backend)
// UX: contador de caracteres, validações, botão "Gerar sugestões" (placeholder)
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import {
  listAdTitles,
  createAdTitle,
  updateAdTitle,
  deleteAdTitle,
} from "../services/products/adTitlesService";
import "./ProductAdTitlesTab.css";

/** Limite de caracteres do Mercado Livre para título de anúncio */
const ML_TITLE_MAX_LENGTH = 60;

/** Máximo de títulos por produto (backend) */
const MAX_TITLES = 10;

export default function ProductAdTitlesTab({ productId }) {
  const { addNotification } = useNotifications();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Carrega títulos ao montar ou quando productId muda
  const loadTitles = useCallback(async () => {
    if (!productId) {
      setTitles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { titles: data, error } = await listAdTitles(productId);
    setLoading(false);
    if (error) {
      addNotification({ type: "error", message: error });
      setTitles([]);
      return;
    }
    setTitles(Array.isArray(data) ? data : []);
  }, [productId, addNotification]);

  useEffect(() => {
    loadTitles();
  }, [loadTitles]);

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      addNotification({ type: "error", message: "Informe o título." });
      return;
    }
    if (trimmed.length > ML_TITLE_MAX_LENGTH) {
      addNotification({
        type: "error",
        message: `Título deve ter no máximo ${ML_TITLE_MAX_LENGTH} caracteres.`,
      });
      return;
    }
    if (titles.length >= MAX_TITLES) {
      addNotification({ type: "error", message: `Máximo de ${MAX_TITLES} títulos por produto.` });
      return;
    }

    setAdding(true);
    const { title, error } = await createAdTitle({ product_id: productId, title: trimmed });
    setAdding(false);

    if (error) {
      addNotification({ type: "error", message: error });
      return;
    }

    if (title) {
      setTitles((prev) => [...prev, title]);
      setNewTitle("");
      addNotification({ type: "success", message: "Título adicionado." });
    }
  };

  const handleUpdate = async (id, value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      addNotification({ type: "error", message: "Título não pode ser vazio." });
      return;
    }
    if (trimmed.length > ML_TITLE_MAX_LENGTH) {
      addNotification({
        type: "error",
        message: `Título deve ter no máximo ${ML_TITLE_MAX_LENGTH} caracteres.`,
      });
      return;
    }

    const { title, error } = await updateAdTitle({ id, title: trimmed });
    if (error) {
      addNotification({ type: "error", message: error });
      return;
    }

    if (title) {
      setTitles((prev) => prev.map((t) => (t.id === id ? title : t)));
      setEditingId(null);
      setEditValue("");
      addNotification({ type: "success", message: "Título atualizado." });
    }
  };

  const handleDelete = async (id) => {
    const { error } = await deleteAdTitle(id);
    if (error) {
      addNotification({ type: "error", message: error });
      return;
    }
    setTitles((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditValue("");
    }
    addNotification({ type: "success", message: "Título removido." });
  };

  const handleGenerateSuggestions = () => {
    // Placeholder: em breve integração com backend
    setSuggestionsLoading(true);
    setTimeout(() => {
      setSuggestionsLoading(false);
      addNotification({
        type: "info",
        message: "Gerar sugestões em breve. O backend será integrado para múltiplos marketplaces.",
      });
    }, 500);
  };

  if (!productId) {
    return (
      <div className="pf-container">
        <div className="section">
          <div className="section-header">
            <h3>Título do anúncio</h3>
            <p className="section-subtitle">
              Salve o produto primeiro para gerenciar títulos de anúncio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      <div className="section">
        <div className="section-header">
          <h3>Título do anúncio</h3>
          <p className="section-subtitle">
            Títulos alternativos para anúncios em marketplaces (ex: Mercado Livre). Até {MAX_TITLES}{" "}
            títulos por produto.
          </p>
        </div>

        {/* Botão Gerar sugestões (placeholder) */}
        <div className="s7-ad-titles-actions">
          <button
            type="button"
            className="s7-btn s7-btn--secondary"
            onClick={handleGenerateSuggestions}
            disabled={suggestionsLoading}
          >
            {suggestionsLoading ? "Gerando..." : "Gerar sugestões"}
          </button>
        </div>

        {/* Formulário: novo título */}
        <div className="s7-ad-titles-form">
          <div className="s7-ad-titles-input-wrap">
            <input
              type="text"
              className="s7-input s7-ad-titles-input"
              placeholder="Ex: Produto XYZ - Marca - Modelo - Cor"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={ML_TITLE_MAX_LENGTH + 1}
              disabled={adding || titles.length >= MAX_TITLES}
            />
            <span
              className={`s7-ad-titles-counter ${
                newTitle.length > ML_TITLE_MAX_LENGTH ? "s7-ad-titles-counter--over" : ""
              }`}
            >
              {newTitle.length}/{ML_TITLE_MAX_LENGTH}
            </span>
          </div>
          <button
            type="button"
            className="s7-btn s7-btn--primary"
            onClick={handleAdd}
            disabled={adding || !newTitle.trim() || titles.length >= MAX_TITLES}
          >
            {adding ? "Adicionando..." : "Adicionar"}
          </button>
        </div>

        {/* Lista de títulos */}
        <div className="s7-ad-titles-list">
          {loading ? (
            <p className="hint">Carregando títulos...</p>
          ) : titles.length === 0 ? (
            <p className="hint">Nenhum título cadastrado. Adicione acima.</p>
          ) : (
            <ul className="s7-ad-titles-ul">
              {titles.map((t) => (
                <li key={t.id} className="s7-ad-titles-li">
                  {editingId === t.id ? (
                    <>
                      <div className="s7-ad-titles-edit-wrap">
                        <input
                          type="text"
                          className="s7-input s7-ad-titles-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          maxLength={ML_TITLE_MAX_LENGTH + 1}
                          autoFocus
                        />
                        <span className="s7-ad-titles-counter">
                          {editValue.length}/{ML_TITLE_MAX_LENGTH}
                        </span>
                      </div>
                      <div className="s7-ad-titles-actions-inline">
                        <button
                          type="button"
                          className="s7-btn s7-btn--sm s7-btn--primary"
                          onClick={() => handleUpdate(t.id, editValue)}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="s7-btn s7-btn--sm s7-btn--secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditValue("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="s7-ad-titles-text">{t.title}</span>
                      <span className="s7-ad-titles-meta">
                        {t.title?.length ?? 0}/{ML_TITLE_MAX_LENGTH}
                      </span>
                      <div className="s7-ad-titles-actions-inline">
                        <button
                          type="button"
                          className="s7-btn s7-btn--sm s7-btn--secondary"
                          onClick={() => {
                            setEditingId(t.id);
                            setEditValue(t.title ?? "");
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="s7-btn s7-btn--sm s7-btn--danger"
                          onClick={() => handleDelete(t.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
