import { useState } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";
import { S7Button } from "../../../ui";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import ItemEditCard from "./ItemEditCard";
import { criarItemVazio, metaStatusDocumentacao } from "./documentacaoVivaModel";

// Seção de um domínio (S1_1.9A.2 + S1_1.9A.8).
// Leitura: itens como cards operacionais escaneáveis.
// Edição: lista de ItemEditCard + adicionar item + Salvar/Cancelar.

/**
 * @param {{
 *   section: import("./documentacaoVivaModel").DocSection;
 *   onSave: (sectionId: string, items: import("./documentacaoVivaModel").DocItem[]) => void;
 * }} props
 */
export default function DomainSection({ section, onSave }) {
  const [editando, setEditando] = useState(false);
  const [draftItems, setDraftItems] = useState(section.items);

  const iniciarEdicao = () => {
    // Clona os itens para um rascunho isolado — só persiste ao salvar.
    setDraftItems(section.items.map((item) => ({ ...item })));
    setEditando(true);
  };

  const cancelar = () => {
    setEditando(false);
    setDraftItems(section.items);
  };

  const alterarItem = (index, patch) => {
    setDraftItems((atuais) =>
      atuais.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removerItem = (index) => {
    setDraftItems((atuais) => atuais.filter((_, i) => i !== index));
  };

  const adicionarItem = () => {
    setDraftItems((atuais) => [...atuais, criarItemVazio()]);
  };

  const salvar = () => {
    onSave(section.section_id, draftItems);
    setEditando(false);
  };

  return (
    <section className="s7-docviva-section">
      <div className="s7-docviva-section__head">
        <div>
          <h4 className="s7-docviva-section__title">{section.section_title}</h4>
          {section.section_hint ? (
            <p className="s7-docviva-section__hint">{section.section_hint}</p>
          ) : null}
        </div>
        {!editando ? (
          <S7Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={iniciarEdicao}
          >
            Editar
          </S7Button>
        ) : null}
      </div>

      {editando ? (
        <div className="s7-docviva-section__editor">
          {draftItems.length === 0 ? (
            <div className="s7-docviva-empty">Nenhum item ainda. Adicione o primeiro abaixo.</div>
          ) : (
            draftItems.map((item, index) => (
              <ItemEditCard
                key={`edit_${section.section_id}_${index}`}
                item={item}
                index={index}
                onChange={alterarItem}
                onRemove={removerItem}
              />
            ))
          )}

          <div className="s7-docviva-section__editor-actions">
            <S7Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={adicionarItem}
            >
              Adicionar item
            </S7Button>
            <div className="s7-docviva-section__editor-commit">
              <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={cancelar}>
                Cancelar
              </S7Button>
              <S7Button type="button" variant="primary" size="sm" icon={<Save size={14} />} onClick={salvar}>
                Salvar alterações
              </S7Button>
            </div>
          </div>
        </div>
      ) : section.items.length === 0 ? (
        <div className="s7-docviva-empty">
          Seção ainda não documentada. Clique em <strong>Editar</strong> para começar.
        </div>
      ) : (
        <div className="s7-docviva-section__items">
          {section.items.map((item, index) => {
            const status = metaStatusDocumentacao(item.item_status);
            return (
              <article key={`${section.section_id}_${index}`} className="s7-docviva-opcard">
                <div className="s7-docviva-opcard__head">
                  <span className="s7-docviva-opcard__title">{item.item_title}</span>
                  <DocVivaStatusBadge label={status.label} tone={status.tone} />
                </div>
                {item.item_content ? (
                  <p className="s7-docviva-opcard__content">{item.item_content}</p>
                ) : (
                  <p className="s7-docviva-opcard__content s7-docviva-opcard__content--vazio">
                    A preencher
                  </p>
                )}
                {item.item_notes ? (
                  <p className="s7-docviva-opcard__notes">{item.item_notes}</p>
                ) : null}
                <span className="s7-docviva-item__meta">Atualizado em {item.updated_at}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
